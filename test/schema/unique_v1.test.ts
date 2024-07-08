import {describe, test, expect} from 'vitest'

import {AttributeType, SchemaTools, UniqueCollectionSchemaDecoded, UniqueTokenToCreate} from '../../src'
import {decodeTokenFromProperties} from '../../src/tools/token'
import {ETH_DEFAULT, SUB_PRIMARY_ONLY} from '../royalties.samples'
import {makeRawTokenFromProperties} from './utils'
import {ChainLenses} from '@unique-nft/utils/chainLens';
import { expectedCollectionSchema, expectedTokenSchema } from '../samples/realCollectionAndTokenSchemas'

// https://ipfs.unique.network/ipfs/QmPCqY7Lmxerm8cLKmB18kT1RxkwnpasPVksA8XLhViVT7
const schema = {
  schemaName: 'unique',
  schemaVersion: '1.0.0',
  coverPicture: {
    ipfsCid: 'QmPCqY7Lmxerm8cLKmB18kT1RxkwnpasPVksA8XLhViVT7'
  },
  image: {
    urlTemplate: `https://ipfs.unique.network/ipfs/{infix}`,
  },
  imagePreview: {
    urlTemplate: `https://ipfs.unique.network/ipfs/{infix}`,
  },
  file: {
    urlTemplate: `https://ipfs.unique.network/ipfs/{infix}`,
  },
  attributesSchemaVersion: '1.0.0',
  attributesSchema: {
    0: {
      name: {_: 'string attr'},
      type: AttributeType.string,
    },
    1: {
      name: {_: 'number attr'},
      type: AttributeType.number,
    },
    2: {
      name: {_: 'url attr'},
      type: AttributeType.url,
    }
  },
  royalties: [SUB_PRIMARY_ONLY.decoded],
}

const tokenToEncode: UniqueTokenToCreate = {
  image: {
    ipfsCid: `QmPCqY7Lmxerm8cLKmB18kT1RxkwnpasPVksA8XLhViVT7`
  },
  file: {
    ipfsCid: `QmPCqY7Lmxerm8cLKmB18kT1RxkwnpasPVksA8XLhViVT7`
  },
  encodedAttributes: {
    0: {_: `Lorem ipsum`},
    1: {_: -7.05},
    2: {_: `https://ipfs.unique.network/ipfs/QmPCqY7Lmxerm8cLKmB18kT1RxkwnpasPVksA8XLhViVT7`}
  },
  royalties: [ETH_DEFAULT.decoded],
}


describe('unique v1', async () => {
  test('basic, image and file fields', async () => {
    console.log('schema')
    console.dir(schema, {depth: 100})

    const encodedSchema = SchemaTools.encodeUnique.collectionSchema(schema)
    const encodedTPPs = SchemaTools.encodeUnique.collectionTokenPropertyPermissions(schema)

    console.log('\n\nencoded schema properties')
    console.dir(encodedSchema, {depth: 100})

    console.log('encoded schema TPPs')
    console.dir(encodedTPPs, {depth: 100})


    const decodedSchema = await SchemaTools.decode.collectionSchema(1, encodedSchema, {})

    if (!decodedSchema.result) {
      throw decodedSchema.error
    }

    console.log('\n\ndecoded schema')
    console.dir(decodedSchema.result, {depth: 100})

    console.log('\n\ntoken to encode:')
    console.dir(tokenToEncode, {depth: 100})

    const encodedToken = SchemaTools.encodeUnique.token(tokenToEncode, decodedSchema.result)

    console.log('\n\nencodedToken:')
    console.dir(encodedToken, {depth: 100})

    const rawToken = {owner: {Substrate: '123'}, properties: encodedToken}

    const decodedToken1 = await decodeTokenFromProperties(1,1, rawToken, schema)
    if (!decodedToken1.result) {
      throw decodedToken1.error
    }

    console.log('\n\ndecodedToken:')
    console.dir(decodedToken1.result, {depth: 100})

    const decodedToken2 = await decodeTokenFromProperties(1,1, rawToken, decodedSchema.result)

    if (!decodedToken2.result) {
      throw decodedToken2.error
    }

    console.log('\n\ndecodedToken with decoded schema:')
    console.dir(decodedToken2, {depth: 100})

    const decodedTokensAreSame = JSON.stringify(decodedToken1.result) === JSON.stringify(decodedToken2.result)

    expect(decodedTokensAreSame).toBe(true)

    console.log('Decoded tokens are same:', decodedTokensAreSame)
  })

  test('RFT sample - no owner', async () => {
    const encodedToken = SchemaTools.encodeUnique.token(tokenToEncode, schema)
    const rawToken = {owner: null, properties: encodedToken}

    const decodedToken = await decodeTokenFromProperties(1,1, rawToken, schema)

    expect(decodedToken.error).toBeFalsy()
    expect(decodedToken.result).toBeDefined()
  })
})

