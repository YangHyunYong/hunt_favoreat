import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { fallback, http as viemHttp } from "viem";


export const config = createConfig({
  chains: [base],
  connectors: [miniAppConnector()],
  transports: {
    [base.id]: fallback(
      [
        viemHttp("https://developer-access-mainnet.base.org"),
        viemHttp("https://mainnet.base.org"),
        viemHttp("https://base.gateway.tenderly.co"),
        viemHttp("https://base.drpc.org"),
        viemHttp("https://base-pokt.nodies.app"),
        viemHttp("https://base.rpc.subquery.network/public"),
        viemHttp("https://endpoints.omniatech.io/v1/base/mainnet/public"),
        viemHttp("https://gateway.tenderly.co/public/base"),
      ],
      { retryCount: 2, rank: false }
    ),  
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
