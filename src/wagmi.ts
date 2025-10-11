import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { http, createConfig } from "wagmi";
import { base, mainnet } from "wagmi/chains";
import { createAppKit } from '@reown/appkit'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'

// const projectId = '10e9bcf31951bca3f4ef39cac2e19a34' // 실제 프로젝트 ID로 교체 필요
const projectId = import.meta.env.VITE_WC_PROJECT_ID // 실제 프로젝트 ID로 교체 필요

const wagmiAdapter = new WagmiAdapter({
  networks: [mainnet, base],
  projectId
})

export const config = createConfig({
  chains: [base, mainnet],
  connectors: [farcasterFrame()],
  transports: {
    [base.id]: http(),
    [mainnet.id]: http(),
  },
});

// 3. Create AppKit
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: [mainnet, base],
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
