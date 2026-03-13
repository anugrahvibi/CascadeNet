import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, AlertCircle, Phone, Lock, Fingerprint } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useGsapAnimations } from '../utils/useGsapAnimations';
import { useRef } from 'react';

export function Login() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { role, login } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useGsapAnimations(containerRef);

  // Auto-redirect if already authenticated
  React.useEffect(() => {
    if (role === 'NDRF') navigate('/ndrf', { replace: true });
    else if (role === 'Dam Controller') navigate('/dam', { replace: true });
    else if (role === 'District Collector') navigate('/admin', { replace: true });
    else if (role === 'Highway Department') navigate('/highway', { replace: true });
    else if (role === 'Developer') navigate('/dev', { replace: true });
    else if (role === 'Public') navigate('/public', { replace: true });
  }, [role, navigate]);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('A valid tactical mobile identifier is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber })
      });

      const data = await response.json();
      if (data.success) {
        setStep('otp');
      } else {
        setError(data.detail || 'Tactical gateway timeout');
      }
    } catch (err) {
      setError('Communication failure with Auth Relay');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError('Complete authentication code required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phoneNumber, otp, role: 'NDRF' })
      });

      const data = await response.json();
      if (data.success) {
        login(data.user.role, data.user.phone_number);
        navigate('/', { replace: true });
      } else {
        setError(data.detail || 'Verification failure');
      }
    } catch (err) {
      setError('Authentication server unreachable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen w-full flex items-center justify-center p-6 relative bg-[#f8fafc] overflow-hidden">
      {/* Cinematic Background */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] h-[60%] bg-blue-600/5 blur-[160px] rounded-full animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-[420px] relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 glass-card rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/20 active:scale-95 transition-transform duration-500 group mb-6">
            <img src="/logo.svg" alt="Cascadenet" className="w-12 h-12 group-hover:rotate-[360deg] transition-transform duration-700" />
          </div>
          <h1 className="text-5xl font-black text-gray-900 brand-fonter leading-none">
            Cascade<span className="text-blue-600 ending-serif">Net</span>
          </h1>
          <p className="text-gray-400 text-[13px] font-black uppercase mt-3">Advanced Intelligence &amp; Response</p>
        </div>

        <div className="glass-card p-10 rounded-[3rem] space-y-8 premium-shadow">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 uppercase">
              {step === 'phone' ? 'Operator Access' : 'Security Check'}
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              {step === 'phone' ? 'Enter tactical mobile number to receive clearance.' : 'Clearance code dispatched via encrypted SMS.'}
            </p>
          </div>

          <form onSubmit={step === 'phone' ? requestOtp : verifyOtp} className="space-y-6">
            <div className="space-y-4">
              {step === 'phone' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tactical ID (Mobile)</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Phone size={18} />
                    </div>
                    <input
                      type="tel"
                      placeholder="99XX-XXX-XXX"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={loading}
                      className="glass-input pl-14"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Authentication Code</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock size={18} />
                    </div>
                    <input
                      type="text"
                      placeholder="XXXX"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      disabled={loading}
                      className="glass-input pl-14 tracking-[0.5em] text-center font-black text-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-[11px] font-bold border border-red-100 animate-in fade-in zoom-in duration-300">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-16 rounded-2xl font-black uppercase text-[12px] transition-all duration-300 shadow-xl shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {step === 'phone' ? 'Request Clearance' : 'Authorize Deployment'}
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {step === 'otp' && (
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-slate-400 hover:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-colors"
              >
                Change Tactical ID
              </button>
            )}
          </form>

          <div className="text-center pt-2">
            <Link to="/signup" className="text-[10px] font-black text-gray-400 hover:text-blue-600 transition-colors uppercase">
              Request Official Credentials
            </Link>
          </div>
        </div>

        <p className="mt-10 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2">
          <Fingerprint size={14} /> Biometric &amp; Terminal Secured
        </p>
      </div>
    </div>
  );
}
