import * as fcl from "@onflow/fcl"

// Flow network configuration
const FLOW_NETWORK = import.meta.env.VITE_FLOW_NETWORK || "testnet"

const networkConfig = {
  testnet: {
    accessNode: "https://rest-testnet.onflow.org",
    discoveryWallet: "https://fcl-discovery.onflow.org/testnet/authn",
    flowToken: "0x7e60df042a9c0868",
    fungibleToken: "0x9a0766d93b6608b7",
    nonFungibleToken: "0x631e88ae7f1d7c20",
    d3skOfferNFT: import.meta.env.VITE_D3SK_OFFER_ADDRESS || "0x_DEPLOY_ADDRESS",
    d3skRegistry: import.meta.env.VITE_D3SK_REGISTRY_ADDRESS || "0x_DEPLOY_ADDRESS",
    scheduler: "0xe467b9dd11fa00df",
  },
  mainnet: {
    accessNode: "https://rest-mainnet.onflow.org",
    discoveryWallet: "https://fcl-discovery.onflow.org/mainnet/authn",
    flowToken: "0x1654653399040a61",
    fungibleToken: "0xf233dcee88fe0abe",
    nonFungibleToken: "0x1d7e57aa55817448",
    d3skOfferNFT: import.meta.env.VITE_D3SK_OFFER_ADDRESS || "0x_DEPLOY_ADDRESS",
    d3skRegistry: import.meta.env.VITE_D3SK_REGISTRY_ADDRESS || "0x_DEPLOY_ADDRESS",
    scheduler: "0xe467b9dd11fa00df",
  }
}

const config = networkConfig[FLOW_NETWORK]

fcl.config({
  "app.detail.title": "D3SK Exchange",
  "app.detail.icon": "https://d3sk.exchange/favicon.svg",
  "accessNode.api": config.accessNode,
  "discovery.wallet": config.discoveryWallet,
  "flow.network": FLOW_NETWORK,
  // Contract address aliases
  "0xFlowToken": config.flowToken,
  "0xFungibleToken": config.fungibleToken,
  "0xD3SKOfferNFT": config.d3skOfferNFT,
  "0xD3SKRegistry": config.d3skRegistry,
  "0xSCHEDULER": config.scheduler,
})

export { fcl, config, FLOW_NETWORK }
export default config
