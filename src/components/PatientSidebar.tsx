import React from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw, ShieldAlert } from 'lucide-react';
import { CLINICAL_PRESETS } from '../data/presets';
import { CalculatedTPN, ClinicalPhase, PatientGroup, PatientProfile } from '../types/tpn';

interface PatientSidebarProps {
  patient: PatientProfile;
  activePresetId: string;
  calc: CalculatedTPN;
  onSelectPreset: (presetId: string) => void;
  onUpdatePatient: (patch: Partial<PatientProfile>) => void;
  onResetCurrentPreset: () => void;
  onJumpToSection: (section: 'fluid' | 'macro' | 'micro' | 'monitoring') => void;
}

export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  patient,
  activePresetId,
  calc,
  onSelectPreset,
  onUpdatePatient,
  onResetCurrentPreset,
  onJumpToSection,
}) => {
  const criticalCount = calc.alerts.filter((a) => a.severity === 'critical').length;
  const warningCount = calc.alerts.filter((a) => a.severity === 'warning').length;

  const handleGroupChange = (group: PatientGroup) => {
    onUpdatePatient({
      group,
      gestationalAgeWeeks: group === 'preterm' ? Math.min(36, patient.gestationalAgeWeeks) : Math.max(37, patient.gestationalAgeWeeks),
    });
  };

  const handlePhaseChange = (phase: ClinicalPhase) => {
    onUpdatePatient({ phase });
  };

  const categoryToSection = (
    cat: 'route' | 'fluid' | 'macro' | 'micro' | 'lab' | 'weaning'
  ): 'fluid' | 'macro' | 'micro' | 'monitoring' => {
    if (cat === 'route' || cat === 'fluid') return 'fluid';
    if (cat === 'macro') return 'macro';
    if (cat === 'micro') return 'micro';
    return 'monitoring';
  };

  return (
    <aside className="w-full lg:w-[320px] xl:w-[340px] shrink-0 bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-6 self-start">
      {/* Preset Case Selector */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-semibold text-slate-900">กรณีศึกษาตัวอย่าง / ผู้ป่วย</h2>
          <button
            type="button"
            onClick={onResetCurrentPreset}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-sky-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="รีเซ็ตค่าตามกรณีตัวอย่าง"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            รีเซ็ต
          </button>
        </div>
        <div className="grid grid-cols-1 gap-1.5">
          {CLINICAL_PRESETS.map((preset) => {
            const isActive = preset.id === activePresetId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset.id)}
                className={`text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-sky-50/80 border-sky-300 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="text-xs font-semibold truncate">{preset.shortTitle}</div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">{preset.subtitle}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-px bg-slate-200" />

      {/* Patient Baseline Controls */}
      <div className="space-y-4">
        <div>
          <div className="text-sm font-semibold text-slate-900">ข้อมูลพื้นฐานผู้ป่วย</div>
          <div className="text-xs text-slate-500 mt-0.5">{patient.hn} · ปรับค่าได้แบบเรียลไทม์</div>
        </div>

        {/* Group: Preterm / Term */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            กลุ่มอายุครรภ์ (Gestational Group)
          </label>
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => handleGroupChange('preterm')}
              className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                patient.group === 'preterm'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Preterm (&lt;37 wk)
            </button>
            <button
              type="button"
              onClick={() => handleGroupChange('term')}
              className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                patient.group === 'term'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Term (≥37 wk)
            </button>
          </div>
        </div>

        {/* Weight & GA */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="patient-weight" className="block text-xs font-medium text-slate-600 mb-1">
              น้ำหนักตัว (kg)
            </label>
            <input
              id="patient-weight"
              type="number"
              step="0.05"
              min="0.4"
              max="50"
              value={patient.weightKg}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v) && v > 0) onUpdatePatient({ weightKg: v });
              }}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-600"
            />
          </div>
          <div>
            <label htmlFor="patient-ga" className="block text-xs font-medium text-slate-600 mb-1">
              อายุครรภ์ (wk)
            </label>
            <input
              id="patient-ga"
              type="number"
              min="22"
              max="42"
              value={patient.gestationalAgeWeeks}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v) && v >= 22) {
                  onUpdatePatient({
                    gestationalAgeWeeks: v,
                    group: v < 37 ? 'preterm' : 'term',
                  });
                }
              }}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-600"
            />
          </div>
        </div>

        {/* DOL & Urine Output */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="patient-dol" className="block text-xs font-medium text-slate-600 mb-1">
              อายุวัน (Day of Life)
            </label>
            <input
              id="patient-dol"
              type="number"
              min="1"
              max="180"
              value={patient.dayOfLife}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!Number.isNaN(v) && v >= 1) onUpdatePatient({ dayOfLife: v });
              }}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-600"
            />
          </div>
          <div>
            <label htmlFor="patient-uop" className="block text-xs font-medium text-slate-600 mb-1">
              ปัสสาวะ (mL/kg/hr)
            </label>
            <input
              id="patient-uop"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={patient.urineOutputMlKgHr}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!Number.isNaN(v) && v >= 0) onUpdatePatient({ urineOutputMlKgHr: v });
              }}
              className={`w-full px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600/20 focus:border-sky-600 ${
                patient.urineOutputMlKgHr < 1
                  ? 'border-amber-300 text-amber-900 bg-amber-50/50'
                  : 'border-slate-200 text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* Clinical Phase */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">
            ระยะคลินิก (เป้าหมายพลังงาน)
          </label>
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => handlePhaseChange('acute')}
              className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                patient.phase === 'acute'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Acute (45–55)
            </button>
            <button
              type="button"
              onClick={() => handlePhaseChange('growth')}
              className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                patient.phase === 'growth'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Growth (90–120)
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
            {patient.clinicalNote}
          </p>
        </div>
      </div>

      <div className="h-px bg-slate-200" />

      {/* Clinical Safety Guardrails Feed */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-sm font-semibold text-slate-900">การตรวจสอบความปลอดภัย</h3>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {criticalCount > 0
              ? `วิกฤต ${criticalCount}`
              : warningCount > 0
              ? `เฝ้าระวัง ${warningCount}`
              : 'ผ่านเกณฑ์'}
          </span>
        </div>

        {calc.alerts.length === 0 ? (
          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/60 text-emerald-900">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <div className="font-semibold">พารามิเตอร์ทั้งหมดอยู่ในเกณฑ์ปลอดภัย</div>
                <div className="text-emerald-800/90 mt-0.5">
                  ความเข้มข้น Dextrose, Osmolarity, เกลือแร่ และความละลาย Ca-P สอดคล้องตามแนวทาง
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {calc.alerts.map((alert) => {
              const isCritical = alert.severity === 'critical';
              const isNominal = alert.severity === 'nominal';
              return (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => onJumpToSection(categoryToSection(alert.category))}
                  className={`w-full text-left p-3 rounded-lg border transition-colors cursor-pointer ${
                    isCritical
                      ? 'border-rose-200 bg-rose-50/70 hover:bg-rose-50 text-rose-950'
                      : isNominal
                      ? 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50 text-emerald-950'
                      : 'border-amber-200 bg-amber-50/70 hover:bg-amber-50 text-amber-950'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isCritical ? (
                      <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                    ) : isNominal ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold leading-snug">{alert.title}</div>
                      <div className="text-[11px] opacity-85 mt-1 leading-relaxed">
                        {alert.recommendation}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
