# Architecture

This defines the technical structure: where everything goes, how components communicate,
and why the architecture was chosen.

## 1. System Overview
EntropyX is a hybrid cryptographic application designed for high-assurance randomness, password generation, and zero-knowledge credential vaulting. The system operates in two synchronized environments:
1. **Local Desktop / Server Environment**: Powered by a multi-threaded C++14 REST microservice executing OS hardware entropy calls (`CryptGenRandom` / `/dev/urandom`), Bloom filter deduplication, and persistent SHA-256 historical indexing.
2. **Cloud / Serverless Fallback (Vercel)**: Automatically engages standard W3C Web Crypto APIs (`window.crypto.getRandomValues`, `crypto.subtle`) directly in the client browser when the native daemon is offline, enabling zero-infrastructure hosting with zero loss in security guarantees.

## 2. Architecture Pattern
Pattern: Hybrid Client-Side Single Page Application (SPA) with Decoupled C++ REST Microservice Daemon.
Reason: Decouples compute-heavy cryptographic generation, multi-threaded batch benchmarking, and bloom deduplication into high-performance native code, while retaining 100% client-side zero-knowledge privacy for vault storage without sending user credentials across networks.

## 3. Technology Stack
Frontend: React 19, Vite 6, Tailwind CSS v4, Lucide React
Backend: C++14 Native REST Microservice (Winsock2 / POSIX TCP Sockets)
Database: Browser `localStorage` (Authenticated Ciphertext Blobs) + Append-only Binary File (`data/history_hashes.bin`)
Authentication: Zero-Knowledge Client-Side Master Password (PBKDF2-HMAC-SHA256, 100,000 rounds)
Storage: Client-side local encrypted storage (`cryptokey_vault_v1`)
Hosting: Vercel (Frontend Static Assets & Edge Routing) / Self-Hosted Binary (C++ Backend)
Payments: N/A (Free Open Source Software)
Email: N/A (Zero-Knowledge / No External Account Required)
Analytics: N/A (Privacy-preserving, zero third-party telemetry)
Other Services: W3C SubtleCrypto API, Windows CryptoAPI

## 4. System Components

### Frontend
Responsibilities:
- Render responsive UI (Generator view, Vault view, Save Modal, Strength Meter).
- Perform client-side entropy calculation and NIST 800-63B assessment.
- Execute client-side CSPRNG fallback generation with unbiased rejection sampling and Fisher-Yates shuffle.
- Execute client-side PBKDF2 key derivation and AES-256-GCM encryption/decryption.
- Manage strict volatile memory lifecycle (instant RAM purge upon auto-lock or tab change).

### Backend
Responsibilities:
- Provide high-throughput OS-level hardware entropy (`CryptGenRandom`).
- Enforce zero-collision deduplication via a 2,000,000-bit Bloom Filter ($k=7$).
- Maintain an append-only binary index (`history_hashes.bin`) of historical SHA-256 hashes.
- Run multi-threaded async worker pool benchmarks for high-frequency password generation ($> 1,000,000$ ops/sec).
- Perform k-anonymity breach audits and simulate 32-bit Galois LFSR hardware RTL models.

### Database / Storage Layer
Responsibilities:
- Store encrypted vault envelopes (`cryptokey_vault_v1`) in browser `localStorage`.
- Persist 32-byte SHA-256 hashes sequentially to disk in C++ core.
- Ensure that no plaintext credentials or master passwords ever touch disk or network packets.

## 5. Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                        Client Browser (React 19 + Tailwind v4)                   |
|                                                                                   |
|  [ Generator UI ]            [ Shannon Analyzer ]        [ Zero-Knowledge Vault ] |
|  - Length/Charset controls   - E = L * log2(N)           - PBKDF2 (100k rounds)   |
|  - Dynamic Monospace View    - NIST 800-63B audit        - AES-256-GCM Encrypt    |
|  - 1-Click Clipboard Copy    - Crack-time Estimator      - Instant RAM Auto-Lock  |
+-----------------------------------------------------------------------------------+
                                         |
                       Hybrid Network Layer (Auto-Detect)
                                         |
         +-------------------------------+-------------------------------+
         | (Local Connection: :8080)                                     | (Cloud / Offline)
         v                                                               v
+------------------------------------+                  +-----------------------------------+
|    C++14 REST Microservice         |                  |    Client-Side Web Crypto API     |
| - CryptGenRandom OS CSPRNG         |                  | - window.crypto.getRandomValues() |
| - Unbiased Rejection Sampling      |                  | - Unbiased Rejection Sampling     |
| - 2M-Bit Bloom Filter (k=7)        |                  | - Fisher-Yates Uniform Shuffle    |
| - Append-only SHA-256 Hash Index   |                  | - Client-side SHA-256 SubtleCrypto|
| - Asynchronous Multi-threaded Pool |                  +-----------------------------------+
+------------------------------------+
         |
         v
