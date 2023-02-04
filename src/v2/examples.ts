import {UniqueCollectionSchemaV2, UniqueTokenV2} from './types'
import {PERMISSION} from './constants'

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
    ipfsCid: 'QmbJ7CGZ2GxWMp7s6jy71UGzRsMe4w3KANKXDAExYWdaFR'
  },
  defaultLocale: 'en',
  defaultPermission: PERMISSION.REWRITEABLE_FOR_COLLECTION_ADMIN,
  media: {
    defaultPermission: PERMISSION.WRITABLE_ONCE_FOR_BOTH,
    schema: {
      chel: {
        type: 'image',
        main: true,
        required: true,
        order: 1,
        title: {_: 'Chel'},
        posterFor: 'promo',
        customPermission: PERMISSION.WRITABLE_ONCE_FOR_COLLECTION_ADMIN,
      },
      promo: {
        type: 'video',
        order: 2,
      },
    },
  },
  attributes: {
    defaultPermission: PERMISSION.WRITABLE_ONCE_FOR_COLLECTION_ADMIN,
    schema: {
      traits: {
        type: 'string',
        optional: false,
        array: true,
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
        title: {_: 'Color'},
        customPermission: PERMISSION.REWRITEABLE_FOR_COLLECTION_ADMIN,
      },
    },
  },
  royalties: {
    royaltyVersion: '1',
    primary: {
      addresses: {
        '0x0000000000000000000000000000000000000000': 10000, // 1%
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY': 22500, // 2.25%
      },
    },
    secondary: {
      addresses: {
        '0x0000000000000000000000000000000000000000': 10000, // 1%
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY': 22500, // 2.25%
      },
    },
    defaultPermission: PERMISSION.WRITABLE_ONCE_FOR_BOTH,
  },
  info: {abc: 123, def: '456'}, // collection can have additional info
} satisfies UniqueCollectionSchemaV2


//////////////////////////////////////////////////////////
// token example
//////////////////////////////////////////////////////////

export const token = {
  common: {
    name: {_: 'Chel No. 1', en: 'Chel #1'},
    preview: {
      ipfsCid: 'QmbJ7CGZ2GxWMp7s6jy71UGzRsMe4w3KANKXDAExYWdaFR'
    },
    defaultLocale: 'fr',
    info: {abc: 789, def: '012'}, // token can have additional info

    // optional, to provide parallel representation of the token in ERC721-compatible format:
    ERC721TokenURI: 'https://rest.unique.network/unique/unique_as_erc721/collectionId=123&tokenId=456',
  },
  media: {
    chel: {
      ipfsCid: 'QmbJ7CGZ2GxWMp7s6jy71UGzRsMe4w3KANKXDAExYWdaFR',
    },
    promo: {
      ipfsCid: 'QmbJ7CGZ2GxWMp7s6jy71UGzRsMe4w3KANKXDAExYWdaFR',
    },
    ayaya: { // token can have media that are not in collection schema
      type: 'video',
      linkType: 'youtube',
      url: 'https://www.youtube.com/watch?v=H8ZH_mkfPUY',
      order: 3,
      title: {_: 'Ayaya!'},
    },
  },
  attributes: {
    traits: {
      enumKeys: [0, 'eyesLeft', 'eyesRight'],
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
    royaltyVersion: '1',
    primary: {
      addresses: {
        '0x0000000000000000000000000000000000000000': 20000, // 2%
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY': 52500, // 5.25%
      },
    },
    secondary: {
      addresses: {
        '0x0000000000000000000000000000000000000000': 30000, // 3%
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY': 72500, // 7.25%
      },
    },
  },
} satisfies UniqueTokenV2
