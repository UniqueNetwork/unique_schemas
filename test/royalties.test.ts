import {
  calculateAmount,
  calculateRoyalties,
  calculateRoyalty,
  decodeRoyalty,
  decodeRoyaltyPart,
  encodeRoyalty,
  encodeRoyaltyPart,
} from '../src/tools/royalties'
import {
  ETH_DEFAULT,
  SUB_PRIMARY_ONLY,
  ROYALTY_ENCODED,
  ROYALTY_DECODED,
} from './_samples'
import { describe, test, expect } from 'vitest'

describe('TS implementation', () => {
  describe('UniqueRoyaltyPart', () => {
    test('encode - sub - primary', () => {
      const encoded = encodeRoyaltyPart(SUB_PRIMARY_ONLY.decoded)
      expect(encoded).to.equal(SUB_PRIMARY_ONLY.encoded)
    })

    test('encode - eth - secondary', () => {
      const encoded = encodeRoyaltyPart(ETH_DEFAULT.decoded)
      expect(encoded).to.equal(ETH_DEFAULT.encoded)
    })

    test('decode - sub - primary', () => {
      const decoded = decodeRoyaltyPart(SUB_PRIMARY_ONLY.encoded)
      expect(decoded).toEqual(SUB_PRIMARY_ONLY.decoded)
    })

    test('decode - eth - secondary', () => {
      const decoded = decodeRoyaltyPart(ETH_DEFAULT.encoded)
      expect(decoded).toEqual(ETH_DEFAULT.decoded)
    })
  })

  describe('UniqueRoyalty', () => {
    test('encode', () => {
      const encoded = encodeRoyalty(ROYALTY_DECODED)

      expect(encoded).to.equal(ROYALTY_ENCODED)
    })

    test('decode', () => {
      const decoded = decodeRoyalty(ROYALTY_ENCODED)

      expect(decoded).to.deep.equal(ROYALTY_DECODED)
    })
  })

  describe('Calculate royalty', () => {
    test('should calculate royalty', () => {
      expect(calculateAmount(1n, 0, 100n)).to.equal(100n)
      expect(calculateAmount(100n, 0, 100n)).to.equal(10000n)
      expect(calculateAmount(50n, 0, 100n)).to.equal(5000n)
      expect(calculateAmount(1n, 6, 1_000_000_000n)).to.equal(1000n)

      expect(
        calculateRoyalty(SUB_PRIMARY_ONLY.decoded, 1_000_000_000_000n),
      ).to.deep.equal({
        address: SUB_PRIMARY_ONLY.decoded.address,
        amount: 255_000_00000n,
      })

      expect(
        calculateRoyalty(ETH_DEFAULT.decoded, 1_000_000_000_000n),
      ).to.deep.equal({
        address: ETH_DEFAULT.decoded.address,
        amount: 150_00000n,
      })
    })

    test('should calculate royalty depending on sale type', () => {
      const primary = calculateRoyalties(
        ROYALTY_DECODED,
        true,
        1_000_000_000_000n,
      )

      expect(primary.length).to.equal(1)
      expect(primary[0].address).to.equal(SUB_PRIMARY_ONLY.decoded.address)
      expect(primary[0].amount).to.equal(255_000_00000n)

      const secondary = calculateRoyalties(
        ROYALTY_DECODED,
        false,
        1_000_000_000_000n,
      )

      expect(secondary.length).to.equal(1)
      expect(secondary[0].address).to.equal(ETH_DEFAULT.decoded.address)
      expect(secondary[0].amount).to.equal(150_00000n)
    })
  })
})
