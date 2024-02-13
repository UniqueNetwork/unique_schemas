import {decodeCollectionToV2} from './decoding/collectionDecoding'
import {decodeTokenToV2} from './decoding/tokenDecoding'
import {encodeCollection, encodeToken} from './encoding'

export const SchemaTools = {
  decode: {
    collection: decodeCollectionToV2,
    token: decodeTokenToV2,
  },
  encode: {
    collection: encodeCollection,
    token: encodeToken,
  },
  tools: {},
}

export * from './types'
