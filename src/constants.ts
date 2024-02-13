import {TokenPropertyPermission} from './types'

export const PERMISSION = <const>{
  REWRITEABLE_FOR_BOTH: {mutable: true, collectionAdmin: true, tokenOwner: true},
  REWRITEABLE_FOR_COLLECTION_ADMIN: {mutable: true, collectionAdmin: true, tokenOwner: false},
  REWRITEABLE_FOR_TOKEN_OWNER: {mutable: true, collectionAdmin: false, tokenOwner: true},

  WRITABLE_ONCE_FOR_BOTH: {mutable: false, collectionAdmin: true, tokenOwner: true},
  WRITABLE_ONCE_FOR_COLLECTION_ADMIN: {mutable: false, collectionAdmin: true, tokenOwner: false},
  WRITABLE_ONCE_FOR_TOKEN_OWNER: {mutable: false, collectionAdmin: false, tokenOwner: true},
} satisfies { [K: string]: TokenPropertyPermission}

export const DEFAULT_PERMISSION = PERMISSION.WRITABLE_ONCE_FOR_COLLECTION_ADMIN


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
export type SubType =
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

export const SCHEMA_NAME = 'unique'
export const SCHEMA_VERSION = '2.0.0'
