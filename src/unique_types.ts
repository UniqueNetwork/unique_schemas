export type CrossAccountId =
  | ({ Substrate: string } & { Ethereum?: never })
  | ({ Ethereum: string } & { Substrate?: never });

export interface TokenPropertyPermission {
  mutable: boolean;
  collectionAdmin: boolean;
  tokenOwner: boolean;
}

export interface TokenPropertyPermissionObject {
  key: string;
  permission: TokenPropertyPermission;
}

export type CollectionTokenPropertyPermissions =
  Array<TokenPropertyPermissionObject>;

export type PropertiesArray = Array<{
  key: string;
  value: string;
}>;

export type HumanizedNftToken = {
  owner: CrossAccountId;
  properties: PropertiesArray;
};

export type CollectionFlags = {
  foreign: boolean;
  erc721metadata: boolean;
};
