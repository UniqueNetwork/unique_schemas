import {AttributeSchemaInCollection, Property, UniqueCollectionSchemaV2} from '../types'
import {decodeUniqueCollectionFromProperties} from '../../tools/collection'
import {decodeTokenUrlOrInfixOrCidWithHashField, DecodingResult} from '../../schemaUtils'

export const decodeV1Schema = async (collectionId: number, properties: Property[]): Promise<DecodingResult<UniqueCollectionSchemaV2>> => {
  const v1Boxed = await decodeUniqueCollectionFromProperties(collectionId, properties)
  if (v1Boxed.error) {
    return {
      result: null,
      error: v1Boxed.error,
    }
  }
  const v1 = v1Boxed.result

  const coverUrl = decodeTokenUrlOrInfixOrCidWithHashField(v1.coverPicture, v1.image).fullUrl || ''

  let attributes: UniqueCollectionSchemaV2['attributes'] | null = null

  if (v1.attributesSchema) {
    attributes = {schema: {}}
    for (const strKey of Object.keys(v1.attributesSchema)) {
      const key = typeof strKey === 'number' ? strKey : parseInt(strKey, 10)
      const v1Attr = v1.attributesSchema[key]
      const v2Attr: AttributeSchemaInCollection = {
        type: v1Attr.type,
        title: v1Attr.name,
        order: key,
        single: !v1Attr.isArray,
        optional: !!v1Attr.optional,
      }

      if (v1Attr.enumValues) {
        const enumValues = v1Attr.enumValues
      }
    }
  }

  const v2: UniqueCollectionSchemaV2 = {
    schemaName: 'unique',
    schemaVersion: '2.0.0',
    baseUrl: v1.image.urlTemplate.replace('{infix}', ''),
    defaultLocale: 'en',
    cover: {
      url: coverUrl,
    },
  }
}
