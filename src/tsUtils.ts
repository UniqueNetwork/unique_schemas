import {StringUtils} from '@unique-nft/utils'

export const getKeys = <T extends Object>(o: T) => Object.keys(o) as Array<keyof T>
export const getValues = <T extends Object>(o: T) => Object.values(o) as Array<T[keyof T]>
export const getEntries = <T extends Object>(o: T) => Object.entries(o) as Array<[keyof T, T[keyof T]]>

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

type EnumBaseType = Record<string, number | string>

export const getEnumKeys = <T extends EnumBaseType>(en: T): Array<keyof T> => {
  const arr = getValues(en)
  return arr.slice(0, arr.length / 2) as any as Array<keyof T>
}
export const getEnumValues = <T extends EnumBaseType>(en: T): Array<T[keyof T]> => {
  const arr = getValues(en)
  return arr
}

type EnumReverse<T extends EnumBaseType> = { [K in T[keyof T]]: keyof T }
export const getReversedEnum = <T extends EnumBaseType>(en: T): EnumReverse<T> => {
  const arr = getValues(en)
  const result = {} as any
  for (let i = 0; i < arr.length / 2; i++) {
    result[arr[i + arr.length / 2]] = arr[i]
  }
  return result
}

export const safeJSONParse = <T>(str: string): T | string => {
  try {
    return JSON.parse(str) as T
  } catch {
    return str
  }
}

export const safeJsonParseStringOrHexString = <T = any>(stringOrHexString: string): T | string => {
  try {
    return JSON.parse(stringOrHexString) as T
  } catch {
    return safeJSONParse<T>(StringUtils.Utf8.hexStringToString(stringOrHexString))
  }
}
