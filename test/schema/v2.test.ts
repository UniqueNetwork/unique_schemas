import type {ICollection, INftToken} from '@unique-nft/utils/chainLens'

import {describe, test, expect, beforeAll} from 'vitest'
import {ChainLenses} from '@unique-nft/utils/chainLens'
import type {UniqueCollectionSchemaIntermediate} from '../../src'
import {decodeV0OrV1CollectionSchemaToIntermediate} from '../../src/tools/old_to_intermediate'
import {decodeTokenToV2} from '../../src/decoding/tokenDecoding'
import {IV2Collection, IV2Token} from '../../src/schema.zod'
import {decodeCollectionToV2} from '../../src/decoding/collectionDecoding'

const V0_PUNK_IN_V2_FORM: IV2Token = {
  schemaName: 'unique',
  schemaVersion: '2.0.0',
  originalSchemaVersion: '0.0.1',
  image: 'https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image1.png',
  attributes: [
    { trait_type: 'gender', value: 'Male' },
    { trait_type: 'traits', value: 'Teeth Smile' },
    { trait_type: 'traits', value: 'Up Hair' }
  ]
}

const V1_PUNK_IN_V2_FORM: IV2Token = {
  schemaName: 'unique',
  schemaVersion: '2.0.0',
  originalSchemaVersion: '1.0.0',
  image: 'https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image1.png',
  attributes: [
    { trait_type: 'gender', value: 'Female' },
    { trait_type: 'traits', value: 'Teeth Smile' },
    { trait_type: 'traits', value: 'Up Hair' }
  ],
  royalties: [
    {
      address: '5H684Wa69GpbgwQ7w9nZyzVpDmEDCTexhRNmZ7mkqM1Rt7dH',
      percent: 0.5
    }
  ]
}

const V0_COLLECTION_IN_V2_FORM: IV2Collection  = {
  schemaName: 'unique',
  schemaVersion: '2.0.0',
  originalSchemaVersion: '0.0.1',
  name: 'SubstraPunks',
  description: 'First NFT collection in polkadot space',
  symbol: 'PNK',
  tokenPrefix: 'PNK',
  cover_image: {
    url: 'https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image1.png'
  }
}

const V1_COLLECTION_IN_V2_FORM: IV2Collection = {
  ...JSON.parse(JSON.stringify(V0_COLLECTION_IN_V2_FORM)),
  originalSchemaVersion: '1.0.0',
  description: 'First NFT collection in Polkadot and Kusama space',
}


describe('Decoding collection and token in schemas v0 and v1 to v2', async () => {
  let punkV0Collection: ICollection | null = null
  let punkV1Collection: ICollection | null = null

  let punkV0Schema: UniqueCollectionSchemaIntermediate | null = null
  let punkV1Schema: UniqueCollectionSchemaIntermediate | null = null

  let punkV0Token: INftToken | null = null
  let punkV1Token: INftToken | null = null

  beforeAll(async () => {
    [punkV0Collection, punkV1Collection, punkV0Token, punkV1Token] = await Promise.all([
      ChainLenses.quartz.requestCollection(1),
      ChainLenses.unique.requestCollection(1),
      ChainLenses.quartz.requestNftToken(1, 1),
      ChainLenses.unique.requestNftToken(1, 1),
    ])

    if (!punkV0Collection) {
      throw new Error('No punk v0 collection')
    }
    if (!punkV1Collection) {
      throw new Error('No punk v1 collection')
    }

    punkV0Schema = decodeV0OrV1CollectionSchemaToIntermediate(1, punkV0Collection.properties)
    punkV1Schema = decodeV0OrV1CollectionSchemaToIntermediate(1, punkV1Collection.properties)
  })

  test('v0 decode token to v2', async () => {
    const decodeV0 = async () => await decodeTokenToV2({
      collectionId: 1,
      tokenId: 1,
      collectionProperties: punkV0Collection!.properties,
      tokenProperties: punkV0Token!.properties,
    })

    await expect(decodeV0()).resolves.toBeDefined()

    const punkV0 = await decodeV0()
    expect(punkV0).toEqual(V0_PUNK_IN_V2_FORM)
  })

  test('v1 decode token to v2', async () => {
    const decodeV1 = async () => await decodeTokenToV2({
      collectionId: 1,
      tokenId: 1,
      collectionProperties: punkV1Collection!.properties,
      tokenProperties: punkV1Token!.properties,
    })

    await expect(decodeV1()).resolves.toBeDefined()

    const punkV1 = await decodeV1()
    expect(punkV1).toEqual(V1_PUNK_IN_V2_FORM)
  })

  test('v0 decode collection to v2', async () => {
    const decodeCollectionV0 = async () =>
      decodeCollectionToV2({
        collectionId: 1,
        collectionName: punkV0Collection!.name,
        collectionDescription: punkV0Collection!.description,
        collectionSymbol: punkV0Collection!.tokenPrefix,
        collectionProperties: punkV0Collection!.properties,
      })

    await expect(decodeCollectionV0()).resolves.toBeDefined()

    const punkCollectionV0 = await decodeCollectionV0()
    expect(punkCollectionV0).toEqual(V0_COLLECTION_IN_V2_FORM)
  })

  test('v1 decode collection to v2', async () => {
    const decodeCollectionV1 = async () =>
      decodeCollectionToV2({
        collectionId: 1,
        collectionName: punkV1Collection!.name,
        collectionDescription: punkV1Collection!.description,
        collectionSymbol: punkV1Collection!.tokenPrefix,
        collectionProperties: punkV1Collection!.properties,
      })

    await expect(decodeCollectionV1()).resolves.toBeDefined()

    const punkCollectionV1 = await decodeCollectionV1()
    expect(punkCollectionV1).toEqual(V1_COLLECTION_IN_V2_FORM)
  })
})
