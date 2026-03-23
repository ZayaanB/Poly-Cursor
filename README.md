# Poly-Cursor

An agentic IDE for Solana development, specializing in Polymarket-style prediction markets and NFT tokenizers.

## Features

- **Prediction Markets** — Create, trade, and resolve markets with on-chain settlement
- **NFT Tokenizer** — Mint, fractionalize, and manage NFT collections with Metaplex
- **Registry** — Index and discover deployed programs and markets
- **Next.js Frontend** — Wallet integration, market dashboards, and tokenizer UI
- **Docker Deployment** — Production-ready configuration for Vultr and cloud providers

## Tech Stack

| Layer     | Technology                    |
| --------- | ----------------------------- |
| Programs  | Rust, Anchor                  |
| Frontend  | Next.js, TypeScript, TailwindCSS |
| Wallet    | @solana/wallet-adapter-react  |
| Backend   | FastAPI, Python               |
| Desktop   | Tauri (Rust + React)          |

## Project Structure

```
Poly-Cursor/
├── programs/
│   ├── prediction_market/   # Polymarket-style prediction markets
│   ├── nft_tokenizer/      # NFT minting and fractionalization
│   └── registry/           # Program and market indexing
├── app/                    # Next.js frontend
├── scripts/                # Local testing and deployment
├── deployment/             # Dockerfile, docker-compose
└── backend/                # FastAPI orchestration
```

## Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) and [Anchor](https://www.anchor-lang.com/)
- [Node.js](https://nodejs.org/) 18+
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)

### Local Development

```bash
# Start local validator
./scripts/local/start-validator.sh

# Deploy programs
./scripts/deploy/deploy-all.sh --cluster localnet

# Run frontend
cd app && npm install && npm run dev
```

### Docker (Vultr)

```bash
cd deployment && docker-compose up -d
```

## Development

- **Linux Mint** — Scripts and paths are optimized for Linux Mint compatibility
- **Code quality** — Clean, modular, and heavily commented code
- **Smart contracts** — Latest Anchor framework patterns
- **Web3** — @solana/wallet-adapter-react for all frontend integrations

## License

MIT
