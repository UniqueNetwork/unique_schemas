import {
  DecodingImageLinkOptions,
  UniqueCollectionSchemaIntermediate,
  UniqueTokenIntermediate
} from './intermediate_types'

import * as decoders_v0 from './v0_to_intermediate'
import * as decoders_v1 from './v1_to_intermediate'
import {ValidationError} from './intermediate_types'
import {ProbablyDecodedProperty} from '../../types'

const DEFAULT_IMAGE_URL_TEMPLATE: string = `https://ipfs.unique.network/ipfs/{infix}`
const DEFAULT_DUMMY_IMAGE_FULL_URL = `https://ipfs.unique.network/ipfs/QmPCqY7Lmxerm8cLKmB18kT1RxkwnpasPVksA8XLhViVT7`

export const parseImageLinkOptions = (options?: DecodingImageLinkOptions): Required<DecodingImageLinkOptions> => {
  let imageUrlTemplate: string = DEFAULT_IMAGE_URL_TEMPLATE
  if (typeof options?.imageUrlTemplate === 'string') {
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
  isUniqueV0: boolean,
  isUniqueV1: boolean,
  options?: DecodingImageLinkOptions
): UniqueCollectionSchemaIntermediate => {
  if (!properties || !properties.length) {
    throw new ValidationError(`Unable to parse: collection properties are empty`)
  }

  if (isUniqueV0) {
    return decoders_v0.decodeOldSchemaCollection(collectionId, properties, options)
  } else if (isUniqueV1) {
    return decoders_v1.decodeUniqueCollectionFromProperties(collectionId, properties)
  }

  throw new ValidationError(`Unknown collection schema`)
}

export const decodeV0OrV1TokenToIntermediate = (
  collectionId: number,
  tokenId: number,
  owner: string | undefined,
  propertyArray: ProbablyDecodedProperty[] | undefined | null,
  schema: UniqueCollectionSchemaIntermediate,
  isUniqueV0: boolean,
  isUniqueV1: boolean,
  imageLinkOptions?: DecodingImageLinkOptions
): UniqueTokenIntermediate => {
  if (!schema) {
    throw new ValidationError('unable to parse: collection schema was not provided')
  }
  if (!propertyArray || !propertyArray.length) {
    throw new ValidationError(`unable to parse: token properties are empty`)
  }

  if (isUniqueV0) {
    return decoders_v0.decodeOldSchemaToken(collectionId, tokenId, owner, propertyArray, schema, imageLinkOptions)
  } else if (isUniqueV1) {
    return decoders_v1.decodeTokenFromProperties(collectionId, tokenId, owner, propertyArray, schema)
  }

  throw new ValidationError(`unable to parse: collection schemaName is unknown (passed ${schema.schemaName}`)
}
