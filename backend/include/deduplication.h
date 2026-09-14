#ifndef DEDUPLICATION_H
#define DEDUPLICATION_H

#include "bloom_filter.h"
#include "generator.h"
#include <string>
#include <unordered_set>
#include <mutex>
#include <cstdint>

class DeduplicationEngine {
public:
    DeduplicationEngine(const std::string& storagePath = "data/history_hashes.bin");
    ~DeduplicationEngine();

    // Check if password has ever been generated before; if unique, registers it.
    // Returns true if unique and registered; returns false if collision was detected.
    bool checkAndRegister(const std::string& password, std::string& outSha256);

    // Guaranteed Unique Password Generation with automatic re-roll on collision
    std::string generateUnique(PasswordEngine& engine, const GeneratorOptions& opts,
                               size_t& outPoolSize, std::string& outHash, int& outAttempts);

    // Guaranteed Unique Passphrase Generation with automatic re-roll
    std::string generateUniquePassphrase(PasswordEngine& engine, const PassphraseOptions& opts,
                                         std::string& outHash, int& outAttempts);

    size_t getTotalUniqueCount() const;
    double getEstimatedFalsePositiveRate() const;
    size_t getMemoryFootprintBytes() const;

private:
    std::string storageFile;
    mutable std::mutex mtx;
    BloomFilter bloom;
    std::unordered_set<std::string> exactHashes;
    size_t totalRegistered;

    void loadFromDisk();
    void appendToDisk(const std::string& hash);
};

#endif // DEDUPLICATION_H
