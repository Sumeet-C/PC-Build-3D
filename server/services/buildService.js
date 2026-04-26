// ─── Build Generator Service ────────────────────────────────────────────────
// Contains logic for generating compatible PC builds based on purpose/budget
// and computing build summaries.

/**
 * Choose a random element from an array.
 */
function pickRandom(arr) {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Pick the best item within budget, preferring higher performanceScore.
 * Falls back to the cheapest item if nothing fits the remaining budget.
 */
function pickBest(items, remainingBudget) {
  const affordable = items.filter((i) => i.price <= remainingBudget);
  if (affordable.length === 0) {
    // fallback: pick cheapest overall
    const sorted = [...items].sort((a, b) => a.price - b.price);
    return sorted[0] || null;
  }
  affordable.sort((a, b) => b.performanceScore - a.performanceScore);
  return affordable[0];
}

/**
 * Generate a compatible PC build from the component catalog.
 *
 * @param {Array} allComponents - Full component list
 * @param {Object} options - { budget: number, purpose: 'budget'|'gaming'|'workstation' }
 * @returns {Object} - { build, summary }
 */
export function generateBuild(allComponents, options = {}) {
  const { budget = 1500, purpose = 'gaming' } = options;

  // Partition components by type
  const byType = {};
  for (const c of allComponents) {
    const t = c.type;
    if (!byType[t]) byType[t] = [];
    byType[t].push(c);
  }

  // Score multipliers per purpose (bias which categories get more budget share)
  const purposeWeights = {
    budget: { CPU: 0.8, GPU: 0.7, RAM: 0.5, Storage: 0.4, Cooling: 0.4 },
    gaming: { CPU: 1.0, GPU: 1.5, RAM: 0.8, Storage: 0.7, Cooling: 0.7 },
    workstation: { CPU: 1.5, GPU: 1.0, RAM: 1.2, Storage: 1.0, Cooling: 0.9 },
  };
  const weights = purposeWeights[purpose] || purposeWeights.gaming;

  let remaining = budget;
  const build = {};

  // 1. Pick CPU (weighted by purpose)
  const cpus = (byType['CPU'] || []).map((c) => ({
    ...c,
    _score: c.performanceScore * (weights.CPU || 1),
  }));
  cpus.sort((a, b) => b._score - a._score);
  build.CPU = pickBest(cpus, remaining * 0.25);
  remaining -= build.CPU?.price || 0;

  // 2. Pick compatible Motherboard (must match CPU socket)
  const cpuSocket = build.CPU?.socket;
  const compatibleMobos = (byType['Motherboard'] || []).filter(
    (m) => m.socket === cpuSocket,
  );
  build.Motherboard = pickBest(compatibleMobos, remaining * 0.2);
  remaining -= build.Motherboard?.price || 0;

  // 3. Pick compatible RAM (must match motherboard ramType)
  const ramType = build.Motherboard?.ramType;
  const compatibleRAM = (byType['RAM'] || []).filter(
    (r) => r.ramType === ramType,
  );
  build.RAM = pickBest(compatibleRAM, remaining * 0.15);
  remaining -= build.RAM?.price || 0;

  // 4. Pick Case first (need maxGpuLengthMm for GPU check)
  // Try to match form factor to motherboard
  const moboFF = build.Motherboard?.formFactor;
  let compatibleCases = (byType['Case'] || []).filter((c) => {
    if (moboFF === 'ATX') return c.formFactor === 'ATX';
    return true; // mATX fits in ATX or mATX cases
  });
  if (compatibleCases.length === 0) compatibleCases = byType['Case'] || [];
  build.Case = pickBest(compatibleCases, remaining * 0.12);
  remaining -= build.Case?.price || 0;

  // 5. Pick GPU that fits in case
  const maxGpuLen = build.Case?.maxGpuLengthMm || 999;
  const compatibleGPUs = (byType['GPU'] || [])
    .filter((g) => g.lengthMm <= maxGpuLen)
    .map((g) => ({
      ...g,
      _score: g.performanceScore * (weights.GPU || 1),
    }));
  compatibleGPUs.sort((a, b) => b._score - a._score);
  build.GPU = pickBest(compatibleGPUs, remaining * 0.45);
  remaining -= build.GPU?.price || 0;

  // 6. Pick Storage
  build.Storage = pickBest(byType['Storage'] || [], remaining * 0.15);
  remaining -= build.Storage?.price || 0;

  // 7. Pick Cooling (must support CPU socket)
  const compatibleCooling = (byType['Cooling'] || []).filter((c) =>
    (c.socketSupport || []).includes(cpuSocket),
  );
  build.Cooling = pickBest(
    compatibleCooling.length > 0 ? compatibleCooling : byType['Cooling'] || [],
    remaining * 0.3,
  );
  remaining -= build.Cooling?.price || 0;

  // 8. Calculate total wattage and recommend PSU with 20-30% buffer
  const totalWattage = Object.values(build).reduce(
    (sum, c) => sum + (c?.wattage || 0),
    0,
  );
  const recommendedPSUWattage = Math.ceil(totalWattage * 1.25); // 25% buffer

  // Pick PSU that covers recommended wattage
  const suitablePSUs = (byType['PSU'] || [])
    .filter((p) => p.capacityWatts >= recommendedPSUWattage)
    .sort((a, b) => a.capacityWatts - b.capacityWatts);
  build.PSU = suitablePSUs[0] || pickBest(byType['PSU'] || [], remaining);

  // Build summary
  const summary = computeSummary(build);
  summary.recommendedPSUWattage = recommendedPSUWattage;

  return { build, summary };
}

/**
 * Compute summary stats for a given build object.
 */
export function computeSummary(build) {
  let totalPower = 0;
  let totalPrice = 0;
  let totalPerf = 0;
  let partCount = 0;

  for (const part of Object.values(build)) {
    if (!part) continue;
    totalPower += part.wattage || 0;
    totalPrice += part.price || 0;
    totalPerf += part.performanceScore || 0;
    partCount++;
  }

  const avgPerf = partCount > 0 ? totalPerf / partCount : 0;

  let performanceCategory = 'Entry-level';
  if (avgPerf >= 70) performanceCategory = 'High-end';
  else if (avgPerf >= 45) performanceCategory = 'Mid-range';

  // Recommend PSU wattage with 25% buffer
  const recommendedPSUWattage = Math.ceil(totalPower * 1.25);

  // Compatibility checks
  const issues = [];
  if (build.CPU && build.Motherboard) {
    if (build.CPU.socket !== build.Motherboard.socket) {
      issues.push(
        `CPU socket (${build.CPU.socket}) ≠ Motherboard socket (${build.Motherboard.socket})`,
      );
    }
  }
  if (build.RAM && build.Motherboard) {
    if (build.RAM.ramType !== build.Motherboard.ramType) {
      issues.push(
        `RAM type (${build.RAM.ramType}) ≠ Motherboard RAM type (${build.Motherboard.ramType})`,
      );
    }
  }
  if (build.GPU && build.Case) {
    if (build.GPU.lengthMm > build.Case.maxGpuLengthMm) {
      issues.push(
        `GPU length (${build.GPU.lengthMm}mm) exceeds case max (${build.Case.maxGpuLengthMm}mm)`,
      );
    }
  }
  if (build.PSU) {
    if (build.PSU.capacityWatts < totalPower) {
      issues.push(
        `PSU capacity (${build.PSU.capacityWatts}W) below total draw (${totalPower}W)`,
      );
    }
  }
  if (build.Cooling && build.CPU) {
    if (
      build.Cooling.socketSupport &&
      !build.Cooling.socketSupport.includes(build.CPU.socket)
    ) {
      issues.push(
        `Cooler does not support CPU socket (${build.CPU.socket})`,
      );
    }
  }

  return {
    totalPower,
    totalPrice,
    recommendedPSUWattage,
    performanceCategory,
    averagePerformance: Math.round(avgPerf),
    compatibilityIssues: issues,
    isCompatible: issues.length === 0,
  };
}
