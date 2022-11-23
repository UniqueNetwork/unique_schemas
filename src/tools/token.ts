import { HumanizedNftToken, PropertiesArray } from "../unique_types";
import {
  AttributeType,
  DecodedAttributes,
  DecodedInfixOrUrlOrCidAndHash,
  EncodedTokenAttributes,
  ERC721Metadata,
  InfixOrUrlOrCidAndHash,
  LocalizedStringOrBoxedNumberWithDefault,
  LocalizedStringWithDefault,
  UniqueCollectionSchemaDecoded,
  UniqueCollectionSchemaToCreate,
  UniqueTokenDecoded,
  UniqueTokenToCreate,
} from "../types";
import { validateUniqueToken } from "./validators";
import { getEntries, safeJsonParseStringOrHexString } from "../tsUtils";
import {
  decodeTokenUrlOrInfixOrCidWithHashField,
  DecodingResult,
} from "../schemaUtils";
import { Address } from "@unique-nft/utils/address";
import { getCid, isCID, isIpfsLink, isIpfsUrl } from "./ipfs";
import { DEFAULT_IPFS_GATEWAYS } from "src/constants";

const addUrlObjectToTokenProperties = (
  properties: PropertiesArray,
  prefix: string,
  source: InfixOrUrlOrCidAndHash
) => {
  if (typeof source.urlInfix === "string") {
    properties.push({ key: `${prefix}.i`, value: source.urlInfix });
  } else if (typeof source.ipfsCid === "string") {
    properties.push({ key: `${prefix}.c`, value: source.ipfsCid });
  } else if (typeof source.url === "string") {
    properties.push({ key: `${prefix}.u`, value: source.url });
  }

  if (typeof source.hash === "string") {
    properties.push({ key: `${prefix}.h`, value: source.hash });
  }
};

const addKeyToTokenProperties = (
  properties: PropertiesArray,
  key: string,
  value: string | number | object
) => {
  let strValue = JSON.stringify(value);

  properties.push({
    key,
    value: strValue,
  });
};

export const encodeTokenToProperties = (
  token: UniqueTokenToCreate,
  schema: UniqueCollectionSchemaToCreate | UniqueCollectionSchemaDecoded
): PropertiesArray => {
  validateUniqueToken(token, schema as UniqueCollectionSchemaToCreate);

  const properties: PropertiesArray = [];
  if (token.name) addKeyToTokenProperties(properties, "n", token.name);
  if (token.description)
    addKeyToTokenProperties(properties, "d", token.description);

  if (token.encodedAttributes) {
    for (const n in token.encodedAttributes) {
      const value = token.encodedAttributes[n];
      addKeyToTokenProperties(properties, `a.${n}`, value);
    }
  }

  if (token.image) addUrlObjectToTokenProperties(properties, "i", token.image);
  if (schema.imagePreview && token.imagePreview)
    addUrlObjectToTokenProperties(properties, "p", token.imagePreview);
  if (schema.video && token.video)
    addUrlObjectToTokenProperties(properties, "v", token.video);
  if (schema.audio && token.audio)
    addUrlObjectToTokenProperties(properties, "au", token.audio);
  if (schema.spatialObject && token.spatialObject)
    addUrlObjectToTokenProperties(properties, "so", token.spatialObject);

  return properties;
};

const fillTokenFieldByKeyPrefix = <T extends UniqueTokenToCreate>(
  token: T,
  properties: PropertiesArray,
  prefix: string,
  tokenField: keyof T
) => {
  const keysMatchingPrefix = [
    `${prefix}.i`,
    `${prefix}.u`,
    `${prefix}.c`,
    `${prefix}.h`,
  ];
  if (properties.some(({ key }) => keysMatchingPrefix.includes(key)))
    token[tokenField] = {} as any;

  const field = token[tokenField] as any as InfixOrUrlOrCidAndHash;

  const urlInfixProperty = properties.find(
    ({ key }) => key === keysMatchingPrefix[0]
  );
  if (urlInfixProperty) field.urlInfix = urlInfixProperty.value;

  const urlProperty = properties.find(
    ({ key }) => key === keysMatchingPrefix[1]
  );
  if (urlProperty) field.url = urlProperty.value;

  const ipfsCidProperty = properties.find(
    ({ key }) => key === keysMatchingPrefix[2]
  );
  if (ipfsCidProperty) field.ipfsCid = ipfsCidProperty.value;

  const hashProperty = properties.find(
    ({ key }) => key === keysMatchingPrefix[3]
  );
  if (hashProperty) field.hash = hashProperty.value;
};

