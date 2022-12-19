import {
  AttributeSchema,
  AttributeType,
  AttributeTypeValues,
  COLLECTION_SCHEMA_NAME,
  CollectionAttributesSchema,
  IntegerAttributeTypes,
  NumberAttributeTypes,
  StringAttributeTypes,
  UniqueCollectionSchemaToCreate, ValidationError
} from "../../types";

import {
  validateAndParseSemverString,
  validateBoxedNumberWithDefault,
  validateFieldByType,
  validateLocalizedStringWithDefault,
  validateSingleTokenPropertyPermission,
  validateUrlTemplateString,
  validateUrlWithHashObject,
  isPlainObject,
  validateNumber,
  validateAttributeKey,
} from "./common-validators";
import {RGB_REGEX, RGBA_REGEX} from "./constants";
import {CollectionTokenPropertyPermissions} from "../../unique_types";

export const validateValueVsAttributeType = (value: any, type: AttributeType, varName: string): value is typeof type => {
  isPlainObject(value, varName)

  if (NumberAttributeTypes.includes(type)) {
    const shouldBeInteger = IntegerAttributeTypes.includes(type)
    validateBoxedNumberWithDefault(value, shouldBeInteger, varName)
    if (type === AttributeType.boolean && ![0, 1].includes(value._)) {
      throw new ValidationError(`${varName}: should be a boolean integer: 0 or 1, got ${value._}`)
    }

    return true
  }

  if (StringAttributeTypes.includes(type)) {
    const canHaveLocalization = type === AttributeType.string
    validateLocalizedStringWithDefault(value, canHaveLocalization, varName)

    if (type === AttributeType.isoDate && isNaN(new Date(value._).valueOf())) {
      throw new ValidationError(`${varName}: should be a valid ISO Date (YYYY-MM-DD), got ${value._}`)
    }

    if (type === AttributeType.time && isNaN(new Date('1970-01-01T' + value._).valueOf())) {
      throw new ValidationError(`${varName}: should be a valid time in (hh:mm or hh:mm:ss), got ${value._}`)
    }

    if (type === AttributeType.colorRgba && (!value._.match(RGB_REGEX) && !value._.match(RGBA_REGEX))) {
      throw new ValidationError(`${varName}: should be a valid rgb or rgba color (like "#ff00ff00"), got ${value._}`)
    }

    return true
  }

  throw new ValidationError(`${varName}: unknown attribute type: ${type}`)
}

export const validateAttributesSchemaSingleAttribute = (attr: AttributeSchema, varName: string): attr is AttributeSchema => {
  isPlainObject(attr, varName)

  validateLocalizedStringWithDefault(attr.name, true, `${varName}.name`)

  if (attr.hasOwnProperty('optional') && typeof attr.optional !== 'boolean')
    throw new ValidationError(`${varName}.optional should be boolean when passed, got ${typeof attr.optional}: ${attr.optional}`)

  if (attr.hasOwnProperty('isArray') && typeof attr.isArray !== 'boolean') {
    throw new ValidationError(`${varName}.optional should be boolean when passed, got ${typeof attr.optional}: ${attr.optional}`)
  }

  if (!AttributeTypeValues.includes(attr.type)) {
    console.log(AttributeTypeValues)
    console.log(attr.type)
    throw new ValidationError(`${varName}.type should be a valid attribute type, got ${typeof attr.type}: ${attr.type}`)
  }

  if (attr.hasOwnProperty('enumValues')) {
    isPlainObject(attr.enumValues, `${varName}.enumValues`)

    for (const key in attr.enumValues) {
      const localVarName = `${varName}.enumValues[${key}]`
      const intKey = parseInt(key)
      validateNumber(intKey, true, localVarName)

      validateValueVsAttributeType(
        attr.enumValues[intKey],
        attr.type,
        localVarName
      )
    }
  }

  return true
}

