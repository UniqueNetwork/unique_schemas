import {
  DecodingImageLinkOptions,
  UniqueCollectionSchemaIntermediate
} from './tools/old_to_intermediate/intermediate_types'

export type ProbablyDecodedProperty = {
  key: string
  valueHex: string
  value?: string | null
}

export type PropertyForEncoding =
  { key: string, valueHex?: undefined, value: string }
  |
  { key: string, valueHex: string, value?: undefined }

export type PropertyWithHex = { key: string, valueHex: string, value?: string }

export type ProbablyDecodedPropsDict = Record<string, { value: string | null, valueHex: string }>

export type DecodeCollectionOptions = {
  tryRequestForMediaDetails?: boolean

  decodingImageLinkOptions?: DecodingImageLinkOptions
}

export type DecodeTokenOptions = {
  // collectionId: string | number

  tokenId?: number
  collectionProperties?: ProbablyDecodedProperty[]
  tokenOwner?: string

  collectionDecodedSchemaV1?: UniqueCollectionSchemaIntermediate

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
  collectionProperties: PropertyWithHex[]
  tokenPropertyPermissions: CollectionTokenPropertyPermissions
  flags: number
}

export type EncodeTokenOptions = {
  URI?: string
  overwriteProperties?: PropertyForEncoding[]
}

export enum COLLECTION_SCHEMA_FAMILY {
  V0 = 'V0',
  V1 = 'V1',
  V2 = 'V2',
  OTHER_ERC721 = 'ERC721',
  UNKNOWN = 'UNKNOWN'
}
