import {IV2Media, IV2Royalty, IV2Token} from '../schema.zod'
import {Semver} from '../tools/semver'
import {COLLECTION_SCHEMA_FAMILY, DecodeTokenOptions, ProbablyDecodedProperty, ProbablyDecodedPropsDict} from '../types'
import {
  buildDictionaryFromPropertiesArray,
  getTokenURI,
  mergeRoyalties,
  safeJSONParseWithPossibleEmptyInput
} from '../utils'
import {Royalties} from '@unique-nft/utils/royalties'
import {
  decodeV0OrV1CollectionSchemaToIntermediate,
  decodeV0OrV1TokenToIntermediate
} from '../tools/old_to_intermediate'
import {UniqueCollectionSchemaIntermediate} from '../tools/old_to_intermediate/intermediate_types'

export const detectCollectionSchemaFamily = (
  tokenPropsDict: ProbablyDecodedPropsDict,
  collectionPropsDict: ProbablyDecodedPropsDict,
  schemaV1?: UniqueCollectionSchemaIntermediate
): {schemaFamily: COLLECTION_SCHEMA_FAMILY, tokenURI: string | null} => {
  if (
    schemaV1?.schemaFamily &&
    [COLLECTION_SCHEMA_FAMILY.V0, COLLECTION_SCHEMA_FAMILY.V1].includes(schemaV1?.schemaFamily as COLLECTION_SCHEMA_FAMILY)
  ) {
    return {schemaFamily: schemaV1.schemaFamily as COLLECTION_SCHEMA_FAMILY, tokenURI: null}
  }

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

  const tokenURI = getTokenURI(tokenPropsDict, collectionPropsDict)

  const isUniqueV2 = uniqueVersion.major === 2

  const isOtherErc721 = !!tokenURI && !isUniqueV2

  const schemaFamily = isUniqueV2
    ? COLLECTION_SCHEMA_FAMILY.V2
    : uniqueVersion.major === 1
      ? COLLECTION_SCHEMA_FAMILY.V1
      : '_old_schemaVersion' in collectionPropsDict
        ? COLLECTION_SCHEMA_FAMILY.V0
        : isOtherErc721
          ? COLLECTION_SCHEMA_FAMILY.OTHER_ERC721
          : COLLECTION_SCHEMA_FAMILY.UNKNOWN

  return {
    schemaFamily,
    tokenURI
  }
}

export const decodeTokenToV2 = async (
  tokenProperties: ProbablyDecodedProperty[],
  options?: DecodeTokenOptions
): Promise<IV2Token> => {
  const tokenPropsDict = buildDictionaryFromPropertiesArray(tokenProperties)
  const collectionPropsDict = buildDictionaryFromPropertiesArray(options?.collectionProperties)

  const {
    schemaFamily,
    tokenURI
  } = detectCollectionSchemaFamily(tokenPropsDict, collectionPropsDict, options?.collectionDecodedSchemaV1)


  if ([COLLECTION_SCHEMA_FAMILY.V2, COLLECTION_SCHEMA_FAMILY.OTHER_ERC721].includes(schemaFamily)) {
    return await decodeTokenUniqueV2(tokenPropsDict, collectionPropsDict, tokenURI, options)
  }

  if ([COLLECTION_SCHEMA_FAMILY.V0, COLLECTION_SCHEMA_FAMILY.V1].includes(schemaFamily)) {
    return await decodeTokenUniqueV0OrV1(
      tokenProperties,
      schemaFamily,
      options,
    )
  }

  throw new Error('Unknown token schema version - not Unique v2, v1 or v0 and not ERC721Metadata-compatible')
}


const decodeTokenUniqueV0OrV1 = async (
  tokenProperties: ProbablyDecodedProperty[],
  schemaFamily: COLLECTION_SCHEMA_FAMILY,
  options?: DecodeTokenOptions,
) => {
  const collectionProperties = options?.collectionProperties

  let collectionSchema = options?.collectionDecodedSchemaV1
  if (!collectionSchema) {
    if (!Array.isArray(collectionProperties)) {
      throw new Error('Collection properties are required for decoding tokens in Unique schema for versions less than v2 and no pre-decoded schema have been provided')
    }

    const collectionDecodedSchemaV1 = options?.collectionDecodedSchemaV1

    collectionSchema = collectionDecodedSchemaV1
      ? collectionDecodedSchemaV1
      : decodeV0OrV1CollectionSchemaToIntermediate(
        collectionProperties,
        schemaFamily
      )
  }

  const tokenIntermediateRepresentation = decodeV0OrV1TokenToIntermediate(
    tokenProperties,
    collectionSchema,
    options,
  )

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

  const tokenRoyaltyEncoded = tokenProperties.find(prop => prop.key === 'royalties')?.valueHex
  const tokenRoyalties: IV2Royalty[] = tokenRoyaltyEncoded ? Royalties.uniqueV2.decode(tokenRoyaltyEncoded) : []

  const collectionRoyaltiesEncoded = collectionProperties?.find(prop => prop.key === 'royalties')?.valueHex
  const collectionRoyalties =
  collectionSchema.royalties
    ? collectionSchema.royalties
    : collectionRoyaltiesEncoded
      ? Royalties.uniqueV2.decode(collectionRoyaltiesEncoded)
      : []

  const royalties = mergeRoyalties(collectionRoyalties, tokenRoyalties)

  const isUniqueV0 = schemaFamily === COLLECTION_SCHEMA_FAMILY.V0

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

const decodeTokenUniqueV2 = async (tokenProperties: ProbablyDecodedPropsDict, collectionProps: ProbablyDecodedPropsDict | null, tokenURI: string | null, options?: DecodeTokenOptions): Promise<IV2Token> => {
  // for not UniqueV2 will be probably empty
  // if somebody will use this property for not UniqueV2 data - ¯\_(ツ)_/¯
  let tokenDataString = tokenProperties.tokenData?.value || null

  if (!tokenDataString && options?.tryRequestForTokenURI && tokenURI) {
    tokenDataString = await fetch(tokenURI).then(r => r.text())
  }

  const tokenData = safeJSONParseWithPossibleEmptyInput(tokenDataString)

  if (typeof tokenData === 'string' || tokenData === null) {
    throw new Error('Unable to parse tokenData JSON')
  }

  //todo: parse royalties and patch tokenData
  const tokenRoyaltiesHexString = tokenProperties.royalties?.valueHex
  const collectionRoyaltiesHexString = collectionProps?.royalties?.valueHex

  //todo: parse overrides and patch tokenData
  //todo: parse customizing_overrides and patch tokenData
  return tokenData as IV2Token
}
