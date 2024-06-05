import 'zod-openapi/extend'
import {z} from 'zod'
import {SCHEMA_NAME, SCHEMA_VERSION} from './constants'

export const zCollectionIdOrAddress = z.union([
  z.number().min(1).max((2 ** 32) - 1),
  z.string().regex(/^0x[a-fA-F0-9]{40}$/)
])
export type ICollectionIdOrAddress = z.infer<typeof zCollectionIdOrAddress>

export const zSemverString = z.string().regex(/^\d+\.\d+\.\d+$/)
export type ISemverString = z.infer<typeof zSemverString>

export const zMediaType = z.enum([
  'image',
  'animation',
  'video',
  'audio',
  'spatial',
  'pdf',
  'document',
  'other',
])
export type IV2MediaType = z.infer<typeof zMediaType>

export const zSemverString2xx = zSemverString.refine((version?: string) => {
    if (typeof version === 'string') {
      const [major, minor, patch] = version.split('.').map(Number)
      if (major !== 2) return false
      if (minor < 0) return false
      if (patch < 0) return false
    }
    return true
  },
  'version must be in semver format: 2.x.x'
)
export type IV2SemverString2xx = z.infer<typeof zSemverString2xx>

export const zImageDetails = z.object({
  name: z.string().optional(),
  type: zMediaType.optional(),
  bytes: z.number().optional(),
  format: z.string().optional(),
  sha256: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  order: z.number().optional(),
})
export type IV2ImageDetails = z.infer<typeof zImageDetails>

export const zImageWithDetails = z.object({
  url: z.string(),
  details: zImageDetails.optional(),
})
export type IV2ImageWithDetails = z.infer<typeof zImageWithDetails>

export const zImageWithDetailsAndThumbnail = zImageWithDetails.extend({
  thumbnail: zImageWithDetails.optional(),
})
export type IV2ImageWithDetailsAndThumbnail = z.infer<typeof zImageWithDetailsAndThumbnail>

export const zMediaDetails = zImageDetails.extend({
  duration: z.number().optional(),
  codecs: z.array(z.string()).optional(),
  loop: z.boolean().optional(),
})
export type IV2MediaDetails = z.infer<typeof zMediaDetails>

export const zMedia = z.object({
  type: zMediaType,
  url: z.string(),
  name: z.string().optional(),
  details: zMediaDetails.optional(),
  thumbnail: zImageWithDetails.optional(),
  poster: zImageWithDetails.optional(),
})
export type IV2Media = z.infer<typeof zMedia>

export const zAttribute = z.object({
  trait_type: z.string(),
  value: z.union([z.string(), z.number()]),
  display_type: z.string().optional(),
})
export type IV2Attribute = z.infer<typeof zAttribute>

export const zRoyalty = z.object({
  address: z.string(),
  percent: z.number().min(0).max(100),
  isPrimaryOnly: z.boolean().optional(),
})
export type IV2Royalty = z.infer<typeof zRoyalty>

///// customizing

export const zCustomizingImageOverlaySpecs = z.object({
  layer: z.number(),
  order_in_layer: z.number(),
  offset: z.object({x: z.number(), y: z.number()}).partial(),
  opacity: z.number(),
  rotation: z.number(),
  scale: z.object({
    x: z.number().optional(),
    y: z.number().optional(),
    unit: z.enum(['px', '%']).default('%').optional(),
  }),
  anchor_point: z.object({x: z.number(), y: z.number()}),
  parent_anchor_point: z.object({x: z.number(), y: z.number()}),
}).partial()
export type IV2CustomizingImageOverlaySpecs = z.infer<typeof zCustomizingImageOverlaySpecs>

export const zCustomizingMutatorReaction = zCustomizingImageOverlaySpecs.extend({
  url: z.string(),
  details: zImageDetails,
}).partial()
export type IV2CustomizingMutatorReaction = z.infer<typeof zCustomizingMutatorReaction>

