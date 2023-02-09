import {UniqueCollectionSchemaV2, UniqueTokenV2} from '../../src/v2/types'
import {PERMISSION} from '../../src/v2/constants'

/*
export const PERMISSION = <const>{
  REWRITEABLE_FOR_BOTH: {mutable: true, collectionAdmin: true, tokenOwner: true},
  REWRITEABLE_FOR_COLLECTION_ADMIN: {mutable: true, collectionAdmin: true, tokenOwner: false},
  REWRITEABLE_FOR_TOKEN_OWNER: {mutable: true, collectionAdmin: false, tokenOwner: true},

  WRITABLE_ONCE_FOR_BOTH: {mutable: false, collectionAdmin: true, tokenOwner: true},
  WRITABLE_ONCE_FOR_COLLECTION_ADMIN: {mutable: false, collectionAdmin: true, tokenOwner: false},
  WRITABLE_ONCE_FOR_TOKEN_OWNER: {mutable: false, collectionAdmin: false, tokenOwner: true},
} satisfies {[K: string]: TokenPropertyPermissionValue}
*/

//////////////////////////////////////////////////////////
// collection example
//////////////////////////////////////////////////////////

export const schema = {
  schemaName: 'unique',
  schemaVersion: '2.0.0',
  baseUrl: 'https://ipfs.unique.network/ipfs/',
  ipfsGateways: ['https://ipfs.unique.network/ipfs/', 'https://gateway.pinata.cloud/ipfs/'],
  cover: {
    suffix: 'QmbJ7CGZ2GxWMp7s6jy71UGzRsMe4w3KANKXDAExYWdaFR'
  },
  defaultLocale: 'en',
  instantiateWith: {
    defaultPermission: PERMISSION.REWRITEABLE_FOR_COLLECTION_ADMIN,
    propertyCommonPermission: PERMISSION.REWRITEABLE_FOR_COLLECTION_ADMIN,
    allowERC721MetadataTokenURI: PERMISSION.REWRITEABLE_FOR_BOTH,
  },
  media: {
    permission: PERMISSION.WRITABLE_ONCE_FOR_BOTH,
    schema: {
      chel: {
        type: 'image',
        main: true,
        required: true,
        order: 1,
        title: {_: 'Chel'},
        posterFor: 'promo',
        permission: PERMISSION.WRITABLE_ONCE_FOR_COLLECTION_ADMIN,
      },
      promo: {
        type: 'video',
        order: 2,
      },
    },
  },
  attributes: {
    permission: PERMISSION.WRITABLE_ONCE_FOR_COLLECTION_ADMIN,
    schema: {
      traits: {
        type: 'string',
        optional: false,
        title: {_: 'Traits'},
        order: 1,
        enumValues: {
          0: {_: 'Blah-blah Eyes'},
          eyesLeft: {_: 'Eyes To The Left'},
          eyesRight: {_: 'Eyes To The Right'},
        },
      },
      color: {
        type: 'colorRgba',
        optional: true,
        single: true,
        title: {_: 'Color'},
        permission: PERMISSION.REWRITEABLE_FOR_COLLECTION_ADMIN,
      },
    },
  },
  royalties: {
    royaltyVersion: 1,
    decimals: 4,
    primary: {
      addresses: {
        '0x0000000000000000000000000000000000000000': 100, // 1%
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY': 225, // 2.25%
      },
    },
    secondary: {
      addresses: {
        '0x0000000000000000000000000000000000000000': 100, // 1%
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY': 225, // 2.25%
      },
    },
    permission: PERMISSION.WRITABLE_ONCE_FOR_BOTH,
  },
  info: {abc: 123, def: '456'}, // collection can have additional info
} satisfies UniqueCollectionSchemaV2


//////////////////////////////////////////////////////////
// token example
//////////////////////////////////////////////////////////

export const token = {
  common: {
    name: {_: 'Chel No. 1', en: 'Chel #1', es: 'Humano Num. 1'},
    preview: {
      suffix: 'QmbJ7CGZ2GxWMp7s6jy71UGzRsMe4w3KANKXDAExYWdaFR'
    },
    defaultLocale: 'fr',
    info: {abc: 789, def: '012'}, // token can have additional info

    // optional, to provide parallel representation of the token in ERC721-compatible format:
    ERC721MetadataTokenURI: 'https://rest.unique.network/unique/token_as_erc721?collectionId=123&tokenId=456',
  },
  media: {
    chel: {
      suffix: 'QmbJ7CGZ2GxWMp7s6jy71UGzRsMe4w3KANKXDAExYWdaFR',
    },
    promo: {
      suffix: 'QmbJ7CGZ2GxWMp7s6jy71UGzRsMe4w3KANKXDAExYWdaFR',
    },
    ayaya: { // token can have media that are not in collection schema
      type: 'video',
      subType: 'youtube',
      url: 'https://www.youtube.com/watch?v=H8ZH_mkfPUY',
      order: 3,
      title: {_: 'Ayaya!'},
    },
  },
  attributes: {
    traits: {
      enumKeys: ['0', 'eyesLeft', 'eyesRight'],
    },
    color: {
      values: [{_: '0xff0000ff'}], // actually a single value, but array is used for consistency
    },
    ayaya: { // token can have attributes that are not in collection schema
      title: {_: 'Ayaya'},
      type: 'string',
      values: [{_: 'ayaya'}],
    },
  },
  royalties: { // customised royalties for the token
    royaltyVersion: 1,
    decimals: 6,
    primary: {
      addresses: {
        '0x0000000000000000000000000000000000000000': 200000, // 0.2%
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY': 6250, // 0.625%
      },
    },
    secondary: {
      addresses: {
        '0x0000000000000000000000000000000000000000': 300, // 0.03%
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY': 2500, // 0.25%
      },
    },
  },
} satisfies UniqueTokenV2
