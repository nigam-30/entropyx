#include "server.h"
#include "generator.h"
#include "entropy.h"
#include "deduplication.h"
#include "sha256.h"
#include "breach_database.h"
#include "lfsr.h"
#include <chrono>
#include <cmath>
#include <thread>
#include <future>
#include <iomanip>
#include <sstream>

namespace {
    // Simple JSON helpers
    std::string escapeJson(const std::string& s) {
        std::ostringstream o;
        for (char c : s) {
            if (c == '"') o << "\\\"";
            else if (c == '\\') o << "\\\\";
            else if (c == '\b') o << "\\b";
            else if (c == '\f') o << "\\f";
            else if (c == '\n') o << "\\n";
            else if (c == '\r') o << "\\r";
            else if (c == '\t') o << "\\t";
            else if (static_cast<unsigned char>(c) <= 0x1f) {
                o << "\\u" << std::hex << std::setw(4) << std::setfill('0') << static_cast<int>(c);
            } else {
                o << c;
            }
        }
        return o.str();
    }

    std::string getJsonStringField(const std::string& json, const std::string& key, const std::string& defaultVal = "") {
        std::string search = "\"" + key + "\"";
        size_t pos = json.find(search);
        if (pos == std::string::npos) return defaultVal;

        pos = json.find(':', pos);
        if (pos == std::string::npos) return defaultVal;

        size_t startQuote = json.find('"', pos);
        if (startQuote == std::string::npos) return defaultVal;

        size_t endQuote = json.find('"', startQuote + 1);
        if (endQuote == std::string::npos) return defaultVal;

        return json.substr(startQuote + 1, endQuote - startQuote - 1);
    }

    int getJsonIntField(const std::string& json, const std::string& key, int defaultVal = 0) {
        std::string search = "\"" + key + "\"";
        size_t pos = json.find(search);
        if (pos == std::string::npos) return defaultVal;

        pos = json.find(':', pos);
        if (pos == std::string::npos) return defaultVal;

        while (pos < json.size() && (json[pos] == ':' || json[pos] == ' ' || json[pos] == '\t')) pos++;
        
        try {
            return std::stoi(json.substr(pos));
        } catch (...) {
            return defaultVal;
        }
    }

    bool getJsonBoolField(const std::string& json, const std::string& key, bool defaultVal = true) {
        std::string search = "\"" + key + "\"";
        size_t pos = json.find(search);
        if (pos == std::string::npos) return defaultVal;

        pos = json.find(':', pos);
        if (pos == std::string::npos) return defaultVal;

        while (pos < json.size() && (json[pos] == ':' || json[pos] == ' ' || json[pos] == '\t')) pos++;
        if (json.substr(pos, 4) == "true") return true;
        if (json.substr(pos, 5) == "false") return false;
        return defaultVal;
    }
}

