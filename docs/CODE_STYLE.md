# Code Style & Conventions

Keep generated code consistent across the project. Reuse established patterns and make
focused, readable changes.

## 1. General Principles
- Prefer readable, explicit code over clever one-liners.
- Keep functions focused on a single responsibility.
- Avoid unnecessary abstractions or heavy external libraries when native browser/C++ APIs suffice.
- Reuse existing UI components and cryptographic services (`vaultCrypto.js`, `api.js`).
- Prefer consistency with existing project idioms over introducing novel paradigms.

## 2. Naming
Components: PascalCase (e.g., `PasswordDisplay.jsx`, `VaultView.jsx`, `SaveToVaultModal.jsx`)
Functions: camelCase (e.g., `handleGenerate`, `encryptVault`, `getCryptoRandomInt`)
Variables: camelCase (e.g., `masterPasswordInMemory`, `backendHealth`, `isVaultUnlocked`)
Constants: UPPER_SNAKE_CASE (e.g., `VAULT_STORAGE_KEY`, `PBKDF2_ITERATIONS`, `BASE_URL`)
Files:
- React Components: PascalCase `.jsx` (e.g., `StrengthMeter.jsx`)
- Services & Utilities: camelCase `.js` (e.g., `vaultCrypto.js`, `api.js`)
- C++ Source & Headers: snake_case `.cpp` / `.h` (e.g., `bloom_filter.cpp`, `generator.h`)
Database fields / Schema properties: camelCase in JavaScript; snake_case in C++
API routes: kebab-case with `/api/` prefix (e.g., `/api/health`, `/api/generate`, `/api/generate-passphrase`, `/api/check-breach`, `/api/vlsi-model`)

## 3. Folder Structure
Organize strictly by role and domain:
- `frontend/src/components/`: Reusable presentation and interactive UI blocks.
- `frontend/src/services/`: Pure business logic, cryptographic primitives, and API communication.
- `backend/include/`: C++ header definitions, structures, and interfaces.
- `backend/src/`: C++ implementation files.
- `backend/data/`: Persistent binary storage files.
- `docs/`: Markdown specification and architecture documents.

## 4. Imports
- Order imports logically:
  1. React core and standard hooks (`react`, `useState`, `useEffect`)
  2. Third-party UI icons and libraries (`lucide-react`)
  3. Internal components (`./components/Header`)
  4. Internal services and utilities (`./services/api`)
- Keep imports clean; prune unused imports immediately.

## 5. Components
Components should:
- Have a single, clear responsibility (e.g., `StrengthMeter` only visualizes metrics; `Controls` only adjusts parameters).
- Follow modern functional React 19 standards with hooks (`useState`, `useEffect`, `useCallback`).
- Prefer Tailwind utility classes for styling; avoid external CSS stylesheets where utility classes suffice.
- Destructure props cleanly with sensible defaults.

## 6. Functions
Functions should:
- Do one logical thing.
- Have descriptive, self-documenting names.
- In JavaScript, mark asynchronous cryptographic operations with `async`/`await`.
- In C++, use `const` references for complex parameters and avoid unnecessary memory copying.

## 7. Error Handling
Use:
- `try...catch` blocks around all network fetches and Web Crypto cryptographic operations.
- Graceful degradation: If native C++ microservice fails, fallback transparently to `generateClientPassword`.
- User-facing error notifications that inform without exposing internal stack traces or cryptographic keys.
Do not:
- Swallow errors silently without fallback handling.
- Expose raw database or cryptographic exception messages to the UI.

## 8. Comments
Comments should explain:
- *Why* a specific mathematical or cryptographic decision was made (e.g., why rejection sampling is used instead of modulo operator).
- Non-obvious architectural patterns (e.g., why volatile RAM auto-locks on tab change).
- Standard compliance notes (e.g., NIST 800-63B Shannon entropy thresholds).
Avoid comments that simply restate what the code clearly does.

## 9. Logging
Use:
- Standard `console.error` in frontend only for unhandled exceptions.
- `std::cout` in backend for server startup, thread pool allocation, and fatal errors.
Rules:
- Never log passwords, master passwords, or raw decrypted payloads.
- Keep log messages clean, structured, and informative.

## 10. Formatting
Formatter: Prettier (JavaScript/JSX), Clang-Format (C++)
Linter: ESLint for React, standard compiler warnings (`-Wall -Wextra`) for C++
Type Checking: JavaScript standard linting / Optional JSDoc annotations; C++14 strict type enforcement

## 11. Do
- Reuse existing styling tokens and Tailwind color palettes.
- Keep changes focused on the specified user requirements.
- Follow the established architecture and zero-knowledge principles.
- Clean up temporary object URLs and volatile memory states.

## 12. Don't
- Create duplicate utility functions.
- Introduce heavy npm dependencies for simple cryptographic or UI tasks.
- Send passwords to any external backend without user consent.
- Modify unrelated files or refactor working code unnecessarily.
