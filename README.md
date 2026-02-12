# D3SK Exchange

Zero-custody peer-to-peer limit order exchange on Flow. Your tokens never leave your wallet until settlement — no deposits, no approvals, no custody. Settlement is atomic and instant.

## Architecture

**Smart Contracts (Cadence 1.0)**
- `D3SKOfferNFT.cdc` — Offers as transferable NFTs with on-chain SVG certificates, holder payout, expiration scheduling, and configurable protocol fees
- `D3SKRegistry.cdc` — Read-only discovery index for active offers (holds no funds)

**Frontend (React + Vite)**
- Retro 8-bit pixel art UI with Press Start 2P / VT323 fonts
- Live scrolling ticker with CoinGecko prices
- FCL wallet integration (Lilico, Blocto, Flow Wallet, etc.)

## Supported Tokens

FLOW, stFLOW, USDC, USDT, PYUSD, ceWBTC, ceWETH, DUST, STARLY, BLT, REVV, FUSD

## Prerequisites

- [Flow CLI](https://developers.flow.com/tools/flow-cli) (v1.x+)
- Node.js 18+
- A Flow mainnet account with FLOW for storage/deployment fees

## Deploy Contracts to Mainnet

1. **Create a Flow mainnet account** (if you don't have one):
   ```bash
   flow accounts create --network mainnet
   ```

2. **Configure your deployer account** in `flow.json`:
   - Replace `YOUR_MAINNET_ADDRESS` with your account address
   - Save your private key to `mainnet-deployer.pkey` (never commit this file)

3. **Deploy**:
   ```bash
   flow project deploy --network mainnet
   ```
   This deploys both `D3SKOfferNFT` and `D3SKRegistry` to your account.

4. **Set your treasury address** (where protocol fees go):
   ```bash
   flow transactions send transactions/set_treasury.cdc 0xYOUR_TREASURY_ADDRESS --network mainnet --signer mainnet-deployer
   ```

## Deploy Frontend to Vercel

1. **Push to GitHub**:
   ```bash
   git init && git add -A && git commit -m "Initial commit"
   gh repo create d3sk-exchange --public --push --source=.
   ```

2. **Connect to Vercel**:
   - Import the repo at [vercel.com/new](https://vercel.com/new)
   - Set **Root Directory** to `frontend`
   - Add environment variables:
     ```
     VITE_FLOW_NETWORK=mainnet
     VITE_D3SK_OFFER_ADDRESS=0x<your_deployed_address>
     VITE_D3SK_REGISTRY_ADDRESS=0x<your_deployed_address>
     ```
   - Deploy

3. **Custom domain** (optional):
   - Add your domain in Vercel Project Settings → Domains

## Local Development

```bash
cd frontend
cp .env.example .env    # edit with your contract addresses
npm install
npm run dev             # http://localhost:5173
```

## Contract Admin

The deployer account holds the Admin resource with these capabilities:

| Transaction | Purpose |
|---|---|
| `set_fee_rate.cdc` | Update protocol fee (default 0.3%, max 5%) |
| `set_treasury.cdc` | Change fee recipient address |
| `transfer_admin.cdc` | Move Admin to a multisig/DAO |

## Project Structure

```
z3ro/
├── contracts/
│   ├── D3SKOfferNFT.cdc      # NFT offer positions + on-chain SVG
│   └── D3SKRegistry.cdc      # Offer discovery index
├── transactions/
│   ├── create_offer.cdc
│   ├── fill_offer.cdc
│   ├── cancel_offer.cdc
│   ├── set_fee_rate.cdc
│   ├── set_treasury.cdc
│   └── transfer_admin.cdc
├── scripts/
│   ├── get_all_offers.cdc
│   ├── get_offer_details.cdc
│   ├── get_offers_by_maker.cdc
│   ├── get_offers_by_pair.cdc
│   └── get_fee_info.cdc
├── frontend/
│   ├── src/
│   ├── vercel.json
│   └── .env.example
├── flow.json
└── README.md
```

## License

MIT
