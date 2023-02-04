import JSON5 from 'json5'

import {schema, token} from './examples'
import {Property, RoyaltySchema, TokenPropertyPermission, UniqueCollectionSchemaV2, UniqueTokenV2} from './types'
import {getEntries, getKeys} from '../tsUtils'
import {DEFAULT_PERMISSION} from './constants'
import * as assert from 'assert'
import * as fs from 'fs'

function removeKeyFromObjectRecursively<T extends object>(obj: T, prop: string) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (key === prop) {
        delete obj[key]
      } else if (typeof obj[key] === 'object') {
        removeKeyFromObjectRecursively(obj[key] as T, key)
      }
    }
  }
}

const sanitizeSchema = (schema: UniqueCollectionSchemaV2): UniqueCollectionSchemaV2 => {
  const rawSchemaString = JSON5.stringify(schema)
  const schemaToWrite = JSON5.parse(rawSchemaString) as UniqueCollectionSchemaV2

  removeKeyFromObjectRecursively(schemaToWrite, 'customPermission')
  removeKeyFromObjectRecursively(schemaToWrite, 'defaultPermission')
  if (schema.royalties) delete schemaToWrite.royalties

  return schemaToWrite
}

const serializeRoyalties = (royalties: RoyaltySchema): string => {
  let royaltiesString = 'TODO: ROYALTIES SERIALIZATION'
  //todo: serialize royalties
  return royaltiesString
}

const deserializeRoyalties = (royaltiesString: string): RoyaltySchema => {
  const royalties: RoyaltySchema = {
    royaltyVersion: '1',
  }
  //todo: deserialize royalties
  return royalties
}


const encodeSchema = (schema: UniqueCollectionSchemaV2): {properties: Property[]; TPPs: TokenPropertyPermission[]} => {
  const TPPs: TokenPropertyPermission[] = []
  const properties: Property[] = []

  //todo: validate schema

  TPPs.push({key: 'common', permission: schema.defaultPermissionForPropertyCommon || schema.defaultPermission || DEFAULT_PERMISSION})
  TPPs.push({key: 'royalties', permission: schema.royalties?.defaultPermission || schema.defaultPermission || DEFAULT_PERMISSION})
  TPPs.push({key: 'media', permission: schema.media?.defaultPermission || schema.defaultPermission || DEFAULT_PERMISSION})
  TPPs.push({key: 'attributes', permission: schema.attributes?.defaultPermission || schema.defaultPermission || DEFAULT_PERMISSION})

  if (schema.media?.schema) {
    const entries = getEntries(schema.media.schema)
    const customPermissionFields = entries.filter(([_, value]) => !!value.customPermission)
    if (customPermissionFields.length) {
      for (const [key, value] of customPermissionFields) {
        TPPs.push({key: `media.${key}`, permission: value.customPermission!})
      }
    }
  }

  if (schema.attributes?.schema) {
    const entries = getEntries(schema.attributes.schema)
    const customPermissionFields = entries.filter(([_, value]) => !!value.customPermission)
    if (customPermissionFields.length) {
      for (const [key, value] of customPermissionFields) {
        TPPs.push({key: `attributes.${key}`, permission: value.customPermission!})
      }
    }
  }

  properties.push({key: 'schemaName', value: schema.schemaName})
  properties.push({key: 'schemaVersion', value: schema.schemaVersion})

  const schemaToWrite = sanitizeSchema(schema)
  properties.push({key: 'schema', value: JSON5.stringify(schemaToWrite)})

  if (schema.royalties) {
    //todo: royalties serialization
    properties.push({key: 'royalties', value: serializeRoyalties(schema.royalties)})
  }

  console.dir(schema, {depth: null})
  console.dir(schemaToWrite, {depth: null})
  console.dir(TPPs, {depth: null})

  console.dir(properties, {depth: null})
  console.log(JSON5.stringify(schema).length + ' / ' + JSON.stringify(schema).length + ' = ' + (100 * JSON5.stringify(schema).length / JSON.stringify(schema).length).toFixed(2) + '%')
  console.log(JSON5.stringify(schemaToWrite).length + ' / ' + JSON.stringify(schemaToWrite).length + ' = ' + (100 * JSON5.stringify(schemaToWrite).length / JSON.stringify(schemaToWrite).length).toFixed(2) + '%')
  console.log(JSON5.stringify(schemaToWrite).length + ' / ' + JSON.stringify(schema).length + ' = ' + (100 * JSON5.stringify(schemaToWrite).length / JSON.stringify(schema).length).toFixed(2) + '%')

  return {properties, TPPs}
}

const {properties, TPPs} = encodeSchema(schema)

const decodeSchema = (properties: Property[], TPPs: TokenPropertyPermission[]): UniqueCollectionSchemaV2 => {
  const strSchema = properties.find(p => p.key === 'schema')?.value
  if (!strSchema) {
    throw new Error('Schema not found')
  }
  const schema = JSON5.parse(strSchema)

  const royalties = properties.find(p => p.key === 'royalties')?.value
  if (royalties) {
    schema.royalties = deserializeRoyalties(royalties)
  }

  //todo: validate schema

  return schema as UniqueCollectionSchemaV2
}

const schemaDecoded = decodeSchema(properties, TPPs)

fs.writeFileSync('./schema.json5', JSON5.stringify(schemaDecoded, {space: 2}))

console.dir(schemaDecoded, {depth: null})

assert.deepStrictEqual(sanitizeSchema(schema), schemaDecoded)

const encodeToken = (token: UniqueTokenV2): {properties: Property[]} => {
  const properties: Property[] = []

  const entries = getEntries(token)

  return {properties}
}
