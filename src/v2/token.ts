import {
  DynamicAttributeInToken,
  Property,
  SchemaBasedAttributeInToken, TokenMediaInfo,
  TokenPropertyPermission,
  UniqueCollectionSchemaV2,
  UniqueTokenV2
} from './types'
import {getEntries, getKeys} from '../tsUtils'
import {validateUniqueTokenV2} from './types.validator'
import {deserializeRoyalties, serializeRoyalties, validateRoyalties} from './royalties'
import JSON5 from 'json5'

export const validateToken = (schema: UniqueCollectionSchemaV2, token: UniqueTokenV2): boolean => {
  const tokenCopy = JSON5.parse(JSON5.stringify(token)) as UniqueTokenV2
  validateUniqueTokenV2(tokenCopy)

  const requiredMediaKeys = getEntries(schema.media?.schema || {})
    .filter(([_, value]) => !!value.required)
  const missingMediaKeys = requiredMediaKeys.filter(([key]) => !tokenCopy.media?.[key])

  const requiredAttributeKeys = getEntries(schema.attributes?.schema || {})
    .filter(([_, value]) => !value.optional)
  const missingAttributesKeys = requiredAttributeKeys.filter(([key]) => !tokenCopy.attributes?.[key])

  if (missingMediaKeys.length || missingAttributesKeys.length) {
    const missingMediaErrorString = `Missing required media keys: ${missingMediaKeys.map(([key]) => key).join(', ')}. `
    const missingAttributesErrorString = `Missing required attributes keys: ${missingAttributesKeys.map(([key]) => key).join(', ')}.`
    throw new Error(`${missingMediaErrorString}${missingAttributesErrorString}`)
  }

  if (tokenCopy.royalties) {
    validateRoyalties(tokenCopy.royalties)
  }

  return true
}

const serializeTokenMediaOrAttributesToProperties = (TPPs: TokenPropertyPermission[], token: UniqueTokenV2, kind: 'media' | 'attributes') => {
  const properties: Property[] = []
  const customKeys = TPPs
    .filter(({key}) => key.startsWith(`${kind}.`))
    .map(({key}) => key.replace(`${kind}.`, ''))

  // split all token.media/token.attributes to custom and common keys
  const keys = Object.keys(token[kind] || {})

  properties.push({
    key: kind,
    // filter only common keys
    // which should be saved in generic 'media' or 'attributes' property
    value: JSON5.stringify(keys
      .filter(key => !customKeys.includes(key))
      .reduce((acc, cur) => ({...acc, [cur]: token[kind]![cur]}), {} as any)
    )
  })

  properties.push(...keys
    // filter only custom keys
    // which should be saved in custom 'media.*' or 'attributes.*' properties
    .filter(key => customKeys.includes(key) && token[kind]![key])
    .map(key => ({key: `${kind}.${key}`, value: JSON5.stringify(token[kind]![key])}))
  )

  return properties
}

export const encodeToken = (schema: UniqueCollectionSchemaV2, TPPs: TokenPropertyPermission[], token: UniqueTokenV2): { properties: Property[] } => {
  validateToken(schema, token)

  const ERC721TokenURI = token.common?.ERC721TokenURI
  if (ERC721TokenURI) {
    delete token.common!.ERC721TokenURI
  }

  const URIProperty = ERC721TokenURI
    ? [{key: 'URI', value: ERC721TokenURI}]
    : []

  const commonProperty = token.common
    ? [{key: 'common', value: JSON5.stringify(token.common)}]
    : []

  const royaltiesProperty = token.royalties
    ? [{key: 'royalties', value: serializeRoyalties(token.royalties)}]
    : []

  const properties: Property[] = [
    ...commonProperty,
    ...URIProperty,
    ...serializeTokenMediaOrAttributesToProperties(TPPs, token, 'media'),
    ...serializeTokenMediaOrAttributesToProperties(TPPs, token, 'attributes'),
    ...royaltiesProperty,
  ]

  return {properties}
}

