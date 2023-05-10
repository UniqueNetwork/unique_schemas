import {getEnumValues} from './tsUtils'
import {z} from 'zod'

export class ValidationError extends TypeError {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }

  static fromZodError(varName: string, error: z.ZodError) {
    const errorMessages = error.issues.map(issue => issue.message).join(', ')
    return new ValidationError(`Error in ${varName}: ${errorMessages}`)
  }

  static throwIfZodValidationFailed<I, O>(varName: string, result: z.SafeParseReturnType<I, O>) {
    if (!result.success) {
      throw ValidationError.fromZodError(varName, result.error)
    }
    return true
  }
}

export const URL_TEMPLATE_INFIX = <const>'{infix}'

export const zUrlOrInfix = z.union([
  z.object({
    url: z.string().url(),
    urlInfix: z.never().optional()
  }),
  z.object({
    urlInfix: z.string(),
    url: z.never().optional()
  }),
])
export const zUrlAndMaybeInfix = z.object({
  url: z.string(),
  urlInfix: z.string().optional(),
})

export type UrlOrInfix = z.infer<typeof zUrlOrInfix>
export type UrlAndMaybeInfix = z.infer<typeof zUrlAndMaybeInfix>

export enum AttributeType {
  number = 'number',          // number
  integer = 'integer',        // number
  float = 'float',            // number
  boolean = 'boolean',        // number
  timestamp = 'timestamp',    // number // js, milliseconds from epoch
  string = 'string',          // string
  url = 'url',                // string
  isoDate = 'isoDate',        // string // ISO Date: YYYY-MM-DD
  time = 'time',              // string // 24h time: HH:mm:ss
  colorRgba = 'colorRgba',    // string // 'rrggbbaa'
}

export const zAttributeType = z.nativeEnum(AttributeType)

export const NumberAttributeTypes = [
  AttributeType.number, AttributeType.integer, AttributeType.float, AttributeType.boolean, AttributeType.timestamp,
]
export const IntegerAttributeTypes = [
  AttributeType.integer, AttributeType.boolean, AttributeType.timestamp,
]
export const StringAttributeTypes = [
  AttributeType.string, AttributeType.url, AttributeType.isoDate, AttributeType.time, AttributeType.colorRgba,
]
export const AttributeTypeValues = getEnumValues(AttributeType)

export const zBoxedNumberWithDefault = z.object({
  _: z.number(),
})

export type BoxedNumberWithDefault = z.infer<typeof zBoxedNumberWithDefault>


export const LANGUAGE_CODE_REGEX = /^[A-Za-z]{2,4}([_-][A-Za-z]{4})?([_-]([A-Za-z]{2}|[0-9]{3}))?$/

export const zLocalizedStringWithDefault = z.union([
  z.record(z.string().regex(LANGUAGE_CODE_REGEX), z.string()),
  z.object({_: z.string()})
])

export type LocalizedStringWithDefault = z.infer<typeof zLocalizedStringWithDefault>

export const zLocalizedStringOrBoxedNumberWithDefault = z.union([
  zLocalizedStringWithDefault,
  zBoxedNumberWithDefault,
])

export type LocalizedStringOrBoxedNumberWithDefault = z.infer<typeof zLocalizedStringOrBoxedNumberWithDefault>

export const zAttributeSchema = z.object({
  name: zLocalizedStringWithDefault,
  optional: z.boolean().optional(),
  isArray: z.boolean().optional(),
  type: zAttributeType,
  enumValues: z.record(z.number(), zLocalizedStringOrBoxedNumberWithDefault).optional(),
})

export type AttributeSchema = z.infer<typeof zAttributeSchema>

export const zEncodedEnumAttributeValue = z.union([
  z.number(),
  z.array(z.number()),
])
export type EncodedEnumAttributeValue = z.infer<typeof zEncodedEnumAttributeValue>

export const zEncodedNumberAttributeValue = z.union([
  z.number(),
  z.array(z.number()),
  zLocalizedStringOrBoxedNumberWithDefault,
  z.array(zLocalizedStringOrBoxedNumberWithDefault),
])

export type EncodedTokenAttributeValue = z.infer<typeof zEncodedNumberAttributeValue>

export const zEncodedTokenAttributes = z.record(z.number(), zEncodedNumberAttributeValue)
export type EncodedTokenAttributes = z.infer<typeof zEncodedTokenAttributes>

export const zCollectionAttributesSchema = z.record(z.number(), zAttributeSchema)
export type CollectionAttributesSchema = z.infer<typeof zCollectionAttributesSchema>

export const zCollectionSchemaMediaItem = z.object({
  urlTemplate: z.string(),
})

const zTokenPropertyPermission = z.object({
  mutable: z.boolean().optional(),
  collectionAdmin: z.boolean().optional(),
  tokenOwner: z.boolean().optional(),
})

