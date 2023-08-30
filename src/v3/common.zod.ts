import {z} from 'zod'

export const zCollectionId = z.number().min(1).max((2 ** 32) - 1)
export const zTokenId = z.number().min(1).max((2 ** 32) - 1)
export const zCollectionAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/)

export const zCarbonOffset = z.object({
  collection_id: zCollectionId.optional(),
  collection_address: zCollectionAddress.optional(),
  token_id: zTokenId,
  co2_g: z.number().optional(),
}).refine(
  (v) => !!v.collection_id || !!v.collection_address,
  'collection_id or collection_address must be provided'
)
export type ICarbonOffset = z.infer<typeof zCarbonOffset>

export const zRoyalty = z.object({
  address: z.string(),
  percent: z.number().min(0).max(100),
  isPrimaryOnly: z.boolean().optional(),
})
export type IRoyalty = z.infer<typeof zRoyalty>

export const zLocalization = z.object({
  uri: z.string().includes('{locale}'),
  default: z.string(),
  locales: z.array(z.string()),
})
export type ILocalization = z.infer<typeof zLocalization>


export const zVersion = z.string().regex(/^\d+\.\d+\.\d+$/)
export type IVersion = z.infer<typeof zVersion>

export const zVersionRefine = {
  fn: (data: { version?: string }) => {
    if (data.version) {
      const [major, minor, patch] = data.version.split('.').map(Number)
      if (major !== 2) return false
      if (minor < 0) return false
      if (patch < 0) return false
    }
    return true
  },
  errorMessage: 'version must be in semver format: 2.x.x',
}