const deserializeTokenMediaOrAttributesFromProperties = (token: UniqueTokenV2, properties: Property[], kind: 'media' | 'attributes') => {
  const commonProperty = properties.find(({key}) => key === kind)
  const customProperties = properties.filter(({key}) => key.startsWith(`${kind}.`))
  if (commonProperty || customProperties.length) {
    token[kind] = {
      ...JSON5.parse(commonProperty?.value || '{}'),
      ...customProperties.reduce((acc, {key, value}) => {
        const customKey = key.replace(`${kind}.`, '')
        return {
          ...acc,
          [customKey]: JSON5.parse(value)
        }
      }, {} as Record<string, any>)
    }
  }

  return token
}

export const decodeToken = (schema: UniqueCollectionSchemaV2, TPPs: TokenPropertyPermission[], properties: Property[]): { token: UniqueTokenV2, validationError?: Error | null } => {
  const token = {} as UniqueTokenV2

  const commonProperty = properties.find(({key}) => key === 'common')
  if (commonProperty) {
    token.common = JSON5.parse(commonProperty.value)
  }

  const URIProperty = properties.find(({key}) => key === 'URI')
  if (URIProperty) {
    token.common = token.common || {}
    token.common.ERC721TokenURI = URIProperty.value
  }

  const royaltiesProperty = properties.find(({key}) => key === 'royalties')
  if (royaltiesProperty) {
    token.royalties = deserializeRoyalties(royaltiesProperty.value)
  }

  // deserialize media and enrich media with schema
  deserializeTokenMediaOrAttributesFromProperties(token, properties, 'media')
  if (token.media) {
    const mediaKeys = getKeys(token.media)
    const mediaSchemaKeys = getKeys(schema.media?.schema || {})
    const mediaKeysWhichInSchema = mediaKeys.filter(key => mediaSchemaKeys.includes(key))

    // enrich media with schema
    for (const key of mediaKeysWhichInSchema) {
      const media = token.media![key]
      const mediaSchema = schema.media?.schema?.[key]! as TokenMediaInfo

      for (const subKey of getKeys(mediaSchema)) {
        const mediaValue = media[subKey]
        const schemaMediaValue = mediaSchema[subKey]
        if (schemaMediaValue) {
          ;(media as any)[subKey] = (mediaValue || schemaMediaValue) as any as TokenMediaInfo[keyof TokenMediaInfo]
        }
      }

      // set the media url as it is or as a combination of baseUrl and suffix
      if (!media.url) {
        media.url = schema.baseUrl + (media.suffix || '')
      }
    }
  }


  // deserialize and enrich token attributes with schema (set values, titles, types, etc)
  deserializeTokenMediaOrAttributesFromProperties(token, properties, 'attributes')
  if (token.attributes) {
    const attributesKeys = getKeys(token.attributes)
    for (const attributeKey of attributesKeys) {
      const attribute = token.attributes[attributeKey] as DynamicAttributeInToken
      const attributeSchema = schema.attributes?.schema?.[attributeKey]

      if (attributeSchema) {
        attribute.type = attribute.type || attributeSchema.type
        attribute.title = attribute.title || attributeSchema.title
        if (attributeSchema.order) {
          attribute.order = attribute.order || attributeSchema.order
        }
        if (attributeSchema.array) {
          attribute.array = attribute.array || attributeSchema.array
        }

        if (!attribute.values) {
          const enumKeys = (attribute as SchemaBasedAttributeInToken)?.enumKeys
          attribute.values = Array.isArray(enumKeys) && attributeSchema.enumValues
            ? enumKeys.map(key => attributeSchema.enumValues![key])
            : []
        }
      }
    }
  }


  let validationError = null
  try {
    validateToken(schema, token)
  } catch (e: any) {
    validationError = e as Error
  }

  return {
    token,
    validationError,
  }
}