int main(int argc, char* argv[]) {
    int port = 8080;
    if (argc > 1) {
        try {
            port = std::stoi(argv[1]);
        } catch (...) {}
    }

    std::cout << "========================================================\n";
    std::cout << "  CryptoKey: High-Performance C++ Security Microservice \n";
    std::cout << "  Zero-Collision Global Deduplication (Bloom + SHA256)  \n";
    std::cout << "========================================================\n";

    PasswordEngine engine;
    DeduplicationEngine dedup("data/history_hashes.bin");
    BreachAuditor breachAuditor;
    GaloisLfsrHardwareModel lfsrModel;

    std::cout << "[Init] Loaded " << dedup.getTotalUniqueCount() 
              << " historical password signatures into Bloom Filter.\n";
    std::cout << "[Init] Initialized Offline Breach Database (" << breachAuditor.getKnownBreachCount() 
              << " signatures) and 32-bit Galois LFSR Hardware Model.\n";

    SimpleHttpServer server(port);

    // Route: GET /api/health
    server.addRoute("GET", "/api/health", [&](const HttpRequest&) -> HttpResponse {
        std::ostringstream ss;
        ss << "{"
           << "\"status\":\"healthy\","
           << "\"engine\":\"C++14 Native Microservice\","
           << "\"totalUniqueTracked\":" << dedup.getTotalUniqueCount() << ","
           << "\"estimatedFalsePositiveRate\":" << dedup.getEstimatedFalsePositiveRate() << ","
           << "\"memoryFootprintBytes\":" << dedup.getMemoryFootprintBytes() << ","
           << "\"csprng\":\"Windows CryptoAPI CryptGenRandom\""
           << "}";
        return {200, "application/json", ss.str()};
    });

    // Route: POST /api/generate
    server.addRoute("POST", "/api/generate", [&](const HttpRequest& req) -> HttpResponse {
        GeneratorOptions opts;
        opts.length = getJsonIntField(req.body, "length", 16);
        opts.includeUpper = getJsonBoolField(req.body, "upper", true);
        opts.includeLower = getJsonBoolField(req.body, "lower", true);
        opts.includeNumbers = getJsonBoolField(req.body, "numbers", true);
        opts.includeSymbols = getJsonBoolField(req.body, "symbols", true);
        opts.avoidAmbiguous = getJsonBoolField(req.body, "avoidAmbiguous", true);

        size_t poolSize = 0;
        std::string hash = "";
        int attempts = 0;

        auto tStart = std::chrono::high_resolution_clock::now();
        std::string password = dedup.generateUnique(engine, opts, poolSize, hash, attempts);
        auto tEnd = std::chrono::high_resolution_clock::now();
        double latencyMicroseconds = std::chrono::duration<double, std::micro>(tEnd - tStart).count();

        AnalysisResult analysis = EntropyAnalyzer::analyze(password, poolSize);

        std::ostringstream ss;
        ss << "{"
           << "\"password\":\"" << escapeJson(password) << "\","
           << "\"sha256\":\"" << hash << "\","
           << "\"entropy\":" << analysis.entropy << ","
           << "\"strength\":\"" << analysis.strength << "\","
           << "\"crackTime\":\"" << escapeJson(analysis.crackTime) << "\","
           << "\"poolSize\":" << poolSize << ","
           << "\"isUniqueVerified\":true,"
           << "\"attemptsRequired\":" << attempts << ","
           << "\"generationLatencyUs\":" << latencyMicroseconds << ","
           << "\"totalUniqueGenerated\":" << dedup.getTotalUniqueCount() << ","
           << "\"meetsNistStandard\":" << (analysis.meetsNistStandard ? "true" : "false")
           << "}";

        return {200, "application/json", ss.str()};
    });

    // Route: POST /api/generate-passphrase
    server.addRoute("POST", "/api/generate-passphrase", [&](const HttpRequest& req) -> HttpResponse {
        PassphraseOptions opts;
        opts.wordCount = getJsonIntField(req.body, "wordCount", 5);
        opts.separator = getJsonStringField(req.body, "separator", "-");
        opts.capitalize = getJsonBoolField(req.body, "capitalize", true);
        opts.includeNumber = getJsonBoolField(req.body, "includeNumber", true);

        std::string hash = "";
        int attempts = 0;

        auto tStart = std::chrono::high_resolution_clock::now();
        std::string passphrase = dedup.generateUniquePassphrase(engine, opts, hash, attempts);
        auto tEnd = std::chrono::high_resolution_clock::now();
        double latencyMicroseconds = std::chrono::duration<double, std::micro>(tEnd - tStart).count();

        // Passphrase entropy: ~12.9 bits per Diceware word + numbers
        double entropy = opts.wordCount * 12.9 + (opts.includeNumber ? 9.9 : 0.0);
        std::string crackTime = EntropyAnalyzer::estimateCrackTime(entropy);

        std::ostringstream ss;
        ss << "{"
           << "\"passphrase\":\"" << escapeJson(passphrase) << "\","
           << "\"sha256\":\"" << hash << "\","
           << "\"entropy\":" << std::round(entropy) << ","
           << "\"strength\":\"" << (entropy >= 70.0 ? "Very Strong" : "Strong") << "\","
           << "\"crackTime\":\"" << escapeJson(crackTime) << "\","
           << "\"isUniqueVerified\":true,"
           << "\"attemptsRequired\":" << attempts << ","
           << "\"generationLatencyUs\":" << latencyMicroseconds << ","
           << "\"totalUniqueGenerated\":" << dedup.getTotalUniqueCount()
           << "}";

        return {200, "application/json", ss.str()};
    });

    // Route: POST /api/analyze
    server.addRoute("POST", "/api/analyze", [&](const HttpRequest& req) -> HttpResponse {
        std::string password = getJsonStringField(req.body, "password", "");
        if (password.empty()) {
            return {400, "application/json", "{\"error\":\"Missing password field\"}"};
        }

        AnalysisResult res = EntropyAnalyzer::analyze(password);

        std::ostringstream ss;
        ss << "{"
           << "\"entropy\":" << res.entropy << ","
           << "\"strength\":\"" << res.strength << "\","
           << "\"crackTime\":\"" << escapeJson(res.crackTime) << "\","
           << "\"meetsNistStandard\":" << (res.meetsNistStandard ? "true" : "false") << ","
           << "\"warnings\":[";
        for (size_t i = 0; i < res.warnings.size(); i++) {
            ss << "\"" << escapeJson(res.warnings[i]) << "\"" << (i + 1 < res.warnings.size() ? "," : "");
        }
        ss << "],\"suggestions\":[";
        for (size_t i = 0; i < res.suggestions.size(); i++) {
            ss << "\"" << escapeJson(res.suggestions[i]) << "\"" << (i + 1 < res.suggestions.size() ? "," : "");
        }
        ss << "]}";

        return {200, "application/json", ss.str()};
    });

    // Route: POST /api/benchmark (Multi-threaded C++ Throughput Benchmark)
    server.addRoute("POST", "/api/benchmark", [&](const HttpRequest& req) -> HttpResponse {
        int count = getJsonIntField(req.body, "count", 50000);
        if (count <= 0) count = 50000;
        if (count > 200000) count = 200000; // safe upper bound

        unsigned int hardwareThreads = std::thread::hardware_concurrency();
        int threads = (hardwareThreads > 0) ? hardwareThreads : 4;

        int perThread = count / threads;
        auto tStart = std::chrono::high_resolution_clock::now();

        std::vector<std::future<int>> futures;
        for (int t = 0; t < threads; t++) {
            futures.push_back(std::async(std::launch::async, [perThread]() -> int {
                PasswordEngine localEngine;
                GeneratorOptions opts;
                opts.length = 16;
                opts.includeUpper = true;
                opts.includeLower = true;
                opts.includeNumbers = true;
                opts.includeSymbols = true;
                size_t poolSize = 0;
                int generated = 0;

                for (int i = 0; i < perThread; i++) {
                    std::string p = localEngine.generatePassword(opts, poolSize);
                    generated += (p.length() > 0 ? 1 : 0);
                }
                return generated;
            }));
        }

        int totalGenerated = 0;
        for (auto& f : futures) {
            totalGenerated += f.get();
        }

        auto tEnd = std::chrono::high_resolution_clock::now();
        double durationMs = std::chrono::duration<double, std::milli>(tEnd - tStart).count();
        double throughput = (totalGenerated / (durationMs / 1000.0));

        std::ostringstream ss;
        ss << "{"
           << "\"batchSize\":" << totalGenerated << ","
           << "\"durationMs\":" << durationMs << ","
           << "\"passwordsPerSecond\":" << static_cast<uint64_t>(throughput) << ","
           << "\"threadsUsed\":" << threads << ","
           << "\"engine\":\"C++14 Multi-threaded Asynchronous Worker Pool\""
           << "}";

        return {200, "application/json", ss.str()};
    });

    // Route: POST /api/check-breach (Zero-Knowledge k-Anonymity Breach Auditor)
    server.addRoute("POST", "/api/check-breach", [&](const HttpRequest& req) -> HttpResponse {
        std::string password = getJsonStringField(req.body, "password", "");
        std::string prefix = getJsonStringField(req.body, "prefix", "");

        std::ostringstream ss;

        if (!prefix.empty()) {
            // k-Anonymity mode: client provided only 5-character prefix
            auto matches = breachAuditor.queryPrefix(prefix);
            ss << "{"
               << "\"prefix\":\"" << escapeJson(prefix) << "\","
               << "\"matches\":[";
            for (size_t i = 0; i < matches.size(); i++) {
                ss << "{\"suffix\":\"" << escapeJson(matches[i].first) << "\",\"count\":" << matches[i].second << "}"
                   << (i + 1 < matches.size() ? "," : "");
            }
            ss << "]}";
        } else if (!password.empty()) {
            // Direct check mode
            BreachMatchResult res = breachAuditor.checkPassword(password);
            ss << "{"
               << "\"isBreached\":" << (res.isBreached ? "true" : "false") << ","
               << "\"sha256\":\"" << res.matchedHash << "\","
               << "\"leakCount\":" << res.frequencyCount << ","
               << "\"verdict\":\"" << (res.isBreached ? "Vulnerable: Compromised in known breach database" : "Safe: No breach matches found") << "\""
               << "}";
        } else {
            return {400, "application/json", "{\"error\":\"Missing password or prefix field\"}"};
        }

        return {200, "application/json", ss.str()};
    });

    // Route: GET /api/vlsi-model (Galois LFSR Hardware RTL Simulation for VLSI reference)
    server.addRoute("GET", "/api/vlsi-model", [&](const HttpRequest&) -> HttpResponse {
        auto trace = lfsrModel.simulateTrace(16);

        std::ostringstream ss;
        ss << "{"
           << "\"architecture\":\"32-bit Galois LFSR Hardware RTL Reference Model\","
           << "\"polynomial\":\"" << GaloisLfsrHardwareModel::getPolynomialExpression() << "\","
           << "\"feedbackMaskHex\":\"0x80200003\","
           << "\"maximalCyclePeriod\":\"" << GaloisLfsrHardwareModel::getMaximalPeriod() << " cycles (2^32 - 1)\","
           << "\"clockCycles\":[";
        for (size_t i = 0; i < trace.size(); i++) {
            ss << "{"
               << "\"cycle\":" << trace[i].cycle << ","
               << "\"stateHex\":\"0x" << std::hex << trace[i].stateHex << std::dec << "\","
               << "\"stateBin\":\"" << trace[i].stateBin << "\","
               << "\"outputBit\":" << static_cast<int>(trace[i].outputBit)
               << "}" << (i + 1 < trace.size() ? "," : "");
        }
        ss << "]}";

        return {200, "application/json", ss.str()};
    });

    server.start();
    return 0;
}