export const zCustomizingFileInfo = z.object({
  type: zMediaType,
  url: z.string(),

  name: z.string().optional(),
  details: zMediaDetails.optional(),
  image_overlay_specs: zCustomizingImageOverlaySpecs.optional(),
  placeholder: zImageWithDetails.optional(),
})
export type IV2CustomizingFileInfo = z.infer<typeof zCustomizingFileInfo>

export const zCustomizingSlot = z.object({
  type: zMediaType,
  collections: zCollectionIdOrAddress.array().optional(),
  name: z.string().optional(),
  image_overlay_specs: zCustomizingImageOverlaySpecs.optional(),
})
export type IV2CustomizingSlot = z.infer<typeof zCustomizingSlot>

export const zCustomizing = z.object({
  self: zCustomizingFileInfo.extend({tag: z.string(),}),
  slots: z.record(zCustomizingSlot).optional(),
  mutator_reactions: z.record(zCustomizingMutatorReaction).optional(),
  mutators: z.array(z.string()).optional(),
})
export type IV2Customizing = z.infer<typeof zCustomizing>

export const zCustomizingOverrides = z.object({
  self: zCustomizingFileInfo.extend({tag: z.string(),}).partial().optional(),
  slots: z.record(zCustomizingSlot.partial()).optional(),
  mutator_reactions: z.record(zCustomizingMutatorReaction.partial()).optional(),
  mutators: z.array(z.string()).optional(),
})
export type IV2CustomizingOverrides = z.infer<typeof zCustomizingOverrides>

export const zTokenSchema = z.object({
  // base stuff
  schemaName: z.string().optional().default(SCHEMA_NAME),
  schemaVersion: zSemverString2xx.optional().default(SCHEMA_VERSION),
  originalSchemaVersion: zSemverString.optional(),

  name: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  image_details: zImageDetails.optional(),
  attributes: z.array(zAttribute).optional(),

  // Unique-specific stuff
  media: z.record(zMedia).optional(),
  royalties: z.array(zRoyalty).optional(),
  customizing: zCustomizing.optional(),
  customizing_overrides: zCustomizingOverrides.optional(),

  // OpenSea-compatibility stuff
  animation_url: z.string().optional(),
  animation_details: zImageDetails.optional(),
  youtube_url: z.string().optional(),
  created_by: z.string().optional(),
  background_color: z.string().optional(),
  external_url: z.string().optional(),
  locale: z.string().optional(),
})
export type IV2Token = z.infer<typeof zTokenSchema>
export type IV2TokenForEncoding = z.input<typeof zTokenSchema>

const zPotentialAttributeValues = z.array(z.object({
  trait_type: z.string(),
  display_type: z.string().optional(),
  values: z.array(z.union([z.string(), z.number()])).optional(),
}))
export type IV2PotentialAttributeValues = z.infer<typeof zPotentialAttributeValues>

export const zCollectionSchema = z.object({
  schemaName: z.string()
    .optional()
    .refine((v) => v === SCHEMA_NAME, {message: `schemaName must be "${SCHEMA_NAME}"`})
    .default(SCHEMA_NAME),
  schemaVersion: zSemverString2xx.optional().default(SCHEMA_VERSION),
  originalSchemaVersion: zSemverString.optional(),

  cover_image: zImageWithDetailsAndThumbnail.optional(),
  default_token_image: zImageWithDetailsAndThumbnail.optional(),

  potential_attributes: zPotentialAttributeValues.optional(),

  customizing: z.object({
    slots: z.record(zCustomizingSlot).optional(),
    customizes: zCollectionIdOrAddress.array().optional(),
  }).optional(),

  royalties: z.array(zRoyalty).optional(),
})
export type IV2Collection = z.infer<typeof zCollectionSchema>
export type IV2CollectionForEncoding = z.input<typeof zCollectionSchema>
