import { LibPart, UniqueRoyaltyPart } from './types';
import { Address } from '@unique-nft/utils/address';

const changeDecimals = (
  part: UniqueRoyaltyPart,
  decimals: number,
): UniqueRoyaltyPart => {
  const value =
    decimals >= part.decimals
      ? part.value * 10n ** BigInt(decimals - part.decimals)
      : part.value / 10n ** BigInt(part.decimals - decimals);

  return { ...part, value, decimals };
};

export const toLibPart = (part: UniqueRoyaltyPart): LibPart => {
  const account = Address.is.substrateAddress(part.address)
    ? Address.mirror.substrateToEthereum(part.address)
    : part.address;

  const { value } = changeDecimals(part, 4);

  return { account, value };
};

export const toLibParts = (parts: UniqueRoyaltyPart[]) => parts.map(toLibPart);

export const fromLibPart = (part: LibPart): UniqueRoyaltyPart => {
  return {
    version: 1,
    decimals: 4,
    value: part.value,
    royaltyType: 'DEFAULT',
    address: part.account,
  };
};

export const fromLibParts = (parts: LibPart[]) => parts.map(fromLibPart);
