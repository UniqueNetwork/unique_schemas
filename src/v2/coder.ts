import {
  Property,
  TokenPropertyPermission,
  TokenPropertyPermissionValue,
  UniqueCollectionSchemaV2ToEncode,
  UniqueCollectionSchemaV2InCollection,
  UniqueCollectionSchemaV2Decoded,
  UniqueTokenV2ToEncode,
  UniqueTokenV2Decoded
} from './types'
import {
  validateUniqueCollectionSchemaV2Decoded,
  validateUniqueCollectionSchemaV2ToEncode,
  validateUniqueTokenV2ToEncode
} from './types.validator'
import {Semver} from '../semver'
import {ValidationError} from '../types'
import {getKeys} from '../tsUtils'
import {PERMISSION} from './constants'

export const PROPERTY_KEY_REGEX = /^[a-zA-Z0-9.-]+$/

const throwValidationError= (message: string, path: string) => {
  const error = new Error(`Invalid UniqueCollectionSchemaV2: ${message}, path: ${path}`)
  error.name = `ValidationError`
  throw error
}

const validateCollectionSchemaV2 = (schema: UniqueCollectionSchemaV2ToEncode) => {
  validateUniqueCollectionSchemaV2ToEncode(schema)

  if (schema.schemaName !== 'unique') {
    throwValidationError(`Schema name should be 'unique', got ${schema.schemaName}`, 'schemaName')
  }
  if (Semver.isValid(schema.schemaVersion)) {
    throwValidationError(`Schema version is not valid, got ${schema.schemaVersion}`, 'schemaVersion')
  }
  const schemaVersion = Semver.fromString(schema.schemaVersion)
  if (!schemaVersion.isEqual('2.0.0')) {
    throwValidationError(`Schema version should be '2.0.0', got ${schema.schemaVersion}`, 'schemaVersion')
  }

  if (schema.attributes) {
    if (schema.attributes.combineAllAttributesToOneProperty && schema.attributes.attributesToCombineToOneProperty) {
      throwValidationError(`attributes cannot contain keys 'combineAllAttributesToOneProperty' and 'attributesToCombineToOneProperty' simultaneously`, 'schema.attributes.attributesToCombineToOneProperty')
    }
    if (schema.attributes.attributesToCombineToOneProperty) {
      for (const attrToCombine of schema.attributes.attributesToCombineToOneProperty) {

      }
    }

    if (!schema.attributes.combineAllAttributesToOneProperty) {
      const keys = Object.keys(schema.attributes.schema)
      for (const key of keys) {
        if (!key.match(PROPERTY_KEY_REGEX)) {
          throwValidationError(`Attribute key should contain only valid for property key symbols, got ${key}`, `attributes.schema['${key}']`)
        }
      }
    }
  }

  return true
}

const MEDIA_TYPES = <const>['images', 'videos', 'audios', 'volumes', 'files']

export const encodeCollectionSchema = (schema: UniqueCollectionSchemaV2ToEncode, defaultPermission: TokenPropertyPermissionValue = PERMISSION.WRITABLE_ONCE_FOR_COLLECTION_ADMIN) => {
  validateCollectionSchemaV2(schema)

  ////////////////////////////////////////////////////////////////
  // add basic TokenPropertyPermissions (TPPs)
  ////////////////////////////////////////////////////////////////

  const permission = schema.defaultPermission || defaultPermission

  const TPPs: TokenPropertyPermission[] = [
    {key: 'common', permission}
  ]

  ////////////////////////////////////////////////
  // add TPPs for media: images, videos, etc...
  ////////////////////////////////////////////////

  if (schema.combineAllMediaInOneProperty) {
    TPPs.push({key: 'media', permission})
  } else {
    for (const key of MEDIA_TYPES) {
      TPPs.push({key, permission: schema.media[key]?.defaultPermission || permission})
    }
  }

  ////////////////////////////////////////////////
  // add TPPs for attributes schema
  ////////////////////////////////////////////////

  if (schema.attributes) {
    if (schema.attributes.combineAllAttributesToOneProperty) {
      TPPs.push({key: 'attributes', permission: schema.attributes.defaultPermission || permission})
    } else {
      const keys = Object.keys(schema.attributes.schema)
      for (const key of keys) {
        TPPs.push({key: `attr.${key}`, permission: schema.attributes.defaultPermission || permission})
      }
    }
  }

  /////////////////////////////////////////////////////////////////////
  // clone schema and remove all information about defaultPermission
  /////////////////////////////////////////////////////////////////////

  const schemaToWrite = JSON.parse(JSON.stringify(schema)) as UniqueCollectionSchemaV2ToEncode
  delete schemaToWrite.defaultPermission
  if (schemaToWrite.media.images?.hasOwnProperty('defaultPermission')) {
    delete schemaToWrite.media.images.defaultPermission
  }
  for (const key of MEDIA_TYPES) {
    if (schemaToWrite.media[key]?.hasOwnProperty('defaultPermission')) {
      delete schemaToWrite.media[key]?.defaultPermission
    }
  }
  if (schemaToWrite.attributes) {
    delete schemaToWrite.attributes.defaultPermission
    for (const key in schemaToWrite.attributes.schema) {
      delete schemaToWrite.attributes.schema[key].defaultPermission
    }
  }

  ////////////////////////////////////////////////////////////////
  // write collection properties
  ////////////////////////////////////////////////////////////////

  const properties: Property[] = [
    {key: 'schemaName', value: schema.schemaName},
    {key: 'schemaVersion', value: schema.schemaVersion},
    {key: 'schema', value: JSON.stringify(schemaToWrite)}
  ]

  return {
    properties,
    tokenPropertyPermissions: TPPs,
  }
}

