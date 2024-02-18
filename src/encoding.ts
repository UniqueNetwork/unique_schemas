import {
  CollectionTokenPropertyPermissions,
  EncodeCollectionOptions,
  EncodeCollectionResult,
  EncodeTokenOptions,
  PropertyForEncoding,
  PropertyWithHexOnly,
} from './types'
import {DEFAULT_PERMISSION, SCHEMA_NAME, SCHEMA_VERSION} from './constants'
import {
  IV2Collection,
  IV2CollectionForEncoding,
  IV2Token,
  IV2TokenForEncoding,
  zCollectionSchema,
  zTokenSchema
} from './schema.zod'
import {Royalties} from '@unique-nft/utils/royalties'
import {zipTwoArraysByKey, hexifyProperties} from './utils'

export const encodeCollection = (data: IV2CollectionForEncoding, options: EncodeCollectionOptions): EncodeCollectionResult => {
  const collectionInfo = zCollectionSchema.parse(data)

  const permission = options.defaultPermission ?? {...DEFAULT_PERMISSION}

  const properties: PropertyForEncoding[] = [
    {key: 'schemaName', value: collectionInfo.schemaName || SCHEMA_NAME},
    {key: 'schemaVersion', value: collectionInfo.schemaVersion || SCHEMA_VERSION},
    {key: 'collectionInfo', value: JSON.stringify(collectionInfo)},
  ]
  if (collectionInfo.royalties) {
    // properties.push({key: 'royalties', value: Royalties.uniqueV2.encode(collectionInfo.royalties)})
    throw new Error('Royalties are not supported in collections in v2, please use the token level royalties')
  }

  const TPPs: CollectionTokenPropertyPermissions = [
    'schemaName', 'schemaVersion',
    'tokenData', 'URI', 'URISuffix',
    'overrides', 'customizing_overrides', 'royalties'
  ].map(key => ({key, permission}))

  return {
    collectionProperties: hexifyProperties(zipTwoArraysByKey(properties, options.overwriteProperties ?? [])),
    tokenPropertyPermissions: zipTwoArraysByKey(TPPs, options.overwriteTPPs ?? []),
  }
}

export const encodeToken = (data: IV2TokenForEncoding, options: EncodeTokenOptions): PropertyWithHexOnly[] => {
  const token = zTokenSchema.parse(data)

  const properties: PropertyForEncoding[] = [
    {key: 'schemaName', value: token.schemaName || SCHEMA_NAME},
    {key: 'schemaVersion', value: token.schemaVersion || SCHEMA_VERSION},
    {key: 'tokenData', value: JSON.stringify(token)},
  ]

  token.royalties && properties.push({key: 'royalties', valueHex: Royalties.uniqueV2.encode(token.royalties)})

  options.URI && properties.push({key: 'URI', value: options.URI})

  return hexifyProperties(zipTwoArraysByKey(properties, options.overwriteProperties ?? []))
}
