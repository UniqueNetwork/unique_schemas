import {HumanizedNftToken, PropertiesArray} from "../unique_types";
import {DecodingResult} from "../schemaUtils";
import {
  COLLECTION_SCHEMA_NAME,
  DecodingImageLinkOptions,
  UniqueCollectionSchemaDecoded,
  UniqueTokenDecoded,
  UrlTemplateString
} from "../types";
import * as oldSchema from "./oldSchemaDecoder";
import * as collection from "./collection";
import {ValidationError} from "../types";
import * as token from "./token";
import {validateUrlTemplateStringSafe} from "./validators";
import {safeJSONParse, safeJsonParseStringOrHexString} from "../tsUtils";
import {ProbablyDecodedProperty} from '../v3/types'

type UpDataStructsTokenData = any

const DEFAULT_IMAGE_URL_TEMPLATE: UrlTemplateString = `https://ipfs.unique.network/ipfs/{infix}`
const DEFAULT_DUMMY_IMAGE_FULL_URL = `https://ipfs.unique.network/ipfs/QmPCqY7Lmxerm8cLKmB18kT1RxkwnpasPVksA8XLhViVT7`


export const parseImageLinkOptions = (options?: DecodingImageLinkOptions): Required<DecodingImageLinkOptions> => {
  let imageUrlTemplate: UrlTemplateString = DEFAULT_IMAGE_URL_TEMPLATE
  if (validateUrlTemplateStringSafe(options?.imageUrlTemplate, 'options.imageUrlTemplate')) {
    imageUrlTemplate = options!.imageUrlTemplate
  }

  const dummyImageFullUrl = typeof options?.dummyImageFullUrl === 'string'
    ? options.dummyImageFullUrl
    : DEFAULT_DUMMY_IMAGE_FULL_URL

  return {
    imageUrlTemplate,
    dummyImageFullUrl,
  }
}


type TMP_ANY_REMOVE_ME = any

export const universallyDecodeCollectionSchemaV0OrV1ToIntermediateRepresentation = async (collectionId: number, properties: ProbablyDecodedProperty[], options?: DecodingImageLinkOptions): Promise<DecodingResult<UniqueCollectionSchemaDecoded>> => {
  const schemaNameProp = properties.find(({key}) => key === 'schemaName')?.value || null
  const schemaName = typeof schemaNameProp === 'string' ? safeJsonParseStringOrHexString<string>(schemaNameProp) : null
  const isOldSchema = !!properties.find(({key}) => key === '_old_schemaVersion')

  if (isOldSchema) {
    return await oldSchema.decodeOldSchemaCollection(collectionId, properties as TMP_ANY_REMOVE_ME, options)
  } else if (schemaName === COLLECTION_SCHEMA_NAME.unique) {
    return await collection.decodeUniqueCollectionFromProperties(collectionId, properties)
  }

  return {
    result: null,
    error: new ValidationError(`Unknown collection schema`)
  }
}

export const universallyDecodeTokenV0OrV1ToIntermediateRepresentation = async (collectionId: number, tokenId: number, owner: string, propertyArray: ProbablyDecodedProperty[], schema: UniqueCollectionSchemaDecoded, imageLinkOptions?: DecodingImageLinkOptions): Promise<DecodingResult<UniqueTokenDecoded>> => {
  if (!schema) {
    return {
      result: null,
      error: new ValidationError('unable to parse: collection schema was not provided')
    }
  }

  if (schema.schemaName === COLLECTION_SCHEMA_NAME.unique) {
    return await token.decodeTokenFromProperties(collectionId, tokenId, owner, propertyArray, schema)
  } else if (schema.schemaName === COLLECTION_SCHEMA_NAME.old) {
    return await oldSchema.decodeOldSchemaToken(collectionId, tokenId, owner, propertyArray, schema, imageLinkOptions)
  }

  return {
    result: null,
    error: new ValidationError(`unable to parse: collection schemaName is unknown (passed ${schema.schemaName}`)
  }
}
