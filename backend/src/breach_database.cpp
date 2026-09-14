#include "breach_database.h"
#include "sha256.h"
#include <algorithm>
#include <cctype>

BreachAuditor::BreachAuditor() : totalEntries(0) {
    populateCommonBreaches();
}

void BreachAuditor::addBreach(const std::string& plaintext, int count) {
    std::string hash = SHA256::hash(plaintext);
    std::string prefix = hash.substr(0, 5);
    std::string suffix = hash.substr(5);

    // Normalize to uppercase
    std::transform(prefix.begin(), prefix.end(), prefix.begin(), [](unsigned char c){ return std::toupper(c); });
    std::transform(suffix.begin(), suffix.end(), suffix.begin(), [](unsigned char c){ return std::toupper(c); });

    prefixMap[prefix].push_back({suffix, count});
    totalEntries++;
}

std::vector<std::pair<std::string, int>> BreachAuditor::queryPrefix(const std::string& prefix5) const {
    std::string norm = prefix5;
    std::transform(norm.begin(), norm.end(), norm.begin(), [](unsigned char c){ return std::toupper(c); });

    auto it = prefixMap.find(norm);
    if (it != prefixMap.end()) {
        return it->second;
    }
    return {};
}

BreachMatchResult BreachAuditor::checkPassword(const std::string& password) const {
    std::string hash = SHA256::hash(password);
    std::string prefix = hash.substr(0, 5);
    std::string suffix = hash.substr(5);

    std::transform(prefix.begin(), prefix.end(), prefix.begin(), [](unsigned char c){ return std::toupper(c); });
    std::transform(suffix.begin(), suffix.end(), suffix.begin(), [](unsigned char c){ return std::toupper(c); });

    auto matches = queryPrefix(prefix);
    for (const auto& match : matches) {
        if (match.first == suffix) {
            return {true, hash, match.second};
        }
    }
    return {false, hash, 0};
}

void BreachAuditor::populateCommonBreaches() {
    // Curated high-impact real-world breach dictionary (RockYou / SecLists standard)
    const std::vector<std::pair<std::string, int>> leaks = {
        {"123456", 28315124},
        {"password", 15286438},
        {"123456789", 11245620},
        {"12345", 8745230},
        {"qwerty", 7421890},
        {"12345678", 5432190},
        {"111111", 4982100},
        {"1234567", 3892100},
        {"dragon", 2841000},
        {"welcome", 2490100},
        {"ninja", 2189000},
        {"admin", 1982000},
        {"football", 1874000},
        {"monkey", 1782000},
        {"iloveyou", 1690000},
        {"starwars", 1540000},
        {"sunshine", 1430000},
        {"princess", 1390000},
        {"solo", 1290000},
        {"master", 1240000},
        {"letmein", 1190000},
        {"superman", 1120000},
        {"secret", 980000},
        {"login", 940000},
        {"abc123", 890000},
        {"killer", 850000},
        {"shadow", 820000},
        {"trustno1", 790000},
        {"password1", 760000},
        {"password123", 720000},
        {"charlie", 690000},
        {"robert", 670000},
        {"thomas", 650000},
        {"hacker", 630000},
        {"server", 610000},
        {"jordan", 590000},
        {"daniel", 580000},
        {"merlin", 560000},
        {"hockey", 540000},
        {"batman", 520000},
        {"hunter2", 490000},
        {"phoenix", 480000},
        {"freedom", 460000},
        {"summer", 440000},
        {"winter", 420000},
        {"flower", 410000},
        {"orange", 390000},
        {"coffee", 380000},
        {"system", 370000},
        {"test", 360000},
        {"computer", 350000},
        {"matrix", 340000},
        {"access", 330000},
        {"online", 320000},
        {"secure", 310000},
        {"root", 300000}
    };

    for (const auto& item : leaks) {
        addBreach(item.first, item.second);
    }
}
