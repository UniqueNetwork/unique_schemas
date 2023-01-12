import {
  AttributeType,
  COLLECTION_SCHEMA_NAME,
  CollectionAttributesSchema,
  UniqueCollectionSchemaToCreate,
  UniqueTokenToCreate,
} from "../../src";

const dungeonsAndHeroesCollectionAttributesSchema: CollectionAttributesSchema = {
  '0': {
    name: {_: 'class'},
    type: AttributeType.string,
    enumValues: {
      0: {_: 'knight'},
      1: {_: 'assassin'},
      2: {_: 'wizard'}
    }
  },

  '1': {
    name: {_: 'weapon'},
    type: AttributeType.string,
    isArray: true,
    enumValues: {
      0: {_: 'Sword'},
      1: {_: 'Dagger'},
      2: {_: 'Wizard staff'},
      3: {_: "Hunter's bow"},
    }
  }
}

export const dungeonsAndHeroesSchema: UniqueCollectionSchemaToCreate = {
  schemaName: COLLECTION_SCHEMA_NAME.unique,
  schemaVersion: '1.0.0',
  image: {
    urlTemplate: `https://images.unsplash.com/photo-{infix}`
  },
  file: {
    urlTemplate: `https://images.unsplash.com/photo-{infix}`
  },
  video: {
    urlTemplate: `https://assets.mixkit.co/videos/preview/{infix}.mp4`
  },
  audio: {
    urlTemplate: `https://tracks.snapmuse.com/v/128/{infix}.mp3`, // IEROD1903085
    isLossless: false,
    format: 'mp3'
  },

  spatialObject: {
    urlTemplate: `https://3dplaceholder.com/{infix}`,
    format: 'obj'
  },

  coverPicture: {
    urlInfix: '1620747918456-6db88fea1e84'
  },
  attributesSchemaVersion: '1.0.0',
  attributesSchema: dungeonsAndHeroesCollectionAttributesSchema
}

export const knightToken: UniqueTokenToCreate = {
  image: {
    ipfsCid: '1600081522768-cb2e80ed4491'
  },
  file: {
    ipfsCid: '1600081522768-cb2e80ed4491'
  },

  name: {_: 'knight test token'},

  encodedAttributes: {
    0: 0,
    1: [0]
  }
}

export const assassinToken: UniqueTokenToCreate = {
  image: {
    ipfsCid: '1598284188955-497134dbc08b'
  },
  imagePreview: {
    ipfsCid: '1598284188955-497134dbc08b'
  },
  file: {
    ipfsCid: '1598284188955-497134dbc08b'
  },

  name: {_: 'assassin test token'},
  description: {_: 'test'},

  video: {
    ipfsCid: 'mixkit-forest-stream-in-the-sunlight-529-small'
  },

  encodedAttributes: {
    0: 1,
    1: [1, 3]
  }
}

export const wizardToken: UniqueTokenToCreate = {
  image: {
    ipfsCid: '1598284188955-497134dbc08b'
  },

  spatialObject: {
    ipfsCid: 'test-url'
  },

  encodedAttributes: {
    0: 2,
    1: [0, 2]
  }
}
