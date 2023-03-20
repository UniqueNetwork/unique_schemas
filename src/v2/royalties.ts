import {RoyaltyKind, RoyaltySchema} from './types'
import {DEFAULT_ROYALTIES_DECIMALS} from './constants'
import {Address} from '@unique-nft/utils/address'

///////////////////////////////////
// Royalties serialization
///////////////////////////////////

const serializeRoyaltyAddresses = (addresses: Record<string, number>, decimals: number) => {
  const resultStr = Object.entries(addresses)
    .map(([address, amount]) => {
      const isEth = Address.is.ethereumAddress(address)
      const isSub = Address.is.substrateAddress(address) || Address.is.substratePublicKey(address)

      if (!isEth && !isSub) {
        throw new Error(`Invalid address in royalties ${address}`)
      }

      const addressToWrite: string = (
        isEth
          ? Address.normalize.ethereumAddress(address)
          : Address.extract.substratePublicKey(address)
      ).slice(2)

      const value = amount.toString().padStart(decimals + 1, '0')

      const result = `${isEth ? `e` : `s`}-${addressToWrite}-${value}`

      return result
    })
    .join(`;`)
  return resultStr
}

export const serializeRoyalties = (royalties: RoyaltySchema): string => {
  const version = royalties.royaltyVersion

  const decimals = (royalties.decimals ?? DEFAULT_ROYALTIES_DECIMALS)

  let royaltiesString = `` +
    `v:${version.toString().padStart(4, '0')}` +
    `|d:${decimals.toString().padStart(2, '0')}`


  if (royalties.primary?.addresses && Object.keys(royalties.primary.addresses).length) {
    const str = serializeRoyaltyAddresses(royalties.primary.addresses, decimals)
    royaltiesString += `|P-${str.length.toString().padStart(4, '0')}:${str}`
  }

  if (royalties.secondary?.addresses && Object.keys(royalties.secondary.addresses).length) {
    const str = serializeRoyaltyAddresses(royalties.secondary.addresses, decimals)
    royaltiesString += `|S-${str.length.toString().padStart(4, '0')}:${str}`
  }

  return royaltiesString
}

/////////////////////////////////////////////////
// Royalties deserialization
/////////////////////////////////////////////////

const deserializeRoyaltyAddresses = (royalties: RoyaltySchema, type: 'primary' | 'secondary', value: string) => {
  royalties[type] = {addresses: {}}

  for (const royalty of value.split(';')) {
    const [_, address, amount] = royalty.split('-')
    royalties[type]!.addresses[Address.extract.address(`0x${address}`)] = parseInt(amount)
  }
}

export const deserializeRoyalties = (royaltiesString: string): RoyaltySchema => {
  const royalties: RoyaltySchema = {
    royaltyVersion: 1,
  }

  for (const part of royaltiesString.split('|')) {
    const [key, value] = part.split(':')
    if (key === 'v') {
      royalties.royaltyVersion = parseInt(value, 10)
      if (royalties.royaltyVersion !== 1) {
        throw new Error(`Unsupported royalties version ${royalties.royaltyVersion}`)
      }
    } else if (key === 'd') {
      royalties.decimals = parseInt(value, 10)
    } else if (key.startsWith('P')) {
      deserializeRoyaltyAddresses(royalties, 'primary', value)
    } else if (key.startsWith('S')) {
      deserializeRoyaltyAddresses(royalties, 'secondary', value)
    }
  }

  return royalties
}

///////////////////////////////////////////
// Royalties validation
///////////////////////////////////////////

const checkRoyaltiesAddresses = (royalties: RoyaltySchema, kind: 'primary' | 'secondary') => {
  const addresses = royalties[kind]?.addresses
  if (!addresses) {
    return
  }

  const decimals = royalties.decimals ?? DEFAULT_ROYALTIES_DECIMALS

  // check that royalties addresses amount at least 1 and not more than 100
  if (Object.keys(addresses).length < 1 || Object.keys(addresses).length > 100) {
    throw new Error(`Invalid ${kind} royalties addresses amount: ${Object.keys(addresses).length}. should be between 1 and 100`)
  }

  for (const [address, amount] of Object.entries(addresses)) {
    // check that address is valid
    if (!Address.is.ethereumAddress(address) && !Address.is.substrateAddress(address) && !Address.is.substratePublicKey(address)) {
      throw new Error(`Invalid address in ${kind} royalties ${address}`)
    }

    //check that amount is integer
    if (amount % 1 !== 0) {
      throw new Error(`Invalid amount in ${kind} royalties for address ${address}: ${amount}. amount should be integer`)
    }

    // check that amount is between 1 and decimals digits
    const maxRoyalty = 10 ** (decimals)
    if (amount < 1 || amount > maxRoyalty) {
      throw new Error(`Invalid amount in ${kind} royalties for address ${address}: ${amount}. amount should be between 1 and ${maxRoyalty}`)
    }
  }
}

export const validateRoyalties = (royalties: RoyaltySchema) => {
  // check royalties version
  if (royalties.royaltyVersion !== 1) {
    throw new Error(`Unsupported royalties version ${royalties.royaltyVersion}`)
  }

  // check that decimals between 1 and 99 and integer
  if (royalties.decimals) {
    if (royalties.decimals % 1 !== 0) {
      throw new Error(`Invalid decimals in royalties ${royalties.decimals}: decimals should be integer`)
    }
    if (royalties.decimals < 1 || royalties.decimals > 99) {
      throw new Error(`Invalid decimals in royalties ${royalties.decimals}: decimals should be between 1 and 99`)
    }
  }

  // check royalties addresses
  checkRoyaltiesAddresses(royalties, 'primary')
  checkRoyaltiesAddresses(royalties, 'secondary')
}
