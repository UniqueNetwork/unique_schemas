import {COLLECTION_SCHEMA_NAME, UniqueCollectionSchemaDecoded, UniqueCollectionSchemaToCreate} from '../types'
import {converters2Layers, decodeTokenUrlOrInfixOrCidWithHashField, DecodingResult} from '../schemaUtils'
import {getKeys} from '../tsUtils'
import {validateCollectionTokenPropertyPermissions, validateUniqueCollectionSchema} from './validators'
import {PropertiesArray, CollectionTokenPropertyPermissions, TokenPropertyPermissionObject} from '../unique_types'

export const encodeCollectionSchemaToProperties = (schema: UniqueCollectionSchemaToCreate): PropertiesArray => {
  validateUniqueCollectionSchema(schema)
  return converters2Layers.objectToProperties(schema)
}

export const unpackCollectionSchemaFromProperties = (properties: PropertiesArray): any => {
  return converters2Layers.propertiesToObject(properties) as any
}

export const decodeUniqueCollectionFromProperties = async (collectionId: number, properties: PropertiesArray): Promise<DecodingResult<UniqueCollectionSchemaDecoded>> => {
  try {
    const unpackedSchema: UniqueCollectionSchemaDecoded = unpackCollectionSchemaFromProperties(properties)
    validateUniqueCollectionSchema(unpackedSchema)
    unpackedSchema.collectionId = collectionId as number

    if (unpackedSchema.coverPicture) {
      unpackedSchema.coverPicture = decodeTokenUrlOrInfixOrCidWithHashField(unpackedSchema.coverPicture, unpackedSchema.image)
    }
    if (unpackedSchema.coverPicturePreview) {
      unpackedSchema.coverPicturePreview = decodeTokenUrlOrInfixOrCidWithHashField(unpackedSchema.coverPicturePreview, unpackedSchema.image)
    }
    return {
      result: unpackedSchema,
      error: null,
    }
  } catch (e) {
    return {
      result: null,
      error: e as Error,
    }
  }
}

export const decodeUniqueCollectionFromERC721Metadata = (collectionId: number, properties: PropertiesArray): DecodingResult<UniqueCollectionSchemaDecoded> => {
  try {
    const baseURI = properties.find((p) => p.key === 'baseURI')?.value

    const result: UniqueCollectionSchemaDecoded = {
      schemaName: COLLECTION_SCHEMA_NAME.ERC721Metadata,
      schemaVersion: '1.0.0',
      collectionId,
      coverPicture: {
        url: '',
        fullUrl: null,
      },
      image: {
        urlTemplate: '{infix}',
      },
      baseURI,
    }

    return {
      result,
      error: null,
    }
  } catch (e) {
    return {
      result: null,
      error: e as Error,
    }
  }
}

const generateDefaultTPPObjectForKey = (key: string): TokenPropertyPermissionObject => ({
  key,
  permission: {mutable: false, collectionAdmin: true, tokenOwner: false}
})

const generateDefaultTPPsForInfixOrUrlOrCidAndHashObject = (permissions: CollectionTokenPropertyPermissions, prefix: string) => {
  permissions.push(generateDefaultTPPObjectForKey(`${prefix}.i`)) // url infix
  permissions.push(generateDefaultTPPObjectForKey(`${prefix}.c`)) // ipfs cid
  permissions.push(generateDefaultTPPObjectForKey(`${prefix}.u`)) // url
  permissions.push(generateDefaultTPPObjectForKey(`${prefix}.h`)) // hash
}

export interface ICollectionSchemaToTokenPropertyPermissionsOptions {
  overwriteTPPs?: CollectionTokenPropertyPermissions
}

export const generateTokenPropertyPermissionsFromCollectionSchema = (schema: UniqueCollectionSchemaToCreate, options?: ICollectionSchemaToTokenPropertyPermissionsOptions): CollectionTokenPropertyPermissions => {
  const permissions: CollectionTokenPropertyPermissions = [
    generateDefaultTPPObjectForKey('n'), // name
    generateDefaultTPPObjectForKey('d'), // description
  ]

  generateDefaultTPPsForInfixOrUrlOrCidAndHashObject(permissions, 'i')     // image url, urlInfix, ipfsCid and hash (i.u, i.i, i.c, i.h)

  if (schema.hasOwnProperty('imagePreview')) {
    generateDefaultTPPsForInfixOrUrlOrCidAndHashObject(permissions, 'p')    // imagePreview url, urlInfix, ipfsCid and hash (p.u, p.i, p.c, p.h)
  }

  if (schema.hasOwnProperty('file')) {
    generateDefaultTPPsForInfixOrUrlOrCidAndHashObject(permissions, 'f')    // imagePreview url, urlInfix, ipfsCid and hash (p.u, p.i, p.c, p.h)
  }

  if (schema.hasOwnProperty('video')) {
    generateDefaultTPPsForInfixOrUrlOrCidAndHashObject(permissions, 'v')    // video url, urlInfix, ipfsCid and hash (v.u, v.i, v.c, v.h)
  }

  if (schema.hasOwnProperty('audio')) {
    generateDefaultTPPsForInfixOrUrlOrCidAndHashObject(permissions, 'au')   // audio url, urlInfix, ipfsCid and hash (au.u, au.i, au.c, au.h)
  }

  if (schema.hasOwnProperty('spatialObject')) {
    generateDefaultTPPsForInfixOrUrlOrCidAndHashObject(permissions, 'so')   // spatialObject url, urlInfix, ipfsCid and hash (so.u, so.i, so.c, so.h)
  }

  if (schema.attributesSchema) {
    getKeys(schema.attributesSchema).forEach(key => {
      permissions.push(generateDefaultTPPObjectForKey(`a.${key}`))
    })
  }

  if (options?.overwriteTPPs) {
    const {overwriteTPPs} = options

    if (!validateCollectionTokenPropertyPermissions(overwriteTPPs)) {
      throw new Error(`overwriteTPPs are not valid`)
    }

    for (const tpp of overwriteTPPs) {
      const index = permissions.findIndex(permission => permission.key === tpp.key)
      if (index < 0) {
        permissions.push(tpp)
      } else {
        permissions[index] = tpp
      }
    }
  }

  return permissions
}
