import {decodeCollectionToV2} from './decoding/collectionDecoding'
import {decodeTokenToV2} from './decoding/tokenDecoding'
import {encodeCollection, encodeToken} from './encoding'
import * as schemas from './schema.zod'
import {
  decodeV0OrV1CollectionSchemaToIntermediate,
  decodeV0OrV1TokenToIntermediate,
  parseImageLinkOptions
} from './tools/old_to_intermediate'

export const SchemaTools = {
  decode: {
    collection: decodeCollectionToV2,
    token: decodeTokenToV2,
  },
  encode: {
    collection: encodeCollection,
    token: encodeToken,
  },
  tools: {
    schemas,
    decodeOld: {
      collection: decodeV0OrV1CollectionSchemaToIntermediate,
      token: decodeV0OrV1TokenToIntermediate,
      utils: {
        parseImageLinkOptions
      },
    },
  },
}

export * from './types'
export type * from './schema.zod'
