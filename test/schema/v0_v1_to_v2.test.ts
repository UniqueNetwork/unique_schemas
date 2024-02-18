import type {ICollection, INftToken} from '@unique-nft/utils/chainLens'

import {describe, test, expect, beforeAll} from 'vitest'
import {ChainLenses} from '@unique-nft/utils/chainLens'
import {decodeTokenToV2} from 'src/decoding/tokenDecoding'
import {IV2Collection, IV2Token} from 'src/schema.zod'
import {decodeCollectionToV2} from 'src/decoding/collectionDecoding'

const V0_PUNK_IN_V2_FORM: IV2Token = {
  schemaName: 'unique',
  schemaVersion: '2.0.0',
  originalSchemaVersion: '0.0.1',
  image: 'https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image1.png',
  attributes: [
    {trait_type: 'gender', value: 'Male'},
    {trait_type: 'traits', value: 'Teeth Smile'},
    {trait_type: 'traits', value: 'Up Hair'}
  ],
}

const V1_PUNK_IN_V2_FORM: IV2Token = {
  schemaName: 'unique',
  schemaVersion: '2.0.0',
  originalSchemaVersion: '1.0.0',
  image: 'https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image1.png',
  attributes: [
    {trait_type: 'gender', value: 'Female'},
    {trait_type: 'traits', value: 'Teeth Smile'},
    {trait_type: 'traits', value: 'Up Hair'}
  ],
  royalties: [
    {
      address: '5Gus5r7HSZv9ScdaTNVbFMBEsxMtc4cZBPTLfJJbLXQK8m9d',
      percent: 5
    }
  ],
}

const V0_COLLECTION_IN_V2_FORM: IV2Collection = {
  schemaName: 'unique',
  schemaVersion: '2.0.0',
  originalSchemaVersion: '0.0.1',
  name: 'SubstraPunks',
  description: 'First NFT collection in polkadot space',
  symbol: 'PNK',
  tokenPrefix: 'PNK',
  cover_image: {
    url: 'https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image1.png'
  },
}

const V1_COLLECTION_IN_V2_FORM: IV2Collection = {
  ...JSON.parse(JSON.stringify(V0_COLLECTION_IN_V2_FORM)),
  originalSchemaVersion: '1.0.0',
  description: 'First NFT collection in Polkadot and Kusama space',
}


describe('Decoding collection and token in schemas v0 and v1 to v2', async () => {
  let punkV0Collection: ICollection | null = null
  let punkV1Collection: ICollection | null = null

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
  })

  test('v0 decode token to v2', async () => {
    await expect(decodeTokenToV2({
      collectionId: 1,
      tokenId: 1,
      collectionProperties: punkV0Collection!.properties,
      tokenProperties: punkV0Token!.properties,
    })).resolves.toEqual(V0_PUNK_IN_V2_FORM)
  })

  test('v1 decode token to v2', async () => {
    await expect(decodeTokenToV2({
      collectionId: 1,
      tokenId: 1,
      collectionProperties: punkV1Collection!.properties,
      tokenProperties: punkV1Token!.properties,
    })).resolves.toEqual(V1_PUNK_IN_V2_FORM)
  })

  test('v0 decode collection to v2', async () => {
    await expect(decodeCollectionToV2({
      collectionId: 1,
      collectionName: punkV0Collection!.name,
      collectionDescription: punkV0Collection!.description,
      collectionSymbol: punkV0Collection!.tokenPrefix,
      collectionProperties: punkV0Collection!.properties,
    })).resolves.toEqual(V0_COLLECTION_IN_V2_FORM)
  })

  test('v1 decode collection to v2', async () => {
    await expect(decodeCollectionToV2({
      collectionId: 1,
      collectionName: punkV1Collection!.name,
      collectionDescription: punkV1Collection!.description,
      collectionSymbol: punkV1Collection!.tokenPrefix,
      collectionProperties: punkV1Collection!.properties,
    })).resolves.toEqual(V1_COLLECTION_IN_V2_FORM)
  })
})
