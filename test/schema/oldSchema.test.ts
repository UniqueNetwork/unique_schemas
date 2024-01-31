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
      '0x5c03d3976ad16f50451d95113728e0229c50cab8',
      [
        {
          key: '_old_constData',
          valueHex: '0x0a487b2269706673223a22516d533859586766474b6754556e6a4150744566337566356b345972464c503275446359754e79474c6e45694e62222c2274797065223a22696d616765227d10011a01002203426f62',
        }
      ],
      oldSchemaDecoded,
      {imageUrlTemplate: '{infix}', dummyImageFullUrl: ''},
    )

    expect(error).toBeFalsy();
    expect(result).toBeDefined();
    expect(result!.attributes).toEqual(oldTokenDecodedAttributes);
  })
})
