import {
  DecodedAttributes,
  EncodedTokenAttributes,
  InfixOrUrlOrCidAndHash, LocalizedStringOrBoxedNumberWithDefault, LocalizedStringWithDefault,
  UniqueCollectionSchemaDecoded,
  UniqueCollectionSchemaToCreate,
  UniqueTokenDecoded,
  UniqueTokenToCreate
} from '../types'
import {validateUniqueToken} from './validators'
import {
  decodeHexAndParseJSONOrReturnNull,
  getEntries,
  safeJsonParseStringOrHexString
} from '../tsUtils'
import {
  decodeTokenUrlOrInfixOrCidWithHashField,
  DecodingResult
} from "../schemaUtils";
import {Address} from "@unique-nft/utils/address";
import {ProbablyDecodedProperty} from '../v3/types'
import {StringUtils} from '@unique-nft/utils'
import {PropertiesArray} from '../unique_types'

const addUrlObjectToTokenProperties = (properties: PropertiesArray, prefix: string, source: InfixOrUrlOrCidAndHash) => {
  if (typeof source.urlInfix === 'string') {
    properties.push({key: `${prefix}.i`, value: source.urlInfix})
  } else if (typeof source.ipfsCid === 'string') {
    properties.push({key: `${prefix}.c`, value: source.ipfsCid})
  } else if (typeof source.url === 'string') {
    properties.push({key: `${prefix}.u`, value: source.url})
  }

  if (typeof source.hash === 'string') {
    properties.push({key: `${prefix}.h`, value: source.hash})
  }
}

const addKeyToTokenProperties = (properties: PropertiesArray, key: string, value: string | number | object) => {
  let strValue = JSON.stringify(value)

  properties.push({
    key,
    value: strValue
  })
}

export const encodeTokenToProperties = (token: UniqueTokenToCreate, schema: UniqueCollectionSchemaToCreate | UniqueCollectionSchemaDecoded): PropertiesArray => {
  validateUniqueToken(token, schema as UniqueCollectionSchemaToCreate)

  const properties: PropertiesArray = []
  if (token.name) addKeyToTokenProperties(properties, 'n', token.name)
  if (token.description) addKeyToTokenProperties(properties, 'd', token.description)

  if (token.encodedAttributes) {
    for (const n in token.encodedAttributes) {
      const value = token.encodedAttributes[n]
      addKeyToTokenProperties(properties, `a.${n}`, value)
    }
  }

  if (token.image) addUrlObjectToTokenProperties(properties, 'i', token.image)
  if (schema.imagePreview && token.imagePreview) addUrlObjectToTokenProperties(properties, 'p', token.imagePreview)
  if (schema.video && token.video) addUrlObjectToTokenProperties(properties, 'v', token.video)
  if (schema.audio && token.audio) addUrlObjectToTokenProperties(properties, 'au', token.audio)
  if (schema.spatialObject && token.spatialObject) addUrlObjectToTokenProperties(properties, 'so', token.spatialObject)

  return properties
}

const fillTokenFieldByKeyPrefix = <T extends UniqueTokenToCreate>(token: T, properties: ProbablyDecodedProperty[], prefix: string, tokenField: keyof T) => {
  const keysMatchingPrefix = [`${prefix}.i`, `${prefix}.u`, `${prefix}.c`, `${prefix}.h`]
  if (properties.some(({key}) => keysMatchingPrefix.includes(key))) token[tokenField] = {} as any

  const field = token[tokenField] as any as InfixOrUrlOrCidAndHash

  const urlInfixProperty = properties.find(({key}) => key === keysMatchingPrefix[0])
  if (urlInfixProperty) field.urlInfix = StringUtils.Utf8.hexStringToString(urlInfixProperty.valueHex)

  const urlProperty = properties.find(({key}) => key === keysMatchingPrefix[1])
  if (urlProperty) field.url = StringUtils.Utf8.hexStringToString(urlProperty.valueHex)

  const ipfsCidProperty = properties.find(({key}) => key === keysMatchingPrefix[2])
  if (ipfsCidProperty) field.ipfsCid = StringUtils.Utf8.hexStringToString(ipfsCidProperty.valueHex)

  const hashProperty = properties.find(({key}) => key === keysMatchingPrefix[3])
  if (hashProperty) field.hash = StringUtils.Utf8.hexStringToString(hashProperty.valueHex)
}


