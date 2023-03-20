import JSON5 from 'json5'

import {Property, TokenPropertyPermission, UniqueCollectionSchemaV2} from './types'
import {getEntries} from '../tsUtils'
import {DEFAULT_PERMISSION} from './constants'
import {deserializeRoyalties, serializeRoyalties, validateRoyalties} from './royalties'
import {validateUniqueCollectionSchemaV2} from './types.validator'
import {Semver} from '../semver'

export const sanitizeSchema = (schema: UniqueCollectionSchemaV2): UniqueCollectionSchemaV2 => {
  const rawSchemaString = JSON5.stringify(schema)
  const schemaToWrite = JSON5.parse(rawSchemaString) as UniqueCollectionSchemaV2

  if (schemaToWrite.instantiateWith) {
    delete schemaToWrite.instantiateWith
  }
  if (schemaToWrite.royalties?.permission) {
    delete schemaToWrite.royalties.permission
  }
  if (schemaToWrite.media?.permission) {
    delete schemaToWrite.media.permission
  }
  if (schemaToWrite.attributes?.permission) {
    delete schemaToWrite.attributes.permission
  }

  if (schemaToWrite.media?.schema) {
    for (const value of Object.values(schemaToWrite.media.schema)) {
      if (value.permission) delete value.permission
    }
  }
  if (schemaToWrite.attributes?.schema) {
    for (const value of Object.values(schemaToWrite.attributes.schema)) {
      if (value.permission) delete value.permission
    }
  }

  return schemaToWrite
}

export const validateSchema = (schema: any): schema is UniqueCollectionSchemaV2 => {
  validateUniqueCollectionSchemaV2(schema)

  if (schema.schemaName !== 'unique') {
    throw new Error('schemaName must be "unique"')
  }

  if (!Semver.isValid(schema.schemaVersion)) {
    throw new Error('schemaVersion is not valid semver')
  }
  const version = Semver.fromString(schema.schemaVersion)
  if (version.major !== 2) {
    throw new Error('schemaVersion must be 2.x.x')
  }

  /////////////////////////////
  // validate media schema
  /////////////////////////////
  if (schema.media?.schema) {
    const medias = getEntries(schema.media.schema)

    // check that all posterFor entries are in schema
    for (const [key, value] of medias) {
      const posterFor = value.posterFor
      if (posterFor) {
        if (!medias.find(([k]) => k === posterFor)) {
          throw new Error(`posterFor: ${posterFor} not found in media schema`)
        }
      }
    }

    // main media amount check (not 2 main media in schema)
    const amountOfMainMedia = medias.filter(([_, value]) => value.main).length
    if (amountOfMainMedia > 1) {
      throw new Error('max 1 main media allowed')
    }

    // check that all order values are different
    const orderValues = medias.map(([_, value]) => value.order)
    const uniqueOrderValues = new Set(orderValues)
    if (orderValues.length !== uniqueOrderValues.size) {
      throw new Error('media: order values must be unique')
    }
  }

  /////////////////////////////////
  // validate attributes schema
  /////////////////////////////////
  if (schema.attributes?.schema) {
    const attributes = getEntries(schema.attributes.schema)
    const orderValues = attributes.map(([_, value]) => value.order)
    const uniqueOrderValues = new Set(orderValues)
    if (orderValues.length !== uniqueOrderValues.size) {
      throw new Error('attributes: order values must be unique')
    }
  }

  /////////////////////////////////
  // validate royalties fallback
  /////////////////////////////////
  if (schema.royalties) {
    validateRoyalties(schema.royalties)
  }

  return true
}


export const encodeSchema = (schema: UniqueCollectionSchemaV2): { properties: Property[]; TPPs: TokenPropertyPermission[] } => {
  validateSchema(schema)

  const TPPs: TokenPropertyPermission[] = []
  const properties: Property[] = []

  const defaultPermission = schema.instantiateWith?.defaultPermission || DEFAULT_PERMISSION

  TPPs.push({
    key: 'common',
    permission: schema.instantiateWith?.propertyCommonPermission || defaultPermission
  })
  TPPs.push({
    key: 'royalties',
    permission: schema.royalties?.permission || defaultPermission
  })
  TPPs.push({
    key: 'media',
    permission: schema.media?.permission || defaultPermission
  })
  TPPs.push({
    key: 'attributes',
    permission: schema.attributes?.permission || defaultPermission
  })
  if (schema.instantiateWith?.allowERC721MetadataTokenURI) {
    TPPs.push({
      key: 'URI',
      permission: typeof schema.instantiateWith.allowERC721MetadataTokenURI === 'boolean'
        ? defaultPermission
        : schema.instantiateWith.allowERC721MetadataTokenURI
    })
  }

  if (schema.media?.schema) {
    const entries = getEntries(schema.media.schema)
    const customPermissionFields = entries.filter(([_, value]) => !!value.permission)
    if (customPermissionFields.length) {
      for (const [key, value] of customPermissionFields) {
        TPPs.push({key: `media.${key}`, permission: value.permission!})
      }
    }
  }

  if (schema.attributes?.schema) {
    const entries = getEntries(schema.attributes.schema)
    const customPermissionFields = entries.filter(([_, value]) => !!value.permission)
    if (customPermissionFields.length) {
      for (const [key, value] of customPermissionFields) {
        TPPs.push({key: `attributes.${key}`, permission: value.permission!})
      }
    }
  }

  const schemaToWrite = sanitizeSchema(schema)

  properties.push({key: 'schemaName', value: schema.schemaName})
  properties.push({key: 'schemaVersion', value: schema.schemaVersion})

  if (schemaToWrite.royalties) {
    properties.push({key: 'royalties', value: serializeRoyalties(schemaToWrite.royalties)})
    delete schemaToWrite.royalties
  }

  properties.push({key: 'schema', value: JSON5.stringify(schemaToWrite)})


  // console.dir(schema, {depth: null})
  // console.dir(schemaToWrite, {depth: null})
  // console.dir(TPPs, {depth: null})
  //
  // console.dir(properties, {depth: null})
  // console.log(JSON5.stringify(schema).length + ' / ' + JSON.stringify(schema).length + ' = ' + (100 * JSON5.stringify(schema).length / JSON.stringify(schema).length).toFixed(2) + '%')
  // console.log(JSON5.stringify(schemaToWrite).length + ' / ' + JSON.stringify(schemaToWrite).length + ' = ' + (100 * JSON5.stringify(schemaToWrite).length / JSON.stringify(schemaToWrite).length).toFixed(2) + '%')
  // console.log(JSON5.stringify(schemaToWrite).length + ' / ' + JSON.stringify(schema).length + ' = ' + (100 * JSON5.stringify(schemaToWrite).length / JSON.stringify(schema).length).toFixed(2) + '%')

  return {properties, TPPs}
}

export const decodeSchema = (properties: Property[], TPPs: TokenPropertyPermission[]): { schema: UniqueCollectionSchemaV2, errors?: string[] } => {
  const errors = []

  const schemaProperty = properties.find(p => p.key === 'schema')?.value
  if (!schemaProperty) {
    throw new Error('Schema not found')
  }
  const schema = JSON5.parse(schemaProperty) as UniqueCollectionSchemaV2

  const royalties = properties.find(p => p.key === 'royalties')?.value
  if (royalties) {
    try {
      schema.royalties = deserializeRoyalties(royalties)
    } catch (e: any) {
      errors.push(e.message)
    }
  }

  try {
    validateSchema(schema)
  } catch (e: any) {
    errors.push(e.message)
  }

  return {schema, errors: errors.length ? errors : undefined}
}
