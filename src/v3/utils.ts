import {ProbablyDecodedProperty, ProbablyDecodedPropsDict} from './types'
import {Utf8} from '@unique-nft/utils/string'

export const safeJSONParseWithPossibleEmptyInput = <T>(str?: string | null | undefined): T | string | null => {
  if (typeof str !== 'string') return null

  try {
    return JSON.parse(str) as T
  } catch (e) {
    return str
  }
}


export const safelyDecodeUTF8String = (hex: string): string | null => {
  try {
    return Utf8.hexStringToString(hex)
  } catch (e) {
    return null
  }
}


export const buildDictionaryFromPropertiesArray = (properties?: ProbablyDecodedProperty[]): ProbablyDecodedPropsDict => {
  if (!properties) return {}

  return properties.reduce((acc, property) => {
    acc[property.key] = {
      valueHex: property.valueHex,
      value: property.value || safelyDecodeUTF8String(property.valueHex),
    }
    return acc
  }, {} as ProbablyDecodedPropsDict)
}


export const getTokenURI = (tokenProperties: ProbablyDecodedPropsDict, collectionProperties?: ProbablyDecodedPropsDict): string | null => {
  const tokenURI = tokenProperties.URI?.value ||
    (
      (collectionProperties?.baseURI?.value || '') +
      (tokenProperties.URISuffix?.value || '')
    )

  return tokenURI || null
}

