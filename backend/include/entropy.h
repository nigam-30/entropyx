#ifndef ENTROPY_H
#define ENTROPY_H

#include <string>
#include <vector>

struct AnalysisResult {
    double entropy;
    std::string strength;     // "Weak", "Fair", "Strong", "Very Strong"
    std::string crackTime;
    std::vector<std::string> warnings;
    std::vector<std::string> suggestions;
    bool meetsNistStandard;
};

class EntropyAnalyzer {
public:
    static AnalysisResult analyze(const std::string& password, size_t poolSize = 0);
    static double calculateShannonEntropy(const std::string& password, size_t poolSize);
    static std::string estimateCrackTime(double entropyBits);

private:
    static std::vector<std::string> detectKeyboardWalks(const std::string& password);
    static std::vector<std::string> detectSequences(const std::string& password);
    static std::vector<std::string> detectRepetitions(const std::string& password);
};

#endif // ENTROPY_H
