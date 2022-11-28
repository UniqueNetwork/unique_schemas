export const pathGatewayPattern = /^https?:\/\/[^/]+\/(ip[fn]s)\/([^/?#]+)/;
export const pathPattern = /^\/(ip[fn]s)\/([^/?#]+)/;
const defaultProtocolMatch = 1;
const defaultHashMath = 2;
export const subdomainGatewayPattern = /^https?:\/\/([^/]+)\.(ip[fn]s)\.[^/?]+/;
const subdomainIdMatch = 1;
const subdomainProtocolMatch = 2;

export const cidPattern =
  /^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,})$/;

export const ipfsLinkPattern = /^ipfs:\/\/(.*)$/;

export function isCID(input: string): boolean {
  const match = input.match(cidPattern);

  if (match == null) {
    return false;
  } else {
    return true;
  }
}

export function isIpfsLink(input: string): boolean {
  const match = input.match(ipfsLinkPattern);

  if (match == null) {
    return false;
  } else {
    return true;
  }
}

function isIpfs(
  input: string,
  pattern: RegExp | string,
  protocolMatch: number = defaultProtocolMatch,
  hashMatch: number = defaultHashMath
): boolean {
  const match = input.match(pattern);
  if (match == null) {
    return false;
  }

  if (match[protocolMatch] !== "ipfs") {
    return false;
  }

  let hash = match[hashMatch];

  if (hash != null && pattern === subdomainGatewayPattern) {
    hash = hash.toLowerCase();
  }

  return isCID(hash);
}

export const isIpfsSubdomain = (url: string) =>
  isIpfs(
    url,
    subdomainGatewayPattern,
    subdomainProtocolMatch,
    subdomainIdMatch
  );

export const isIpfsUrl = (url: string) =>
  isIpfs(url, pathGatewayPattern) || isIpfsSubdomain(url);

export function getCid(url: string) {
  const pattern = /^(.*)\/ipfs\/(.*)$/;

  const result = url.match(pattern);

  return result ? result[2] : "";
}
