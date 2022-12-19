import {F} from "vitest/dist/global-e98f203b";

type RawUrlOrInfix = {
  url: string,
  infix?: undefined

  isIpfs?: boolean
} | {
  infix: string,
  url?: undefined

  isIpfs?: boolean
}

type UrlOrInfix<FullUrl> = RawUrlOrInfix & FullUrl

type AnimationUrlOrInfix<FullUrl> = UrlOrInfix<FullUrl> & {isVideo?: boolean}

type GenericLocalizedWithDefault<T> = {
  _: T
  [K: string]: T
}
type BoxedNumberWithDefault = { _: number }

type LocalizedStringWithDefault = GenericLocalizedWithDefault<string>
type LocalizedStringOrBoxedNumberWithDefault = BoxedNumberWithDefault | LocalizedStringWithDefault

type LocalizedUrlOfInfix<FullUrl> = GenericLocalizedWithDefault<UrlOrInfix<FullUrl>>
type LocalizedAnimationUrlOrInfix<FullUrl> = GenericLocalizedWithDefault<AnimationUrlOrInfix<FullUrl>>

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

type ImageDataGeneric<FullUrl = {}> = {
  main: LocalizedUrlOfInfix<FullUrl>
  fullQuality?: LocalizedUrlOfInfix<FullUrl>
  animation?: LocalizedAnimationUrlOrInfix<FullUrl>
}

type ContentTypeSchema<T = {}> = T & {
  baseUrl?: string
  isIpfsByDefault?: string
}

type OneAttributeSchema<T = {}> = T & {
  order?: number // to sort properties
  name: LocalizedStringWithDefault
  type: keyof typeof AttributeType // or just make the type `string` and that's all?
  isMultipleValues?: boolean
  optional?: boolean
  enumValues?: {[K: string]: LocalizedStringOrBoxedNumberWithDefault & {order?: number}}
  defaultValue?: LocalizedStringOrBoxedNumberWithDefault
}

type AttributesSchema<T = {}> = T & {
  schemaVersion: string

  defaultLocale?: string,

  combineAllAttributesToOneProperty?: boolean

  schema: {
    [K: string]: OneAttributeSchema<T>
  }
}

type UniqueCollectionSchemaV2Generic<Permission, FullUrl> = Permission & {
  schemaName: string // 'unique'
  schemaVersion: string // '2.x.x'

  baseUrl?: string,
  defaultLocale?: string
  combineAllContentInOneProperty?: boolean

  // additional field to add a free form information to the collection
  // without generic knowledge how to read this info for wallets
  info?: any

  cover: ImageDataGeneric<{}>

  content: {
    images: Omit<ContentTypeSchema<Permission>, 'baseUrl'> & {
      baseUrl: string
      previewBaseUrl?: string
      fullQualityBaseUrl?: string
    }

    videos?: ContentTypeSchema<Permission>

    audios?: ContentTypeSchema<Permission>

    volumes?: ContentTypeSchema<Permission>

    files?: ContentTypeSchema<Permission> & {
      defaultMimeType?: string
    }
  }

  attributes?: AttributesSchema<Permission>
}


// to encode the collection we need to append everywhere the 'defaultPermission' field
export type UniqueCollectionSchemaV2ToEncode = UniqueCollectionSchemaV2Generic<{
  defaultPermission?: TokenPropertyPermissionValue
}, {}>

// collection schema in the blockchain has now permission data as well as full url data
export type UniqueCollectionSchemaV2InCollection = UniqueCollectionSchemaV2Generic<{}, {}>

// decoded collection schema has no permission data but has full url in cover
export type UniqueCollectionSchemaV2Decoded = UniqueCollectionSchemaV2Generic<{}, {
  url: string
}>

type TokenMediaContent<FullUrl> = {
  main: LocalizedUrlOfInfix<FullUrl>
  order?: number
  isMain?: number
}

type TokenCommonData = {
  defaultLocale?: string

  name?: LocalizedStringWithDefault
  description?: LocalizedStringWithDefault

  info?: any // this field is needed for some free form data about the token
}
type TokenContentData<FullUrl> = {
  images: Array<Omit<TokenMediaContent<FullUrl>, 'main'> & {
    main: LocalizedAnimationUrlOrInfix<FullUrl>
    preview?: LocalizedAnimationUrlOrInfix<FullUrl>
    fullQuality?: LocalizedAnimationUrlOrInfix<FullUrl>
  }>
  videos?: Array<TokenMediaContent<FullUrl>>
  audios?: Array<TokenMediaContent<FullUrl>>
  volumes?: Array<TokenMediaContent<FullUrl>>
  files?: Array<TokenMediaContent<FullUrl>>
}

type UniqueTokenSchemaV2Generic<FullUrl> = {
  common?: TokenCommonData
  content: TokenContentData<FullUrl>
  attributes?: {
    [K: string]: {
      values: Array<LocalizedStringOrBoxedNumberWithDefault>
      enumKeys?: undefined
    } | {
      values?: undefined
      enumKeys: Array<number>
    }
  }
}

export type UniqueTokenV2ToEncode = UniqueTokenSchemaV2Generic<{}>

export type UniqueTokenV2Decoded = Omit<UniqueTokenSchemaV2Generic<{ url: string }>, 'attributes'> & {
  attributes?: {
    [K: string]: Omit<OneAttributeSchema<{}>, 'enumValues' | 'defaultValue'> & {
      values: Array<LocalizedStringOrBoxedNumberWithDefault>
      enumKeys?: Array<number>
    }
  }
}
