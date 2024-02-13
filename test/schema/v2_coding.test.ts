import {describe, test, expect} from 'vitest'
import {IV2Collection, IV2Token} from 'src/schema.zod'
import {SchemaTools} from 'src'

const DEMO_V2_COLLECTION: IV2Collection = {
  schemaName: 'unique',
  schemaVersion: '2.0.0',
  cover_image: {
    url: 'https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image1.png'
  },
}

const DEMO_COLLECTION_ENCODED = {
  collectionProperties: [
    {key: 'schemaName', valueHex: '0x756e69717565'},
    {key: 'schemaVersion', valueHex: '0x322e302e30'},
    {
      key: 'collectionInfo',
      valueHex: '0x7b22736368656d614e616d65223a22756e69717565222c22736368656d6156657273696f6e223a22322e302e30222c22636f7665725f696d616765223a7b2275726c223a2268747470733a2f2f697066732e756e697175652e6e6574776f726b2f697066732f516d634163483446394859517470714b487842467747766b664b623871636b586a325957557263633879643234472f696d616765312e706e67227d7d'
    }
  ],
  tokenPropertyPermissions: [
    {key: 'schemaName', permission: {mutable: false, collectionAdmin: true, tokenOwner: false}},
    {key: 'schemaVersion', permission: {mutable: false, collectionAdmin: true, tokenOwner: false}},
    {key: 'tokenData', permission: {mutable: false, collectionAdmin: true, tokenOwner: false}},
    {key: 'URI', permission: {mutable: false, collectionAdmin: true, tokenOwner: false}},
    {key: 'URISuffix', permission: {mutable: false, collectionAdmin: true, tokenOwner: false}},
    {key: 'overrides', permission: {mutable: false, collectionAdmin: true, tokenOwner: false}},
    {key: 'customizing_overrides', permission: {mutable: false, collectionAdmin: true, tokenOwner: false}},
    {key: 'royalties', permission: {mutable: false, collectionAdmin: true, tokenOwner: false}}
  ]
}


const DEMO_V2_TOKEN: IV2Token = {
  schemaName: 'unique',
  schemaVersion: '2.0.0',
  image: 'https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image1.png',
  attributes: [
    {trait_type: 'gender', value: 'Female'},
    {trait_type: 'traits', value: 'Teeth Smile'},
    {trait_type: 'traits', value: 'Up Hair'}
  ],
  royalties: [
    {
      address: '5Gus5r7HSZv9ScdaTNVbFMBEsxMtc4cZBPTLfJJbLXQK8m9d',
      percent: 0.5
    }
  ],
}

const DEMO_TOKEN_ENCODED = [
  {key: 'schemaName', valueHex: '0x756e69717565'},
  {key: 'schemaVersion', valueHex: '0x322e302e30'},
  {
    key: 'tokenData',
    valueHex: '0x7b22736368656d614e616d65223a22756e69717565222c22736368656d6156657273696f6e223a22322e302e30222c22696d616765223a2268747470733a2f2f697066732e756e697175652e6e6574776f726b2f697066732f516d634163483446394859517470714b487842467747766b664b623871636b586a325957557263633879643234472f696d616765312e706e67222c2261747472696275746573223a5b7b2274726169745f74797065223a2267656e646572222c2276616c7565223a2246656d616c65227d2c7b2274726169745f74797065223a22747261697473222c2276616c7565223a22546565746820536d696c65227d2c7b2274726169745f74797065223a22747261697473222c2276616c7565223a2255702048616972227d5d2c22726f79616c74696573223a5b7b2261646472657373223a223547757335723748535a763953636461544e5662464d424573784d746334635a4250544c664a4a624c58514b386d3964222c2270657263656e74223a302e357d5d7d'
  },
  {
    key: 'royalties',
    valueHex: '0x30783031303030303030303030303030303030303030303030303030303030303030303030303030303030303030303130343030303030303030303030303133383864363666303532636631626265313764613466386237313031643964653766373230396562383036393566303633633037303930393232363832393235623536'
  }
]


describe('Decoding collection and token in schemas v0 and v1 to v2', async () => {
  test('Encoding collection in v2', async () => {
    const encoded = SchemaTools.encode.collection(DEMO_V2_COLLECTION, {})
    // console.dir(encoded, {depth: 1000})
    expect(encoded).toEqual(DEMO_COLLECTION_ENCODED)

    const decoded = await SchemaTools.decode.collection({
      collectionId: 1,
      collectionName: "SubstraPunks",
      collectionDescription: "First NFT collection in Polkadot and Kusama space",
      collectionSymbol: "PNK",
      collectionProperties: encoded.collectionProperties,
    })

    expect(decoded).toEqual(DEMO_V2_COLLECTION)
  })

  test('Encoding token in v2', async () => {
    const encoded = SchemaTools.encode.token(DEMO_V2_TOKEN, {})
    expect(encoded).toEqual(DEMO_TOKEN_ENCODED)

    const decoded = await SchemaTools.decode.token({
      collectionId: 1,
      tokenId: 1,
      tokenProperties: encoded,
    })
    expect(decoded).toEqual(DEMO_V2_TOKEN)
  })
})
