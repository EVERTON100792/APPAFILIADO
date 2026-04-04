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
    <div className="min-h-screen w-full bg-[#0a0a0f] flex flex-col items-center justify-center p-5 relative overflow-hidden font-sans">
      
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#0a0a0f] to-[#0f172a]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[80px]" />
      </div>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[380px]"
      >
        {/* Logo Area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-4 shadow-lg shadow-cyan-500/25 ring-1 ring-white/10">
            <Zap size={26} className="text-white" />
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-white">
            VIRAL<span className="text-cyan-400">SQUAD</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium tracking-[0.2em] mt-2">
            AFFILIATE PRO
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800/60 rounded-3xl overflow-hidden shadow-2xl shadow-black/50">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900/80 to-slate-800/40 border-b border-slate-700/30 px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-300">
                24h de teste grátis liberado
              </span>
            </div>
          </div>

          {/* Form Area */}
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">
                {isLogin ? 'Olá, seja bem-vindo!' : 'Crie sua conta'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {isLogin ? 'Entre com seus dados para continuar' : 'Comece agora mesmo'}
              </p>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
                  <span className="text-xs text-red-300 leading-relaxed">{error}</span>
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3"
                >
                  <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs text-emerald-300 font-medium">Conta criada com sucesso!</span>
                    <p className="text-xs text-emerald-400/70 mt-0.5">Verifique seu e-mail para confirmar</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleAuth} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">E-mail</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Mail size={18} className="text-slate-500" />
                  </div>
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3.5 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800/80 transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Senha</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lock size={18} className="text-slate-500" />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3.5 pl-12 pr-12 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:bg-slate-800/80 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-sm py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isLogin ? 'ENTRAR' : 'CRIAR CONTA'}</span>
                    <LogIn size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Toggle */}
            <div className="mt-6 pt-4 border-t border-slate-700/30 text-center">
              <p className="text-sm text-slate-500">
                {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
                <button 
                  onClick={() => { setIsLogin(!isLogin); setError(null); setSuccess(false); }}
                  className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors"
                >
                  {isLogin ? 'Cadastre-se' : 'Entre aqui'}
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-center items-center gap-3 mt-6">
          <Shield size={12} className="text-slate-600" />
          <span className="text-[10px] text-slate-600 uppercase tracking-wider">Conexão segura</span>
          <span className="text-[10px] text-slate-700">•</span>
          <span className="text-[10px] text-slate-600">v1.6.2</span>
        </div>

        {/* Dev Tools */}
        <button 
          onClick={onToggleDevTools}
          className="absolute top-5 right-5 p-2 text-slate-600 hover:text-cyan-400"
        >
          <Terminal size={16} />
        </button>
      </motion.div>
    </div>
  );
};