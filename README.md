<div align="center">

# ⚖️ Solemn

### Promises with Weight

**Stake SOL behind your goals. Keep them, earn an Achievement NFT. Break them, support charity.**

An on-chain commitment platform built on Solana that turns promises into stakes against yourself.

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana&logoColor=white)](https://solana.com)
[![Anchor](https://img.shields.io/badge/Anchor-1.0.2-blue)](https://www.anchor-lang.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

[🌐 Live Demo](#) · [🎥 Demo Video](https://drive.google.com/file/d/1cufjPGtW2aUnG5K0_FbtfvskKNb77Gbb/view?usp=sharing) · [📊 Pitch Deck](#)

---

🇮🇩 [Bahasa Indonesia](#-bahasa-indonesia) · 🇬🇧 [English](#-english)

</div>

---

## 🇮🇩 Bahasa Indonesia

### 📖 Tentang Solemn

**Solemn** adalah platform komitmen on-chain di Solana yang mengubah janji menjadi taruhan dengan diri sendiri. Pengguna stake SOL untuk komitmen pribadi seperti target belajar, kebiasaan sehat, atau deadline proyek, lalu menunjuk seorang accountability partner sebagai saksi.

**Mekanisme:**
- ✅ **Berhasil** → Stake kembali ke pengguna + Achievement NFT sebagai bukti komitmen
- ❌ **Gagal** → Stake otomatis dikirim ke charity
- ⏰ **Lewat deadline** → Default ke charity setelah deadline terlewati

Solemn memanfaatkan biaya transaksi rendah dan kecepatan Solana untuk mengubah niat menjadi aksi nyata dengan *skin in the game*, on-chain.

### ✨ Fitur Utama

- 📝 **Buat Promise** — Stake SOL, set deadline (menit/jam/hari), tunjuk judge
- 👨‍⚖️ **Judge Dashboard** — Approve atau reject promise yang ditugaskan kepada kamu
- ⏰ **Real-time Countdown** — Timer hitung mundur otomatis untuk setiap promise active
- 🏆 **Achievement NFT** — Otomatis di-mint pas judge approve, dengan tier visual (Bronze/Silver/Gold/Diamond)
- 🌐 **Multi-wallet** — Support Phantom dan Solflare
- 🔍 **On-chain Transparency** — Semua promise dan achievement verifiable di Solana Explorer

### 🛠️ Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| **Smart Contract** | Anchor 1.0.2 (Rust) |
| **Frontend** | Next.js 16 (App Router) + TypeScript |
| **Styling** | Tailwind CSS |
| **Wallet** | Solana Wallet Adapter |
| **NFT** | Metaplex Token Metadata (Umi SDK) |
| **Testing** | LiteSVM (Rust integration tests) |
| **Network** | Solana Devnet |

### 📋 Prerequisites

Pastikan sistem kamu sudah terinstall:

- **Node.js** 20+ ([download](https://nodejs.org))
- **Rust** 1.75+ ([install](https://rustup.rs))
- **Solana CLI** 1.18+ ([install guide](https://docs.solana.com/cli/install-solana-cli-tools))
- **Anchor** 1.0+ ([install via AVM](https://www.anchor-lang.com/docs/installation))
- **Phantom Wallet** ([browser extension](https://phantom.app))
- **Git**

### 🚀 Instalasi & Setup

#### 1. Clone Repository

```bash
git clone https://github.com/diyon12/solemn.git
cd solemn
```

#### 2. Setup Solana CLI ke Devnet

```bash
# Switch ke devnet
solana config set --url devnet

# Buat wallet baru (kalau belum ada)
solana-keygen new

# Cek address
solana address

# Airdrop SOL untuk deploy + testing
solana airdrop 2
```

#### 3. Build & Deploy Smart Contract

```bash
# Build program
anchor build

# Sync program ID
anchor keys sync

# Build ulang setelah sync
anchor build

# Deploy ke devnet
anchor deploy
```

Setelah deploy, catat **Program ID** yang muncul.

#### 4. Run Tests (Optional)

```bash
cargo test
```

Yang diharapkan: **9 tests passed** (7 dari test_solemn + 1 test_initialize + 1 unit test).

#### 5. Setup Frontend

```bash
cd app

# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
```

Edit `.env.local` kalau perlu (default sudah ke devnet & program ID yang sudah deploy):

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=<paste_program_id_kamu>
```

#### 6. Copy IDL ke Frontend

```bash
# Dari root project
mkdir -p app/idl
cp target/idl/solemn.json app/idl/
cp target/types/solemn.ts app/idl/
```

#### 7. Run Development Server

```bash
cd app
npm run dev
```

Buka **http://localhost:3000** di browser.

### 🎮 Cara Menggunakan

#### Untuk Promiser (Yang Berjanji)

1. **Connect Wallet** — Klik "Select Wallet" di kanan atas, pilih Phantom
2. **Pastikan Phantom di Devnet** — Settings → Developer Settings → Network → Devnet
3. **Klik "Make a Promise"** di home page
4. **Isi form:**
   - Deskripsi janji (max 280 karakter)
   - Stake amount (min 0.001 SOL)
   - Deadline (pilih unit: minutes/hours/days)
   - Judge wallet address (orang yang akan verify)
   - Charity wallet address (tujuan dana kalau gagal)
5. **Klik "Stake & Commit"** → Approve di Phantom
6. **Lakukan tugasnya** di dunia nyata
7. **Kasih tahu Judge** kalau sudah selesai (via WhatsApp, dll)

#### Untuk Judge (Verifikator)

1. **Connect wallet** yang ditunjuk sebagai judge
2. **Buka "Judge Dashboard"** dari home page
3. **Verify bukti** dari promiser (di luar aplikasi)
4. **Klik Approve** kalau berhasil → Stake balik + NFT minted otomatis
5. **Klik Reject** kalau gagal → Stake ke charity

#### Untuk Lihat Achievements

1. **Klik "My Achievements"** dari home page
2. NFT yang sudah di-mint akan muncul dengan gambar SVG
3. NFT juga muncul di **Phantom Wallet → Collectibles**

### 🏆 Achievement NFT Tiers

NFT achievement dihasilkan dengan tier berdasarkan jumlah stake:

| Tier | Stake | Warna |
|------|-------|-------|
| 🥉 **Bronze** | < 0.1 SOL | Tembaga |
| 🥈 **Silver** | 0.1 - 0.5 SOL | Perak |
| 🥇 **Gold** | 0.5 - 1 SOL | Emas |
| 💎 **Diamond** | ≥ 1 SOL | Berlian |

### 📁 Struktur Project

```
solemn/
├── programs/solemn/          # Smart contract Anchor
│   ├── src/
│   │   ├── lib.rs            # Entry point, register instructions
│   │   ├── state.rs          # Account struct (Promise)
│   │   ├── error.rs          # Custom errors
│   │   ├── constants.rs      # PDA seeds & limits
│   │   └── instructions/     # 4 instructions
│   │       ├── create_promise.rs
│   │       ├── approve_promise.rs
│   │       ├── reject_promise.rs
│   │       └── claim_timeout.rs
│   └── tests/                # LiteSVM integration tests
├── app/                      # Frontend Next.js
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   ├── create/           # Halaman create promise
│   │   ├── my-promises/      # Halaman daftar promises
│   │   ├── judge/            # Halaman judge dashboard
│   │   ├── achievements/     # Halaman NFT achievements
│   │   ├── components/       # Reusable components
│   │   └── lib/              # Anchor client & NFT helpers
│   └── idl/                  # IDL untuk Anchor client
├── tests/                    # Tests TypeScript (optional)
└── Anchor.toml               # Anchor config
```

### 🔧 Troubleshooting

#### Anchor build error: "platform-tools missing"
```bash
solana-install update
cargo build-sbf --manifest-path programs/solemn/Cargo.toml
```

#### Faucet rate-limited
Pakai CLI airdrop:
```bash
solana airdrop 2 <ADDRESS> --url devnet
```

Atau alternatif faucet: [Helius](https://faucet.helius.dev) atau [QuickNode](https://faucet.quicknode.com/solana/devnet).

#### Frontend error "Hydration mismatch"
Stop dev server (`Ctrl+C`), lalu run ulang `npm run dev`.

#### NFT tidak muncul di Phantom
- Tunggu 30 detik untuk sync
- Buka Phantom → Collectibles tab
- Refresh extension Phantom (klik di luar Phantom → klik lagi)

### 📜 Lisensi

MIT License — bebas digunakan untuk apapun.


## 🇬🇧 English

### 📖 About Solemn

**Solemn** is an on-chain commitment platform on Solana that turns promises into stakes against yourself. Users stake SOL behind personal commitments — study goals, healthy habits, project deadlines — and assign an accountability partner as witness.

**Mechanism:**
- ✅ **Succeed** → Stake returns to user + Achievement NFT minted as proof of commitment
- ❌ **Fail** → Stake automatically forfeited to charity
- ⏰ **Timeout** → Defaults to charity after deadline passes

Solemn leverages Solana's low fees and instant settlement to transform intentions into real action with skin in the game, on-chain.

### ✨ Key Features

- 📝 **Create Promise** — Stake SOL, set deadline (minutes/hours/days), assign judge
- 👨‍⚖️ **Judge Dashboard** — Approve or reject promises assigned to you
- ⏰ **Real-time Countdown** — Automatic countdown timer for each active promise
- 🏆 **Achievement NFT** — Auto-minted when judge approves, with tier-based visuals (Bronze/Silver/Gold/Diamond)
- 🌐 **Multi-wallet Support** — Phantom and Solflare
- 🔍 **On-chain Transparency** — All promises and achievements verifiable on Solana Explorer

### 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Smart Contract** | Anchor 1.0.2 (Rust) |
| **Frontend** | Next.js 16 (App Router) + TypeScript |
| **Styling** | Tailwind CSS |
| **Wallet** | Solana Wallet Adapter |
| **NFT** | Metaplex Token Metadata (Umi SDK) |
| **Testing** | LiteSVM (Rust integration tests) |
| **Network** | Solana Devnet |

### 📋 Prerequisites

Make sure your system has:

- **Node.js** 20+ ([download](https://nodejs.org))
- **Rust** 1.75+ ([install](https://rustup.rs))
- **Solana CLI** 1.18+ ([install guide](https://docs.solana.com/cli/install-solana-cli-tools))
- **Anchor** 1.0+ ([install via AVM](https://www.anchor-lang.com/docs/installation))
- **Phantom Wallet** ([browser extension](https://phantom.app))
- **Git**

### 🚀 Installation & Setup

#### 1. Clone Repository

```bash
git clone https://github.com/diyon12/solemn.git
cd solemn
```

#### 2. Configure Solana CLI for Devnet

```bash
# Switch to devnet
solana config set --url devnet

# Create new wallet (if you don't have one)
solana-keygen new

# Check your address
solana address

# Airdrop SOL for deployment + testing
solana airdrop 2
```

#### 3. Build & Deploy Smart Contract

```bash
# Build program
anchor build

# Sync program ID
anchor keys sync

# Rebuild after sync
anchor build

# Deploy to devnet
anchor deploy
```

After deployment, note the **Program ID** that appears.

#### 4. Run Tests (Optional)

```bash
cargo test
```

Expected: **9 tests passed** (7 from test_solemn + 1 test_initialize + 1 unit test).

#### 5. Setup Frontend

```bash
cd app

# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
```

Edit `.env.local` if needed (defaults to devnet & deployed program ID):

```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=<paste_your_program_id>
```

#### 6. Copy IDL to Frontend

```bash
# From project root
mkdir -p app/idl
cp target/idl/solemn.json app/idl/
cp target/types/solemn.ts app/idl/
```

#### 7. Run Development Server

```bash
cd app
npm run dev
```

Open **http://localhost:3000** in your browser.

### 🎮 How to Use

#### As a Promiser

1. **Connect Wallet** — Click "Select Wallet" top-right, choose Phantom
2. **Switch Phantom to Devnet** — Settings → Developer Settings → Network → Devnet
3. **Click "Make a Promise"** on home page
4. **Fill the form:**
   - Promise description (max 280 chars)
   - Stake amount (min 0.001 SOL)
   - Deadline (pick unit: minutes/hours/days)
   - Judge wallet address (verifier)
   - Charity wallet address (recipient if you fail)
5. **Click "Stake & Commit"** → Approve in Phantom
6. **Do the actual task** in real life
7. **Notify the Judge** when done (via WhatsApp, etc.)

#### As a Judge

1. **Connect the wallet** designated as judge
2. **Open "Judge Dashboard"** from home page
3. **Verify proof** from promiser (outside the app)
4. **Click Approve** if successful → Stake returns + NFT minted automatically
5. **Click Reject** if failed → Stake goes to charity

#### To View Achievements

1. **Click "My Achievements"** from home page
2. Minted NFTs will display with SVG artwork
3. NFTs also appear in **Phantom Wallet → Collectibles**

### 🏆 Achievement NFT Tiers

NFT achievements are generated with tiers based on stake amount:

| Tier | Stake | Color |
|------|-------|-------|
| 🥉 **Bronze** | < 0.1 SOL | Copper |
| 🥈 **Silver** | 0.1 - 0.5 SOL | Silver |
| 🥇 **Gold** | 0.5 - 1 SOL | Gold |
| 💎 **Diamond** | ≥ 1 SOL | Diamond |

### 📁 Project Structure

```
solemn/
├── programs/solemn/          # Anchor smart contract
│   ├── src/
│   │   ├── lib.rs            # Entry point, register instructions
│   │   ├── state.rs          # Account struct (Promise)
│   │   ├── error.rs          # Custom errors
│   │   ├── constants.rs      # PDA seeds & limits
│   │   └── instructions/     # 4 instructions
│   │       ├── create_promise.rs
│   │       ├── approve_promise.rs
│   │       ├── reject_promise.rs
│   │       └── claim_timeout.rs
│   └── tests/                # LiteSVM integration tests
├── app/                      # Next.js frontend
│   ├── app/
│   │   ├── page.tsx          # Landing page
│   │   ├── create/           # Create promise page
│   │   ├── my-promises/      # Promises list page
│   │   ├── judge/            # Judge dashboard
│   │   ├── achievements/     # NFT achievements page
│   │   ├── components/       # Reusable components
│   │   └── lib/              # Anchor client & NFT helpers
│   └── idl/                  # IDL for Anchor client
├── tests/                    # TypeScript tests (optional)
└── Anchor.toml               # Anchor config
```

### 🔄 Smart Contract Flow

```
create_promise
     │
     ▼
┌─────────┐         approve_promise
│ ACTIVE  │ ────────────────────────► ┌──────────┐
│         │                            │ APPROVED │ → stake returns + NFT
│         │         reject_promise     └──────────┘
│         │ ────────────────────────► ┌──────────┐
│         │                            │ REJECTED │ → to charity
│         │         claim_timeout      └──────────┘
│         │ ────────────────────────► ┌──────────┐
└─────────┘   (after deadline)        │TIMED_OUT │ → to charity
                                       └──────────┘
```

### 🔧 Troubleshooting

#### Anchor build error: "platform-tools missing"
```bash
solana-install update
cargo build-sbf --manifest-path programs/solemn/Cargo.toml
```

#### Faucet rate-limited
Use CLI airdrop:
```bash
solana airdrop 2 <ADDRESS> --url devnet
```

Or alternative faucets: [Helius](https://faucet.helius.dev) or [QuickNode](https://faucet.quicknode.com/solana/devnet).

#### Frontend "Hydration mismatch" error
Stop dev server (`Ctrl+C`), then run `npm run dev` again.

#### NFT not showing in Phantom
- Wait 30 seconds for sync
- Open Phantom → Collectibles tab
- Refresh Phantom extension (click outside Phantom → click again)

### 📐 Smart Contract Details

**Program ID (Devnet):** `82H3B7Sf7wEf3nv1u8FTDfgHoRZNzY8poH27RPqcFNCK`

**Instructions:**
- `create_promise(stake, deadline, judge, charity)` — Initialize promise, lock stake in PDA
- `approve_promise()` — Judge approves, stake returns to promiser
- `reject_promise()` — Judge rejects, stake transferred to charity
- `claim_timeout()` — After deadline, anyone can trigger transfer to charity

**Promise Account Structure:**
- `promiser: Pubkey` — Who made the promise
- `judge: Pubkey` — Designated verifier
- `charity: Pubkey` — Charity wallet
- `stake_amount: u64` — Amount in lamports
- `deadline: i64` — Unix timestamp
- `status: PromiseStatus` — Active/Approved/Rejected/TimedOut

### 📜 License

MIT License — free to use for anything.



<div align="center">

### Built with 💜 on Solana for [Hackathon Name] 2026

**[⬆ Back to top](#-solemn)**

</div>
