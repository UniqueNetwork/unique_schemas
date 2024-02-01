import {IV2Collection, IV2Media, IV2Royalty, IV2Token} from '../schemaV2.zod'
import {Semver} from '../../semver'
import {DecodeTokenParams, ProbablyDecodedProperty, ProbablyDecodedPropsDict} from '../types'
import {buildDictionaryFromPropertiesArray, getTokenURI, safeJSONParseWithPossibleEmptyInput} from '../utils'
import {Address} from '@unique-nft/utils'
import * as oldSchema from '../../tools/oldSchemaDecoder'
import * as collection from '../../tools/collection'
import * as token from '../../tools/token'
import {decodeRoyalty, RoyaltyType} from '../../tools/royalties'
import {UniqueCollectionSchemaDecoded} from '../../types'

export const detectUniqueVersions = (tokenPropsDict: ProbablyDecodedPropsDict, collectionPropsDict: ProbablyDecodedPropsDict) => {
  const isUniqueSchema = tokenPropsDict.schemaName?.value === 'unique' ||
    collectionPropsDict.schemaName?.value === 'unique' ||
    collectionPropsDict.schemaName?.value === '"unique"'

  let uniqueVersionString = isUniqueSchema
    ? (tokenPropsDict.schemaVersion?.value || collectionPropsDict.schemaVersion?.value)
    : null

  if (uniqueVersionString && uniqueVersionString.startsWith('"')) {
    uniqueVersionString = uniqueVersionString.slice(1, -1)
  }
  const uniqueVersion = Semver.fromString(uniqueVersionString || '0.0.0')

  const isUniqueV2 = uniqueVersion.major === 2
  const isUniqueV1 = uniqueVersion.major === 1
  const isUniqueV0 = '_old_schemaVersion' in collectionPropsDict
  return {isUniqueV2, isUniqueV1, isUniqueV0}
}

export const decodeTokenToV2 = async (options: DecodeTokenParams): Promise<IV2Token> => {
  const tokenPropsDict = buildDictionaryFromPropertiesArray(options.tokenProperties)
  const collectionPropsDict = buildDictionaryFromPropertiesArray(options.collectionProperties)

  const {
    isUniqueV0,
    isUniqueV1,
    isUniqueV2
  } = detectUniqueVersions(tokenPropsDict, collectionPropsDict)

  const tokenURI = getTokenURI(tokenPropsDict, collectionPropsDict)

  const isOtherErc721 = !!tokenURI && !isUniqueV2

  if (isUniqueV2 || isOtherErc721) {
    return await decodeTokenUniqueV2(tokenPropsDict, collectionPropsDict, tokenURI, options)
  }

  if (!collectionPropsDict) {
    throw new Error('Collection properties are required for decoding tokens in Unique schema for versions less than v2')
  }

  if (!isUniqueV1 && !isUniqueV0) {
    throw new Error('Unknown token schema version - not Unique v2, v1 or v0 and not ERC721Metadata-compatible')
  }

  return await decodeTokenUniqueV0OrV1(options, isUniqueV0, tokenPropsDict, collectionPropsDict)
}


