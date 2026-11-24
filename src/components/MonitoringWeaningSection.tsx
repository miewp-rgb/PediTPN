import React, { useState } from 'react';
import { Plus, TrendingDown, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { MONITORING_SCHEDULE } from '../data/presets';
import {
  CalculatedTPN,
  FluidInputs,
  LabEntry,
  MacroInputs,
  PatientProfile,
} from '../types/tpn';

interface MonitoringWeaningSectionProps {
  patient: PatientProfile;
  fluid: FluidInputs;
  macro: MacroInputs;
  calc: CalculatedTPN;
  labs: LabEntry[];
  onAddLab: (entry: Omit<LabEntry, 'id'>) => void;
  onUpdateFluid: (patch: Partial<FluidInputs>) => void;
  onUpdateMacro: (patch: Partial<MacroInputs>) => void;
}

interface TrendChartProps {
  title: string;
  unit: string;
  data: { label: string; value: number }[];
  yMax: number;
  safeBand?: { min: number; max: number };
  criticalHigh?: number;
  criticalLow?: number;
  strokeColor: string;
}

const MiniTrendChart: React.FC<TrendChartProps> = ({
  title,
  unit,
  data,
  yMax,
  safeBand,
  criticalHigh,
  criticalLow,
  strokeColor,
}) => {
  const w = 320;
  const h = 140;
  const pad = { top: 14, right: 16, bottom: 26, left: 36 };
  const pw = w - pad.left - pad.right;
  const ph = h - pad.top - pad.bottom;

  const latest = data.length > 0 ? data[data.length - 1].value : 0;
  const isCritical =
    (criticalHigh !== undefined && latest > criticalHigh) ||
    (criticalLow !== undefined && latest < criticalLow);

  const xPos = (idx: number) =>
    data.length <= 1 ? pad.left + pw / 2 : pad.left + (idx / (data.length - 1)) * pw;
  const yPos = (val: number) =>
    pad.top + ph - (Math.min(yMax, Math.max(0, val)) / yMax) * ph;

  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xPos(i).toFixed(1)} ${yPos(d.value).toFixed(1)}`)
    .join(' ');

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xs font-semibold text-slate-700">{title}</div>
        <div className="flex items-baseline gap-1">
          <span
            className={`text-lg font-mono font-bold tabular-nums ${
              isCritical ? 'text-rose-700' : 'text-slate-900'
            }`}
          >
            {latest}
          </span>
          <span className="text-[11px] font-mono text-slate-500">{unit}</span>
        </div>
      </div>

      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto select-none">
        {/* Safe band */}
        {safeBand ? (
          <rect
            x={pad.left}
            y={yPos(safeBand.max)}
            width={pw}
            height={Math.max(1, yPos(safeBand.min) - yPos(safeBand.max))}
            fill="#16a34a"
            fillOpacity="0.08"
          />
        ) : null}

        {/* Y axis ticks */}
        {[0, yMax / 2, yMax].map((tick) => (
          <g key={tick}>
            <line
              x1={pad.left}
              y1={yPos(tick)}
              x2={w - pad.right}
              y2={yPos(tick)}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text
              x={pad.left - 6}
              y={yPos(tick) + 3}
              textAnchor="end"
              className="fill-slate-400 text-[9px] font-mono"
            >
              {Math.round(tick)}
            </text>
          </g>
        ))}

        {/* Critical High Threshold */}
        {criticalHigh !== undefined ? (
          <line
            x1={pad.left}
            y1={yPos(criticalHigh)}
            x2={w - pad.right}
            y2={yPos(criticalHigh)}
            stroke="#dc2626"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
        ) : null}

        {/* Critical Low Threshold */}
        {criticalLow !== undefined ? (
          <line
            x1={pad.left}
            y1={yPos(criticalLow)}
            x2={w - pad.right}
            y2={yPos(criticalLow)}
            stroke="#d97706"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
        ) : null}

        {/* Data line */}
        {data.length > 1 ? (
          <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="2" />
        ) : null}

        {/* Data points & X labels */}
        {data.map((d, i) => {
          const cx = xPos(i);
          const cy = yPos(d.value);
          const ptCrit =
            (criticalHigh !== undefined && d.value > criticalHigh) ||
            (criticalLow !== undefined && d.value < criticalLow);
          return (
            <g key={`${d.label}-${i}`}>
              <circle
                cx={cx}
                cy={cy}
                r="4"
                fill={ptCrit ? '#dc2626' : strokeColor}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <text
                x={cx}
                y={h - 6}
                textAnchor="middle"
                className="fill-slate-500 text-[9px] font-mono"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const MonitoringWeaningSection: React.FC<MonitoringWeaningSectionProps> = ({
  patient,
  fluid,
  macro,
  calc,
  labs,
  onAddLab,
  onUpdateFluid,
  onUpdateMacro,
}) => {
  const latestLab = labs.length > 0 ? labs[labs.length - 1] : null;
  const [showAddForm, setShowAddForm] = useState(false);

  const [newLab, setNewLab] = useState({
    timestamp: `Day ${patient.dayOfLife} · 14:00`,
    bloodGlucoseMgDl: latestLab?.bloodGlucoseMgDl ?? 110,
    sodiumMEqL: latestLab?.sodiumMEqL ?? 138,
    potassiumMEqL: latestLab?.potassiumMEqL ?? 4.2,
    calciumMgDl: latestLab?.calciumMgDl ?? 9.2,
    phosphorusMgDl: latestLab?.phosphorusMgDl ?? 5.0,
    magnesiumMgDl: latestLab?.magnesiumMgDl ?? 2.0,
    triglyceridesMgDl: latestLab?.triglyceridesMgDl ?? 150,
    directBilirubinMgDl: latestLab?.directBilirubinMgDl ?? 0.6,
  });

  const handleSubmitLab = (e: React.FormEvent) => {
    e.preventDefault();
    onAddLab({
      ...newLab,
      dayOfLife: patient.dayOfLife,
    });
    setShowAddForm(false);
  };

  // Clinical quick adjustment actions based on latest labs
  const handleStepDownGir = () => {
    const nextGir = Math.max(3.5, Number((calc.actualGirMgKgMin - 1.5).toFixed(1)));
    onUpdateMacro({ girMode: 'gir', targetGirMgKgMin: nextGir });
  };

  const handleReduceLipid = () => {
    const nextLipid = Math.max(0.5, Number((macro.lipidGKgDay - 0.5).toFixed(2)));
    onUpdateMacro({ lipidGKgDay: nextLipid });
  };

  const handleApplyWeaningEnteral = (newEnteralMlKg: number) => {
    // Automatically scale down TPN enteral slider cleanly; if >= 110 mL/kg/day suggest stopping lipid & minimizing TPN
    onUpdateFluid({ enteralMlKgDay: newEnteralMlKg });
  };

  const bgData = labs.map((l) => ({
    label: `D${l.dayOfLife}`,
    value: l.bloodGlucoseMgDl,
  }));
  const tgData = labs.map((l) => ({
    label: `D${l.dayOfLife}`,
    value: l.triglyceridesMgDl,
  }));
  const dbData = labs.map((l) => ({
    label: `D${l.dayOfLife}`,
    value: l.directBilirubinMgDl,
  }));

  const weaningPct = Math.min(100, (fluid.enteralMlKgDay / 120) * 100);

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            4. การติดตามผลทางห้องปฏิบัติการ การปรับสูตร และการหย่า TPN
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            เฝ้าระวังระดับน้ำตาล (BG), เกลือแร่, Triglycerides, LFT/Direct Bilirubin และวางแผนลด TPN เมื่อรับนมได้ดี
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'ปิดฟอร์มบันทึกผลเลือด' : 'บันทึกผลตรวจใหม่'}
        </button>
      </div>

      {/* Inline Add Lab Entry Form */}
      {showAddForm ? (
        <form
          onSubmit={handleSubmitLab}
          className="bg-white border border-sky-200 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              บันทึกผลตรวจทางห้องปฏิบัติการ (Lab Entry)
            </h2>
            <span className="text-xs text-slate-500">ระบบจะประเมินเกณฑ์เตือนและอัปเดตกราฟทันที</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">เวลา / วัน</label>
              <input
                type="text"
                required
                value={newLab.timestamp}
                onChange={(e) => setNewLab({ ...newLab, timestamp: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Blood Glucose (mg/dL)</label>
              <input
                type="number"
                required
                value={newLab.bloodGlucoseMgDl}
                onChange={(e) =>
                  setNewLab({ ...newLab, bloodGlucoseMgDl: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Triglycerides (mg/dL)</label>
              <input
                type="number"
                required
                value={newLab.triglyceridesMgDl}
                onChange={(e) =>
                  setNewLab({ ...newLab, triglyceridesMgDl: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Direct Bilirubin (mg/dL)</label>
              <input
                type="number"
                step="0.1"
                required
                value={newLab.directBilirubinMgDl}
                onChange={(e) =>
                  setNewLab({ ...newLab, directBilirubinMgDl: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Na (mEq/L)</label>
              <input
                type="number"
                value={newLab.sodiumMEqL}
                onChange={(e) =>
                  setNewLab({ ...newLab, sodiumMEqL: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">K (mEq/L)</label>
              <input
                type="number"
                step="0.1"
                value={newLab.potassiumMEqL}
                onChange={(e) =>
                  setNewLab({ ...newLab, potassiumMEqL: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Ca (mg/dL)</label>
              <input
                type="number"
                step="0.1"
                value={newLab.calciumMgDl}
                onChange={(e) =>
                  setNewLab({ ...newLab, calciumMgDl: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">P (mg/dL)</label>
              <input
                type="number"
                step="0.1"
                value={newLab.phosphorusMgDl}
                onChange={(e) =>
                  setNewLab({ ...newLab, phosphorusMgDl: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Mg (mg/dL)</label>
              <input
                type="number"
                step="0.1"
                value={newLab.magnesiumMgDl}
                onChange={(e) =>
                  setNewLab({ ...newLab, magnesiumMgDl: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-md"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-1.5 px-3 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-md cursor-pointer"
              >
                บันทึกผลตรวจ
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {/* Smart Actionable Clinical Triggers (Hyperglycemia / HyperTG / PNALD) */}
      {latestLab &&
      (latestLab.bloodGlucoseMgDl > 180 ||
        latestLab.triglyceridesMgDl > 250 ||
        latestLab.directBilirubinMgDl >= 2.0) ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {latestLab.bloodGlucoseMgDl > 180 ? (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 flex flex-col justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-rose-950">
                  <div className="font-semibold">
                    Hyperglycemia (BG {latestLab.bloodGlucoseMgDl} mg/dL &gt; 180)
                  </div>
                  <div className="mt-1">
                    แนะนำลด GIR ลงทีละ 1–2 mg/kg/min (ไม่ควรลดต่ำกว่า 3–4 mg/kg/min) และเจาะ DTX ซ้ำทุก 4–6 ชม.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleStepDownGir}
                className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                ปรับลด GIR ลง 1.5 mg/kg/min ทันที
              </button>
            </div>
          ) : null}

          {latestLab.triglyceridesMgDl > 250 ? (
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/70 flex flex-col justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-rose-950">
                  <div className="font-semibold">
                    Hypertriglyceridemia (TG {latestLab.triglyceridesMgDl} mg/dL &gt; 250)
                  </div>
                  <div className="mt-1">
                    ชะลอการปรับเพิ่มขนาดไขมัน หรือลดขนาด Lipid ลง 0.5–1.0 g/kg/day และตรวจ TG ซ้ำ
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReduceLipid}
                className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg cursor-pointer"
              >
                <TrendingDown className="w-3.5 h-3.5" />
                ปรับลด Lipid ลง 0.5 g/kg/day ทันที
              </button>
            </div>
          ) : null}

          {latestLab.directBilirubinMgDl >= 2.0 ? (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 flex flex-col justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-amber-950">
                  <div className="font-semibold">
                    เฝ้าระวัง PNALD / IFALD (Direct Bilirubin {latestLab.directBilirubinMgDl.toFixed(1)} mg/dL)
                  </div>
                  <div className="mt-1">
                    พิจารณาใช้ไขมันสูตรผสม Fish oil (SMOF), เร่งเพิ่ม Enteral feeding และลดระยะเวลาหยดไขมัน (Cycling)
                  </div>
                </div>
              </div>
              {macro.lipidType !== 'smof_fish_oil' ? (
                <button
                  type="button"
                  onClick={() => onUpdateMacro({ lipidType: 'smof_fish_oil' })}
                  className="self-start px-3 py-1.5 text-xs font-semibold text-amber-950 bg-amber-200/80 hover:bg-amber-200 rounded-lg cursor-pointer"
                >
                  เปลี่ยนเป็นสูตรผสม Fish oil (SMOF)
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Serial Trend Charts (BG, TG, Direct Bilirubin) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniTrendChart
          title="Blood Glucose (เป้า 45–150)"
          unit="mg/dL"
          data={bgData}
          yMax={240}
          safeBand={{ min: 45, max: 150 }}
          criticalHigh={180}
          criticalLow={45}
          strokeColor="#0369a1"
        />
        <MiniTrendChart
          title="Serum Triglycerides (≤ 250)"
          unit="mg/dL"
          data={tgData}
          yMax={350}
          safeBand={{ min: 0, max: 250 }}
          criticalHigh={250}
          strokeColor="#d97706"
        />
        <MiniTrendChart
          title="Direct Bilirubin (PNALD < 2.0)"
          unit="mg/dL"
          data={dbData}
          yMax={4.0}
          safeBand={{ min: 0, max: 2.0 }}
          criticalHigh={2.0}
          strokeColor="#0f766e"
        />
      </div>

      {/* Lab History Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            บันทึกผลตรวจทางห้องปฏิบัติการย้อนหลัง
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {labs.length} รายการ
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-5">เวลาตรวจ</th>
                <th className="py-3 px-3 text-right">BG (mg/dL)</th>
                <th className="py-3 px-3 text-right">Na</th>
                <th className="py-3 px-3 text-right">K</th>
                <th className="py-3 px-3 text-right">Ca / P / Mg</th>
                <th className="py-3 px-3 text-right">TG (mg/dL)</th>
                <th className="py-3 px-5 text-right">Direct Bili</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs font-mono tabular-nums text-slate-700">
              {labs.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-5 font-sans font-medium text-slate-900 whitespace-nowrap">
                    {row.timestamp}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-semibold ${
                      row.bloodGlucoseMgDl > 180 || row.bloodGlucoseMgDl < 45
                        ? 'text-rose-700'
                        : row.bloodGlucoseMgDl > 150
                        ? 'text-amber-700'
                        : 'text-slate-900'
                    }`}
                  >
                    {row.bloodGlucoseMgDl}
                  </td>
                  <td className="py-3 px-3 text-right">{row.sodiumMEqL}</td>
                  <td className="py-3 px-3 text-right">{row.potassiumMEqL.toFixed(1)}</td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    {row.calciumMgDl.toFixed(1)} / {row.phosphorusMgDl.toFixed(1)} /{' '}
                    {row.magnesiumMgDl.toFixed(1)}
                  </td>
                  <td
                    className={`py-3 px-3 text-right font-semibold ${
                      row.triglyceridesMgDl > 250 ? 'text-rose-700' : 'text-slate-900'
                    }`}
                  >
                    {row.triglyceridesMgDl}
                  </td>
                  <td
                    className={`py-3 px-5 text-right font-semibold ${
                      row.directBilirubinMgDl >= 2.0 ? 'text-amber-700' : 'text-slate-900'
                    }`}
                  >
                    {row.directBilirubinMgDl.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Block B: Interactive TPN Weaning Planner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              แผนการหย่า TPN (TPN Weaning Planner)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              จำลองการเพิ่มนมทางสายให้อาหาร (Enteral feeding) และลดปริมาตร TPN แบบสมดุลจนถึงเกณฑ์หยุด TPN (100–120 mL/kg/day)
            </p>
          </div>
          <div className="text-xs font-semibold">
            {calc.weaningReadiness === 'ready_to_stop' ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
                เข้าเกณฑ์พิจารณาหยุด TPN และ Lipid
              </span>
            ) : calc.weaningReadiness === 'advancing_feeds' ? (
              <span className="text-sky-700">กำลังค่อยๆ เพิ่มนมและลด TPN</span>
            ) : (
              <span className="text-slate-500">Full TPN / Trophic Feeds</span>
            )}
          </div>
        </div>

        {/* Interactive Enteral Weaning Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700">
              ปริมาณนมที่ทารกรับได้ (Enteral Feeding)
            </span>
            <span className="font-mono font-bold tabular-nums text-slate-900">
              {fluid.enteralMlKgDay} mL/kg/day ({calc.enteralKcalKgDay.toFixed(1)} kcal/kg/day)
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={Math.max(140, fluid.targetTfiMlKgDay)}
            step="5"
            value={fluid.enteralMlKgDay}
            onChange={(e) => handleApplyWeaningEnteral(parseFloat(e.target.value))}
            className="w-full clinical-slider"
          />

          {/* Progress toward 100-120 mL/kg/day weaning zone */}
          <div className="space-y-1.5">
            <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-200 ${
                  fluid.enteralMlKgDay >= 100 ? 'bg-emerald-600' : 'bg-sky-600'
                }`}
                style={{ width: `${weaningPct}%` }}
              />
              {/* 100 mL/kg/day threshold mark */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-emerald-800"
                style={{ left: `${(100 / 120) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>0 mL/kg/d (NPO)</span>
              <span>50 mL/kg/d (ลด TPN ครึ่งหนึ่ง)</span>
              <span className="font-semibold text-emerald-700">100–120 mL/kg/d (หยุด TPN &amp; Lipid)</span>
            </div>
          </div>
        </div>

        {/* Live Balance Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">สัดส่วนสารน้ำ Enteral : TPN</div>
            <div className="text-lg font-mono font-bold tabular-nums text-slate-900 mt-1">
              {((calc.enteralTotalMlDay / Math.max(1, calc.totalDailyFluidMl)) * 100).toFixed(0)}% :{' '}
              {((calc.netPnVolumeMlDay / Math.max(1, calc.totalDailyFluidMl)) * 100).toFixed(0)}%
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">พลังงานจากนม vs ถุง TPN</div>
            <div className="text-lg font-mono font-bold tabular-nums text-slate-900 mt-1">
              {calc.enteralKcalKgDay.toFixed(0)} / {calc.tpnTotalKcalKgDay.toFixed(0)}{' '}
              <span className="text-xs font-normal text-slate-500">kcal/kg</span>
            </div>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-xs text-slate-500">อัตราหยด TPN สุทธิปัจจุบัน</div>
            <div className="text-lg font-mono font-bold tabular-nums text-sky-800 mt-1">
              {calc.pnRateMlHr.toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-500">mL/hr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Monitoring Schedule Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">
            ตารางความถี่ในการเจาะเลือดติดตามและแนวทางการปรับสูตร
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <th className="py-3 px-6">รายการตรวจ</th>
                <th className="py-3 px-4">ความถี่ที่แนะนำ</th>
                <th className="py-3 px-4">เกณฑ์เป้าหมาย</th>
                <th className="py-3 px-6">แนวทางปรับสูตรเมื่อผิดปกติ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
              {MONITORING_SCHEDULE.map((item) => (
                <tr key={item.parameter} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-6 font-semibold text-slate-900">{item.parameter}</td>
                  <td className="py-3.5 px-4 leading-relaxed">{item.frequency}</td>
                  <td className="py-3.5 px-4 font-mono tabular-nums text-slate-800">
                    {item.target}
                  </td>
                  <td className="py-3.5 px-6 leading-relaxed">{item.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
