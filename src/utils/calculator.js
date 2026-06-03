// Window & Door Pricing Calculator with Hardware & Joinery Systems

export const TYPE_FACTORS = {
  'sliding_2t2p': { name: 'Sliding Window (2 Track 2 Panel)', factor: 1.3, base: 4500 },
  'sliding_3t3p': { name: 'Sliding Window (3 Track 3 Panel)', factor: 1.6, base: 5800 },
  'casement': { name: 'Casement Window', factor: 1.4, base: 4200 },
  'fixed': { name: 'Fixed Window', factor: 1.0, base: 3000 },
  'single_door': { name: 'Single Door', factor: 1.8, base: 7500 },
  'double_door': { name: 'Double Door', factor: 2.5, base: 12000 }
};

export const GLASS_FACTORS = {
  'clear': { name: 'Clear Glass', factor: 1.0, label: 'Transparent' },
  'tinted': { name: 'Tinted Glass', factor: 1.25, label: 'Dark tinted' },
  'frosted': { name: 'Frosted Glass', factor: 1.35, label: 'Blurred translucent' },
  'tempered': { name: 'Tempered Glass', factor: 1.5, label: 'Premium clear safety' },
  'laminated': { name: 'Laminated Glass', factor: 1.8, label: 'Premium layered acoustics' }
};

export const FINISH_FACTORS = {
  'white': { name: 'Powder Coated White', factor: 1.0, color: '#FFFFFF', isTextured: false },
  'black': { name: 'Powder Coated Black', factor: 1.05, color: '#1A1A1A', isTextured: false },
  'anodized': { name: 'Anodized Aluminum', factor: 1.15, color: '#A0A0A0', isMetallic: true },
  'wood': { name: 'Wood Grain', factor: 1.30, color: '#8B4513', isTextured: true },
  'custom': { name: 'Custom Color', factor: 1.20, color: '#4A90E2', isCustom: true }
};

export const HARDWARE_OPTIONS = {
  'standard': { name: 'Standard Touch Handle', cost: 0 },
  'multi_lock': { name: 'Multi-point Touch Lock', cost: 1200 },
  'keyed_lever': { name: 'Premium German Key-Lock', cost: 3500 },
  'flush_pull': { name: 'Flush Pull Latch', cost: 800 }
};

export const THICKNESS_OPTIONS = {
  '5mm': { name: '5 mm Single Pane', cost: 0 },
  '6mm_tough': { name: '6 mm Toughened', cost: 450 },
  '12mm_dgu': { name: '12 mm Double-Glazed Unit', cost: 2200 }
};

export const JOINERY_OPTIONS = {
  '90deg': { name: '90° Straight Butt Joint', factor: 1.0 },
  '45deg': { name: '45° Precision Miter', factor: 1.08 }
};

export const MESH_COST = {
  base: 1800,
  rate: 0.0004 // per sq mm
};

/**
 * Calculate the estimated price in INR (₹)
 */
export function calculateCost(width, height, typeKey, glassKey, finishKey, includeMesh, hardwareKey, thicknessKey, joineryKey) {
  if (!width || !height || !typeKey) return 0;
  
  const widthNum = parseFloat(width);
  const heightNum = parseFloat(height);
  
  if (isNaN(widthNum) || isNaN(heightNum) || widthNum < 100 || heightNum < 100) {
    return 0;
  }
  
  const areaSqMm = widthNum * heightNum;
  
  // Base configuration parameters
  const typeConfig = TYPE_FACTORS[typeKey] || TYPE_FACTORS['fixed'];
  const glassConfig = GLASS_FACTORS[glassKey] || GLASS_FACTORS['clear'];
  const finishConfig = FINISH_FACTORS[finishKey] || FINISH_FACTORS['white'];
  
  const hardwareConfig = HARDWARE_OPTIONS[hardwareKey] || HARDWARE_OPTIONS['standard'];
  const thicknessConfig = THICKNESS_OPTIONS[thicknessKey] || THICKNESS_OPTIONS['5mm'];
  const joineryConfig = JOINERY_OPTIONS[joineryKey] || JOINERY_OPTIONS['90deg'];
  
  // Area rate: ₹0.0028 per sq mm base rate
  const baseAreaRate = 0.0028;
  const areaCost = areaSqMm * baseAreaRate;
  
  // Core price calculation with joinery factor
  let cost = (typeConfig.base + areaCost) * typeConfig.factor;
  
  // Multiply by glass, finish (with joinery modifier), and add optional components
  cost = cost * glassConfig.factor * (finishConfig.factor * joineryConfig.factor);
  
  // Add hardware cost
  cost += hardwareConfig.cost;
  
  // Add thickness cost
  cost += thicknessConfig.cost;
  
  // Add mesh cost if included
  if (includeMesh) {
    cost += MESH_COST.base + (areaSqMm * MESH_COST.rate);
  }
  
  // Round to nearest rupee
  return Math.round(cost);
}

/**
 * Formats a number to INR currency representation
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}
