#include "bloom_filter.h"
#include <cmath>

BloomFilter::BloomFilter(size_t sizeBits, size_t numHashes)
    : bitSize(sizeBits), numHashes(numHashes), bits((sizeBits + 7) / 8, 0) {}

// FNV-1a 64-bit hash
uint64_t BloomFilter::hash1(const std::string& s) const {
    uint64_t hash = 14695981039346656037ULL;
    for (char c : s) {
        hash ^= static_cast<uint8_t>(c);
        hash *= 1099511628211ULL;
    }
    return hash;
}

// Murmur-like mixing hash
uint64_t BloomFilter::hash2(const std::string& s) const {
    uint64_t hash = 0xcbf29ce484222325ULL;
    for (char c : s) {
        hash = (hash ^ static_cast<uint8_t>(c)) * 0x5bd1e9955bd1e995ULL;
        hash ^= hash >> 33;
    }
    return hash;
}

void BloomFilter::add(const std::string& item) {
    uint64_t h1 = hash1(item);
    uint64_t h2 = hash2(item);

    for (size_t i = 0; i < numHashes; i++) {
        uint64_t combined = (h1 + i * h2) % bitSize;
        bits[combined / 8] |= (1 << (combined % 8));
    }
}

bool BloomFilter::possiblyContains(const std::string& item) const {
    uint64_t h1 = hash1(item);
    uint64_t h2 = hash2(item);

    for (size_t i = 0; i < numHashes; i++) {
        uint64_t combined = (h1 + i * h2) % bitSize;
        if (!(bits[combined / 8] & (1 << (combined % 8)))) {
            return false; // Definitely not present
        }
    }
    return true; // Possibly present
}

void BloomFilter::clear() {
    std::fill(bits.begin(), bits.end(), 0);
}

double BloomFilter::estimatedFalsePositiveRate(size_t insertedCount) const {
    if (insertedCount == 0) return 0.0;
    double exponent = -static_cast<double>(numHashes * insertedCount) / static_cast<double>(bitSize);
    return std::pow(1.0 - std::exp(exponent), static_cast<double>(numHashes));
}
