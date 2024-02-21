import {
  AttributeSchema,
  AttributeType,
  CollectionAttributesSchema,
  DecodedAttributes,
  DecodedInfixOrUrlOrCidAndHash,
  DecodingImageLinkOptions,
  UniqueCollectionSchemaIntermediate,
  UniqueTokenIntermediate,
  ValidationError
} from "./intermediate_types";

import type {Message, Type} from 'protobufjs'
import {Root} from 'protobufjs'
import {StringUtils} from "@unique-nft/utils";
import {buildDictionaryFromPropertiesArray, safeJSONParse, safeJSONParseWithPossibleEmptyInput} from '../../utils'
import {COLLECTION_SCHEMA_FAMILY, DecodeTokenOptions, ProbablyDecodedProperty} from '../../types'
import {parseImageLinkOptions} from './index'


const isOffchainSchemaAValidUrl = (offchainSchema: string | undefined): offchainSchema is string => {
  return typeof offchainSchema === "string" && offchainSchema.indexOf('{id}') >= 0
}

export const decodeOldSchemaCollection = (properties: ProbablyDecodedProperty[], decodingImageLinkOptions?: DecodingImageLinkOptions): UniqueCollectionSchemaIntermediate => {
  const {imageUrlTemplate, dummyImageFullUrl} = parseImageLinkOptions(decodingImageLinkOptions)

  const propObj = properties.reduce((acc, {key, value, valueHex}) => {
    acc[key] = value ?? StringUtils.Utf8.hexStringToString(valueHex)
    return acc
  }, {} as Record<string, string>)

  const offchainSchema: string | undefined = propObj._old_offchainSchema
  const constOnchainSchema: string | undefined = propObj._old_constOnChainSchema
  const schemaVersion: string | undefined = propObj._old_schemaVersion
  const variableOnchainSchema: string | undefined = propObj._old_variableOnChainSchema

  const offchainSchemaIsValidUrl = isOffchainSchemaAValidUrl(offchainSchema)

  const schema: UniqueCollectionSchemaIntermediate = {
    schemaName: 'unique',
    schemaVersion: '0.0.1',
    schemaFamily: COLLECTION_SCHEMA_FAMILY.V0,

    coverPicture: {
      url: dummyImageFullUrl,
      fullUrl: null
    },
    image: {
      urlTemplate: offchainSchemaIsValidUrl
        ? offchainSchema.replace('{id}', '{infix}')
        : imageUrlTemplate
    },

    attributesSchema: {},
    attributesSchemaVersion: '1.0.0'
  }

  let parsedVariableOnchainSchema = null
  try {
    parsedVariableOnchainSchema = JSON.parse(variableOnchainSchema)
  } catch {
  }

  if (parsedVariableOnchainSchema && typeof parsedVariableOnchainSchema === 'object' && typeof parsedVariableOnchainSchema.collectionCover === 'string') {
    schema.coverPicture.ipfsCid = parsedVariableOnchainSchema.collectionCover
    delete schema.coverPicture.url
    schema.coverPicture.fullUrl = imageUrlTemplate.replace('{infix}', parsedVariableOnchainSchema.collectionCover)
  } else if (offchainSchemaIsValidUrl) {
    const coverUrl = offchainSchema.replace('{id}', '1')
    schema.coverPicture.url = coverUrl
    schema.coverPicture.fullUrl = coverUrl
  }


  let root: Root = {} as any
  let NFTMeta: Type = {} as any

  root = Root.fromJSON(JSON.parse(constOnchainSchema))
  NFTMeta = root.lookupType('onChainMetaData.NFTMeta')

  const attributesSchema: CollectionAttributesSchema = {}

  let i = 0;
  for (const field of NFTMeta.fieldsArray) {
    if (field.name === 'ipfsJson') {
      continue
    }

    const options = !['string', 'number'].includes(field.type) && root.lookupEnum(field.type).options || {}
    const values = !['string', 'number'].includes(field.type) && root.lookupEnum(field.type).values || {}

    const rawValueToDecodedValueDict: Record<number, any> = {}
    for (const [innerKey, realJSONStr] of Object.entries(options || {})) {
      const numberedKey = values[innerKey] as number | undefined
      if (typeof numberedKey !== 'number') continue

      const realJSON = safeJSONParseWithPossibleEmptyInput(realJSONStr) as any
      if (typeof realJSON === 'string') continue

      realJSON._ = realJSON._ || realJSON.en || realJSON[Object.keys(realJSON)[0]] || null
      if (typeof realJSON._ !== 'string') continue

      rawValueToDecodedValueDict[numberedKey] = realJSON
    }

    const attr: AttributeSchema = {
      type: AttributeType.string,
      name: {_: field.name},
      isArray: field.repeated,
      optional: !field.required,
    }
    if (Object.keys(rawValueToDecodedValueDict).length > 0) {
      attr.enumValues = rawValueToDecodedValueDict
    }

    attributesSchema[i++] = attr
  }

  schema.attributesSchema = attributesSchema
  schema.attributesSchemaVersion = '1.0.0'

  schema.oldProperties = {
    _old_schemaVersion: schemaVersion,
    _old_offchainSchema: offchainSchema,
    _old_constOnChainSchema: constOnchainSchema,
    _old_variableOnChainSchema: variableOnchainSchema,
  }

  return schema
}

