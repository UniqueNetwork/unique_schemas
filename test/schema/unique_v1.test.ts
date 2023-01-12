import {describe, test, expect} from 'vitest'

import {AttributeType, SchemaTools, UniqueTokenToCreate} from '../../src'
import {decodeTokenFromProperties} from '../../src/tools/token'

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
  }
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
