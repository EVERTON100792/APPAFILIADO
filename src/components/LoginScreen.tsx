import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, CheckCircle2, Shield, Zap, Terminal, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  onToggleDevTools?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onToggleDevTools }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const ensureProfile = async (user: any) => {
    if (!user?.id) return;
    const profileQuery: any = await supabase
      .from('profiles')
      .select('id, trial_started_at')
      .eq('id', user.id)
      .maybeSingle();
    const existingProfile = profileQuery.data as { id: string; trial_started_at: string | null } | null;
    if (existingProfile) return;
    await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        is_pro: false,
        trial_started_at: new Date().toISOString(),
      }, { onConflict: 'id' });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Too many requests') || error.status === 429) {
            setError('Muitas solicitações! Aguarde 5 min para sua segurança.');
          } else if (error.message.includes('Invalid login')) {
            setError('E-mail ou Senha incorretos. Tente novamente.');
          } else {
            setError(error.message);
          }
        } else {
          await ensureProfile(data.user);
          onLoginSuccess(data.user);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          if (error.message.includes('Too many requests') || error.status === 429) {
            setError('Servidor ocupado! Aguarde alguns minutos.');
          } else if (error.message.includes('User already registered')) {
            setError('E-mail já cadastrado. Faça login.');
          } else {
            setError(error.message);
          }
        } else {
          await ensureProfile(data.user);
          setSuccess(true);
        }
      }
    } catch (err: any) {
      setError('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-inter selection:bg-accent/30">
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-accent/5 to-transparent" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[150px] -translate-y-1/2 translate-x-1/4" />
        
        {/* Subtle Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ 
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-cyan-400 mb-4 shadow-lg shadow-accent/30"
          >
            <Zap size={28} className="text-slate-950" />
          </motion.div>
          
          <h1 className="text-2xl font-black tracking-tight text-white">
            VIRAL<span className="text-accent">SQUAD</span>
          </h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-2">
            Affiliate Pro
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* Top Bar */}
          <div className="bg-slate-950/50 border-b border-white/5 py-3 px-4 flex items-center justify-center gap-2">
            <Shield size={12} className="text-emerald-500" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              24h de teste grátis
            </span>
          </div>

          <div className="p-5 space-y-4">
            {/* Title */}
            <div className="text-center">
              <h2 className="text-base font-semibold text-white">
                {isLogin ? 'Entrar' : 'Criar conta'}
              </h2>
              <p className="text-[10px] text-slate-500 mt-1">
                {isLogin ? 'Acesse sua conta' : 'Comece gratuitamente'}
              </p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 flex items-center gap-2 text-red-400 text-[10px]"
                >
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 flex items-center gap-2 text-emerald-400 text-[10px]"
                >
                  <CheckCircle2 size={14} />
                  <span>Conta criada! Verifique seu e-mail.</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleAuth} className="space-y-3">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
                  className="w-full bg-slate-950 border border-white/10 rounded-lg py-2.5 pl-10 pr-10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-accent/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Entrar' : 'Cadastrar'}
                    <LogIn size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Toggle */}
            <div className="text-center pt-2 border-t border-white/5">
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(null); setSuccess(false); }}
                className="text-[10px] text-slate-500 hover:text-white transition-colors"
              >
                {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
                <span className="text-accent font-semibold">{isLogin ? 'Cadastre-se' : 'Entre'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center items-center gap-4 mt-6 text-[8px] text-slate-600 uppercase tracking-wider">
          <span>Seguro</span>
          <span className="w-0.5 h-0.5 bg-slate-700 rounded-full" />
          <span>v1.6.2</span>
        </div>

        {/* Dev Button */}
        <button 
          onClick={onToggleDevTools}
          className="absolute top-4 right-4 p-2 text-slate-700 hover:text-accent transition-colors"
        >
          <Terminal size={14} />
        </button>
      </motion.div>
    </div>
  );
};