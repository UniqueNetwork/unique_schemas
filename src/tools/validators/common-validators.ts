import {
  AttributeType, IntegerAttributeTypes, NumberAttributeTypes, StringAttributeTypes,
  ValidationError,
  zBoxedNumberWithDefault,
  zLocalizedStringWithDefault,
  zTokenPropertyPermission,
  zUrlOrInfix
} from '../../types';
import {TokenPropertyPermissionObject} from "../../unique_types";
import {
  BoxedNumberWithDefault,
  UrlOrInfix,
  UrlAndMaybeInfix,
  LocalizedStringWithDefault,
  URL_TEMPLATE_INFIX,
} from "../../types";
import {getKeys} from "../../tsUtils";
import {Semver} from "../../semver";
import {LANG_REGEX} from "./constants";
import {z, ZodError} from 'zod'

export const validateNumber = (num: any, shouldBeInteger: boolean, varName: string): num is number => {
  if (typeof num !== 'number' || isNaN(num)) {
    throw new ValidationError(`${varName} is not a valid number, got ${num}`)
  }
  if (shouldBeInteger && num !== Math.round(num)) {
    throw new ValidationError(`${varName} is not an integer number, got ${num}`)
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
  return ValidationError.throwIfZodValidationFailed(varName, zLocalizedStringWithDefault.safeParse(dict))

  const keys = getKeys(zLocalizedStringWithDefault.parse(dict))

  if (!canHaveLocalization && keys.length !== 1) {
    throw new ValidationError(`${varName} cannot have localization strings, got object with keys ["${keys.join('", "')}"]`)
  }

  return true
}

export const validateBoxedNumberWithDefault = (dict: BoxedNumberWithDefault, shouldBeInteger: boolean, varName: string): dict is BoxedNumberWithDefault => {
  return ValidationError.throwIfZodValidationFailed(varName, zBoxedNumberWithDefault.safeParse(dict))
}


export const validateUrlWithHashObject = (obj: any, varName: string): obj is UrlOrInfix => {
  return ValidationError.throwIfZodValidationFailed(varName, zUrlOrInfix.safeParse(obj))
}

export const validateSingleTokenPropertyPermission = (tpp: any, varName: string): tpp is TokenPropertyPermissionObject => {
  return ValidationError.throwIfZodValidationFailed(varName, zTokenPropertyPermission.safeParse(tpp))
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

export const validateAttributeValueVsAttributeType = (value: any, type: AttributeType, varName: string): value is typeof type => {
  ValidationError.throwIfZodValidationFailed(varName, z.object({}).safeParse(value))

  if (NumberAttributeTypes.includes(type)) {
    const shouldBeInteger = IntegerAttributeTypes.includes(type)
    ValidationError.throwIfZodValidationFailed(
      varName,
      zBoxedNumberWithDefault.refine(({_}) => {
        return shouldBeInteger ? (_ === Math.round(_)) : true
      }).safeParse(value)
    )

    return true
  }

  if (type === AttributeType.boolean) {
    ValidationError.throwIfZodValidationFailed(varName, z.boolean().safeParse(value))
  }

  if (StringAttributeTypes.includes(type)) {
    const canHaveLocalization = type === AttributeType.string
    ValidationError.throwIfZodValidationFailed(varName, zLocalizedStringWithDefault.safeParse(value))

    if (type === AttributeType.isoDate) {
      ValidationError.throwIfZodValidationFailed(varName, z.string().datetime({ offset: true }).safeParse(value._))
    }

    if (type === AttributeType.time && isNaN(new Date('1970-01-01T' + value._).valueOf())) {
      ValidationError.throwIfZodValidationFailed(
        varName,
        z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'should be a valid time (hh:mm or hh:mm:ss)').safeParse(value._)
      )
    }

    if (type === AttributeType.colorRgba) {
      ValidationError.throwIfZodValidationFailed(
        varName,
        z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, 'should be a valid rgb or rgba color (like "#ff00ff" or "#ff00ff00")').safeParse(value._)
      )
    }

    return true
  }

  throw new ValidationError(`${varName}: unknown attribute type: ${type}`)
}


export const validateUrlTemplateString = (str: string, varName: string): boolean => {
  return ValidationError.throwIfZodValidationFailed(varName, z.string().url().includes('{infix}').safeParse(str))
}


export const validateURLSafe = checkSafeFactory(validateURL)

export const validateLocalizedStringWithDefaultSafe = checkSafeFactory(validateLocalizedStringWithDefault)
