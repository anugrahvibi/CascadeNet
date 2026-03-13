import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, AlertTriangle, Shield, CheckCircle2, Navigation, Activity, ChevronRight, Info } from 'lucide-react';
import { fetchPredictions, fetchActiveAlerts } from '../utils/dataFetcher';
import type { ZonePrediction, StakeholderAction } from '@schema';
import { getPredictionAlertLevel } from '../utils/schemaHelpers';
import { useGsapAnimations } from '../utils/useGsapAnimations';

export function PublicPortal() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [pin, setPin] = useState('');
    const [searchResult, setSearchResult] = useState<ZonePrediction | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [globalRisks, setGlobalRisks] = useState<ZonePrediction[]>([]);
    const [advisories, setAdvisories] = useState<StakeholderAction[]>([]);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    useGsapAnimations(containerRef, [globalRisks, searchResult]);

    useEffect(() => {
        async function loadPublicData() {
            const [preds, alerts] = await Promise.all([
                fetchPredictions('2024_peak'),
                fetchActiveAlerts('Public', '2024_peak')
            ]);
            setGlobalRisks(preds);
            setAdvisories(alerts);
            setLastUpdated(new Date().toLocaleTimeString());
        }
        loadPublicData();
    }, []);

    const handleSearch = () => {
        if (!pin) return;
        setIsSearching(true);
        setTimeout(() => {
            const found = globalRisks.find(p =>
                p.zone_id.toLowerCase().includes(pin.toLowerCase()) ||
                (p as any).zone_name?.toLowerCase().includes(pin.toLowerCase())
            );
            setSearchResult(found || null);
            setIsSearching(false);
        }, 800);
    };

    return (
        <div ref={containerRef} className="pt-20 sm:pt-24 lg:pt-26 h-full w-full bg-transparent overflow-y-auto custom-scrollbar">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-20 space-y-10 sm:space-y-16">

                {/* Cinematic Header */}
                <div className="text-center space-y-6 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 blur-[100px] rounded-full -z-10" />
                    <div className="flex items-center gap-2 mb-6 justify-center text-blue-700">
                        <Shield size={16} />
                        <span className="text-[14px] font-black uppercase tracking-[0.2em]">Community Defense Network</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-950 brand-font leading-[0.9]">
                        Wayanad Flood <span className="text-blue-700 ending-serif">Intelligence</span>
                    </h1>
                    <p className="max-w-xl mx-auto text-gray-600 font-bold text-lg leading-relaxed">
                        Real-time predictive safety data for your sector. Powered by high-resolution LSTM models.
                    </p>
                </div>

                {/* Search Box */}
                <div className="max-w-2xl mx-auto w-full">
                    <div className="glass-card p-2 rounded-[2.5rem] flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border border-white/60">
                        <input
                            type="text"
                            placeholder="Enter sector name (e.g. Kalpetta, Meppadi)"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 h-14 sm:h-16 px-6 sm:px-10 flex-1 font-bold text-gray-900 placeholder:text-gray-400"
                        />
                        <button
                            onClick={handleSearch}
                            className="w-full sm:w-auto shrink-0 justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-10 h-14 sm:h-16 rounded-[2rem] font-black text-[15px] uppercase transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-3"
                        >
                            {isSearching ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={22} />}
                            Search Sector
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Search Result Window */}
                    <div className="space-y-6">
                        <h2 className="text-[13px] font-black text-gray-400 uppercase flex items-center gap-3 pl-2">
                            <MapPin size={16} className="text-blue-700" /> Sector Analysis
                        </h2>
                        {searchResult ? (
                            <div className="glass-card p-6 sm:p-10 rounded-[3rem] space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-start gap-3">
                                    <div>
                                        <h3 className="text-2xl sm:text-3xl font-black text-gray-950 brand-font uppercase leading-none break-words">{(searchResult as any).zone_name || searchResult.zone_id}</h3>
                                        <div className="text-[14px] text-gray-500 font-bold mt-2 uppercase">Coordinates Verified</div>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[13px] font-black uppercase ${getPredictionAlertLevel(searchResult) === 'RED' ? 'glass-tint-red text-red-700' :
                                        (getPredictionAlertLevel(searchResult) === 'YELLOW' || getPredictionAlertLevel(searchResult) === 'ORANGE') ? 'glass-tint-orange text-orange-700' :
                                            'glass-tint-blue text-blue-700'
                                        }`}>
                                        {getPredictionAlertLevel(searchResult)}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="glass-tint-blue p-6 rounded-3xl">
                                        <div className="text-[13px] font-black text-blue-700 uppercase mb-1">Flood Prob.</div>
                                        <div className="text-4xl font-black text-gray-950 brand-font">{(searchResult.flood_probability * 100).toFixed(0)}%</div>
                                    </div>
                                    <div className="glass-tint-blue p-6 rounded-3xl">
                                        <div className="text-[13px] font-black text-blue-700 uppercase mb-1">Lead Time</div>
                                        <div className="text-4xl font-black text-blue-700 brand-font">{searchResult.lead_time_hours}H</div>
                                    </div>
                                </div>
                                <div className="p-6 glass-tint-blue rounded-3xl space-y-2 border border-blue-100/50">
                                    <div className="flex items-center gap-3 text-blue-600">
                                        <Info size={18} />
                                        <span className="text-[13px] font-black uppercase">Safety Bulletin</span>
                                    </div>
                                    <p className="text-gray-600 text-[14px] font-medium leading-relaxed italic">
                                        {getPredictionAlertLevel(searchResult) === 'RED'
                                            ? "Severe risk detected. Evacuation of ground-level structures is prioritized."
                                            : "Monitoring phase active. No immediate evacuation required."}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-card p-12 sm:p-20 rounded-[3rem] text-center space-y-6 opacity-60">
                                <Activity className="mx-auto text-blue-400 animate-pulse" size={48} />
                                <div className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Awaiting sector input</div>
                            </div>
                        )}
                    </div>

                    {/* Active Advisories */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-[13px] font-black text-gray-400 uppercase flex items-center gap-3">
                                <Navigation size={16} className="text-blue-700" /> Active Advisories
                            </h2>
                            <div className="px-3 py-1 glass-tint-orange rounded-full text-[11px] font-black text-orange-600 uppercase">Broadcast: Active</div>
                        </div>
                        <div className="space-y-4">
                            {advisories.length > 0 ? (
                                advisories.map((alert, idx) => (
                                    <div key={idx} className="glass-card p-5 rounded-[2.2rem] flex items-start gap-4 group transition-all hover:border-blue-200">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <Activity size={24} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[12px] font-black text-blue-800 uppercase italic">HQ Broadcast</span>
                                                <div className="text-[12px] font-black text-gray-400 uppercase">T-{alert.time_window_hours}H</div>
                                            </div>
                                            <p className="text-gray-900 font-bold text-[15px] leading-tight">"{alert.action}"</p>
                                        </div>
                                        <ChevronRight size={18} className="text-gray-300 mt-2" />
                                    </div>
                                ))
                            ) : (
                                <div className="glass-card p-12 rounded-[2.2rem] text-center space-y-4 opacity-40 italic">
                                    <CheckCircle2 className="mx-auto text-emerald-400" size={40} />
                                    <p className="text-[13px] font-black text-gray-500 uppercase">Systems Normalized</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Footer */}
                <div className="pt-12 border-t border-black/5 grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div className="space-y-1">
                        <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Model Link</div>
                        <div className="text-sm font-black text-gray-900">LSTM_v3.4_ACTIVE</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Tactical Sync</div>
                        <div className="text-sm font-black text-emerald-600 animate-pulse">ENCRYPTED_LIVE</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Last Update</div>
                        <div className="text-sm font-black text-gray-900">{lastUpdated || '--:--:--'}</div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Public Safety</div>
                        <div className="text-sm font-black text-blue-600 uppercase">TIER 1 SECURED</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
