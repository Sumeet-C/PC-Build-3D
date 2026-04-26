// ─── PC Component Seed Data (India Edition) ────────────────────────────────
// Realistic Indian market pricing in ₹ (INR).

const components = [
  // ── CPUs ──
  { name: 'Intel Core i3-12100F', type: 'CPU', price: 8499, wattage: 58, performanceScore: 38, socket: 'LGA1700', specs: '4-core, 8-thread, 4.3GHz boost, 12MB cache' },
  { name: 'Intel Core i5-12400F', type: 'CPU', price: 13999, wattage: 65, performanceScore: 55, socket: 'LGA1700', specs: '6-core, 12-thread, 4.4GHz boost, 18MB cache' },
  { name: 'Intel Core i7-13700K', type: 'CPU', price: 32999, wattage: 125, performanceScore: 78, socket: 'LGA1700', specs: '16-core (8P+8E), 24-thread, 5.4GHz boost, 30MB cache' },
  { name: 'Intel Core i9-14900K', type: 'CPU', price: 48999, wattage: 150, performanceScore: 95, socket: 'LGA1700', specs: '24-core (8P+16E), 32-thread, 6.0GHz boost, 36MB cache' },
  { name: 'AMD Ryzen 5 5600X', type: 'CPU', price: 15499, wattage: 65, performanceScore: 58, socket: 'AM4', specs: '6-core, 12-thread, 4.6GHz boost, 32MB L3 cache' },
  { name: 'AMD Ryzen 7 7700X', type: 'CPU', price: 28999, wattage: 105, performanceScore: 75, socket: 'AM5', specs: '8-core, 16-thread, 5.4GHz boost, 32MB L3 cache' },
  { name: 'AMD Ryzen 9 7950X', type: 'CPU', price: 47999, wattage: 170, performanceScore: 96, socket: 'AM5', specs: '16-core, 32-thread, 5.7GHz boost, 64MB L3 cache' },

  // ── GPUs ──
  { name: 'NVIDIA GTX 1660 Super', type: 'GPU', price: 14999, wattage: 125, performanceScore: 42, lengthMm: 229, specs: '6GB GDDR6, 1408 CUDA cores, 1080p gaming' },
  { name: 'NVIDIA RTX 3060', type: 'GPU', price: 24999, wattage: 170, performanceScore: 68, lengthMm: 242, specs: '12GB GDDR6, 3584 CUDA cores, ray tracing, DLSS' },
  { name: 'NVIDIA RTX 4060', type: 'GPU', price: 29999, wattage: 115, performanceScore: 72, lengthMm: 240, specs: '8GB GDDR6, 3072 CUDA cores, DLSS 3, AV1 encode' },
  { name: 'NVIDIA RTX 4070', type: 'GPU', price: 47999, wattage: 200, performanceScore: 82, lengthMm: 285, specs: '12GB GDDR6X, 5888 CUDA cores, DLSS 3, AV1 encode' },
  { name: 'NVIDIA RTX 4080 Super', type: 'GPU', price: 89999, wattage: 320, performanceScore: 92, lengthMm: 304, specs: '16GB GDDR6X, 10240 CUDA cores, 4K gaming, DLSS 3' },
  { name: 'AMD RX 7600', type: 'GPU', price: 21999, wattage: 165, performanceScore: 62, lengthMm: 230, specs: '8GB GDDR6, 2048 stream processors, 1080p gaming' },
  { name: 'AMD RX 7900 XT', type: 'GPU', price: 64999, wattage: 300, performanceScore: 88, lengthMm: 276, specs: '20GB GDDR6, 5376 stream processors, 4K gaming' },
  { name: 'NVIDIA RTX 4090', type: 'GPU', price: 164999, wattage: 450, performanceScore: 99, lengthMm: 336, specs: '24GB GDDR6X, 16384 CUDA cores, 4K/8K, AI workloads' },

  // ── RAM ──
  { name: 'Corsair Vengeance 8GB DDR4', type: 'RAM', price: 2199, wattage: 3, performanceScore: 25, ramType: 'DDR4', capacityGB: 8, specs: '8GB (1x8GB), DDR4-3200, CL16, 1.35V' },
  { name: 'Corsair Vengeance 16GB DDR4', type: 'RAM', price: 3999, wattage: 5, performanceScore: 40, ramType: 'DDR4', capacityGB: 16, specs: '16GB (2x8GB), DDR4-3200, CL16, Dual Channel' },
  { name: 'G.Skill Ripjaws 32GB DDR4', type: 'RAM', price: 7499, wattage: 8, performanceScore: 55, ramType: 'DDR4', capacityGB: 32, specs: '32GB (2x16GB), DDR4-3600, CL18, Dual Channel' },
  { name: 'Corsair Dominator 32GB DDR5', type: 'RAM', price: 11999, wattage: 8, performanceScore: 70, ramType: 'DDR5', capacityGB: 32, specs: '32GB (2x16GB), DDR5-5600, CL36, Intel XMP 3.0' },
  { name: 'G.Skill Trident Z5 64GB DDR5', type: 'RAM', price: 18999, wattage: 12, performanceScore: 88, ramType: 'DDR5', capacityGB: 64, specs: '64GB (2x32GB), DDR5-6000, CL30, Dual Channel' },

  // ── Motherboards ──
  { name: 'MSI PRO B660M-A', type: 'Motherboard', price: 9999, wattage: 30, performanceScore: 45, socket: 'LGA1700', ramType: 'DDR4', formFactor: 'mATX', specs: 'LGA1700, DDR4, PCIe 4.0, M.2 slot, mATX' },
  { name: 'MSI PRO B760-P DDR5', type: 'Motherboard', price: 13499, wattage: 35, performanceScore: 52, socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX', specs: 'LGA1700, DDR5, PCIe 4.0, 2x M.2, ATX' },
  { name: 'ASUS ROG Strix Z790-E', type: 'Motherboard', price: 31999, wattage: 45, performanceScore: 80, socket: 'LGA1700', ramType: 'DDR5', formFactor: 'ATX', specs: 'LGA1700, DDR5-7800+, PCIe 5.0, WiFi 6E, 4x M.2' },
  { name: 'Gigabyte B550 AORUS Pro', type: 'Motherboard', price: 13499, wattage: 35, performanceScore: 55, socket: 'AM4', ramType: 'DDR4', formFactor: 'ATX', specs: 'AM4, DDR4, PCIe 4.0, 2x M.2, 2.5GbE LAN' },
  { name: 'MSI MAG X670E TOMAHAWK', type: 'Motherboard', price: 24999, wattage: 40, performanceScore: 72, socket: 'AM5', ramType: 'DDR5', formFactor: 'ATX', specs: 'AM5, DDR5-6600+, PCIe 5.0, WiFi 6E, USB4' },

  // ── Storage ──
  { name: 'Kingston A400 240GB SATA', type: 'Storage', price: 1799, wattage: 3, performanceScore: 18, capacityGB: 240, storageType: 'SATA SSD', specs: '240GB, SATA III, 500/350 MB/s read/write' },
  { name: 'Samsung 870 EVO 500GB SATA', type: 'Storage', price: 3999, wattage: 4, performanceScore: 35, capacityGB: 500, storageType: 'SATA SSD', specs: '500GB, SATA III, 560/530 MB/s, V-NAND' },
  { name: 'Samsung 980 Pro 1TB NVMe', type: 'Storage', price: 7999, wattage: 6, performanceScore: 70, capacityGB: 1000, storageType: 'NVMe', specs: '1TB, PCIe 4.0 NVMe, 7000/5000 MB/s, V-NAND' },
  { name: 'WD Black SN850X 2TB NVMe', type: 'Storage', price: 14999, wattage: 7, performanceScore: 82, capacityGB: 2000, storageType: 'NVMe', specs: '2TB, PCIe 4.0 NVMe, 7300/6600 MB/s, Game Mode' },
  { name: 'Seagate Barracuda 2TB HDD', type: 'Storage', price: 4499, wattage: 8, performanceScore: 20, capacityGB: 2000, storageType: 'HDD', specs: '2TB, 7200RPM, SATA III, 256MB cache' },

  // ── PSUs ──
  { name: 'Cooler Master MWE 550W Bronze', type: 'PSU', price: 3999, wattage: 15, performanceScore: 30, capacityWatts: 550, efficiency: '80+ Bronze', specs: '550W, 80+ Bronze, non-modular, 120mm fan' },
  { name: 'Corsair RM650x Gold', type: 'PSU', price: 7999, wattage: 18, performanceScore: 55, capacityWatts: 650, efficiency: '80+ Gold', specs: '650W, 80+ Gold, fully modular, silent mode' },
  { name: 'Corsair RM850x Gold', type: 'PSU', price: 11999, wattage: 22, performanceScore: 72, capacityWatts: 850, efficiency: '80+ Gold', specs: '850W, 80+ Gold, fully modular, 135mm fan' },
  { name: 'Seasonic Prime TX-1000', type: 'PSU', price: 19999, wattage: 25, performanceScore: 90, capacityWatts: 1000, efficiency: '80+ Titanium', specs: '1000W, 80+ Titanium, fully modular, 12-yr warranty' },
  { name: 'Corsair HX1200 Platinum', type: 'PSU', price: 22999, wattage: 28, performanceScore: 95, capacityWatts: 1200, efficiency: '80+ Platinum', specs: '1200W, 80+ Platinum, fully modular, zero RPM mode' },

  // ── Cooling ──
  { name: 'Intel Stock Cooler', type: 'Cooling', price: 0, wattage: 3, performanceScore: 15, coolingType: 'Air (Stock)', socketSupport: ['LGA1700'], specs: 'Stock Intel cooler, aluminum heatsink, up to 65W TDP' },
  { name: 'Cooler Master Hyper 212', type: 'Cooling', price: 2799, wattage: 5, performanceScore: 40, coolingType: 'Air Tower', socketSupport: ['LGA1700', 'AM4', 'AM5'], specs: '4 heatpipes, 120mm fan, 150W TDP, aluminum/copper' },
  { name: 'Noctua NH-D15', type: 'Cooling', price: 8499, wattage: 8, performanceScore: 75, coolingType: 'Air Tower (Dual)', socketSupport: ['LGA1700', 'AM4', 'AM5'], specs: 'Dual 140mm fans, 6 heatpipes, 250W TDP, premium' },
  { name: 'NZXT Kraken X63', type: 'Cooling', price: 11499, wattage: 10, performanceScore: 78, coolingType: 'AIO Liquid 280mm', socketSupport: ['LGA1700', 'AM4', 'AM5'], specs: '280mm AIO, LCD display, Asetek pump, 2x 140mm fans' },
  { name: 'Corsair iCUE H150i Elite', type: 'Cooling', price: 13999, wattage: 12, performanceScore: 85, coolingType: 'AIO Liquid 360mm', socketSupport: ['LGA1700', 'AM4', 'AM5'], specs: '360mm AIO, iCUE RGB, 3x 120mm fans, zero RPM mode' },
];

export default components;
