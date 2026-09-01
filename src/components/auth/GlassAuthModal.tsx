import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Mail, Lock, User, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { AccountSyncService } from '../../services/auth/accountSyncService';
import { UserAccount } from '../../types/auth';

interface GlassAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: UserAccount) => void;
}

export const GlassAuthModal: React.FC<GlassAuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('Password must be at least 4 characters');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const authService = AccountSyncService.getInstance();
      const res = await authService.loginWithEmail(email, name);

      if (res.success && res.user) {
        setSuccessMsg(isSignUp ? `Welcome to Mayra, ${res.user.name}!` : `Welcome back, ${res.user.name}!`);
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(res.user);
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const authService = AccountSyncService.getInstance();
      const demoEmail = email.trim() || 'rahul.sharma@gmail.com';
      const demoName = name.trim() || 'Rahul Sharma';
      const res = await authService.loginWithGoogle(demoEmail, demoName);
      if (res.success && res.user) {
        setSuccessMsg(`Google Account Connected (${res.user.name})`);
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(res.user);
          onClose();
        }, 900);
      }
    } catch (err: any) {
      setErrorMsg('Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dynamic Deep Violet Silk Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#070210]/80 backdrop-blur-xl"
        />

        {/* Dynamic ambient violet silk wave glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-purple-700/30 via-violet-600/20 to-fuchsia-600/30 blur-[100px] animate-pulse" />
        </div>

        {/* Authentic iPhone Frosted Glass Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-[370px] rounded-[32px] p-7 bg-[#160b29]/45 backdrop-blur-3xl border border-white/20 shadow-[0_24px_50px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.4),0_0_40px_rgba(147,51,234,0.25)] flex flex-col items-center select-none"
        >
          {/* Top Specular Pill Highlight */}
          <div className="w-12 h-1 rounded-full bg-white/25 mb-4" />

          {/* Minimalist iPhone Brand Logo */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400/20 to-purple-600/30 border border-white/30 flex items-center justify-center shadow-[0_8px_20px_rgba(147,51,234,0.3)] mb-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-2 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-300 transform -rotate-45" />
              <div className="w-6 h-2 rounded-full bg-gradient-to-r from-violet-300 to-fuchsia-300 transform -rotate-45" />
            </div>
          </div>

          <h2 className="text-sm font-semibold tracking-widest text-purple-200 uppercase font-mono">
            ★𝐌₳ᎽⱤ₳ ᥫ᭡
          </h2>

          <h3 className="text-xl font-medium text-white tracking-tight mt-3 mb-1 text-center font-sans">
            {isSignUp ? 'Create Your Account' : 'Welcome Back, Rahul'}
          </h3>

          <p className="text-xs text-purple-200/70 text-center mb-6 font-sans">
            Sync chats, 3D barehands & Obsidian memory vault across all your devices
          </p>

          {/* Error / Success Feedback */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-xs font-sans text-center"
            >
              {errorMsg}
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-400/50 text-emerald-200 text-xs font-sans text-center flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3.5">
            {isSignUp && (
              <div>
                <label className="text-[11px] text-purple-200/80 mb-1 block font-sans font-medium pl-1">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-purple-300/60 absolute left-3.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rahul Sharma"
                    className="w-full bg-[#120722]/60 hover:bg-[#120722]/80 focus:bg-[#120722]/90 border border-white/20 focus:border-violet-400/80 rounded-2xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-purple-300/30 outline-none transition-all font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] text-purple-200/80 mb-1 block font-sans font-medium pl-1">
                Email address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-purple-300/60 absolute left-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full bg-[#120722]/60 hover:bg-[#120722]/80 focus:bg-[#120722]/90 border border-white/20 focus:border-violet-400/80 rounded-2xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-purple-300/30 outline-none transition-all font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-purple-200/80 mb-1 block font-sans font-medium pl-1">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-purple-300/60 absolute left-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#120722]/60 hover:bg-[#120722]/80 focus:bg-[#120722]/90 border border-white/20 focus:border-violet-400/80 rounded-2xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-purple-300/30 outline-none transition-all font-sans shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                />
              </div>
            </div>

            {!isSignUp && (
              <div className="flex justify-end pr-1">
                <button
                  type="button"
                  onClick={() => alert('Password reset link sent to your registered email.')}
                  className="text-[11px] text-purple-300/80 hover:text-white transition-colors font-sans cursor-pointer"
                >
                  Forget Password ?
                </button>
              </div>
            )}

            {/* Apple Glossy Lavender-Violet Action Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={isLoading}
              className="mt-1 w-full py-3 rounded-2xl bg-gradient-to-r from-[#a87ffb] via-[#9358f7] to-[#b388ff] text-white font-medium text-sm font-sans tracking-wide shadow-[0_8px_25px_rgba(147,51,234,0.45),inset_0_1px_1px_rgba(255,255,255,0.6)] hover:shadow-[0_10px_30px_rgba(147,51,234,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Sign Up' : 'Login'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          {/* Quick Google Sign In */}
          <div className="w-full mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleQuickDemoGoogleLogin}
              className="w-full py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs text-purple-200 flex items-center justify-center gap-2 transition-all font-sans cursor-pointer active:scale-95"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/>
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.2s.7 5.5 1.9 7.9l3.7-2.9z"/>
                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          {/* Toggle between Sign In & Sign Up */}
          <div className="mt-5 text-center text-xs text-purple-200/70 font-sans">
            <span>{isSignUp ? 'Already have an account ? ' : 'Are You New Member ? '}</span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className="text-white font-semibold hover:text-purple-300 transition-colors cursor-pointer underline underline-offset-2"
            >
              {isSignUp ? 'Log In' : 'Sign UP'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
