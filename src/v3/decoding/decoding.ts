import {Utf8} from '@unique-nft/utils/string'
import {IV2Collection, IV2Token} from '../schemaV2.zod'
import {Semver} from '../../semver'
import {DecodeTokenParams, ProbablyDecodedPropsDict, ProbablyDecodedProperty} from '../types'
import {getTokenURI, buildDictionaryFromPropertiesArray, safeJSONParseWithPossibleEmptyInput} from '../utils'
import {universallyDecodeCollectionSchema} from '../../tools/universal'
import {Address} from '@unique-nft/utils'


export const decodeCollection = async (collectionId: string | number, collectionProperties: ProbablyDecodedProperty[]): Promise<IV2Collection> => {
  const properties = buildDictionaryFromPropertiesArray(collectionProperties)

}

export const decodeToken = async (options: DecodeTokenParams): Promise<IV2Token> => {
  const tokenPropsDict = buildDictionaryFromPropertiesArray(options.tokenProperties)
  const collectionPropsDict = buildDictionaryFromPropertiesArray(options.collectionProperties)

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
  const isUniqueV1 = uniqueVersion.major === 1
  const isUniqueV0 = '_old_schemaVersion' in collectionPropsDict

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

  const collectionId = typeof options.collectionId === 'number' ? options.collectionId : Address.collection.addressToId(options.collectionId)
  const collectionSchema = await universallyDecodeCollectionSchema(
    collectionId,
    (options.collectionProperties as Array<{ key: string, value: string }>) || [],
  )

  if (isUniqueV0) {
    const schemaVersion = collectionPropsDict._old_schemaVersion?.value
    const offchainSchema = collectionPropsDict._old_offchainSchema?.value
    const constOnChainSchema = collectionPropsDict._old_constOnChainSchema?.value
    const variableOnChainSchema = collectionPropsDict._old_variableOnChainSchema?.value

  }
}


export const decodeTokenUniqueV2 = async (props: ProbablyDecodedPropsDict, collectionProps: ProbablyDecodedPropsDict | null, tokenURI: string | null, options: DecodeTokenParams): Promise<IV2Token> => {
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