const validateTokenV2 = (schema: UniqueCollectionSchemaV2ToEncode, token: UniqueTokenV2ToEncode) => {
  validateUniqueTokenV2ToEncode(token)

  if (schema.attributes && token.attributes) {
    const schemaAttrSchemas = Object.entries(schema.attributes.schema)
    const tokenAttrs = Object.entries(token.attributes)

    const lostAttribute = schemaAttrSchemas.find(([key, attrSchema]) => {
      return !attrSchema.optional && !token.attributes!.hasOwnProperty(key)
    })
    if (lostAttribute) {
      throwValidationError(`Attribute ${lostAttribute[0]} not found in the token while it declared as required in the attribute schema in collection schema`, `attributes`)
    }

    // to check that for all schemas with enumValues there are enumKeys, not values
    tokenAttrs.find(([key, tokenAttr]) => {
      return (Number(!!schema.attributes!.schema[key].enumValues) ^ Number(!!tokenAttr.enumKeys))
    })
  } else {
    if (Number(!!schema.attributes) ^ Number(!!token.attributes)) {
      throwValidationError(`Token should contain field 'attributes' when the collection does`, `attributes`)
    }
  }

  return true
}

const encodeTokenV2 = (schema: UniqueCollectionSchemaV2ToEncode | UniqueCollectionSchemaV2Decoded, token: UniqueTokenV2ToEncode) => {
  validateTokenV2(schema, token)
  const properties: Property[] = []

  if (token.common) {
    properties.push({key: 'common', value: JSON.stringify(token.common)})
  }

  if (schema.combineAllMediaInOneProperty) {
    properties.push({key: 'media', value: JSON.stringify(token.media)})
  } else {
    const keys = getKeys(schema.media)
    for (const key of keys) {
      properties.push({key, value: JSON.stringify(schema.media[key])})
    }
  }

  if (schema.attributes && token.attributes) {

  }

  return properties
}

const propertiesToObject = <T = any>(properties: Property[]) => {
  const obj = {} as any
  for (const property of properties) {
    obj[property.key] = property.value
  }
  return obj as T
}
const decodeTokenV2 = (schema: UniqueCollectionSchemaV2ToEncode | UniqueCollectionSchemaV2Decoded | UniqueCollectionSchemaV2InCollection, tokenPropertyPermissions: TokenPropertyPermission[], tokenProperties: Property[]) => {
  const propsByKey = propertiesToObject(tokenProperties)

  const token = {} as UniqueTokenV2Decoded

  if (propsByKey.common) {
    token.common = JSON.parse(propsByKey.common)
  }
  if (propsByKey.media) {
    token.media = JSON.parse(propsByKey.media)
  } else {
    const rawImagesData = JSON.parse(propsByKey.images) as UniqueTokenV2ToEncode['media']['images']
    token.media = {
      // images:
    }

    for (const key of <const>['images', 'videos', 'audios', 'volumes', 'files']) {
      if (propsByKey[key]) {
        token.media[key] = JSON.parse(propsByKey[key])
      }
    }
  }
}
