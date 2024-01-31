import { Address } from '@unique-nft/utils/address';
import {
  RoyaltyType,
  UniqueRoyaltyPart,
  UniqueRoyaltyPartNoBigint,
} from './types';
import { validateRoyaltyPart, ZEROS } from './shared';

const encodeAddress = (address: string): [boolean, string] => {
  if (Address.is.ethereumAddress(address)) {
    return [
      true,
      Address.normalize
        .ethereumAddress(address)
        .substring(2)
        .padStart(64, '0')
        .toLowerCase(),
    ];
  }

  return [false, Address.substrate.decode(address).hex.substring(2)];
};

/**
 * encodes a UniqueRoyaltyPart into a hex string
 * @param part UniqueRoyaltyPart
 * @returns hex string where first 64 characters are metadata in format:
 * VV000000000000000000000000000000000000000000RADDvvvvvvvvvvvvvvvv
 * where:
 * VV - version
 * 42 zeros
 * R - royalty type (0 - default, 1 - primary-only)
 * A - address type (0 - ethereum, 1 - substrate)
 * DD - decimals
 * vvvvvvvvvvvvvvvvvv - value (uint64)
 *
 * and the rest of the string is the address encoded as hex
 */
export const encodeRoyaltyPart = (
  part: UniqueRoyaltyPart | UniqueRoyaltyPartNoBigint,
): string => {
  validateRoyaltyPart(part);

  const version = part.version.toString(16).padStart(2, '0');
  const royaltyType = part.royaltyType === RoyaltyType.DEFAULT ? '0' : '1';
  const decimals = part.decimals.toString(16).padStart(2, '0');

  const value = part.value.toString(16).padStart(16, '0');

  const [isEthereum, address] = encodeAddress(part.address);
  const addressType = isEthereum ? '0' : '1';

  return `0x${version}${ZEROS}${royaltyType}${addressType}${decimals}${value}${address}`;
};

export const encodeRoyalty = (
  parts: (UniqueRoyaltyPart | UniqueRoyaltyPartNoBigint)[],
): string =>
  '0x' + parts.map((part) => encodeRoyaltyPart(part).substring(2)).join('');
