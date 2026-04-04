import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, AlertCircle, CheckCircle2, Shield, ArrowRight, Zap, Terminal, Eye, EyeOff, Sparkles, Rocket, Crown, Star } from 'lucide-react';

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

  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, size: number, delay: number}>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);
  }, []);

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
      
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[50%] -left-[50%] w-[200%] h-[200%] bg-gradient-to-br from-accent/20 via-purple-500/10 to-emerald-500/20 animate-spin-slow" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
        
        {/* Animated Grid */}
        <div className="absolute inset-0" style={{ 
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
        
        {/* Floating Particles */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-accent/30"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Glowing Orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-accent/20 rounded-full blur-[100px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/15 rounded-full blur-[80px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 5, repeat: Infinity }}
        />
      </div>

      {/* Main Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
            className="relative mb-4"
          >
            {/* Outer Ring */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-gradient-to-r from-accent via-purple-500 to-emerald-500"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              style={{ padding: '4px' }}
            >
              <div className="w-24 h-24 rounded-full bg-slate-950" />
            </motion.div>
            
            {/* Inner Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-slate-900/80 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                <Rocket size={36} className="text-accent" />
              </div>
            </div>
            
            {/* Sparkle Effects */}
            <motion.div 
              className="absolute -top-2 -right-2"
              animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles size={20} className="text-yellow-400" />
            </motion.div>
            <motion.div 
              className="absolute -bottom-1 -left-2"
              animate={{ scale: [1, 1.3, 1], rotate: [0, -15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            >
              <Star size={16} className="text-purple-400" />
            </motion.div>
          </motion.div>
          
          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-black italic tracking-tighter"
          >
            VIRAL<span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-purple-400 to-emerald-400">SQUAD</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs text-slate-400 font-bold uppercase tracking-[0.4em] mt-2 flex items-center gap-2"
          >
            <Crown size={12} className="text-yellow-500" />
            operação inteligente
          </motion.p>
        </div>

        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative group"
        >
          {/* Glow Effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-accent via-purple-500 to-emerald-500 rounded-[1.5rem] opacity-30 group-hover:opacity-50 transition-opacity blur-xl" />
          
          <div className="relative bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] overflow-hidden">
            
            {/* Top Bar */}
            <div className="bg-gradient-to-r from-accent/20 via-purple-500/10 to-emerald-500/20 border-b border-white/5 py-4 px-6 flex items-center justify-center gap-3">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Zap size={16} className="text-yellow-400" />
              </motion.div>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">
                24H DE TESTE GRÁTIS
              </span>
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <Sparkles size={16} className="text-purple-400" />
              </motion.div>
            </div>

            <div className="p-6 space-y-5">
              {/* Header */}
              <div className="text-center">
                <h2 className="text-xl font-black italic uppercase tracking-tighter">
                  {isLogin ? 'Bem-vindo de volta!' : 'Criar nova conta'}
                </h2>
                <p className="text-[10px] text-slate-500 mt-1">
                  {isLogin ? 'Entre com suas credenciais' : 'Junte-se à operação'}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, scale: 0.9 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.9 }}
                    className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-center gap-3 text-red-400 text-[10px] font-bold"
                  >
                    <AlertCircle size={16} className="shrink-0" />
                    <p>{error}</p>
                  </motion.div>
                )}

                {success && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, scale: 0.9 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-3 text-emerald-400 text-[10px] font-bold"
                  >
                    <CheckCircle2 size={16} className="shrink-0" />
                    <div>
                      <p className="font-black">CADASTRO REALIZADO!</p>
                      <p className="font-normal opacity-70">Verifique seu e-mail para confirmar</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleAuth} className="space-y-4">
                {/* Email Input */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={18} />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Seu melhor e-mail"
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-xs focus:outline-none focus:border-accent/50 focus:bg-slate-950 transition-all font-medium text-white placeholder:text-slate-600"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity" />
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-accent transition-colors" size={18} />
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Sua senha"
                      className="w-full bg-slate-950/80 border border-white/10 rounded-xl py-3.5 pl-12 pr-14 text-xs focus:outline-none focus:border-accent/50 focus:bg-slate-950 transition-all font-medium text-white placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-accent transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={loading}
                  type="submit"
                  className="w-full relative overflow-hidden rounded-xl py-4 flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.15em] transition-all disabled:opacity-50"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-accent via-purple-500 to-emerald-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-accent via-purple-500 to-emerald-500 opacity-0 hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-white/20 blur-xl" />
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        {isLogin ? 'ENTRAR' : 'CRIAR CONTA'}
                        {isLogin ? <LogIn size={16} /> : <ArrowRight size={16} />}
                      </>
                    )}
                  </span>
                </motion.button>
              </form>

              {/* Toggle */}
              <div className="text-center pt-2 border-t border-white/5">
                <button 
                  onClick={() => { setIsLogin(!isLogin); setError(null); setSuccess(false); }}
                  className="text-[11px] font-bold text-slate-400 hover:text-accent transition-colors"
                >
                  {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
                  <span className="text-accent font-black">{isLogin ? 'Criar agora' : 'Entrar'}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center items-center gap-6 mt-6 text-[9px] font-bold uppercase tracking-widest text-slate-600"
        >
          <span className="flex items-center gap-1">
            <Shield size={10} />
            HTTPS Seguro
          </span>
          <span className="w-1 h-1 bg-slate-700 rounded-full" />
          <span>v1.6.2</span>
          <span className="w-1 h-1 bg-slate-700 rounded-full" />
          <span className="flex items-center gap-1">
            <Star size={10} className="text-yellow-500" />
            SQUAD_OS
          </span>
        </motion.div>

        {/* Dev Tools Button */}
        <button 
          onClick={onToggleDevTools}
          className="absolute top-4 right-4 z-50 p-2 bg-white/5 border border-white/10 rounded-lg text-slate-700 hover:text-accent transition-all active:scale-95"
        >
          <Terminal size={14} />
        </button>
      </motion.div>
    </div>
  );
};