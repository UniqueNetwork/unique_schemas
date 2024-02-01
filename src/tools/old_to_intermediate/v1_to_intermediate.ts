import {
  DecodedInfixOrUrlOrCidAndHash,
  UniqueCollectionSchemaIntermediate,
  URL_TEMPLATE_INFIX
} from './intermediate_types'

import {ProbablyDecodedProperty} from '../../types'
import {StringUtils} from '@unique-nft/utils'
import {decodeHexAndParseJSONOrReturnNull} from '../../utils'


import {
  DecodedAttributes,
  EncodedTokenAttributes,
  InfixOrUrlOrCidAndHash, LocalizedStringOrBoxedNumberWithDefault, LocalizedStringWithDefault,
  UniqueTokenIntermediate
} from './intermediate_types'
import {Address} from "@unique-nft/utils/address";



export const decodeTokenUrlOrInfixOrCidWithHashField = <U extends { urlTemplate?: string }>(obj: InfixOrUrlOrCidAndHash, urlTemplateObj: U | undefined): DecodedInfixOrUrlOrCidAndHash => {
  const result: DecodedInfixOrUrlOrCidAndHash = {
    ...obj,
    fullUrl: null
  }

  if (typeof obj.url === 'string') {
    result.fullUrl = obj.url
    return result
  }

  const urlTemplate = urlTemplateObj?.urlTemplate

  if (typeof urlTemplate !== 'string' || urlTemplate.indexOf(URL_TEMPLATE_INFIX) < 0) {
    if (typeof obj.ipfsCid === 'string') {
      result.fullUrl = `ipfs://${obj.ipfsCid}`
    }
  } else {
    if (typeof obj.urlInfix === 'string') {
      result.fullUrl = urlTemplate.replace(URL_TEMPLATE_INFIX, obj.urlInfix)
    } else if (typeof obj.ipfsCid === 'string') {
      result.fullUrl = urlTemplate.replace(URL_TEMPLATE_INFIX, obj.ipfsCid)
    }
  }

  return result
}


const convertPropertyArrayTo2layerObject = <T extends object>(properties: ProbablyDecodedProperty[], separator: string): T => {
  const obj: any = {}

  for (let {key, valueHex} of properties) {
    const keyParts = key.split(separator)
    const length = keyParts.length
    if (length === 1) {
      obj[key] = decodeHexAndParseJSONOrReturnNull(valueHex)
    } else {
      const [key, innerKey] = keyParts
      if (typeof obj[key] !== 'object') {
        obj[key] = {}
      }
      obj[key][innerKey] = decodeHexAndParseJSONOrReturnNull(valueHex)
    }
  }
  return obj as T
}


export const decodeUniqueCollectionFromProperties = (collectionId: number, properties: ProbablyDecodedProperty[]): UniqueCollectionSchemaIntermediate => {
  const unpackedSchema: UniqueCollectionSchemaIntermediate = convertPropertyArrayTo2layerObject(properties, '.') as any
  // validateUniqueCollectionSchema(unpackedSchema)
  unpackedSchema.collectionId = collectionId as number

  if (unpackedSchema.coverPicture) {
    unpackedSchema.coverPicture = decodeTokenUrlOrInfixOrCidWithHashField(unpackedSchema.coverPicture, unpackedSchema.image)
  }
  if (unpackedSchema.coverPicturePreview) {
    unpackedSchema.coverPicturePreview = decodeTokenUrlOrInfixOrCidWithHashField(unpackedSchema.coverPicturePreview, unpackedSchema.image)
  }

  return unpackedSchema
}


//////////////////////////////////////////////////////
// token in schema v1 decoding
//////////////////////////////////////////////////////
const fillTokenFieldByKeyPrefix = <T extends UniqueTokenIntermediate>(token: T, properties: ProbablyDecodedProperty[], prefix: string, tokenField: keyof T) => {
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


export const unpackEncodedTokenFromProperties = <T extends UniqueTokenIntermediate>(properties: ProbablyDecodedProperty[], schema: UniqueCollectionSchemaIntermediate): T => {
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
      const parsed = decodeHexAndParseJSONOrReturnNull<any>(valueHex)
      const attributeKey = parseInt(key.split('.')[1] || '')

      if (!isNaN(attributeKey) && schema.attributesSchema?.hasOwnProperty(attributeKey)) {
        attrs[attributeKey] = parsed
      }
    }

    token.encodedAttributes = attrs
  }

  return token
}


export const decodeTokenFromProperties = (collectionId: number, tokenId: number, owner: string | undefined, propertiesArray: ProbablyDecodedProperty[], schema: UniqueCollectionSchemaIntermediate): UniqueTokenIntermediate => {
  const unpackedToken = unpackEncodedTokenFromProperties(propertiesArray, schema)

  const token: UniqueTokenIntermediate = {
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

export const fullDecodeTokenAttributes = (token: UniqueTokenIntermediate, collectionSchema: UniqueCollectionSchemaIntermediate): DecodedAttributes => {
  const attributes: DecodedAttributes = {}
  if (!token.encodedAttributes) return {}

  const entries = Object.entries(token.encodedAttributes)
  for (const entry of entries) {
    const [key, rawValue] = entry

    const schema = collectionSchema.attributesSchema?.[key as any]
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

    attributes[key as any] = {
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
