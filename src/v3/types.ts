import {DecodingImageLinkOptions} from '../types'

export type ProbablyDecodedProperty = {
  key: string
  valueHex: string
  value?: string | null
}

export type ProbablyDecodedPropsDict = Record<string, { value: string | null, valueHex: string }>

export type DecodeCollectionParams = {
  collectionId: string | number
  collectionProperties: ProbablyDecodedProperty[]

  collectionName: string | number[]
  collectionDescription: string | number[]
  collectionSymbol: string | number[]

  tryRequestForMediaDetails?: boolean

  decodingImageLinkOptions?: DecodingImageLinkOptions
}

export type DecodeTokenParams = {
  collectionId: string | number
  collectionProperties?: ProbablyDecodedProperty[]

  tokenId: number
  tokenProperties: ProbablyDecodedProperty[]
  tokenOwner?: string

  tryRequestForTokenURI?: boolean
  tryRequestForMediaDetails?: boolean

  decodingImageLinkOptions?: DecodingImageLinkOptions
}
