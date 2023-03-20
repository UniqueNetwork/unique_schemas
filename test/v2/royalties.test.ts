import {describe, test, expect} from 'vitest'
import {deserializeRoyalties, serializeRoyalties, validateRoyalties} from '../../src/v2/royalties'

import * as examples from './examples'

describe.concurrent('royalties', () => {
  test('validate', () => {
    expect(() => {
      validateRoyalties({
        royaltyVersion: 2,
      })
    }).toThrowError('Unsupported royalties version')

    expect(() => {
      validateRoyalties({
        royaltyVersion: 1,
        decimals: -1,
      })
    }).toThrowError('Invalid decimals in royalties')

    expect(() => {
      validateRoyalties({
        royaltyVersion: 1,
        decimals: 1,
        primary: {
          addresses: {
            '0x123': 1,
          }
        }
      })
    }).toThrowError('Invalid address in primary royalties')

    expect(() => {
      validateRoyalties({
        royaltyVersion: 1,
        decimals: 1,
        secondary: {
          addresses: {
            '5HgvUDiRm5yjRSrrG9B6q6km7KLzkXMxvFLHPZpA13pmwCJQ': 1000,
          }
        }
      })
    }).toThrowError('Invalid amount in')

    expect(() => {
      validateRoyalties({
        royaltyVersion: 1,
        decimals: 1,
        secondary: {
          addresses: {
            '5HgvUDiRm5yjRSrrG9B6q6km7KLzkXMxvFLHPZpA13pmwCJ': 1,
          }
        }
      })
    }).toThrowError('Invalid address in secondary royalties')
  })

  test('serialize', () => {
    expect(serializeRoyalties(examples.token.royalties))
      .toEqual('v:0001|d:06|' +
        'P-0125:e-1234A38988Dd5ecC93Dd9cE90a44A00e5FB91e4C-0200000;' +
        's-d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d-0006250|' +
        'S-0125:e-1234A38988Dd5ecC93Dd9cE90a44A00e5FB91e4C-0000300;' +
        's-d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d-0002500'
      )

    expect(serializeRoyalties({
      royaltyVersion: 1,
    })).toEqual('v:0001|d:04')
  })

  test('serialize', () => {
    expect(deserializeRoyalties('v:0001|d:06|' +
      'P-0125:e-1234A38988Dd5ecC93Dd9cE90a44A00e5FB91e4C-0200000;' +
      's-d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d-0006250|' +
      'S-0125:e-1234A38988Dd5ecC93Dd9cE90a44A00e5FB91e4C-0000300;' +
      's-d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d-0002500'
    ))
      .toEqual(examples.token.royalties)

    expect(deserializeRoyalties('v:0001|d:04'))
      .toEqual({
        royaltyVersion: 1,
        decimals: 4,
      })
  })
})
