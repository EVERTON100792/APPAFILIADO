import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Link, Image as ImageIcon, Type, Copy, Check,
  MousePointerClick, RefreshCcw, AtSign, Zap, ExternalLink, ShoppingBag, Globe,
  ShieldCheck, Lightbulb, Upload, Loader2
} from 'lucide-react';
import { supabase } from '../supabaseClient';

interface BioItem {
  id: string;
  title: string;
  image_url: string;
  affiliate_link: string;
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

const PRO_TIPS = [
  "💡 Títulos curtos e com emojis aumentam os cliques em 25%.",
  "⚡ Links da Shopee gerados na Central do Afiliado garantem 100% da comissão.",
  "📸 Use fotos com fundo limpo para sua vitrine parecer mais profissional.",
  "🔥 O link personalizado 'meusachadinhos' é o que mais converte no TikTok."
];

export const BioManager: React.FC<{ defaultUserId?: string }> = ({ defaultUserId = 'default_user' }) => {
  const [items, setItems] = useState<BioItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('');

  // URL Slug personalizado
  const [storeSlug, setStoreSlug] = useState(() => {
    return localStorage.getItem('bio_store_slug') || defaultUserId;
  });
  const [slugInput, setSlugInput] = useState(storeSlug);
  const [editingSlug, setEditingSlug] = useState(false);

  // UI State
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeTip, setActiveTip] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  let toastCounter = 0;

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setActiveTip(prev => (prev + 1) % PRO_TIPS.length);
    }, 8000);
    return () => clearInterval(tipInterval);
  }, []);

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = ++toastCounter + Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('bio_store')
      .select('*').eq('user_id', storeSlug)
      .order('created_at', { ascending: false });
    if (error) showToast('Erro ao carregar produtos', 'error');
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [storeSlug]);

  const handleSaveSlug = () => {
    const clean = slugInput.toLowerCase().replace(/[^a-z0-9-_]/g, '').trim();
    if (!clean) {
      showToast('URL inválida! Use apenas letras, números ou hífens.', 'error');
      return;
    }
    localStorage.setItem('bio_store_slug', clean);
    setStoreSlug(clean);
    setEditingSlug(false);
    showToast(`✅ Link atualizado para: /?loja=${clean}`, 'success');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl || !link) {
      showToast('⚠️ Preencha todos os campos!', 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('bio_store').insert({
      user_id: storeSlug,
      title,
      image_url: imageUrl,
      affiliate_link: link
    });
    setSaving(false);
    if (!error) {
      setTitle('');
      setImageUrl('');
      setLink('');
      fetchItems();
      showToast('🛍️ Produto publicado na sua loja!', 'success');
    } else {
      showToast('❌ Erro ao publicar. Tente novamente.', 'error');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Imagem muito grande! Máximo 5MB.', 'error');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${storeSlug}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      showToast('📸 Imagem enviada com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro no upload:', error);
      showToast('Erro ao enviar imagem. Verifique as permissões de Storage.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este produto da sua vitrine?')) return;

    const { error } = await supabase.from('bio_store').delete().eq('id', id);
    if (!error) {
      fetchItems();
      showToast('🗑️ Produto removido da loja.', 'info');
    } else {
      showToast('Erro ao remover produto.', 'error');
    }
  };

  const copyBioLink = () => {
    const url = `${window.location.origin}/?loja=${storeSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showToast('📋 Link da loja copiado!', 'success');
  };

  const toastColors: Record<Toast['type'], string> = {
    success: 'bg-emerald-500 text-white border border-emerald-300/40',
    error:   'bg-red-600 text-white border border-red-400/40',
    info:    'bg-sky-600 text-white border border-sky-400/40'
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-20 relative">
      <div className="noise-overlay" />

      {/* Toast Container */}
      <div className="fixed top-6 right-6 z-[300] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className={`${toastColors[t.type]} px-6 py-4 rounded-2xl shadow-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 backdrop-blur-md`}
            >
              {t.type === 'success' && <ShieldCheck size={16} />}
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header Panel - Glass Acid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="glass-acid p-8 flex flex-col gap-6 relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-[80px]" />
        
        <div className="flex items-center justify-between flex-wrap gap-6 relative z-10">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter">
              <MousePointerClick className="text-emerald-500" size={32} /> LOJA LINK NA <span className="text-emerald-500 italic">BIO</span>
            </h2>
            <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.4em]">Dashboard de Afiliados Pro</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                <span className="text-emerald-400 text-[11px] font-black uppercase tracking-widest">{items.length} ITENS</span>
             </div>
             <motion.a 
                href={`/?loja=${storeSlug}`} target="_blank"
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="bg-white/5 border border-white/10 hover:border-emerald-500/50 p-3 rounded-2xl transition-all group"
             >
                <ExternalLink size={18} className="text-slate-400 group-hover:text-emerald-400" />
             </motion.a>
          </div>
        </div>

        {/* URL Personalizada - UI Estilo Verified */}
        <div className="bg-black/40 border border-white/5 rounded-[2rem] p-6 space-y-5 relative">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Domínio da sua Vitrine</span>
          </div>

          {editingSlug ? (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 relative">
                <AtSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                <input
                  type="text"
                  value={slugInput}
                  onChange={e => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                  placeholder="ex: meus-achadinhos"
                  className="w-full bg-[#0a0a0a] border-2 border-emerald-500/50 rounded-2xl pl-10 pr-4 py-4 text-white font-mono font-bold focus:outline-none focus:border-emerald-500 transition-all text-sm"
                  onKeyDown={e => e.key === 'Enter' && handleSaveSlug()}
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleSaveSlug} className="flex-1 sm:flex-none px-8 py-4 bg-emerald-500 text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20">
                  SALVAR
                </button>
                <button onClick={() => setEditingSlug(false)} className="px-5 py-4 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-colors">
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase rounded-md border border-emerald-500/20">VIVO</span>
                  <span className="text-white font-mono font-black text-xl tracking-tight">@{storeSlug}</span>
                </div>
                <p className="text-[11px] text-slate-600 font-mono mt-1">{window.location.origin}/?loja={storeSlug}</p>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => { setSlugInput(storeSlug); setEditingSlug(true); }} className="px-4 py-2 border border-white/10 hover:border-emerald-500/40 rounded-xl text-slate-400 hover:text-emerald-400 transition-all text-[10px] font-black uppercase tracking-widest">
                  Personalizar URL
                </button>
                <button
                  onClick={copyBioLink}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all group shadow-xl shadow-emerald-500/10"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'COPIADO' : 'COPIAR LINK'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pro-Tips Cycle */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTip}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-4 transition-all hover:bg-white/10"
          >
            <Lightbulb size={20} className="text-amber-400 shrink-0" />
            <p className="text-[12px] text-slate-300 font-medium italic select-none">
              {PRO_TIPS[activeTip]}
            </p>
            <div className="ml-auto flex gap-1">
               {PRO_TIPS.map((_, i) => (
                 <div key={i} className={`w-1 h-1 rounded-full ${i === activeTip ? 'bg-emerald-400 w-3' : 'bg-white/10'} transition-all`} />
               ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Grid: Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">

        {/* Form Panel - Mais largo (4 cols) */}
        <div className="lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
            className="glass-acid p-8 sticky top-20 space-y-8"
          >
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Plus className="text-emerald-500" size={24} /> NOVO ITEM
              </h3>
              <p className="text-[9px] uppercase font-black tracking-widest text-slate-500">Adicione produtos selecionados via Apps</p>
            </div>

            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-emerald-500/70 ml-1">Link Afiliado <span className="text-slate-600">(Shopee)</span></label>
                <div className="relative group">
                  <Link size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input type="url" required placeholder="https://shope.ee/..." value={link} onChange={e => setLink(e.target.value)}
                    className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[13px] text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-emerald-500/70 ml-1">Thumbnail Preview</label>
                <div className="relative group">
                  <ImageIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input type="url" required placeholder="URL da foto do produto..." value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                    className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[13px] text-white focus:outline-none focus:border-emerald-500/50 transition-all font-medium" />
                </div>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 hover:border-emerald-500/40 rounded-xl text-slate-400 hover:text-emerald-400 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploading ? 'ENVIANDO...' : 'ANEXAR IMAGEM'}
                  </button>
                </div>
                <AnimatePresence>
                  {imageUrl && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                      className="mt-4 aspect-square rounded-3xl overflow-hidden border-2 border-emerald-500/20 shadow-2xl bg-black relative group"
                    >
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={() => { setImageUrl(''); showToast('URL de imagem inválida!', 'error'); }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-emerald-500/70 ml-1">Nome do Produto</label>
                <div className="relative group">
                  <Type size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <input type="text" required placeholder="Ex: Ring Light Pro 2 metros + Tripé 🔥" value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-4 pl-12 pr-4 text-[13px] text-white focus:outline-none focus:border-emerald-500/50 transition-all font-bold" />
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-black rounded-3xl text-sm font-black uppercase tracking-[0.2em] transition-all disabled:opacity-60 flex justify-center items-center gap-3 mt-4 shadow-[0_20px_40px_rgba(16,185,129,0.2)]">
                {saving ? <RefreshCcw className="animate-spin" size={20} /> : <Zap size={20} fill="currentColor" />}
                {saving ? 'PROCESSANDO...' : 'PUBLICAR AGORA'}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Products List Panel - 7 cols */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col">
              <h3 className="text-xl font-black uppercase tracking-tighter text-white italic">Vitrine <span className="text-emerald-500">Atual</span></h3>
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-600">Gestão de estoque digital</span>
            </div>
            <button onClick={() => { fetchItems(); showToast('Vitrine atualizada!', 'info'); }}
              className="w-10 h-10 flex items-center justify-center bg-white/5 text-slate-500 hover:text-emerald-400 rounded-2xl hover:bg-emerald-500/10 border border-white/5 transition-all" title="Atualizar lista">
              <RefreshCcw size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {loading ? (
              <div className="glass-acid p-20 flex flex-col items-center justify-center text-slate-600 border-dashed">
                <RefreshCcw className="animate-spin text-emerald-500 mb-4" size={40} />
                <p className="text-[10px] font-black tracking-[0.3em] uppercase">Sincronizando Banco...</p>
              </div>
            ) : items.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-acid p-20 flex flex-col items-center justify-center text-slate-700 border-dashed border-2 border-white/5 rounded-[3rem]">
                <ShoppingBag size={64} className="mb-4 opacity-10" />
                <p className="text-lg font-black uppercase tracking-tighter italic">Nenhum Achadinho</p>
                <p className="text-[10px] opacity-40 mt-1 uppercase tracking-widest">Sua vitrine está pedindo por produtos!</p>
              </motion.div>
            ) : (
              <AnimatePresence>
                {items.map((item, i) => (
                  <motion.div key={item.id}
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-acid p-4 flex items-center gap-5 group hover:border-emerald-500/30 transition-all duration-500 rounded-[2rem]">
                    
                    <div className="relative w-20 h-20 shrink-0">
                      <img src={item.image_url} alt={item.title} className="w-full h-full rounded-2xl object-cover bg-black/50 border border-white/5" />
                      <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                       <div className="flex items-center gap-2">
                         <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                         <span className="text-emerald-500 text-[9px] font-black uppercase tracking-widest">Online</span>
                       </div>
                       <h4 className="text-white font-bold text-sm leading-snug line-clamp-2 italic tracking-tight">{item.title}</h4>
                       <div className="flex items-center gap-3">
                         <a href={item.affiliate_link} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-emerald-500/10 rounded-lg text-slate-500 hover:text-emerald-400 text-[10px] uppercase font-black tracking-widest transition-all">
                           <ExternalLink size={10} /> Ver na Shopee
                         </a>
                       </div>
                    </div>

                    <button onClick={() => handleDelete(item.id)}
                      className="w-12 h-12 flex items-center justify-center text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-2xl transition-all shrink-0 mr-2 bg-red-500/5 border border-red-500/10"
                      title="Excluir produto">
                      <Trash2 size={20} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
