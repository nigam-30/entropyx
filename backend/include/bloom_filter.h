#ifndef BLOOM_FILTER_H
#define BLOOM_FILTER_H

#include <vector>
#include <string>
#include <cstdint>
#include <cstddef>

class BloomFilter {
public:
    // Default 1,000,000 bits (~125KB RAM) with 7 hash functions (optimal for ~100k elements at <1% false positive)
    BloomFilter(size_t sizeBits = 1000000, size_t numHashes = 7);

    void add(const std::string& item);
    bool possiblyContains(const std::string& item) const;
    void clear();

    size_t getBitSize() const { return bitSize; }
    size_t getHashCount() const { return numHashes; }
    double estimatedFalsePositiveRate(size_t insertedCount) const;

private:
    size_t bitSize;
    size_t numHashes;
    std::vector<uint8_t> bits;

    uint64_t hash1(const std::string& s) const;
    uint64_t hash2(const std::string& s) const;
};

#endif // BLOOM_FILTER_H