const decodeTokenUniqueV0OrV1 = async (options: DecodeTokenParams, isUniqueV0: boolean, tokenPropsDict: ProbablyDecodedPropsDict, collectionPropsDict: ProbablyDecodedPropsDict, collectionV1DecodedSchema?: UniqueCollectionSchemaDecoded) => {
  if (!options.collectionProperties) {
    throw new Error('Collection properties are required for decoding tokens in Unique schema for versions less than v2')
  }

  const collectionId = typeof options.collectionId === 'number' ? options.collectionId : Address.collection.addressToId(options.collectionId)
  const collectionSchema = collectionV1DecodedSchema ? collectionV1DecodedSchema : isUniqueV0
    ? oldSchema.decodeOldSchemaCollection(collectionId, options.collectionProperties, options.decodingImageLinkOptions)
    : collection.decodeUniqueCollectionFromProperties(collectionId, options.collectionProperties)


  const tokenIntermediateRepresentation = isUniqueV0
    ? oldSchema.decodeOldSchemaToken(collectionId, options.tokenId, options.tokenOwner, options.tokenProperties, collectionSchema, options.decodingImageLinkOptions)
    : token.decodeTokenFromProperties(collectionId, options.tokenId, options.tokenOwner, options.tokenProperties, collectionSchema)

  const attributesArray = Object.values(tokenIntermediateRepresentation.attributes)
  const tokenName = tokenIntermediateRepresentation.name?._ ??
    (attributesArray.find(attribute => attribute.name._ === 'name')?.value as any)?._ as string ?? null
  const tokenDescription = tokenIntermediateRepresentation.description?._ ??
    (attributesArray.find(attribute => attribute.name._ === 'description')?.value as any)?._ as string ?? null

  // fill attributes in v2 style (erc721)
  const attributesInV2Style: Array<{ trait_type: string, value: string | number }> = []
  attributesArray.forEach(attribute => {
    const trait_type = attribute.name._
    if (attribute.isArray && Array.isArray(attribute.value)) {
      attribute.value.forEach(value => {
        attributesInV2Style.push({trait_type, value: value._,})
      })
    } else {
      const value = (attribute.value as any)?._
      if (['string', 'number'].includes(typeof value)) {
        attributesInV2Style.push({trait_type: attribute.name._, value,})
      }
    }
  })

  //todo: retrieve media details if requested in options.tryRequestForMediaDetails
  const media: Record<string, IV2Media> = {}
  if (tokenIntermediateRepresentation.video && tokenIntermediateRepresentation.video.fullUrl)
    media.video = {type: 'video', url: tokenIntermediateRepresentation.video.fullUrl}
  if (tokenIntermediateRepresentation.audio && tokenIntermediateRepresentation.audio.fullUrl)
    media.audio = {type: 'audio', url: tokenIntermediateRepresentation.audio.fullUrl}
  if (tokenIntermediateRepresentation.spatialObject && tokenIntermediateRepresentation.spatialObject.fullUrl)
    media.spatial = {type: 'spatial', url: tokenIntermediateRepresentation.spatialObject.fullUrl}
  if (tokenIntermediateRepresentation.file && tokenIntermediateRepresentation.file.fullUrl)
    media.file = {type: 'document', url: tokenIntermediateRepresentation.file.fullUrl}


  const royalties: Array<IV2Royalty> = []
  if (tokenPropsDict.royalties?.valueHex || collectionPropsDict.royalties?.valueHex) {
    const royaltiesHexString = tokenPropsDict.royalties?.valueHex || collectionPropsDict.royalties?.valueHex
    const royaltiesResult = royaltiesHexString ? decodeRoyalty(royaltiesHexString) : []
    for (const royalty of royaltiesResult) {
      const royaltyInShortForm: IV2Royalty = {
        address: royalty.address,
        // core idea: given value   2500 with decimals 4, we want to get 2.5
        //                     or 650000 with decimals 6, we want to get 6.5
        percent: Number(royalty.value) / (Math.pow(10, royalty.decimals - 1)), //todo: check math
      }
      if (royalty.royaltyType === RoyaltyType.PRIMARY_ONLY) {
        royaltyInShortForm.isPrimaryOnly = true
      }
      royalties.push(royaltyInShortForm)
    }
  }

  // convert token from intermediate representation to v2 one
  const tokenV2: IV2Token = {
    schemaName: 'unique',
    schemaVersion: '2.0.0',
    originalSchemaVersion: isUniqueV0 ? '0.0.1' : (collectionSchema.schemaVersion || '1.0.0'),
  }
  if (tokenIntermediateRepresentation.image && tokenIntermediateRepresentation.image.fullUrl) {
    //todo: retrieve media details if requested in options.tryRequestForMediaDetails
    tokenV2.image = tokenIntermediateRepresentation.image.fullUrl
  }

  if (tokenName) tokenV2.name = tokenName
  if (tokenDescription) tokenV2.description = tokenDescription
  if (attributesInV2Style.length > 0) tokenV2.attributes = attributesInV2Style
  if (Object.keys(media).length > 0) tokenV2.media = media
  if (royalties.length > 0) tokenV2.royalties = royalties

  return tokenV2
}

const decodeTokenUniqueV2 = async (props: ProbablyDecodedPropsDict, collectionProps: ProbablyDecodedPropsDict | null, tokenURI: string | null, options: DecodeTokenParams): Promise<IV2Token> => {
  // for not UniqueV2 will be probably empty
  // if somebody will use this property for not UniqueV2 data - ¯\_(ツ)_/¯
  let tokenDataString = props.tokenData?.value || null

  if (!tokenDataString && options.tryRequestForTokenURI && tokenURI) {
    tokenDataString = await fetch(tokenURI).then(r => r.text())
  }

  const tokenData = safeJSONParseWithPossibleEmptyInput(tokenDataString)

  if (typeof tokenData === 'string' || tokenData === null) {
    throw new Error('Unable to parse tokenData JSON')
  }

  //todo: parse royalties and patch tokenData
  const tokenRoyaltiesHexString = props.royalties?.valueHex
  const collectionRoyaltiesHexString = collectionProps?.royalties?.valueHex

  //todo: parse overrides and patch tokenData
  //todo: parse customizing_overrides and patch tokenData
  return tokenData as IV2Token
}
