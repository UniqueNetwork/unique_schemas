# Unique schema toolkit

### Collection encoding and decoding

Collection encoding takes some info about collection (cover image, etc.) and returns collection's properties and collection's token property permissions which are used to create a collection.

```ts
import {SchemaTools} from '@unique-nft/schemas'

const {collectionProperties, tokenPropertyPermissions} = SchemaTools.encode.collection({
  cover_image: {
    url: 'https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image1.png'
  },
})

const collectionInfo = SchemaTools.decode.collection(collectionProperties)
```

### Token encoding and decoding

Token encoding takes some info about token (image, attributes, royalties, etc.) and returns token's properties which are used to create a token.

```ts
import {SchemaTools} from '@unique-nft/schemas'

const tokenProperties = SchemaTools.encode.token({
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

const token = SchemaTools.decode.token(
  tokenProperties,
  {collectionProperties, tokenId} // optional, but required to parse tokens in Unique Schema v0 and v1
)
```
