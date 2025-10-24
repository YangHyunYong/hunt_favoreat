import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { createConfig } from "wagmi";
import { base } from "wagmi/chains";
import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { fallback, http as viemHttp } from "viem";


const projectId = import.meta.env.VITE_WC_PROJECT_ID // 실제 프로젝트 ID로 교체 필요

const wagmiAdapter = new WagmiAdapter({
  networks: [base],
  projectId
})

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

// 3. Create AppKit
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [base],
  projectId,
  metadata: {
    name: 'FavorEat',
    description: 'FavorEat Farcaster Mini App',
    url: 'https://favoreat.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886']
  }
})

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
