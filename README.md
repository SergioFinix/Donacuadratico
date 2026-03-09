# DonaCuadratico 🎯 (QuadTip)

**Quadratic Tipping for Farcaster via Celo.**

DonaCuadratico is a Farcaster Mini App designed to revolutionize content creator tipping by leveraging the power of **Quadratic Funding** directly within the social feed. Built on the **Celo** blockchain, it allows users to send micro-tips in `cUSD` that geometrically unlock matching pools, multiplying the impact of grassroots support.

## 🌟 Hackathon Highlights

- **Celo Native**: Fully deployed on Celo Sepolia, utilizing `cUSD` for stable, low-fee, and incredibly fast micro-transactions.
- **Farcaster Mini App**: Fully compliant Farcaster Frame integrating `@farcaster/frame-sdk` for a seamless embedded social experience. Features dynamic OpenGraph image generation and a viral Cast-to-Share loop.
- **Sybil Resistance with Human Passport**: Integrated with `@human.tech/passport-embed`. Both creators and tippers must prove their humanity (Score $\geq$ 20) to participate, ensuring the quadratic math is protected against Sybil attacks.
- **Real-time Math Simulation**: The frontend calculates the projected quadratic match $`(\sum \sqrt{tips})^2`$ live as the user chooses their tip amount.

## 🚀 How it Works (The Flow)

1. **Verification**: Users connect their wallet and verify their humanity via the Human Passport widget. Once verified, the proof is recorded on-chain via a gas-subsidized backend call.
2. **Creator Registration**: Verified humans can register their wallets as creators for the active tipping round.
3. **Tipping**: Any verified user can visit a creator's profile, select an amount of `cUSD`, and see the projected matching impact. 
4. **Viral Loop**: After the transaction is confirmed, the app prompts the user to share a Cast on Warpcast bragging about their tip and the generated matching value.
5. **Finalization**: At the end of the 7-day round, the Smart Contract calculates the exact mathematical distribution of the matching pool and allows creators to claim their funds.

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **Web3 / Social**: wagmi, viem, `@farcaster/frame-sdk`, `@human.tech/passport-embed`
- **Smart Contracts**: Solidity ^0.8.20, Hardhat Ignition
- **Blockchain**: Celo Sepolia Testnet

## 🔗 Smart Contract Deployment

- **Network**: Celo Sepolia Testnet (Chain ID: 11142220)
- **QuadraticTipping Contract**: `0x6A1A368162cE28f94E33Dbc72C4c82cA8A8476E6`
- **cUSD Token (Testnet)**: `0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1`

## 💻 Getting Started (Local Development)

This is a monorepo managed by Turborepo.

### 1. Install dependencies
```bash
pnpm install
```

### 2. Set up Environment Variables
You will need `.env` files in both `apps/contracts` and `apps/web`. A template is provided in `apps/web/.env.template`.
Make sure to include your `PASSPORT_API_KEY`, `PASSPORT_SCORER_ID`, and wallet private keys.

### 3. Start the Next.js App
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### 4. Smart Contract Commands (in `apps/contracts`)
- Compile contracts: `npx hardhat compile`
- Deploy to Celo Sepolia: `npx hardhat ignition deploy ignition/modules/QuadraticTipping.ts --network celo-sepolia`

---
*Built with ❤️ for the Celo & Farcaster Ecosystem.*
