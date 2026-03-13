import React, { useEffect, useState, useRef } from 'react';
import { MapView } from '../components/MapView';
import { ZonePanel } from '../components/ZonePanel';
import { CustomSelect } from '../components/CustomSelect';
import { fetchZones, fetchInfrastructure, fetchPredictions, fetchActiveAlerts, fetchLeadTimes, fetchVulnerabilities, fetchROIRankings } from '../utils/dataFetcher';
import type { LeadTimeTicker, ZonePrediction, InfrastructureNode, StakeholderAction, VulnerabilityAnalysis, ROIAnalysis } from '@schema';
import { getPredictionAlertLevel } from '../utils/schemaHelpers';
import { AlertTriangle, MapPin, ShieldAlert, Navigation, Activity, CheckCircle2, Zap, Shield, Radio, Clock, Target, Info, ShieldCheck, ChevronRight, ArrowRight, BarChart3, Layers, Thermometer, X } from 'lucide-react';

import { useGsapAnimations } from '../utils/useGsapAnimations';
import { useAuth } from '../AuthContext';

export function NdrfDashboard() {
  const { phoneNumber } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [zones, setZones] = useState<any>(null);
  const [infra, setInfra] = useState<InfrastructureNode[]>([]);
  const [predictions, setPredictions] = useState<ZonePrediction[]>([]);
  const [alerts, setAlerts] = useState<StakeholderAction[]>([]);
  const [leadTimes, setLeadTimes] = useState<LeadTimeTicker[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityAnalysis | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [scenario, setScenario] = useState('2024_peak');
  const [roiRankings, setRoiRankings] = useState<ROIAnalysis[]>([]);
  const [distressAlert, setDistressAlert] = useState<StakeholderAction | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showRedAlert, setShowRedAlert] = useState(false);
  const lastAcknowledgedSOS = useRef<string | null>(null);

  const playWarningSound = useRef<() => void>(() => {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);

      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1760, ctx.currentTime);
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.1);
      }, 100);
    } catch (e) {
      console.warn('Audio feedback blocked by browser policy');
    }
  });

  useGsapAnimations(containerRef, [predictions, alerts, leadTimes, vulnerabilities]);

  useEffect(() => {
    async function init() {
      const [zData, iData, pData, aData, lData, vData, roiData] = await Promise.all([
        fetchZones(),
        fetchInfrastructure(),
        fetchPredictions(scenario),
        fetchActiveAlerts('ndrf_rescue', scenario),
        fetchLeadTimes(scenario),
        fetchVulnerabilities(),
        fetchROIRankings(),
      ]);
      setZones(zData);
      setInfra(iData.nodes);
      setPredictions(pData);
      setAlerts(aData);
      setLeadTimes(lData);
      setVulnerabilities(vData);
      setRoiRankings(roiData);

      const distress = aData.find((a: any) => (a as any).is_distress);
      if (distress) {
        const sosId = (distress as any).timestamp || distress.action;
        if (sosId !== lastAcknowledgedSOS.current) {
          if (!distressAlert) {
            setShowRedAlert(true);
            playWarningSound.current();
          }
          setDistressAlert(distress);
        } else {
          setShowRedAlert(false);
          setDistressAlert(null);
        }
      } else {
        setDistressAlert(null);
        setShowRedAlert(false);
        lastAcknowledgedSOS.current = null;
      }

      setLastUpdated(new Date().toLocaleTimeString());
    }
    init();
    const interval = setInterval(init, 3000);
    return () => clearInterval(interval);
  }, [scenario]);

  const sortedRisks = (predictions || [])
    .filter(p => p && getPredictionAlertLevel(p) !== 'GREEN')
    .sort((a, b) => {
      const levelA = getPredictionAlertLevel(a);
      const levelB = getPredictionAlertLevel(b);
      if ((levelA === 'RED' || levelA === 'ORANGE') && (levelB !== 'RED' && levelB !== 'ORANGE')) return -1;
      if ((levelA !== 'RED' && levelA !== 'ORANGE') && (levelB === 'RED' || levelB === 'ORANGE')) return 1;
      return (a.lead_time_hours || 0) - (b.lead_time_hours || 0);
    });

  const criticalLead = [...(leadTimes || [])]
    .sort((a, b) => (a.hours_until_peak || 0) - (b.hours_until_peak || 0))[0];

  return (
    <div ref={containerRef} className="flex flex-col lg:flex-row h-full w-full bg-transparent pt-20 sm:pt-24 lg:pt-26 p-3 sm:p-4 gap-3 sm:gap-4 overflow-y-auto custom-scrollbar">
      {/* Sidebar */}
      <div className="w-full lg:w-96 h-auto lg:h-full max-h-[52vh] lg:max-h-none flex flex-col z-10 shrink-0 rounded-[2.5rem] glass-card overflow-visible [--glass-card-filter:none]">
        <div className="glass-blur-fix" />
        <div className="px-5 py-4 sm:px-6 sm:py-5 sticky top-0 z-30 glass-header border-b border-white/10">
          <div className="space-y-5 mb-5">
            <div className="flex flex-col gap-2">
              <h2 className="font-black text-gray-900 brand-font text-[22px] flex items-center gap-3 leading-none">
                <Shield className="text-blue-600" size={24} /> NDRF <span className="text-blue-600">TACTICAL</span>
              </h2>
              <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity ml-9">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[11px] text-gray-600 font-bold uppercase">Sync: {lastUpdated}</span>
              </div>
            </div>
            <div className="relative w-full z-40">
              <CustomSelect
                value={scenario}
                onChange={(val) => setScenario(val)}
                variant="compact"
                options={[
                  { value: 'current', label: 'Current State' },
                  { value: 'moderate', label: 'Moderate Rain' },
                  { value: '2024_peak', label: '2024 Peak Flood' }
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-red p-6 rounded-3xl relative overflow-hidden group">
              <div className="text-[14px] font-black text-red-600/40 uppercase mb-1">Critical</div>
              <div className="text-2xl font-black text-red-600 leading-none">{sortedRisks.filter(r => getPredictionAlertLevel(r) === 'RED').length}</div>
            </div>

            <div className="glass-amber p-6 rounded-3xl relative overflow-hidden group">
              <div className="text-[14px] font-black text-slate-700 uppercase mb-1">Horizon</div>
              <div className="text-2xl font-black text-slate-600 leading-none">
                {predictions.length > 0 ? (predictions.reduce((acc, p) => acc + p.lead_time_hours, 0) / predictions.length).toFixed(1) : '0'}h
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6 flex-1 overflow-y-auto overflow-x-hidden space-y-8 custom-scrollbar">
          {/* Graphical Insights Area */}
          <section className="gsap-appear">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 size={14} className="opacity-80" /> Tactical Intelligence
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {/* Tactical Radar */}
              <div className="glass-card glass-card-interactive p-6 rounded-[2.5rem] border border-white/40 shadow-sm group hover:border-blue-200 transition-all overflow-visible relative [--glass-card-filter:none]">
                <div className="glass-blur-fix" />
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="text-[14px] font-black text-gray-900 uppercase">Risk Signature</div>
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-tight italic">Cross-Dimensional Analysis</div>
                  </div>
                  <Layers size={16} className="text-blue-600 opacity-70 transition-transform duration-500" />
                </div>
                <div className="relative h-40 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full transform scale-125 opacity-80">
                    {[0.25, 0.5, 0.75, 1].map((r) => (
                      <circle key={r} cx="50" cy="50" r={35 * r} className="fill-none stroke-slate-200/50" strokeWidth="0.5" strokeDasharray="1 1" />
                    ))}
                    <circle cx="50" cy="50" r="1" className="fill-blue-600 animate-ping" />
                  </svg>
                </div>
              </div>

              {/* Stats Overlay Gauge */}
              <div className="glass-card glass-card-interactive p-6 rounded-[2rem] border border-white/40 shadow-sm group hover:border-red-200 transition-all overflow-visible relative [--glass-card-filter:none]">
                <div className="glass-blur-fix" />
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-[14px] font-black text-gray-900 uppercase">Infrastructure Load</div>
                    <div className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">System Survival Index</div>
                  </div>
                  <Thermometer size={16} className="text-red-700 opacity-70 group-hover:scale-125 group-hover:rotate-12 transition-transform duration-500" />
                </div>
                <div className="flex items-center gap-6">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100" />
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" strokeDasharray={175.9} strokeDashoffset={175.9 * (1 - 0.74)} strokeLinecap="round" fill="transparent" className="text-red-500 transition-all duration-1000" />
                    </svg>
                    <span className="absolute text-[14px] font-black text-gray-900 tracking-tighter">74%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Critical Lead Time */}
          {criticalLead && (
            <section className="glass-red p-5 rounded-[2rem] space-y-3 gsap-appear">
              <div className="flex items-center justify-between">
                <div className="text-[16px] font-black text-red-600 uppercase flex items-center gap-2">
                  <Clock size={14} /> Peak Surge T-Minus
                </div>
                <span className="text-[15px] font-black text-red-600 uppercase">{criticalLead.hours_until_peak}H</span>
              </div>
              <p className="text-[16px] text-red-700 font-bold leading-tight italic">
                "Immediate action required for {criticalLead.zone_id.replace('ZONE_', '')} sector."
              </p>
            </section>
          )}

          {/* Zones List */}
          <section>
            <p className="text-gray-800 font-bold uppercase text-[15px] pl-1 flex items-center gap-2">
              <Activity size={14} className="text-blue-700 animate-pulse" /> Precision Flow & Stability
            </p>
            <div className="space-y-3">
              {sortedRisks.length > 0 ? (
                sortedRisks.map(zone => (
                  <div
                    key={zone.zone_id}
                    onClick={() => setSelectedZone(zone.zone_id)}
                    className={`group p-4 rounded-3xl transition-all duration-300 cursor-pointer gsap-appear ${selectedZone === zone.zone_id
                      ? (getPredictionAlertLevel(zone) === 'RED' ? 'glass-red border-red-300' : (getPredictionAlertLevel(zone) === 'YELLOW' || getPredictionAlertLevel(zone) === 'ORANGE' ? 'glass-orange border-orange-300' : 'glass-amber border-amber-300'))
                      : 'glass-card border-white/50 hover:border-slate-300/50 hover:shadow-lg'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-[15px] text-gray-950 group-hover:text-blue-800 transition-colors uppercase">{zone.zone_name || zone.zone_id}</div>
                      <div className={`text-[15px] font-black px-2 py-0.5 rounded-lg ${getPredictionAlertLevel(zone) === 'RED' ? 'bg-red-600 text-white' : (getPredictionAlertLevel(zone) === 'YELLOW' || getPredictionAlertLevel(zone) === 'ORANGE') ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'}`}>
                        T-{zone.lead_time_hours}H
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-10 text-center border border-dashed border-gray-200 rounded-[2rem]">
                  <CheckCircle2 size={32} className="mx-auto text-blue-600/30 mb-3" />
                  <p className="text-[15px] font-black text-gray-700 uppercase italic">Grid Operations Stable</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="glass-card glass-card-interactive p-6 rounded-3xl relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
              <Radio size={24} className="animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-black text-gray-700 uppercase mb-1">HQ Linkage</div>
              <div className="text-[15px] font-black text-gray-950 uppercase brand-font">Active Duty</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative min-h-[65vh] lg:min-h-0 h-[65vh] lg:h-full rounded-[2.5rem] overflow-hidden border border-white/60" style={{ boxShadow: 'var(--glass-shadow)' }}>
        <MapView
          zonesGeoJson={zones}
          infrastructureNodes={infra}
          predictions={predictions}
          onZoneClick={setSelectedZone}
          selectedZoneId={selectedZone}
        />
        {selectedZone && (
          <ZonePanel
            zoneId={selectedZone}
            prediction={predictions.find(p => p.zone_id === selectedZone) || null}
            infrastructure={infra.filter(i => true)}
            onClose={() => setSelectedZone(null)}
          />
        )}

        {/* SOS Tactical SMS Notification (Floating Popover) */}
        {distressAlert && (
          <div
            onClick={() => {
              setShowRedAlert(false);
              setShowInstructions(true);
            }}
            className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] w-[90%] sm:w-80 animate-in slide-in-from-top duration-700 cursor-pointer group"
          >
            <div className="bg-[#1c1c1e]/98 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] p-4 shadow-2xl flex gap-4 items-center ring-1 ring-white/20 hover:ring-blue-500/50 transition-all">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg">
                <ShieldAlert size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[12px] font-black text-white/50 uppercase tracking-widest">Tactical SMS</span>
                  <span className="text-[10px] text-white/30 font-bold uppercase">Now</span>
                </div>
                <div className="text-[14px] font-bold text-white mb-0.5 truncate">EMERGENCY OVERRIDE</div>
                <p className="text-[14px] text-white/80 leading-snug line-clamp-2">ALERT: {distressAlert.action}. Execute Protocol S-10.</p>
              </div>
            </div>
          </div>
        )}

        {/* Full Screen Red Alert Overlay */}
        {showRedAlert && distressAlert && (
          <div className="absolute inset-0 z-[3000] pointer-events-auto flex items-center justify-center bg-red-600/40 backdrop-blur-[4px]">
            <div className="absolute inset-0 bg-red-600 animate-pulse duration-75 opacity-10" />
            <div className="relative glass-card p-12 rounded-[4rem] bg-white shadow-[0_0_150px_rgba(220,38,38,0.6)] border-4 border-red-600 text-center space-y-8 animate-in zoom-in duration-75 max-w-lg mx-6">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 animate-bounce">
                <ShieldAlert size={48} />
              </div>
              <div className="space-y-3">
                <h2 className="text-4xl font-black text-gray-900 brand-font uppercase tracking-tight">SOS SIGNAL DETECTED</h2>
                <p className="text-xl font-bold text-red-600 leading-tight uppercase tracking-wide">Immediate Field Response Required</p>
                <p className="text-sm font-medium text-gray-500">{distressAlert.action}</p>
              </div>
              <button
                onClick={async () => {
                  lastAcknowledgedSOS.current = (distressAlert as any).timestamp || distressAlert.action;
                  setShowRedAlert(false);
                  setDistressAlert(null);
                  try {
                    const url = `/api/v1/ml/alerts/distress${phoneNumber ? `?phone_number=${encodeURIComponent(phoneNumber)}` : ''}`;
                    await fetch(url, { method: 'DELETE' });
                  } catch (e) { }
                  setShowInstructions(true);
                  playWarningSound.current();
                }}
                className="w-full h-20 bg-red-600 hover:bg-black text-white rounded-3xl font-black text-xl uppercase shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group"
              >
                TAKE ACTION <ChevronRight className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructions Modal */}
      {showInstructions && distressAlert && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl transition-all">
          <div className="max-w-2xl w-full glass-card p-8 sm:p-12 rounded-[3rem] bg-white border border-white/20 shadow-2xl space-y-10">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-gray-900 brand-font uppercase">Rescue Protocol <span className="text-blue-700">S-10</span></h3>
                <p className="text-[14px] font-black text-blue-600 uppercase tracking-[0.2em]">Verification Active</p>
              </div>
              <button onClick={() => setShowInstructions(false)} className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500"><X size={24} /></button>
            </div>
            <div className="space-y-6">
              {[
                { step: "01", title: "Verify Signal Integrity", desc: "Confirm SOS authenticity with local sensor mesh." },
                { step: "02", title: "Deploy Rapid Team", desc: "Dispatch 2 NDRF battalions to provide GPS coordinates." },
                { step: "03", title: "Air Extraction Prep", desc: "Clear local helipads and notify air force." },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-6 items-start">
                  <span className="text-4xl font-black text-blue-100 italic">{item.step}</span>
                  <div className="space-y-1">
                    <h4 className="text-[18px] font-black text-gray-900 uppercase">{item.title}</h4>
                    <p className="text-gray-600 font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => { setShowInstructions(false); }} className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest">Acknowledge & Deploy</button>
          </div>
        </div>
      )}
    </div>
  );
}