describe('unique v1 - royalties', async () => {
  test('Royalties - create a TPP', () => {
    const properties = SchemaTools.encodeUnique.collectionSchema(schema)
    const TPPs = SchemaTools.encodeUnique.collectionTokenPropertyPermissions(schema)

    const royaltyTPP = TPPs.find(tpp => tpp.key === 'royalties')
    expect(royaltyTPP).toBeDefined()
    expect(royaltyTPP?.permission).to.deep.equal({mutable: false, collectionAdmin: true, tokenOwner: false})
  })

  test('Royalties - encode to collection properties', () => {
    const properties = SchemaTools.encodeUnique.collectionSchema(schema)
    const TPPs = SchemaTools.encodeUnique.collectionTokenPropertyPermissions(schema)

    const property = properties.find(p => p.key === 'royalties')
    expect(property).toBeDefined()
    expect(property?.key).to.equal('royalties')
    expect(property?.value).to.deep.equal(SUB_PRIMARY_ONLY.encoded)
  })

  test('Royalties - encode to token properties', () => {
    const tokenProperties = SchemaTools.encodeUnique.token(tokenToEncode, schema)

    const property = tokenProperties.find(p => p.key === 'royalties')
    expect(property).toBeDefined()
    expect(property?.key).to.equal('royalties')
    expect(property?.value).to.deep.equal(ETH_DEFAULT.encoded)
  })

  test('Royalties - decode from collection properties', async () => {
    const properties = SchemaTools.encodeUnique.collectionSchema(schema)
    const TPPs = SchemaTools.encodeUnique.collectionTokenPropertyPermissions(schema)

    const decoded = await SchemaTools.decode.collectionSchema(1, properties, {})
    console.log('decoded', decoded.error)
    expect(decoded.error).toBeFalsy()
    // expect(decoded.result).toBeDefined()
    //
    // const decodedRoyalties = decoded.result?.royalties
    // expect(decodedRoyalties).toBeDefined()
    // expect(decodedRoyalties).to.deep.equal([SUB_PRIMARY_ONLY.decoded])
  })

  test('Royalties - decode from token properties', async () => {
    const tokenProperties = SchemaTools.encodeUnique.token(tokenToEncode, schema)

    const decoded = await SchemaTools.decode.token(646, 4, makeRawTokenFromProperties(null, tokenProperties), schema as any, (() => {}) as any, [])
    expect(decoded.error).toBeFalsy()
    expect(decoded.result).toBeDefined()

    const decodedRoyalties = decoded.result?.royalties
    expect(decodedRoyalties).toBeDefined()
    expect(decodedRoyalties).to.deep.equal([ETH_DEFAULT.decoded])
  })
})

describe('unique v2', () => {
  test('v1 decode has basic support of v2 collections and tokens', async () => {
    const COLLECTION = 2970;
    const TOKEN = 1;

    const lens = ChainLenses.opal;
    const token = await lens.requestNftToken(COLLECTION, TOKEN);

    const collection = await lens.requestCollection(COLLECTION);
    const decodedCollection = await SchemaTools.decode.collectionSchema(COLLECTION, collection!.properties, {erc721metadata: false, foreign: false})

    const raw = makeRawTokenFromProperties(null, token!.properties);
    const decodedToken = await SchemaTools.decode.token(COLLECTION, TOKEN, raw, decodedCollection.result as any, (() => {}) as any, [])

    expect(decodedCollection.result).to.deep.eq(expectedCollectionSchema);
    expect(decodedToken.result).to.deep.eq(expectedTokenSchema);
  });
})
