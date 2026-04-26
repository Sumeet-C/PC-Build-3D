// ─── Build Generator Service (India Edition) ───────────────────────────────
// AI build generation and custom build validation.
// All prices in ₹ (INR). No Case component in this edition.

function pickBest(items, remainingBudget) {
  const affordable = items.filter((i) => i.price <= remainingBudget);
  if (affordable.length === 0) {
    const sorted = [...items].sort((a, b) => a.price - b.price);
    return sorted[0] || null;
  }
  affordable.sort((a, b) => b.performanceScore - a.performanceScore);
  return affordable[0];
}

const PURPOSE_PROFILES = {
  gaming: {
    label: 'Gaming',
    weights: { CPU: 1.0, GPU: 1.5, RAM: 0.8, Storage: 0.7, Cooling: 0.7 },
    budgetSplit: { CPU: 0.20, Motherboard: 0.12, RAM: 0.08, GPU: 0.35, Storage: 0.08, Cooling: 0.07, PSU: 0.10 },
    description: 'Optimized for high frame rates in modern games with ray tracing support.',
  },
  office: {
    label: 'Office Work',
    weights: { CPU: 0.7, GPU: 0.3, RAM: 0.5, Storage: 0.6, Cooling: 0.3 },
    budgetSplit: { CPU: 0.25, Motherboard: 0.15, RAM: 0.10, GPU: 0.10, Storage: 0.15, Cooling: 0.10, PSU: 0.15 },
    description: 'Efficient for office applications, web browsing, email, and multitasking.',
  },
  programming: {
    label: 'Programming',
    weights: { CPU: 1.2, GPU: 0.5, RAM: 1.2, Storage: 1.0, Cooling: 0.6 },
    budgetSplit: { CPU: 0.25, Motherboard: 0.12, RAM: 0.15, GPU: 0.12, Storage: 0.15, Cooling: 0.10, PSU: 0.11 },
    description: 'Balanced for code compilation, Docker containers, VMs, and multi-monitor workflows.',
  },
  photoEditing: {
    label: 'Photo Editing',
    weights: { CPU: 1.0, GPU: 0.8, RAM: 1.0, Storage: 0.9, Cooling: 0.6 },
    budgetSplit: { CPU: 0.22, Motherboard: 0.12, RAM: 0.13, GPU: 0.18, Storage: 0.15, Cooling: 0.10, PSU: 0.10 },
    description: 'Optimized for Adobe Photoshop, Lightroom, and high-resolution image processing.',
  },
  videoEditing: {
    label: 'Video Editing',
    weights: { CPU: 1.4, GPU: 1.3, RAM: 1.3, Storage: 1.2, Cooling: 0.9 },
    budgetSplit: { CPU: 0.22, Motherboard: 0.10, RAM: 0.12, GPU: 0.25, Storage: 0.12, Cooling: 0.10, PSU: 0.09 },
    description: 'High-performance build for Premiere Pro, DaVinci Resolve, and 4K/8K editing.',
  },
};

