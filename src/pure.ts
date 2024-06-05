export * as SCHEMAS from './schema.zod'
export * from './schema.zod'
import {DEFAULT_PERMISSION, PERMISSION, SCHEMA_NAME, SCHEMA_VERSION} from './constants'

export const SCHEMAS_CONSTANTS = {
  defaultSchemaName: SCHEMA_NAME,
  defaultSchemaVersion: SCHEMA_VERSION,
  defaultPermission: DEFAULT_PERMISSION,
  permissions: PERMISSION,
}

export * from './types'
export type * from './schema.zod'
