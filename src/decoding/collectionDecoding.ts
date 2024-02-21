import {COLLECTION_SCHEMA_FAMILY, DecodeCollectionOptions, ProbablyDecodedProperty} from '../types'
import {IV2Collection, IV2PotentialAttributeValues} from '../schema.zod'
import {buildDictionaryFromPropertiesArray, decodeHexAndParseJSONOrReturnNull} from '../utils'
import {detectCollectionSchemaFamily} from './tokenDecoding'
import {decodeV0OrV1CollectionSchemaToIntermediate} from '../tools/old_to_intermediate'

export const decodeCollectionToV2 = async (collectionProperties: ProbablyDecodedProperty[], options?: DecodeCollectionOptions): Promise<IV2Collection> => {
  const properties = buildDictionaryFromPropertiesArray(collectionProperties)

  const {schemaFamily} = detectCollectionSchemaFamily(properties, properties) //twice because there is no any token info now

  const isUniqueV2 = schemaFamily === COLLECTION_SCHEMA_FAMILY.V2
  const isUniqueV0 = schemaFamily === COLLECTION_SCHEMA_FAMILY.V0

  if (isUniqueV2) {
    const collectionInfo = decodeHexAndParseJSONOrReturnNull(properties.collectionInfo?.valueHex)
    return {
      ...collectionInfo,
    } as IV2Collection
  }

  // const collectionId = typeof options.collectionId === 'string'
  //   ? Address.collection.addressToId(options.collectionId)
  //   : options.collectionId

  const collectionSchema = decodeV0OrV1CollectionSchemaToIntermediate(
    collectionProperties,
    schemaFamily,
  )

  const collectionData: IV2Collection = {
    schemaName: 'unique',
    schemaVersion: !isUniqueV2 ? '2.0.0' : (collectionSchema.schemaVersion || '2.0.0'),
    originalSchemaVersion: isUniqueV0 ? '0.0.1' : (collectionSchema.schemaVersion || '1.0.0'),

    // name: options.collectionName as string, //todo: parse UTF16
    // description: options.collectionDescription as string, //todo: parse UTF16
    // symbol: options.collectionSymbol as string, //todo: parse UTF16
    // tokenPrefix: options.collectionSymbol as string, //todo: parse UTF16
  }

  if (collectionSchema.attributesSchema) {
    collectionData.potential_attributes = Object.values(collectionSchema.attributesSchema)
      .map(oldAttribute => {
        const newAttribute: IV2PotentialAttributeValues[number] = {
          trait_type: oldAttribute.name._,
          display_type: oldAttribute.type,
        }
        if (oldAttribute.enumValues) {
          newAttribute.values = Object.values(oldAttribute.enumValues).map(enumValue => enumValue._)
        }
        return newAttribute
      })
  }

  if (collectionSchema.coverPicture.fullUrl) {
    collectionData.cover_image = {
      url: collectionSchema.coverPicture.fullUrl
    }
    if (options?.tryRequestForMediaDetails) {
      //todo: request for media details for cover image
    }
  }

  return collectionData
}
