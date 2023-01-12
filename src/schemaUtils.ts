import {PropertiesArray} from './unique_types'

import {
  DecodedInfixOrUrlOrCidAndHash,
  InfixOrUrlOrCidAndHash,
  URL_TEMPLATE_INFIX,
} from "./types";
import {safeJsonParseStringOrHexString} from "./tsUtils";

const convert2LayerObjectToProperties = <T extends object>(obj: T, separator: string): PropertiesArray => {
  if (typeof obj !== "object" || obj === null) {
    throw new Error(`Object is not valid: ${obj}`)
  }

  const collectionProperties: PropertiesArray = []

  for (let key in obj) {
    const value = obj[key]
    if (
      typeof value === 'object' &&
      !(value === null || value instanceof Map || value instanceof Set || Array.isArray(value))
    ) {
      for (let secondLevelKey in value) {
        const secondLevelValue = value[secondLevelKey]
        collectionProperties.push({
          key: `${key}${separator}${secondLevelKey}`,
          value: JSON.stringify(secondLevelValue)
        })
      }
    } else {
      collectionProperties.push({
        key,
        value: JSON.stringify(value)
      })
    }
  }

  return collectionProperties
}

export const convertPropertyArrayTo2layerObject = <T extends object>(properties: PropertiesArray, separator: string): T => {
  const obj: any = {}

  for (let {key, value} of properties) {
    const keyParts = key.split(separator)
    const length = keyParts.length
    if (length === 1) {
      obj[key] = safeJsonParseStringOrHexString(value)
    } else {
      const [key, innerKey] = keyParts
      if (typeof obj[key] !== 'object') {
        obj[key] = {}
      }
      obj[key][innerKey] = safeJsonParseStringOrHexString(value)
    }
  }
  return obj as T
}

const SEPARATOR = '.'

export const converters2Layers = {
  objectToProperties: <T extends object>(obj: T): PropertiesArray => {
    return convert2LayerObjectToProperties(obj, SEPARATOR)
  },
  propertiesToObject: <T extends object>(arr: PropertiesArray): T => {
    return convertPropertyArrayTo2layerObject(arr, SEPARATOR)
  }
}

export const decodeTokenUrlOrInfixOrCidWithHashField = <U extends { urlTemplate?: string }>(obj: InfixOrUrlOrCidAndHash, urlTemplateObj: U | undefined): DecodedInfixOrUrlOrCidAndHash => {
  const result: DecodedInfixOrUrlOrCidAndHash = {
    ...obj,
    fullUrl: null
  }

  if (typeof obj.url === 'string') {
    result.fullUrl = obj.url
    return result
  }

  const urlTemplate = urlTemplateObj?.urlTemplate

  if (typeof urlTemplate !== 'string' || urlTemplate.indexOf(URL_TEMPLATE_INFIX) < 0) {
    if (typeof obj.ipfsCid === 'string') {
      result.fullUrl = `ipfs://${obj.ipfsCid}`
    }
  } else {
    if (typeof obj.urlInfix === 'string') {
      result.fullUrl = urlTemplate.replace(URL_TEMPLATE_INFIX, obj.urlInfix)
    } else if (typeof obj.ipfsCid === 'string') {
      result.fullUrl = urlTemplate.replace(URL_TEMPLATE_INFIX, obj.ipfsCid)
    }
  }

  return result
}

export type DecodingResult<T> = {
  result: T
  error: null
} | {
  result: null
  error: Error
}
