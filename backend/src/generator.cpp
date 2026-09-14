#include "generator.h"
#include <windows.h>
#include <wincrypt.h>
#include <random>
#include <algorithm>
#include <sstream>

namespace {
    const std::string UPPER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const std::string LOWER_CHARS = "abcdefghijklmnopqrstuvwxyz";
    const std::string DIGIT_CHARS = "0123456789";
    const std::string SYMBOL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const std::string AMBIGUOUS_CHARS = "l1IO0";

    std::string removeAmbiguous(const std::string& source) {
        std::string res = "";
        for (char c : source) {
            if (AMBIGUOUS_CHARS.find(c) == std::string::npos) {
                res += c;
            }
        }
        return res;
    }
}

PasswordEngine::PasswordEngine() : hCryptProv(nullptr) {
    HCRYPTPROV prov = 0;
    if (CryptAcquireContextA(&prov, NULL, NULL, PROV_RSA_FULL, CRYPT_VERIFYCONTEXT | CRYPT_SILENT)) {
        hCryptProv = reinterpret_cast<void*>(prov);
    }
    initWordlist();
}

PasswordEngine::~PasswordEngine() {
    if (hCryptProv) {
        HCRYPTPROV prov = reinterpret_cast<HCRYPTPROV>(hCryptProv);
        CryptReleaseContext(prov, 0);
        hCryptProv = nullptr;
    }
}

uint32_t PasswordEngine::getRandomUint32() {
    if (hCryptProv) {
        uint32_t val = 0;
        HCRYPTPROV prov = reinterpret_cast<HCRYPTPROV>(hCryptProv);
        if (CryptGenRandom(prov, sizeof(val), reinterpret_cast<BYTE*>(&val))) {
            return val;
        }
    }

    // Fallback to std::random_device
    static thread_local std::random_device rd;
    return rd();
}

// Unbiased rejection sampling: prevents modulo bias
uint32_t PasswordEngine::getRandomInt(uint32_t max) {
    if (max <= 1) return 0;
    const uint64_t range = 0x100000000ULL;
    const uint64_t limit = range - (range % max);

    while (true) {
        uint32_t val = getRandomUint32();
        if (static_cast<uint64_t>(val) < limit) {
            return val % max;
        }
    }
}

std::string PasswordEngine::generatePassword(const GeneratorOptions& opts, size_t& outPoolSize) {
    int length = (opts.length < 4) ? 16 : (opts.length > 128 ? 128 : opts.length);

    std::vector<std::string> activePools;
    if (opts.includeUpper) {
        activePools.push_back(opts.avoidAmbiguous ? removeAmbiguous(UPPER_CHARS) : UPPER_CHARS);
    }
    if (opts.includeLower) {
        activePools.push_back(opts.avoidAmbiguous ? removeAmbiguous(LOWER_CHARS) : LOWER_CHARS);
    }
    if (opts.includeNumbers) {
        activePools.push_back(opts.avoidAmbiguous ? removeAmbiguous(DIGIT_CHARS) : DIGIT_CHARS);
    }
    if (opts.includeSymbols) {
        activePools.push_back(opts.avoidAmbiguous ? removeAmbiguous(SYMBOL_CHARS) : SYMBOL_CHARS);
    }

    if (activePools.empty()) {
        activePools.push_back(LOWER_CHARS);
    }

    std::string combinedPool = "";
    for (const auto& pool : activePools) {
        combinedPool += pool;
    }
    outPoolSize = combinedPool.length();

    std::vector<char> chars;
    chars.reserve(length);

    // Guaranteed inclusion of at least one char from each active pool
    for (const auto& pool : activePools) {
        if (!pool.empty() && static_cast<int>(chars.size()) < length) {
            chars.push_back(pool[getRandomInt(static_cast<uint32_t>(pool.length()))]);
        }
    }

    // Fill the rest from the combined pool
    while (static_cast<int>(chars.size()) < length) {
        chars.push_back(combinedPool[getRandomInt(static_cast<uint32_t>(combinedPool.length()))]);
    }

    // Cryptographic Fisher-Yates shuffle
    for (int i = static_cast<int>(chars.size()) - 1; i > 0; i--) {
        int j = getRandomInt(i + 1);
        std::swap(chars[i], chars[j]);
    }

    return std::string(chars.begin(), chars.end());
}

std::string PasswordEngine::generatePassphrase(const PassphraseOptions& opts) {
    int count = (opts.wordCount < 2) ? 4 : (opts.wordCount > 10 ? 10 : opts.wordCount);
    std::string result = "";

    for (int i = 0; i < count; i++) {
        uint32_t idx = getRandomInt(static_cast<uint32_t>(wordlist.size()));
        std::string word = wordlist[idx];

        if (opts.capitalize && !word.empty()) {
            word[0] = static_cast<char>(std::toupper(static_cast<unsigned char>(word[0])));
        }

        result += word;
        if (i < count - 1) {
            result += opts.separator;
        }
    }

    if (opts.includeNumber) {
        uint32_t num = getRandomInt(900) + 100; // 3-digit number
        result += opts.separator + std::to_string(num);
    }

    return result;
}

void PasswordEngine::secureWipe(std::string& str) {
    if (!str.empty()) {
        SecureZeroMemory(&str[0], str.size());
        str.clear();
    }
}

void PasswordEngine::initWordlist() {
    // Curated high-entropy Diceware wordlist
    wordlist = {
        "alpha", "anchor", "arrow", "beacon", "breeze", "bridge", "bronze", "canyon",
        "castle", "cedar", "cipher", "cliff", "cobalt", "comet", "compass", "copper",
        "coral", "cosmos", "crater", "crystal", "delta", "drift", "dynamo", "echo",
        "ember", "falcon", "fathom", "feather", "flint", "forest", "fossil", "frost",
        "galaxy", "garnet", "glacier", "granite", "harbor", "haven", "helix", "horizon",
        "island", "jasper", "javelin", "kernel", "kinetic", "lagoon", "lantern", "legend",
        "matrix", "meadow", "meteor", "mirage", "monolith", "nebula", "nexus", "oasis",
        "obsidian", "ocean", "orbit", "peak", "pebble", "phoenix", "pioneer", "plasma",
        "polaris", "prism", "pulsar", "quantum", "quartz", "radar", "radiant", "rapids",
        "ravine", "ripple", "rocket", "ruby", "saber", "sahara", "saturn", "shadow",
        "shield", "sierra", "signal", "silver", "solstice", "spark", "spectrum", "spiral",
        "strata", "summit", "talisman", "titan", "topaz", "torrent", "tracer", "tropic",
        "tsunami", "tundra", "twilight", "valence", "valley", "vector", "velocity", "veritas",
        "vertex", "vessel", "vortex", "voyage", "wave", "whisper", "wildfire", "zenith"
    };
}
