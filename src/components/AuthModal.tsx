import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  X,
  LogIn,
  UserPlus,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Check,
  Mail,
  Lock,
  User as UserIcon,
  Shield,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onLoginSuccess: (user: User) => void;
  onRegister: (data: any) => Promise<{ user: User; verificationCode?: string }>;
  onLogin: (data: any) => Promise<{ user: User }>;
  onVerifyEmail: (code: string) => Promise<User>;
  onResendCode: () => Promise<string>;
  onForgotPassword: (email: string) => Promise<{ recoveryCode?: string; message: string }>;
  onResetPassword: (data: any) => Promise<User>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onLoginSuccess,
  onRegister,
  onLogin,
  onVerifyEmail,
  onResendCode,
  onForgotPassword,
  onResetPassword,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'verify' | 'forgot' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [favoriteTeam, setFavoriteTeam] = useState('Arsenal');
  const [favoriteBookmaker, setFavoriteBookmaker] = useState('Bet9ja');

  // Verification & reset code state
  const [verificationCode, setVerificationCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [activeVerificationNotice, setActiveVerificationNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide email/username and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await onLogin({ emailOrUsername: email.trim(), password });
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Quick Demo Admin Login
  const handleQuickAdminLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await onLogin({ emailOrUsername: 'admin@safepicksarena.com', password: 'SafeAdmin2026!' });
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanUsername = username.trim();

    if (!cleanEmail || !cleanUsername || !password) {
      setError('Please fill in all required fields (Email, Username, Password).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address (e.g. striker@example.com).');
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 25) {
      setError('Username must be between 3 and 25 characters long.');
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await onRegister({
        email: cleanEmail,
        username: cleanUsername,
        password,
        favoriteTeam: favoriteTeam.trim() || 'Football Fan',
        favoriteBookmaker: favoriteBookmaker || 'Bet9ja',
      });

      // Switch to verify email mode
      setActiveVerificationNotice(
        res.verificationCode
          ? `Welcome to Arena! Your verification code is: [ ${res.verificationCode} ]`
          : 'Account created! Enter the verification code sent to your email.'
      );
      if (res.verificationCode) {
        setVerificationCode(res.verificationCode);
      }
      setSuccessMessage('Account created successfully! Please verify your email.');
      setMode('verify');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify Email
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError('Enter the 6-digit code.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user = await onVerifyEmail(verificationCode.trim());
      setSuccessMessage('Email verified successfully!');
      setTimeout(() => {
        onLoginSuccess(user);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please provide your account email.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await onForgotPassword(email.trim());
      setSuccessMessage(res.message);
      if (res.recoveryCode) {
        setRecoveryCode(res.recoveryCode);
      }
      setMode('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to process password recovery');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryCode.trim() || !newPassword) {
      setError('Please enter the recovery code and new password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user = await onResetPassword({
        email: email.trim(),
        recoveryCode: recoveryCode.trim(),
        newPassword,
      });
      setSuccessMessage('Password reset successful! Logging you in...');
      setTimeout(() => {
        onLoginSuccess(user);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#121319] border border-yellow-400/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Top Header */}
        <div className="bg-[#0e0f14] border-b border-[#22242d] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-black flex items-center justify-center font-bold">
              ⚡
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white uppercase tracking-tight">
                {mode === 'login' && 'Arena Sign In'}
                {mode === 'register' && 'Join Safe Picks Arena'}
                {mode === 'verify' && 'Verify Your Email'}
                {mode === 'forgot' && 'Password Recovery'}
                {mode === 'reset' && 'Set New Password'}
              </h2>
              <p className="text-[11px] text-slate-400">
                Secure real accounts. Zero fake data. 100% free platform.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback banners */}
        {error && (
          <div className="bg-rose-500/10 border-b border-rose-500/30 text-rose-400 text-xs p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-emerald-500/10 border-b border-emerald-500/30 text-emerald-400 text-xs p-3 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {activeVerificationNotice && mode === 'verify' && (
          <div className="bg-yellow-400/10 border-b border-yellow-400/30 text-yellow-400 text-xs p-3 flex items-center gap-2 font-mono-sport">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{activeVerificationNotice}</span>
          </div>
        )}

        <div className="p-6">
          {/* MODE 1: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email or username"
                    className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-yellow-400 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300 uppercase">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('forgot');
                    }}
                    className="text-[11px] text-yellow-400 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white focus:border-yellow-400 outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-2.5 rounded-xl text-xs sm:text-sm uppercase tracking-wide transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In To Arena'}
              </button>

              {/* Demo Admin One-Click Button */}
              <div className="pt-3 border-t border-[#1e202c]">
                <button
                  type="button"
                  onClick={handleQuickAdminLogin}
                  className="w-full bg-[#181a24] hover:bg-[#252838] border border-yellow-400/40 text-yellow-400 font-extrabold py-2 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  title="One-click log in as Arena Chief Admin to test admin publishing"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>One-Click Test: Log in as Arena Admin</span>
                </button>
                <div className="text-[10px] text-slate-500 text-center mt-1 font-mono-sport">
                  admin@safepicksarena.com · SafeAdmin2026!
                </div>
              </div>

              <div className="text-center text-xs text-slate-400 pt-2">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('register');
                  }}
                  className="text-yellow-400 font-bold hover:underline cursor-pointer"
                >
                  Create one free
                </button>
              </div>
            </form>
          )}

          {/* MODE 2: REGISTER */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl px-3.5 py-2 text-xs text-white focus:border-yellow-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ArenaStriker9"
                  className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl px-3.5 py-2 text-xs text-white focus:border-yellow-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl px-3.5 py-2 text-xs text-white focus:border-yellow-400 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Favorite Club
                  </label>
                  <input
                    type="text"
                    value={favoriteTeam}
                    onChange={(e) => setFavoriteTeam(e.target.value)}
                    placeholder="e.g. Arsenal, Chelsea"
                    className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl px-3 py-2 text-xs text-white focus:border-yellow-400 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Preferred Bookie
                  </label>
                  <select
                    value={favoriteBookmaker}
                    onChange={(e) => setFavoriteBookmaker(e.target.value)}
                    className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl px-3 py-2 text-xs text-white focus:border-yellow-400 outline-none"
                  >
                    <option value="Bet9ja">Bet9ja</option>
                    <option value="SportyBet">SportyBet</option>
                    <option value="MSport">MSport</option>
                    <option value="Football.com">Football.com</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-2.5 rounded-xl text-xs sm:text-sm uppercase tracking-wide transition-colors cursor-pointer shadow-md disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating Account...' : 'Complete Free Registration'}
              </button>

              <div className="text-center text-xs text-slate-400 pt-2">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('login');
                  }}
                  className="text-yellow-400 font-bold hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}

          {/* MODE 3: VERIFY EMAIL */}
          {mode === 'verify' && (
            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter the 6-digit verification code generated for your email address to verify your account and unlock friend invites and chat privileges.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl px-3.5 py-3 text-center text-xl font-mono-sport tracking-widest text-yellow-400 font-black focus:border-yellow-400 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !verificationCode.trim()}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-2.5 rounded-xl text-xs sm:text-sm uppercase tracking-wide transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const code = await onResendCode();
                      setVerificationCode(code);
                      setActiveVerificationNotice(`New code sent: [ ${code} ]`);
                    } catch (err: any) {
                      setError(err.message || 'Failed to resend');
                    }
                  }}
                  className="text-yellow-400 hover:underline font-bold cursor-pointer"
                >
                  Resend Code
                </button>

                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-slate-400 hover:text-white"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* MODE 4: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Enter your account email to receive a 6-digit recovery code.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Account Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-yellow-400 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-2.5 rounded-xl text-xs sm:text-sm uppercase tracking-wide transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? 'Generating Code...' : 'Request Recovery Code'}
              </button>

              <div className="text-center text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-slate-400 hover:text-white"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* MODE 5: RESET PASSWORD */}
          {mode === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Recovery Code
                </label>
                <input
                  type="text"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="Enter 6-digit recovery code"
                  className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl px-3.5 py-2 text-xs font-mono-sport text-yellow-400 font-bold focus:border-yellow-400 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-[#090a0e] border border-[#22242d] rounded-xl px-3.5 py-2 text-xs text-white focus:border-yellow-400 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !recoveryCode.trim() || !newPassword}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-2.5 rounded-xl text-xs sm:text-sm uppercase tracking-wide transition-colors cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? 'Resetting Password...' : 'Reset Password & Sign In'}
              </button>

              <div className="text-center text-xs pt-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-slate-400 hover:text-white"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
