import {describe, test, expect} from 'vitest'
import {decodeOldSchemaCollection, decodeOldSchemaToken} from "src/tools/oldSchemaDecoder";
import {
  oldCollectionProperties,
  oldSchemaDecoded,
  oldTokenDataExample,
  oldTokenDecodedAttributes,
} from '../samples/oldSchema.sample';


describe('Old schema', () => {
  test.concurrent(decodeOldSchemaCollection.name, async () => {
    const {result} = await decodeOldSchemaCollection(
      1,
      oldCollectionProperties,
      {imageUrlTemplate: '{infix}', dummyImageFullUrl: ''},
    );

    expect(result).toBeDefined();
    expect(result!.schemaName).toEqual(oldSchemaDecoded.schemaName);
    expect(result!.schemaVersion).toEqual(oldSchemaDecoded.schemaVersion);
    expect(result!.attributesSchemaVersion).toEqual(oldSchemaDecoded.attributesSchemaVersion);
    expect(result!.attributesSchema).toEqual(oldSchemaDecoded.attributesSchema);
  })

  test.concurrent(decodeOldSchemaToken.name, async () => {
    const {result, error} = await decodeOldSchemaToken(
      1,
      2,
      oldTokenDataExample,
      oldSchemaDecoded,
      {imageUrlTemplate: '{infix}', dummyImageFullUrl: ''},
    )

    expect(error).toBeFalsy();
    expect(result).toBeDefined();
    expect(result!.attributes).toEqual(oldTokenDecodedAttributes);
  })
})
