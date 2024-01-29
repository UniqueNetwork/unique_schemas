import { ethers } from 'ethers'
import { OpenSeaSDK, Chain } from 'opensea-js'
import JSON5 from 'json5'
import * as fs from "fs/promises";

const infuraApiKey = process.env.INFURA_APIKEY_MAINNET
if (!infuraApiKey) {
  throw new Error('Please set your INFURA_APIKEY_MAINNET environment variable and try again.')
}
const openseaApiKey = process.env.OPENSEA_APIKEY
if (!openseaApiKey) {
  throw new Error('Please set your OPENSEA_APIKEY environment variable and try again.')
}

// This example provider won't let you make transactions, only read-only calls:
const provider = new ethers.providers.JsonRpcProvider(
  `https://mainnet.infura.io/v3/${infuraApiKey}`
)

const openseaSDK = new OpenSeaSDK(provider, {
  chain: Chain.Mainnet,
  apiKey: openseaApiKey,
})

const asset = await openseaSDK.api.getAsset({
  tokenAddress: '0x9d8fa3806d92d3d299010114c53cb3dd2c627279',
  tokenId: '22',
})

console.log(asset)
// await fs.writeFile(`./schemas/opensea.json5`, JSON5.stringify(asset, null, 2))

// asset.traits[0]

await fs.writeFile(`./schemas/data_token_22.json5`, JSON5.stringify({
  "name": "Lofi Guy #022",
  "created_by": "Lofi Guy NFT",
  "external_url": "lofiguynft.com",
  "description": "Lofi Guy #022  \nBeat Title - Roscoes Wetsuit",
  "attributes": [
    {
      "trait_type": "Visual Artist",
      "value": "Cody A Banks"
    },
    {
      "trait_type": "Music Producer",
      "value": "L.Dre"
    },
    {
      "trait_type": "Rarity",
      "value": "20"
    }
  ],
  "animation_details": {
    "bytes": 30263895,
    "format": "MP4",
    "duration": 23,
    "sha256": "29818f053e7ea512feba088737c65ceeaec147838821222fa9ea378b235ebedd",
    "width": 1000,
    "height": 1000,
    "codecs": [
      "H.264",
      "AAC"
    ]
  },
  "animation": "https://arweave.net/CzMLMOAGYvEPT0-xhoxUyc3iF4enmV42boyHgx4qp9A",
  "animation_url": "https://arweave.net/CzMLMOAGYvEPT0-xhoxUyc3iF4enmV42boyHgx4qp9A",
  "image_details": {
    "bytes": 3303696,
    "format": "GIF",
    "sha256": "a2c34d3e0477873523e044947c41e2c8312d6a9b0eb375ddd0a881fc89032d11",
    "width": 1000,
    "height": 1000
  },
  "image": "https://arweave.net/74APWxh_OsWbJf-aOfnE-Yfzl_CNPuyvGjwl7UH1nOo",
  "image_url": "https://arweave.net/74APWxh_OsWbJf-aOfnE-Yfzl_CNPuyvGjwl7UH1nOo"
}, null, 2))
