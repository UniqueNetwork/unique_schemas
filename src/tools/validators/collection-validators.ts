import {
  UniqueCollectionSchemaToCreate,
  ValidationError,
  zUniqueCollectionSchemaToCreate
} from '../../types';

import {
  validateAndParseSemverString,
  validateAttributeValueVsAttributeType,
} from './common-validators';

export const validateUniqueCollectionSchema = <C extends UniqueCollectionSchemaToCreate>(rawSchema: any): rawSchema is C => {
  const validationResult = zUniqueCollectionSchemaToCreate.safeParse(rawSchema)
  if (!validationResult.success) {
    throw ValidationError.fromZodError('schema', validationResult.error)
  }
  const schema = validationResult.data

  if (schema.schemaName !== 'unique')
    throw new ValidationError(`schemaName is not valid (passed ${schema.schemaName}, allowed only "unique")`)

  const schemaVersion = validateAndParseSemverString(schema.schemaVersion, 'schemaVersion')
  if (!schemaVersion.isEqual('1.5.0')) {
    throw new ValidationError(`collection schema has unsupported type: ${schemaVersion.toString()}`)
  }

  if (!schema.attributesSchemaVersion !== !schema.attributesSchema) {
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

    for (const key in schema.attributesSchema) {
      const attribute = schema.attributesSchema[key]

      if (attribute.enumValues) {
        for (const enumKey in attribute.enumValues) {
          const enumValue = attribute.enumValues[enumKey]
          validateAttributeValueVsAttributeType(enumValue, attribute.type, `schema.attributesSchema[${key}].enumValues[${enumKey}]`)
        }
      }
    }
  }

  return true
}
