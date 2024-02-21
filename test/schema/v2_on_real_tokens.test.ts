import {describe, expect, test} from 'vitest'
import {SchemaTools} from 'src'
import {SCHEMA_NAME, SCHEMA_VERSION} from '../../src/constants'
import {ChainLenses} from '@unique-nft/utils/chainLens'

const SCHEMA_NAME_AND_VERSION = {
  schemaName: SCHEMA_NAME,
  schemaVersion: SCHEMA_VERSION,
}

describe('Encoding and decoding collection and token in schemas v2', async () => {
  const lens = ChainLenses.opal
  const COLLECTION_ID = 2425
  const TOKEN_ID = 1

  test('Decoding existing collection in v2', async () => {
    const collection = await lens.requestCollection(COLLECTION_ID)

    expect(collection!.name).to.toBeDefined()
    const decodedCollection = await SchemaTools.decode.collection(collection!.properties)
    // console.dir(decodedCollection, {depth: 100})

    expect(
      SchemaTools.tools.schemas.zCollectionSchema.safeParse(decodedCollection).success
    ).to.be.true
  })

  test('Decoding existing token in v2', async () => {
    const token = await lens.requestNftToken(COLLECTION_ID, TOKEN_ID)
    expect(token).to.toBeDefined()

    const decodedToken = await SchemaTools.decode.token(token!.properties)
    // console.dir(decodedToken, {depth: 100})

    expect(
      SchemaTools.tools.schemas.zTokenSchema.safeParse(decodedToken).success
    ).to.be.true
  })
})
