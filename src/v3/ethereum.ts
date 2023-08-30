import {ethers, Wallet} from 'ethers'
import {CollectionHelpersFactory, parseEthersV5TxReceipt, UniqueNFTFactory} from '@unique-nft/solidity-interfaces'
import {UniqueNFT} from '@unique-nft/solidity-interfaces/ethers/UniqueNFT'
import * as dotenv from 'dotenv'
import {ICollectionSchema} from "./collection_schema.zod";
import {IImageDetails, IMediaDetails, ITokenSchema} from "./token_schema.zod";
import {uploadFile} from "./minio";
import {getLinkToCollection, getLinkToToken} from "../utils";
import Sdk from "@unique-nft/sdk";
import {Address} from "@unique-nft/utils";

dotenv.config()

const textEncoder = new TextEncoder()

//`https://ipfs.nftstorage.link/ipfs/bafkreihkkotv62covs3shda2xa7nacdp4xsmh4toixlhlzkhynap4oksdu`
//`https://bafkreihkkotv62covs3shda2xa7nacdp4xsmh4toixlhlzkhynap4oksdu.ipfs.nftstorage.link`

const MP3 = {
  url: 'https://bafybeib6mj7xucopbcthisz6pvkxhro5lylpjlin33df33rxbibbrprmlq.ipfs.nftstorage.link/',
  details: {
    format: 'mp3',
    bytes: 3971657,
    duration: 198.556735,
    codecs: ['mp3'],
    type: 'audio',
    sha256: '519d73239d62f067f51cebadc040a769c17a56b9e9640f640c545383ffd19312'
  } satisfies IMediaDetails,
}
const IMAGE = {
  url: 'https://bafkreigtgjjhukwsha4r3oxstegsozsvwbpoyqdes6bd62iptb7wz7qki4.ipfs.nftstorage.link/',
  details: {
    format: 'png',
    width: 960,
    height: 720,
    bytes: 106293,
    type: 'image',
    sha256: 'd332527a2ad238391dbaf2990d276655b05eec406497823f690f987f6cfe0a47'
  } satisfies IImageDetails,
}
const FULL_RES_IMAGE = {
  url: 'https://bafybeiedjjrn4q7h5zmxfc4jsmafn524s6w266v7se66avakl3tyu2asem.ipfs.nftstorage.link/',
  details: {
    format: 'png',
    width: 1920,
    height: 1440,
    bytes: 291844,
    type: 'image',
    sha256: '1830ef2a77a067c7515f81c7d511f3db8af8ea22513b6c5ae8bcc8efee96161a'
  } satisfies IImageDetails,
}
const ANIMATION = {
  url: 'https://bafybeicjljjghgaalajvzctfbph5cff45l55fwqpxuhtkaaxssvshi5alm.ipfs.nftstorage.link/',
  details: {
    format: 'mp4',
    width: 960,
    height: 720,
    bytes: 2248862,
    duration: 16.191667,
    codecs: ['h264', 'aac'],
    type: 'video',
    sha256: '98c3c998cec0bf4c52327dda020d06c2e954427d1c67f651c52385742870da1e'
  } satisfies IMediaDetails,
}


const collectionSchema = {
  name: 'My Collection',
  description: 'My Collection Description',
  token_prefix: 'MY',

  cover_image_url: IMAGE.url,
  cover_image_details: IMAGE.details,
  version: '2.0.0',
  attributes_schema: [
    {
      trait_type: 'Color',
      is_required: true,
      values: ['red', 'green', 'blue'],
    },
    {
      trait_type: 'Amount',
      display_type: 'number',
    },
    {
      trait_type: 'Start time',
      display_type: 'date_time',
    },
  ],
  onchain_fields: [
    'media.beat'
  ],
  royalties: [
    {
      address: '0x7D73aDe1F0374CB86AA45Af07353fb314574C63f',
      percent: 1,
    },
    {
      address: '5CFrzx2ottkJ5GbeS5kGmJRBKH9kEWcKgE9gAJVwAgfLs6ip',
      percent: 1.5,
    }
  ],
  carbon_offsets: [{
    collection_id: 1,
    token_id: 1,
    co2_g: 100,
  }],
  locale: 'en',
} satisfies ICollectionSchema

