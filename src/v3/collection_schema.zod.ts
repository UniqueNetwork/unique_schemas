import {z} from 'zod'
import {zCarbonOffset, zLocalization, zRoyalty, zVersion, zVersionRefine} from './common.zod'
import {zAttributeDisplayType, zImageDetails} from './token_schema.zod'

export const zCollectionSchema = z.object({
  name: z.string(),
  description: z.string(),
  token_prefix: z.string(),

  //semver x.x.x
  version: zVersion.optional(),

  cover_image_url: z.string().optional(),
  cover_image_details: zImageDetails.optional(),

  attributes_schema: z.array(z.object({
    trait_type: z.string(),
    is_array: z.boolean().optional(),
    is_required: z.boolean().optional(),
    display_type: zAttributeDisplayType.optional(),
    values: z.union([z.array(z.string()), z.array(z.number())]).optional(),
  })).optional(),

  onchain_fields: z.array(z.string()).optional(),

  royalties: z.array(zRoyalty).optional(),

  carbon_offsets: z.array(zCarbonOffset).optional(),

  locale: z.string().optional(),
  localization: zLocalization.optional(),
}).refine(zVersionRefine.fn, zVersionRefine.errorMessage)

export type ICollectionSchema = z.infer<typeof zCollectionSchema>
