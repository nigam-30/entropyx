# Testing

Define how the application will be validated. The agent should not stop at “the code looks
correct.” Test the application and verify critical user journeys.

## 1. Testing Goals
Critical functionality:
- Cryptographic unbiasedness: Zero modulo bias in rejection sampling algorithms.
- Shannon entropy accuracy: Precision of $E = L \times \log_2(N)$ and crack-time metrics.
- Zero-Knowledge Vault integrity: Correct PBKDF2 key derivation and AES-256-GCM authenticated encryption/decryption roundtrip.
- Memory hygiene: Verification of instant volatile RAM wipe upon tab shift or lock trigger.
- Dual-Engine failover: Smooth seamless fallback from C++ backend to Web Crypto API during network disconnect.

## 2. Test Types

### Unit Testing
- Test rejection sampling random integer generator (`getCryptoRandomInt`) across various pool sizes.
- Test Shannon entropy calculation logic and NIST 800-63B classification.
- Test `bytesToHex` and `hexToBytes` serialization utilities.
- Test C++ Bloom filter insertion, query, and false-positive calculations.
- Test C++ SHA-256 implementation against NIST standard test vectors.

### Integration Testing
- Test C++ REST API endpoints (`/api/health`, `/api/generate`, `/api/generate-passphrase`, `/api/analyze`, `/api/benchmark`, `/api/check-breach`).
- Test hybrid failover mechanism in `api.js` when backend is offline.
- Test Vault encryption and decryption lifecycle using mock master passwords and corrupted ciphertexts.

### End-to-End Testing
Test critical journeys:
- Generate password with customized character sets and length.
- Copy generated password to clipboard and observe confirmation toast.
- Create new vault with Master Password and save credential.
- Switch to Generator tab and verify vault auto-locks immediately.
- Re-enter Master Password in Vault tab and verify decrypted credentials render.
- Export encrypted JSON backup and restore on a fresh session.

## 3. Testing Tools
Unit: Vitest / Node Native Test Runner (Frontend), C++ Custom Test Suite / Google Test (Backend)
Integration: Playwright / Fetch integration harness
E2E: Playwright

## 4. Test File Structure
```
tests/
├── unit/
│   ├── crypto_rejection_sampling.test.js
│   ├── entropy_calculator.test.js
│   ├── vault_crypto.test.js
│   └── cpp/
│       ├── test_bloom_filter.cpp
│       └── test_sha256.cpp
├── integration/
│   ├── api_endpoints.test.js
│   └── cloud_fallback.test.js
└── e2e/
    ├── password_generation.spec.js
    └── vault_lifecycle.spec.js
```

## 5. Critical User Flows

### Flow 1: Generate & Copy Password
Steps:
1. User adjusts length slider to 24 characters.
2. User toggles on Upper, Lower, Numbers, and Symbols.
3. System generates high-entropy password (via C++ microservice or Web Crypto).
4. User clicks Copy button.
Expected result: Clipboard receives exact password; toast notifies "Copied to clipboard!"; auto-reroll option triggers if configured.

### Flow 2: Vault Initialization & Save
Steps:
1. User clicks "Save to Vault" on a generated password.
2. Modal opens requesting Title, Account, and Master Password.
3. User enters Master Password (minimum 8 characters) and confirms.
4. Cryptographic engine derives key using PBKDF2 and encrypts payload with AES-256-GCM.
5. Encrypted blob is written to `localStorage`.
Expected result: Modal closes; item count increments; vault persists securely.

### Flow 3: Auto-Lock Memory Sanitation
Steps:
1. User unlocks Vault and views plaintext credentials.
2. User clicks "Generator" tab in header navigation.
3. User navigates back to "Vault" tab.
Expected result: Vault displays locked state; component state in RAM is cleared; user must re-enter Master Password to view items.

## 6. Coverage
Target: $\ge 85\%$ coverage for cryptographic and security-critical modules.
Prioritize:
- Rejection sampling distribution and bounds
- PBKDF2 and AES-256-GCM encryption/decryption routines
- Volatile memory clearing and state resets
- Backend C++ Bloom filter collision avoidance
- Network failure interceptors and fallback paths

## 7. Commands
Test (Frontend): `npm test`
Lint (Frontend): `npm run lint`
Build (Frontend): `npm run build`
Type Check: `npm run typecheck`
Compile Backend: `cd backend && call build.bat`
Launch Full Suite: `.\run.bat`

## 8. Definition of Done
- [x] All unit and integration tests pass without error
- [x] Frontend builds cleanly (`npm run build`) with zero compiler warnings
- [x] Zero plaintexts stored in persistent browser media
- [x] Seamless fallback verified when C++ backend is stopped
- [x] No memory leaks or retained secrets after vault lock
