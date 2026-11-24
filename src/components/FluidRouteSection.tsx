import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AccessRoute, CalculatedTPN, FluidInputs, PatientProfile } from '../types/tpn';

interface FluidRouteSectionProps {
  patient: PatientProfile;
  fluid: FluidInputs;
  calc: CalculatedTPN;
  onUpdateFluid: (patch: Partial<FluidInputs>) => void;
}

const ROUTE_OPTIONS: { value: AccessRoute; label: string; sub: string; isCentral: boolean }[] = [
  {
    value: 'peripheral',
    label: 'Peripheral IV',
    sub: 'Dextrose ≤ 12.5% · Osm ≤ 850–900 mOsm/L',
    isCentral: false,
  },
  {
    value: 'central_uvc',
    label: 'Central — UVC',
    sub: 'Umbilical Venous Catheter · เข้มข้นสูงได้',
    isCentral: true,
  },
  {
    value: 'central_picc',
    label: 'Central — PICC',
    sub: 'Peripherally Inserted Central Catheter',
    isCentral: true,
  },
  {
    value: 'central_cvc',
    label: 'Central — CVC',
    sub: 'Central Venous Catheter ระยะยาว',
    isCentral: true,
  },
];

export const FluidRouteSection: React.FC<FluidRouteSectionProps> = ({
  patient,
  fluid,
  calc,
  onUpdateFluid,
}) => {
  const isPeripheral = fluid.route === 'peripheral';
  const totalMl = Math.max(1, calc.totalDailyFluidMl);

  const segments = [
    {
      label: 'ถุง TPN สุทธิ (Aqueous)',
      ml: calc.netPnVolumeMlDay,
      pct: (calc.netPnVolumeMlDay / totalMl) * 100,
      color: 'bg-sky-600',
    },
    {
      label: 'ไขมัน 20% ILE',
      ml: fluid.includeLipidInTfi ? calc.lipidVolumeMlDay : 0,
      pct: fluid.includeLipidInTfi ? (calc.lipidVolumeMlDay / totalMl) * 100 : 0,
      color: 'bg-amber-500',
    },
    {
      label: 'นมทางสายให้อาหาร (Enteral)',
      ml: calc.enteralTotalMlDay,
      pct: (calc.enteralTotalMlDay / totalMl) * 100,
      color: 'bg-emerald-600',
    },
    {
      label: 'ยาหยด IV + Flush line',
      ml: fluid.ivMedsMlDay + fluid.flushMlDay,
      pct: ((fluid.ivMedsMlDay + fluid.flushMlDay) / totalMl) * 100,
      color: 'bg-slate-400',
    },
  ];

  const osmRatio = Math.min(100, (calc.osmolarityMOsmL / 1600) * 100);
  const peripheralMarkerPct = (900 / 1600) * 100;

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            1. ประเมินปริมาณสารน้ำรวม (TFI) และทางให้สารน้ำ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            ตรวจสอบ Osmolarity ตามเส้นเลือดที่เลือก และหักลบสารน้ำอื่นเพื่อหาปริมาตรสุทธิและอัตราหยดของถุง TPN
          </p>
        </div>
        <div className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
          Weight {patient.weightKg.toFixed(2)} kg · DOL {patient.dayOfLife}
        </div>
      </div>

      {/* Block A: Route Selection & Osmolarity Evaluation */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              ทางให้สารน้ำ (Vascular Access Route) และการประเมิน Osmolarity
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Peripheral line จำกัด Dextrose ≤ 12.5% และ Osmolarity ≤ 850–900 mOsm/L
            </p>
          </div>
          {isPeripheral && !calc.isPeripheralSafe ? (
            <button
              type="button"
              onClick={() => onUpdateFluid({ route: 'central_picc' })}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              เปลี่ยนเป็น Central (PICC)
            </button>
          ) : null}
        </div>

        {/* Route Selector Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {ROUTE_OPTIONS.map((opt) => {
            const active = fluid.route === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdateFluid({ route: opt.value })}
                className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                  active
                    ? 'border-sky-600 bg-sky-50/70 text-slate-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-sm font-semibold">{opt.label}</div>
                <div className="text-xs text-slate-500 mt-1 leading-snug">{opt.sub}</div>
              </button>
            );
          })}
        </div>

        {/* Osmolarity & Dextrose Verification Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2 border-t border-slate-100">
          {/* Osmolarity Metric + Bar */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-slate-500">
                  ค่า Osmolarity โดยประมาณของถุง TPN (Aqueous)
                </div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-2xl font-mono font-bold tabular-nums text-slate-900">
                    {Math.round(calc.osmolarityMOsmL)}
                  </span>
                  <span className="text-xs font-mono text-slate-500">mOsm/L</span>
                </div>
              </div>
              <div className="text-right text-xs font-mono tabular-nums text-slate-500">
                <div>Dextrose: {Math.round(calc.osmolarityBreakdown.dextrose)} mOsm/L</div>
                <div>
                  AA: {Math.round(calc.osmolarityBreakdown.aminoAcid)} · Elytes:{' '}
                  {Math.round(calc.osmolarityBreakdown.electrolytes)} mOsm/L
                </div>
              </div>
            </div>

            {/* Linear Scale Gauge with 900 mOsm/L Peripheral Threshold */}
            <div className="space-y-1.5">
              <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
                <div
                  className={`h-full transition-all duration-200 ${
                    isPeripheral && calc.osmolarityMOsmL > 900
                      ? 'bg-rose-600'
                      : isPeripheral && calc.osmolarityMOsmL > 850
                      ? 'bg-amber-500'
                      : 'bg-sky-600'
                  }`}
                  style={{ width: `${osmRatio}%` }}
                />
                {/* 900 mOsm/L marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-slate-900/70"
                  style={{ left: `${peripheralMarkerPct}%` }}
                  title="ขีดจำกัด Peripheral Line (900 mOsm/L)"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-500">
                <span>0</span>
                <span>450</span>
                <span className="font-semibold text-slate-700">900 mOsm/L (Peripheral Max)</span>
                <span>1,600+</span>
              </div>
            </div>
          </div>

          {/* Route Suitability Status Box */}
          <div
            className={`p-4 rounded-lg border flex flex-col justify-between ${
              isPeripheral && !calc.isPeripheralSafe
                ? 'border-rose-200 bg-rose-50/70 text-rose-950'
                : isPeripheral && calc.osmolarityMOsmL > 850
                ? 'border-amber-200 bg-amber-50/70 text-amber-950'
                : 'border-emerald-200 bg-emerald-50/60 text-emerald-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {isPeripheral && !calc.isPeripheralSafe ? (
                <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
              ) : isPeripheral && calc.osmolarityMOsmL > 850 ? (
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="text-xs font-semibold">
                  {isPeripheral
                    ? calc.isPeripheralSafe
                      ? 'ปลอดภัยสำหรับ Peripheral Line'
                      : 'เกินเกณฑ์ Peripheral Line — แนะนำ Central Line'
                    : 'Central Line รองรับความเข้มข้นปัจจุบัน'}
                </div>
                <div className="text-xs opacity-90 leading-relaxed font-mono tabular-nums">
                  %Dextrose: {calc.requiredDextrosePct.toFixed(1)}%{' '}
                  {isPeripheral ? '(≤ 12.5%)' : '(Central)'}
                </div>
              </div>
            </div>
            <div className="text-[11px] opacity-80 mt-3 pt-2 border-t border-current/10">
              {isPeripheral
                ? 'หากต้องการ Dextrose > 12.5% หรือ Osmolarity > 900 mOsm/L ให้เปลี่ยนเป็น UVC หรือ PICC'
                : 'ตรวจยืนยันตำแหน่งปลายสาย (Tip position) ด้วยภาพถ่ายรังสีก่อนเริ่มให้ TPN'}
            </div>
          </div>
        </div>
      </div>

      {/* Block B: TFI Calculation & Non-TPN Deductions */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              คำนวณปริมาณสารน้ำรวม (TFI) และหักลบสารน้ำอื่น
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              พิจารณาตามอายุครรภ์ น้ำหนัก อายุวัน (DOL) และหักลบปริมาณยาหยด นม และ Flush line
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono tabular-nums">
            TFI รวม = {calc.totalDailyFluidMl.toFixed(1)} mL/day
          </div>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: TFI & Deductions */}
          <div className="space-y-4">
            {/* Target TFI */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="tfi-slider" className="text-xs font-semibold text-slate-700">
                  ปริมาณสารน้ำรวมเป้าหมาย (Target TFI)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    id="tfi-input"
                    type="number"
                    min="40"
                    max="200"
                    step="5"
                    value={fluid.targetTfiMlKgDay}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!Number.isNaN(v) && v >= 0) onUpdateFluid({ targetTfiMlKgDay: v });
                    }}
                    className="w-20 px-2 py-1 text-right text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-sky-600"
                  />
                  <span className="text-xs font-mono text-slate-500">mL/kg/day</span>
                </div>
              </div>
              <input
                id="tfi-slider"
                type="range"
                min="50"
                max="180"
                step="5"
                value={fluid.targetTfiMlKgDay}
                onChange={(e) => onUpdateFluid({ targetTfiMlKgDay: parseFloat(e.target.value) })}
                className="w-full clinical-slider"
              />
              <div className="flex justify-between text-[11px] text-slate-400 font-mono mt-1">
                <span>Day 1: 60–80</span>
                <span>Day 3–5: 100–140</span>
                <span>Growth: 140–160</span>
              </div>
            </div>

            {/* Enteral Feeding */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label htmlFor="enteral-ml" className="block text-xs font-medium text-slate-600 mb-1">
                  นมทางสายให้อาหาร (mL/kg/day)
                </label>
                <input
                  id="enteral-ml"
                  type="number"
                  min="0"
                  max="180"
                  step="5"
                  value={fluid.enteralMlKgDay}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isNaN(v) && v >= 0) onUpdateFluid({ enteralMlKgDay: v });
                  }}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
                />
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  = {calc.enteralTotalMlDay.toFixed(1)} mL/day ({calc.enteralKcalKgDay.toFixed(1)} kcal/kg)
                </div>
              </div>
              <div>
                <label htmlFor="enteral-density" className="block text-xs font-medium text-slate-600 mb-1">
                  พลังงานนม (kcal/mL)
                </label>
                <select
                  id="enteral-density"
                  value={fluid.enteralKcalPerMl}
                  onChange={(e) => onUpdateFluid({ enteralKcalPerMl: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
                >
                  <option value={0.67}>0.67 kcal/mL (นมแม่ / 20 kcal/oz)</option>
                  <option value={0.8}>0.80 kcal/mL (Preterm 24 kcal/oz)</option>
                  <option value={1.0}>1.00 kcal/mL (High calorie 30 kcal/oz)</option>
                </select>
              </div>
            </div>

            {/* IV Meds & Flush */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="iv-meds" className="block text-xs font-medium text-slate-600 mb-1">
                  ยาหยดทางหลอดเลือด (mL/day)
                </label>
                <input
                  id="iv-meds"
                  type="number"
                  min="0"
                  max="500"
                  step="1"
                  value={fluid.ivMedsMlDay}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isNaN(v) && v >= 0) onUpdateFluid({ ivMedsMlDay: v });
                  }}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
                />
              </div>
              <div>
                <label htmlFor="flush-line" className="block text-xs font-medium text-slate-600 mb-1">
                  Flush / Arterial Line (mL/day)
                </label>
                <input
                  id="flush-line"
                  type="number"
                  min="0"
                  max="200"
                  step="1"
                  value={fluid.flushMlDay}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (!Number.isNaN(v) && v >= 0) onUpdateFluid({ flushMlDay: v });
                  }}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
                />
              </div>
            </div>

            {/* Lipid in TFI & Infusion Hours */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label htmlFor="pn-hours" className="block text-xs font-medium text-slate-600 mb-1">
                  ระยะเวลาหยด TPN (ชั่วโมง/วัน)
                </label>
                <input
                  id="pn-hours"
                  type="number"
                  min="12"
                  max="24"
                  step="1"
                  value={fluid.pnInfusionHours}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!Number.isNaN(v) && v >= 8 && v <= 24) onUpdateFluid({ pnInfusionHours: v });
                  }}
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-600"
                />
              </div>
              <div className="flex items-end pb-1.5">
                <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={fluid.includeLipidInTfi}
                    onChange={(e) => onUpdateFluid({ includeLipidInTfi: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-sky-700 focus:ring-sky-600"
                  />
                  หักลบปริมาตรไขมัน (20% ILE) ออกจาก TFI
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Calculated Net TPN Output Ledger */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-700">
                สรุปการหักลบและปริมาตรสุทธิของถุง TPN
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-600">สารน้ำรวมทั้งหมด (TFI)</span>
                  <span className="font-mono font-semibold tabular-nums text-slate-900">
                    {calc.totalDailyFluidMl.toFixed(1)} mL/day
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-slate-500">
                  <span>หัก: นมทางสายให้อาหาร ({fluid.enteralMlKgDay} mL/kg)</span>
                  <span className="font-mono tabular-nums">− {calc.enteralTotalMlDay.toFixed(1)} mL</span>
                </div>
                <div className="flex justify-between items-baseline text-slate-500">
                  <span>หัก: ยาหยด IV + Flush line</span>
                  <span className="font-mono tabular-nums">
                    − {(fluid.ivMedsMlDay + fluid.flushMlDay).toFixed(1)} mL
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-slate-500">
                  <span>
                    {fluid.includeLipidInTfi ? 'หัก: ' : 'ไม่หัก (คิดแยก): '}ไขมัน 20% ILE
                  </span>
                  <span className="font-mono tabular-nums">
                    {fluid.includeLipidInTfi ? '− ' : ''}
                    {calc.lipidVolumeMlDay.toFixed(1)} mL
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500">ปริมาตรถุง TPN สุทธิ</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-mono font-bold tabular-nums text-sky-800">
                    {calc.netPnVolumeMlDay.toFixed(1)}
                  </span>
                  <span className="text-xs font-mono text-slate-500">mL/day</span>
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-500 mt-0.5">
                  ({calc.netPnMlKgDay.toFixed(1)} mL/kg/day)
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">อัตราหยด TPN ({fluid.pnInfusionHours} hr)</div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-mono font-bold tabular-nums text-slate-900">
                    {calc.pnRateMlHr.toFixed(2)}
                  </span>
                  <span className="text-xs font-mono text-slate-500">mL/hr</span>
                </div>
                <div className="text-[11px] font-mono tabular-nums text-slate-500 mt-0.5">
                  Lipid: {calc.lipidRateMlHr.toFixed(2)} mL/hr ({fluid.lipidInfusionHours}h)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fluid Partition Stacked Bar */}
        <div className="pt-4 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium">สัดส่วนสารน้ำใน TFI ({fluid.targetTfiMlKgDay} mL/kg/day)</span>
            <span className="font-mono tabular-nums">
              TPN สุทธิ {((calc.netPnVolumeMlDay / totalMl) * 100).toFixed(0)}% ของ TFI
            </span>
          </div>
          <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
            {segments.map((seg) =>
              seg.pct > 0 ? (
                <div
                  key={seg.label}
                  className={`${seg.color} h-full transition-all duration-200`}
                  style={{ width: `${Math.min(100, seg.pct)}%` }}
                  title={`${seg.label}: ${seg.ml.toFixed(1)} mL/day (${seg.pct.toFixed(1)}%)`}
                />
              ) : null
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
            {segments.map((seg) => (
              <div key={seg.label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-xs ${seg.color} shrink-0`} />
                <span>{seg.label}</span>
                <span className="font-mono tabular-nums text-slate-500">
                  {seg.ml.toFixed(1)} mL
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
