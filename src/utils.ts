import {ProbablyDecodedProperty, ProbablyDecodedPropsDict, PropertyForEncoding, PropertyWithHex} from './types'
import {Utf8} from '@unique-nft/utils/string'
import {StringUtils} from '@unique-nft/utils'
import {IV2Royalty} from '@unique-nft/utils/royalties'

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


export const decodeHexAndParseJSONOrReturnNull = <T = any>(hexString: string): T | null => {
  try {
    return JSON.parse(StringUtils.Utf8.hexStringToString(hexString)) as T
  } catch {
    return null
  }
}

export const safeJSONParse = <T>(str: string): T | string => {
  try {
    return JSON.parse(str) as T
  } catch {
    return str
  }
}




export const buildDictionaryFromPropertiesArray = (
  properties?: ProbablyDecodedProperty[]
): ProbablyDecodedPropsDict => {
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

export const zipTwoArraysByKey = <T extends { key: string }>(src1: T[], src2: T[]): T[] => {
  if (src2.length === 0) return src1

  const result: T[] = [...src1]
  for (const property of src2) {
    const index = result.findIndex(p => p.key === property.key)
    if (index === -1) {
      result.push(property)
    } else {
      result[index] = property
    }
  }
  return result
}

export const hexifyProperties = (properties: PropertyForEncoding[]): PropertyWithHex[] => {
  return properties.map(p => ({
    key: p.key,
    valueHex: p.valueHex ?? Utf8.stringToHexString(p.value),
  }))
}

export const mergeRoyalties = (a: IV2Royalty[], b: IV2Royalty[]): IV2Royalty[] => {
  // royalty is {address: string, percent: number}
  // need to zip them, when a and b have same address, use b value

  const result: IV2Royalty[] = [...a.map(r => ({...r}))]
  for (const royalty of b) {
    const index = result.findIndex(r => r.address === royalty.address)
    if (index === -1) {
      result.push(royalty)
    } else {
      result[index] = royalty
    }
  }

  return result
}