export const unpackEncodedTokenFromProperties = <T extends UniqueTokenToCreate>(properties: ProbablyDecodedProperty[], schema: UniqueCollectionSchemaToCreate | UniqueCollectionSchemaDecoded): T => {
  const token: T = {} as T

  const nameProperty = properties.find(({key}) => key === 'n')
  if (nameProperty) {
    const parsedName = decodeHexAndParseJSONOrReturnNull<LocalizedStringWithDefault>(nameProperty.valueHex)
    if (parsedName) token.name = parsedName
  }

  const descriptionProperty = properties.find(({key}) => key === 'd')
  if (descriptionProperty) {
    const parsedDescription = decodeHexAndParseJSONOrReturnNull<LocalizedStringWithDefault>(descriptionProperty.valueHex)
    if (parsedDescription) token.description = parsedDescription
  }

  fillTokenFieldByKeyPrefix(token, properties, 'i', 'image')
  fillTokenFieldByKeyPrefix(token, properties, 'p', 'imagePreview')
  fillTokenFieldByKeyPrefix(token, properties, 'v', 'video')
  fillTokenFieldByKeyPrefix(token, properties, 'au', 'audio')
  fillTokenFieldByKeyPrefix(token, properties, 'so', 'spatialObject')

  const attributeProperties = properties.filter(({key}) => key.startsWith('a.'))
  if (attributeProperties.length) {
    const attrs = {} as EncodedTokenAttributes

    for (const attrProp of attributeProperties) {
      const {key, valueHex} = attrProp
      const value = StringUtils.Utf8.hexStringToString(valueHex)
      const parsed = safeJsonParseStringOrHexString<any>(value)
      const attributeKey = parseInt(key.split('.')[1] || '')

      if (!isNaN(attributeKey) && schema.attributesSchema?.hasOwnProperty(attributeKey)) {
        attrs[attributeKey] = parsed
      }
    }

    token.encodedAttributes = attrs
  }

  return token
}


export const decodeTokenFromProperties = (collectionId: number, tokenId: number, owner: string | undefined, propertiesArray: ProbablyDecodedProperty[], schema: UniqueCollectionSchemaToCreate | UniqueCollectionSchemaDecoded): UniqueTokenDecoded => {
  const unpackedToken = unpackEncodedTokenFromProperties(propertiesArray, schema)

  validateUniqueToken(unpackedToken, schema)

  const token: UniqueTokenDecoded = {
    owner,
    tokenId,
    collectionId,
    attributes: fullDecodeTokenAttributes(unpackedToken, schema),
    image: decodeTokenUrlOrInfixOrCidWithHashField(unpackedToken.image, schema.image)
  }
  if (owner && Address.is.nestingAddress(owner)) {
    token.nestingParentToken = Address.nesting.addressToIds(owner)
  }

  if (unpackedToken.name) token.name = unpackedToken.name
  if (unpackedToken.description) token.description = unpackedToken.description

  if (unpackedToken.imagePreview) {
    token.imagePreview = decodeTokenUrlOrInfixOrCidWithHashField(unpackedToken.imagePreview, schema.imagePreview)
  }
  if (unpackedToken.video) {
    token.video = decodeTokenUrlOrInfixOrCidWithHashField(unpackedToken.video, schema.video)
  }
  if (unpackedToken.audio) {
    token.audio = decodeTokenUrlOrInfixOrCidWithHashField(unpackedToken.audio, schema.audio)
  }
  if (unpackedToken.spatialObject) {
    token.spatialObject = decodeTokenUrlOrInfixOrCidWithHashField(unpackedToken.spatialObject, schema.spatialObject)
  }
  if (unpackedToken.file) {
    token.file = decodeTokenUrlOrInfixOrCidWithHashField(unpackedToken.file, schema.file)
  }

  return token
}

export const fullDecodeTokenAttributes = (token: UniqueTokenToCreate, collectionSchema: UniqueCollectionSchemaToCreate | UniqueCollectionSchemaDecoded): DecodedAttributes => {
  const attributes: DecodedAttributes = {}
  if (!token.encodedAttributes) return {}

  const entries = getEntries(token.encodedAttributes)
  for (const entry of entries) {
    const [key, rawValue] = entry

    const schema = collectionSchema.attributesSchema?.[key]
    if (!schema) continue

    let value: any = rawValue

    if (schema.enumValues) {
      if (schema.isArray && Array.isArray(rawValue)) {
        value = rawValue
          .map(v => typeof v === 'number' ? schema.enumValues?.[v] : null)
          .filter(v => !!v)
      } else {
        if (typeof rawValue === 'number') {
          value = schema.enumValues[rawValue]
        }
      }
    }

    attributes[key] = {
      name: schema.name,
      value: value as LocalizedStringOrBoxedNumberWithDefault | Array<LocalizedStringOrBoxedNumberWithDefault>,
      isArray: schema.isArray || false,
      type: schema.type,
      rawValue,
      isEnum: !!schema.enumValues,
    }
  }
  return attributes
}
