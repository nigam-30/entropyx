# UX Flows

Document the actual user journeys and interaction states across EntropyX.

## Flow 1 - High-Entropy Password Generation & Customization

1. User arrives at the EntropyX web interface.
2. System loads default options (Length: 16, Upper: ON, Lower: ON, Numbers: ON, Symbols: ON, Avoid Ambiguous: ON).
3. Backend health check automatically queries `GET /api/health` within 1200ms.
4. Header updates with engine indicator badge ("C++14 Native Microservice" or "WebCrypto Engine (Cloud Mode)").
5. Real-time generation runs immediately, populating the monospace display with multi-color syntax.
6. User drags length slider (e.g. from 16 to 32) or toggles character sets.
7. System immediately dispatches generation request (`handleGenerate`), recalculates Shannon entropy, updates the 4-segment visual strength meter, and refreshes the NIST crack-time estimation.

- Loading State: Monospace display shows animated pulse effect (`animate-pulse`) with opacity shift.
- Error State: Gracefully falls back to client-side Web Crypto CSPRNG with zero user error alerts.
- Empty State: If all character toggles are turned off, system defaults to lowercase characters to guarantee non-empty generation.

---

## Flow 2 - One-Click Clipboard Copy & Auto-Reroll

1. User clicks the Copy button on the generated password display.
2. System reads the password string and invokes `navigator.clipboard.writeText(password)`.
3. Copy button glyph transforms into a checkmark icon with an emerald "Copied to clipboard!" tooltip/toast.
4. If auto-reroll is active, the system automatically triggers generation of a fresh password after copy, preventing credential exposure or reuse.
5. After 2000ms, the Copy button resets back to its standard copy icon.

- Success: Password copied; transient confirmation rendered.
- Failure: If clipboard API access is denied by browser permissions, displays a gentle fallback selection prompt allowing manual copy (`Ctrl+C`).

---

## Flow 3 - First-Time Master Password Setup & Initial Vault Creation

1. User clicks "Save to Vault" button on a generated password (or switches to the "Vault" tab).
2. System detects no `cryptokey_vault_v1` envelope exists in `localStorage`.
3. Modal / Setup view prompts: "Initialize Your Zero-Knowledge Vault".
4. User enters a Master Password ($\ge 8$ characters) and confirms it.
5. User enters title (e.g., "AWS Root Account") and optional username/notes.
6. System runs PBKDF2 (100,000 iterations + 128-bit salt) to derive the 256-bit AES-GCM key.
7. Credential payload is encrypted with AES-256-GCM using a random 96-bit IV.
8. Ciphertext blob is saved to `localStorage` under `cryptokey_vault_v1`.
9. In-memory master password and decrypted items are loaded into state; UI switches to unlocked vault view.

- Success: Master password confirmed; encrypted envelope written to storage; confirmation displayed.
- Failure: Master password mismatch or $<8$ characters triggers red input border and inline validation notice.

---

## Flow 4 - Unlocking Vault & Viewing Decrypted Credentials

1. User clicks the "Vault" tab in the header.
2. System detects an existing encrypted vault blob in `localStorage`.
3. UI presents the Vault Unlock interface (Title: "Vault Locked", password input, "Unlock Vault" button).
4. User enters their Master Password and submits.
5. System invokes `decryptVault(vaultBlob, masterPassword)`.
6. PBKDF2 derives key from the stored salt; `crypto.subtle.decrypt` attempts authenticated decryption.
7. If the master password is valid and authentication tag matches:
   - Plaintext credentials and master password string are loaded into volatile React memory.
   - Vault view renders the list of accounts with category badges and search bar.
8. If the master password is incorrect or data is corrupted:
   - Cryptographic decryption fails with an authentication tag error.
   - UI renders a clear error: "Incorrect master password or corrupted vault data".
   - Memory remains clean; zero secrets are loaded.

---

## Flow 5 - Vault Auto-Lock & Volatile Memory Hygiene (Tab Switch)

1. User is viewing unlocked credentials in the Vault tab.
2. User clicks the "Generator" tab in the top header (or minimizes / leaves the view).
3. `handleTabChange('generator')` executes.
4. Auto-lock trigger fires:
   - `setIsVaultUnlocked(false)`
   - `setVaultItems([])`
   - `setMasterPasswordInMemory('')`
5. Volatile JavaScript heap drops references to all decrypted plaintext passwords and derived keys.
6. User returns to "Vault" tab later: The vault is strictly locked, requiring Master Password re-entry.

---

## Flow 6 - Exporting & Importing Encrypted JSON Backups

### Export:
1. Inside the unlocked Vault view, user clicks "Export Backup".
2. System serializes the raw encrypted envelope (`cryptokey_vault_v1`) into a `.json` file.
3. System triggers download named `entropyx_vault_backup_YYYY-MM-DD.json`.
4. Plaintext is never exported; the file remains encrypted with the user's Master Password.

### Import:
1. User clicks "Import Backup" and selects an encrypted `.json` file.
2. System validates JSON structure for required fields (`version`, `kdf`, `salt`, `iv`, `ciphertext`).
3. User enters the Master Password corresponding to that backup file to verify authenticity.
4. Upon successful decryption, existing vault is merged or replaced as confirmed by user.
5. `localStorage` is updated with the authenticated envelope.

---

## Flow 7 - Hybrid Offline & Cloud Failover

1. Application is loaded on a hosted cloud environment (e.g., Vercel) where the local C++ daemon is not running.
2. Frontend `fetchHealth()` queries `http://localhost:8080/api/health` with a 1200ms abort controller.
3. Timeout / connection refused occurs without blocking UI.
4. Catch handler resolves to `{ status: 'healthy', engine: 'WebCrypto Engine (Cloud Mode)', isCpp: false }`.
5. Header displays "Cloud Mode (WebCrypto)" badge.
6. All password generation calls transparently execute inside the browser sandbox using standard W3C Web Crypto CSPRNG with rejection sampling.
7. User experiences zero disruption, zero broken states, and zero latency penalties.
