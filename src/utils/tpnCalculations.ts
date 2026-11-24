import {
  CalculatedTPN,
  FluidInputs,
  LabEntry,
  MacroInputs,
  MicroInputs,
  PatientProfile,
  SafetyAlert,
} from '../types/tpn';

/**
 * Conservative clinical solubility upper limit for Calcium (mEq/L) given Phosphorus (mmol/L)
 * and final Amino Acid concentration (% w/v) in Pediatric PN (e.g. TrophAmine + Ca Gluconate).
 * Always confirm with institutional pharmacy solubility charts.
 */
export function getCaMaxSafeMEqPerL(pMmolPerL: number, aaPctInBag: number): number {
  const clampedAa = Math.max(0.5, Math.min(4.5, aaPctInBag));
  // Smooth interpolation matching standard pediatric AA 1% (~450), 2% (~700), 3% (~950) curves
  const k = 220 + clampedAa * 240;
  return k / (Math.max(0, pMmolPerL) + 6);
}

export function calculateTPN(
  patient: PatientProfile,
  fluid: FluidInputs,
  macro: MacroInputs,
  micro: MicroInputs,
  labs: LabEntry[]
): CalculatedTPN {
  const weight = Math.max(0.3, patient.weightKg);
  const pnHours = Math.max(8, Math.min(24, fluid.pnInfusionHours));
  const lipidHours = Math.max(8, Math.min(24, fluid.lipidInfusionHours));

  // 1. Fluid Intake & Deductions
  const totalDailyFluidMl = fluid.targetTfiMlKgDay * weight;
  const enteralTotalMlDay = fluid.enteralMlKgDay * weight;
  const enteralKcalKgDay = fluid.enteralMlKgDay * fluid.enteralKcalPerMl;

  // 20% ILE = 0.20 g/mL => 5 mL/g
  const lipidTotalGDay = macro.lipidGKgDay * weight;
  const lipidVolumeMlDay = lipidTotalGDay * 5;

  const nonTpnFluidMlDay =
    enteralTotalMlDay +
    fluid.ivMedsMlDay +
    fluid.flushMlDay +
    (fluid.includeLipidInTfi ? lipidVolumeMlDay : 0);

  const netPnVolumeMlDay = Math.max(0, totalDailyFluidMl - nonTpnFluidMlDay);
  const netPnMlKgDay = netPnVolumeMlDay / weight;
  const pnRateMlHr = netPnVolumeMlDay / pnHours;
  const lipidRateMlHr = lipidVolumeMlDay / lipidHours;

  // 2. GIR & Dextrose Concentration (exact clinical formulas)
  // GIR (mg/kg/min) = (%Dextrose * Rate_mL_hr) / (6 * Weight_kg)
  // Required %Dextrose = (GIR * Weight_kg * 6) / PN_Rate_mL_hr
  let actualGirMgKgMin = 0;
  let requiredDextrosePct = 0;
  let dextroseTotalGDay = 0;

  if (macro.girMode === 'gir') {
    actualGirMgKgMin = macro.targetGirMgKgMin;
    requiredDextrosePct =
      pnRateMlHr > 0.05 ? (actualGirMgKgMin * weight * 6) / pnRateMlHr : 0;
    dextroseTotalGDay = (requiredDextrosePct / 100) * netPnVolumeMlDay;
  } else {
    requiredDextrosePct = macro.directDextrosePct;
    actualGirMgKgMin = (requiredDextrosePct * pnRateMlHr) / (6 * weight);
    dextroseTotalGDay = (requiredDextrosePct / 100) * netPnVolumeMlDay;
  }

  const dextroseGKgDay = dextroseTotalGDay / weight;

  // 3. Amino Acids & Energy
  const aminoAcidTotalGDay = macro.aminoAcidGKgDay * weight;
  const aminoAcidPctInBag =
    netPnVolumeMlDay > 0 ? (aminoAcidTotalGDay / netPnVolumeMlDay) * 100 : 0;

  // Standard pediatric parenteral caloric factors
  const proteinKcalKgDay = macro.aminoAcidGKgDay * 4.0;
  const carbKcalKgDay = dextroseGKgDay * 3.4; // Hydrous dextrose monohydrate 3.4 kcal/g
  const lipidKcalKgDay = macro.lipidGKgDay * 10.0; // 20% ILE = 2 kcal/mL = 10 kcal/g
  const nonProteinKcalKgDay = carbKcalKgDay + lipidKcalKgDay;
  const tpnTotalKcalKgDay = proteinKcalKgDay + nonProteinKcalKgDay;
  const grandTotalKcalKgDay = tpnTotalKcalKgDay + enteralKcalKgDay;

  const npcToProteinRatio =
    macro.aminoAcidGKgDay > 0 ? nonProteinKcalKgDay / macro.aminoAcidGKgDay : 0;
  // 1 g N ≈ 6.25 g Protein
  const npcToNitrogenRatio = npcToProteinRatio * 6.25;

  const energyShares =
    tpnTotalKcalKgDay > 0
      ? {
          carbPct: (carbKcalKgDay / tpnTotalKcalKgDay) * 100,
          lipidPct: (lipidKcalKgDay / tpnTotalKcalKgDay) * 100,
          proteinPct: (proteinKcalKgDay / tpnTotalKcalKgDay) * 100,
        }
      : { carbPct: 0, lipidPct: 0, proteinPct: 0 };

  // 4. Aqueous PN Osmolarity (mOsm/L)
  const bagLiters = netPnVolumeMlDay / 1000;
  const dextroseOsm = requiredDextrosePct * 50; // 1% Dextrose = 10 g/L × 5 mOsm/g = 50 mOsm/L
  const aaGPerL = bagLiters > 0 ? aminoAcidTotalGDay / bagLiters : 0;
  const aminoAcidOsm = aaGPerL * 10; // 10 mOsm/g

  const naMEqPerL = bagLiters > 0 ? (micro.naMEqKgDay * weight) / bagLiters : 0;
  const kMEqPerL = bagLiters > 0 ? (micro.kMEqKgDay * weight) / bagLiters : 0;
  const caMEqPerL = bagLiters > 0 ? (micro.caMEqKgDay * weight) / bagLiters : 0;
  const pMmolPerL = bagLiters > 0 ? (micro.pMmolKgDay * weight) / bagLiters : 0;
  const mgMEqPerL = bagLiters > 0 ? (micro.mgMEqKgDay * weight) / bagLiters : 0;

  const electrolytesOsm =
    (naMEqPerL + kMEqPerL) * 2 +
    caMEqPerL * 1.4 +
    pMmolPerL * 2 +
    mgMEqPerL * 1;

  const osmolarityMOsmL =
    netPnVolumeMlDay > 0 ? dextroseOsm + aminoAcidOsm + electrolytesOsm : 0;
  const isPeripheralSafe = requiredDextrosePct <= 12.5 && osmolarityMOsmL <= 900;

  // 5. Calcium & Phosphorus Ratio & Solubility
  const caMmolKgDay = micro.caMEqKgDay / 2; // 2 mEq Ca = 1 mmol Ca
  const caPMolarRatio = micro.pMmolKgDay > 0 ? caMmolKgDay / micro.pMmolKgDay : 0;
  const caMaxSafeMEqPerL = getCaMaxSafeMEqPerL(pMmolPerL, aminoAcidPctInBag);

  let caPSolubilityStatus: 'safe' | 'borderline' | 'precipitation_risk' = 'safe';
  if (caMEqPerL > 0 && pMmolPerL > 0) {
    if (caMEqPerL > caMaxSafeMEqPerL) {
      caPSolubilityStatus = 'precipitation_risk';
    } else if (caMEqPerL > caMaxSafeMEqPerL * 0.85) {
      caPSolubilityStatus = 'borderline';
    }
  }

  // Standard Pediatric MVI dosing (e.g., MVI Pediatric):
  // < 1 kg: 1.5 mL/day; 1–3 kg: 3.25 mL/day (approx 2 mL/kg max 5 mL); > 3 kg: 5 mL/day
  const recommendedMviMlDay =
    weight < 1 ? 1.5 : weight <= 3 ? Number(Math.min(3.25, weight * 2).toFixed(2)) : 5.0;
  // Pediatric Trace Elements (Peditrace / Multrys): ~1 mL/kg/day (max 15 mL or standard weight rule)
  const recommendedTraceMlDay = Number(Math.min(5, weight * 1.0).toFixed(2));

  // 6. Weaning Readiness
  let weaningReadiness: 'full_tpn' | 'advancing_feeds' | 'ready_to_stop' = 'full_tpn';
  if (fluid.enteralMlKgDay >= 100) {
    weaningReadiness = 'ready_to_stop';
  } else if (fluid.enteralMlKgDay >= 20) {
    weaningReadiness = 'advancing_feeds';
  }

  // 7. Comprehensive Clinical Safety Alerts
  const alerts: SafetyAlert[] = [];

  // Net PN Volume check
  if (netPnVolumeMlDay <= 5) {
    alerts.push({
      id: 'fluid-negative',
      category: 'fluid',
      severity: 'critical',
      title: 'ปริมาตรสุทธิของถุง TPN เหลือน้อยเกินไปหรือไม่เพียงพอ',
      detail: `สารน้ำอื่นรวม (${nonTpnFluidMlDay.toFixed(1)} mL/day) ใกล้เคียงหรือเกิน TFI เป้าหมาย (${totalDailyFluidMl.toFixed(1)} mL/day)`,
      recommendation:
        'ปรับเพิ่ม TFI หากสภาพคลินิกอนุญาต หรือลดปริมาณสารน้ำจากยาหยด/พิจารณางด TPN หากทารกรับนมได้ ≥ 100–120 mL/kg/day',
    });
  }

  // Peripheral Route Safety
  if (fluid.route === 'peripheral') {
    if (requiredDextrosePct > 12.5) {
      alerts.push({
        id: 'route-dextrose-high',
        category: 'route',
        severity: 'critical',
        title: `ความเข้มข้น Dextrose (${requiredDextrosePct.toFixed(1)}%) เกินเกณฑ์ Peripheral Line`,
        detail: 'การให้ทางเส้นเลือดส่วนปลาย (Peripheral IV) ไม่ควรเกิน 12.5% Dextrose เพื่อลดความเสี่ยง Phlebitis และ Extravasation',
        recommendation:
          'เปลี่ยนไปให้ทาง Central Line (UVC/PICC) หรือลด GIR / เพิ่มปริมาตรสารน้ำสุทธิของ TPN',
      });
    }
    if (osmolarityMOsmL > 900) {
      alerts.push({
        id: 'route-osm-critical',
        category: 'route',
        severity: 'critical',
        title: `Osmolarity (${Math.round(osmolarityMOsmL)} mOsm/L) เกินขีดจำกัด Peripheral Line`,
        detail: 'สารละลายมีค่า Osmolarity สูงกว่า 900 mOsm/L ไม่ปลอดภัยสำหรับหลอดเลือดดำส่วนปลาย',
        recommendation:
          'พิจารณาเปิด Central Line (UVC, PICC) หรือปรับลดความเข้มข้นของ Dextrose, Amino acids และเกลือแร่',
      });
    } else if (osmolarityMOsmL > 850) {
      alerts.push({
        id: 'route-osm-warn',
        category: 'route',
        severity: 'warning',
        title: `Osmolarity (${Math.round(osmolarityMOsmL)} mOsm/L) อยู่ในช่วงเฝ้าระวัง (850–900 mOsm/L)`,
        detail: 'ค่าใกล้ขีดจำกัดสูงสุดของ Peripheral Line',
        recommendation:
          'ตรวจตำแหน่งแทงเข็มทุก 1 ชั่วโมง เฝ้าระวังอาการบวมแดง หรือพิจารณา Central Line หากต้องให้ต่อเนื่อง',
      });
    }
  }

  // GIR & Dextrose Max Limits
  if (actualGirMgKgMin > 12 || dextroseGKgDay > 18) {
    alerts.push({
      id: 'macro-gir-max',
      category: 'macro',
      severity: 'critical',
      title: `GIR (${actualGirMgKgMin.toFixed(1)} mg/kg/min) เกินค่าสูงสุดที่แนะนำ`,
      detail: `ปริมาณ Dextrose ${dextroseGKgDay.toFixed(1)} g/kg/day เกินเกณฑ์สูงสุด 12 mg/kg/min (18 g/kg/day) เสี่ยง Hyperglycemia และไขมันพอกตับ`,
      recommendation: 'ปรับลด GIR ให้อยู่ในช่วงเป้าหมาย 8–10 mg/kg/min (ไม่เกิน 12 mg/kg/min)',
    });
  } else if (actualGirMgKgMin < 3 && fluid.enteralMlKgDay < 80) {
    alerts.push({
      id: 'macro-gir-low',
      category: 'macro',
      severity: 'warning',
      title: `GIR (${actualGirMgKgMin.toFixed(1)} mg/kg/min) ต่ำกว่าเกณฑ์พื้นฐาน`,
      detail: 'การลด GIR ต่ำกว่า 3–4 mg/kg/min ขณะยังรับนมได้น้อยอาจเสี่ยงภาวะน้ำตาลในเลือดต่ำ (Hypoglycemia)',
      recommendation: 'ติดตามระดับ Blood Glucose อย่างใกล้ชิดทุก 4–6 ชั่วโมง',
    });
  }

  // Amino Acids Range
  const maxAa = patient.group === 'preterm' ? 3.5 : 3.0;
  if (macro.aminoAcidGKgDay > maxAa) {
    alerts.push({
      id: 'macro-aa-high',
      category: 'macro',
      severity: 'warning',
      title: `โปรตีน (${macro.aminoAcidGKgDay.toFixed(1)} g/kg/day) สูงกว่าเป้าหมายสูงสุด`,
      detail: `เกณฑ์สูงสุดสำหรับ ${patient.group === 'preterm' ? 'Preterm คือ 3.5' : 'Term คือ 3.0'} g/kg/day`,
      recommendation: 'ติดตามค่า BUN และ Blood Gas (Metabolic acidosis)',
    });
  }

  // Lipid Range & Prolonged TPN Fish Oil Recommendation
  if (macro.lipidGKgDay > 4.0) {
    alerts.push({
      id: 'macro-lipid-high',
      category: 'macro',
      severity: 'critical',
      title: `ไขมัน (${macro.lipidGKgDay.toFixed(1)} g/kg/day) เกินขนาดสูงสุด (4.0 g/kg/day)`,
      detail: 'เสี่ยง Hypertriglyceridemia และ Fat Overload Syndrome',
      recommendation: 'ลดขนาด Lipid Emulsion ไม่ให้เกิน 3.0–4.0 g/kg/day และตรวจ Serum Triglycerides',
    });
  }
  if (macro.tpnDurationDays >= 14 && macro.lipidType === 'soybean_standard') {
    alerts.push({
      id: 'macro-lipid-fishoil',
      category: 'macro',
      severity: 'warning',
      title: 'แนะนำพิจารณาเปลี่ยนเป็นไขมันสูตรผสม Fish Oil (SMOF)',
      detail: `ทารกได้รับ TPN ต่อเนื่อง ${macro.tpnDurationDays} วัน สูตร Soybean ล้วนมีความเสี่ยงต่อภาวะน้ำดีคั่งในตับ (PNALD/IFALD) สูงกว่า`,
      recommendation: 'พิจารณาใช้ Composite Lipid Emulsion ที่มี Fish oil และติดตาม Direct Bilirubin ทุก 1–2 สัปดาห์',
    });
  }

  // Non-Protein Calories to Protein Ratio
  if (macro.aminoAcidGKgDay >= 1.0 && npcToProteinRatio < 20 && fluid.enteralMlKgDay < 80) {
    alerts.push({
      id: 'macro-npc-low',
      category: 'macro',
      severity: 'warning',
      title: `สัดส่วน Non-Protein Calories : โปรตีน ต่ำ (${npcToProteinRatio.toFixed(1)} kcal/g)`,
      detail: 'เกณฑ์ที่เหมาะสมคือ 20–25 kcal ต่อโปรตีน 1 กรัม หากต่ำเกินไปกรดอะมิโนอาจถูกสลายเป็นพลังงานแทนการสร้างเนื้อเยื่อ',
      recommendation: 'พิจารณาปรับเพิ่มพลังงานจาก Dextrose (GIR) หรือ Lipid ตามเกณฑ์อายุวัน',
    });
  }

  // Electrolytes Day 1 & Urine Output Guardrails
  if (patient.dayOfLife === 1 && (micro.naMEqKgDay > 0 || micro.kMEqKgDay > 0)) {
    alerts.push({
      id: 'micro-day1-elyte',
      category: 'micro',
      severity: 'warning',
      title: 'มีการเติม Na หรือ K ใน Day 1',
      detail: 'โดยทั่วไป Day 1 มักยังไม่เติม Na และ K เพื่อรอให้ทารกขับปัสสาวะและผ่านช่วง Diuretic phase (ยกเว้นมีภาวะขาด)',
      recommendation: 'ตรวจสอบผล Electrolyte ในเลือดและปริมาณปัสสาวะก่อนสั่งเติม Na/K',
    });
  }
  if (micro.kMEqKgDay > 0 && patient.urineOutputMlKgHr < 1.0) {
    alerts.push({
      id: 'micro-k-oliguria',
      category: 'micro',
      severity: 'critical',
      title: 'ห้าม/ระวังการเติม Potassium ขณะปัสสาวะออกน้อย',
      detail: `ปัสสาวะออก ${patient.urineOutputMlKgHr.toFixed(1)} mL/kg/hr (เกณฑ์ปลอดภัยต้อง ≥ 1.0 mL/kg/hr) แต่มีการสั่ง K ${micro.kMEqKgDay.toFixed(1)} mEq/kg/day`,
      recommendation: 'งดเติม Potassium ในถุง TPN จนกว่าปัสสาวะออก ≥ 1 mL/kg/hr และระดับ K ในเลือดปกติ',
    });
  }

  // Ca-P Solubility & Molar Ratio
  if (caPSolubilityStatus === 'precipitation_risk') {
    alerts.push({
      id: 'micro-cap-precip',
      category: 'micro',
      severity: 'critical',
      title: 'เสี่ยงการตกตะกอนของ Calcium–Phosphorus ในถุง TPN',
      detail: `ความเข้มข้นในถุง Ca ${caMEqPerL.toFixed(1)} mEq/L ร่วมกับ P ${pMmolPerL.toFixed(1)} mmol/L (ที่ AA ${aminoAcidPctInBag.toFixed(1)}%) เกินเส้น Solubility Curve`,
      recommendation:
        'ปรึกษาเภสัชกรผู้เตรียมยา ลดความเข้มข้น Ca/P แยกให้ Ca ทางสายอื่น หรือปรับใช้ Organic Phosphate',
    });
  } else if (caPSolubilityStatus === 'borderline') {
    alerts.push({
      id: 'micro-cap-borderline',
      category: 'micro',
      severity: 'warning',
      title: 'ความเข้มข้น Ca–P ใกล้ขอบเขตเส้นการละลาย (Solubility Curve)',
      detail: `Ca ${caMEqPerL.toFixed(1)} mEq/L, P ${pMmolPerL.toFixed(1)} mmol/L (ขีดจำกัดโดยประมาณ ${caMaxSafeMEqPerL.toFixed(1)} mEq/L)`,
      recommendation: 'ยืนยันความเข้ากันได้กับเภสัชกรตามชนิดของ Amino acid และเกลือ Phosphate ที่โรงพยาบาลใช้',
    });
  }
  if (micro.caMEqKgDay > 0 && micro.pMmolKgDay > 0 && (caPMolarRatio < 1.3 || caPMolarRatio > 1.7)) {
    alerts.push({
      id: 'micro-cap-ratio',
      category: 'micro',
      severity: 'warning',
      title: `สัดส่วน Ca : P Molar Ratio (${caPMolarRatio.toFixed(2)} : 1) นอกช่วงแนะนำ`,
      detail: 'สัดส่วนที่เหมาะสมต่อการสร้างกระดูกในทารกคือ 1.3 : 1 ถึง 1.7 : 1',
      recommendation: 'ปรับสัดส่วน Calcium และ Phosphorus ให้สมดุลและตรวจสอบร่วมกับผลเลือด Ca/P',
    });
  }

  // Photoprotection check
  if (!micro.photoprotectionApplied) {
    alerts.push({
      id: 'micro-photoprotection',
      category: 'micro',
      severity: 'warning',
      title: 'ยังไม่ได้ระบุคำสั่งหุ้มถุงและสายสารน้ำด้วยวัสดุทึบแสง (Photoprotection)',
      detail: 'แสงทำให้เกิดอนุมูลอิสระ (Peroxides) ทำลายวิตามินและไขมันในถุง TPN',
      recommendation: 'เปิดใช้คำสั่ง Photoprotection สำหรับทั้งถุง TPN, ถุง Lipid และสายให้สารน้ำ',
    });
  }

  // Latest Lab Safety Checks
  if (labs.length > 0) {
    const latest = labs[labs.length - 1];
    if (latest.bloodGlucoseMgDl > 180) {
      alerts.push({
        id: 'lab-bg-high',
        category: 'lab',
        severity: 'critical',
        title: `ภาวะน้ำตาลในเลือดสูง (BG ${latest.bloodGlucoseMgDl} mg/dL)`,
        detail: 'ระดับน้ำตาลเกิน 180 mg/dL (เป้าหมาย 45–150 mg/dL)',
        recommendation:
          'พิจารณาลด GIR ลงทีละ 1–2 mg/kg/min (ไม่ควรลดต่ำกว่า 3–4 mg/kg/min) และตรวจซ้ำทุก 4–6 ชม.',
      });
    } else if (latest.bloodGlucoseMgDl < 45) {
      alerts.push({
        id: 'lab-bg-low',
        category: 'lab',
        severity: 'critical',
        title: `ภาวะน้ำตาลในเลือดต่ำ (BG ${latest.bloodGlucoseMgDl} mg/dL)`,
        detail: 'ระดับน้ำตาลต่ำกว่า 45 mg/dL ต้องแก้ไขเร่งด่วน',
        recommendation: 'ประเมินให้ Dextrose bolus ตามแนวทาง NICU และปรับเพิ่ม GIR ขึ้น 1–2 mg/kg/min',
      });
    }

    if (latest.triglyceridesMgDl > 250) {
      alerts.push({
        id: 'lab-tg-high',
        category: 'lab',
        severity: 'critical',
        title: `Serum Triglycerides สูง (${latest.triglyceridesMgDl} mg/dL)`,
        detail: 'ค่า TG > 250–265 mg/dL บ่งชี้การขจัดไขมันออกจากกระแสเลือดไม่ทัน',
        recommendation: 'ชะลอการปรับเพิ่ม หรือพิจารณาลดขนาด Lipid Emulsion ลงและเจาะติดตามซ้ำใน 24–48 ชม.',
      });
    }

    if (latest.directBilirubinMgDl >= 2.0) {
      alerts.push({
        id: 'lab-db-pnald',
        category: 'lab',
        severity: 'warning',
        title: `เฝ้าระวังภาวะน้ำดีคั่งในตับ PNALD/IFALD (DB ${latest.directBilirubinMgDl.toFixed(1)} mg/dL)`,
        detail: 'Direct Bilirubin ≥ 2.0 mg/dL ในผู้ป่วยที่ได้รับ TPN ต่อเนื่อง',
        recommendation:
          'เร่งเพิ่ม Enteral feeding เท่าที่รับได้ พิจารณาใช้ไขมันสูตรผสม Fish oil และลดปริมาณ Trace elements ที่มี Cu/Mn ตามดุลยพินิจแพทย์',
      });
    }
  }

  // Weaning notification
  if (fluid.enteralMlKgDay >= 100 && netPnVolumeMlDay > 0) {
    alerts.push({
      id: 'weaning-ready',
      category: 'weaning',
      severity: 'nominal',
      title: `ทารกรับนมได้ ${fluid.enteralMlKgDay} mL/kg/day — เข้าเกณฑ์พิจารณาหยุด TPN`,
      detail: 'เมื่อรับนมทางสายให้อาหารได้ดีถึง 100–120 mL/kg/day สามารถพิจารณาหยุดให้ TPN และ Lipid ได้',
      recommendation: 'ประเมินความทนต่อนมและพลังงานรวมจากนม (ปัจจุบันได้จากนม ' + enteralKcalKgDay.toFixed(1) + ' kcal/kg/day)',
    });
  }

  return {
    totalDailyFluidMl,
    enteralTotalMlDay,
    enteralKcalKgDay,
    lipidVolumeMlDay,
    nonTpnFluidMlDay,
    netPnVolumeMlDay,
    netPnMlKgDay,
    pnRateMlHr,
    lipidRateMlHr,
    actualGirMgKgMin,
    requiredDextrosePct,
    dextroseGKgDay,
    dextroseTotalGDay,
    aminoAcidTotalGDay,
    aminoAcidPctInBag,
    lipidTotalGDay,
    proteinKcalKgDay,
    carbKcalKgDay,
    lipidKcalKgDay,
    nonProteinKcalKgDay,
    tpnTotalKcalKgDay,
    grandTotalKcalKgDay,
    npcToProteinRatio,
    npcToNitrogenRatio,
    energyShares,
    osmolarityMOsmL,
    osmolarityBreakdown: {
      dextrose: dextroseOsm,
      aminoAcid: aminoAcidOsm,
      electrolytes: electrolytesOsm,
    },
    isPeripheralSafe,
    caMmolKgDay,
    caPMolarRatio,
    caMEqPerL,
    pMmolPerL,
    caMaxSafeMEqPerL,
    caPSolubilityStatus,
    recommendedMviMlDay,
    recommendedTraceMlDay,
    weaningReadiness,
    alerts,
  };
}
