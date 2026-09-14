#ifndef GENERATOR_H
#define GENERATOR_H

#include <string>
#include <vector>
#include <cstdint>

struct GeneratorOptions {
    int length = 16;
    bool includeUpper = true;
    bool includeLower = true;
    bool includeNumbers = true;
    bool includeSymbols = true;
    bool avoidAmbiguous = true;
};

struct PassphraseOptions {
    int wordCount = 4;
    std::string separator = "-";
    bool capitalize = true;
    bool includeNumber = true;
};

class PasswordEngine {
public:
    PasswordEngine();
    ~PasswordEngine();

    // CSPRNG
    uint32_t getRandomUint32();
    uint32_t getRandomInt(uint32_t max); // Unbiased rejection sampling

    // Password generation
    std::string generatePassword(const GeneratorOptions& opts, size_t& outPoolSize);

    // Passphrase generation (XKCD / Diceware style)
    std::string generatePassphrase(const PassphraseOptions& opts);

    // Secure memory zeroization
    static void secureWipe(std::string& str);

private:
    void* hCryptProv; // HCRYPTPROV handle for Windows CryptoAPI
    std::vector<std::string> wordlist;

    void initWordlist();
};

#endif // GENERATOR_H
