import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Link, Image as ImageIcon, Type, Copy, Check,
  MousePointerClick, RefreshCcw, AtSign, Bell, Zap, ExternalLink, ShoppingBag, Globe
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
  let toastCounter = 0;

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

  const handleDelete = async (id: string) => {
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
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-10">

      {/* Toast Container */}
      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[300] flex flex-col gap-2 items-center pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className={`${toastColors[t.type]} px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm tracking-wide flex items-center gap-2 min-w-[240px] justify-center`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header Panel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-5 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <MousePointerClick className="text-accent" /> Loja Link na Bio
          </h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">{items.length} produtos ativos</span>
          </div>
        </div>

        {/* URL Personalizada */}
        <div className="bg-[#080808] border border-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Globe size={14} className="text-accent" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seu Link Personalizado</span>
          </div>

          {editingSlug ? (
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm font-mono">/?loja=</span>
              <input
                type="text"
                value={slugInput}
                onChange={e => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                placeholder="seu-nome-aqui"
                className="flex-1 bg-[#0a0a0a] border border-accent/40 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-accent"
                onKeyDown={e => e.key === 'Enter' && handleSaveSlug()}
                autoFocus
              />
              <button onClick={handleSaveSlug} className="px-4 py-2 bg-accent text-black rounded-xl text-xs font-black hover:bg-accent/80 transition-colors">
                SALVAR
              </button>
              <button onClick={() => setEditingSlug(false)} className="px-3 py-2 border border-white/10 rounded-xl text-xs text-white/50 hover:text-white transition-colors">
                ✕
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <AtSign size={12} className="text-slate-500" />
                <span className="text-white font-mono font-bold text-sm">{storeSlug}</span>
                <button onClick={() => { setSlugInput(storeSlug); setEditingSlug(true); }} className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-accent/20 text-white/30 hover:text-accent transition-all text-[10px] font-black uppercase">
                  editar
                </button>
              </div>

              <button
                onClick={copyBioLink}
                className="flex items-center gap-2 px-4 py-2 bg-accent/10 hover:bg-accent text-accent hover:text-black border border-accent/20 rounded-xl text-xs font-black uppercase tracking-wider transition-all group"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado!' : 'Copiar Link'}
              </button>
            </div>
          )}
          <p className="text-[10px] text-slate-600 font-mono">{window.location.origin}/?loja={storeSlug}</p>
        </div>

        {/* Dica */}
        <div className="flex items-start gap-3 bg-accent/5 border border-accent/15 rounded-xl p-3">
          <Bell size={14} className="text-accent shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Cole o link acima na sua <strong className="text-white">Bio do TikTok / Instagram</strong>. Seus seguidores verão só a vitrine bonita — sem nenhum painel interno!
          </p>
        </div>
      </motion.div>

      {/* Grid: Form + List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Form Panel */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-5 sticky top-6 space-y-4"
          >
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Plus className="text-accent" size={16} /> Adicionar Produto
            </h3>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5 block">Link de Afiliado</label>
                <div className="relative">
                  <Link size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="url" required placeholder="https://shope.ee/..." value={link} onChange={e => setLink(e.target.value)}
                    className="w-full bg-[#080808] border border-white/10 rounded-xl py-2.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-accent/60 transition-colors" />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5 block">URL da Foto do Produto</label>
                <div className="relative">
                  <ImageIcon size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="url" required placeholder="https://cf.shopee.com.br/..." value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                    className="w-full bg-[#080808] border border-white/10 rounded-xl py-2.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-accent/60 transition-colors" />
                </div>
                {imageUrl && (
                  <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-accent/20 mx-auto bg-[#080808]">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={() => { setImageUrl(''); showToast('URL de imagem inválida!', 'error'); }} />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1.5 block">Título Chamativo</label>
                <div className="relative">
                  <Type size={12} className="absolute left-3 top-2.5 text-slate-500" />
                  <textarea required placeholder="Ex: Ring Light Pro com Tripé 2m! 🔥" value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full bg-[#080808] border border-white/10 rounded-xl py-2.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-accent/60 transition-colors resize-none h-20" />
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white rounded-xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-60 flex justify-center items-center gap-2 mt-3 shadow-lg shadow-emerald-500/30">
                {saving ? <RefreshCcw className="animate-spin" size={16} /> : <ShoppingBag size={16} />}
                {saving ? 'Publicando...' : '🚀 Publicar na Vitrine'}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Products List Panel */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Produtos na Vitrine</h3>
            <button onClick={() => { fetchItems(); showToast('Vitrine atualizada!', 'info'); }}
              className="p-2 text-slate-500 hover:text-accent rounded-lg hover:bg-white/5 transition-all" title="Atualizar lista">
              <RefreshCcw size={14} />
            </button>
          </div>

          {loading ? (
            <div className="glass-panel p-10 flex flex-col items-center justify-center text-slate-500">
              <RefreshCcw className="animate-spin text-accent mb-3" size={28} />
              <p className="text-xs font-bold tracking-widest uppercase">Carregando...</p>
            </div>
          ) : items.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-panel p-10 flex flex-col items-center justify-center text-slate-600 border-dashed border-2 border-white/5">
              <ShoppingBag size={40} className="mb-3 opacity-20" />
              <p className="text-sm font-bold">Vitrine vazia!</p>
              <p className="text-xs opacity-50 mt-1">Adicione produtos pelo formulário ao lado.</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div key={item.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-panel p-3 flex items-center gap-3 group hover:border-white/10 transition-colors">
                  <img src={item.image_url} alt={item.title} className="w-14 h-14 rounded-lg object-cover bg-black/50 border border-white/5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-bold text-xs leading-snug line-clamp-2 mb-1">{item.title}</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-emerald-400 text-[9px] font-black uppercase tracking-widest">Ativo</span>
                      <a href={item.affiliate_link} target="_blank" rel="noopener noreferrer"
                        className="text-accent/50 hover:text-accent text-[9px] underline truncate max-w-[120px] transition-colors flex items-center gap-0.5">
                        <ExternalLink size={8} /> ver link
                      </a>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(item.id)}
                    className="p-2.5 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                    title="Remover da Vitrine">
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}

          {items.length > 0 && (
            <motion.a
              href={`/?loja=${storeSlug}`} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 py-3 mt-2 border border-accent/20 rounded-xl text-accent text-xs font-black uppercase tracking-widest hover:bg-accent/10 transition-all"
            >
              <Zap size={14} /> Visualizar minha Loja
            </motion.a>
          )}
        </div>
      </div>
    </div>
  );
};
