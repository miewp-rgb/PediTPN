import React, { useState } from 'react';
import { Check, Copy, Printer, X } from 'lucide-react';
import {
  CalculatedTPN,
  FluidInputs,
  MacroInputs,
  MicroInputs,
  PatientProfile,
} from '../types/tpn';

interface OrderSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  fluid: FluidInputs;
  macro: MacroInputs;
  micro: MicroInputs;
  calc: CalculatedTPN;
}

const ROUTE_LABEL: Record<FluidInputs['route'], string> = {
  peripheral: 'Peripheral IV Line',
  central_uvc: 'Central Line (UVC)',
  central_picc: 'Central Line (PICC)',
  central_cvc: 'Central Line (CVC)',
};

export const OrderSummaryModal: React.FC<OrderSummaryModalProps> = ({
  isOpen,
  onClose,
  patient,
  fluid,
  macro,
  micro,
  calc,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const orderPlainText = [
    `=== ใบสรุปคำสั่งการให้ TPN ในเด็ก (Pediatric TPN Order Summary) ===`,
    `ผู้ป่วย: ${patient.label} (${patient.hn})`,
    `อายุครรภ์: ${patient.gestationalAgeWeeks} wk (${patient.group === 'preterm' ? 'Preterm' : 'Term'}) | น้ำหนัก: ${patient.weightKg.toFixed(2)} kg | อายุวัน: DOL ${patient.dayOfLife}`,
    `ทางให้สารน้ำ: ${ROUTE_LABEL[fluid.route]} | Osmolarity โดยประมาณ: ${Math.round(calc.osmolarityMOsmL)} mOsm/L`,
    ``,
    `[1. ปริมาณสารน้ำ]`,
    `- Target TFI: ${fluid.targetTfiMlKgDay} mL/kg/day (${calc.totalDailyFluidMl.toFixed(1)} mL/day)`,
    `- Enteral Feeds: ${fluid.enteralMlKgDay} mL/kg/day (${calc.enteralTotalMlDay.toFixed(1)} mL/day)`,
    `- IV Meds & Flush: ${(fluid.ivMedsMlDay + fluid.flushMlDay).toFixed(1)} mL/day`,
    `- Net Aqueous TPN Bag: ${calc.netPnVolumeMlDay.toFixed(1)} mL/day @ ${calc.pnRateMlHr.toFixed(2)} mL/hr (${fluid.pnInfusionHours} hr)`,
    ``,
    `[2. สารอาหารหลักและพลังงาน]`,
    `- Dextrose: ${calc.requiredDextrosePct.toFixed(2)}% (GIR ${calc.actualGirMgKgMin.toFixed(2)} mg/kg/min · ${calc.dextroseGKgDay.toFixed(1)} g/kg/day)`,
    `- Amino Acids: ${macro.aminoAcidGKgDay.toFixed(1)} g/kg/day (รวม ${calc.aminoAcidTotalGDay.toFixed(2)} g/day · เข้มข้น ${calc.aminoAcidPctInBag.toFixed(2)}%)`,
    `- 20% Lipid Emulsion (${macro.lipidType === 'smof_fish_oil' ? 'Fish oil / SMOF' : 'Soybean'}): ${macro.lipidGKgDay.toFixed(1)} g/kg/day = ${calc.lipidVolumeMlDay.toFixed(1)} mL/day @ ${calc.lipidRateMlHr.toFixed(2)} mL/hr (${fluid.lipidInfusionHours} hr)`,
    `- พลังงานรวม: TPN ${calc.tpnTotalKcalKgDay.toFixed(1)} + Enteral ${calc.enteralKcalKgDay.toFixed(1)} = ${calc.grandTotalKcalKgDay.toFixed(1)} kcal/kg/day | NPC:Protein = ${calc.npcToProteinRatio.toFixed(1)} kcal/g`,
    ``,
    `[3. เกลือแร่ วิตามิน และการป้องกันแสง]`,
    `- Na: ${micro.naMEqKgDay.toFixed(1)} mEq/kg/day | K: ${micro.kMEqKgDay.toFixed(1)} mEq/kg/day | Mg: ${micro.mgMEqKgDay.toFixed(2)} mEq/kg/day`,
    `- Ca: ${micro.caMEqKgDay.toFixed(1)} mEq/kg/day (${calc.caMEqPerL.toFixed(1)} mEq/L) | P: ${micro.pMmolKgDay.toFixed(2)} mmol/kg/day (${calc.pMmolPerL.toFixed(1)} mmol/L) | Ca:P Molar Ratio = ${calc.caPMolarRatio.toFixed(2)}:1`,
    `- Pediatric MVI: ${micro.multivitaminOrdered ? `${calc.recommendedMviMlDay.toFixed(2)} mL/day` : 'ไม่ได้สั่ง'} | Trace Elements: ${micro.traceElementsOrdered ? `${calc.recommendedTraceMlDay.toFixed(2)} mL/day` : 'ไม่ได้สั่ง'}`,
    `- Photoprotection: ${micro.photoprotectionApplied ? 'หุ้มถุง TPN, ถุงไขมัน และสายให้สารน้ำด้วยวัสดุทึบแสง' : 'ยังไม่ได้ระบุ'}`,
  ].join('\n');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderPlainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-summary-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 no-print">
          <div>
            <h2 id="order-summary-title" className="text-base font-bold text-slate-900">
              ใบสรุปคำสั่งการรักษา TPN (Pediatric TPN Order Summary)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ตรวจสอบความถูกต้องร่วมกับเภสัชกรก่อนผสมและบริหารยา
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer whitespace-nowrap"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              พิมพ์ใบสั่ง
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิดหน้าต่าง"
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Patient Info Header */}
          <div className="pb-4 border-b border-slate-200 flex flex-wrap justify-between gap-4">
            <div>
              <div className="text-base font-bold text-slate-900">{patient.label}</div>
              <div className="text-xs text-slate-600 mt-1">
                {patient.hn} · GA {patient.gestationalAgeWeeks} wk ({patient.group === 'preterm' ? 'Preterm' : 'Term'}) · DOL {patient.dayOfLife} · น้ำหนัก{' '}
                <span className="font-mono font-semibold tabular-nums">{patient.weightKg.toFixed(2)} kg</span>
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="font-semibold text-slate-900">{ROUTE_LABEL[fluid.route]}</div>
              <div className="font-mono tabular-nums text-slate-600 mt-0.5">
                Est. Osmolarity: {Math.round(calc.osmolarityMOsmL)} mOsm/L
              </div>
            </div>
          </div>

          {/* Order Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Aqueous Bag */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ถุงสารอาหารหลัก (Aqueous TPN Bag)
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-600">ปริมาตรถุงสุทธิ / อัตราหยด</span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900">
                    {calc.netPnVolumeMlDay.toFixed(1)} mL ({calc.pnRateMlHr.toFixed(2)} mL/hr)
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-600">Dextrose Concentration / GIR</span>
                  <span className="font-mono font-semibold tabular-nums text-sky-800">
                    {calc.requiredDextrosePct.toFixed(2)}% (GIR {calc.actualGirMgKgMin.toFixed(2)})
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-600">Amino Acids</span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900">
                    {macro.aminoAcidGKgDay.toFixed(1)} g/kg/d ({calc.aminoAcidTotalGDay.toFixed(2)} g)
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-600">Sodium (Na) / Potassium (K)</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    Na {micro.naMEqKgDay.toFixed(1)} · K {micro.kMEqKgDay.toFixed(1)} mEq/kg/d
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-600">Calcium / Phosphorus / Mg</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    Ca {micro.caMEqKgDay.toFixed(1)} mEq · P {micro.pMmolKgDay.toFixed(2)} mmol · Mg {micro.mgMEqKgDay.toFixed(2)} mEq
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-600">Ca : P Molar Ratio &amp; Solubility</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    {calc.caPMolarRatio.toFixed(2)}:1 (Ca {calc.caMEqPerL.toFixed(1)} mEq/L, P {calc.pMmolPerL.toFixed(1)} mmol/L)
                  </span>
                </div>
              </div>
            </div>

            {/* Lipid, Additives & Energy */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                ไขมัน วิตามิน และสรุปพลังงาน
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2 flex justify-between">
                  <span className="text-slate-600">20% Lipid Emulsion</span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900">
                    {macro.lipidGKgDay.toFixed(1)} g/kg/d ({calc.lipidVolumeMlDay.toFixed(1)} mL)
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-600">อัตราหยดไขมัน ({fluid.lipidInfusionHours} hr)</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    {calc.lipidRateMlHr.toFixed(2)} mL/hr ({macro.lipidType === 'smof_fish_oil' ? 'Fish oil / SMOF' : 'Soybean'})
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-600">Pediatric MVI / Trace Elements</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    {micro.multivitaminOrdered ? `MVI ${calc.recommendedMviMlDay.toFixed(2)} mL` : 'No MVI'} ·{' '}
                    {micro.traceElementsOrdered ? `TE ${calc.recommendedTraceMlDay.toFixed(2)} mL` : 'No TE'}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-600">พลังงานรวม (TPN + นม)</span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900">
                    {calc.grandTotalKcalKgDay.toFixed(1)} kcal/kg/d (TPN {calc.tpnTotalKcalKgDay.toFixed(1)})
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-600">NPC : Protein Ratio</span>
                  <span className="font-mono tabular-nums text-slate-900">
                    {calc.npcToProteinRatio.toFixed(1)} kcal / g AA
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-slate-600">Photoprotection</span>
                  <span className="font-medium text-slate-900">
                    {micro.photoprotectionApplied ? 'หุ้มถุงและสายด้วยวัสดุทึบแสง' : 'ยังไม่ได้ระบุ'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts Reminder inside Order Summary */}
          {calc.alerts.length > 0 ? (
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/70 space-y-1.5">
              <div className="text-xs font-semibold text-amber-950">
                ข้อควรตรวจสอบก่อนอนุมัติใบสั่ง ({calc.alerts.length} รายการ)
              </div>
              <ul className="list-disc pl-4 space-y-1 text-xs text-amber-900">
                {calc.alerts.map((a) => (
                  <li key={a.id}>
                    <span className="font-semibold">{a.title}:</span> {a.recommendation}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between">
            <span>เครื่องมือช่วยคำนวณทางคลินิก — แพทย์และเภสัชกรต้องตรวจสอบซ้ำก่อนบริหารยาจริง</span>
            <span className="font-mono">PediTPN Clinical</span>
          </div>
        </div>
      </div>
    </div>
  );
};
