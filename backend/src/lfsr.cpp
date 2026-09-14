#include "lfsr.h"
#include <bitset>
#include <iomanip>
#include <sstream>

GaloisLfsrHardwareModel::GaloisLfsrHardwareModel(uint32_t seed) {
    reset(seed);
}

void GaloisLfsrHardwareModel::reset(uint32_t seed) {
    state = (seed == 0) ? 0xACE1ACE1 : seed;
}

// Bit-level clock transition: state = (state >> 1) ^ (-(state & 1) & MASK)
// Constant-time execution: avoids conditional branching on secret bits (side-channel safe)
uint32_t GaloisLfsrHardwareModel::step() {
    uint32_t lsb = state & 1;
    state >>= 1;
    // Branchless XOR feedback
    state ^= (-static_cast<int32_t>(lsb)) & mask;
    return state;
}

uint8_t GaloisLfsrHardwareModel::stepBit() {
    uint8_t bit = static_cast<uint8_t>(state & 1);
    step();
    return bit;
}

std::vector<LfsrCycleTrace> GaloisLfsrHardwareModel::simulateTrace(size_t numCycles) {
    std::vector<LfsrCycleTrace> trace;
    trace.reserve(numCycles);

    for (size_t i = 1; i <= numCycles; i++) {
        uint8_t outBit = static_cast<uint8_t>(state & 1);
        step();

        LfsrCycleTrace item;
        item.cycle = static_cast<uint32_t>(i);
        item.stateHex = state;
        item.stateBin = std::bitset<32>(state).to_string();
        item.outputBit = outBit;
        trace.push_back(item);
    }

    return trace;
}