const tokenSchema = {
  version: '2.0.0', // optional

  name: 'My first token',
  description: 'My first token description',

  image: IMAGE.url,
  image_details: IMAGE.details,

  attributes: [
    {
      trait_type: 'Color',
      value: 'red',
    },
    {
      trait_type: 'Amount',
      value: 100,
    },
    {
      trait_type: 'Start time',
      value: '2021-01-01T00:00:00Z',
    },
    {
      trait_type: 'Some additional trait not in collection schema and it is ok',
      value: 'some value',
    },
  ],
  onchain_fields: ['media.beat'],

  animation_url: ANIMATION.url,
  animation_details: ANIMATION.details,

  youtube_url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
  created_by: 'James Bond',
  background_color: '#00D6FF',
  external_url: 'https://achorusofehoes.wordpress.com/',

  additional_media: [
    {
      type: 'audio',
      url: MP3.url,
      details: MP3.details,
      tag: 'beat',
      name: 'SecondHand - Aretha',
    },
    {
      type: 'image',
      url: FULL_RES_IMAGE.url,
      details: FULL_RES_IMAGE.details,
      tag: 'full-size-image',
      name: 'Full resolution image',
    }
  ],

  image_stacking: {
    image_url: IMAGE.url,
    image_details: IMAGE.details,

    layer: 0,
    order_in_layer: 0,

    offset_x: 0,
    offset_y: 0,
    opacity: 1,
    rotation: 0,
    scale: 1,

    tag: 'background',
  },

  royalties: [
    {
      address: '0x7D73aDe1F0374CB86AA45Af07353fb314574C63f',
      percent: 2.5,
    },
    {
      address: '5CFrzx2ottkJ5GbeS5kGmJRBKH9kEWcKgE9gAJVwAgfLs6ip',
      percent: 0.333,
    }
  ],

  carbon_offsets: [{
    collection_id: 1,
    token_id: 1,
    co2_g: 1,
  }],

  locale: 'en',
} satisfies ITokenSchema

export type ICreateCollectionOptions = {
  collectionSchemaURI?: string,
  collectionSchema?: ICollectionSchema,
}
const createCollection = async (wallet: Wallet, options: ICreateCollectionOptions) => {
  const collectionHelpers = await CollectionHelpersFactory(wallet)

  const collectionCreationTx = await (await collectionHelpers.createNFTCollection(
    'My first collection',
    'My first collection description',
    'MY',
    {
      value: await collectionHelpers.collectionCreationFee(),
      gasLimit: 1000000,
      gasPrice: await wallet.provider.getGasPrice(),
    }
  )).wait()
  const collectionAddress = parseEthersV5TxReceipt(collectionCreationTx).events.CollectionCreated.collectionId
  console.log(`Collection created at ${collectionAddress}`)

  await collectionHelpers.makeCollectionERC721MetadataCompatible(
    collectionAddress,
    '',
    {
      gasLimit: 1000000,
      gasPrice: await wallet.provider.getGasPrice(),
    }
  )
  console.log(`Collection ${collectionAddress} is now ERC721Metadata compatible`)

  const collection = await UniqueNFTFactory(collectionAddress, wallet)
  if (options.collectionSchemaURI) {
    console.log(`Setting collection properties (collectionSchemaURI to ${options.collectionSchemaURI})`)
    await collection.setCollectionProperties(
      [{
        key: 'collectionSchemaURI',
        value: textEncoder.encode(options.collectionSchemaURI),
      }],
      {
        gasLimit: 1000000,
        gasPrice: await wallet.provider.getGasPrice(),
      }
    )
    console.log(`Successfully set collection properties`)
  }

  enum TokenPropertyPermissionCode {
    /// Permission to change the property and property permission. See [`up_data_structs::PropertyPermission::mutable`]
    Mutable,
    /// Change permission for the collection administrator. See [`up_data_structs::PropertyPermission::token_owner`]
    TokenOwner,
    /// Permission to change the property for the owner of the token. See [`up_data_structs::PropertyPermission::collection_admin`]
    CollectionAdmin
  }

  if (options.collectionSchema) {
    if (options.collectionSchema.onchain_fields) {
      console.log(`Setting collection token property permissions`)
      await (await collection.setTokenPropertyPermissions([
          {
            key: 'media.beat',
            permissions: [
              {code: TokenPropertyPermissionCode.Mutable, value: true},
              {code: TokenPropertyPermissionCode.CollectionAdmin, value: true},
              {code: TokenPropertyPermissionCode.TokenOwner, value: false},
            ]
          }
        ],
        {
          gasLimit: 1000000,
          gasPrice: await wallet.provider.getGasPrice(),
        }
      )).wait()
      console.log(`Successfully set collection token property permissions`)
    }
  }

  return collectionAddress
}

