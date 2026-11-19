# API Specifications

This document serves as the formal source of truth for all EntropyX API contracts, HTTP endpoints, data models, error handling, and hybrid client fallback services.

## Overview
- **Base URL (Local Microservice)**: `http://localhost:8080` (configurable via `VITE_API_BASE_URL`)
- **Transport**: HTTP/1.1 over TCP
- **Content-Type**: `application/json`
- **Error Format**: JSON object containing an `"error"` message string

---

## 1. Endpoints

### 1.1 `GET /api/health`
Checks the operational health and runtime statistics of the C++14 cryptographic microservice.

#### Request
- **Method**: `GET`
- **Headers**: None required

#### Response
- **Status**: `200 OK`
- **Content-Type**: `application/json`
```json
{
  "status": "healthy",
  "engine": "C++14 Native Microservice",
  "totalUniqueTracked": 14285,
  "estimatedFalsePositiveRate": 0.00012,
  "memoryFootprintBytes": 250000,
  "csprng": "Windows CryptoAPI CryptGenRandom"
}
```

---

### 1.2 `POST /api/generate`
Generates a mathematically unbiased, high-entropy password using OS hardware entropy and rejection sampling, with zero-collision verification against the Bloom filter.

#### Request
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body Schema**:
```json
{
  "length": 16,
  "upper": true,
  "lower": true,
  "numbers": true,
  "symbols": true,
  "avoidAmbiguous": true
}
```

#### Fields:
| Field | Type | Default | Description |
|---|---|---|---|
| `length` | integer | `16` | Length of password (8 to 128) |
| `upper` | boolean | `true` | Include uppercase letters (`A-Z`) |
| `lower` | boolean | `true` | Include lowercase letters (`a-z`) |
| `numbers` | boolean | `true` | Include numeric digits (`0-9`) |
| `symbols` | boolean | `true` | Include special symbols (`!@#$%^&*...`) |
| `avoidAmbiguous`| boolean | `true` | Exclude ambiguous characters (`IOlo01`) |

#### Response
- **Status**: `200 OK`
- **Content-Type**: `application/json`
```json
{
  "password": "k9#VpQ!8m2@Zx$4L",
  "sha256": "8f4e2b10a9c4d3e5f7a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3",
  "entropy": 98,
  "strength": "Strong",
  "crackTime": "Several centuries",
  "poolSize": 86,
  "isUniqueVerified": true,
  "attemptsRequired": 1,
  "generationLatencyUs": 18.5,
  "totalUniqueGenerated": 14286,
  "meetsNistStandard": true
}
```

---

### 1.3 `POST /api/generate-passphrase`
Generates a multi-word Diceware-style passphrase with calculated Shannon entropy.

#### Request
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body Schema**:
```json
{
  "wordCount": 5,
  "separator": "-",
  "capitalize": true,
  "includeNumber": true
}
```

#### Fields:
| Field | Type | Default | Description |
|---|---|---|---|
| `wordCount` | integer | `5` | Number of words in passphrase (3 to 10) |
| `separator` | string | `"-"` | Character separating words |
| `capitalize` | boolean | `true` | Title-case each word |
| `includeNumber` | boolean | `true` | Append a random number to the end |

#### Response
- **Status**: `200 OK`
- **Content-Type**: `application/json`
```json
{
  "passphrase": "Correct-Horse-Battery-Staple-42",
  "sha256": "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
  "entropy": 74,
  "strength": "Very Strong",
  "crackTime": "Several centuries",
  "isUniqueVerified": true,
  "attemptsRequired": 1,
  "generationLatencyUs": 24.2,
  "totalUniqueGenerated": 14287
}
```

---

### 1.4 `POST /api/analyze`
Performs comprehensive Shannon entropy, NIST 800-63B compliance evaluation, and crack-time calculations on any arbitrary password string.

#### Request
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body Schema**:
```json
{
  "password": "UserSuppliedPassword123!"
}
```

