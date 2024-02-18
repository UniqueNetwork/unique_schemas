import {decodeCollectionToV2} from './decoding/collectionDecoding'
import {decodeTokenToV2} from './decoding/tokenDecoding'
import {encodeCollection, encodeToken} from './encoding'
import * as schemas from './schema.zod'

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
  },
}

export * from './types'
export type * from './schema.zod'
