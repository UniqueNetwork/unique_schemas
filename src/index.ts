import {decodeCollectionToV2} from './decoding/collectionDecoding'
import {decodeTokenToV2} from './decoding/tokenDecoding'

export const SchemaTools = {
  decode: {
    collectionSchema: decodeCollectionToV2,
    token: decodeTokenToV2,
  },
  encodeUnique: {
    collection: () => { throw new Error('Not implemented') },
    token: () => { throw new Error('Not implemented') },
  },
  tools: {},
}
