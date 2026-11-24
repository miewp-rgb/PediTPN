export type PatientGroup = 'preterm' | 'term';
export type ClinicalPhase = 'acute' | 'growth';
export type AccessRoute = 'peripheral' | 'central_uvc' | 'central_picc' | 'central_cvc';
export type LipidType = 'smof_fish_oil' | 'soybean_standard';
export type GirInputMode = 'gir' | 'dextrose';

export interface PatientProfile {
  id: string;
  label: string;
  hn: string;
  group: PatientGroup;
  gestationalAgeWeeks: number;
  weightKg: number;
  dayOfLife: number;
  phase: ClinicalPhase;
  urineOutputMlKgHr: number;
  clinicalNote: string;
}

export interface FluidInputs {
  route: AccessRoute;
  targetTfiMlKgDay: number;
  enteralMlKgDay: number;
  enteralKcalPerMl: number; // e.g., 0.67 standard/breast milk, 0.80 preterm formula
  ivMedsMlDay: number;
  flushMlDay: number;
  includeLipidInTfi: boolean;
  pnInfusionHours: number; // usually 24
  lipidInfusionHours: number; // usually 24 or 20
}

export interface MacroInputs {
  aminoAcidGKgDay: number;
  girMode: GirInputMode;
  targetGirMgKgMin: number;
  directDextrosePct: number;
  lipidGKgDay: number;
  lipidType: LipidType;
  tpnDurationDays: number;
}

export interface MicroInputs {
  naMEqKgDay: number;
  kMEqKgDay: number;
  caMEqKgDay: number; // 1 mmol Ca = 2 mEq Ca
  pMmolKgDay: number;
  mgMEqKgDay: number;
  multivitaminOrdered: boolean;
  traceElementsOrdered: boolean;
  photoprotectionApplied: boolean;
}

export interface LabEntry {
  id: string;
  timestamp: string; // e.g., "Day 3 · 08:00"
  dayOfLife: number;
  bloodGlucoseMgDl: number;
  sodiumMEqL: number;
  potassiumMEqL: number;
  calciumMgDl: number;
  phosphorusMgDl: number;
  magnesiumMgDl: number;
  triglyceridesMgDl: number;
  directBilirubinMgDl: number;
  altUL?: number;
  bunMgDl?: number;
  creatinineMgDl?: number;
}

export type AlertSeverity = 'critical' | 'warning' | 'nominal';

export interface SafetyAlert {
  id: string;
  category: 'route' | 'fluid' | 'macro' | 'micro' | 'lab' | 'weaning';
  severity: AlertSeverity;
  title: string;
  detail: string;
  recommendation: string;
}

export interface CalculatedTPN {
  // Fluid
  totalDailyFluidMl: number;
  enteralTotalMlDay: number;
  enteralKcalKgDay: number;
  lipidVolumeMlDay: number;
  nonTpnFluidMlDay: number;
  netPnVolumeMlDay: number;
  netPnMlKgDay: number;
  pnRateMlHr: number;
  lipidRateMlHr: number;

  // Dextrose & GIR
  actualGirMgKgMin: number;
  requiredDextrosePct: number;
  dextroseGKgDay: number;
  dextroseTotalGDay: number;

  // Amino Acids & Lipid totals
  aminoAcidTotalGDay: number;
  aminoAcidPctInBag: number;
  lipidTotalGDay: number;

  // Energy
  proteinKcalKgDay: number;
  carbKcalKgDay: number;
  lipidKcalKgDay: number;
  nonProteinKcalKgDay: number;
  tpnTotalKcalKgDay: number;
  grandTotalKcalKgDay: number;
  npcToProteinRatio: number;
  npcToNitrogenRatio: number;
  energyShares: {
    carbPct: number;
    lipidPct: number;
    proteinPct: number;
  };

  // Osmolarity
  osmolarityMOsmL: number;
  osmolarityBreakdown: {
    dextrose: number;
    aminoAcid: number;
    electrolytes: number;
  };
  isPeripheralSafe: boolean;

  // Micronutrients & Ca-P
  caMmolKgDay: number;
  caPMolarRatio: number;
  caMEqPerL: number;
  pMmolPerL: number;
  caMaxSafeMEqPerL: number;
  caPSolubilityStatus: 'safe' | 'borderline' | 'precipitation_risk';
  recommendedMviMlDay: number;
  recommendedTraceMlDay: number;

  // Weaning
  weaningReadiness: 'full_tpn' | 'advancing_feeds' | 'ready_to_stop';

  // Alerts
  alerts: SafetyAlert[];
}

export interface ClinicalPreset {
  id: string;
  shortTitle: string;
  subtitle: string;
  patient: PatientProfile;
  fluid: FluidInputs;
  macro: MacroInputs;
  micro: MicroInputs;
  labs: LabEntry[];
}
