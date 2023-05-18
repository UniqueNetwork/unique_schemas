import {
  AttributeSchema,
  COLLECTION_SCHEMA_NAME,
  UniqueCollectionSchemaDecoded,
  UniqueCollectionSchemaToCreate
} from "../../types";
import {getKeys} from "../../tsUtils";
import {ValidationError} from "../../types";
import {validateAttributeValueVsAttributeType} from "./collection-validators";
import {
  validateAndParseSemverString,
  validateLocalizedStringWithDefault,
  validateUrlWithHashObject,
  validateNumber,
  isPlainObject,
  validateAttributeKey,
} from "./common-validators";

const validateAttributeEnumKey = (schema: AttributeSchema, num: number, varName: string) => {
  validateNumber(num, true, varName)
  const enumKeys = getKeys(schema.enumValues || {}).map(n => parseInt(n as any as string))
  if (!enumKeys.includes(num)) {
    throw new ValidationError(`${varName} value (${num}) not found in the attribute schema enum keys: [${enumKeys.join()}]`)
  }
}
export const validateUniqueToken = <T, C extends UniqueCollectionSchemaToCreate | UniqueCollectionSchemaDecoded>(token: any, collectionSchema: C): token is T => {
  if (collectionSchema.schemaName !== COLLECTION_SCHEMA_NAME.unique) {
    throw new ValidationError(`schemaName is not "unique" (passed ${collectionSchema.schemaName})`)
  }
  if (token.hasOwnProperty('name')) {
    validateLocalizedStringWithDefault(token.name, true, 'token.name')
  }
  if (token.hasOwnProperty('description')) {
    validateLocalizedStringWithDefault(token.description, true, 'token.description')
  }

  validateUrlWithHashObject(token.image, 'token.image')

  if (token.hasOwnProperty('imagePreview')) {
    validateUrlWithHashObject(token.imagePreview, 'token.imagePreview')
  }

  if (token.hasOwnProperty('file')) {
    validateUrlWithHashObject(token.file, 'token.file')
  }

  const schemaVersion = validateAndParseSemverString(collectionSchema.schemaVersion, 'collectionSchema.schemaVersion')

  if (token.encodedAttributes && collectionSchema.attributesSchema) {
    isPlainObject(token.encodedAttributes, 'token.encodedAttributes')

    for (let key in collectionSchema.attributesSchema) {
      const schema = collectionSchema.attributesSchema[key]

      validateAttributeKey(key, 'token.encodedAttributes')
      const varName = `token.encodedAttributes.${key}`

      const attr = token.encodedAttributes[key]

      if (!token.encodedAttributes.hasOwnProperty(key)) {
        if (schema.optional) {
          continue
        } else {
          throw new ValidationError(`${varName} should be provided, it's not optional attribute`)
        }
      }

      if (schema.isArray && !Array.isArray(attr)) {
        throw new ValidationError(`${varName} is not array, while schema requires an array`)
      }
      if (!schema.isArray && Array.isArray(attr)) {
        throw new ValidationError(`${varName} is an array, while schema requires to be not an array`)
      }

      const attrs = schema.isArray ? attr : [attr]

      if (schema.enumValues) {
        attrs.forEach((num: any, index: number) => {
          validateAttributeEnumKey(schema, num, `${varName}[${index}]`)
        })
      } else {
        attrs.forEach((attrElem: any, index: number) => {
          validateAttributeValueVsAttributeType(attrElem, schema.type, `${varName}[${index}]`)
        })
      }
    }
  }

  if (collectionSchema.hasOwnProperty('video') && token.hasOwnProperty('video')) {
    validateUrlWithHashObject(token.video, 'token.video')
  }

  if (collectionSchema.hasOwnProperty('audio') && token.hasOwnProperty('audio')) {
    validateUrlWithHashObject(token.audio, 'token.audio')
  }

  if (collectionSchema.hasOwnProperty('spatialObject') && token.hasOwnProperty('spatialObject')) {
    validateUrlWithHashObject(token.spatialObject, 'token.spatialObject')
  }

  return true
}
