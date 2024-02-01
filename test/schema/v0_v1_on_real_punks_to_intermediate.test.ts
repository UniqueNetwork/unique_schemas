import type {UniqueCollectionSchemaIntermediate, UniqueTokenIntermediate} from '../../src'
import type {ICollection, INftToken} from '@unique-nft/utils/chainLens'

import {describe, test, expect, beforeAll} from 'vitest'
import {ChainLenses} from '@unique-nft/utils/chainLens'
import {decodeV0OrV1CollectionSchemaToIntermediate, decodeV0OrV1TokenToIntermediate} from '../../src/tools/old_to_intermediate'

const punkData = {
  collectionId: 1,
  tokenId: 1,
  owner: '5FZeTmbZQZsJcyEevjGVK1HHkcKfWBYxWpbgEffQ2M1SqAnP',
  attributes: {
    '0': {
      name: {_: 'gender'},
      value: {en: 'Male', _: 'Male'},
      isArray: false,
      type: 'string',
      rawValue: 0,
      isEnum: true
    },
    '1': {
      name: {_: 'traits'},
      value: [
        {en: 'Teeth Smile', _: 'Teeth Smile'},
        {en: 'Up Hair', _: 'Up Hair'}
      ],
      isArray: true,
      type: 'string',
      rawValue: [3, 17],
      isEnum: true
    }
  },
  image: {
    urlInfix: '1',
    fullUrl: 'https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image1.png'
  }
}

describe('Decoding v0 and v1 on real punks', async () => {
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

    punkV0Schema = decodeV0OrV1CollectionSchemaToIntermediate(1, punkV0Collection?.properties)
    punkV1Schema = decodeV0OrV1CollectionSchemaToIntermediate(1, punkV1Collection?.properties)
  })
  test('v0 decode token', async () => {
    expect(punkV0Schema).not.toBeNull()
    expect(punkV0Token).not.toBeNull()

    let decodedPunkV0Token: UniqueTokenIntermediate | null = null

    expect(() => {
      decodedPunkV0Token = decodeV0OrV1TokenToIntermediate(
        1,
        1,
        punkV0Token!.owner.address,
        punkV0Token!.properties,
        punkV0Schema!
      )
    }).not.toThrow()

    expect(decodedPunkV0Token).not.toBeNull()
    // expect(decodedPunkV0Token).toEqual(punkData)
    // console.log('v0 schema and punk:')
    // console.dir(punkV0Schema!.attributesSchema!, {depth: 100})
    // console.dir(decodedPunkV0Token, {depth: 100})
  })
  test('v1 decode token', async () => {
    expect(punkV1Schema).not.toBeNull()
    expect(punkV1Token).not.toBeNull()

    let decodedPunkV1Token: UniqueTokenIntermediate | null = null

    expect(() => {
      decodedPunkV1Token = decodeV0OrV1TokenToIntermediate(
        1,
        1,
        punkV1Token!.owner.address,
        punkV1Token!.properties,
        punkV1Schema!
      )
    }).not.toThrow()

    const TMP_PATCHED_PUNK_FOR_UNIQUE_INCORRECT_DATA = JSON.parse(JSON.stringify(punkData))
    TMP_PATCHED_PUNK_FOR_UNIQUE_INCORRECT_DATA.attributes['0'].value = {en: 'Female', _: 'Female'}
    expect(decodedPunkV1Token).not.toBeNull()
    expect(decodedPunkV1Token).toEqual(TMP_PATCHED_PUNK_FOR_UNIQUE_INCORRECT_DATA)
    // console.log('v1 schema and punk:')
    // console.dir(punkV1Schema!.attributesSchema!, {depth: 100})
    // console.dir(decodedPunkV1Token.result!, {depth: 100})
  })
})