export const zUniqueCollectionSchemaToCreate = z.object({
  coverPicture: zUrlOrInfix,
  coverPicturePreview: zUrlOrInfix.optional(),

  attributesSchemaVersion: z.string().regex(/^(\d+\.)?(\d+\.)?(\*|\d+)$/).optional(),
  attributesSchema: zCollectionAttributesSchema.optional(),

  image: zCollectionSchemaMediaItem,
  imagePreview: zCollectionSchemaMediaItem.optional(),
  file: zCollectionSchemaMediaItem.optional(),
  video: zCollectionSchemaMediaItem.optional(),
  audio: zCollectionSchemaMediaItem.extend({
    format: z.string().optional(),
    isLossless: z.boolean().optional(),
  }).optional(),
  spatialObject: zCollectionSchemaMediaItem.extend({
    format: z.string().optional(),
  }).optional(),

  defaultPermission: zTokenPropertyPermission.optional(),
})

export type UniqueCollectionSchemaToCreate = z.infer<typeof zUniqueCollectionSchemaToCreate>

export const zCollectionSchemaDecoded = zUniqueCollectionSchemaToCreate.omit({
  coverPicture: true,
  coverPicturePreview: true,
}).extend({
  collectionId: z.number(),
  coverPicture: zUrlAndMaybeInfix,
  coverPicturePreview: zUrlAndMaybeInfix.optional(),
  oldProperties: z.object({
    _old_schemaVersion: z.string().optional(),
    _old_offchainSchema: z.string().optional(),
    _old_constOnChainSchema: z.string().optional(),
    _old_variableOnChainSchema: z.string().optional(),
  }).optional(),
  baseURI: z.string().optional(),
})

export type UniqueCollectionSchemaDecoded = z.infer<typeof zCollectionSchemaDecoded>

export const zUniqueTokenToCreate = z.object({
  name: zLocalizedStringWithDefault.optional(),
  description: zLocalizedStringWithDefault.optional(),
  image: zUrlOrInfix,
  imagePreview: zUrlOrInfix.optional(),
  file: zUrlOrInfix.optional(),
  video: zUrlOrInfix.optional(),
  audio: zUrlOrInfix.optional(),
  spatialObject: zUrlOrInfix.optional(),
  encodedAttributes: zEncodedTokenAttributes.optional(),
})

export type UniqueTokenToCreate = z.infer<typeof zUniqueTokenToCreate>

export const zDecodedAttributes = z.record(z.number(), z.object({
  name: zLocalizedStringWithDefault,
  value: z.union([
    zLocalizedStringOrBoxedNumberWithDefault,
    z.array(zLocalizedStringOrBoxedNumberWithDefault),
  ]),
  type: zAttributeType,
  isArray: z.boolean(),
  rawValue: z.union([
    zEncodedNumberAttributeValue,
    z.string(),
    z.array(z.string()),
  ]),
  isEnum: z.boolean(),
}))

export type DecodedAttributes = z.infer<typeof zDecodedAttributes>

export const zCrossAccountId = z.union([
  z.object({
    Substrate: z.string(),
    Ethereum: z.never().optional(),
  }),
  z.object({
    Substrate: z.never().optional(),
    Ethereum: z.string(),
  }),
])

export const zDecodingImageLinkOptions = z.object({
  imageUrlTemplate: z.string().optional(),
  dummyImageFullUrl: z.string().optional(),
})

export const zERC721MetadataAttribute = z.object({
  trait_type: z.string(),
  value: z.union([z.string(), z.number()]),
})

export type ERC721MetadataAttribute = z.infer<typeof zERC721MetadataAttribute>

export const zERC721Metadata = z.object({
  name: z.string(),
  description: z.string(),
  image: z.string(),
  attributes: z.array(zERC721MetadataAttribute),
})

export type ERC721Metadata = z.infer<typeof zERC721Metadata>

export const zUniqueTokenDecoded = z.object({
  name: zLocalizedStringWithDefault.optional(),
  description: zLocalizedStringWithDefault.optional(),

  image: zUrlAndMaybeInfix,
  imagePreview: zUrlAndMaybeInfix.optional(),
  file: zUrlAndMaybeInfix.optional(),
  video: zUrlAndMaybeInfix.optional(),
  audio: zUrlAndMaybeInfix.optional(),
  spatialObject: zUrlAndMaybeInfix.optional(),

  tokenId: z.number(),
  collectionId: z.number(),
  owner: z.nullable(zCrossAccountId),
  nestingParentToken: z.object({collectionId: z.number(), tokenId: z.number(),}).optional(),
  attributes: zDecodedAttributes,
  erc721Metadata: z.object({
    metadata: zERC721Metadata,
    tokenURI: z.string(),
  }),
})

export type UniqueTokenDecoded = z.infer<typeof zUniqueTokenDecoded>
