import { useMemo, useState } from 'react';
import { FluidRouteSection } from './components/FluidRouteSection';
import { MacroEnergySection } from './components/MacroEnergySection';
import { MicroCaPSection } from './components/MicroCaPSection';
import { MonitoringWeaningSection } from './components/MonitoringWeaningSection';
import { OrderSummaryModal } from './components/OrderSummaryModal';
import { PatientSidebar } from './components/PatientSidebar';
import { CLINICAL_PRESETS } from './data/presets';
import {
  FluidInputs,
  LabEntry,
  MacroInputs,
  MicroInputs,
  PatientProfile,
} from './types/tpn';
import { calculateTPN } from './utils/tpnCalculations';

type ActiveSection = 'fluid' | 'macro' | 'micro' | 'monitoring';

const NAV_TABS: { id: ActiveSection; label: string }[] = [
  { id: 'fluid', label: '1. สารน้ำและทางให้' },
  { id: 'macro', label: '2. สารอาหารและ GIR' },
  { id: 'micro', label: '3. เกลือแร่และ Ca-P' },
  { id: 'monitoring', label: '4. ติดตามผลและหย่า TPN' },
];

export default function App() {
  const initialPreset = CLINICAL_PRESETS[1]; // Preterm 31 wk Day 5 Growth Phase as rich default

  const [activePresetId, setActivePresetId] = useState<string>(initialPreset.id);
  const [activeSection, setActiveSection] = useState<ActiveSection>('fluid');
  const [orderModalOpen, setOrderModalOpen] = useState<boolean>(false);

  const [patient, setPatient] = useState<PatientProfile>(initialPreset.patient);
  const [fluid, setFluid] = useState<FluidInputs>(initialPreset.fluid);
  const [macro, setMacro] = useState<MacroInputs>(initialPreset.macro);
  const [micro, setMicro] = useState<MicroInputs>(initialPreset.micro);
  const [labs, setLabs] = useState<LabEntry[]>(initialPreset.labs);

  const calc = useMemo(
    () => calculateTPN(patient, fluid, macro, micro, labs),
    [patient, fluid, macro, micro, labs]
  );

  const handleSelectPreset = (presetId: string) => {
    const found = CLINICAL_PRESETS.find((p) => p.id === presetId);
    if (!found) return;
    setActivePresetId(found.id);
    setPatient({ ...found.patient });
    setFluid({ ...found.fluid });
    setMacro({ ...found.macro });
    setMicro({ ...found.micro });
    setLabs(found.labs.map((l) => ({ ...l })));
  };

  const handleResetCurrentPreset = () => {
    handleSelectPreset(activePresetId);
  };

  const handleAddLab = (entry: Omit<LabEntry, 'id'>) => {
    const nextEntry: LabEntry = {
      ...entry,
      id: `lab-${Date.now()}`,
    };
    setLabs((prev) => [...prev, nextEntry]);
  };

  const isPeripheralUnsafe = fluid.route === 'peripheral' && !calc.isPeripheralSafe;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => setActiveSection('fluid')}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            PediTPN Clinical
          </button>

          {/* Zone 2: 4 concise single-line text nav links */}
          <nav
            aria-label="ส่วนประเมินการให้ TPN"
            className="hidden lg:flex items-center gap-7 text-sm font-medium"
          >
            {NAV_TABS.map((tab) => {
              const active = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSection(tab.id)}
                  className={`py-4 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'border-sky-700 text-sky-800 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setOrderModalOpen(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              สรุปใบสั่ง TPN
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / Tablet Navigation Strip (non-sticky to keep mobile sticky height minimal) */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-2 overflow-x-auto no-print">
        <div className="flex items-center gap-1.5 min-w-max">
          {NAV_TABS.map((tab) => {
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSection(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-sky-50 text-sky-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Live Clinical Summary Strip (Flat hairline ledger, zero nested cards) */}
      <div className="bg-white border-b border-slate-200 no-print">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3.5 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 xl:gap-0 xl:divide-x xl:divide-slate-200">
          {/* Metric 1: Net PN Rate */}
          <div className="xl:pr-5">
            <div className="text-[11px] font-medium text-slate-500">
              อัตราหยดถุง TPN สุทธิ ({fluid.pnInfusionHours} hr)
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-mono font-bold tabular-nums text-sky-800">
                {calc.pnRateMlHr.toFixed(2)}
              </span>
              <span className="text-xs font-mono text-slate-500">mL/hr</span>
            </div>
            <div className="text-[11px] font-mono tabular-nums text-slate-500">
              {calc.netPnVolumeMlDay.toFixed(1)} mL/d · Lipid {calc.lipidRateMlHr.toFixed(2)} mL/hr
            </div>
          </div>

          {/* Metric 2: Dextrose % & GIR */}
          <div className="xl:px-5">
            <div className="text-[11px] font-medium text-slate-500">ความเข้มข้น Dextrose · GIR</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`text-xl font-mono font-bold tabular-nums ${
                  fluid.route === 'peripheral' && calc.requiredDextrosePct > 12.5
                    ? 'text-rose-700'
                    : 'text-slate-900'
                }`}
              >
                {calc.requiredDextrosePct.toFixed(1)}%
              </span>
              <span className="text-xs font-mono tabular-nums text-slate-600">
                GIR {calc.actualGirMgKgMin.toFixed(1)}
              </span>
            </div>
            <div className="text-[11px] font-mono tabular-nums text-slate-500">
              {calc.dextroseGKgDay.toFixed(1)} g/kg/d · เป้า 8–10 (max 12)
            </div>
          </div>

          {/* Metric 3: Est. Osmolarity */}
          <div className="xl:px-5">
            <div className="text-[11px] font-medium text-slate-500">
              Osmolarity · {fluid.route === 'peripheral' ? 'Peripheral IV' : 'Central Line'}
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={`text-xl font-mono font-bold tabular-nums ${
                  isPeripheralUnsafe ? 'text-rose-700' : 'text-slate-900'
                }`}
              >
                {Math.round(calc.osmolarityMOsmL)}
              </span>
              <span className="text-xs font-mono text-slate-500">mOsm/L</span>
            </div>
            <div
              className={`text-[11px] font-medium ${
                isPeripheralUnsafe ? 'text-rose-700' : 'text-emerald-700'
              }`}
            >
              {isPeripheralUnsafe
                ? 'เกินเกณฑ์ Peripheral — ใช้ Central'
                : fluid.route === 'peripheral'
                ? 'ผ่านเกณฑ์ Peripheral (≤ 900)'
                : 'รองรับโดย Central Line'}
            </div>
          </div>

          {/* Metric 4: Total Energy */}
          <div className="xl:px-5">
            <div className="text-[11px] font-medium text-slate-500">
              พลังงานรวม (TPN + นม)
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-mono font-bold tabular-nums text-slate-900">
                {calc.grandTotalKcalKgDay.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-slate-500">kcal/kg/d</span>
            </div>
            <div className="text-[11px] font-mono tabular-nums text-slate-500">
              เป้า {patient.phase === 'acute' ? 'Acute 45–55' : 'Growth 90–120'} · AA{' '}
              {macro.aminoAcidGKgDay.toFixed(1)} g/kg
            </div>
          </div>

          {/* Metric 5: NPC:Prot & Ca:P */}
          <div className="col-span-2 sm:col-span-1 xl:pl-5">
            <div className="text-[11px] font-medium text-slate-500">
              NPC : โปรตีน · Ca : P Ratio
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-mono font-bold tabular-nums text-slate-900">
                {calc.npcToProteinRatio.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-slate-500">kcal/g</span>
              <span className="text-slate-300">·</span>
              <span
                className={`text-sm font-mono font-semibold tabular-nums ${
                  calc.caPSolubilityStatus === 'precipitation_risk'
                    ? 'text-rose-700'
                    : 'text-slate-700'
                }`}
              >
                {calc.caPMolarRatio > 0 ? `${calc.caPMolarRatio.toFixed(2)}:1` : '—'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              {calc.caPSolubilityStatus === 'precipitation_risk'
                ? 'เสี่ยงตกตะกอน Ca–P'
                : calc.caPSolubilityStatus === 'borderline'
                ? 'Ca–P ใกล้ขอบเขตละลาย'
                : 'Ca–P อยู่ในโซนปลอดภัย'}
            </div>
          </div>
        </div>
      </div>

      {/* Main 1440px Desktop Clinical Workbench */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row gap-6 no-print">
        {/* Left Context & Patient Controls Rail */}
        <PatientSidebar
          patient={patient}
          activePresetId={activePresetId}
          calc={calc}
          onSelectPreset={handleSelectPreset}
          onUpdatePatient={(patch) => setPatient((prev) => ({ ...prev, ...patch }))}
          onResetCurrentPreset={handleResetCurrentPreset}
          onJumpToSection={(sec) => setActiveSection(sec)}
        />

        {/* Active Clinical Module Viewport */}
        <div className="flex-1 min-w-0">
          {activeSection === 'fluid' ? (
            <FluidRouteSection
              patient={patient}
              fluid={fluid}
              calc={calc}
              onUpdateFluid={(patch) => setFluid((prev) => ({ ...prev, ...patch }))}
            />
          ) : null}

          {activeSection === 'macro' ? (
            <MacroEnergySection
              patient={patient}
              fluid={fluid}
              macro={macro}
              calc={calc}
              onUpdateMacro={(patch) => setMacro((prev) => ({ ...prev, ...patch }))}
            />
          ) : null}

          {activeSection === 'micro' ? (
            <MicroCaPSection
              patient={patient}
              micro={micro}
              calc={calc}
              onUpdateMicro={(patch) => setMicro((prev) => ({ ...prev, ...patch }))}
            />
          ) : null}

          {activeSection === 'monitoring' ? (
            <MonitoringWeaningSection
              patient={patient}
              fluid={fluid}
              macro={macro}
              calc={calc}
              labs={labs}
              onAddLab={handleAddLab}
              onUpdateFluid={(patch) => setFluid((prev) => ({ ...prev, ...patch }))}
              onUpdateMacro={(patch) => setMacro((prev) => ({ ...prev, ...patch }))}
            />
          ) : null}

          {/* Bottom Step Navigation Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              สำหรับการช่วยประเมินและคำนวณทางคลินิก — ยืนยันสูตรและความละลาย Ca–P ร่วมกับเภสัชกรก่อนเตรียมยา
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeSection !== 'fluid' ? (
                <button
                  type="button"
                  onClick={() => {
                    const idx = NAV_TABS.findIndex((t) => t.id === activeSection);
                    if (idx > 0) setActiveSection(NAV_TABS[idx - 1].id);
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
                >
                  ขั้นตอนก่อนหน้า
                </button>
              ) : null}
              {activeSection !== 'monitoring' ? (
                <button
                  type="button"
                  onClick={() => {
                    const idx = NAV_TABS.findIndex((t) => t.id === activeSection);
                    if (idx < NAV_TABS.length - 1) setActiveSection(NAV_TABS[idx + 1].id);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg cursor-pointer whitespace-nowrap"
                >
                  ขั้นตอนถัดไป
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setOrderModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg cursor-pointer whitespace-nowrap"
                >
                  เปิดใบสรุปคำสั่ง TPN
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Printable & Copyable TPN Order Summary Modal */}
      <OrderSummaryModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        patient={patient}
        fluid={fluid}
        macro={macro}
        micro={micro}
        calc={calc}
      />
    </div>
  );
}
