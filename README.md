# Poly-Cursor

An agentic IDE extension for Solana development, specializing in Polymarket-style prediction markets and NFT tokenizers.

## Features

* Prediction Markets: Create, trade, and resolve markets with on-chain settlement.
* NFT Tokenizer: Mint, fractionalize, and manage NFT collections with Metaplex.
* Native IDE Integration: Runs directly inside VS Code or Cursor as an extension.
* Real-Time Generation: Streams generated Rust and Next.js code directly into the workspace via Server-Sent Events.
* Docker Deployment: Production-ready configuration for Vultr and other cloud providers.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Programs | Rust, Anchor |
| Frontend | Next.js, TypeScript, TailwindCSS |
| Wallet | @solana/wallet-adapter-react |
| Backend | FastAPI, Python, LangChain |
| Extension | React, Vite, VS Code Extension API |

## Project Structure

```text
Poly-Cursor/
├── extension/              # VS Code / Cursor extension frontend
├── backend/                # FastAPI orchestration and AI agents
├── programs/               # Generated Rust/Anchor smart contracts
├── app/                    # Generated Next.js frontend
├── scripts/                # Local testing and deployment scripts
└── deployment/             # Dockerfile, docker-compose

Prerequisites
Rust and Anchor

Node.js 18+

Python 3.10+

Solana CLI

# Start the FastAPI Orchestrator
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Run the Extension in Development Mode
cd ../extension
npm install
npm run watch

cd deployment && docker-compose up -d

# Create a .env in the backend directory backend

OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
PINECONE_API_KEY=your_vector_db_key
ENVIRONMENT=development
ALLOWED_ORIGINS=vscode-webview://*

Development
Environment: Scripts and paths are optimized for Linux Mint compatibility.

Code Quality: Clean, modular, and heavily commented code with strict TypeScript typing.

Smart Contracts: Implements the latest Anchor framework patterns and secure PDA derivations.

Web3: Utilizes @solana/wallet-adapter-react for all frontend integrations.

Author
Zayaan Bhanwadia - First-Year Computer Science Co-op Student at the University of Toronto Scarborough