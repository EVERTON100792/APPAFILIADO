import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, UserPlus, LogIn, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSuccess(data.user);
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // If auto-confirm is enabled, we might have a user
        if (data.user) {
          setSuccess(true);
          setTimeout(() => {
            onSuccess(data.user);
            onClose();
          }, 2000);
        } else {
          setError("Verifique seu e-mail para confirmar o cadastro!");
        }
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro na autenticação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden"
          >
            {/* Header / Info Bar */}
            <div className="bg-accent/10 border-b border-white/5 py-3 px-6 flex items-center gap-2">
              <Clock size={14} className="text-accent animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                Bônus SQUAD: 24h de uso liberado após o cadastro!
              </span>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                    {isLogin ? 'Acessar' : 'Criar Conta'} <span className="text-accent">SQUAD</span>
                  </h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {isLogin ? 'Entre para gerenciar sua operação' : 'Cadastre-se e comece seu teste grátis'}
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold animate-shake">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-500 text-xs font-bold">
                  <CheckCircle2 size={18} />
                  CADASTRO REALIZADO! REDIRECIONANDO...
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">E-mail Corporativo</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@dominio.com"
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Senha de Acesso</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-all font-medium"
                    />
                  </div>
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full btn-premium py-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-black uppercase tracking-[0.1em] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'AUTENTICAR AGORA' : 'INICIAR TESTE 24H'}
                      {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                    </>
                  )}
                </button>
              </form>

              <div className="text-center">
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-accent transition-colors"
                >
                  {isLogin ? 'Não tem conta? Registre-se já' : 'Já possui conta? Faça Login'}
                </button>
              </div>

              {/* Instructions for Trial */}
              {!isLogin && (
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 space-y-2">
                  <p className="text-[9px] text-slate-500 font-bold uppercase leading-relaxed text-center">
                    ⚠️ Ao se cadastrar, você ganha acesso total a todas as ferramentas por 24 horas. Após esse período, o sistema solicitará o upgrade para a versão PRO.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
