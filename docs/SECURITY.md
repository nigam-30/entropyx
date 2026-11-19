# Security Guidelines

Security is a project requirement. Define authentication, authorization, secrets, API protection,
data security, and upload rules before implementation.

## 1. Authentication
Authentication Provider: Client-Side Zero-Knowledge Cryptographic Vault Authentication
Methods:
- Master Password (PBKDF2-HMAC-SHA256 derivation)
- Zero external identity providers or cloud servers required
- Zero recovery backdoor (loss of master password guarantees irrecoverability)

## 2. Authorization
Roles: Vault Owner (Client-Side Sole Tenant)
Permissions:
### Vault Owner
- Create, read, update, delete credentials within local vault
- Export encrypted ciphertext backup
- Import encrypted ciphertext backup
- Re-encrypt vault with new credentials
Authorization must be enforced locally through AES-256-GCM authentication tag verification.

## 3. Secrets
- Never hard-code credentials or test keys in source control.
- Never commit production secrets or actual password lists.
- Never expose private keys or decrypted passwords to network interfaces.
- The master password must never be persisted to `localStorage`, `sessionStorage`, cookies, or browser cache.
- The derived AES-256 key must be held as a non-extractable `CryptoKey` object in volatile JavaScript heap during active unlock.
- Volatile memory hygiene: Instant RAM purge when user switches away from the Vault view.

## 4. Environment Variables
Public:
- `VITE_API_BASE_URL`: Base URL for the C++ backend daemon (defaults to `http://localhost:8080`).
Private:
- None required (zero backend database secrets needed).

## 5. API Security
Input validation:
- All numeric options (`length`, `wordCount`) validated with strict bounds ($8 \le \text{length} \le 128$).
- Booleans strictly coerced; strings sanitized against buffer overruns in C++ core.
Rate limiting:
- Backend `server.h` enforces socket timeouts and restricts concurrent request handling.
- Maximum benchmark batch size capped at 200,000 items to prevent local CPU exhaustion.
CORS:
- Configured to permit requests from frontend origins with strict allowed headers (`Content-Type`).
Authentication:
- Public endpoints (`/api/generate`, `/api/health`, `/api/analyze`, `/api/benchmark`, `/api/vlsi-model`) are stateless and require no tokens.
Authorization:
- Vault operations remain strictly client-side; no vault API exists on the backend daemon.

## 6. Data Protection
Sensitive data:
- Plaintext passwords, usernames, account notes, Master Password.
Encryption:
- In Transit: HTTPS (Vercel production) or local loopback (`127.0.0.1`).
- At Rest: AES-256-GCM authenticated encryption with unique 128-bit salt and 96-bit IV per save.
Retention:
- Plaintext remains in component state only while Vault view is open.
Deletion:
- Instant overwrite on vault record deletion; `localStorage.removeItem('cryptokey_vault_v1')` on vault reset.

## 7. Logging
Never log:
- Passwords or passphrases
- Master passwords or partial keys
- Plaintext vault item metadata
- User clipboard contents
Log:
- Backend daemon startup and port binding
- Hash deduplication counts and Bloom filter memory footprint
- Anonymized generation latency and throughput metrics
- Request failure error codes

## 8. File Uploads / Imports
Allowed file types: `.json` (Encrypted Vault Backup files only)
Maximum size: 2 MB
Validation:
- JSON schema structure must match `{ version, kdf, iterations, cipher, salt, iv, ciphertext }`.
- Hex strings for `salt` (32 chars) and `iv` (24 chars) strictly validated.
Storage:
- Processed in-memory; saved directly to `localStorage` upon user confirmation; never uploaded to server.

## 9. Security Checklist
- [x] Client-side Zero-Knowledge architecture verified
- [x] PBKDF2 configured with 100,000 rounds of HMAC-SHA256
- [x] AES-256-GCM authenticated encryption verified
- [x] Hardware entropy sources verified (`CryptGenRandom` & `crypto.getRandomValues`)
- [x] Rejection sampling verified to eliminate modulo bias
- [x] Volatile memory auto-lock verified on tab change
- [x] Master password never stored in persistent media
- [x] Zero plaintexts transmitted across the network
- [x] Dependencies audited with zero vulnerabilities