export const unpackEncodedTokenFromProperties = <T extends UniqueTokenToCreate>(
  properties: PropertiesArray,
  schema: UniqueCollectionSchemaToCreate | UniqueCollectionSchemaDecoded
): T => {
  const token: T = {} as T;

  const nameProperty = properties.find(({ key }) => key === "n");
  if (nameProperty) {
    const parsedName =
      safeJsonParseStringOrHexString<LocalizedStringWithDefault>(
        nameProperty.value
      );
    if (typeof parsedName !== "string") {
      token.name = parsedName;
    }
  }

  const descriptionProperty = properties.find(({ key }) => key === "d");
  if (descriptionProperty) {
    const parsedDescription =
      safeJsonParseStringOrHexString<LocalizedStringWithDefault>(
        descriptionProperty.value
      );
    if (typeof parsedDescription !== "string") {
      token.description = parsedDescription;
    }
  }

  fillTokenFieldByKeyPrefix(token, properties, "i", "image");
  fillTokenFieldByKeyPrefix(token, properties, "p", "imagePreview");
  fillTokenFieldByKeyPrefix(token, properties, "v", "video");
  fillTokenFieldByKeyPrefix(token, properties, "au", "audio");
  fillTokenFieldByKeyPrefix(token, properties, "so", "spatialObject");

  const attributeProperties = properties.filter(({ key }) =>
    key.startsWith("a.")
  );
  if (attributeProperties.length) {
    const attrs = {} as EncodedTokenAttributes;

    for (const attrProp of attributeProperties) {
      const { key, value } = attrProp;
      const parsed = safeJsonParseStringOrHexString<any>(value);
      const attributeKey = parseInt(key.split(".")[1] || "");

      if (
        !isNaN(attributeKey) &&
        schema.attributesSchema?.hasOwnProperty(attributeKey)
      ) {
        attrs[attributeKey] = parsed;
      }
    }

    token.encodedAttributes = attrs;
  }

  return token;
};

export const decodeTokenFromProperties = async (
  collectionId: number,
  tokenId: number,
  rawToken: HumanizedNftToken,
  schema: UniqueCollectionSchemaToCreate | UniqueCollectionSchemaDecoded
): Promise<DecodingResult<UniqueTokenDecoded>> => {
  const unpackedToken = unpackEncodedTokenFromProperties(
    rawToken.properties,
    schema
  );

  try {
    validateUniqueToken(unpackedToken, schema);
  } catch (e) {
    return {
      result: null,
      error: e as Error,
    };
  }

  const token: UniqueTokenDecoded = {
    owner: rawToken.owner,
    tokenId,
    collectionId,
    attributes: fullDecodeTokenAttributes(unpackedToken, schema),
    image: decodeTokenUrlOrInfixOrCidWithHashField(
      unpackedToken.image,
      schema.image
    ),
  };
  if (token.owner.Ethereum && Address.is.nestingAddress(token.owner.Ethereum)) {
    token.nestingParentToken = Address.nesting.addressToIds(
      token.owner.Ethereum
    );
  }

  if (unpackedToken.name) token.name = unpackedToken.name;
  if (unpackedToken.description) token.description = unpackedToken.description;

  if (unpackedToken.imagePreview) {
    token.imagePreview = decodeTokenUrlOrInfixOrCidWithHashField(
      unpackedToken.imagePreview,
      schema.imagePreview
    );
  }
  if (unpackedToken.video) {
    token.video = decodeTokenUrlOrInfixOrCidWithHashField(
      unpackedToken.video,
      schema.video
    );
  }
  if (unpackedToken.audio) {
    token.audio = decodeTokenUrlOrInfixOrCidWithHashField(
      unpackedToken.audio,
      schema.audio
    );
  }
  if (unpackedToken.spatialObject) {
    token.spatialObject = decodeTokenUrlOrInfixOrCidWithHashField(
      unpackedToken.spatialObject,
      schema.spatialObject
    );
  }

  return {
    result: token,
    error: null,
  };
};

