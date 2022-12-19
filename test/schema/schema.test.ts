import {describe, test, expect} from 'vitest'
import {decodeUniqueCollectionFromProperties, encodeCollectionSchemaToProperties} from "../../src/tools/collection"

import {dungeonsAndHeroesSchema} from '../samples/dungeonsAndHeroes.sample';
import {UniqueCollectionSchemaDecoded, UniqueCollectionSchemaToCreate} from "../../src";
import {DecodingResult} from "../../src/schemaUtils";

const testDecodedSchema = (expected: UniqueCollectionSchemaToCreate | UniqueCollectionSchemaToCreate, actual: DecodingResult<UniqueCollectionSchemaDecoded>): void => {
  const {result, error} = actual;

  expect(error).toBeFalsy();

  expect(result!.schemaName).toEqual(expected.schemaName)
  expect(result!.schemaVersion).toEqual(expected.schemaVersion)
  expect(result!.attributesSchemaVersion).toEqual(expected.attributesSchemaVersion)
  expect(result!.attributesSchema).toEqual(expected.attributesSchema)
}

describe('encode and decode unique schema', () => {
  test('Schema with attributes', async () => {
    const expected = dungeonsAndHeroesSchema
    const {result, error} = await decodeUniqueCollectionFromProperties(
      1,
      encodeCollectionSchemaToProperties(dungeonsAndHeroesSchema)
    )

    console.dir(result, {depth: 100})

    expect(error).toBeFalsy();

    expect(result!.schemaName).toEqual(expected.schemaName)
    expect(result!.schemaVersion).toEqual(expected.schemaVersion)
    expect(result!.attributesSchemaVersion).toEqual(expected.attributesSchemaVersion)
    expect(result!.attributesSchema).toEqual(expected.attributesSchema)
    expect(result!.file.urlTemplate).toEqual(expected.file.urlTemplate)
  })

  test('Schema without attributes', async () => {
    const schema: UniqueCollectionSchemaToCreate = {...dungeonsAndHeroesSchema}
    delete schema.attributesSchema
    delete schema.attributesSchemaVersion

    const {result, error} = await decodeUniqueCollectionFromProperties(
      1,
      encodeCollectionSchemaToProperties(schema)
    )

    expect(error).toBeFalsy();

    expect(result!.schemaName).toEqual(schema.schemaName)
    expect(result!.schemaVersion).toEqual(schema.schemaVersion)
  })
})
