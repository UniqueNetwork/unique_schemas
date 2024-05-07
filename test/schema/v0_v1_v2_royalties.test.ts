import type {ICollection, INftToken} from '@unique-nft/utils/chainLens'
import {ChainLenses} from '@unique-nft/utils/chainLens'

import {beforeAll, describe, expect, test} from 'vitest'
import {IV2Collection, IV2Token} from 'src/schema.zod'
import {decodeCollectionToV2} from 'src/decoding/collectionDecoding'
import {COLLECTION_SCHEMA_FAMILY, SchemaTools} from '../../src'
import {UniqueCollectionSchemaIntermediate} from '../../src/tools/old_to_intermediate/intermediate_types'

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
  cover_image: {
    url: 'https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image1.png'
  },
  potential_attributes: [
    {trait_type: 'gender', display_type: 'string', values: ['Male', 'Female']},
    {
      trait_type: 'traits',
      display_type: 'string',
      values: ['Black Lipstick', 'Red Lipstick', 'Smile', 'Teeth Smile', 'Purple Lipstick', 'Nose Ring', 'Asian Eyes', 'Sunglasses', 'Red Glasses', 'Round Eyes', 'Left Earring', 'Right Earring', 'Two Earrings', 'Brown Beard', 'Mustache Beard', 'Mustache', 'Regular Beard', 'Up Hair', 'Down Hair', 'Mahawk', 'Red Mahawk', 'Orange Hair', 'Bubble Hair', 'Emo Hair', 'Thin Hair', 'Bald', 'Blonde Hair', 'Caret Hair', 'Pony Tails', 'Cigar', 'Pipe']
    }
  ],
}

const V1_COLLECTION_IN_V2_FORM: IV2Collection = {
  ...JSON.parse(JSON.stringify(V0_COLLECTION_IN_V2_FORM)),
  originalSchemaVersion: '1.0.0',
  potential_attributes: [
    {
      ...V0_COLLECTION_IN_V2_FORM.potential_attributes![0],
      values: ['Female', 'Male'],
    },
    ...V0_COLLECTION_IN_V2_FORM.potential_attributes!.slice(1),
  ],
  royalties: [{
    address: '5Gus5r7HSZv9ScdaTNVbFMBEsxMtc4cZBPTLfJJbLXQK8m9d',
    percent: 5
  }],
}


describe('Decoding collection and token in schemas v0 and v1 to v2', async () => {
  let demoCollectionV1: ICollection
  let demoTokenV1_SameRoyalty: INftToken
  let demoTokenV1_NoRoyalties: INftToken
  let demoTokenV1_DifferRoyalty: INftToken
  let demoTokenV1_MultipleRoyalties: INftToken

  let demoCollectionV1Schema: UniqueCollectionSchemaIntermediate

  let demoCollectionV2: ICollection
  let demoTokenV2WithRoyalties: INftToken

  beforeAll(async () => {
    [
      demoCollectionV2,
      demoTokenV2WithRoyalties,
      demoCollectionV1,
      demoTokenV1_SameRoyalty,
      demoTokenV1_NoRoyalties,
      demoTokenV1_DifferRoyalty,
      demoTokenV1_MultipleRoyalties,
    ] = await Promise.all([
      ChainLenses.opal.requestCollection(2740) as Promise<ICollection>,
      ChainLenses.opal.requestNftToken(2740, 1) as Promise<INftToken>,
      ChainLenses.opal.requestCollection(2741) as Promise<ICollection>,
      ChainLenses.opal.requestNftToken(2741, 1) as Promise<INftToken>,
      ChainLenses.opal.requestNftToken(2741, 2) as Promise<INftToken>,
      ChainLenses.opal.requestNftToken(2741, 3) as Promise<INftToken>,
      ChainLenses.opal.requestNftToken(2741, 4) as Promise<INftToken>,
    ])
    if (!demoCollectionV2) throw new Error('Collection 2740 not found')
    if (!demoTokenV2WithRoyalties) throw new Error('Token 1 in collection 2740 not found')

    if (!demoCollectionV1) throw new Error('Collection 2741 not found')
    if (!demoTokenV1_SameRoyalty) throw new Error('Token 1 in collection 2741 not found')
    if (!demoTokenV1_NoRoyalties) throw new Error('Token 2 in collection 2741 not found')
    if (!demoTokenV1_DifferRoyalty) throw new Error('Token 3 in collection 2741 not found')
    if (!demoTokenV1_MultipleRoyalties) throw new Error('Token 4 in collection 2741 not found')


    demoCollectionV1Schema = SchemaTools.tools.decodeOld.collection(
      demoCollectionV1!.properties,
      COLLECTION_SCHEMA_FAMILY.V1,
    )
  })

  test('v1 collection with royalties info', async () => {
    console.dir(demoCollectionV1Schema, {depth: 100})

    expect(demoCollectionV1Schema.royalties).toEqual([{
      address: '5GbjEGWbTFV7f2XN6z7TBUyW4YidWTHmaw1ekNFCtWGuEmTT',
      percent: 10
    }])
  })

  test('v1 token without royalties, with royalties in collection', async () => {
    const decodedToken = SchemaTools.tools.decodeOld.token(
      demoTokenV1_NoRoyalties.properties,
      demoCollectionV1Schema,
      {
        tokenOwner: demoTokenV1_NoRoyalties.owner.address,
      }
    )

    console.dir(decodedToken, {depth: 100})
    console.dir(decodedToken, {depth: 100})

    expect(decodedToken).toBeTruthy()
  })
})
