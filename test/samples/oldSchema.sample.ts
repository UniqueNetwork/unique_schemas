import {PropertiesArray} from "src/unique_types";
import {AttributeType, COLLECTION_SCHEMA_NAME, DecodedAttributes, UniqueCollectionSchemaDecoded} from "src";

const constOnChainSchema = {
  nested: {
    onChainMetaData: {
      nested: {
        NFTMeta: {
          fields: {
            ipfsJson: {
              id: 1,
              rule: "required",
              type: "string"
            },
            gender: {
              id: 2,
              rule: "required",
              type: "Gender"
            },
            traits: {
              id: 3,
              rule: "repeated",
              type: "PunkTrait"
            },
            name: {
              id: 4,
              rule: "required",
              type: "string"
            },
          }
        },
        Gender: {
          options: {
            Female: "{\"en\": \"Female\"}",
            Male: "{\"en\": \"Male\"}"
          },
          values: {
            Female: 1,
            Male: 0
          }
        },
        PunkTrait: {
          options: {
            BLACK_LIPSTICK: "{\"en\": \"Black Lipstick\"}",
            RED_LIPSTICK: "{\"en\": \"Red Lipstick\"}"
          },
          values: {
            BLACK_LIPSTICK: 0,
            RED_LIPSTICK: 1
          }
        }
      }
    }
  }
};


export const oldCollectionProperties: PropertiesArray = [
  {
    key: "_old_constOnChainSchema",
    value: JSON.stringify(constOnChainSchema)
  },
  {
    key: "_old_offchainSchema",
    value: "https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image{id}.png"
  },
  {
    key: "_old_schemaVersion",
    value: "ImageUrl"
  }
];

export const oldSchemaDecoded: UniqueCollectionSchemaDecoded = {
  schemaName: COLLECTION_SCHEMA_NAME.old,
  collectionId: 1,
  coverPicture: {
    url: "https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image1.png",
    fullUrl: "https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image1.png"
  },
  image: {
    urlTemplate: "https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image{infix}.png"
  },
  schemaVersion: "0.0.1",
  attributesSchema: {
    "0": {
      type: AttributeType.string,
      name: {_: "gender"},
      isArray: false,
      optional: false,
      enumValues: {
        "0": {
          en: "Female",
          _: "Female"
        },
        "1": {
          en: "Male",
          _: "Male"
        }
      }
    },
    "1": {
      type: AttributeType.string,
      name: {_: "traits"},
      isArray: true,
      optional: true,
      enumValues: {
        "0": {
          en: "Black Lipstick",
          _: "Black Lipstick"
        },
        "1": {
          en: "Red Lipstick",
          _: "Red Lipstick"
        }
      }
    },
    "2": {
      type: AttributeType.string,
      name: {_: "name"},
      isArray: false,
      optional: false
    },
  },
  attributesSchemaVersion: "1.0.0",
  oldProperties: {
    _old_schemaVersion: "ImageUrl",
    _old_offchainSchema: "https://ipfs.unique.network/ipfs/QmcAcH4F9HYQtpqKHxBFwGvkfKb8qckXj2YWUrcc8yd24G/image{id}.png",
    _old_constOnChainSchema: "{\"nested\":{\"onChainMetaData\":{\"nested\":{\"NFTMeta\":{\"fields\":{\"ipfsJson\":{\"id\":1,\"rule\":\"required\",\"type\":\"string\"},\"gender\":{\"id\":2,\"rule\":\"required\",\"type\":\"Gender\"},\"traits\":{\"id\":3,\"rule\":\"repeated\",\"type\":\"PunkTrait\"},\"name\":{\"id\":4,\"rule\":\"required\",\"type\":\"string\"}}},\"Gender\":{\"options\":{\"Female\":\"{\\\"en\\\": \\\"Female\\\"}\",\"Male\":\"{\\\"en\\\": \\\"Male\\\"}\"},\"values\":{\"Female\":0,\"Male\":1}},\"PunkTrait\":{\"options\":{\"BLACK_LIPSTICK\":\"{\\\"en\\\": \\\"Black Lipstick\\\"}\",\"RED_LIPSTICK\":\"{\\\"en\\\": \\\"Red Lipstick\\\"}\"},\"values\":{\"BLACK_LIPSTICK\":0,\"RED_LIPSTICK\":1}}}}}}"
  }
};

export const oldTokenDataExample = {
  properties: [
    {
      key: {
        toHuman: () => `_old_constData`
      },
      value: {
        toJSON: () => `0x0a487b2269706673223a22516d533859586766474b6754556e6a4150744566337566356b345972464c503275446359754e79474c6e45694e62222c2274797065223a22696d616765227d10011a01002203426f62`
      }
    }
  ],
  owner: {
    toHuman: () => ({
      Ethereum: `0x5c03d3976ad16f50451d95113728e0229c50cab8`
    })
  }
}

export const oldTokenDecodedAttributes: DecodedAttributes = {
  0: {
    isArray: false,
    isEnum: true,
    name: {_: 'gender'},
    rawValue: 1,
    type: AttributeType.string,
    value: {
      _: 'Male',
      en: 'Male',
    }
  },
  1: {
    isArray: true,
    isEnum: true,
    name: {_: 'traits'},
    rawValue: [0],
    type: AttributeType.string,
    value: [{
      _: 'Black Lipstick',
      en: 'Black Lipstick',
    }]
  },
  2: {
    isArray: false,
    isEnum: false,
    name: {_: 'name'},
    rawValue: {_: 'Bob'},
    type: AttributeType.string,
    value: {_: 'Bob'}
  },
}