type IMintTokenOptions = {
  mintTo: string
  tokenURI: string
}
const mintToken = async (wallet: Wallet, collectionAddress: string, options: IMintTokenOptions) => {
  const collection = await UniqueNFTFactory(collectionAddress, wallet)
  if (options.tokenURI) {
    const mintCrossTxResult = await (await collection.mintCross(
      Address.extract.ethCrossAccountId(options.mintTo),
      [{
        key: 'URI',
        value: textEncoder.encode(options.tokenURI),
      }],
      {
        gasLimit: 1000000,
        gasPrice: await wallet.provider.getGasPrice(),
      }
    )).wait()
    const tokenId = Number(parseEthersV5TxReceipt(mintCrossTxResult).events.Transfer.tokenId)
    return tokenId
  }
}

const main = async () => {
  const ethereumPrivateKey = process.env.ETHEREUM_PRIVATE_KEY
  if (!ethereumPrivateKey) throw new Error('ETHEREUM_PRIVATE_KEY env variable is not set')

  // init ethereum provider and wallet
  const sdk = new Sdk({baseUrl: 'https://rest.unq.uniq.su/v1'})
  const rpcUrl = 'https://rpc.unq.uniq.su/'
  // const rpcUrlOpal = 'https://rpc-opal.unique.network'
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(ethereumPrivateKey, provider)

  const collectionSchemaURI = (await uploadFile({fileName: '.json',fileData: textEncoder.encode(JSON.stringify(collectionSchema, null, 2)),})).url; console.log(`Collection schema url: ${collectionSchemaURI}`);
  const tokenURI = (await uploadFile({fileName: '.json',fileData: textEncoder.encode(JSON.stringify(tokenSchema, null, 2)),})).url; console.log(`Token schema url: ${tokenURI}`);
  // const collectionSchemaURI = 'https://storage.unique.network/demo-bucket/593f31dc-982c-4d0c-bb54-b4436df41d08.json'
  // const tokenURI = 'https://storage.unique.network/demo-bucket/9539d2f3-5db5-4a98-9091-680368a1034d.json'

  const collectionAddress = await createCollection(wallet, {
    collectionSchemaURI,
    collectionSchema,
  })
  const collectionId = Address.collection.addressToId(collectionAddress)
  console.log(getLinkToCollection(sdk, collectionId))
  await mintToken(wallet, collectionAddress, {
    mintTo: wallet.address,
    tokenURI,
  })
  console.log(getLinkToToken(sdk, collectionId, 1))
  const collection = await UniqueNFTFactory(collectionAddress, wallet)
  const tokenUriFromCollection = await collection.tokenURI(1)
  console.log(`Token URI from collection: ${tokenUriFromCollection}`)

}

main().catch((error) => console.error(error))
