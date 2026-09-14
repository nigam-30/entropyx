#include "deduplication.h"
#include "sha256.h"
#include <fstream>
#include <iostream>

DeduplicationEngine::DeduplicationEngine(const std::string& storagePath)
    : storageFile(storagePath), bloom(2000000, 7), totalRegistered(0) {
    loadFromDisk();
}

DeduplicationEngine::~DeduplicationEngine() {
}

void DeduplicationEngine::loadFromDisk() {
    std::ifstream file(storageFile, std::ios::in);
    if (!file.is_open()) {
        return;
    }

    std::string line;
    while (std::getline(file, line)) {
        // Strip carriage returns or spaces
        while (!line.empty() && (line.back() == '\r' || line.back() == ' ')) {
            line.pop_back();
        }
        if (line.length() == 64) { // Valid SHA-256 hex string
            bloom.add(line);
            exactHashes.insert(line);
            totalRegistered++;
        }
    }
    file.close();
}

void DeduplicationEngine::appendToDisk(const std::string& hash) {
    std::ofstream file(storageFile, std::ios::out | std::ios::app);
    if (file.is_open()) {
        file << hash << "\n";
        file.close();
    }
}

bool DeduplicationEngine::checkAndRegister(const std::string& password, std::string& outSha256) {
    outSha256 = SHA256::hash(password);

    std::lock_guard<std::mutex> lock(mtx);

    // Step 1: Query Bloom Filter (sub-microsecond O(1) bit check)
    if (bloom.possiblyContains(outSha256)) {
        // Step 2: Query Exact Hash Set to verify whether it's a true collision or false positive
        if (exactHashes.find(outSha256) != exactHashes.end()) {
            // Definite collision! This password was generated previously.
            return false;
        }
    }

    // Step 3: Password is completely unique! Register in memory and append to disk
    bloom.add(outSha256);
    exactHashes.insert(outSha256);
    totalRegistered++;
    appendToDisk(outSha256);

    return true;
}

std::string DeduplicationEngine::generateUnique(PasswordEngine& engine, const GeneratorOptions& opts,
                                               size_t& outPoolSize, std::string& outHash, int& outAttempts) {
    outAttempts = 0;
    const int MAX_ATTEMPTS = 50;

    while (outAttempts < MAX_ATTEMPTS) {
        outAttempts++;
        std::string candidate = engine.generatePassword(opts, outPoolSize);

        if (checkAndRegister(candidate, outHash)) {
            return candidate;
        }
        // Collision happened! Loop re-rolls immediately
    }

    // If astronomically unlucky after 50 attempts, force a larger entropy candidate
    GeneratorOptions fallback = opts;
    fallback.length += 4;
    return engine.generatePassword(fallback, outPoolSize);
}

std::string DeduplicationEngine::generateUniquePassphrase(PasswordEngine& engine, const PassphraseOptions& opts,
                                                         std::string& outHash, int& outAttempts) {
    outAttempts = 0;
    const int MAX_ATTEMPTS = 50;

    while (outAttempts < MAX_ATTEMPTS) {
        outAttempts++;
        std::string candidate = engine.generatePassphrase(opts);

        if (checkAndRegister(candidate, outHash)) {
            return candidate;
        }
    }

    return engine.generatePassphrase(opts);
}

size_t DeduplicationEngine::getTotalUniqueCount() const {
    std::lock_guard<std::mutex> lock(mtx);
    return totalRegistered;
}

double DeduplicationEngine::getEstimatedFalsePositiveRate() const {
    std::lock_guard<std::mutex> lock(mtx);
    return bloom.estimatedFalsePositiveRate(totalRegistered);
}

size_t DeduplicationEngine::getMemoryFootprintBytes() const {
    std::lock_guard<std::mutex> lock(mtx);
    size_t bloomBytes = (bloom.getBitSize() + 7) / 8;
    size_t hashSetBytes = exactHashes.size() * (sizeof(std::string) + 64 + 16); // approximate node overhead
    return bloomBytes + hashSetBytes;
}