export const decodeOldSchemaToken = (
  propertiesArray: ProbablyDecodedProperty[],
  schema: UniqueCollectionSchemaIntermediate,
  decodingImageLinkOptions?: DecodingImageLinkOptions,
  options?: DecodeTokenOptions
): UniqueTokenIntermediate => {
  const constOnchainSchema = schema.oldProperties?._old_constOnChainSchema

  if (!constOnchainSchema) {
    throw new ValidationError(`collection doesn't contain _old_constOnChainSchema field`)
  }

  const root = Root.fromJSON(JSON.parse(constOnchainSchema))
  const NFTMeta = root.lookupType('onChainMetaData.NFTMeta')


  if (!propertiesArray) {
    throw new ValidationError(`parsing token with old schema: no token properties passed`)
  }

  const props = buildDictionaryFromPropertiesArray(propertiesArray)

  const constDataProp = props._old_constData
  if (!constDataProp) {
    throw new ValidationError('no _old_constData property found')
  }

  const u8aToken = StringUtils.HexString.toU8a(constDataProp.valueHex)
  let tokenDecoded: Message<{}> = {} as any
  let tokenDecodedHuman: Record<string, any> = {}
  let tokenDecodedWithRawValues: Array<{
    name: string
    rawValue: typeof Message<{}>[keyof typeof Message<{}>]
    toJSONValue: any
  }> = []

  try {
    tokenDecoded = NFTMeta.decode(u8aToken)
    tokenDecodedHuman = tokenDecoded.toJSON()
    tokenDecodedWithRawValues = Object.entries(tokenDecoded).map(([name, rawValue], index) => ({
      name,
      rawValue: rawValue,
      toJSONValue: tokenDecodedHuman[name],
    }))
  } catch (err: any) {
    throw new ValidationError(`Unable to parse token with old schema, error on decoding Protobuf: ${err.message}`)
  }

  const tokenAttributesResult: DecodedAttributes = {}

  let i = 0
  for (const entry of tokenDecodedWithRawValues) {
    let {name, rawValue, toJSONValue} = entry
    if (name === 'ipfsJson') {
      continue
    }

    let value = toJSONValue
    let isArray = false
    let isEnum = false

    const field = tokenDecoded.$type.fields[name]

    if (!['string', 'number'].includes(field.type)) {
      const enumOptions = root.lookupEnum(field.type).options
      isEnum = !!enumOptions;

      if (field.repeated && Array.isArray(rawValue) && toJSONValue) {
        const parsedValues = toJSONValue
          .map((v: any) => {
            const parsed = safeJSONParse<any>(enumOptions?.[v] || v)
            if (typeof parsed !== 'string') {
              parsed._ = parsed.en
              return parsed
            } else {
              return null
            }
          })
          .filter((v: any) => typeof v?._ === 'string')

        value = parsedValues
        isArray = true
      } else {
        value = safeJSONParse(enumOptions?.[toJSONValue] || rawValue)
        if (typeof value !== 'string') {
          value._ = value.en || Object.values(value)[0]
        }
      }
    }

    if (field.type === 'string') value = {_: value}

    const schemaAttr = Object.entries(schema.attributesSchema!).find(([attrId, attrValue]) => {
      return attrValue.name._ === name
    })

    const index = schemaAttr ? schemaAttr[0] : i
    i += 1

    tokenAttributesResult[index as any] = {
      name: {_: name},
      type: field.type === 'number' ? AttributeType.float : AttributeType.string,
      value,
      isArray,
      isEnum,
      rawValue: isEnum ? rawValue as any : {_: rawValue},
    }
  }


  const schemaVersion = schema.oldProperties?._old_schemaVersion
  const offchainSchema = schema.oldProperties?._old_offchainSchema


  const {imageUrlTemplate, dummyImageFullUrl} = parseImageLinkOptions(decodingImageLinkOptions)

  let image: DecodedInfixOrUrlOrCidAndHash = {
    url: dummyImageFullUrl,
    fullUrl: null,
  }

  let ipfsImageIsSet = false
  if (schemaVersion === 'Unique') {
    try {
      const ipfsCid = JSON.parse(tokenDecodedHuman.ipfsJson).ipfs
      image = {
        ipfsCid,
        fullUrl: imageUrlTemplate.replace('{infix}', ipfsCid)
      }
      ipfsImageIsSet = true
    } catch {
    }
  }

  if (!ipfsImageIsSet && isOffchainSchemaAValidUrl(offchainSchema)) {
    const tokenId = options?.tokenId?.toString()
    if (!tokenId) {
      throw new ValidationError(`Decoding token in Unique schema v0: tokenId is required to parse this token and it is not provided. Please pass it inside options param.`)
    }
    image = {
      urlInfix: tokenId,
      fullUrl: offchainSchema.replace('{id}', tokenId)
    }
  }

  const decodedToken: UniqueTokenIntermediate = {
    image,
    attributes: tokenAttributesResult,
  }

  return decodedToken
}
