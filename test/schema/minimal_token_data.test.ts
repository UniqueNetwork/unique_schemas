import {describe, expect, test} from 'vitest';
import {decodeTokenToV2} from '../../src/decoding/tokenDecoding';
import {Utf8} from '@unique-nft/utils/string';


describe('Minimal token schema v2 decoding', () => {
  test('Token includes all info', async () => {
    const tokenData = {
      name: 'test token',
      description: 'test token description',
      attributes: [
        {trait_type: 'trait 1', value: 'value 1'},
        {trait_type: 'trait 2', value: '2', display_type: 'number'},
      ],
      image: 'https://example.com/1.png',
    }

    const tokenDataString = JSON.stringify(tokenData)
    const tokenDataHex = Utf8.stringToHexString(tokenDataString)

    const tokenProps = [
      {key: 'schemaName', valueHex: '0x756e69717565', value: 'unique'},
      {key: 'schemaVersion', valueHex: '0x322e302e30', value: '2.0.0'},
      {key: 'tokenData', valueHex: tokenDataHex, value: tokenDataString},
    ]

    const expected = {...tokenData}

    await expect(decodeTokenToV2(tokenProps)).resolves.toEqual(expected)
  })

  test('Collection includes schema name and version', async () => {
    const tokenData = {
      name: 'test token',
      description: 'test token description',
      attributes: [
        {trait_type: 'trait 1', value: 'value 1'},
        {trait_type: 'trait 2', value: '2', display_type: 'number'},
      ],
      image: 'https://example.com/2.png',
    }

    const tokenDataString = JSON.stringify(tokenData)
    const tokenDataHex = Utf8.stringToHexString(tokenDataString)

    const tokenProps = [
      {key: 'tokenData', valueHex: tokenDataHex, value: tokenDataString},
    ]

    const collectionProperties = [
      {key: 'schemaName', valueHex: '0x756e69717565', value: 'unique'},
      {key: 'schemaVersion', valueHex: '0x322e302e30', value: '2.0.0'},
    ]

    const expected = {...tokenData}

    await expect(decodeTokenToV2(tokenProps, {collectionProperties})).resolves.toEqual(expected)
  })
})