export function generateBuild(allComponents, options = {}) {
  const { budget = 50000, purpose = 'gaming' } = options;
  const profile = PURPOSE_PROFILES[purpose] || PURPOSE_PROFILES.gaming;

  const byType = {};
  for (const c of allComponents) {
    if (!byType[c.type]) byType[c.type] = [];
    byType[c.type].push(c);
  }

  let remaining = budget;
  const build = {};
  const split = profile.budgetSplit;
  const weights = profile.weights;

  // 1. Pick CPU
  const cpus = (byType['CPU'] || []).map((c) => ({ ...c, _score: c.performanceScore * (weights.CPU || 1) }));
  cpus.sort((a, b) => b._score - a._score);
  build.CPU = pickBest(cpus, budget * split.CPU);
  remaining -= build.CPU?.price || 0;

  // 2. Pick compatible Motherboard
  const cpuSocket = build.CPU?.socket;
  const compatibleMobos = (byType['Motherboard'] || []).filter((m) => m.socket === cpuSocket);
  build.Motherboard = pickBest(compatibleMobos, budget * split.Motherboard);
  remaining -= build.Motherboard?.price || 0;

  // 3. Pick compatible RAM
  const ramType = build.Motherboard?.ramType;
  const compatibleRAM = (byType['RAM'] || []).filter((r) => r.ramType === ramType);
  build.RAM = pickBest(compatibleRAM, budget * split.RAM);
  remaining -= build.RAM?.price || 0;

  // 4. Pick GPU
  const gpus = (byType['GPU'] || []).map((g) => ({ ...g, _score: g.performanceScore * (weights.GPU || 1) }));
  gpus.sort((a, b) => b._score - a._score);
  build.GPU = pickBest(gpus, budget * split.GPU);
  remaining -= build.GPU?.price || 0;

  // 5. Pick Storage
  build.Storage = pickBest(byType['Storage'] || [], budget * split.Storage);
  remaining -= build.Storage?.price || 0;

  // 6. Pick Cooling (must support CPU socket)
  const compatibleCooling = (byType['Cooling'] || []).filter((c) => (c.socketSupport || []).includes(cpuSocket));
  build.Cooling = pickBest(compatibleCooling.length > 0 ? compatibleCooling : byType['Cooling'] || [], budget * split.Cooling);
  remaining -= build.Cooling?.price || 0;

  // 7. Calculate total wattage and pick PSU
  const totalWattage = Object.values(build).reduce((sum, c) => sum + (c?.wattage || 0), 0);
  const recommendedPSUWattage = Math.ceil(totalWattage * 1.25);
  const suitablePSUs = (byType['PSU'] || []).filter((p) => p.capacityWatts >= recommendedPSUWattage).sort((a, b) => a.capacityWatts - b.capacityWatts);
  build.PSU = suitablePSUs[0] || pickBest(byType['PSU'] || [], remaining);

  const summary = computeSummary(build);
  summary.recommendedPSUWattage = recommendedPSUWattage;
  const explanation = generateExplanation(build, summary, profile, purpose);

  return { build, summary, explanation, purpose: profile.label };
}

export function computeSummary(build) {
  let totalPower = 0, totalPrice = 0, totalPerf = 0, partCount = 0;
  const powerBreakdown = [];

  for (const [type, part] of Object.entries(build)) {
    if (!part) continue;
    totalPower += part.wattage || 0;
    totalPrice += part.price || 0;
    totalPerf += part.performanceScore || 0;
    partCount++;
    powerBreakdown.push({ component: type, name: part.name, wattage: part.wattage || 0 });
  }

  const avgPerf = partCount > 0 ? totalPerf / partCount : 0;
  let performanceCategory = 'Entry-level';
  if (avgPerf >= 70) performanceCategory = 'High End';
  else if (avgPerf >= 45) performanceCategory = 'Mid-range';

  const recommendedPSUWattage = Math.ceil(totalPower * 1.25);
  const issues = checkCompatibility(build, totalPower);
  const capabilities = computeCapabilities(build, avgPerf);

  return {
    totalPower, totalPrice, recommendedPSUWattage, performanceCategory,
    averagePerformance: Math.round(avgPerf), powerBreakdown,
    compatibilityIssues: issues, isCompatible: issues.length === 0, capabilities,
  };
}

function checkCompatibility(build, totalPower) {
  const issues = [];

  if (build.CPU && build.Motherboard) {
    if (build.CPU.socket !== build.Motherboard.socket) {
      issues.push({ type: 'error', message: `CPU socket (${build.CPU.socket}) does not match motherboard socket (${build.Motherboard.socket})` });
    }
  }
  if (build.RAM && build.Motherboard) {
    if (build.RAM.ramType !== build.Motherboard.ramType) {
      issues.push({ type: 'error', message: `RAM type (${build.RAM.ramType}) not supported by motherboard (supports ${build.Motherboard.ramType})` });
    }
  }
  if (build.PSU) {
    if ((build.PSU.capacityWatts || 0) < totalPower) {
      issues.push({ type: 'error', message: `PSU wattage (${build.PSU.capacityWatts}W) is insufficient for total system power draw (${totalPower}W)` });
    }
    const recommended = Math.ceil(totalPower * 1.25);
    if ((build.PSU.capacityWatts || 0) < recommended && (build.PSU.capacityWatts || 0) >= totalPower) {
      issues.push({ type: 'warning', message: `PSU wattage (${build.PSU.capacityWatts}W) is below recommended ${recommended}W (total draw + 25% buffer)` });
    }
  }
  if (build.Cooling && build.CPU) {
    if (build.Cooling.socketSupport && Array.isArray(build.Cooling.socketSupport) && !build.Cooling.socketSupport.includes(build.CPU.socket)) {
      issues.push({ type: 'error', message: `CPU cooler does not support CPU socket (${build.CPU.socket})` });
    }
  }
  return issues;
}

