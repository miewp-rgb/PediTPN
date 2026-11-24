import React from 'react';
import { MACRONUTRIENT_GUIDELINES } from '../data/presets';
import { CalculatedTPN, FluidInputs, MacroInputs, PatientProfile } from '../types/tpn';

interface MacroEnergySectionProps {
  patient: PatientProfile;
  fluid: FluidInputs;
  macro: MacroInputs;
  calc: CalculatedTPN;
  onUpdateMacro: (patch: Partial<MacroInputs>) => void;
}

export const MacroEnergySection: React.FC<MacroEnergySectionProps> = ({
  patient,
  fluid,
  macro,
  calc,
  onUpdateMacro,
}) => {
  const isPreterm = patient.group === 'preterm';
  const energyTargetRange =
    patient.phase === 'acute' ? { min: 45, max: 55, label: 'Acute Phase (45–55 kcal/kg/day)' } : { min: 90, max: 120, label: 'Growth Phase (90–120 kcal/kg/day)' };

  const energyStatus =
    calc.grandTotalKcalKgDay < energyTargetRange.min
      ? { label: 'ต่ำกว่าเป้าหมายระยะนี้', tone: 'text-amber-700' }
      : calc.grandTotalKcalKgDay > energyTargetRange.max
      ? { label: 'สูงกว่าเป้าหมายระยะนี้', tone: 'text-amber-700' }
      : { label: 'อยู่ในช่วงเป้าหมาย', tone: 'text-emerald-700' };

  const npcStatus =
    calc.npcToProteinRatio >= 20 && calc.npcToProteinRatio <= 25
      ? { label: 'สมดุลเหมาะสม (20–25 kcal/g)', tone: 'text-emerald-700' }
      : calc.npcToProteinRatio < 20
      ? { label: 'ต่ำกว่าเกณฑ์ (<20 · เสี่ยงสลายโปรตีน)', tone: 'text-amber-700' }
      : { label: 'สูงกว่า 25 kcal/g', tone: 'text-slate-600' };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            2. การคำนวณสารอาหารหลัก (Macronutrients), GIR และพลังงาน
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ปรับขนาดโปรตีน คาร์โบไฮเดรต (GIR / %Dextrose) และไขมัน พร้อมตรวจสอบสมดุลพลังงานและ Non-Protein Calories
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
          {isPreterm ? 'เกณฑ์ Preterm' : 'เกณฑ์ Term'} · {energyTargetRange.label}
        </div>
      </div>

      {/* Main 3-Macronutrient Controls */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200">
        {/* 1. Amino Acids */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-4">
            <div className="text-sm font-semibold text-slate-900">โปรตีน (Amino Acids)</div>
            <div className="text-xs text-slate-500 mt-1 leading-relaxed">
              Day 1: {isPreterm ? '≥ 1.5' : '1.5'} g/kg/day · เพิ่ม 0.5–1.0/วัน
              <br />
              เป้าหมายสูงสุด: {isPreterm ? '2.5–3.5' : '1.5–3.0'} g/kg/day · 4 kcal/g
            </div>
          </div>

          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">ขนาดที่สั่ง</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="4.5"
                  value={macro.aminoAcidGKgDay}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isNaN(v) && v >= 0) onUpdateMacro({ aminoAcidGKgDay: v });
                  }}
                  className="w-20 px-2 py-1 text-right text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-sky-600"
                />
                <span className="text-xs font-mono text-slate-500">g/kg/day</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="4.0"
              step="0.1"
              value={macro.aminoAcidGKgDay}
              onChange={(e) => onUpdateMacro({ aminoAcidGKgDay: parseFloat(e.target.value) })}
              className="w-full clinical-slider"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>0</span>
              <span>Day 1 (1.5)</span>
              <span>Target ({isPreterm ? '2.5–3.5' : '1.5–3.0'})</span>
              <span>4.0</span>
            </div>
          </div>

          <div className="lg:col-span-3 lg:text-right space-y-1">
            <div className="text-lg font-mono font-bold tabular-nums text-slate-900">
              {calc.proteinKcalKgDay.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-500">kcal/kg/d</span>
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500">
              รวม {calc.aminoAcidTotalGDay.toFixed(2)} g/day · เข้มข้นในถุง{' '}
              {calc.aminoAcidPctInBag.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* 2. Carbohydrates (Dextrose / GIR) */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
            <div className="lg:col-span-4 space-y-2">
              <div className="text-sm font-semibold text-slate-900">
                คาร์โบไฮเดรต (Dextrose / GIR)
              </div>
              <div className="text-xs text-slate-500 leading-relaxed">
                Day 1: {isPreterm ? '4–6' : '3–5'} mg/kg/min · เพิ่ม 1–2/วัน
                <br />
                เป้าหมาย: 8–10 · สูงสุด: 12 mg/kg/min (≤ 18 g/kg/day)
              </div>
              {/* Bidirectional Mode Switch */}
              <div className="inline-flex p-0.5 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => onUpdateMacro({ girMode: 'gir', targetGirMgKgMin: Number(calc.actualGirMgKgMin.toFixed(1)) })}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    macro.girMode === 'gir'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  กำหนดจาก GIR
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateMacro({
                      girMode: 'dextrose',
                      directDextrosePct: Number(calc.requiredDextrosePct.toFixed(1)),
                    })
                  }
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    macro.girMode === 'dextrose'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  กำหนดจาก %Dextrose
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-2">
              {macro.girMode === 'gir' ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">GIR เป้าหมาย</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="15"
                        value={macro.targetGirMgKgMin}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!Number.isNaN(v) && v >= 0) onUpdateMacro({ targetGirMgKgMin: v });
                        }}
                        className="w-20 px-2 py-1 text-right text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-sky-600"
                      />
                      <span className="text-xs font-mono text-slate-500">mg/kg/min</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="14"
                    step="0.5"
                    value={macro.targetGirMgKgMin}
                    onChange={(e) => onUpdateMacro({ targetGirMgKgMin: parseFloat(e.target.value) })}
                    className="w-full clinical-slider"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>2</span>
                    <span>Day 1 ({isPreterm ? '4–6' : '3–5'})</span>
                    <span>Target (8–10)</span>
                    <span>Max 12</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">ความเข้มข้น Dextrose ในถุง</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        min="5"
                        max="30"
                        value={macro.directDextrosePct}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!Number.isNaN(v) && v >= 0) onUpdateMacro({ directDextrosePct: v });
                        }}
                        className="w-20 px-2 py-1 text-right text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-sky-600"
                      />
                      <span className="text-xs font-mono text-slate-500">% w/v</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="25"
                    step="0.5"
                    value={macro.directDextrosePct}
                    onChange={(e) => onUpdateMacro({ directDextrosePct: parseFloat(e.target.value) })}
                    className="w-full clinical-slider"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span>5%</span>
                    <span>Peripheral ≤ 12.5%</span>
                    <span>Central 15–25%</span>
                  </div>
                </>
              )}
            </div>

            <div className="lg:col-span-3 lg:text-right space-y-1">
              <div className="text-lg font-mono font-bold tabular-nums text-slate-900">
                {calc.carbKcalKgDay.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-500">kcal/kg/d</span>
              </div>
              <div className="text-xs font-mono tabular-nums text-slate-600">
                Dextrose{' '}
                <span
                  className={`font-semibold ${
                    fluid.route === 'peripheral' && calc.requiredDextrosePct > 12.5
                      ? 'text-rose-700'
                      : 'text-sky-800'
                  }`}
                >
                  {calc.requiredDextrosePct.toFixed(2)}%
                </span>{' '}
                · GIR {calc.actualGirMgKgMin.toFixed(2)}
              </div>
              <div className="text-[11px] font-mono tabular-nums text-slate-500">
                {calc.dextroseGKgDay.toFixed(1)} g/kg/day (รวม {calc.dextroseTotalGDay.toFixed(1)} g)
              </div>
            </div>
          </div>

          {/* Live Formula Breakdown Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-semibold text-slate-700 mb-1">
                สูตรคำนวณ GIR (mg/kg/min)
              </div>
              <div className="font-mono tabular-nums text-slate-600 leading-relaxed">
                (%Dextrose × PN Rate) / (6 × Weight)
                <br />
                = ({calc.requiredDextrosePct.toFixed(2)} × {calc.pnRateMlHr.toFixed(2)}) / (6 ×{' '}
                {patient.weightKg.toFixed(2)}) ={' '}
                <span className="font-semibold text-slate-900">
                  {calc.actualGirMgKgMin.toFixed(2)} mg/kg/min
                </span>
              </div>
            </div>
            <div>
              <div className="font-semibold text-slate-700 mb-1">
                สูตรความเข้มข้น Dextrose ที่ต้องการ (%)
              </div>
              <div className="font-mono tabular-nums text-slate-600 leading-relaxed">
                (GIR × Weight × 6) / PN Rate (mL/hr)
                <br />
                = ({calc.actualGirMgKgMin.toFixed(2)} × {patient.weightKg.toFixed(2)} × 6) /{' '}
                {calc.pnRateMlHr.toFixed(2)} ={' '}
                <span className="font-semibold text-sky-800">
                  {calc.requiredDextrosePct.toFixed(2)} %
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Lipid Emulsion */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-4 space-y-2">
            <div className="text-sm font-semibold text-slate-900">ไขมัน (20% Lipid Emulsion)</div>
            <div className="text-xs text-slate-500 leading-relaxed">
              Day 1: 1.0–2.0 g/kg/day · เพิ่ม 0.5–1.0/วัน
              <br />
              สูงสุด: 3.0–4.0 g/kg/day · 20% ILE = 2 kcal/mL (10 kcal/g)
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <select
                aria-label="ชนิดไขมัน"
                value={macro.lipidType}
                onChange={(e) =>
                  onUpdateMacro({
                    lipidType: e.target.value as MacroInputs['lipidType'],
                  })
                }
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-700 focus:outline-none focus:border-sky-600"
              >
                <option value="smof_fish_oil">สูตรผสม Fish oil (SMOF — แนะนำระยะยาว)</option>
                <option value="soybean_standard">Soybean-based 20% ILE</option>
              </select>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">ขนาดไขมันที่สั่ง</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="4.5"
                  value={macro.lipidGKgDay}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isNaN(v) && v >= 0) onUpdateMacro({ lipidGKgDay: v });
                  }}
                  className="w-20 px-2 py-1 text-right text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-sky-600"
                />
                <span className="text-xs font-mono text-slate-500">g/kg/day</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="4.0"
              step="0.25"
              value={macro.lipidGKgDay}
              onChange={(e) => onUpdateMacro({ lipidGKgDay: parseFloat(e.target.value) })}
              className="w-full clinical-slider"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span>0</span>
              <span>Day 1 (1–2)</span>
              <span>Target (3.0)</span>
              <span>Max 4.0</span>
            </div>
          </div>

          <div className="lg:col-span-3 lg:text-right space-y-1">
            <div className="text-lg font-mono font-bold tabular-nums text-slate-900">
              {calc.lipidKcalKgDay.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-500">kcal/kg/d</span>
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500">
              ปริมาตร {calc.lipidVolumeMlDay.toFixed(1)} mL/day ({calc.lipidRateMlHr.toFixed(2)} mL/hr)
            </div>
          </div>
        </div>
      </div>

      {/* Energy Summary & Non-Protein Calories Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Energy Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">พลังงานรวม (Total Energy)</h2>
              <p className="text-xs text-slate-500 mt-0.5">{energyTargetRange.label}</p>
            </div>
            <span className={`text-xs font-semibold ${energyStatus.tone}`}>
              {energyStatus.label}
            </span>
          </div>

          <div className="flex items-baseline gap-4">
            <div>
              <span className="text-3xl font-mono font-bold tabular-nums text-slate-900">
                {calc.grandTotalKcalKgDay.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-slate-500 ml-1.5">kcal/kg/day (รวมนม)</span>
            </div>
            <div className="text-xs font-mono tabular-nums text-slate-500">
              TPN: {calc.tpnTotalKcalKgDay.toFixed(1)} · นม: {calc.enteralKcalKgDay.toFixed(1)}
            </div>
          </div>

          {/* Stacked Bar of TPN Energy Distribution */}
          <div className="space-y-2 pt-2">
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="bg-sky-600 h-full transition-all duration-200"
                style={{ width: `${calc.energyShares.carbPct}%` }}
                title={`Dextrose ${calc.energyShares.carbPct.toFixed(0)}%`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-200"
                style={{ width: `${calc.energyShares.lipidPct}%` }}
                title={`Lipid ${calc.energyShares.lipidPct.toFixed(0)}%`}
              />
              <div
                className="bg-teal-600 h-full transition-all duration-200"
                style={{ width: `${calc.energyShares.proteinPct}%` }}
                title={`Protein ${calc.energyShares.proteinPct.toFixed(0)}%`}
              />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600 font-mono tabular-nums">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-600" />
                Dextrose {calc.energyShares.carbPct.toFixed(0)}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                Lipid {calc.energyShares.lipidPct.toFixed(0)}%
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-teal-600" />
                Protein {calc.energyShares.proteinPct.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Non-Protein Calories to Protein Ratio */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                สัดส่วน Non-Protein Calories ต่อโปรตีน
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                เกณฑ์แนะนำ 20–25 kcal (จากคาร์โบไฮเดรต+ไขมัน) ต่อโปรตีน 1 กรัม
              </p>
            </div>
            <span className={`text-xs font-semibold ${npcStatus.tone}`}>{npcStatus.label}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-slate-500">NPC : Protein</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-mono font-bold tabular-nums text-slate-900">
                  {calc.npcToProteinRatio.toFixed(1)}
                </span>
                <span className="text-xs font-mono text-slate-500">kcal / g AA</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">NPC : Nitrogen (N)</div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-mono font-semibold tabular-nums text-slate-700">
                  {Math.round(calc.npcToNitrogenRatio)} : 1
                </span>
                <span className="text-xs font-mono text-slate-500">kcal / g N</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 leading-relaxed">
            Non-protein calories รวม{' '}
            <span className="font-mono font-semibold tabular-nums text-slate-900">
              {calc.nonProteinKcalKgDay.toFixed(1)} kcal/kg/day
            </span>{' '}
            ช่วยให้ร่างกายนำกรดอะมิโน ({macro.aminoAcidGKgDay.toFixed(1)} g/kg/day) ไปสร้างเนื้อเยื่อโดยไม่ถูกสลายเป็นพลังงาน
          </div>
        </div>
      </div>

      {/* Reference Guideline Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">
            ตารางเกณฑ์มาตรฐานสารอาหารหลักในเด็กและทารกแรกเกิด
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-6">สารอาหาร</th>
                <th className="py-3 px-4">เกณฑ์เริ่มต้น (Day 1)</th>
                <th className="py-3 px-4">อัตราการปรับเพิ่ม (Advance)</th>
                <th className="py-3 px-4">เป้าหมายสูงสุด (Target / Max)</th>
                <th className="py-3 px-6 text-right">ค่าพลังงาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {MACRONUTRIENT_GUIDELINES.map((row) => (
                <tr key={row.nutrient} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-6 font-semibold text-slate-900 whitespace-nowrap">
                    {row.nutrient}
                  </td>
                  <td className="py-3.5 px-4 leading-relaxed">{row.day1}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{row.advance}</td>
                  <td className="py-3.5 px-4 leading-relaxed">{row.targetMax}</td>
                  <td className="py-3.5 px-6 text-right font-mono tabular-nums whitespace-nowrap text-slate-900">
                    {row.energy}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