export const validateCollectionAttributesSchema = (attributes: any, varName: string): attributes is CollectionAttributesSchema => {
  isPlainObject(attributes, varName)
  for (const key in attributes) {
    validateAttributeKey(key, varName)
    validateAttributesSchemaSingleAttribute(attributes[key], `${varName}["${key}"]`)
  }

  return true
}

export const validateUniqueCollectionSchema = <C extends UniqueCollectionSchemaToCreate>(schema: any): schema is C => {
  isPlainObject(schema, 'Passed collection schema')

  if (schema.schemaName !== COLLECTION_SCHEMA_NAME.unique)
    throw new ValidationError(`schemaName is not valid (passed ${schema.schemaName})`)

  const schemaVersion = validateAndParseSemverString(schema.schemaVersion, 'schemaVersion')
  if (!schemaVersion.isEqual('1.0.0')) {
    throw new ValidationError(`collection schema has unsupported type: ${schemaVersion.toString()}`)
  }

  validateUrlWithHashObject(schema.coverPicture, 'coverPicture')

  if (schema.hasOwnProperty('coverPicturePreview')) {
    validateUrlWithHashObject(schema.coverPicturePreview, 'coverPicturePreview')
  }

  if (!schema.attributesSchemaVersion !== !schema.attributesSchema) {
    console.log('--------------------------------------')
    console.log(!schema.attributesSchemaVersion)
    console.log(!schema.attributesSchema)
    console.log('--------------------------------------')
    console.dir(schema)
    throw new ValidationError(`"attributesSchemaVersion" and "attributesSchema" should both be filled or both empty`)
  }

  if (schema.attributesSchemaVersion && schema.attributesSchema) {
    const attributesSchemaVersion = validateAndParseSemverString(
      schema.attributesSchemaVersion,
      'attributesSchemaVersion',
    )

    if (!attributesSchemaVersion.isEqual('1.0.0')) {
      throw new ValidationError(`collection attributes schema has unsupported type: ${attributesSchemaVersion.toString()}`)
    }

    validateCollectionAttributesSchema(schema.attributesSchema, 'attributesSchema')
  }

  isPlainObject(schema.image, 'image')
  validateUrlTemplateString(schema.image.urlTemplate, 'image')

  if (schema.hasOwnProperty('imagePreview')) {
    isPlainObject(schema.imagePreview, 'imagePreview')
    validateUrlTemplateString(schema.video.urlTemplate, 'imagePreview')
  }

  if (schema.hasOwnProperty('file')) {
    isPlainObject(schema.file, 'file')
    validateUrlTemplateString(schema.file.urlTemplate, 'file')
  }

  if (schema.hasOwnProperty('video')) {
    isPlainObject(schema.video, 'video')
    validateUrlTemplateString(schema.video.urlTemplate, 'video')
  }

  if (schema.hasOwnProperty('audio')) {
    isPlainObject(schema.audio, 'audio')
    validateUrlTemplateString(schema.audio.urlTemplate, 'audio')

    validateFieldByType(schema.audio, 'format', 'string', true, 'audio')
    validateFieldByType(schema.audio, 'isLossless', 'boolean', true, 'audio')
  }

  if (schema.hasOwnProperty('spatialObject')) {
    isPlainObject(schema.spatialObject, 'spatialObject')
    validateUrlTemplateString(schema.spatialObject.urlTemplate, 'spatialObject')

    validateFieldByType(schema.spatialObject, 'format', 'string', true, 'spatialObject')
  }

  return true
}

export const validateCollectionTokenPropertyPermissions = (tpps: any, varName: string = 'tokenPropertyPermissions'): tpps is CollectionTokenPropertyPermissions => {
  if (!Array.isArray(tpps))
    throw new ValidationError(`${varName} should be an array, got ${typeof tpps}: ${tpps}`)

  tpps.forEach((tpp, index) => {
    validateSingleTokenPropertyPermission(tpp, `${varName}[${index}]`)
  })

  return true
}
