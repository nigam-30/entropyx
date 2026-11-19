# AI Coding Agent Instructions

Turn project documentation into operational instructions. Use the rules mechanism supported
by your coding environment and keep these principles centralized.

## 1. Project Context
Project: EntropyX (Cryptographic Security Suite & Zero-Knowledge Vault)
Purpose: Provides high-entropy, mathematically unbiased password and passphrase generation, Shannon entropy and crack-time metrics, and a client-side Zero-Knowledge AES-256-GCM encrypted vault with instant memory auto-lock.
Primary Users: Security professionals, software developers, system administrators, and privacy-conscious individuals.

## 2. Source of Truth
Before significant changes, read relevant documentation inside `/docs`.
Core documentation:
- [PRD.md](file:///d:/password_generator/docs/PRD.md)
- [DESIGN_SYSTEM.md](file:///d:/password_generator/docs/DESIGN_SYSTEM.md)
- [ARCHITECTURE.md](file:///d:/password_generator/docs/ARCHITECTURE.md)
- [DATABASE.md](file:///d:/password_generator/docs/DATABASE.md)
- [SECURITY.md](file:///d:/password_generator/docs/SECURITY.md)
- [CODE_STYLE.md](file:///d:/password_generator/docs/CODE_STYLE.md)
- [TESTING.md](file:///d:/password_generator/docs/TESTING.md)
- [UX_FLOWS.md](file:///d:/password_generator/docs/UX_FLOWS.md)
- [API.md](file:///d:/password_generator/docs/API.md)

Do not contradict these documents without first identifying the conflict.

## 3. General Rules
- Understand existing code before modifying it.
- Reuse existing components (`frontend/src/components`) and utilities (`frontend/src/services`).
- Follow the design system (clean, technical, cybersecurity theme, Tailwind v4).
- Follow the architecture (dual-engine: C++14 native daemon with transparent Web Crypto API cloud fallback).
- Follow database conventions (client-side encrypted envelope `cryptokey_vault_v1`, append-only binary hash file).
- Follow security requirements (Zero-Knowledge, PBKDF2 100k rounds, AES-256-GCM, instant RAM wipe on auto-lock).
- Follow coding conventions (clean modern React 19 functional code, zero-dependency C++14).
- Do not invent business requirements or feature bloat.
- Do not expose secrets or master passwords to storage or network calls.
- Avoid unnecessary external dependencies.
- Avoid unrelated changes to functioning files.

## 4. Planning
Before implementing a non-trivial task:
1. Inspect relevant documentation in `/docs`.
2. Inspect relevant code in `frontend/` and `backend/`.
3. Identify affected files.
4. Identify dependencies.
5. Identify database/API changes.
6. Identify tests required.
7. Create a concise implementation plan.

## 5. Implementation
- Make focused, surgical changes.
- Reuse established patterns and utility functions.
- Preserve existing behavior and fallback mechanics.
- Avoid unnecessary rewrites.
- Keep code clean, readable, and maintainable.

## 6. Validation
After implementation:
1. Run tests where available.
2. Run linting and static checks.
3. Run the build (`npm run build` in `frontend/`).
4. Validate C++ compilation (`build.bat` in `backend/`).
5. Review changed files with git diff.
6. Check for unintended side-effects or memory retention.

## 7. Documentation
Update documentation when implementation changes:
- Product behavior
- Architecture
- Database schema
- API contracts
- Security rules
- Coding conventions

## 8. Conflict Handling
If requirements conflict:
Do not guess. Identify the conflict and ask the user for clarification.

## 9. Completion Criteria
A task is complete only when:
- Requirements are satisfied.
- Tests pass.
- Build succeeds.
- No unintended files changed.
- Security and Zero-Knowledge rules are respected.
- Documentation is updated when necessary.
