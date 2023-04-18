import { RoyaltyAmount, RoyaltyType, UniqueRoyaltyPart } from './types'

export const calculateAmount = (
  value: bigint,
  decimals: number,
  sellPrice: bigint,
): bigint => (sellPrice * value) / 10n ** BigInt(decimals)

export const calculateRoyalty = (
  royalty: UniqueRoyaltyPart,
  sellPrice: bigint,
): RoyaltyAmount => ({
  address: royalty.address,
  amount: calculateAmount(royalty.value, royalty.decimals, sellPrice),
})

export const calculateRoyalties = (
  royalties: UniqueRoyaltyPart[],
  isPrimarySale: boolean,
  sellPrice: bigint,
): RoyaltyAmount[] =>
  royalties
    .filter(
      (r) => isPrimarySale === (r.royaltyType === RoyaltyType.PRIMARY_ONLY),
    )
    .map((r) => calculateRoyalty(r, sellPrice))
