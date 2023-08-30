import {z} from 'zod'
import {zCarbonOffset, zLocalization, zRoyalty, zVersionRefine} from './common.zod'

export const zAttributeDisplayType = z.enum([
  'string',
  'number',
  'date',
  'date_time',
  'url',
  'boost_number',
  'boost_percentage',
])
export type IAttributeDisplayType = z.infer<typeof zAttributeDisplayType>

export const zAttribute = z.object({
  trait_type: z.string(),
  value: z.union([z.string(), z.number()]),
  display_type: zAttributeDisplayType.optional(),
})
export type IAttribute = z.infer<typeof zAttribute>

export const zMediaType = z.enum([
  'image',
  'animation',
  'video',
  'audio',
  'spatial',
  'pdf',
  'other',
])
export type IMediaType = z.infer<typeof zMediaType>

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
export type IImageDetails = z.infer<typeof zImageDetails>

export const zMediaDetails = zImageDetails.extend({
  duration: z.number().optional(),
  codecs: z.array(z.string()).optional(),
  loop: z.boolean().optional(),

  poster_url: z.string().optional(),
  poster_details: zImageDetails.optional(),
})
export type IMediaDetails = z.infer<typeof zMediaDetails>

export const zImageStackingOptions = z.object({
  tag: z.string().optional(),

  image_url: z.string(),
  image_details: zImageDetails.optional(),

  layer: z.number().optional(),
  order_in_layer: z.number().optional(),

  offset_x: z.number().optional(),
  offset_y: z.number().optional(),
  scale: z.number().optional(),
  rotation: z.number().optional(),
  opacity: z.number().optional(),
})
export type IImageStackingOptions = z.infer<typeof zImageStackingOptions>

export const zTokenSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),

  version: z.string().optional(),
  onchain_fields: z.array(z.string()).optional(),

  created_by: z.string().optional(),
  external_url: z.string().optional(),
  background_color: z.string().optional(),
  youtube_url: z.string().optional(),

  image: z.string().optional(),
  image_url: z.string().optional(),
  image_details: zImageDetails.optional(),

  animation_url: z.string().optional(),
  animation_details: zMediaDetails.optional(),

  additional_media: z.array(
    z.object({
      url: z.string(),
      name: z.string().optional(),
      details: zMediaDetails.optional(),
      type: zMediaType.optional(),

      tag: z.string().optional(),
    })
  ).optional(),

  /*
  [{url: 'https://', name: 'my cool song', tag: 'song'}]
   */

  attributes: z.array(zAttribute).optional(),
  royalties: z.array(zRoyalty).optional(),
  image_stacking: zImageStackingOptions.optional(),

  carbon_offsets: z.array(zCarbonOffset).optional(),

  locale: z.string().optional(),
  localization: zLocalization.optional(),
})
  .refine(zVersionRefine.fn, zVersionRefine.errorMessage)
  .refine(
    (data) => {
      const imageUrlPresent = !!data.image_url
      const imagePresent = !!data.image
      if (!imageUrlPresent && !imagePresent) {
        return false
      } else if (imagePresent && imageUrlPresent) {
        return imagePresent === imageUrlPresent
      }
      return true
    },
    'You have to provide image or image_url, or make they same'
  )

export type ITokenSchema = z.infer<typeof zTokenSchema>

/*
Fields which may be stored onchain:
- name
- description
- image
- animation_url
- background_color
- youtube_url
- additional_media urls: 'media.{tag}'
- attributes: 'attribute.{trait_type}' - values are always strings
- royalties
- carbon_offset: 32 byte hex string of collection address (20), token id (4), and amount in grams (8)

Onchain localizations won't be supported in version 1.

// data:application/json;charset=utf-8,{"field":"name","value":"test","type":"string"}
//
// example:
// await (await fetch('data:application/json;charset=utf-8,{"field":"name","value":"test","type":"string"}')).json()
// > {field: 'name', value: 'test', type: 'string'}
*/
