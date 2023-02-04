import {TokenPropertyPermissionValue} from "./types";

export const PERMISSION = <const>{
  REWRITEABLE_FOR_BOTH: {mutable: true, collectionAdmin: true, tokenOwner: true},
  REWRITEABLE_FOR_COLLECTION_ADMIN: {mutable: true, collectionAdmin: true, tokenOwner: false},
  REWRITEABLE_FOR_TOKEN_OWNER: {mutable: true, collectionAdmin: false, tokenOwner: true},

  WRITABLE_ONCE_FOR_BOTH: {mutable: false, collectionAdmin: true, tokenOwner: true},
  WRITABLE_ONCE_FOR_COLLECTION_ADMIN: {mutable: false, collectionAdmin: true, tokenOwner: false},
  WRITABLE_ONCE_FOR_TOKEN_OWNER: {mutable: false, collectionAdmin: false, tokenOwner: true},
} satisfies {[K: string]: TokenPropertyPermissionValue}

export const DEFAULT_PERMISSION = PERMISSION.WRITABLE_ONCE_FOR_COLLECTION_ADMIN satisfies TokenPropertyPermissionValue
