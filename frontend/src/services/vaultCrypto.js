// Zero-Knowledge Client-Side Cryptographic Vault Engine
// Built using standard W3C Web Crypto API (SubtleCrypto)
// - Key Derivation: PBKDF2-HMAC-SHA256 (100,000 rounds) + 128-bit Salt
// - Encryption: AES-256-GCM (Authenticated Encryption with 96-bit IV)

const VAULT_STORAGE_KEY = 'cryptokey_vault_v1';
const PBKDF2_ITERATIONS = 100000;

// Byte / Hex conversion utilities
export function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

/**
 * Derives an AES-GCM 256-bit key from a master password and salt using PBKDF2
 */
async function deriveKey(masterPassword, saltBytes) {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts vault items array into an authenticated ciphertext blob
 * @param {Array} items - Plaintext credential objects
 * @param {string} masterPassword - Master password chosen by user
 * @returns {Promise<Object>} Serialized encrypted vault blob
 */
export async function encryptVault(items, masterPassword) {
  const salt = window.crypto.getRandomValues(new Uint8Array(16)); // 128-bit salt
  const iv = window.crypto.getRandomValues(new Uint8Array(12));   // 96-bit GCM IV

  const key = await deriveKey(masterPassword, salt);

  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(JSON.stringify(items));

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    plaintextBytes
  );

  const blob = {
    version: 1,
    kdf: 'PBKDF2-HMAC-SHA256',
    iterations: PBKDF2_ITERATIONS,
    cipher: 'AES-256-GCM',
    salt: bytesToHex(salt),
    iv: bytesToHex(iv),
    ciphertext: bytesToHex(new Uint8Array(ciphertextBuffer)),
    itemCount: items.length,
    updatedAt: new Date().toISOString(),
  };

  saveStoredVaultBlob(blob);
  return blob;
}

/**
 * Decrypts an authenticated ciphertext blob back into plaintext items
 * Throws an error if the password is incorrect or data has been tampered with
 * @param {Object} vaultBlob - Encrypted vault blob from storage
 * @param {string} masterPassword - Master password provided by user
 * @returns {Promise<Array>} Decrypted credential objects
 */
export async function decryptVault(vaultBlob, masterPassword) {
  if (!vaultBlob || !vaultBlob.salt || !vaultBlob.iv || !vaultBlob.ciphertext) {
    throw new Error('Invalid or corrupted vault data');
  }

  const salt = hexToBytes(vaultBlob.salt);
  const iv = hexToBytes(vaultBlob.iv);
  const ciphertextBytes = hexToBytes(vaultBlob.ciphertext);

  const key = await deriveKey(masterPassword, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertextBytes
    );

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonString);
  } catch {
    // SubtleCrypto rejects with an OperationError when AES-GCM authentication tag fails
    throw new Error('Incorrect master password or corrupted vault integrity');
  }
}

// LocalStorage persistence helpers
export function hasStoredVault() {
  return Boolean(localStorage.getItem(VAULT_STORAGE_KEY));
}

export function getStoredVaultBlob() {
  const data = localStorage.getItem(VAULT_STORAGE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function saveStoredVaultBlob(blob) {
  localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(blob));
}

export function clearStoredVault() {
  localStorage.removeItem(VAULT_STORAGE_KEY);
}
