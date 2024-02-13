# Unique schema toolkit

### Collection encoding and decoding

Collection encoding takes some info about collection (cover image, etc.) and returns collection's properties and collection's token property permissions which are used to create a collection.

```ts
import {SchemaTools} from '@unique-nft/schemas'

const {collectionProperties, tokenPropertyPermissions} = SchemaTools.collection.encode({
  schemaName: 'unique',
  schemaVersion: '2.0.0',
  cover_image: {
    url: 'https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image1.png'
  },
})

const collectionInfo = SchemaTools.collection.decode({
  collectionId: 1,
  collectionName: "Demo",
  collectionDescription: "Demo collection",
  collectionSymbol: "DEMO",
  collectionProperties,
})
```

### Token encoding and decoding

Token encoding takes some info about token (image, attributes, royalties, etc.) and returns token's properties which are used to create a token.

```ts
import {SchemaTools} from '@unique-nft/schemas'

const tokenProperties = SchemaTools.token.encode({
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
      address: '5Gus5r7HSZv9ScdaTNVbFMBEsxMtc4cZBPTLfJJbLXQK8m9d', // substrate address
      percent: 0.5
    },
    {
      address: '0xd47b259722f314bd4ec2f26524e34b8a0172e49a', // ethereum address
      percent: 2
    }
  ],
})

const token = SchemaTools.token.decode({
  collectionId: 1,
  tokenId: 1,
  tokenProperties,
})
```
