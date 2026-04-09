import React, { useState } from 'react';
import { TikTokConnectionIndicator } from './TikTokConnectionIndicator';
import { supabase } from '../supabaseClient';
import { UploadCloud, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TikTokPublisherProps {
  userId: string | undefined;
  videoUrl: string | null;
  caption: string;
  isPro: boolean;
  onSuccess?: () => void;
}

export const TikTokPublisher: React.FC<TikTokPublisherProps> = ({ userId, videoUrl, caption, isPro, onSuccess }) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [status, setStatus] = useState<{type: 'idle' | 'success' | 'error', msg: string}>({ type: 'idle', msg: '' });

  const handlePublishNow = async () => {
    if (!videoUrl) return;
    setIsPublishing(true);
    setStatus({ type: 'idle', msg: '' });

    try {
      const { data, error } = await supabase.functions.invoke('tiktok-publish', {
        body: { video_url: videoUrl, caption: caption }
      });

      if (error || (data && data.error)) {
        throw new Error(data?.error || error?.message || "Failed to publish");
      }

      setStatus({ type: 'success', msg: 'Vídeo enviado para publicação no TikTok!' });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (!videoUrl || !scheduleDate) {
      setStatus({ type: 'error', msg: 'Escolha uma data e o vídeo precisa estar pronto.' });
      return;
    }
    
    if (!isPro) {
       setStatus({ type: 'error', msg: 'O Agendamento Profissional é exclusivo para usuários PRO.'});
       return;
    }

    setIsPublishing(true);
    setStatus({ type: 'idle', msg: '' });

    try {
      const { error } = await supabase.from('scheduled_posts').insert({
        user_id: userId,
        video_url: videoUrl,
        caption: caption,
        scheduled_at: new Date(scheduleDate).toISOString(),
        status: 'pending'
      });

      if (error) throw error;

      setStatus({ type: 'success', msg: 'Vídeo agendado com sucesso!' });
      setScheduleDate('');
      setIsScheduling(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-700 p-6 flex flex-col gap-4 rounded-3xl glow-subtle">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-2">
            Upload Center
          </h3>
          <p className="text-xs text-slate-400 mt-1">Conecte sua conta e faça envios automáticos para a plataforma.</p>
        </div>
        <TikTokConnectionIndicator userId={userId} />
      </div>

      <div className="pt-2 border-t border-slate-800">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Ações de Voo</label>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* POST NOW */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePublishNow}
            disabled={isPublishing || !videoUrl}
            className={`flex-1 flex justify-center items-center gap-2 px-6 py-3 rounded-2xl font-bold uppercase text-xs tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed
              ${status.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl hover:shadow-indigo-500/30'}`}
          >
            {isPublishing && !isScheduling ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            Postar Agora (TikTok)
          </motion.button>

          {/* SCHEDULE */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsScheduling(!isScheduling)}
            disabled={isPublishing}
            className="flex-1 flex justify-center items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-2xl font-bold uppercase text-xs tracking-wider text-slate-200 border border-slate-600 transition-all"
          >
            <Clock size={16} />
            {isPro ? "Agendar" : "Agendar (PRO)"}
          </motion.button>
        </div>
      </div>

      {/* SCHEDULE EXPANDABLE PANEL */}
      <AnimatePresence>
        {isScheduling && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-slate-950 p-4 rounded-2xl border border-dashed border-slate-700 mt-2 flex flex-col gap-3">
              <label className="text-xs font-bold text-slate-300">Selecione o Horário:</label>
              <input 
                type="datetime-local" 
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSchedule}
                disabled={isPublishing || !scheduleDate}
                className="w-full flex justify-center items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold uppercase text-xs tracking-wider text-white shadow-xl transition-all disabled:opacity-50"
              >
                {isPublishing && isScheduling ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Confirmar Agendamento
              </motion.button>
              
              {!isPro && (
                <p className="text-[10px] text-amber-500 text-center font-bold">
                  ⚠️ É necessário assinar o plano SQUAD PRO para agendar envios.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STATUS MESSAGES */}
      <AnimatePresence>
        {status.msg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-lg border flex items-center gap-2 text-xs font-bold ${
              status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {status.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