export const extractTokenURI = (
  rawToken: HumanizedNftToken,
  schema: UniqueCollectionSchemaDecoded
): string => {
  const baseURI = schema.baseURI;
  const URI = rawToken.properties.find((p) => p.key === "URI")?.value;
  const URISuffix = rawToken.properties.find(
    (p) => p.key === "URISuffix"
  )?.value;

  const baseURIIsOk = !!baseURI && baseURI.length > 0;
  const URIIsOk = !!URI && URI.length > 0;
  const suffixIsOk = !!URISuffix && URISuffix.length > 0;

  if (URIIsOk) {
    return URI;
  } else if (!baseURIIsOk) {
    return "";
  } else if (suffixIsOk) {
    return baseURI + URISuffix;
  } else {
    return baseURI;
  }
};

export const extractERC721MetadataFromIpfsUrl = async (
  ipfsUrl: string,
  fetch: (url: string) => Promise<any>
): Promise<ERC721Metadata> => {
  try {
    const response = await fetch(ipfsUrl);

    console.log(response);

    return response.json();
  } catch {
    throw new Error("Cannot extract ERC721 metadata from tokenURI");
  }
};
export const extractERC721MetadataFromIpfsCid = async (
  ipfsCid: string,
  fetch: (url: string) => Promise<any>,
  ipfsGateways: string[]
): Promise<ERC721Metadata> => {
  const ipfsUrls = ipfsGateways.map((ipfsGateway) => {
    const ipfsUrl = new URL(ipfsGateway);

    const url = new URL(`ipfs/${ipfsCid}`, ipfsUrl.origin);

    return url.toString();
  });

  for (const ipfsUrl of ipfsUrls) {
    try {
      return await extractERC721MetadataFromIpfsUrl(ipfsUrl, fetch);
    } catch {
      //
    }
  }
  throw new Error("Cannot extract ERC721 metadata from tokenURI");
};

export const extractERC721MetadataFromIpfsLink = async (
  ipfsLink: string,
  fetch: (url: string) => Promise<any>,
  ipfsGateways: string[]
): Promise<ERC721Metadata> => {
  const ipfsUrls = ipfsGateways.map((ipfsGateway) => {
    const ipfsUrl = new URL(ipfsGateway);

    const url = new URL(`ipfs/${ipfsLink.split("//")[1]}`, ipfsUrl.origin);

    return url.toString();
  });

  for (const ipfsUrl of ipfsUrls) {
    try {
      return await extractERC721MetadataFromIpfsUrl(ipfsUrl, fetch);
    } catch {
      //
    }
  }
  throw new Error("Cannot extract ERC721 metadata from tokenURI");
};

export const extractERC721Metadata = async (
  tokenURI: string,
  fetch: (url: string) => Promise<any>,
  ipfsGateways: string[]
): Promise<ERC721Metadata> => {
  const gateways = [...new Set([...ipfsGateways, ...DEFAULT_IPFS_GATEWAYS])];

  if (isIpfsUrl(tokenURI)) {
    return await extractERC721MetadataFromIpfsUrl(tokenURI, fetch);
  } else if (isCID(tokenURI)) {
    return await extractERC721MetadataFromIpfsCid(tokenURI, fetch, gateways);
  } else if (isIpfsLink(tokenURI)) {
    return await extractERC721MetadataFromIpfsLink(tokenURI, fetch, gateways);
  } else {
    throw new Error("Invalid tokenURI");
  }
};

