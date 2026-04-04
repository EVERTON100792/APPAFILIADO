import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, CheckCircle2, Shield, ArrowRight, Zap, Terminal, Eye, EyeOff } from 'lucide-react';

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
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
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
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-accent/5 blur-[120px] rounded-full -top-1/2 -left-1/2 animate-pulse pointer-events-none" />
      <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full -bottom-1/2 -right-1/2 animate-pulse pointer-events-none" />
      
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] pointer-events-none" />

      {/* Secret Dev Button */}
      <button 
        onClick={onToggleDevTools}
        className="absolute top-4 right-4 z-50 p-2 bg-white/5 border border-white/10 rounded-lg text-slate-700 hover:text-accent transition-all active:scale-95"
      >
        <Terminal size={14} />
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm flex flex-col gap-4"
      >
        <div className="flex flex-col items-center -mb-2">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-10 h-10 rounded-xl bg-slate-900 border-2 border-white/5 flex items-center justify-center shadow-2xl relative mb-2"
          >
            <Shield size={20} className="text-accent" />
          </motion.div>

          <div className="text-center">
            <h1 className="text-lg font-black italic uppercase tracking-tighter leading-none">
              VIRAL<span className="text-accent">SQUAD</span>
            </h1>
            <p className="text-[6px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-0.5">Operação Inteligente</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="tech-card border border-white/10 bg-slate-900/40 backdrop-blur-3xl rounded-[1.5rem] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
          {/* Trial Info */}
          <div className="bg-accent/10 border-b border-white/5 py-2 px-6 flex items-center justify-center gap-2">
            <Zap size={10} className="text-accent animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-wider text-accent italic">
              BÔNUS: 24H DE TESTE GRÁTIS ATIVADO!
            </span>
          </div>

          <div className="p-4 space-y-3">
            <div className="space-y-0.5">
              <h2 className="text-sm font-black italic uppercase tracking-tighter">
                {isLogin ? 'Iniciar ' : 'Criar '} <span className={isLogin ? 'text-white' : 'text-accent'}>{isLogin ? 'ACESSO' : 'CONTA'}</span>
              </h2>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 p-1.5 rounded-lg flex items-center gap-2 text-red-500 text-[8px] font-bold"
                >
                  <AlertCircle size={10} className="shrink-0" />
                  <p>{error}</p>
                </motion.div>
              )}

              {success && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-emerald-500/10 border border-emerald-500/20 p-1.5 rounded-lg flex items-center gap-2 text-emerald-500 text-[8px] font-bold"
                >
                  <CheckCircle2 size={10} className="shrink-0" />
                  CADASTRO OK! VERIFIQUE SEU E-MAIL.
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleAuth} className="space-y-3">
              <div className="space-y-1">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-accent transition-colors" size={12} />
                  <input 
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail"
                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-[10px] focus:outline-none focus:border-accent/30 focus:bg-slate-950 transition-all font-medium text-white placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-accent transition-colors" size={12} />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha"
                    className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-2.5 pl-10 pr-11 text-[10px] focus:outline-none focus:border-accent/30 focus:bg-slate-950 transition-all font-medium text-white placeholder:text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-accent transition-colors"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={loading}
                type="submit"
                className="w-full btn-premium py-3 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-lg"
              >
                {loading ? (
                  <div className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'ENTRAR AGORA' : 'ATIVAR ACESSO'}
                    {isLogin ? <LogIn size={12} /> : <ArrowRight size={12} className="text-slate-950" />}
                  </>
                )}
              </motion.button>
            </form>

            <div className="text-center pt-1 border-t border-white/5">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-[8px] font-black uppercase tracking-widest text-slate-600 hover:text-accent transition-colors py-2"
              >
                {isLogin ? 'Novo por aqui? Criar conta' : 'Já tem conta? Entrar'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer info - Low Profile */}
        <div className="flex justify-between px-2 opacity-30 text-[7px] font-bold uppercase tracking-widest">
           <span>Segurança HTTPS</span>
           <span>v1.6.2</span>
           <span>SQUAD_OS</span>
        </div>
      </motion.div>
    </div>
  );
};
