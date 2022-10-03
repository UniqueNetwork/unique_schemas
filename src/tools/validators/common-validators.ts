import {ValidationError} from "../../types";
import {TokenPropertyPermissionObject} from "../../unique_types";
import {
  BoxedNumberWithDefault,
  InfixOrUrlOrCidAndHash,
  LocalizedStringWithDefault,
  URL_TEMPLATE_INFIX,
  UrlTemplateString
} from "../../types";
import {getKeys} from "../../tsUtils";
import {Semver} from "../../semver";
import {LANG_REGEX} from "./constants";

export const isPlainObject = (obj: any, varName: string): obj is Object => {
  if (typeof obj !== 'object')
    throw new ValidationError(`${varName} is not an object, got ${typeof obj}: ${obj}`)
  if (obj === null)
    throw new ValidationError(`${varName} is a null, should be valid object`)
  if (obj instanceof Map)
    throw new ValidationError(`${varName} is a Map, should be plain object`)
  if (obj instanceof Set)
    throw new ValidationError(`${varName} is a Set, should be plain object`)
  if (Array.isArray(obj))
    throw new ValidationError(`${varName} is an array, should be plain object`)

  return true
}

export const validateNumber = (num: any, shouldBeInteger: boolean, varName: string): num is number => {
  if (typeof num !== 'number' || isNaN(num)) {
    throw new ValidationError(`${varName} is not a valid number, got ${num}`)
  }
  if (shouldBeInteger && num !== Math.round(num)) {
    throw new ValidationError(`${varName} is not an integer number, got ${num}`)
  }
  return true
}

export const validateAttributeKey = (num: string | number | symbol, varName: string): boolean => {
  let isOk = false

  if (typeof num === 'number') {
    isOk = num === Math.round(num);
  } else if (typeof num === 'string') {
    const parsed = parseFloat(num);

    isOk = !isNaN(parsed) && parsed === Math.round(parsed);
  }

  if (!isOk) {
    throw new ValidationError(`${varName}["${String(num)}"] is not a valid number key, got ${String(num)}`)
  }

  return true
}

const validateLangCode = (key: string | number | symbol, varName: string): boolean => {
  if (typeof key !== 'string') {
    throw new ValidationError(`${varName}: key ${String(key)} should be a string`)
  }
  if (!key.match(LANG_REGEX)) {
    throw new ValidationError(`${varName} should be a valid Language code string (like 'co' or 'ca-ES'), got ${key}`)
  }

  return true
}

export const validateURL = (url: string, varName: string): boolean => {
  if (typeof url !== 'string') {
    throw new ValidationError(`${varName} should be a string`)
  }

  try {
    new URL(url)
    return true
  } catch (err) {
    throw new ValidationError(`${varName} should be a valid URL, got ${url}`)
  }
}

export const validateAndParseSemverString = (str: string, varName: string): Semver => {
  if (!Semver.isValid(str))
    throw new ValidationError(`${varName} is not a valid semver string (passed ${str})`)

  return Semver.fromString(str)
}

export const validateLocalizedStringWithDefault = (dict: any, canHaveLocalization: boolean, varName: string): dict is LocalizedStringWithDefault => {
  isPlainObject(dict, varName)

  const keys = getKeys(dict)

  if (keys.length === 0) {
    throw new ValidationError(`${varName} is an empty object, should have at least one key`)
  }

  if (!dict.hasOwnProperty('_')) {
    throw new ValidationError(`${varName} is doesn't contain field "_"`)
  }

  if (typeof dict._ !== 'string') {
    throw new ValidationError(`${varName}._ is not a string`)
  }

  if (!canHaveLocalization && keys.length !== 1) {
    throw new ValidationError(`${varName} cannot have localization strings, got object with keys ["${keys.join('", "')}"]`)
  }

  for (const key in dict) {
    if (key === '_') continue

    validateLangCode(key, `${varName}["${key}"]`)
    if (typeof dict[key] !== 'string') {
      throw new ValidationError(`${varName}["${key}"] should be a string, got ${typeof key}: ${key}`)
    }
  }

  return true
}

