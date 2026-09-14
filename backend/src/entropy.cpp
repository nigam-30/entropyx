#include "entropy.h"
#include <cmath>
#include <algorithm>
#include <cctype>
#include <set>

double EntropyAnalyzer::calculateShannonEntropy(const std::string& password, size_t poolSize) {
    if (password.empty()) return 0.0;

    if (poolSize == 0) {
        bool hasUpper = false, hasLower = false, hasDigit = false, hasSpecial = false;
        for (char c : password) {
            if (std::isupper(static_cast<unsigned char>(c))) hasUpper = true;
            else if (std::islower(static_cast<unsigned char>(c))) hasLower = true;
            else if (std::isdigit(static_cast<unsigned char>(c))) hasDigit = true;
            else hasSpecial = true;
        }
        if (hasUpper) poolSize += 26;
        if (hasLower) poolSize += 26;
        if (hasDigit) poolSize += 10;
        if (hasSpecial) poolSize += 32;
        if (poolSize == 0) poolSize = 26;
    }

    return std::round(password.length() * (std::log(poolSize) / std::log(2.0)));
}

std::string EntropyAnalyzer::estimateCrackTime(double entropyBits) {
    // Standard fast offline GPU rig assumption: 10^10 guesses per second (10 billion/s)
    const double guessesPerSec = 1e10;
    double totalGuesses = std::pow(2.0, entropyBits) / 2.0; // average 50% search space
    double seconds = totalGuesses / guessesPerSec;

    if (seconds < 1.0) return "Instantly";
    if (seconds < 60.0) return std::to_string(static_cast<int>(seconds)) + " seconds";
    if (seconds < 3600.0) return std::to_string(static_cast<int>(seconds / 60.0)) + " minutes";
    if (seconds < 86400.0) return std::to_string(static_cast<int>(seconds / 3600.0)) + " hours";
    if (seconds < 2592000.0) return std::to_string(static_cast<int>(seconds / 86400.0)) + " days";
    if (seconds < 31536000.0) return std::to_string(static_cast<int>(seconds / 2592000.0)) + " months";
    if (seconds < 31536000.0 * 100.0) return std::to_string(static_cast<int>(seconds / 31536000.0)) + " years";
    if (seconds < 31536000.0 * 1000000.0) return std::to_string(static_cast<int>(seconds / (31536000.0 * 1000.0))) + " thousand years";
    if (seconds < 31536000.0 * 1000000000.0) return std::to_string(static_cast<int>(seconds / (31536000.0 * 1000000.0))) + " million years";
    return "Centuries+";
}

std::vector<std::string> EntropyAnalyzer::detectKeyboardWalks(const std::string& password) {
    std::vector<std::string> warnings;
    std::string lower = password;
    std::transform(lower.begin(), lower.end(), lower.begin(), [](unsigned char c){ return std::tolower(c); });

    const std::vector<std::string> walks = {
        "qwerty", "asdfgh", "zxcvbn", "123456", "654321", "qazwsx", "wsxedc", "!@#$%^"
    };

    for (const auto& walk : walks) {
        if (lower.find(walk) != std::string::npos) {
            warnings.push_back("Contains spatial keyboard pattern: '" + walk + "'");
        }
    }
    return warnings;
}

std::vector<std::string> EntropyAnalyzer::detectSequences(const std::string& password) {
    std::vector<std::string> warnings;
    if (password.length() < 3) return warnings;

    int ascCount = 1, descCount = 1;
    for (size_t i = 1; i < password.length(); i++) {
        char prev = std::tolower(static_cast<unsigned char>(password[i - 1]));
        char curr = std::tolower(static_cast<unsigned char>(password[i]));

        if (curr == prev + 1) {
            ascCount++;
            if (ascCount >= 4) {
                warnings.push_back("Contains sequential run: " + password.substr(i - 3, 4));
                break;
            }
        } else {
            ascCount = 1;
        }

        if (curr == prev - 1) {
            descCount++;
            if (descCount >= 4) {
                warnings.push_back("Contains reverse sequential run: " + password.substr(i - 3, 4));
                break;
            }
        } else {
            descCount = 1;
        }
    }
    return warnings;
}

std::vector<std::string> EntropyAnalyzer::detectRepetitions(const std::string& password) {
    std::vector<std::string> warnings;
    int repeatCount = 1;
    for (size_t i = 1; i < password.length(); i++) {
        if (password[i] == password[i - 1]) {
            repeatCount++;
            if (repeatCount >= 3) {
                warnings.push_back(std::string("Contains repeated characters: '") + password[i] + "'");
                break;
            }
        } else {
            repeatCount = 1;
        }
    }
    return warnings;
}

AnalysisResult EntropyAnalyzer::analyze(const std::string& password, size_t poolSize) {
    AnalysisResult res;
    res.entropy = calculateShannonEntropy(password, poolSize);
    res.crackTime = estimateCrackTime(res.entropy);

    if (res.entropy < 40.0) {
        res.strength = "Weak";
    } else if (res.entropy < 65.0) {
        res.strength = "Fair";
    } else if (res.entropy < 80.0) {
        res.strength = "Strong";
    } else {
        res.strength = "Very Strong";
    }

    auto walks = detectKeyboardWalks(password);
    auto seqs = detectSequences(password);
    auto reps = detectRepetitions(password);

    res.warnings.insert(res.warnings.end(), walks.begin(), walks.end());
    res.warnings.insert(res.warnings.end(), seqs.begin(), seqs.end());
    res.warnings.insert(res.warnings.end(), reps.begin(), reps.end());

    res.meetsNistStandard = (password.length() >= 8 && res.entropy >= 50.0 && res.warnings.empty());

    if (password.length() < 12) {
        res.suggestions.push_back("Increase length to at least 14 characters for enhanced safety.");
    }
    if (res.warnings.size() > 0) {
        res.suggestions.push_back("Avoid predictable keyboard paths and sequential numbers/letters.");
    }

    return res;
}
