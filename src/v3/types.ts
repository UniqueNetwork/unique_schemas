export type ProbablyDecodedProperty = {
  key: string
  valueHex: string
  value?: string | null
}

export type ProbablyDecodedPropsDict = Record<string, { value: string | null, valueHex: string }>

export type DecodeTokenParams = {
  collectionId: string | number
  collectionProperties?: ProbablyDecodedProperty[]

  tokenId: string
  tokenProperties: ProbablyDecodedProperty[]
  tokenOwner?: string

  tryRequestForTokenURI?: boolean
  tryRequestForMediaDetails?: boolean
}
