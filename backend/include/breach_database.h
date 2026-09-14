#ifndef BREACH_DATABASE_H
#define BREACH_DATABASE_H

#include <string>
#include <vector>
#include <unordered_map>

struct BreachMatchResult {
    bool isBreached;
    std::string matchedHash;
    int frequencyCount;
};

class BreachAuditor {
public:
    BreachAuditor();

    // k-Anonymity check: client provides 5-character prefix
    // server returns all matching suffixes in the database
    std::vector<std::pair<std::string, int>> queryPrefix(const std::string& prefix5) const;

    // Direct check helper (computes SHA-256 and queries)
    BreachMatchResult checkPassword(const std::string& password) const;

    size_t getKnownBreachCount() const { return totalEntries; }

private:
    // Key: 5-char hex prefix -> Vector of (suffix, frequency count)
    std::unordered_map<std::string, std::vector<std::pair<std::string, int>>> prefixMap;
    size_t totalEntries;

    void populateCommonBreaches();
    void addBreach(const std::string& plaintext, int count);
};

#endif // BREACH_DATABASE_H
