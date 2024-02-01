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

export const decodeV0OrV1CollectionSchemaToIntermediate = (
  collectionId: number,
  properties: ProbablyDecodedProperty[] | undefined | null,
  options?: DecodingImageLinkOptions
): UniqueCollectionSchemaDecoded => {
  if (!properties || !properties.length) {
    throw new ValidationError(`Unable to parse: collection properties are empty`)
  }

  const schemaNameProp = properties.find(({key}) => key === 'schemaName')?.value || null
  const schemaName = typeof schemaNameProp === 'string' ? safeJsonParseStringOrHexString<string>(schemaNameProp) : null
  const isOldSchema = !!properties.find(({key}) => key === '_old_schemaVersion')


  if (isOldSchema) {
    return oldSchema.decodeOldSchemaCollection(collectionId, properties, options)
  } else if (schemaName === COLLECTION_SCHEMA_NAME.unique) {
    return collection.decodeUniqueCollectionFromProperties(collectionId, properties)
  }

  throw new ValidationError(`Unknown collection schema`)
}

export const decodeV0OrV1TokenToIntermediate = (
  collectionId: number,
  tokenId: number,
  owner: string,
  propertyArray: ProbablyDecodedProperty[] | undefined | null,
  schema: UniqueCollectionSchemaDecoded,
  imageLinkOptions?: DecodingImageLinkOptions
): UniqueTokenDecoded => {
  if (!schema) {
    throw new ValidationError('unable to parse: collection schema was not provided')
  }
  if (!propertyArray || !propertyArray.length) {
    throw new ValidationError(`unable to parse: token properties are empty`)
  }

  if (schema.schemaName === COLLECTION_SCHEMA_NAME.unique) {
    return token.decodeTokenFromProperties(collectionId, tokenId, owner, propertyArray, schema)
  } else if (schema.schemaName === COLLECTION_SCHEMA_NAME.old) {
    return oldSchema.decodeOldSchemaToken(collectionId, tokenId, owner, propertyArray, schema, imageLinkOptions)
  }

  throw new ValidationError(`unable to parse: collection schemaName is unknown (passed ${schema.schemaName}`)
}
