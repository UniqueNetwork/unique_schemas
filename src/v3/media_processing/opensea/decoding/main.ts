import Sdk, {TokenByIdResponse} from "@unique-nft/sdk";
import {decoding} from "./decoding";

const sdk: Sdk = new Sdk({
  baseUrl: 'https://rest.unique.network/unique/v1'
});


async function main() {
  const token: TokenByIdResponse = await sdk.token.get({
    collectionId: 1,
    tokenId: 1
  })
  console.log(JSON.stringify(token, null, 2));

  const withMediaDetails = true;

  const openseaExample = await decoding(token, withMediaDetails);

  console.log('openseaExample:');
  console.log(JSON.stringify(openseaExample, null, 2));
}


main().catch(console.error);
