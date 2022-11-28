import {
  AttributeSchema,
  AttributeType,
  COLLECTION_SCHEMA_NAME,
  CollectionAttributesSchema,
  DecodedAttributes,
  DecodedInfixOrUrlOrCidAndHash,
  DecodingImageLinkOptions,
  LocalizedStringWithDefault,
  UniqueCollectionSchemaDecoded,
  UniqueTokenDecoded,
  UrlTemplateString
} from "../types";
import {validateURLSafe} from "./validators";

import {DecodingResult} from "../schemaUtils";
import {CrossAccountId, HumanizedNftToken} from "../unique_types";
import type {Message, Type} from 'protobufjs'
import {Root} from 'protobufjs'
import {ValidationError} from "../types";
import {getEntries, getKeys, getValues, safeJSONParse} from "../tsUtils";
import {StringUtils, Address} from "@unique-nft/utils";
import {PropertiesArray} from "../unique_types";


const isOffchainSchemaAValidUrl = (offchainSchema: string | undefined): offchainSchema is string => {
  return typeof offchainSchema === "string" &&
    validateURLSafe(offchainSchema, 'offchainSchema') &&
    offchainSchema.indexOf('{id}') >= 0
}

export const decodeOldSchemaCollection = async (collectionId: number, properties: PropertiesArray, options: Required<DecodingImageLinkOptions>): Promise<DecodingResult<UniqueCollectionSchemaDecoded>> => {
  const {imageUrlTemplate, dummyImageFullUrl} = options

  const propObj = properties.reduce((acc, {key, value}) => {
    acc[key] = value;
    return acc
  }, {} as Record<string, string>)

  const offchainSchema: string | undefined = propObj._old_offchainSchema
  const constOnchainSchema: string | undefined = propObj._old_constOnChainSchema
  const schemaVersion: string | undefined = propObj._old_schemaVersion
  const variableOnchainSchema: string | undefined = propObj._old_variableOnChainSchema

  const offchainSchemaIsValidUrl = isOffchainSchemaAValidUrl(offchainSchema)

  const schema: UniqueCollectionSchemaDecoded = {
    schemaName: COLLECTION_SCHEMA_NAME.old,

    collectionId,
    coverPicture: {
      url: dummyImageFullUrl,
      fullUrl: null
    },
    image: {
      urlTemplate: offchainSchemaIsValidUrl
        ? offchainSchema.replace('{id}', '{infix}') as UrlTemplateString
        : imageUrlTemplate
    },

    schemaVersion: '0.0.1',
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
  try {
    root = Root.fromJSON(JSON.parse(constOnchainSchema))
    NFTMeta = root.lookupType('onChainMetaData.NFTMeta')
  } catch (err: any) {
    return {
      result: null,
      error: err as Error,
    }
  }

  const attributesSchema: CollectionAttributesSchema = {}

  let i = 0;
  for (const field of NFTMeta.fieldsArray) {
    if (field.name === 'ipfsJson') {
      continue
    }

    const options = !['string', 'number'].includes(field.type) && root.lookupEnum(field.type).options;

    const parsedOptions: LocalizedStringWithDefault[] = options
      ? getValues(options)
        .map(v => safeJSONParse<{ en: string | undefined }>(v))
        .filter(v => typeof v !== 'string' && typeof v.en === 'string')
        .map(v => {
          const result: any = {...(v as any)}
          if (typeof result._ === 'string') return result

          result._ = result.en || result[getKeys(result)[0]] || undefined

          if (typeof result._ !== 'string') return null

          return result;
        })
        .filter(v => !!v)
      : []

    const attr: AttributeSchema = {
      type: AttributeType.string,
      name: {_: field.name},
      isArray: field.repeated,
      optional: !field.required,
    }
    if (parsedOptions.length) {
      attr.enumValues = parsedOptions.reduce(
        (acc, el, index) => {
          acc[index] = el
          return acc
        },
        {} as { [K: number]: LocalizedStringWithDefault }
      )
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

  return {result: schema, error: null}
}

//todo: replace rawToken type with humanized token after core team's fix
export const decodeOldSchemaToken = async (collectionId: number, tokenId: number, rawToken: { owner: any, properties: any[] }, schema: UniqueCollectionSchemaDecoded, options: Required<DecodingImageLinkOptions>): Promise<DecodingResult<UniqueTokenDecoded>> => {
  const constOnchainSchema = schema.oldProperties?._old_constOnChainSchema

  if (!constOnchainSchema) {
    return {
      result: null,
      error: new ValidationError(`collection doesn't contain _old_constOnChainSchema field`)
    }
  }

  let root: Root = {} as any
  let NFTMeta: Type = {} as any
  try {
    root = Root.fromJSON(JSON.parse(constOnchainSchema))
    NFTMeta = root.lookupType('onChainMetaData.NFTMeta')
  } catch (err: any) {
    return {
      result: null,
      error: err as Error,
    }
  }

  if (!rawToken) {
    return {
      result: null,
      error: new ValidationError(`parsing token with old schema: no token passed`)
    }
  }

  const parsedToken: HumanizedNftToken = {
    owner: rawToken.owner.toHuman() as CrossAccountId,
    properties: rawToken.properties.map(property => {
      return {
        key: property.key.toHuman() as string,
        value: property.value.toJSON() as string,
        // valueH: property.value.toHuman() as string,
      }
    })
  }

  const constDataProp = parsedToken.properties.find(({key}) => key === '_old_constData')
  if (!constDataProp) {
    return {
      result: null,
      error: new ValidationError('no _old_constData property found')
    }
  }

  const u8aToken = StringUtils.HexString.toU8a(constDataProp.value)
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
    tokenDecodedWithRawValues = getEntries(tokenDecoded).map(([name, rawValue], index) => ({
      name,
      rawValue: rawValue,
      toJSONValue: tokenDecodedHuman[name],
    }))
  } catch (err: any) {
    return {
      result: null,
      error: err
    }
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
          value._ = value.en || getValues(value)[0]
        }
      }
    }

    if (field.type === 'string') value = {_: value}

    const schemaAttr = getEntries(schema.attributesSchema!).find(([attrId, attrValue]) => {
      return attrValue.name._ === name
    })

    const index = schemaAttr ? schemaAttr[0] : i
    i += 1

    tokenAttributesResult[index] = {
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


  const {imageUrlTemplate, dummyImageFullUrl} = options

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
    image = {
      urlInfix: tokenId.toString(),
      fullUrl: offchainSchema.replace('{id}', tokenId.toString())
    }
  }

  const decodedToken: UniqueTokenDecoded = {
    collectionId,
    tokenId,
    owner: parsedToken.owner,
    image,
    attributes: tokenAttributesResult,
  }

  if (parsedToken.owner.Ethereum && Address.is.nestingAddress(parsedToken.owner.Ethereum)) {
    decodedToken.nestingParentToken = Address.nesting.addressToIds(parsedToken.owner.Ethereum)
  }

  return {
    result: decodedToken,
    error: null,
  }
}
