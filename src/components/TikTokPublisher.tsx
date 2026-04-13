import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UploadCloud, Clock, CheckCircle2, AlertCircle, Loader2, Download, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TikTokPublisherProps {
  userId: string | undefined;
  videoUrl: string | null;
  caption: string;
  isPro: boolean;
  onSuccess?: () => void;
  productLink?: string;
  isAutoralVideo?: boolean;
}

export const TikTokPublisher: React.FC<TikTokPublisherProps> = ({ userId, videoUrl, caption, isPro, onSuccess, productLink, isAutoralVideo }) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [status, setStatus] = useState<{type: 'idle' | 'success' | 'error', msg: string}>({ type: 'idle', msg: '' });
  const [publishTarget, setPublishTarget] = useState<'tiktok' | 'shopee' | null>(null);

  // Gerar legenda otimizada para vendas (máx 150 caracteres)
  const generateShopeeCaption = () => {
    const productName = caption.split('\n')[0] || "Produto";
    const priceMatch = caption.match(/R\$[\s\d,]+/);
    const price = priceMatch ? priceMatch[0] : "";
    
    // Criar legenda curta e direta para vendas
    const shortCaption = `${productName} ${price}\n🔗 Clique no link da bio!\n\n#shopee #achadinhos #promo #oferta #viral #brasil`;
    
    // Limitar a 150 caracteres
    return shortCaption.length > 150 ? shortCaption.substring(0, 147) + "..." : shortCaption;
  };

  // Download do vídeo
  const downloadVideo = async () => {
    if (!videoUrl) return null;
    
    try {
      if (videoUrl.startsWith('blob:')) {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = isAutoralVideo ? 'video-autoral.mp4' : 'video-viral.mp4';
        a.click();
        URL.revokeObjectURL(blobUrl);
        return true;
      } else if (videoUrl.startsWith('http')) {
        window.open(videoUrl, '_blank');
        return true;
      }
    } catch (err) {
      console.error("Erro ao baixar:", err);
    }
    return false;
  };

  // Abrir TikTok
  const openTikTok = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      // Tentar abrir app do TikTok
      window.location.href = 'tiktok://';
      setTimeout(() => {
        window.location.href = 'https://www.tiktok.com/tiktokstudio/upload?from=webapp';
      }, 1500);
    } else {
      window.open('https://www.tiktok.com/tiktokstudio/upload?from=webapp', '_blank');
    }
  };

  // Abrir Shopee Videos
  const openShopeeVideos = () => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      // Tentar abrir app Shopee
      window.location.href = 'shopee://';
      setTimeout(() => {
        window.location.href = 'https://shopee.com.br/videos';
      }, 1500);
    } else {
      window.open('https://shopee.com.br/videos', '_blank');
    }
  };

  const handlePublishToTikTok = async () => {
    if (!videoUrl) return;
    setIsPublishing(true);
    setPublishTarget('tiktok');
    setStatus({ type: 'idle', msg: '' });

    try {
      // Copiar legenda completa do TikTok
      try {
        await navigator.clipboard.writeText(caption);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = caption;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      
      // Abrir TikTok
      openTikTok();

      setStatus({ type: 'success', msg: '✅ Legenda copiada! TikTok aberto! Agora poste o vídeo que já foi baixado.' });
      if (onSuccess) setTimeout(onSuccess, 3000);
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setIsPublishing(false);
      setPublishTarget(null);
    }
  };

  const handlePublishToShopee = async () => {
    if (!videoUrl) return;
    setIsPublishing(true);
    setPublishTarget('shopee');
    setStatus({ type: 'idle', msg: '' });

    try {
      // Gerar legenda otimizada para vendas (150 chars máx)
      const shopeeCaption = generateShopeeCaption();
      
      // Copiar legenda reduzida
      try {
        await navigator.clipboard.writeText(shopeeCaption);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = shopeeCaption;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      
      // Abrir Shopee Videos
      openShopeeVideos();

      setStatus({ type: 'success', msg: '✅ Legenda copiada! Shopee aberto! Agora poste o vídeo que já foi baixado.' });
      if (onSuccess) setTimeout(onSuccess, 3000);
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message });
    } finally {
      setIsPublishing(false);
      setPublishTarget(null);
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
            📤 Como Postar
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {isAutoralVideo 
              ? "Vídeo já foi baixado! Copie a legenda e poste." 
              : "Vídeo já baixado! See instructions below:"}
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">
          Publicar em
        </label>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {/* TIKTOK */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePublishToTikTok}
            disabled={isPublishing || !videoUrl}
            className={`flex-1 flex justify-center items-center gap-2 px-6 py-4 rounded-2xl font-bold uppercase text-xs tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed
              ${publishTarget === 'tiktok' ? 'bg-pink-500/20 border border-pink-500 text-pink-400' : 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-xl hover:shadow-pink-500/30'}`}
          >
            {isPublishing && publishTarget === 'tiktok' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Video size={16} />
            )}
            TikTok
          </motion.button>

          {/* SHOPEE VIDEOS */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePublishToShopee}
            disabled={isPublishing || !videoUrl}
            className={`flex-1 flex justify-center items-center gap-2 px-6 py-4 rounded-2xl font-bold uppercase text-xs tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed
              ${publishTarget === 'shopee' ? 'bg-orange-500/20 border border-orange-500 text-orange-400' : 'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-xl hover:shadow-orange-500/30'}`}
          >
            {isPublishing && publishTarget === 'shopee' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Video size={16} />
            )}
            Shopee Videos
          </motion.button>
        </div>
        
        <p className="text-[9px] text-slate-500 mt-2 text-center">
          TikTok: legenda completa | Shopee: legenda otimizada para vendas (150 caracteres)
        </p>
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
