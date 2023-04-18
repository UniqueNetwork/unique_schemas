import { Address } from '@unique-nft/utils/address'

import {
  RoyaltyType,
  UniqueRoyaltyPart,
  UniqueRoyaltyPartNoBigint,
} from './types'

export const ROYALTIES_PROPERTY = 'royalties'

export const ZEROS = ''.padStart(42, '0')

export const splitStringEvery = (str: string, every: number): string[] => {
  const result = []

  for (let i = 0; i < str.length; i += every) {
    result.push(str.substring(i, i + every))
  }

  return result
}

export const validateRoyaltyPart = (
  part: UniqueRoyaltyPart | UniqueRoyaltyPartNoBigint,
): void => {
  if (1 > part.version || part.version > 127) {
    throw new Error(`Version must be between 1 and 127, got ${part.version}`)
  }

  if (!Number.isInteger(part.version)) {
    throw new Error(`Version must be an integer, got ${part.version}`)
  }

  if (0 > part.decimals || part.decimals > 255) {
    throw new Error(`Decimals must be between 0 and 255, got ${part.decimals}`)
  }

  if (!Number.isInteger(part.decimals)) {
    throw new Error(`Decimals must be an integer, got ${part.decimals}`)
  }

  if (1 > part.value || part.value > 18446744073709551615n) {
    throw new Error(
      `Value must be between 1 and 18446744073709551615 (uint64), got ${part.value}`,
    )
  }

  if (!RoyaltyType[part.royaltyType]) {
    throw new Error(
      `Royalty type must be one of ${Object.keys(RoyaltyType)}, got ${
        part.royaltyType
      }`,
    )
  }

  if (
    !Address.is.ethereumAddress(part.address) &&
    !Address.is.substrateAddress(part.address)
  ) {
    throw new Error(
      `Address must be a valid ethereum or substrate address, got ${part.address}`,
    )
  }
}
