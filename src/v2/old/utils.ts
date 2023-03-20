export type DecodingImageLinkOptions = {
  baseUrl?: string
  dummyImageFullUrl?: string
}

const DEFAULT_BASE_URL = <const>`https://ipfs.unique.network/ipfs/`
const DEFAULT_DUMMY_IMAGE_FULL_URL = <const>`https://ipfs.unique.network/ipfs/QmPCqY7Lmxerm8cLKmB18kT1RxkwnpasPVksA8XLhViVT7`

export const parseImageLinkOptions = (options?: DecodingImageLinkOptions): Required<DecodingImageLinkOptions> => {
  let baseUrl: string = DEFAULT_BASE_URL
  let dummyImageFullUrl: string = DEFAULT_DUMMY_IMAGE_FULL_URL

  try {
    new URL(options?.baseUrl || '')
    baseUrl = options!.baseUrl!
  } catch {
  }

  try {
    new URL(options?.dummyImageFullUrl || '')
    dummyImageFullUrl = options!.dummyImageFullUrl!
  } catch {
  }

  return {
    baseUrl,
    dummyImageFullUrl,
  }
}
