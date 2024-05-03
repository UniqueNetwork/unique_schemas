import {
  DecodingImageLinkOptions,
  UniqueCollectionSchemaIntermediate,
  UniqueTokenIntermediate,
  ValidationError
} from './intermediate_types'

import * as decoders_v0 from './v0_to_intermediate'
import * as decoders_v1 from './v1_to_intermediate'
import {COLLECTION_SCHEMA_FAMILY, DecodeTokenOptions, ProbablyDecodedProperty} from '../../types'
import {Address} from '@unique-nft/utils'
import {Royalties} from '@unique-nft/utils/royalties'

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
  properties: ProbablyDecodedProperty[] | undefined | null,
  schemaFamily: COLLECTION_SCHEMA_FAMILY,
  options?: DecodingImageLinkOptions
): UniqueCollectionSchemaIntermediate => {
  if (!properties || !properties.length) {
    throw new ValidationError(`Unable to parse: collection properties are empty`)
  }

  const result = (schemaFamily === COLLECTION_SCHEMA_FAMILY.V0)
    ? decoders_v0.decodeOldSchemaCollection(properties, options)
    : (schemaFamily === COLLECTION_SCHEMA_FAMILY.V1)
      ? decoders_v1.decodeUniqueCollectionFromProperties(properties)
      : null

  if (!result) throw new ValidationError(`Unknown collection schema: "${schemaFamily}"`)

  const royaltyEncoded = properties.find(p => p.key === 'royalties')?.valueHex
  const royalties = royaltyEncoded ? Royalties.uniqueV2.decode(royaltyEncoded) : []
  if (royalties.length) result.royalties = royalties

  return result
}

export const decodeV0OrV1TokenToIntermediate = (
  propertyArray: ProbablyDecodedProperty[] | undefined | null,
  schema: UniqueCollectionSchemaIntermediate,
  options?: DecodeTokenOptions,
  imageLinkOptions?: DecodingImageLinkOptions
): UniqueTokenIntermediate => {
  if (!schema) {
    throw new ValidationError('unable to parse: collection schema was not provided')
  }
  if (!propertyArray || !propertyArray.length) {
    throw new ValidationError(`unable to parse: token properties are empty`)
  }

  const decodedToken = schema.schemaFamily === COLLECTION_SCHEMA_FAMILY.V0
    ? decoders_v0.decodeOldSchemaToken(propertyArray, schema, imageLinkOptions, options)
    : schema.schemaFamily === COLLECTION_SCHEMA_FAMILY.V1
      ? decoders_v1.decodeTokenFromProperties(propertyArray, schema, options)
      : null

  if (!decodedToken) {
    throw new ValidationError(`Unknown token schema`)
  }

  const owner = options?.tokenOwner
  if (owner && Address.is.nestingAddress(owner)) {
    decodedToken.nestingParentToken = Address.nesting.addressToIds(owner)
  }

  return decodedToken
}
