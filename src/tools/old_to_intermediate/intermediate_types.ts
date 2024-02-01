export class ValidationError extends TypeError {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export type InfixOrUrlOrCidAndHash = {
  url?: string | undefined,
  urlInfix?: string | undefined,
  ipfsCid?: string | undefined,
  hash?: string | undefined
}
export const URL_TEMPLATE_INFIX = <const>'{infix}'


export enum AttributeType {
  integer = "integer",        // number
  float = "float",            // number
  boolean = "boolean",        // number
  timestamp = "timestamp",    // number // js, milliseconds from epoch
  string = "string",          // string
  url = "url",                // string
  isoDate = "isoDate",        // string // ISO Date: YYYY-MM-DD
  time = "time",              // string // 24h time: HH:mm:ss
  colorRgba = "colorRgba",    // string // 'rrggbbaa'
}

export type BoxedNumberWithDefault = {
  _: number
}
export type LocalizedStringWithDefault = {
  _: string
  [K: string]: string
}
export type LocalizedStringOrBoxedNumberWithDefault = BoxedNumberWithDefault | LocalizedStringWithDefault

export interface AttributeSchema {
  name: LocalizedStringWithDefault
  optional?: boolean
  isArray?: boolean
  type: AttributeType
  enumValues?: { [K: number]: LocalizedStringOrBoxedNumberWithDefault }
}

export type EncodedTokenAttributeValue =
  number |
  Array<number> |
  LocalizedStringOrBoxedNumberWithDefault
  | LocalizedStringOrBoxedNumberWithDefault[]

export interface EncodedTokenAttributes {
  [K: number]: EncodedTokenAttributeValue
}

export type CollectionAttributesSchema = {
  [K: number]: AttributeSchema
}

export type UniqueCollectionSchemaIntermediate = {
  schemaName: string
  schemaVersion: string // semver

  attributesSchemaVersion?: string
  attributesSchema?: CollectionAttributesSchema

  image: {
    urlTemplate: string
  }

  imagePreview?: {
    urlTemplate?: string
  }

  video?: {
    urlTemplate?: string
  }

  audio?: {
    urlTemplate?: string
    format?: string
    isLossless?: boolean
  }

  spatialObject?: {
    urlTemplate?: string
    format?: string
  }

  file?: {
    urlTemplate?: string
  }

  collectionId: number
  coverPicture: DecodedInfixOrUrlOrCidAndHash
  coverPicturePreview?: DecodedInfixOrUrlOrCidAndHash

  oldProperties?: {
    _old_schemaVersion?: string
    _old_offchainSchema?: string
    _old_constOnChainSchema?: string
    _old_variableOnChainSchema?: string
  }
}


export type DecodedAttributes = {
  [K: number]: {
    name: LocalizedStringWithDefault
    value: LocalizedStringOrBoxedNumberWithDefault | Array<LocalizedStringOrBoxedNumberWithDefault>
    type: AttributeType
    isArray: boolean
    rawValue: EncodedTokenAttributeValue | string | Array<string>
    isEnum: boolean
  }
}

export type DecodedInfixOrUrlOrCidAndHash = InfixOrUrlOrCidAndHash & { fullUrl: string | null }

export interface UniqueTokenIntermediate {
  encodedAttributes?: EncodedTokenAttributes

  name?: LocalizedStringWithDefault
  description?: LocalizedStringWithDefault
  image: DecodedInfixOrUrlOrCidAndHash
  imagePreview?: DecodedInfixOrUrlOrCidAndHash
  video?: DecodedInfixOrUrlOrCidAndHash
  audio?: DecodedInfixOrUrlOrCidAndHash
  file?: DecodedInfixOrUrlOrCidAndHash
  spatialObject?: DecodedInfixOrUrlOrCidAndHash

  tokenId: number
  collectionId: number
  owner?: string,
  nestingParentToken?: {
    collectionId: number
    tokenId: number
  }
  attributes: DecodedAttributes
}

export type DecodingImageLinkOptions = {
  imageUrlTemplate?: string
  dummyImageFullUrl?: string
}
