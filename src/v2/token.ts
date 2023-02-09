import {
  DynamicAttributeInToken,
  Property,
  SchemaBasedAttributeInToken, TokenMediaInfo,
  TokenPropertyPermission,
  UniqueCollectionSchemaV2,
  UniqueTokenV2
} from './types'
import {getEntries, getKeys} from '../tsUtils'
import {
  validateAttributeValue,
  validateAttributeValues,
  validateDynamicAttributeInToken,
  validateUniqueTokenV2
} from './types.validator'
import {deserializeRoyalties, serializeRoyalties, validateRoyalties} from './royalties'
import JSON5 from 'json5'

// The "softCheck" parameter is employed for validating a token in a manner
// that does not result in error throwing. This means that after decoding the token,
// there may be acceptable scenarios where some non-valid cases occur.
// For example, token may have attributes with enumKeys and values fields at the same time.
export const validateToken = (schema: UniqueCollectionSchemaV2, token: UniqueTokenV2, softCheck?: boolean): boolean => {
  // const tokenCopy = JSON5.parse(JSON5.stringify(token)) as UniqueTokenV2c
  const tokenCopy = token
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

  // validate attributes
  const schemaAttributes = getKeys(schema.attributes?.schema || {})
  const tokenAttributes = getKeys(tokenCopy.attributes || {})

  const additionalAttributes = tokenAttributes.filter(key => !schemaAttributes.includes(key))
  const schemaBasedAttributes = tokenAttributes.filter(key => schemaAttributes.includes(key))

  // validate additional attributes - which are not in schema
  if (additionalAttributes.length) {
    for (const key of additionalAttributes) {
      validateDynamicAttributeInToken(tokenCopy.attributes![key] as DynamicAttributeInToken)
    }
  }

  // validate "known" attributes - which present in schema
  if (schemaBasedAttributes.length) {
    for (const key of schemaBasedAttributes) {
      const attributeSchema = schema.attributes!.schema[key]
      const attribute = tokenCopy.attributes![key]
      const {enumKeys, values} = attribute as SchemaBasedAttributeInToken

      // token should have either enumKeys or values
      if (!softCheck && !(Number(!!enumKeys) ^ Number(!!values))) {
        throw new Error(`Attribute ${key} should have only one of: enumKeys or values`)
      }

      // token should have enumKeys if schema has enumValues
      // and should have values if schema has not enumValues
      if (!!attributeSchema.enumValues) {
        // check that token has the enumKeys field
        if (!enumKeys) {
          throw new Error(`Attribute ${key} should have enumKeys`)
        }

        // check that all enumKeys meet a corresponding enumValues entry in the schema
        const schemaEnumKeys = getKeys(attributeSchema.enumValues)
        for (const enumKey of enumKeys) {
          if (!schemaEnumKeys.includes(enumKey)) {
            throw new Error(`Attribute "${key}" has unknown enumKey: ${enumKey}`)
          }
        }
      } else { // if schema has not enumValues
        // check that token has the values field
        if (!values) {
          throw new Error(`Attribute "${key}" should have values`)
        }
        try {
          validateAttributeValues(values)
        } catch (e: any) {
          throw new Error(`Attribute "${key}" has invalid values: ${e.message}`)
        }
      }
    }
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

  const ERC721MetadataTokenURI = token.common?.ERC721MetadataTokenURI
  if (ERC721MetadataTokenURI) {
    delete token.common!.ERC721MetadataTokenURI
  }

  const URIProperty = ERC721MetadataTokenURI
    ? [{key: 'URI', value: ERC721MetadataTokenURI}]
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
    token.common.ERC721MetadataTokenURI = URIProperty.value
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
        if ('single' in attributeSchema) {
          attribute.single = attribute.single || attributeSchema.single
        }

        if (!attribute.values) {
          const enumKeys = (attribute as SchemaBasedAttributeInToken)?.enumKeys
          attribute.values = !!enumKeys && !!attributeSchema.enumValues
            ? enumKeys.map(key => attributeSchema.enumValues![key])
            : []
        }
      }
    }
  }


  let validationError = null
  try {
    validateToken(schema, token, true)
  } catch (e: any) {
    validationError = e as Error
  }

  return {
    token,
    validationError,
  }
}
