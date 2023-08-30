import Axios from 'axios'
import {sha256} from '@noble/hashes/sha256'
import {bytesToHex} from '@noble/hashes/utils'
import type {IImageDetails, IMediaDetails} from './token_schema.zod'

import type Sdk from '@unique-nft/sdk'

export type IGetDetailsOptions<T> = {
  details?: T,
  dontRetrieveSha256?: boolean,
}

const getSha256OfFileByUrl = async (url: string): Promise<string> => {
  const response = await Axios.get(url, {responseType: 'arraybuffer'})
  const hash = bytesToHex(sha256(response.data))
  return hash
}

const getInfoFromShotstack = async (url: string): Promise<any> => {
  try {
    const response = await Axios.get(
      'https://api.shotstack.io/v1/probe/' +
      encodeURIComponent(url)
    )
    return response.data.response.metadata
  } catch (error: any) {
    const reason = error.response.data?.response || 'unknown reason'
    throw new Error(error.message + ': ' + reason)
  }
}

export const getImageDetailsOnline = async (url: string, options?: IGetDetailsOptions<IImageDetails>): Promise<IImageDetails> => {
  const {streams, format} = await getInfoFromShotstack(url)
  const stream = streams[0]
  if (!stream) {
    throw new Error('Remote ffprobe: no stream found')
  }

  const details: IImageDetails = {
    format: stream.codec_name,
    width: stream.width,
    height: stream.height,
    bytes: parseInt(format.size, 10),
    type: ('duration' in stream) ? 'video' : 'image',
    ...(options?.details || {}),
  }

  if (!options?.dontRetrieveSha256) {
    details.sha256 = await getSha256OfFileByUrl(url)
  }

  return details
}

export const getVideoDetailsOnline = async (url: string, options?: IGetDetailsOptions<IMediaDetails>): Promise<IMediaDetails> => {
  const {streams, format} = await getInfoFromShotstack(url)
  const videoStream = streams.find((stream: any) => stream.codec_type === 'video')
  const audioStream = streams.find((stream: any) => stream.codec_type === 'audio')
  if (!videoStream) {
    throw new Error('No video stream found')
  }
  const formatNames = format.format_name.split(',')

  const details: IMediaDetails = {
    format: formatNames.includes('mp4') ? 'mp4' : formatNames[0],
    width: videoStream.width,
    height: videoStream.height,
    bytes: parseInt(format.size, 10),
    duration: parseFloat(format.duration),
    codecs: streams.map((stream: any) => stream.codec_name),
    type: audioStream ? 'video' : 'animation',

    ...(options?.details || {}),
  }

  if (!options?.dontRetrieveSha256) {
    details.sha256 = await getSha256OfFileByUrl(url)
  }
  return details
}

export const getAudioDetailsOnline = async (url: string, options?: IGetDetailsOptions<IMediaDetails>): Promise<IMediaDetails> => {
  const {streams, format} = await getInfoFromShotstack(url)
  const audioStream = streams.find((stream: any) => stream.codec_type === 'audio')
  if (!audioStream) {
    throw new Error('No audio stream found')
  }

  const details: IMediaDetails = {
    format: format.format_name.split(',')[0],
    bytes: parseInt(format.size, 10),
    duration: parseFloat(format.duration),
    codecs: [audioStream.codec_name],
    type: 'audio',

    ...(options?.details || {}),
  }

  if (!options?.dontRetrieveSha256) {
    details.sha256 = await getSha256OfFileByUrl(url)
  }
  return details
}

const SVG_URL = 'https://bafkreihkkotv62covs3shda2xa7nacdp4xsmh4toixlhlzkhynap4oksdu.ipfs.nftstorage.link'
const MP3_URL = 'https://bafybeib6mj7xucopbcthisz6pvkxhro5lylpjlin33df33rxbibbrprmlq.ipfs.nftstorage.link/'
const IMAGE_URL = 'https://bafkreigtgjjhukwsha4r3oxstegsozsvwbpoyqdes6bd62iptb7wz7qki4.ipfs.nftstorage.link/'
const ANIMATION_URL = 'https://bafybeicjljjghgaalajvzctfbph5cff45l55fwqpxuhtkaaxssvshi5alm.ipfs.nftstorage.link/'

const FULL_RES_IMAGE = 'https://bafybeiedjjrn4q7h5zmxfc4jsmafn524s6w266v7se66avakl3tyu2asem.ipfs.nftstorage.link/'

console.log(await getImageDetailsOnline(FULL_RES_IMAGE))
// console.log(await getImageDetailsOnline(IMAGE_URL))
// console.log(await getVideoDetailsOnline(ANIMATION_URL))
// console.log(await getAudioDetailsOnline(MP3_URL))
// console.log(await getImageDetailsOnline(SVG_URL))

export const getLinkToCollection = (sdk: Sdk, collectionId: number) => {
  return `${sdk.options.baseUrl}/collections?collectionId=${collectionId}`
}

export const getLinkToToken = (sdk: Sdk, collectionId: number, tokenId: number) => {
  return `${sdk.options.baseUrl}/tokens?collectionId=${collectionId}&tokenId=${tokenId}`
}
