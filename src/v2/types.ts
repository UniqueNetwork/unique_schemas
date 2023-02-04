type GenericLocalizedWithDefault<T> = {
  _: T
  [K: string]: T
}
type BoxedNumberWithDefault = { _: number }

type LocalizedStringWithDefault = GenericLocalizedWithDefault<string>
type LocalizedStringOrBoxedNumberWithDefault = BoxedNumberWithDefault | LocalizedStringWithDefault

export type TokenPropertyPermissionValue = {
  mutable: boolean
  collectionAdmin: boolean
  tokenOwner: boolean
}
export type Property = {
  key: string
  value: string
}
export type TokenPropertyPermission = {
  key: string
  permission: TokenPropertyPermissionValue
}

enum AttributeType {
  integer = 'integer',        // number
  float = 'float',            // number
  boolean = 'boolean',        // number
  timestamp = 'timestamp',    // number // js, milliseconds from epoch
  string = 'string',          // string
  url = 'url',                // string
  isoDate = 'isoDate',        // string // ISO Date: YYYY-MM-DD
  time = 'time',              // string // 24h time: HH:mm:ss
  colorRgba = 'colorRgba',    // string // 'rrggbbaa'
  colorLch = 'colorLch',      // string // '52.2345% 72.2 56.2 / .5'
}

export type TokenMediaType = 'image' | 'video' | 'audio' | '3d' | 'file' | 'link'
export type LinkType =
  'youtube'
  | 'vimeo'
  | 'soundcloud'
  | 'spotify'
  | 'deezer'
  | 'tiktok'
  | 'instagram'
  | 'twitter'
  | 'facebook'
  | 'twitch'
  | 'dailymotion'
  | 'mixcloud'
  | 'figma'

export type TokenMediaInfo = {
  type?: TokenMediaType
  linkType?: LinkType
  title?: LocalizedStringWithDefault
  order?: number
  main?: boolean
  baseUrlKey?: string
  loop?: boolean
  animation?: boolean
  posterFor?: string
}

type ScalarOrArrayOf<T> = T | T[]

type AttributeBaseSchema = {
  order?: number // to sort attrs
  title: LocalizedStringWithDefault
  type: keyof typeof AttributeType // or just make the type `string` and that's all?
  array?: boolean
}

export type RoyaltySchema = {
  royaltyVersion: string // '1'
  primary?: {
    addresses: {
      [K: string]: number // address: percent with decimals 4, i. e. 1000000 = 100% or 10000 = 1%
    }
  }
  secondary?: {
    addresses: {
      [K: string]: number // address: percent with decimals 4, i. e. 1000000 = 100% or 10000 = 1%
    }
  }
}

export type UniqueCollectionSchemaV2 = {
  schemaName: string // 'unique'
  schemaVersion: string // '2.x.x'

  baseUrl: string
  ipfsGateways?: string[]
  defaultLocale?: string
  defaultPermission?: TokenPropertyPermissionValue
  defaultPermissionForPropertyCommon?: TokenPropertyPermissionValue

  // additional field to add a free form information to the collection
  // without generic knowledge how to read this info for wallets
  info?: any

  cover: ImageItem

  media?: {
    defaultPermission?: TokenPropertyPermissionValue
    schema: {
      [K: string]: TokenMediaInfo & {
        type: TokenMediaType
        required?: boolean
        customPermission?: TokenPropertyPermissionValue
      }
    }
  }

  attributes?: {
    defaultPermission?: TokenPropertyPermissionValue
    schema: {
      [K: string]: AttributeBaseSchema & {
        optional?: boolean
        enumValues?: { [K: string | number]: LocalizedStringOrBoxedNumberWithDefault & { order?: number } }
        defaultValue?: ScalarOrArrayOf<string | number | LocalizedStringOrBoxedNumberWithDefault>
        customPermission?: TokenPropertyPermissionValue
      }
    }
  }

  royalties?: RoyaltySchema & {
    defaultPermission?: TokenPropertyPermissionValue
  }
}

type TokenMediaItem = TokenMediaInfo & {
  url?: string
  urlInfix?: undefined
  ipfsCid?: string
}

type ImageItem = Omit<TokenMediaItem, 'type' | 'main' | 'order' | 'posterFor'>

type TokenCommonData = {
  preview?: ImageItem

  defaultLocale?: string

  name?: LocalizedStringWithDefault
  description?: LocalizedStringWithDefault

  info?: any // this field is needed for some free form data about the token
  ERC721TokenURI?: string
}

type SchemaBasedAttributeInToken = {
  values?: Array<LocalizedStringOrBoxedNumberWithDefault>
  enumKeys?: Array<string | number>
}

type DynamicAttributeInToken = AttributeBaseSchema & {
  values: Array<LocalizedStringOrBoxedNumberWithDefault>
}

export type UniqueTokenV2 = {
  common?: TokenCommonData
  media: { [K: string]: TokenMediaItem }
  royalties?: RoyaltySchema
  attributes?: { [K: string]: SchemaBasedAttributeInToken | DynamicAttributeInToken }
}
