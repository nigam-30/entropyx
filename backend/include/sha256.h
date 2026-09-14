#ifndef SHA256_H
#define SHA256_H

#include <string>
#include <vector>
#include <cstdint>

class SHA256 {
public:
    SHA256();
    void update(const uint8_t* data, size_t length);
    void update(const std::string& data);
    std::string finalize();

    static std::string hash(const std::string& input);

private:
    uint32_t state[8];
    uint64_t bitCount;
    uint8_t buffer[64];

    void transform(const uint8_t chunk[64]);
};

#endif // SHA256_H
