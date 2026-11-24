import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { CalculatedTPN, MicroInputs, PatientProfile } from '../types/tpn';
import { getCaMaxSafeMEqPerL } from '../utils/tpnCalculations';

interface MicroCaPSectionProps {
  patient: PatientProfile;
  micro: MicroInputs;
  calc: CalculatedTPN;
  onUpdateMicro: (patch: Partial<MicroInputs>) => void;
}

export const MicroCaPSection: React.FC<MicroCaPSectionProps> = ({
  patient,
  micro,
  calc,
  onUpdateMicro,
}) => {
  // SVG Solubility Curve dimensions & coordinates
  const width = 460;
  const height = 240;
  const pad = { top: 20, right: 24, bottom: 38, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const maxP = 30; // mmol/L
  const maxCa = 60; // mEq/L

  const xScale = (p: number) => pad.left + (Math.min(maxP, Math.max(0, p)) / maxP) * plotW;
  const yScale = (ca: number) => pad.top + plotH - (Math.min(maxCa, Math.max(0, ca)) / maxCa) * plotH;

  const buildCurvePath = (aaPct: number) => {
    const pts: string[] = [];
    for (let p = 2; p <= maxP; p += 1) {
      const caLimit = Math.min(maxCa, getCaMaxSafeMEqPerL(p, aaPct));
      pts.push(`${pts.length === 0 ? 'M' : 'L'} ${xScale(p).toFixed(1)} ${yScale(caLimit).toFixed(1)}`);
    }
    return pts.join(' ');
  };

  const buildSafeAreaPath = (aaPct: number) => {
    const pts: string[] = [];
    for (let p = 0; p <= maxP; p += 1) {
      const caLimit = Math.min(maxCa, getCaMaxSafeMEqPerL(p, aaPct));
      pts.push(`${pts.length === 0 ? 'M' : 'L'} ${xScale(p).toFixed(1)} ${yScale(caLimit).toFixed(1)}`);
    }
    pts.push(`L ${xScale(maxP).toFixed(1)} ${yScale(0).toFixed(1)}`);
    pts.push(`L ${xScale(0).toFixed(1)} ${yScale(0).toFixed(1)} Z`);
    return pts.join(' ');
  };

  const ptX = xScale(calc.pMmolPerL);
  const ptY = yScale(calc.caMEqPerL);

  const caRatioInTarget = calc.caPMolarRatio >= 1.3 && calc.caPMolarRatio <= 1.7;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            3. เกลือแร่ วิตามิน แร่ธาตุปริมาณน้อย และความละลาย Ca–P
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            กำหนดขนาด Na, K, Mg ตามอายุวันและปริมาณปัสสาวะ พร้อมตรวจสอบสัดส่วน Ca : P Molar Ratio และ Solubility Curve
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
          DOL {patient.dayOfLife} · UOP {patient.urineOutputMlKgHr.toFixed(1)} mL/kg/hr · AA ในถุง{' '}
          {calc.aminoAcidPctInBag.toFixed(1)}%
        </div>
      </div>

      {/* Block A: Electrolytes (Na, K, Mg) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              เกลือแร่หลัก (Electrolytes: Na, K, Mg)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Day 1 มักยังไม่เติม Na/K · Day 2–3 เป็นต้นไปเริ่ม Na 2–3 และ K 1–2 mEq/kg/day เมื่อปัสสาวะ ≥ 1 mL/kg/hr
            </p>
          </div>
          {patient.dayOfLife === 1 && (micro.naMEqKgDay > 0 || micro.kMEqKgDay > 0) ? (
            <button
              type="button"
              onClick={() => onUpdateMicro({ naMEqKgDay: 0, kMEqKgDay: 0 })}
              className="px-3 py-1.5 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 hover:bg-amber-100 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
            >
              ตั้งค่า Na/K = 0 สำหรับ Day 1
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Sodium */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="na-input" className="text-sm font-semibold text-slate-900">
                Sodium (Na)
              </label>
              <span className="text-xs font-mono text-slate-500">mEq/kg/day</span>
            </div>
            <input
              id="na-input"
              type="number"
              step="0.5"
              min="0"
              max="8"
              value={micro.naMEqKgDay}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v) && v >= 0) onUpdateMicro({ naMEqKgDay: v });
              }}
              className="w-full px-3 py-2 text-base font-mono font-semibold tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
            />
            <input
              type="range"
              min="0"
              max="6"
              step="0.5"
              value={micro.naMEqKgDay}
              onChange={(e) => onUpdateMicro({ naMEqKgDay: parseFloat(e.target.value) })}
              className="w-full clinical-slider"
            />
            <div className="text-xs text-slate-500 space-y-0.5">
              <div className="font-mono tabular-nums text-slate-700">
                รวม {(micro.naMEqKgDay * patient.weightKg).toFixed(2)} mEq/day
              </div>
              <div>Day 1: 0 · Day 2–3+: 2–3 mEq/kg/day</div>
            </div>
          </div>

          {/* Potassium */}
          <div
            className={`p-4 rounded-lg border space-y-3 ${
              micro.kMEqKgDay > 0 && patient.urineOutputMlKgHr < 1.0
                ? 'bg-rose-50/70 border-rose-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <label htmlFor="k-input" className="text-sm font-semibold text-slate-900">
                Potassium (K)
              </label>
              <span className="text-xs font-mono text-slate-500">mEq/kg/day</span>
            </div>
            <input
              id="k-input"
              type="number"
              step="0.5"
              min="0"
              max="5"
              value={micro.kMEqKgDay}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v) && v >= 0) onUpdateMicro({ kMEqKgDay: v });
              }}
              className="w-full px-3 py-2 text-base font-mono font-semibold tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
            />
            <input
              type="range"
              min="0"
              max="4"
              step="0.5"
              value={micro.kMEqKgDay}
              onChange={(e) => onUpdateMicro({ kMEqKgDay: parseFloat(e.target.value) })}
              className="w-full clinical-slider"
            />
            <div className="text-xs text-slate-500 space-y-0.5">
              <div className="font-mono tabular-nums text-slate-700">
                รวม {(micro.kMEqKgDay * patient.weightKg).toFixed(2)} mEq/day
              </div>
              <div
                className={
                  patient.urineOutputMlKgHr < 1.0 ? 'text-rose-700 font-medium' : 'text-slate-500'
                }
              >
                {patient.urineOutputMlKgHr < 1.0
                  ? 'ปัสสาวะ < 1 mL/kg/hr — ควรงดเติม K'
                  : 'Day 2–3+: 1–2 mEq/kg/day (UOP ดี)'}
              </div>
            </div>
          </div>

          {/* Magnesium */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="mg-input" className="text-sm font-semibold text-slate-900">
                Magnesium (Mg)
              </label>
              <span className="text-xs font-mono text-slate-500">mEq/kg/day</span>
            </div>
            <input
              id="mg-input"
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={micro.mgMEqKgDay}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v) && v >= 0) onUpdateMicro({ mgMEqKgDay: v });
              }}
              className="w-full px-3 py-2 text-base font-mono font-semibold tabular-nums bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
            />
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={micro.mgMEqKgDay}
              onChange={(e) => onUpdateMicro({ mgMEqKgDay: parseFloat(e.target.value) })}
              className="w-full clinical-slider"
            />
            <div className="text-xs text-slate-500 space-y-0.5">
              <div className="font-mono tabular-nums text-slate-700">
                รวม {(micro.mgMEqKgDay * patient.weightKg).toFixed(2)} mEq/day
              </div>
              <div>เกณฑ์แนะนำ: 0.2–0.4 mEq/kg/day</div>
            </div>
          </div>
        </div>
      </div>

      {/* Block B: Calcium & Phosphorus + Interactive Solubility Curve */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Calcium &amp; Phosphorus และความเสี่ยงการตกตะกอน (Ca–P Solubility Curve)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              เป้าหมายสัดส่วน Ca : P molar ratio 1.3 : 1 ถึง 1.7 : 1 · ตรวจสอบความเข้มข้นในถุงร่วมกับเภสัชกรผู้เตรียมยา
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-600">
            1 mmol Ca = 2 mEq Ca = 40 mg
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Ca & P Controls + Ratio */}
          <div className="lg:col-span-5 space-y-4">
            {/* Calcium */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="ca-input" className="text-xs font-semibold text-slate-700">
                  Calcium (Ca Gluconate)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="ca-input"
                    type="number"
                    step="0.2"
                    min="0"
                    max="6"
                    value={micro.caMEqKgDay}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!Number.isNaN(v) && v >= 0) onUpdateMicro({ caMEqKgDay: v });
                    }}
                    className="w-20 px-2 py-1 text-right text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-sky-600"
                  />
                  <span className="text-xs font-mono text-slate-500">mEq/kg/d</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="4.5"
                step="0.1"
                value={micro.caMEqKgDay}
                onChange={(e) => onUpdateMicro({ caMEqKgDay: parseFloat(e.target.value) })}
                className="w-full clinical-slider"
              />
              <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-500">
                <span>= {calc.caMmolKgDay.toFixed(2)} mmol/kg/d</span>
                <span>ในถุง: {calc.caMEqPerL.toFixed(1)} mEq/L</span>
              </div>
            </div>

            {/* Phosphorus */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="p-input" className="text-xs font-semibold text-slate-700">
                  Phosphorus (Phosphate)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="p-input"
                    type="number"
                    step="0.1"
                    min="0"
                    max="3"
                    value={micro.pMmolKgDay}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!Number.isNaN(v) && v >= 0) onUpdateMicro({ pMmolKgDay: v });
                    }}
                    className="w-20 px-2 py-1 text-right text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-sky-600"
                  />
                  <span className="text-xs font-mono text-slate-500">mmol/kg/d</span>
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="2.5"
                step="0.05"
                value={micro.pMmolKgDay}
                onChange={(e) => onUpdateMicro({ pMmolKgDay: parseFloat(e.target.value) })}
                className="w-full clinical-slider"
              />
              <div className="flex justify-between text-[11px] font-mono tabular-nums text-slate-500">
                <span>รวม {(micro.pMmolKgDay * patient.weightKg).toFixed(2)} mmol/d</span>
                <span>ในถุง: {calc.pMmolPerL.toFixed(1)} mmol/L</span>
              </div>
            </div>

            {/* Ca:P Ratio & Solubility Status Box */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-slate-600">Ca : P Molar Ratio</span>
                <span
                  className={`text-lg font-mono font-bold tabular-nums ${
                    caRatioInTarget ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {calc.caPMolarRatio > 0 ? `${calc.caPMolarRatio.toFixed(2)} : 1` : '—'}
                </span>
              </div>

              <div
                className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                  calc.caPSolubilityStatus === 'precipitation_risk'
                    ? 'border-rose-200 bg-rose-50/70 text-rose-950'
                    : calc.caPSolubilityStatus === 'borderline'
                    ? 'border-amber-200 bg-amber-50/70 text-amber-950'
                    : 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
                }`}
              >
                <div className="flex items-start gap-2">
                  {calc.caPSolubilityStatus === 'precipitation_risk' ? (
                    <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                  ) : calc.caPSolubilityStatus === 'borderline' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold">
                      {calc.caPSolubilityStatus === 'precipitation_risk'
                        ? 'เสี่ยงการตกตะกอน Ca–P (เหนือเส้นความละลาย)'
                        : calc.caPSolubilityStatus === 'borderline'
                        ? 'ใกล้ขอบเขตการตกตะกอน — ยืนยันกับเภสัชกร'
                        : 'อยู่ในโซนละลายปลอดภัยโดยประมาณ'}
                    </div>
                    <div className="mt-0.5 font-mono tabular-nums opacity-90">
                      จุดปัจจุบัน: Ca {calc.caMEqPerL.toFixed(1)} mEq/L · P{' '}
                      {calc.pMmolPerL.toFixed(1)} mmol/L (ขีดจำกัด ~
                      {calc.caMaxSafeMEqPerL.toFixed(1)} mEq/L ที่ AA{' '}
                      {calc.aminoAcidPctInBag.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Interactive SVG Solubility Curve */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-semibold text-slate-700">
                กราฟความละลาย Ca–P ตามความเข้มข้น Amino Acid ในถุง TPN
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                AA ปัจจุบัน: {calc.aminoAcidPctInBag.toFixed(1)}%
              </div>
            </div>

            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto select-none"
              role="img"
              aria-label="กราฟความละลายแคลเซียมและฟอสฟอรัส"
            >
              {/* Grid lines */}
              {[0, 15, 30, 45, 60].map((caVal) => (
                <g key={`y-${caVal}`}>
                  <line
                    x1={pad.left}
                    y1={yScale(caVal)}
                    x2={width - pad.right}
                    y2={yScale(caVal)}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                  <text
                    x={pad.left - 8}
                    y={yScale(caVal) + 3.5}
                    textAnchor="end"
                    className="fill-slate-400 text-[10px] font-mono"
                  >
                    {caVal}
                  </text>
                </g>
              ))}
              {[0, 5, 10, 15, 20, 25, 30].map((pVal) => (
                <g key={`x-${pVal}`}>
                  <line
                    x1={xScale(pVal)}
                    y1={pad.top}
                    x2={xScale(pVal)}
                    y2={height - pad.bottom}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                  <text
                    x={xScale(pVal)}
                    y={height - pad.bottom + 14}
                    textAnchor="middle"
                    className="fill-slate-400 text-[10px] font-mono"
                  >
                    {pVal}
                  </text>
                </g>
              ))}

              {/* Safe region shading for current AA% */}
              <path d={buildSafeAreaPath(calc.aminoAcidPctInBag)} fill="#0284c7" fillOpacity="0.09" />

              {/* Reference Curves: AA 1%, AA 2%, AA 3% */}
              <path
                d={buildCurvePath(1.0)}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.25"
                strokeDasharray="4 3"
              />
              <path
                d={buildCurvePath(2.0)}
                fill="none"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <path d={buildCurvePath(3.0)} fill="none" stroke="#334155" strokeWidth="1.5" />

              {/* Active Bag AA% Curve */}
              <path
                d={buildCurvePath(calc.aminoAcidPctInBag)}
                fill="none"
                stroke="#0369a1"
                strokeWidth="2.2"
              />

              {/* Curve Labels */}
              <text x={xScale(25)} y={yScale(getCaMaxSafeMEqPerL(25, 1)) - 4} className="fill-slate-400 text-[9px] font-mono">
                AA 1%
              </text>
              <text x={xScale(25)} y={yScale(getCaMaxSafeMEqPerL(25, 2)) - 4} className="fill-slate-600 text-[9px] font-mono">
                AA 2%
              </text>
              <text x={xScale(25)} y={yScale(getCaMaxSafeMEqPerL(25, 3)) - 4} className="fill-slate-800 text-[9px] font-mono">
                AA 3%
              </text>

              {/* Crosshair to active patient point */}
              <line
                x1={pad.left}
                y1={ptY}
                x2={ptX}
                y2={ptY}
                stroke={calc.caPSolubilityStatus === 'precipitation_risk' ? '#dc2626' : '#0369a1'}
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <line
                x1={ptX}
                y1={ptY}
                x2={ptX}
                y2={height - pad.bottom}
                stroke={calc.caPSolubilityStatus === 'precipitation_risk' ? '#dc2626' : '#0369a1'}
                strokeWidth="1"
                strokeDasharray="2 2"
              />

              {/* Active Coordinate Point */}
              <circle
                cx={ptX}
                cy={ptY}
                r="6"
                fill={
                  calc.caPSolubilityStatus === 'precipitation_risk'
                    ? '#dc2626'
                    : calc.caPSolubilityStatus === 'borderline'
                    ? '#d97706'
                    : '#0369a1'
                }
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Axis Titles */}
              <text
                x={pad.left + plotW / 2}
                y={height - 6}
                textAnchor="middle"
                className="fill-slate-600 text-[10px] font-medium"
              >
                ความเข้มข้น Phosphorus ในถุง (mmol/L)
              </text>
              <text
                x={14}
                y={pad.top + plotH / 2}
                textAnchor="middle"
                transform={`rotate(-90 14 ${pad.top + plotH / 2})`}
                className="fill-slate-600 text-[10px] font-medium"
              >
                Calcium (mEq/L)
              </text>
            </svg>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200">
              <span>โซนใต้เส้นสีน้ำเงิน = ละลายได้ดี (AA เข้มข้นสูงช่วยให้ pH ต่ำลงและละลาย Ca–P ได้มากขึ้น)</span>
              <span>ควรใช้ Organic Phosphate หากต้องการ Ca/P สูง</span>
            </div>
          </div>
        </div>
      </div>

      {/* Block C: Vitamins, Trace Elements & Photoprotection */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            วิตามิน แร่ธาตุปริมาณน้อย และการป้องกันแสง (Photoprotection)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            เติมทุกวันตามน้ำหนักตัว และต้องหุ้มถุงรวมถึงสายให้สารน้ำด้วยวัสดุทึบแสงเพื่อป้องกันอนุมูลอิสระ (Peroxides)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50/70 cursor-pointer">
            <input
              type="checkbox"
              checked={micro.multivitaminOrdered}
              onChange={(e) => onUpdateMicro({ multivitaminOrdered: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
            />
            <div className="text-xs leading-relaxed">
              <div className="font-semibold text-slate-900">Pediatric Multivitamins (MVI)</div>
              <div className="font-mono tabular-nums text-sky-800 mt-0.5">
                ขนาดแนะนำ: {calc.recommendedMviMlDay.toFixed(2)} mL/day
              </div>
              <div className="text-slate-500 mt-0.5">
                (&lt;1 kg: 1.5 mL · 1–3 kg: 2 mL/kg สูงสุด 3.25 mL · &gt;3 kg: 5 mL)
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50/70 cursor-pointer">
            <input
              type="checkbox"
              checked={micro.traceElementsOrdered}
              onChange={(e) => onUpdateMicro({ traceElementsOrdered: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
            />
            <div className="text-xs leading-relaxed">
              <div className="font-semibold text-slate-900">Pediatric Trace Elements</div>
              <div className="font-mono tabular-nums text-sky-800 mt-0.5">
                ขนาดแนะนำ: {calc.recommendedTraceMlDay.toFixed(2)} mL/day
              </div>
              <div className="text-slate-500 mt-0.5">
                (~1 mL/kg/day · ลด Cu/Mn หากมีภาวะน้ำดีคั่งในตับ PNALD)
              </div>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer ${
              micro.photoprotectionApplied
                ? 'border-emerald-200 bg-emerald-50/50'
                : 'border-amber-300 bg-amber-50/60'
            }`}
          >
            <input
              type="checkbox"
              checked={micro.photoprotectionApplied}
              onChange={(e) => onUpdateMicro({ photoprotectionApplied: e.target.checked })}
              className="mt-0.5 w-4 h-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
            />
            <div className="text-xs leading-relaxed">
              <div className="font-semibold text-slate-900">Photoprotection (วัสดุทึบแสง)</div>
              <div className="text-slate-700 mt-0.5">
                หุ้มถุง TPN ถุงไขมัน และสายให้สารน้ำด้วยวัสดุทึบแสง
              </div>
              <div className="text-slate-500 mt-0.5">
                ป้องกันการเกิด Peroxides จากแสงที่ทำลายวิตามินและไขมัน
              </div>
            </div>
          </label>
        </div>
      </div>
    </section>
  );
};
