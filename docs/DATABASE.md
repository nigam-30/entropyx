# Database


## 1. Database Engine
Database: Hybrid Storage Architecture:
- Client-Side: W3C Browser `localStorage` for authenticated Zero-Knowledge encrypted ciphertext envelopes.
- Backend Core: Binary Append-only File Storage (`history_hashes.bin`) + In-Memory 2,000,000-bit Bloom Filter ($k=7$).
Hosting: Client device local sandbox / Local filesystem storage.

## 2. Naming Conventions
Tables / Keys: lowercase snake_case (e.g., `cryptokey_vault_v1`, `history_hashes.bin`)
Columns / Properties: camelCase in JavaScript client models; snake_case in C++ backend structures.
Primary Keys: `id` (RFC 4122 v4 UUID string or millisecond timestamp integer).
Foreign Keys: N/A (single-tenant client-side isolated structure).
Timestamps: ISO 8601 UTC strings (`YYYY-MM-DDTHH:mm:ss.sssZ`).

## 3. Tables / Data Models

### 3.1 `cryptokey_vault_v1` (Browser LocalStorage Key)
Purpose: Stores the client-side AES-256-GCM encrypted envelope containing all vault credentials.
Format: Serialized JSON object.
Fields:
- `version`: (integer) Schema version identifier (e.g., `1`).
- `kdf`: (string) Key derivation function name (`"PBKDF2-HMAC-SHA256"`).
- `iterations`: (integer) PBKDF2 iteration count (`100000`).
- `cipher`: (string) Symmetric cipher algorithm (`"AES-256-GCM"`).
- `salt`: (string) 32-character hexadecimal representation of 16-byte (128-bit) cryptographic salt.
- `iv`: (string) 24-character hexadecimal representation of 12-byte (96-bit) GCM initialization vector.
- `ciphertext`: (string) Hexadecimal representation of encrypted ciphertext and appended 128-bit GCM authentication tag.
- `itemCount`: (integer) Number of encrypted credential records contained inside the blob.
- `updatedAt`: (string) ISO 8601 timestamp of last vault modification.

### 3.2 Decrypted Vault Item (In-Memory Schema)
Purpose: Represents an individual credential record when decrypted in volatile component RAM.
Fields:
- `id`: (string) Unique item UUID / identifier.
- `title`: (string) User-defined label (e.g., "GitHub Personal Account").
- `username`: (string) Account identifier or email address.
- `password`: (string) Plaintext password string (exists only in RAM while vault is unlocked).
- `category`: (string) Categorization tag (`"General"`, `"Work"`, `"Personal"`, `"Financial"`).
- `notes`: (string) Optional user notes.
- `createdAt`: (string) ISO 8601 creation timestamp.
- `updatedAt`: (string) ISO 8601 modification timestamp.

### 3.3 Backend Deduplication Index (`data/history_hashes.bin`)
Purpose: Stores binary SHA-256 digests of all historically generated passwords to prevent duplicate generation.
Format: Raw contiguous 32-byte binary records.
Record Size: 32 bytes (256 bits) per generated password hash.

## 4. Relationships
Vault Container → Vault Items: One encrypted vault envelope encapsulates a list of zero or more `VaultItem` objects.
Item relationships are isolated per browser profile and cannot cross between users or devices without manual encrypted JSON export/import.

## 5. Constraints
Required:
- In `cryptokey_vault_v1`: `salt`, `iv`, `ciphertext`, `iterations`, `version`.
- In `VaultItem`: `id`, `title`, `password`, `createdAt`.
Unique:
- `VaultItem.id` must be unique within a vault array.
- In backend C++ core, every SHA-256 digest in `history_hashes.bin` is verified to be unique via Bloom filter and hash table lookups before recording.
Foreign Keys:
- None.

## 6. Indexes
- **Bloom Filter (RAM Index)**: 2,000,000 bit vector indexed by 7 independent murmur-like hashing seeds. Provides $O(1)$ fast rejection for known passwords.
- **Client Vault In-Memory Index**: Fast search filtering on `title`, `username`, and `category` using linear scan over array in RAM.

## 7. Data Validation
- Master password must be $\ge 8$ characters during initialization.
- Vault payload before encryption must be valid JSON encoding an array of items.
- Decryption must verify the AES-256-GCM authentication tag; any bit flip in `ciphertext`, `salt`, or `iv` results in immediate rejection by `SubtleCrypto`.

## 8. Soft Delete
Does the system use soft deletion? No.
If yes: N/A. Deletion of a credential in the vault immediately re-encrypts the remaining array and overwrites the ciphertext in `localStorage`. Discarded credentials are wiped from RAM immediately.

## 9. Auditing
Do we record:
- Created by? Implicit (Local client user).
- Updated by? Implicit (Local client user).
- Deleted by? Implicit (Local client user).
- Activity history? No persistent audit trail is kept to preserve zero-knowledge privacy and prevent metadata forensic leakage.

## 10. Sensitive Data
Sensitive fields:
- `VaultItem.password`: High sensitivity. Never written to persistent storage in plaintext.
- `VaultItem.username`: High sensitivity. Encrypted inside ciphertext blob.
- `Master Password`: Critical sensitivity. Never stored in `localStorage` or transmitted over network. Kept in component state only while vault tab is open and immediately nulled upon auto-lock.

## 11. Migration Rules
Schema changes must:
1. Increment the `version` field in the vault envelope header (e.g., from `1` to `2`).
2. Implement backward-compatible decryption routines in `vaultCrypto.js`.
3. Provide automated in-place schema up-conversion upon successful master password unlock.
4. Never alter existing ciphertext without validating the authentication tag.

## 12. Seed Data
Development / Demo Seed Data:
- For testing purposes, demo vault entries may include mock accounts (e.g., "demo@example.com", Title: "Demo Service", Category: "General").
- Seed entries must use random passwords and never represent real production secrets.
