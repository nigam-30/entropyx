#ifndef LFSR_H
#define LFSR_H

#include <cstdint>
#include <vector>
#include <string>

struct LfsrCycleTrace {
    uint32_t cycle;
    uint32_t stateHex;
    std::string stateBin;
    uint8_t outputBit;
};

class GaloisLfsrHardwareModel {
public:
    // Standard maximal-length 32-bit primitive polynomial: x^32 + x^22 + x^2 + x^1 + 1
    // Characteristic feedback mask: 0x80200003
    GaloisLfsrHardwareModel(uint32_t seed = 0x5A5AA5A5);

    void reset(uint32_t seed);
    uint32_t step(); // Advances 1 clock cycle, returns new state
    uint8_t stepBit(); // Returns 1 pseudo-random bit per clock

    // Cycle-accurate simulation trace for VLSI functional verification
    std::vector<LfsrCycleTrace> simulateTrace(size_t numCycles);

    uint32_t getCurrentState() const { return state; }
    static const char* getPolynomialExpression() { return "x^32 + x^22 + x^2 + x^1 + 1"; }
    static uint32_t getFeedbackMask() { return 0x80200003; }
    static uint64_t getMaximalPeriod() { return 4294967295ULL; } // 2^32 - 1

private:
    uint32_t state;
    const uint32_t mask = 0x80200003;
};

#endif // LFSR_H
