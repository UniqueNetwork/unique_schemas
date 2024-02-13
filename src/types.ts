import {DecodingImageLinkOptions} from './tools/old_to_intermediate/intermediate_types'

export type ProbablyDecodedProperty = {
  key: string
  valueHex: string
  value?: string | null
}

export type PropertyForEncoding =
  { key: string, valueHex?: undefined, value: string }
  |
  { key: string, valueHex: string, value?: undefined }

export type PropertyWithHexOnly = { key: string, valueHex: string }

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

export type CrossAccountId = { Substrate: string } & { Ethereum?: never } | { Ethereum: string } & { Substrate?: never }


export interface TokenPropertyPermission {
  mutable: boolean
  collectionAdmin: boolean
  tokenOwner: boolean
}

export interface TokenPropertyPermissionObject {
  key: string
  permission: TokenPropertyPermission
}


export type CollectionTokenPropertyPermissions = Array<TokenPropertyPermissionObject>

/////////////////////////////////////////////////////
// encoding params and results
/////////////////////////////////////////////////////

export type EncodeCollectionOptions = {
  defaultPermission?: TokenPropertyPermission

  overwriteTPPs?: CollectionTokenPropertyPermissions
  overwriteProperties?: PropertyForEncoding[]
}

export type EncodeCollectionResult = {
  collectionProperties: PropertyWithHexOnly[]
  tokenPropertyPermissions: CollectionTokenPropertyPermissions
}

export type EncodeTokenOptions = {
  URI?: string
  overwriteProperties?: PropertyForEncoding[]
}