#### Response
- **Status**: `200 OK`
- **Content-Type**: `application/json`
```json
{
  "entropy": 79,
  "strength": "Moderate",
  "crackTime": "A few months",
  "meetsNistStandard": false,
  "warnings": [
    "Password contains sequential dictionary or numeric patterns"
  ],
  "suggestions": [
    "Increase length beyond 16 characters to meet NIST standard (>= 80 bits)"
  ]
}
```

#### Error Response:
- **Status**: `400 Bad Request`
```json
{
  "error": "Missing password field"
}
```

---

### 1.5 `POST /api/benchmark`
Runs an asynchronous multi-threaded throughput benchmark across all CPU cores to measure generation speed and thread scalability.

#### Request
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`
- **Body Schema**:
```json
{
  "count": 50000
}
```

#### Response
- **Status**: `200 OK`
- **Content-Type**: `application/json`
```json
{
  "batchSize": 50000,
  "durationMs": 42.15,
  "passwordsPerSecond": 1186239,
  "threadsUsed": 8,
  "engine": "C++14 Multi-threaded Asynchronous Worker Pool"
}
```

---

### 1.6 `POST /api/check-breach`
Audits passwords against known breach datasets using zero-knowledge k-anonymity (prefix-matching) or direct hash verification.

#### Request (k-Anonymity Mode)
```json
{
  "prefix": "21BD1"
}
```

#### Response (k-Anonymity Mode)
- **Status**: `200 OK`
```json
{
  "prefix": "21BD1",
  "matches": [
    { "suffix": "C482A3A6B4E... ", "count": 142 },
    { "suffix": "D991F2C54B1... ", "count": 3 }
  ]
}
```

#### Request (Direct Mode)
```json
{
  "password": "Password123"
}
```

#### Response (Direct Mode)
- **Status**: `200 OK`
```json
{
  "isBreached": true,
  "sha256": "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f",
  "leakCount": 84210,
  "verdict": "Vulnerable: Compromised in known breach database"
}
```

---

### 1.7 `GET /api/vlsi-model`
Outputs cycle-accurate simulation traces from the integrated 32-bit Galois LFSR Hardware RTL model.

#### Request
- **Method**: `GET`

#### Response
- **Status**: `200 OK`
```json
{
  "architecture": "32-bit Galois LFSR Hardware RTL Reference Model",
  "polynomial": "x^32 + x^22 + x^2 + x^1 + 1",
  "feedbackMaskHex": "0x80200003",
  "maximalCyclePeriod": "4294967295 cycles (2^32 - 1)",
  "clockCycles": [
    { "cycle": 1, "stateHex": "0xa5a5a5a5", "stateBin": "10100101101001011010010110100101", "outputBit": 1 },
    { "cycle": 2, "stateHex": "0x52d2d2d2", "stateBin": "01010010110100101101001011010010", "outputBit": 0 }
  ]
}
```

---

## 2. Client-Side Web Crypto Hybrid Fallback Service

When deployed to cloud environments without the C++ microservice (e.g. Vercel), `frontend/src/services/api.js` provides local client-side equivalents:

### Fallback Health Response:
```javascript
{
  status: 'healthy',
  engine: 'WebCrypto Engine (Cloud Mode)',
  isCpp: false,
  csprng: 'Native Web Crypto API'
}
```

### Fallback Generator Contract:
```javascript
{
  password: string,
  sha256: string,
  entropy: number,
  strength: 'Very Weak' | 'Weak' | 'Moderate' | 'Strong' | 'Very Strong',
  crackTime: string,
  isUniqueVerified: true,
  meetsNistStandard: boolean,
  engine: 'WebCrypto CSPRNG'
}
```
Algorithm Guarantee: Rejection sampling over uniform 32-bit integers (`getCryptoRandomInt`) followed by full in-place Fisher-Yates shuffle.
