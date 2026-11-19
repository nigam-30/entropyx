# Product Requirements Document (PRD)

## 1. Executive Summary & Purpose
**EntropyX** (formerly CryptoKey) is a high-performance cryptographic security suite combining a native multi-threaded C++14 cryptographic microservice with a modern React 19 + Tailwind CSS frontend and a client-side Zero-Knowledge Encrypted Password Vault.

The purpose of EntropyX is to eliminate weak and reused passwords by providing cryptographically unbiased, high-entropy password and passphrase generation, offline NIST 800-63B / Shannon entropy analysis, offline breach vulnerability audits, and an airtight, zero-knowledge client-side encrypted password vault.

## 2. Problem Statement & User Personas
### 2.1 Problem Statement
- **Pseudo-Random Flaws & Modulo Bias**: Standard web generators use predictable PRNGs or faulty modulo arithmetic (`rand() % poolSize`), introducing statistical bias that lowers effective entropy.
- **Credential Storage Insecurity**: Traditional password managers store plaintexts or rely on server-side trust, creating single points of failure and breach vulnerability.
- **Duplicate Credentials**: Users unknowingly regenerate or reuse identical credentials across accounts.
- **Latency & Scalability**: Server-rendered generation slows down high-frequency enterprise demands and batch operations.

### 2.2 Target Personas
1. **Security Engineers & Cryptographers**: Require verifiable CSPRNG sources (`CryptGenRandom` / Web Crypto API), Shannon entropy validation, zero-collision Bloom filter guarantees, and hardware model verification (Galois LFSR).
2. **Developers & Power Users**: Want instant, 1-click password and passphrase generation, dark-themed responsive UI, and offline-capable client-side vaulting without server signups.
3. **Everyday End Users**: Need intuitive visual strength meters, real-time crack time calculations, easy copy buttons, and hassle-free encrypted storage that protects against snooping.

## 3. Core Features & Functional Requirements

### 3.1 Dual-Engine High-Entropy Password Generator
- **C++14 Native Engine**: Uses OS hardware entropy (`CryptGenRandom` on Win32/POSIX) with unbiased rejection sampling.
- **Cloud Fallback Mode**: Automatically falls back to standard W3C Web Crypto API (`window.crypto.getRandomValues`) with rejection sampling and Fisher-Yates shuffle when backend microservice is unreachable (e.g. Vercel deployment).
- **Customizable Rule Sets**: Length control (8 to 128 characters), uppercase, lowercase, numbers, symbols, and ambiguous character filtering (`[IOlo01]`).
- **Guaranteed Character Inclusion**: Guarantees at least one character from each enabled character class before cryptographic shuffling.

### 3.2 Memorable Passphrase Generator
- Generates high-entropy multi-word passphrases based on Diceware dictionaries.
- Configurable word counts (3-10 words), custom separators (`-`, `_`, `.`), title capitalization, and optional numeric suffixes.
- Passphrase entropy calculation (~12.9 bits per word + digit entropy).

### 3.3 Real-Time Shannon Entropy & NIST 800-63B Analysis
- Calculates theoretical Shannon entropy:
  $$E = L \times \log_2(N)$$
- Real-time crack time estimation against state-of-the-art offline attack hardware ($10^{10}$ guesses per second).
- 4-segment visual strength meter: Very Weak (<40 bits), Weak (40-59 bits), Moderate (60-79 bits), Strong (80-99 bits), Very Strong (100+ bits).
- NIST 800-63B compliance indicator (requires $\ge 80$ bits of entropy).

### 3.4 Zero-Collision Global Deduplication (C++ Core)
- 2,000,000-bit space-optimized **Bloom Filter** with $k=7$ independent hash functions for $O(1)$ fast rejection.
- Backed by an append-only persistent SHA-256 binary hash database (`data/history_hashes.bin`).
- Verifies that newly generated passwords have zero collisions with past generations.

### 3.5 Zero-Knowledge Encrypted Client-Side Vault
- **AES-256-GCM Authenticated Encryption**: 256-bit encryption key with random 96-bit initialization vectors (IV) per save operation.
- **PBKDF2 Key Derivation**: 100,000 iterations of HMAC-SHA256 with a unique 128-bit cryptographic salt.
- **Volatile In-Memory Security & Instant Auto-Lock**: Decrypted credentials and derived master keys reside exclusively in transient component RAM. Switching back to the Generator tab or closing the session immediately wipes memory.
- **Strict Master Password Paradigm**: No recovery backdoor, preserving true zero-knowledge privacy.
- **CRUD Operations**: Add, edit, delete, search, copy credentials, export encrypted JSON backups, and import encrypted JSON.

### 3.6 Offline Breach Vulnerability Auditor (k-Anonymity)
- Evaluates passwords against known breach digests without leaking credentials using 5-character SHA-256 / SHA-1 prefix k-anonymity matching.

### 3.7 VLSI Hardware Reference Model
- Integrated 32-bit Galois Linear Feedback Shift Register (LFSR) simulation endpoint (`GET /api/vlsi-model`) for hardware synthesis and cryptographic education.

## 4. Non-Functional Requirements
- **Performance**: Password generation latency $< 50\mu\text{s}$ in C++ core; client-side generation $< 2\text{ms}$. Multi-threaded throughput $> 1,000,000$ passwords/sec during benchmark.
- **Security**: Zero plaintexts stored in persistent media; zero secrets sent across networks; no third-party tracking scripts.
- **Reliability & Availability**: 100% functional offline or on static hosting via Cloud Web Crypto Fallback.
- **Compatibility**: Modern desktop and mobile browsers (Chrome, Firefox, Safari, Edge); Windows / Linux / macOS compatible backend.

## 5. User Journeys & Milestones
- **Milestone 1 (Complete)**: C++ Core engine with CSPRNG rejection sampling and Bloom filter deduplication.
- **Milestone 2 (Complete)**: React 19 + Tailwind CSS frontend with dynamic monospace visualizer and Shannon entropy meter.
- **Milestone 3 (Complete)**: Client-side Zero-Knowledge AES-256-GCM + PBKDF2 vault with volatile RAM auto-lock.
- **Milestone 4 (Complete)**: Hybrid auto-detect network layer for serverless Vercel cloud deployment.
- **Milestone 5 (Current)**: Enterprise documentation map, full test harnesses, and automated CI pipelines.

## 6. Success Metrics & KPIs
- Average generation latency $< 100\mu\text{s}$ on local C++ microservice.
- 0 plaintext leaks in browser storage or network payloads.
- 100% automated test pass rate across cryptographic primitives.
- 0 modulo bias across uniform distribution tests ($p > 0.05$ on Chi-Square).

## 7. Assumptions & Technical Constraints
- The user's browser implements the standard W3C `crypto.subtle` API.
- Vault backups are the user's responsibility; loss of the master password results in permanent data loss by cryptographic design.
- Local C++ microservice listens on port 8080 by default.

## 8. Out of Scope & Future Roadmap
- Cloud sync backend with multi-device account synchronization (retaining zero-knowledge).
- Hardware token (WebAuthn / YubiKey) authentication for vault unlock.
- Browser extension for autofill across web forms.
