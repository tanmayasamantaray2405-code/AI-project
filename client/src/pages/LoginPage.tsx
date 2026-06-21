import React, { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import GlassCard from '../components/GlassCard';
import ThemeToggle from '../components/ThemeToggle';
import { Cpu, Mail, Lock, User, Sparkles, ArrowRight, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
  onLoginSuccess: (user: any, token: string) => void;
}

type AuthMode = 'login' | 'register' | 'forgot-email' | 'forgot-otp' | 'forgot-reset' | 'forgot-success';

export default function LoginPage({ onNavigate, onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Forgot password inputs
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [devOtp, setDevOtp] = useState(''); // Developer helper to display OTP on UI
  
  // Feedback states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // OTP Resend Countdown
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const response = await apiRequest('/users/login', {
          method: 'POST',
          body: { email, password },
        });
        if (response.success && response.data) {
          onLoginSuccess(response.data, response.data.token);
        } else {
          setError(response.message || 'Invalid email or password');
        }
      } else if (mode === 'register') {
        const response = await apiRequest('/users', {
          method: 'POST',
          body: { name, email, password },
        });
        if (response.success && response.data) {
          onLoginSuccess(response.data, response.data.token);
        } else {
          setError(response.message || 'Registration failed');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);

    try {
      const response = await apiRequest('/users/forgot-password', {
        method: 'POST',
        body: { email },
      });
      if (response.success) {
        setSuccess('Recovery OTP sent successfully!');
        if (response.devOtp) {
          setDevOtp(response.devOtp); // save to show in UI for easy testing
        }
        setMode('forgot-otp');
        setTimer(60);
      } else {
        setError(response.message || 'Failed to send verification code');
      }
    } catch (err: any) {
      setError(err.message || 'Error requesting code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;
    setError('');
    setLoading(true);

    try {
      const response = await apiRequest('/users/verify-otp', {
        method: 'POST',
        body: { email, otp: otpCode.trim() },
      });
      if (response.success && response.resetToken) {
        setResetToken(response.resetToken);
        setSuccess('OTP verified! Choose a new password.');
        setMode('forgot-reset');
      } else {
        setError(response.message || 'Invalid OTP code');
      }
    } catch (err: any) {
      setError(err.message || 'Error verifying code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiRequest('/users/reset-password', {
        method: 'POST',
        body: { resetToken, password: newPassword },
      });
      if (response.success) {
        setMode('forgot-success');
        // Clear forms
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpCode('');
        setDevOtp('');
      } else {
        setError(response.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    setError('');
    setSuccess('');
    try {
      const response = await apiRequest('/users/forgot-password', {
        method: 'POST',
        body: { email },
      });
      if (response.success) {
        setSuccess('A new OTP has been sent.');
        if (response.devOtp) setDevOtp(response.devOtp);
        setTimer(60);
      }
    } catch (err: any) {
      setError(err.message || 'Error resending code');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 transition-colors duration-500 font-sans select-none">
      {/* Top Header Theme Toggle & Back Button */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Landing Page
        </button>
        <ThemeToggle />
      </div>

      {/* Decorative Blur Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-violet-600/10 dark:bg-violet-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-cyan-500/10 dark:bg-cyan-500/25 blur-[120px] pointer-events-none" />

      {/* Floating Sparkles decoration */}
      <div className="absolute top-24 right-24 text-violet-400 dark:text-violet-600 opacity-20 pointer-events-none animate-pulse hidden md:block">
        <Sparkles className="h-20 w-20" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 justify-center mb-6 cursor-pointer" onClick={() => onNavigate('landing')}>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center text-white shadow-md">
            <Cpu className="h-5 w-5" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
            Smart<span className="text-violet-600 dark:text-violet-400">Flow</span>
          </span>
        </div>

        <GlassCard className="p-8 border border-white/20 dark:border-white/5 shadow-2xl">
          {/* LOGIN & REGISTER CONTROLS */}
          {(mode === 'login' || mode === 'register') && (
            <>
              <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white text-center mb-2">
                {mode === 'register' ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-6">
                {mode === 'register' ? 'Sign up to build your smart workflow' : 'Sign in to access your task dashboard'}
              </p>

              {error && (
                <div className="p-3.5 mb-5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-colors"
                    />
                  </div>
                  {mode === 'login' && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setError('');
                          setMode('forgot-email');
                        }}
                        className="text-[11px] font-bold text-violet-650 dark:text-violet-400 hover:underline cursor-pointer mt-1"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25 brightness-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {loading ? 'Processing...' : mode === 'register' ? 'Create Account' : 'Sign In'}
                  {!loading && <ArrowRight className="h-4.5 w-4.5" />}
                </button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                {mode === 'register' ? 'Already have an account?' : "Don't have an account yet?"}{' '}
                <button
                  onClick={() => {
                    setMode(mode === 'register' ? 'login' : 'register');
                    setError('');
                  }}
                  className="font-bold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                >
                  {mode === 'register' ? 'Sign In' : 'Sign Up'}
                </button>
              </div>
            </>
          )}

          {/* FORGOT PASSWORD: ENTER EMAIL SCREEN */}
          {mode === 'forgot-email' && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setMode('login')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">Recover Password</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Enter your email address and we will generate a 6-digit recovery OTP code for validation.
              </p>

              {error && (
                <div className="p-3.5 mb-5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? 'Sending...' : 'Send Verification OTP'}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            </>
          )}

          {/* FORGOT PASSWORD: ENTER OTP SCREEN */}
          {mode === 'forgot-otp' && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setMode('forgot-email')}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white">Verify Recovery Code</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Enter the 6-digit OTP code sent to <span className="font-bold text-slate-800 dark:text-white">{email}</span>.
              </p>

              {success && (
                <div className="p-3 mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  {success}
                </div>
              )}

              {error && (
                <div className="p-3 mb-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Dev Helper Visual Box */}
              {devOtp && (
                <div className="p-3.5 mb-5 rounded-xl border border-violet-500/20 bg-violet-500/5 text-violet-700 dark:text-violet-300 text-xs flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider">
                    <KeyRound className="h-3.5 w-3.5 text-violet-500" />
                    Local Testing Help
                  </div>
                  <p className="text-[11px] opacity-90">For convenience, use the generated OTP code below:</p>
                  <span className="text-lg font-black tracking-widest font-mono text-center block mt-1 py-1 rounded bg-white dark:bg-black/30 select-all border border-violet-500/10">{devOtp}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-widest font-mono text-lg py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20 text-slate-900 dark:text-white outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full py-3 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  disabled={timer > 0}
                  onClick={handleResendOtp}
                  className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline disabled:text-slate-400 disabled:no-underline cursor-pointer"
                >
                  {timer > 0 ? `Resend code in ${timer}s` : 'Resend Recovery OTP'}
                </button>
              </div>
            </>
          )}

          {/* FORGOT PASSWORD: RESET SCREEN */}
          {mode === 'forgot-reset' && (
            <>
              <h3 className="font-display font-extrabold text-lg text-slate-900 dark:text-white mb-2">Choose New Password</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Your recovery verification was successful. Create your new secure password below.
              </p>

              {error && (
                <div className="p-3.5 mb-5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20 text-slate-900 dark:text-white outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-black/20 text-slate-900 dark:text-white outline-none focus:border-violet-500 dark:focus:border-violet-400 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}

          {/* FORGOT PASSWORD: SUCCESS SCREEN */}
          {mode === 'forgot-success' && (
            <div className="text-center py-6">
              <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-5 animate-bounce">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h3 className="font-display font-extrabold text-xl text-slate-900 dark:text-white mb-2">Password Reset Successful</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-8 max-w-[280px] mx-auto leading-relaxed">
                Your credentials have been updated securely. You can now log in using your new password.
              </p>
              <button
                onClick={() => setMode('login')}
                className="px-6 py-2.5 rounded-xl font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow transition-all cursor-pointer"
              >
                Return to Login
              </button>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
