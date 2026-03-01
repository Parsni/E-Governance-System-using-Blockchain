# Blockchain-Based E-Governance System

## Complete Implementation Guide — College Final Year Project

---

> **What this project is:** A fully functional, multi-module E-Governance system built on Ethereum smart contracts. It demonstrates how blockchain technology can bring **transparency**, **security**, **trust**, and **tamper-proof record keeping** to government services.
>
> **Modules implemented:**
> 1. ✅ **Blockchain-Based Voting System** — `EGovernanceVoting.sol`
> 2. ✅ **Land Record Management System** — `LandRegistry.sol`
> 3. ✅ **Public Fund Tracking System** — `PublicFundTracking.sol`
> 4. 📐 **Digital Identity Verification (DID)** — Explained conceptually in Part 9

---

## Table of Contents

| Part | Title | What You'll Learn |
|------|-------|-------------------|
| 1 | [System Architecture](#part-1--system-architecture) | Full system design, component breakdown, transaction lifecycle |
| 2 | [Technology Stack](#part-2--technology-stack-with-comparison) | Platform comparison, stack justification |
| 3 | [Downloads & Dependencies](#part-3--downloads--dependency-list) | Every tool, package, and why it's needed |
| 4 | [Step-by-Step Installation](#part-4--step-by-step-installation) | Commands from zero to running project |
| 5 | [Smart Contract Design](#part-5--smart-contract-design) | Full Solidity code with line-by-line explanations |
| 6 | [Database Structure](#part-6--database-structure-off-chain-data) | MongoDB schemas, on-chain vs off-chain |
| 7 | [Frontend Implementation](#part-7--frontend-implementation) | MetaMask, ethers.js, sending transactions |
| 8 | [Security Implementation](#part-8--security-implementation) | Hashing, signatures, RBAC, double-vote prevention |
| 9 | [Advanced Features](#part-9--advanced-features) | ZKP, IPFS, DAO, biometrics |
| 10 | [Deployment Guide](#part-10--deployment-guide) | Testnet, Vercel, Railway, environment variables |
| 11 | [Testing Strategy](#part-11--testing-strategy) | Hardhat tests, API tests, security testing |

---

## Project Folder Structure

```
Blockchain/
├── contracts/                          # Solidity smart contracts
│   ├── EGovernanceVoting.sol           # Voting module
│   ├── LandRegistry.sol               # Land record module
│   └── PublicFundTracking.sol          # Public fund tracking module
├── scripts/
│   └── deploy.js                      # Deploys all 3 contracts
├── test/                              # Hardhat unit tests
│   ├── EGovernanceVoting.test.js
│   ├── LandRegistry.test.js
│   └── PublicFundTracking.test.js
├── frontend/                          # Web UI (HTML + vanilla JS)
│   ├── index.html                     # Voting portal
│   ├── main.js                        # Voting logic (ethers.js + MetaMask)
│   ├── land.html                      # Land registry portal
│   ├── land.js                        # Land registry logic
│   ├── funds.html                     # Fund tracking portal
│   └── funds.js                       # Fund tracking logic
├── backend/                           # Express + MongoDB off-chain layer
│   ├── server.js                      # Express entry point
│   ├── models/
│   │   ├── User.js                    # User profile schema
│   │   ├── TransactionLog.js          # Off-chain tx log schema
│   │   └── LandRecord.js             # Supplemental land data schema
│   ├── routes/
│   │   ├── auth.js                    # Registration + profile routes
│   │   └── transactions.js           # Transaction log routes
│   ├── package.json
│   └── .env.example                   # Environment variable template
├── hardhat.config.js                  # Hardhat configuration
├── package.json                       # Root dependencies
└── README.md                          # ← You are here
```

---

# PART 1 — SYSTEM ARCHITECTURE

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Citizen / Admin)                    │
│                    Browser + MetaMask Wallet                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │    FRONTEND LAYER       │
              │  HTML + CSS + JS        │
              │  ethers.js + MetaMask   │
              │  (index.html,           │
              │   land.html,            │
              │   funds.html)           │
              └─────┬──────────┬────────┘
                    │          │
        ┌───────────▼──┐   ┌──▼────────────┐
        │  BLOCKCHAIN  │   │   BACKEND     │
        │    LAYER     │   │   (Express)   │
        │  (Ethereum)  │   │   MongoDB     │
        │              │   │              │
        │ Smart        │   │ Off-chain    │
        │ Contracts:   │   │ storage:     │
        │ • Voting     │   │ • Users      │
        │ • Land       │   │ • Tx Logs    │
        │ • Funds      │   │ • Land Meta  │
        └──────────────┘   └──────────────┘
```

## Component Breakdown

### 1. Frontend (Web Portal)
- **Technology:** HTML5, CSS (Bootstrap 5), vanilla JavaScript
- **Library:** `ethers.js` v5 — communicates with Ethereum-compatible networks
- **Wallet:** MetaMask browser extension — signs transactions with the user's private key
- **Pages:**
  - `index.html` — Voting portal (create elections, cast votes, view results)
  - `land.html` — Land registry portal (register, verify, transfer parcels)
  - `funds.html` — Fund tracking portal (create schemes, release funds, milestones)

### 2. Backend (Off-Chain API)
- **Technology:** Node.js + Express.js
- **Database:** MongoDB (via Mongoose ODM)
- **Purpose:** Stores supplemental data that does NOT need to be on the blockchain:
  - User profiles (name, email, role)
  - Transaction hash logs (for easy searching without querying the chain)
  - Additional land record metadata (GPS coordinates, photos, valuations)
- **Important:** The blockchain is the **source of truth**. The backend is a convenience layer.

### 3. Blockchain Layer (Smart Contracts)
- **Platform:** Ethereum (Solidity 0.8.20)
- **Framework:** Hardhat v3 (local blockchain, compilation, testing, deployment)
- **Contracts:**
  - `EGovernanceVoting.sol` — Election creation, voting, finalization
  - `LandRegistry.sol` — Land registration, verification, ownership transfer
  - `PublicFundTracking.sol` — Scheme creation, fund release, milestones

### 4. Wallet Integration
- **MetaMask** acts as the user's identity on the blockchain
- Each user is identified by their Ethereum wallet address (e.g., `0xABC...123`)
- Every state-changing action (vote, register land, release funds) is a **transaction** signed by the user's private key via MetaMask

### 5. Off-Chain Database (MongoDB)
- Stores data that complements on-chain records
- Example: On-chain stores `owner address` + `location hash`; MongoDB stores `full address`, `GPS coordinates`, `photos`
- This separation keeps blockchain storage costs low (gas fees)

## Transaction Lifecycle

Here is the complete journey of a transaction in this system:

```
Step 1: USER LOGIN
  └─ User opens the web portal (e.g., index.html)
  └─ Clicks "Connect MetaMask"
  └─ MetaMask pops up → user approves connection
  └─ Frontend receives user's wallet address

Step 2: FORM SUBMISSION
  └─ User fills a form (e.g., election details, land registration)
  └─ Frontend validates inputs (candidate count ≥ 2, area > 0, etc.)

Step 3: SMART CONTRACT CALL
  └─ Frontend calls the contract function via ethers.js
  └─ Example: contract.createElection("Title", "Desc", ["A","B"], start, end)

Step 4: TRANSACTION SIGNING
  └─ MetaMask pops up showing gas estimate and function details
  └─ User clicks "Confirm" → MetaMask signs the transaction with private key
  └─ Signed transaction is sent to the blockchain network (Hardhat / testnet)

Step 5: BLOCKCHAIN CONFIRMATION
  └─ Miner (or Hardhat node) includes the transaction in a block
  └─ Smart contract executes: validates require() checks, updates storage, emits events
  └─ Transaction is confirmed → frontend receives the tx receipt

Step 6: IMMUTABLE RECORD STORAGE
  └─ Data is now permanently stored on the blockchain
  └─ No one (not even the admin) can alter or delete it
  └─ Events are recorded in the transaction log for off-chain indexing

Step 7: PUBLIC VERIFICATION
  └─ Anyone can call view functions (getElection, getParcel, getScheme)
  └─ On a public network, use Etherscan to verify transactions independently
  └─ Frontend displays results by calling contract.getResults(), etc.
```

---

# PART 2 — TECHNOLOGY STACK (With Comparison)

## Blockchain Platform Comparison

| Feature | Ethereum | Polygon (Matic) | Hyperledger Fabric |
|---------|----------|-----------------|-------------------|
| **Type** | Public, permissionless | Public, Layer-2 on Ethereum | Private, permissioned |
| **Consensus** | Proof of Stake | Proof of Stake | Pluggable (Raft, PBFT) |
| **Smart Contract Language** | Solidity | Solidity (same as Ethereum) | Go, Java, Node.js |
| **Gas Fees** | High on mainnet | Very low (fractions of a cent) | No gas (permissioned) |
| **Wallet** | MetaMask | MetaMask (same config) | No standard wallet |
| **Ecosystem** | Largest — most tutorials, tools | Compatible with Ethereum tools | Enterprise-focused |
| **Beginner Friendliness** | ★★★★★ | ★★★★★ | ★★☆☆☆ |
| **College Project Suitability** | ✅ Best choice | ✅ Great for deployment | ⚠️ Complex setup, Docker required |

### Why Ethereum + Hardhat is Best for a College Project

1. **Largest ecosystem** — most tutorials, StackOverflow answers, and documentation
2. **Hardhat provides a free local blockchain** — no need to spend real money on gas
3. **Same code deploys to testnets and mainnet** — Sepolia testnet is free
4. **MetaMask is easy to install** — students and evaluators can try it immediately
5. **Polygon uses the same tools** — if you want low fees, just add a Polygon network to `hardhat.config.js`

## Development Stack Summary

| Layer | Technology | Why This Choice |
|-------|-----------|-----------------|
| **Frontend** | HTML + CSS + Bootstrap 5 + vanilla JS | No framework overhead; beginner-friendly |
| **Blockchain Interaction** | ethers.js v5 | Modern, lightweight, TypeScript-native, well-documented |
| **Wallet** | MetaMask | De facto standard; works everywhere |
| **Smart Contracts** | Solidity 0.8.20 | Industry standard for Ethereum; strong typing with overflow checks |
| **Dev Framework** | Hardhat v3 | Built-in local chain, testing, debugging, deployment |
| **Backend** | Node.js + Express | Lightweight, same language as frontend (JS) |
| **Database** | MongoDB (Mongoose) | Schema-flexible; stores JSON-like documents naturally |
| **Testing** | Chai + Hardhat test runner | Comes with Hardhat; write tests in JS alongside contracts |

---

# PART 3 — DOWNLOADS & DEPENDENCY LIST

## Required Software

| Software | Version | Purpose | Download Link |
|----------|---------|---------|--------------|
| **Node.js** | LTS (v20+) | JavaScript runtime for backend, Hardhat, and tooling | https://nodejs.org |
| **npm** | Included with Node.js | Package manager | Bundled |
| **Git** | Latest | Version control | https://git-scm.com |
| **VS Code** | Latest | Code editor | https://code.visualstudio.com |
| **MetaMask** | Browser extension | Ethereum wallet | https://metamask.io |
| **MongoDB** | v7+ | Off-chain database | https://www.mongodb.com/try/download/community |
| **Postman** | Latest | API testing | https://www.postman.com/downloads |

> **Optional:**
> - **Ganache** — GUI local blockchain (alternative to Hardhat node). Download: https://trufflesuite.com/ganache/
> - **Docker** — only needed if using Hyperledger Fabric. Download: https://docker.com

## npm Packages — Root Project (Blockchain)

Installed to the project root for Hardhat and smart contract development:

| Package | Purpose |
|---------|---------|
| `hardhat` | Ethereum development framework — compile, test, deploy |
| `@nomicfoundation/hardhat-toolbox` | All-in-one plugin: ethers.js integration, Chai matchers, gas reporter, coverage |

## npm Packages — Backend

Installed in the `backend/` directory:

| Package | Purpose |
|---------|---------|
| `express` | Web server framework — handles HTTP routes |
| `cors` | Cross-Origin Resource Sharing — allows frontend to call backend API |
| `mongoose` | MongoDB ODM — defines schemas and interacts with MongoDB |
| `dotenv` | Loads `.env` file into `process.env` — keeps secrets out of code |
| `body-parser` | Parses incoming JSON request bodies |

## npm Packages — Frontend

The frontend uses **CDN-loaded libraries** (no npm install needed):

| Library | CDN | Purpose |
|---------|-----|---------|
| `ethers.js` v5 | `https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.min.js` | Connect to Ethereum, call contracts |
| `Bootstrap 5` | `https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css` | Responsive UI styling |

---

# PART 4 — STEP-BY-STEP INSTALLATION

## Step 1: Clone / Navigate to Project

```bash
cd "c:\Users\Shrimay Dhankar\OneDrive - vit.ac.in\Desktop\Blockchain"
```

## Step 2: Install Root Dependencies (Hardhat)

```bash
npm install
```

This installs Hardhat and the toolbox from `package.json`. If starting fresh:

```bash
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

## Step 3: Compile All Smart Contracts

```bash
npx hardhat compile
```

**Expected output:**
```
Compiled 3 Solidity files successfully.
```

This generates ABI files in `artifacts/contracts/`:
- `artifacts/contracts/EGovernanceVoting.sol/EGovernanceVoting.json`
- `artifacts/contracts/LandRegistry.sol/LandRegistry.json`
- `artifacts/contracts/PublicFundTracking.sol/PublicFundTracking.json`

## Step 4: Start Local Blockchain

```bash
npm run dev-chain
```

This starts a Hardhat node at `http://127.0.0.1:8545` and prints 20 test accounts with private keys:

```
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

**⚠️ Keep this terminal running!** Open a new terminal for the next steps.

## Step 5: Deploy All Contracts

In a **new terminal**:

```bash
npm run deploy-local
```

**Expected output:**
```
Deploying contracts with account: 0xf39F...2266
Account balance: 10000.0 ETH
EGovernanceVoting deployed to: 0x5FbD...1234
LandRegistry      deployed to: 0xe7f1...5678
PublicFundTracking deployed to: 0x9fE4...9abc

──────────────────────────────────────────
All contracts deployed successfully!
Update the CONTRACT_ADDRESS constants in your frontend JS files.
──────────────────────────────────────────
```

## Step 6: Update Frontend Contract Addresses

Copy the deployed addresses and paste them into the frontend JS files:

**`frontend/main.js`** (line 5):
```js
const CONTRACT_ADDRESS = "0x5FbD...1234"; // Your EGovernanceVoting address
```

**`frontend/land.js`** (line 4):
```js
const LAND_CONTRACT_ADDRESS = "0xe7f1...5678"; // Your LandRegistry address
```

**`frontend/funds.js`** (line 4):
```js
const FUND_CONTRACT_ADDRESS = "0x9fE4...9abc"; // Your PublicFundTracking address
```

## Step 7: Connect MetaMask to Hardhat Network

1. Open MetaMask browser extension
2. Click the network dropdown → **Add network** → **Add a network manually**
3. Fill in:
   - **Network name:** `Hardhat Localhost`
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency symbol:** `ETH`
4. Click **Save**
5. Click your account icon → **Import account**
6. Paste the **private key** of Account #0 (from Step 4 output)
7. Use Account #0 as the **admin** (it deployed the contracts)

## Step 8: Open the Web Portal

Use VS Code Live Server or:

```bash
npx serve frontend
```

Then visit `http://localhost:3000` (or whichever port is shown).

**Pages:**
- `http://localhost:3000/index.html` — Voting
- `http://localhost:3000/land.html` — Land Registry
- `http://localhost:3000/funds.html` — Fund Tracking

## Step 9: Install Backend Dependencies (Optional)

```bash
cd backend
npm install
```

Copy `.env.example` to `.env` and update values:

```bash
copy .env.example .env
```

Start the backend:

```bash
npm run dev
```

**Requires MongoDB running locally** on port 27017, or update `MONGO_URI` in `.env` to a MongoDB Atlas connection string.

---

# PART 5 — SMART CONTRACT DESIGN

## 5.1 — Voting Contract (`EGovernanceVoting.sol`)

### Key Solidity Concepts Used

| Concept | Where Used | Explanation |
|---------|-----------|-------------|
| `struct` | `Election` | Groups related data (name, candidates, times) into one unit |
| `mapping` | `elections`, `votes`, `hasVoted` | Key-value storage on the blockchain |
| `events` | `ElectionCreated`, `VoteCast` | Emit logs that frontends and indexers can listen for |
| `modifiers` | `onlyAdmin`, `electionExists`, `duringElection` | Reusable access/validation checks |
| `require()` | Throughout | Reverts the transaction if a condition is false |
| `onlyAdmin` pattern | `modifier onlyAdmin()` | Restricts functions to the contract deployer |

### Contract Code Walkthrough

```solidity
// SPDX-License-Identifier: MIT          ← Open-source license identifier
pragma solidity ^0.8.20;                  ← Compiler version (0.8.x has overflow checks)

contract EGovernanceVoting {
    address public admin;                 ← Stores the deployer's address
    uint256 public electionCount;         ← Auto-incrementing election counter

    struct Election {                     ← Custom data type grouping election fields
        uint256 id;
        string name;
        string description;
        string[] candidates;              ← Dynamic array of candidate names
        uint256 startTime;                ← Unix timestamps for time-bound voting
        uint256 endTime;
        bool exists;
        bool finalized;
        uint256 totalVotes;
    }

    mapping(uint256 => Election) private elections;
    // ↑ Like a dictionary: electionId → Election data

    mapping(uint256 => mapping(uint256 => uint256)) public votes;
    // ↑ votes[electionId][candidateIndex] = number of votes

    mapping(uint256 => mapping(address => bool)) public hasVoted;
    // ↑ hasVoted[electionId][voterAddress] = true/false
    // ↑ This prevents double voting!

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        // ↑ msg.sender is the address calling the function
        // ↑ If not admin, the entire transaction is reverted
        _;  // ← Placeholder for the function body
    }

    modifier duringElection(uint256 _electionId) {
        Election memory e = elections[_electionId];
        require(block.timestamp >= e.startTime, "Election not started");
        require(block.timestamp <= e.endTime, "Election ended");
        // ↑ block.timestamp is the current block's Unix time
        _;
    }

    constructor() {
        admin = msg.sender;   // ← Whoever deploys the contract becomes admin
    }
}
```

### Key Functions

**`createElection()`** — Admin creates a new election with candidates and time bounds:
```solidity
function createElection(
    string memory _name,
    string memory _description,
    string[] memory _candidates,
    uint256 _startTime,
    uint256 _endTime
) external onlyAdmin {
    require(_candidates.length >= 2, "At least 2 candidates");
    require(_endTime > _startTime, "Invalid time range");
    // Storage allocation and data writing...
    emit ElectionCreated(electionCount, _name, _startTime, _endTime);
}
```

**`vote()`** — Any wallet can vote once per election during the voting window:
```solidity
function vote(uint256 _electionId, uint256 _candidateIndex)
    external
    electionExists(_electionId)
    duringElection(_electionId)
{
    require(!hasVoted[_electionId][msg.sender], "Already voted");
    // ↑ KEY LINE: prevents double voting
    require(_candidateIndex < e.candidates.length, "Invalid candidate");

    hasVoted[_electionId][msg.sender] = true;   // Mark as voted
    votes[_electionId][_candidateIndex] += 1;   // Increment vote count
    e.totalVotes += 1;

    emit VoteCast(_electionId, msg.sender, _candidateIndex);
}
```

## 5.2 — Land Registry Contract (`LandRegistry.sol`)

### How It Works

1. **Admin registers** a land parcel: sets owner, location, area, document hash
2. **Admin verifies** the parcel after offline checks
3. **Owner requests** a transfer to a new owner
4. **Admin approves** the transfer (simulates government verification)

```solidity
struct LandParcel {
    uint256 id;
    address owner;          // Current owner's wallet
    string location;        // "Survey #45, Mumbai"
    uint256 area;           // Square meters
    string documentHash;    // IPFS CID or SHA-256 of documents
    bool isVerified;        // Has admin verified this?
    uint256 registeredAt;   // When it was first registered
}
```

**Why the two-step transfer?**
- Owner calls `requestTransfer(parcelId, newOwnerAddress)` → creates a pending request
- Admin calls `approveTransfer(parcelId)` → actually changes ownership
- This prevents unauthorized transfers — even if a private key is compromised, the admin must approve

## 5.3 — Public Fund Tracking Contract (`PublicFundTracking.sol`)

### How It Works

1. **Admin creates a scheme** (e.g., "Road Construction") with a budget
2. **Admin releases funds** in tranches — each release is recorded on-chain
3. **Admin marks milestones** (e.g., "Foundation laid", "Pillars erected")
4. **Citizens query** the scheme to see exactly how much was spent and on what

```solidity
struct Scheme {
    uint256 id;
    string name;              // "NH-48 Road Widening"
    string description;
    address beneficiary;      // Contractor / department address
    uint256 allocated;        // Total budget in wei
    uint256 spent;            // Amount released so far
    bool isActive;
    uint256 createdAt;
    uint256 milestoneCount;
}

struct FundRelease {
    uint256 amount;           // Amount released
    string purpose;           // "Cement purchase"
    uint256 timestamp;        // When the fund was released
}
```

**Anti-corruption feature:**
```solidity
require(s.spent + _amount <= s.allocated, "Exceeds allocated budget");
// ↑ Prevents releasing more money than the allocated budget
// ↑ Enforced by code — cannot be bypassed by any human
```

---

# PART 6 — DATABASE STRUCTURE (Off-Chain Data)

## What Goes On-Chain vs Off-Chain?

| Data | On-Chain (Smart Contract) | Off-Chain (MongoDB) |
|------|---------------------------|---------------------|
| **Votes** | ✅ Vote counts, hasVoted mapping | ❌ Not stored |
| **Election metadata** | ✅ Name, candidates, times | ❌ Not stored |
| **Land ownership** | ✅ Owner address, location, docHash | Additional: GPS, photos, valuation |
| **Fund releases** | ✅ Amount, purpose, timestamp | ❌ Not stored (on-chain is sufficient) |
| **User profiles** | ❌ Not stored | ✅ Name, email, role, KYC status |
| **Transaction hashes** | ✅ (inherently on chain) | ✅ Indexed for easy searching |

**Rule of thumb:** Put critical, trust-sensitive data on-chain. Put convenience/display data off-chain.

## MongoDB Schemas

### User Schema (`backend/models/User.js`)

```javascript
{
  walletAddress: "0xabc...123",    // Links to on-chain identity
  name: "Shrimay Dhankar",
  email: "shrimay@example.com",
  role: "citizen",                  // citizen | admin | land_officer | fund_manager
  identityHash: "sha256(...)",     // Hash of Aadhaar/ID (privacy-preserving)
  isVerified: false,
  createdAt: "2026-02-26T...",
  updatedAt: "2026-02-26T..."
}
```

### Transaction Log Schema (`backend/models/TransactionLog.js`)

```javascript
{
  txHash: "0xdef...456",
  module: "voting",                 // voting | land | funds | identity
  fromAddress: "0xabc...123",
  description: "Voted for candidate Alice in Election #1",
  blockNumber: 42,
  status: "confirmed",             // pending | confirmed | failed
  createdAt: "2026-02-26T..."
}
```

### Land Record Schema (`backend/models/LandRecord.js`)

```javascript
{
  parcelId: 1,                     // Links to on-chain parcel ID
  fullAddress: "Plot 45, Sector 12, Gurgaon, Haryana 122001",
  latitude: 28.4595,
  longitude: 77.0266,
  propertyType: "residential",     // residential | commercial | agricultural | industrial
  estimatedValue: 15000000,        // Market value in INR
  photoUrls: ["ipfs://Qm..."],
  officerNotes: "Verified via physical inspection on 2026-01-15"
}
```

---

# PART 7 — FRONTEND IMPLEMENTATION

## 7.1 — Connecting MetaMask

```javascript
// Check if MetaMask is installed
if (!window.ethereum) {
  alert("Please install MetaMask!");
  return;
}

// Create a provider (connection to the blockchain)
const provider = new ethers.providers.Web3Provider(window.ethereum);

// Request wallet connection (MetaMask popup)
await provider.send("eth_requestAccounts", []);

// Get the signer (user's wallet account)
const signer = provider.getSigner();
const address = await signer.getAddress();
console.log("Connected:", address);
```

**What's happening:**
1. `window.ethereum` is injected by MetaMask into every web page
2. `Web3Provider` wraps it for ethers.js
3. `eth_requestAccounts` triggers the MetaMask approval popup
4. `getSigner()` gives you an object that can sign transactions

## 7.2 — Calling a Smart Contract

```javascript
// Create a contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

// Read data (free, no gas needed — it's a "view" function)
const electionCount = await contract.electionCount();
const [name, desc, candidates, start, end, finalized, totalVotes]
    = await contract.getElection(1);

// Write data (costs gas — MetaMask will prompt the user)
const tx = await contract.vote(1, 0);  // Vote for candidate 0 in election 1
await tx.wait();                        // Wait for block confirmation
console.log("Vote confirmed! Tx hash:", tx.hash);
```

## 7.3 — Listening to Smart Contract Events

```javascript
// Listen for new votes in real-time
contract.on("VoteCast", (electionId, voter, candidateIndex) => {
  console.log(`Vote cast! Election: ${electionId}, Voter: ${voter}`);
  // Refresh the UI
  loadElections();
});
```

## 7.4 — Displaying Transaction Hash

After any write transaction, show the user the transaction hash as proof:

```javascript
const tx = await contract.createElection(name, desc, candidates, start, end);
document.getElementById("status").textContent =
  `Transaction sent! Hash: ${tx.hash}`;

await tx.wait();  // Wait for mining
document.getElementById("status").textContent =
  `Confirmed in block ${tx.blockNumber}!`;
```

---

# PART 8 — SECURITY IMPLEMENTATION

## 8.1 — Cryptographic Hashing

Every block on the blockchain contains a **SHA-256 hash** of its data. If even one bit changes, the hash changes completely. This makes tampering detectable.

In our contracts, we store `documentHash` (IPFS CID or SHA-256) for land records:
```solidity
string documentHash;  // e.g., "QmX7vV3y9kNz..." (IPFS CID is a hash)
```

To verify a document hasn't been tampered with:
1. Hash the original document → get `hash_A`
2. Compare with the hash stored on-chain → `hash_B`
3. If `hash_A == hash_B`, the document is authentic

## 8.2 — Digital Signatures

Every transaction is **signed** by the sender's private key via MetaMask. This ensures:
- **Authentication:** Only the private key owner can send transactions from their address
- **Non-repudiation:** The signature proves the sender authorized the action
- **Integrity:** Any modification to the transaction data invalidates the signature

## 8.3 — Wallet Authentication

Instead of username/password, users authenticate with their **wallet address**:
1. User clicks "Connect MetaMask"
2. MetaMask prompts for approval
3. The app receives the user's Ethereum address
4. All subsequent actions are tied to that address

This is called **wallet-based authentication** — no passwords to leak!

## 8.4 — Role-Based Access Control (RBAC)

```solidity
modifier onlyAdmin() {
    require(msg.sender == admin, "Only admin");
    _;
}
```

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| **Admin** | Create elections, register land, release funds, verify, approve transfers | Vote in their own elections (they can, but shouldn't) |
| **Citizen** | Vote, view results, view land records, view fund usage | Create elections, register land, release funds |
| **Land Owner** | Request transfer of own parcels | Transfer others' parcels, register new land |

## 8.5 — Prevention of Double Voting

```solidity
mapping(uint256 => mapping(address => bool)) public hasVoted;

function vote(...) {
    require(!hasVoted[_electionId][msg.sender], "Already voted");
    hasVoted[_electionId][msg.sender] = true;  // Mark before processing
    // ... rest of the function
}
```

This is **enforced at the smart contract level** — even if someone modifies the frontend, the contract will reject the duplicate vote.

## 8.6 — Preventing Unauthorized Land Transfer

Two-step transfer process:
1. **Owner** calls `requestTransfer()` → sets `pendingTransfers[parcelId] = newOwner`
2. **Admin** calls `approveTransfer()` → actually changes `parcels[parcelId].owner`

Even if an attacker steals an owner's private key:
- They can initiate a transfer request
- But the admin must approve it offline (after verifying identity documents)
- The admin can simply NOT approve suspicious requests

---

# PART 9 — ADVANCED FEATURES (FINAL YEAR LEVEL)

## 9.1 — Biometric Authentication Integration

**Concept:** Add fingerprint/face recognition before blockchain transactions.

**How it works:**
1. **Client-side:** Use the Web Authentication API (`navigator.credentials.create()`)
2. After biometric verification, the app unlocks MetaMask signing
3. **Important:** Biometrics are processed locally on the device — never sent to the blockchain
4. The blockchain only sees the wallet address and signed transaction

**Implementation sketch:**
```javascript
// Using WebAuthn (FIDO2)
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: new Uint8Array([/* random bytes from server */]),
    rp: { name: "E-Governance System" },
    user: {
      id: new Uint8Array([/* user id */]),
      name: "citizen@gov.in",
      displayName: "Citizen",
    },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    authenticatorSelection: {
      authenticatorAttachment: "platform",  // Built-in biometric
      userVerification: "required",
    },
  },
});
// After biometric success → proceed with MetaMask transaction
```

## 9.2 — Zero-Knowledge Proofs (ZKP)

**Concept:** Prove something is true without revealing the underlying data.

**Use case in E-Governance:**
- "Prove you are over 18" without revealing your date of birth
- "Prove you are a resident of Maharashtra" without revealing your full address

**Tools:**
- **Circom** — language for writing ZK circuits
- **SnarkJS** — JavaScript library for generating and verifying proofs
- **zk-SNARK** — the cryptographic primitive used

**Simplified explanation for viva:**
```
Traditional way:    "Show me your Aadhaar card"  →  Reveals: name, DOB, address, photo
ZKP way:            "Prove age ≥ 18"             →  Reveals: true/false (nothing else)
```

## 9.3 — IPFS for Document Storage

**Problem:** Storing large files (PDFs, images) directly on the blockchain is extremely expensive.

**Solution:** Store files on IPFS (InterPlanetary File System) and save only the hash on-chain.

```
Document.pdf → Upload to IPFS → CID: QmX7vV3y9kNz... (content-addressed hash)
               → Store CID in smart contract: documentHash = "QmX7vV3y9kNz..."
```

**Properties:**
- **Content-addressed:** The hash IS the address. If the file changes, the hash changes.
- **Decentralized:** No single point of failure
- **Tamper-proof:** Hash on-chain verifies the file hasn't been modified

**Tools:** Pinata (pinata.cloud), Infura IPFS, web3.storage

## 9.4 — DAO Governance Model

**Concept:** A Decentralized Autonomous Organization where voting outcomes automatically trigger on-chain actions.

**Extension of our voting contract:**
```solidity
struct Proposal {
    string description;
    address targetContract;
    bytes callData;        // Encoded function call to execute if approved
    uint256 votesFor;
    uint256 votesAgainst;
    bool executed;
}

function executeProposal(uint256 proposalId) external {
    Proposal storage p = proposals[proposalId];
    require(p.votesFor > p.votesAgainst, "Proposal not approved");
    require(!p.executed, "Already executed");

    p.executed = true;
    (bool success, ) = p.targetContract.call(p.callData);
    require(success, "Execution failed");
}
```

**Use case:** University governance where proposals for budget allocation are voted on and executed automatically.

---

# PART 10 — DEPLOYMENT GUIDE

## 10.1 — Deploying Smart Contracts to Testnet

### Option A: Sepolia (Ethereum Testnet)

1. **Get free testnet ETH:** https://sepoliafaucet.com or https://www.alchemy.com/faucets/ethereum-sepolia
2. **Get an RPC URL:** Sign up at https://alchemy.com and create a Sepolia app
3. **Update `hardhat.config.js`:**

```javascript
import "@nomicfoundation/hardhat-toolbox";

const config = {
  solidity: "0.8.20",
  networks: {
    hardhat: {},
    localhost: { url: "http://127.0.0.1:8545" },
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY",
      accounts: ["YOUR_PRIVATE_KEY_HERE"]  // ⚠️ Never commit this!
    }
  }
};

export default config;
```

4. **Deploy:**
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Option B: Polygon Mumbai Testnet

Same process, different network config:
```javascript
polygon: {
  url: "https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY",
  accounts: ["YOUR_PRIVATE_KEY"]
}
```

### Using Environment Variables (`.env`)

**⚠️ Never hardcode private keys!**

Create a `.env` file in the project root:
```
ALCHEMY_URL=https://eth-sepolia.g.alchemy.com/v2/your_key
DEPLOYER_PRIVATE_KEY=0xac0974bec...
```

Update `hardhat.config.js`:
```javascript
import "dotenv/config";

const config = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.ALCHEMY_URL,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY]
    }
  }
};
```

Install dotenv: `npm install dotenv`

Add `.env` to `.gitignore`!

## 10.2 — Deploying Backend

### Option A: Railway (Easiest)

1. Push your code to GitHub
2. Go to https://railway.app → **New Project** → **Deploy from GitHub repo**
3. Set the **root directory** to `backend/`
4. Add environment variables in Railway dashboard (copy from `.env.example`)
5. Railway provides a public URL for your API

### Option B: Render

1. Go to https://render.com → **New Web Service**
2. Connect your GitHub repo
3. Set **Build Command:** `cd backend && npm install`
4. Set **Start Command:** `cd backend && node server.js`
5. Add environment variables in Render dashboard

### Option C: AWS (Advanced)

1. Use **AWS EC2** for the server or **AWS Elastic Beanstalk** for managed deployment
2. Use **AWS DocumentDB** (MongoDB-compatible) for the database
3. Set up security groups, load balancers, etc.

## 10.3 — Deploying Frontend

### Option A: Vercel (Recommended)

1. Push to GitHub
2. Go to https://vercel.com → **Import Project** → select your repo
3. Set **Root Directory** to `frontend/`
4. **Framework Preset:** None (it's static HTML)
5. Deploy → get a URL like `https://egovernance.vercel.app`

### Option B: Netlify

1. Go to https://netlify.com → **Add new site** → **Import from Git**
2. Set **Publish directory** to `frontend/`
3. Deploy

### Option C: GitHub Pages (Free)

1. Push the `frontend/` directory contents to a `gh-pages` branch
2. Enable GitHub Pages in repo settings
3. Access at `https://username.github.io/repo-name/`

---

# PART 11 — TESTING STRATEGY

## 11.1 — Smart Contract Unit Tests (Hardhat)

All test files are in the `test/` directory:

```bash
# Run all tests
npx hardhat test

# Run a specific test file
npx hardhat test test/EGovernanceVoting.test.js

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

### Test Coverage Summary

| Contract | Tests | What's Tested |
|----------|-------|---------------|
| `EGovernanceVoting` | 9 tests | Election creation, voting, double-vote prevention, results, finalization, access control |
| `LandRegistry` | 10 tests | Registration, verification, transfer request, transfer approval, access control, view functions |
| `PublicFundTracking` | 10 tests | Scheme creation, fund release, budget enforcement, milestones, deactivation, access control |

### Example Test Explained

```javascript
it("should prevent double voting", async function () {
  // Arrange: create an election and vote once
  await contract.connect(voter1).vote(1, 0);

  // Act & Assert: try to vote again — should revert
  await expect(
    contract.connect(voter1).vote(1, 1)
  ).to.be.revertedWith("Already voted");
  // ↑ Chai matcher from @nomicfoundation/hardhat-toolbox
  // ↑ Expects the transaction to revert with this specific error message
});
```

## 11.2 — Backend API Testing

Use **Postman** or **curl**:

```bash
# Register a user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","name":"Admin User"}'

# Get user profile
curl http://localhost:5000/api/auth/profile/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Log a transaction
curl -X POST http://localhost:5000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{"txHash":"0xabc123...","module":"voting","fromAddress":"0xf39F...","description":"Voted for Alice"}'

# List transactions
curl http://localhost:5000/api/transactions?module=voting

# Health check
curl http://localhost:5000/api/health
```

## 11.3 — Frontend Testing

Manual testing checklist:

| # | Test Case | Expected Result |
|---|-----------|-----------------|
| 1 | Open page without MetaMask | Shows "MetaMask not detected" |
| 2 | Click "Connect MetaMask" | MetaMask popup appears; address shown on page |
| 3 | Create election (admin account) | Transaction confirmed; election appears in list |
| 4 | Vote (citizen account) | Transaction confirmed; vote count increments |
| 5 | Vote again (same account) | MetaMask shows error; "Already voted" |
| 6 | Create election (non-admin) | MetaMask shows error; "Only admin" |
| 7 | Register land (admin) | Parcel appears in list with "Unverified" badge |
| 8 | Verify land (admin) | Badge changes to "Verified" |
| 9 | Request transfer (owner) | "Pending transfer" indicator appears |
| 10 | Approve transfer (admin) | Owner address changes on the parcel |
| 11 | Create scheme (admin) | Scheme appears with progress bar at 0% |
| 12 | Release funds | Progress bar updates; release appears in audit trail |

## 11.4 — Security Testing

| Test | How to Test | Expected |
|------|-------------|----------|
| Double voting | Vote twice with same wallet | Second transaction reverts |
| Unauthorized election creation | Call `createElection` from non-admin | Transaction reverts with "Only admin" |
| Budget overflow | Release more funds than allocated | Transaction reverts with "Exceeds allocated budget" |
| Unauthorized land transfer | Call `approveTransfer` from non-admin | Transaction reverts |
| Transfer unverified parcel | Call `requestTransfer` on unverified parcel | Transaction reverts |

## 11.5 — Gas Optimization

```bash
REPORT_GAS=true npx hardhat test
```

This prints a gas usage table for every function call in your tests. Example output:

```
·─────────────────────|──────────────|──────────────·
│ Contract            │ Method       │ Avg Gas Cost │
·─────────────────────|──────────────|──────────────·
│ EGovernanceVoting   │ createElec.  │    245,832   │
│ EGovernanceVoting   │ vote         │     72,451   │
│ LandRegistry        │ registerLand │    185,220   │
│ PublicFundTracking  │ releaseFunds │     98,340   │
·─────────────────────|──────────────|──────────────·
```

**Tips to reduce gas:**
1. Use `uint256` instead of `uint8` — EVM operates on 256-bit words natively
2. Pack struct variables together when possible
3. Use `memory` for function parameters that don't need storage
4. Minimize on-chain string storage — use hashes instead

---

## Quick Reference — All Commands

```bash
# ── Install ────────────────────────────────
npm install                                    # Root: Hardhat dependencies
cd backend && npm install                      # Backend: Express + MongoDB

# ── Compile ────────────────────────────────
npx hardhat compile                            # Compile all contracts

# ── Local Blockchain ──────────────────────
npm run dev-chain                              # Start Hardhat node

# ── Deploy ─────────────────────────────────
npm run deploy-local                           # Deploy to localhost
npx hardhat run scripts/deploy.js --network sepolia   # Deploy to Sepolia

# ── Test ───────────────────────────────────
npx hardhat test                               # Run all tests
REPORT_GAS=true npx hardhat test               # Tests + gas report

# ── Frontend ──────────────────────────────
npx serve frontend                             # Serve frontend locally

# ── Backend ───────────────────────────────
cd backend && npm run dev                      # Start Express server
```

---

## Viva Talking Points

- **Why Blockchain for E-Governance?** — Eliminates single point of failure; builds citizen trust through transparency; all records are immutable and publicly verifiable.

- **Why Ethereum over Hyperledger?** — Public, well-documented, free testnets, MetaMask for easy demo. Hyperledger is better for real government use (permissioned), but complex to set up for a college project.

- **On-chain vs Off-chain?** — Critical data (votes, ownership, funds) on-chain for trust. Supplementary data (names, photos, GPS) off-chain for cost efficiency.

- **Security highlights:** One-person-one-vote enforced by mapping + require; two-step land transfer; budget cap enforcement; cryptographic signatures via MetaMask.

- **Limitations:** Gas costs on mainnet; UX challenges for non-technical users; need for offline KYC verification; scalability concerns.

---

> **This project is ready to demo.** Follow Parts 4-8 to set up, deploy, and run the complete system with all three modules (Voting, Land Registry, Fund Tracking) on your local machine with MetaMask.
#   E - G o v e r n a n c e - S y s t e m - u s i n g - B l o c k c h a i n  
 