[ data/history_hashes.bin ]
```

## 6. Data Flow

1. **User Adjusts Options**: User selects password length (e.g., 20) and character set flags.
2. **Request Dispatch**: Frontend `api.js` dispatches `POST /api/generate` with an abort controller (1.5s timeout).
3. **Engine Evaluation**:
   - *If C++ Microservice is Active*: C++ uses `CryptGenRandom`, validates against Bloom filter, records SHA-256 in index, computes Shannon entropy, and returns JSON payload.
   - *If Microservice Times Out / Fails (Cloud Mode)*: Client intercepts error, immediately falls back to local `crypto.getRandomValues()`, executes rejection sampling + Fisher-Yates shuffle, computes Shannon entropy, and updates UI state.
4. **UI Update**: Monospace display renders newly generated characters; Strength Meter updates crack time and entropy score.
5. **Vault Save Trigger**: User clicks "Save to Vault", entering title and Master Password.
6. **Zero-Knowledge Encryption**: Browser derives AES-256 key via PBKDF2 (100k iterations + 128-bit random salt) and encrypts payload with AES-256-GCM (96-bit random IV).
7. **Local Persistence**: Authenticated ciphertext is serialized and stored in browser `localStorage`.
8. **Memory Hygiene**: Switching back to the Generator tab wipes the decrypted credentials and master password state from memory.

## 7. Project Structure
```
password_generator/
├── backend/
│   ├── bin/                    # Precompiled native binaries (server.exe)
│   ├── data/                   # Persistent deduplication storage (history_hashes.bin)
│   ├── include/                # C++ Header files
│   │   ├── bloom_filter.h      # 2M-bit Bloom Filter implementation
│   │   ├── breach_database.h   # k-Anonymity breach audit engine
│   │   ├── deduplication.h     # Zero-collision hash tracking
│   │   ├── entropy.h           # Shannon entropy & crack time analysis
│   │   ├── generator.h         # CSPRNG rejection sampling engine
│   │   ├── lfsr.h              # 32-bit Galois LFSR hardware model
│   │   ├── server.h            # Lightweight Winsock HTTP REST server
│   │   └── sha256.h            # Native cryptographic SHA-256 implementation
│   ├── src/                    # C++ Implementation units
│   │   ├── bloom_filter.cpp
│   │   ├── breach_database.cpp
│   │   ├── deduplication.cpp
│   │   ├── entropy.cpp
│   │   ├── generator.cpp
│   │   ├── lfsr.cpp
│   │   ├── main.cpp            # Server bootstrap & REST routing
│   │   └── sha256.cpp
│   └── build.bat               # Windows g++ compilation script
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable React UI components
│   │   │   ├── Controls.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── PasswordDisplay.jsx
│   │   │   ├── SaveToVaultModal.jsx
│   │   │   ├── StrengthMeter.jsx
│   │   │   └── VaultView.jsx
│   │   ├── services/           # Cryptographic & Network services
│   │   │   ├── api.js          # Hybrid API client & Web Crypto fallback
│   │   │   └── vaultCrypto.js  # Zero-Knowledge AES-256-GCM / PBKDF2 engine
│   │   ├── App.jsx             # Root application orchestrator
│   │   ├── index.css           # Tailwind CSS directives
│   │   └── main.jsx            # React root entry point
│   ├── index.html
│   ├── package.json
│   ├── vercel.json             # Vercel cloud deployment config
│   └── vite.config.js
├── docs/                       # Architectural & Project Documentation
│   ├── PRD.md
│   ├── DESIGN_SYSTEM.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   ├── CODE_STYLE.md
│   ├── TESTING.md
│   ├── AGENTS.md
│   ├── UX_FLOWS.md
│   └── API.md
├── run.bat                     # 1-Click launcher for both backend & frontend
├── vercel.json                 # Root deployment definition
└── README.md
```

## 8. Dependency Rules
- UI components must never access raw storage APIs (`localStorage`) directly; they must interact solely through `vaultCrypto.js`.
- The frontend must never transmit vault passwords, master passwords, or plaintext credentials across the network to the backend or any external service.
- The C++ backend must remain zero-dependency on external runtime libraries; it links solely against standard Windows / POSIX system libraries (`ws2_32`, `advapi32`, `pthread`).
- Frontend fallback logic in `api.js` must mirror the exact entropy calculations and standards defined in the C++ core.

## 9. Key Technical Decisions
Decision: Dual-Engine CSPRNG with Automatic Cloud Fallback.
Context: Required a desktop-grade C++ microservice capable of ultra-low latency deduplication, but also needed zero-setup serverless deployment on Vercel.
Alternatives: Pure Node.js backend (slower generation, needs persistent server host) vs. Pure Web Crypto frontend (no cross-session global deduplication or hardware modeling).
Reason: Hybrid architecture delivers the best of both worlds—uncompromising speed and deduplication when running locally, and universal instant zero-install availability in any browser on the web.

Decision: Client-Side PBKDF2 (100,000 rounds) + AES-256-GCM for Vault Storage.
Context: Users need credential storage without compromising their passwords to third-party databases.
Alternatives: Plaintext localStorage (catastrophic security flaw), Base64 encoding (trivial), server-side database (compromised if database leaks).
Reason: AES-256-GCM guarantees both confidentiality and ciphertext integrity. 100,000 rounds of PBKDF2 resist brute-force dictionary attacks.

## 10. Performance Considerations
- **C++ Microservice**: Employs non-blocking Winsock sockets, reusable thread pools, and binary hash streaming.
- **Bloom Filter Optimization**: 2,000,000 bits (~244 KB RAM) provides $O(1)$ membership checking for hundreds of thousands of generated credentials with $<0.1\%$ false positive probability.
- **Vite Bundling**: Frontend bundle size is $< 80\text{ KB}$ gzipped, ensuring sub-second First Contentful Paint.

## 11. Scalability Considerations
- **Stateless Backend**: The C++ microservice is completely stateless per HTTP request; parallel instances can be load balanced behind Nginx or Envoy if necessary.
- **Zero Central Storage Bottleneck**: Vault data resides strictly on user client machines; zero database scaling costs.

## 12. Failure Scenarios
What happens if:
- **C++ Backend is unavailable**: `api.js` catches fetch errors or timeouts after 1200ms and switches seamlessly to client-side Web Crypto mode without user disruption.
- **Master Password is forgotten**: By cryptographic design, no backdoor exists. The user is prompted to wipe and recreate the vault if lost.
- **Ciphertext is corrupted / tampered**: AES-256-GCM authentication tag verification fails immediately during `decryptVault()`, raising an error and preventing partial execution or plaintext leaks.