export const extractAttributesFromERC721Metadata = (
  metadata: ERC721Metadata
): DecodedAttributes => {
  let attributes: DecodedAttributes = {};

  const keys = [...new Set(metadata.attributes.map((a) => a.trait_type))];

  keys.forEach((key, index) => {
    const values = metadata.attributes
      .filter(({ trait_type }) => trait_type === key)
      .map((attr) => attr.value);

    const type =
      typeof values[0] === "string"
        ? AttributeType.string
        : values[0] % 1 === 0
        ? AttributeType.integer
        : AttributeType.float;

    if (values.length > 1) {
      const rawValue = values as string[] | number[];
      const value = values.map((value) => ({
        _: value,
      })) as { _: string }[] | { _: number }[];

      attributes[index] = {
        name: {
          _: key,
        },
        value,
        isArray: true,
        type,
        rawValue,
        isEnum: false,
      };
    } else {
      const rawValue = values[0];
      const value = { _: rawValue } as { _: string } | { _: number };

      attributes[index] = {
        name: {
          _: key,
        },
        value,
        isArray: false,
        type,
        rawValue,
        isEnum: false,
      };
    }
  });

  return attributes;
};

export const extractImageFromERC721Metadata = (metadata: ERC721Metadata) => {
  return {
    ipfsCid: getCid(metadata.image) || "",
    fullUrl: metadata.image,
  };
};

export const decodeTokenFromERC721Metadata = async (
  collectionId: number,
  tokenId: number,
  rawToken: HumanizedNftToken,
  schema: UniqueCollectionSchemaDecoded,
  fetch: (url: string) => Promise<any>,
  ipfsGateways: string[]
): Promise<DecodingResult<UniqueTokenDecoded>> => {
  try {
    const tokenURI = extractTokenURI(rawToken, schema);

    const erc721Metadata = await extractERC721Metadata(
      tokenURI,
      fetch,
      ipfsGateways
    );

    const attributes = extractAttributesFromERC721Metadata(erc721Metadata);

    const image = extractImageFromERC721Metadata(erc721Metadata);

    const token: UniqueTokenDecoded = {
      owner: rawToken.owner,
      tokenId,
      collectionId,
      attributes,
      image,
      name: { _: erc721Metadata.name },
      description: { _: erc721Metadata.description },
      tokenURI,
      erc721Metadata,
    };

    return {
      result: token,
      error: null,
    };
  } catch (e) {
    return {
      result: null,
      error: e as Error,
    };
  }
};

export const fullDecodeTokenAttributes = (
  token: UniqueTokenToCreate,
  collectionSchema:
    | UniqueCollectionSchemaToCreate
    | UniqueCollectionSchemaDecoded
): DecodedAttributes => {
  const attributes: DecodedAttributes = {};
  if (!token.encodedAttributes) return {};

  const entries = getEntries(token.encodedAttributes);
  for (const entry of entries) {
    const [key, rawValue] = entry;

    const schema = collectionSchema.attributesSchema?.[key];
    if (!schema) continue;

    let value: any = rawValue;

    if (schema.enumValues) {
      if (schema.isArray && Array.isArray(rawValue)) {
        value = rawValue
          .map((v) => (typeof v === "number" ? schema.enumValues?.[v] : null))
          .filter((v) => !!v);
      } else {
        if (typeof rawValue === "number") {
          value = schema.enumValues[rawValue];
        }
      }
    }

    attributes[key] = {
      name: schema.name,
      value: value as
        | LocalizedStringOrBoxedNumberWithDefault
        | Array<LocalizedStringOrBoxedNumberWithDefault>,
      isArray: schema.isArray || false,
      type: schema.type,
      rawValue,
      isEnum: !!schema.enumValues,
    };
  }
  return attributes;
};