function computeCapabilities(build, avgPerf) {
  const gpuScore = build.GPU?.performanceScore || 0;
  const cpuScore = build.CPU?.performanceScore || 0;
  const ramGB = build.RAM?.capacityGB || 0;

  const gamingScore = Math.round(gpuScore * 0.6 + cpuScore * 0.3 + Math.min(ramGB / 32, 1) * 10);
  const editingScore = Math.round(cpuScore * 0.4 + gpuScore * 0.3 + Math.min(ramGB / 64, 1) * 30);
  const generalScore = Math.round(avgPerf);

  function rateCapability(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Moderate';
    if (score >= 20) return 'Basic';
    return 'Limited';
  }

  return {
    gaming: { score: gamingScore, rating: rateCapability(gamingScore) },
    editing: { score: editingScore, rating: rateCapability(editingScore) },
    general: { score: generalScore, rating: rateCapability(generalScore) },
  };
}

function generateExplanation(build, summary, profile, purposeKey) {
  const parts = [];
  parts.push(`This ${profile.label} build is ${profile.description.charAt(0).toLowerCase() + profile.description.slice(1)}`);

  if (build.CPU) {
    const cpuPerf = build.CPU.performanceScore;
    if (cpuPerf >= 80) parts.push(`The ${build.CPU.name} is a top-tier processor that excels at multi-threaded workloads, heavy multitasking, and demanding applications.`);
    else if (cpuPerf >= 55) parts.push(`The ${build.CPU.name} provides strong performance for most tasks including gaming, content creation, and everyday computing.`);
    else parts.push(`The ${build.CPU.name} is an efficient processor well-suited for everyday computing and light workloads.`);
  }
  if (build.GPU) {
    const gpuPerf = build.GPU.performanceScore;
    if (gpuPerf >= 85) parts.push(`The ${build.GPU.name} can handle 4K gaming at ultra settings, professional video editing, and AI/ML workloads with ease.`);
    else if (gpuPerf >= 65) parts.push(`The ${build.GPU.name} delivers excellent 1080p and good 1440p gaming performance, and can handle video editing and 3D rendering tasks.`);
    else if (gpuPerf >= 40) parts.push(`The ${build.GPU.name} is suitable for 1080p gaming at medium-high settings and light content creation tasks.`);
    else parts.push(`The GPU provides basic display output and can handle light gaming at lower settings.`);
  }
  if (build.RAM) {
    const ramGB = build.RAM.capacityGB || 0;
    if (ramGB >= 64) parts.push(`With ${ramGB}GB of ${build.RAM.ramType} memory, this system can handle the most demanding workloads including 4K video editing, large datasets, and extensive multitasking.`);
    else if (ramGB >= 32) parts.push(`${ramGB}GB of ${build.RAM.ramType} RAM provides generous headroom for multitasking, content creation, and gaming simultaneously.`);
    else if (ramGB >= 16) parts.push(`${ramGB}GB of ${build.RAM.ramType} RAM is the sweet spot for gaming and productivity tasks.`);
    else parts.push(`${ramGB}GB of RAM is sufficient for basic office tasks and light multitasking.`);
  }
  if (build.Storage) {
    const st = build.Storage.storageType;
    if (st === 'NVMe') parts.push(`The ${build.Storage.name} NVMe drive delivers blazing-fast boot times and application loading speeds.`);
    else if (st === 'SATA SSD') parts.push(`The ${build.Storage.name} provides solid read/write speeds, a significant improvement over traditional hard drives.`);
    else parts.push(`The ${build.Storage.name} offers large capacity for file storage at an affordable price point.`);
  }

  const perf = summary.performanceCategory;
  if (perf === 'High End') parts.push(`Overall, this is a high-end system capable of handling the most demanding tasks. It can run modern AAA games at high/ultra settings, edit 4K video smoothly, and compile large codebases rapidly.`);
  else if (perf === 'Mid-range') parts.push(`This is a solid mid-range build that handles most tasks well. It can run modern games at medium-high settings, handle photo/video editing, and provides a smooth experience for productivity work.`);
  else parts.push(`This is an entry-level build suited for everyday tasks like web browsing, office work, light photo editing, and casual gaming at lower settings.`);

  parts.push(`Total power consumption is approximately ${summary.totalPower}W, with a recommended PSU of ${summary.recommendedPSUWattage}W to ensure stable operation with adequate headroom.`);

  return parts.join('\n\n');
}
