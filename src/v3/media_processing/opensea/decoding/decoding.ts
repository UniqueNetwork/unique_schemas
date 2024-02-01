import {DecodedAttributeDto, TokenByIdResponse, UniqueRoyaltyPartDto} from "@unique-nft/sdk"
import type {AdditionalMedia, Attribute, Royalty} from "./types"
import {AttributeDisplayTypes} from "./types"
import {getAudioDetailsOnline, getImageDetailsOnline, getVideoDetailsOnline} from "../../../utils"
import {IV2Collection, IV2Media, IV2MediaType, IV2Token, zMedia, zMediaType} from '../../../schemaV2.zod'

interface LocalizeObject {
  _?: string | number
  en?: string | number
}

const parseLocalizeObject = (data?: LocalizeObject): string => {
  if (data?._) return `${data?._}`
  if (data?.en) return `${data?.en}`
  return 'unknown'
}

const parseDisplayType = (type: DecodedAttributeDto['type']): AttributeDisplayTypes => {
  if (['float', 'integer', 'number'].includes(type)) return AttributeDisplayTypes.number

  if (['isoDate', 'timestamp', 'time'].includes(type)) return AttributeDisplayTypes.date

  // if (['string', 'url', 'colorRgba'].includes(type)) return AttributeDisplayTypes.string

  return AttributeDisplayTypes.string
}

const parseAttributes = (token: TokenByIdResponse): Attribute[] => {
  return Object.values(token.attributes).map(attribute => {
    const trait_type = attribute.name?._ || 'unknown'
    const display_type = parseDisplayType(attribute.type)
    const value = attribute.value

    if (Array.isArray(value)) {
      return value.map(v => ({
        trait_type,
        value: parseLocalizeObject(v),
        display_type
      } satisfies Attribute))
    } else {
      return {
        trait_type,
        value: parseLocalizeObject(value),
        display_type
      } satisfies Attribute
    }
  }).flat()
}

const decodeAdditionalMedia = async (
  type: MediaType,
  data?: { fullUrl?: string | null },
  withDetails?: boolean
): Promise<IV2Media | null> => {
  if (!data?.fullUrl) return null

  let details: any
  let type: IV2MediaType = MediaType.IMAGE
  if (withDetails) {
    if (type === MediaType.VIDEO) {
      details = await getVideoDetailsOnline(data.fullUrl)
    } else if (type === MediaType.AUDIO) {
      details = await getAudioDetailsOnline(data.fullUrl)
    } else if (type === MediaType.IMAGE) {
      details = await getImageDetailsOnline(data.fullUrl)
    }
  }

  return {
    url: data?.fullUrl,
    name: '',
    details
  }
}

const decodeAllAdditionalMedia = async (token: TokenByIdResponse, withDetails: boolean): Promise<IV2Media> => {
  const mediaList = (await Promise.all([
    decodeAdditionalMedia(zMediaType.enum.image, token.video, withDetails),
    decodeAdditionalMedia(zMediaType.enum.audio, token.audio, withDetails),
    decodeAdditionalMedia(MediaType.IMAGE, token.image, withDetails),
  ])).filter(media => !!media)

  return mediaList.filter(media => !!media) as AdditionalMedia[]
}

const decodeRoyalty = (royalty: UniqueRoyaltyPartDto): Royalty => {
  const value = +royalty.value
  const decimals = +royalty.decimals
  return {
    address: royalty.address,
    percent: value / Math.pow(10, decimals - 2)
  }
}

const decodeRoyalties = (token: TokenByIdResponse): Royalty[] => {
  const royalties: Royalty[] = []

  if (token.royalties) {
    royalties.push(...token.royalties.map(decodeRoyalty))
  }

  if (token.collection.schema?.royalties) {
    royalties.push(...token.collection.schema?.royalties.map(decodeRoyalty))
  }

  return royalties
}

export const decoding = async (options: any): Promise<IV2Token> => {

  const openseaExample = {
    version: '2.0.0',
    name: token.name?._ || '',
    description: token.description?._ || '',
    image: token.image.fullUrl || undefined,
    image_details: undefined,
    // preview_image_url: token.imagePreview?.fullUrl || undefined,
    // preview_image_details:  undefined,
    // use_preview_as_main_image: undefined,
    attributes: parseAttributes(token),
    animation_url: token.animati,
    animation_details: undefined,
    youtube_url: undefined,
    created_by: undefined,
    background_color: undefined,
    external_url: undefined,
    royalties: decodeRoyalties(token),
    locale: 'en',
  } satisfies IV2Token

  zTokenSchema.parse(openseaExample)

  return openseaExample
}