export const validateBoxedNumberWithDefault = (dict: BoxedNumberWithDefault, shouldBeInteger: boolean, varName: string): dict is BoxedNumberWithDefault => {
  isPlainObject(dict, varName)

  if (getKeys(dict).length === 0) {
    throw new ValidationError(`${varName} is an empty object, should have at least one key`)
  }

  if (!dict.hasOwnProperty('_')) {
    throw new ValidationError(`${varName} is doesn't contain field "_"`)
  }

  validateNumber(dict._, shouldBeInteger, `${varName}._`)

  for (const key in dict) {
    if (key === '_') continue
  }

  return true
}

export const validateUrlTemplateString = (str: any, varName: string): str is UrlTemplateString => {
  const prefix = `TemplateUrlString is not valid, ${varName}`
  if (typeof str !== 'string')
    throw new ValidationError(`${prefix} is not a string, got ${str}`)
  if (str.indexOf(URL_TEMPLATE_INFIX) < 0)
    throw new ValidationError(`${prefix} doesn't contain "${URL_TEMPLATE_INFIX}", got ${str}`)
  return true
}

export const validateUrlWithHashObject = (obj: any, varName: string): obj is InfixOrUrlOrCidAndHash => {
  isPlainObject(obj, varName)

  const keysAmount = ['urlInfix', 'url', 'ipfsCid']
    .map(field => Number(typeof obj[field] === 'string'))
    .reduce((prev, curr) => {
      return prev + curr
    }, 0)

  if (keysAmount !== 1) {
    throw new ValidationError(`${varName} should have one and only one of "urlInfix" or "url" or "ipfsCid" string fields, got ${JSON.stringify(obj)}`)
  }

  if (typeof obj.url === 'string') {
    validateURL(obj.url, `${varName}.url`)
  }

  if (obj.hasOwnProperty('hash'))
    validateFieldByType(obj, 'hash', 'string', false, varName)

  return true
}

export const validateFieldByType = <T extends object>(obj: T, key: keyof T, type: string, optional: boolean, varName: string): boolean => {
  isPlainObject(obj, varName)

  if (optional) {
    if (obj.hasOwnProperty(key) && typeof obj[key] !== type) {
      throw new ValidationError(`${varName}.${String(key)} is passed and not a ${type}, got ${typeof obj[key]}: ${obj[key]}`)
    }
  } else {
    if (!obj.hasOwnProperty(key)) {
      throw new ValidationError(`${varName}.${String(key)} not found in ${varName}`)
    }
    if (typeof obj[key] !== type) {
      throw new ValidationError(`${varName}.${String(key)} should be a ${type}, got ${typeof obj[key]}: ${obj[key]}`)
    }
  }
  return true
}

export const validateSingleTokenPropertyPermission = (tpp: any, varName: string): tpp is TokenPropertyPermissionObject => {
  isPlainObject(tpp, varName)
  validateFieldByType(tpp, 'key', 'string', false, varName)

  const permissionVarName = `${varName}.permission`

  isPlainObject(tpp.permission, permissionVarName)

  validateFieldByType(tpp.permission, 'mutable', 'boolean', false, permissionVarName)
  validateFieldByType(tpp.permission, 'collectionAdmin', 'boolean', false, permissionVarName)
  validateFieldByType(tpp.permission, 'tokenOwner', 'boolean', false, permissionVarName)

  return true
}

export const checkSafeFactory = <T extends (...args: any) => any>(fn: T) => {
  const returnFn = (...params: Parameters<T>) => {
    try {
      return fn(...params as any)
    } catch {
      return false as ReturnType<T>
    }
  }
  return returnFn as T
}

export const validateUrlTemplateStringSafe = checkSafeFactory(validateUrlTemplateString)

export const validateURLSafe = checkSafeFactory(validateURL)

export const validateLocalizedStringWithDefaultSafe = checkSafeFactory(validateLocalizedStringWithDefault)
