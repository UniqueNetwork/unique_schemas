import {DecodeCollectionParams, ProbablyDecodedProperty} from '../types'
import {IV2Collection} from '../schemaV2.zod'
import {buildDictionaryFromPropertiesArray} from '../utils'
import {detectUniqueVersions} from './tokenDecoding'
import {decodeHexAndParseJSONOrReturnNull} from '../../tsUtils'
import {Address} from '@unique-nft/utils'
import {decodeUniqueCollectionFromProperties} from '../../tools/collection'
import {decodeOldSchemaCollection} from '../../tools/oldSchemaDecoder'

export const decodeCollection = async (options: DecodeCollectionParams): Promise<IV2Collection> => {
  const properties = buildDictionaryFromPropertiesArray(options.collectionProperties)

  const {
    isUniqueV0,
    isUniqueV1,
    isUniqueV2
  } = detectUniqueVersions(properties, properties) //twice because there is no any token info now

  if (isUniqueV2) {
    const collectionInfo = decodeHexAndParseJSONOrReturnNull(properties.collectionInfo?.valueHex)
    return {
      ...collectionInfo,
    } as IV2Collection
  }

  const collectionId = typeof options.collectionId === 'string'
    ? Address.collection.addressToId(options.collectionId)
    : options.collectionId

  const collectionSchemaResult = isUniqueV0
    ? await decodeOldSchemaCollection(collectionId, options.collectionProperties, options.decodingImageLinkOptions)
    : await decodeUniqueCollectionFromProperties(collectionId, options.collectionProperties)

  const collectionSchema = collectionSchemaResult.result
  if (!collectionSchema) {
    throw collectionSchemaResult.error
  }

  const collectionData: IV2Collection = {
    schemaName: 'unique',
    schemaVersion: collectionSchema.schemaVersion,
    originalSchemaVersion: isUniqueV1 ? collectionSchema.schemaVersion : '0.0.1',

    name: options.collectionName as string, //todo: parse UTF16
    description: options.collectionDescription as string, //todo: parse UTF16
    symbol: options.collectionSymbol as string, //todo: parse UTF16
    tokenPrefix: options.collectionSymbol as string, //todo: parse UTF16
  }

  if (collectionSchema.coverPicture.fullUrl) {
    collectionData.cover_image = {
      url: collectionSchema.coverPicture.fullUrl
    }
    if (options.tryRequestForMediaDetails) {
      //todo: request for media details for cover image
    }
  }

  return collectionData
}
