import {Property, UniqueCollectionSchemaV2, UniqueTokenV2Enriched} from '../types'
import {DecodingImageLinkOptions, parseImageLinkOptions} from './utils'

const isOffchainSchemaAValidUrl = (offchainSchema: string | undefined): offchainSchema is string => {
  try {
    offchainSchema = offchainSchema || ''
    new URL(offchainSchema)
    return offchainSchema.indexOf('{id}') >= 0 ? true : false
  } catch {
    return false
  }
}

const decodeSchema = (properties: Property[], options?: DecodingImageLinkOptions): { schema: UniqueCollectionSchemaV2, errors?: string[] } => {
  const errors: string[] = []

  const {baseUrl, dummyImageFullUrl} = parseImageLinkOptions(options)

  const offchainSchema = properties.find(({key}) => key === '_old_offchainSchema')?.value || undefined
  const schemaVersion = properties.find(({key}) => key === '_old_schemaVersion')?.value || undefined
  const constOnChainSchema = properties.find(({key}) => key === '_old_constOnChainSchema')?.value || undefined
  const variableOnChainSchema = properties.find(({key}) => key === '_old_variableOnChainSchema')?.value || undefined

  const offchainSchemaIsValidUrl = isOffchainSchemaAValidUrl(offchainSchema)

  let parsedVariableOnChainSchema = null
  try {
    parsedVariableOnChainSchema = JSON.parse(variableOnChainSchema || '')
  } catch {
  }

  const schema: UniqueCollectionSchemaV2 = {
    schemaName: 'unique',
    schemaVersion: '2.0.0',
    baseUrl: offchainSchemaIsValidUrl ? offchainSchema : baseUrl,
    cover: {
      url: typeof parsedVariableOnChainSchema?.collectionCover === 'string'
       ? baseUrl + parsedVariableOnChainSchema.collectionCover
        : isOffchainSchemaAValidUrl(offchainSchema)
          ? offchainSchema.replace('{id}', '1')
          : dummyImageFullUrl,
    },
    defaultLocale: 'en',
  }

  if (parsedVariableOnChainSchema && typeof parsedVariableOnChainSchema === 'object' && typeof parsedVariableOnChainSchema.collectionCover === 'string') {
    schema.cover.url = parsedVariableOnChainSchema.collectionCover

    imageUrlTemplate.replace('{infix}', parsedVariableOnChainSchema.collectionCover)
  } else if (offchainSchemaIsValidUrl) {
    const coverUrl = offchainSchema.replace('{id}', '1')
    schema.coverPicture.url = coverUrl
    schema.coverPicture.fullUrl = coverUrl
  }

  return {schema, errors: errors.length ? errors : undefined}
}

const decodeToken = (collectionProperties: Property[], properties: Property[]): { token: UniqueTokenV2Enriched, errors?: string[] } => {
  const token = {} as UniqueTokenV2Enriched
  const errors: string[] = []

  return {token, errors: errors.length ? errors : undefined}
}
