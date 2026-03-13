import React, { useState } from 'react';
import { Radio, MapPin, Signal, ShieldAlert, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../AuthContext';

export function DemoControl() {
    const { phoneNumber } = useAuth();
    const [zoneId, setZoneId] = useState('ZONE_KALPETTA');
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [loading, setLoading] = useState(false);

    const triggerDistress = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const url = `/api/v1/ml/alerts/distress?zone_id=${zoneId}${phoneNumber ? `&phone_number=${encodeURIComponent(phoneNumber)}` : ''}`;
            const resp = await fetch(url, { method: 'POST' });
            if (resp.ok) {
                setStatus({
                    type: 'success',
                    message: `Strategic SOS alerts dispatched to field units${phoneNumber ? ` (Target: ${phoneNumber})` : ''}.`
                });
            } else {
                setStatus({ type: 'error', message: 'Uplink failed.' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Connection Error.' });
        }
        setLoading(false);
    };

    const clearDistress = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const resp = await fetch('/api/v1/ml/alerts/distress', { method: 'DELETE' });
            if (resp.ok) {
                setStatus({ type: 'success', message: 'SOS Signal Terminated.' });
            } else {
                setStatus({ type: 'error', message: 'Termination failed.' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'Connection Error.' });
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-transparent relative overflow-hidden">
            {/* Dark Tactical Backdrop Overlay */}
            <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm -z-10" />

            <div className="max-w-md w-full space-y-8 animate-in zoom-in duration-500">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Signal size={16} className="text-blue-500 animate-pulse" />
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Tactical Link Encrypted</span>
                    </div>
                </div>

                <div className="glass-card p-10 rounded-[3rem] border border-white/20 shadow-2xl space-y-8 relative overflow-hidden">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
                            <ShieldAlert className="text-red-600 animate-pulse" size={32} /> Field <span className="text-red-600">SOS</span> Unit
                        </h1>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.3em]">Sector Deployment Hub</p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Sector</label>
                        <div className="relative">
                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={zoneId}
                                onChange={(e) => setZoneId(e.target.value)}
                                className="w-full h-16 bg-slate-50 border-none rounded-2xl pl-14 pr-6 font-bold text-gray-900 appearance-none focus:ring-2 focus:ring-red-500/20 transition-all outline-none"
                            >
                                <option value="ZONE_KALPETTA">Kalpetta Sector</option>
                                <option value="ZONE_MANANTHAVADY">Mananthavady Sector</option>
                                <option value="ZONE_SULTHAN_BATHERY">Bathery Sector</option>
                                <option value="ZONE_VYTHIRI">Vythiri Sector</option>
                                <option value="ZONE_PANAMARAM">Panamaram Sector</option>
                                <option value="ZONE_AMBALAVAYAL">Ambalavayal Sector</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={triggerDistress}
                            disabled={loading}
                            className="w-full h-20 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] font-black uppercase text-lg shadow-xl shadow-red-500/20 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Radio size={28} className={loading ? 'animate-spin' : 'animate-pulse'} />
                            Transmit SOS
                        </button>

                        <button
                            onClick={clearDistress}
                            disabled={loading}
                            className="w-full h-14 glass-tint-blue rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Trash2 size={16} />
                            End Transmission
                        </button>
                    </div>

                    {status && (
                        <div className={`p-5 rounded-2xl flex items-center gap-3 text-[12px] font-bold border transition-all animate-in slide-in-from-bottom-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {status.message}
                        </div>
                    )}
                </div>

                <div className="text-center space-y-4 px-8 opacity-60">
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] leading-relaxed">
                        Authorized Use Only. Signal will override all active terminal units.
                    </p>
                </div>
            </div>
        </div>
    );
}
