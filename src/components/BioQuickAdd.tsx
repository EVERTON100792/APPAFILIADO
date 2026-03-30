import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Link, Check, RefreshCcw, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface Props {
  product: {
    title?: string;
    image?: string;
    image_url?: string;
    shopee_url?: string;
    url?: string;
    affiliate_link?: string;
  };
  onAdded?: () => void;
}

export const BioQuickAdd: React.FC<Props> = ({ product, onAdded }) => {
  const storeSlug = localStorage.getItem('bio_store_slug') || 'default_user';

  const defaultTitle = product.title
    ? product.title.replace(/[^a-zA-ZÀ-ÿ0-9 !?]/g, '').trim().slice(0, 80)
    : '';
  const defaultImage = product.image || product.image_url || '';
  const defaultLink  = product.affiliate_link || product.shopee_url || product.url || '';

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [imageUrl, setImageUrl] = useState(defaultImage);
  const [link, setLink] = useState(defaultLink);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !link) return;
    setSaving(true);
    const { error } = await supabase.from('bio_store').insert({
      user_id: storeSlug,
      title,
      image_url: imageUrl,
      affiliate_link: link
    });
    setSaving(false);
    if (!error) {
      setDone(true);
      onAdded?.();
      setTimeout(() => setDone(false), 4000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 via-[#0d1f1a] to-[#0a0f12] overflow-hidden"
    >
      {/* Header — clicável para expandir/colapsar */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <ShoppingBag size={16} className="text-accent" />
          <span className="text-[11px] font-black uppercase tracking-widest text-white">
            Publicar na Loja Bio
          </span>
          {done && (
            <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              ✓ Publicado!
            </span>
          )}
        </div>
        {open
          ? <ChevronUp size={16} className="text-accent" />
          : <ChevronDown size={16} className="text-accent/60" />
        }
      </button>

      {/* Formulário expansível */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <form onSubmit={handlePublish} className="px-4 pb-4 space-y-3">

              {/* Preview miniatura + slug */}
              <div className="flex items-center gap-3 bg-black/30 rounded-xl p-2.5 mb-1">
                {imageUrl
                  ? <img src={imageUrl} className="w-12 h-12 rounded-lg object-cover border border-white/10" onError={() => setImageUrl('')} />
                  : <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center"><ShoppingBag size={18} className="text-white/20" /></div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Loja: /?loja={storeSlug}</p>
                  <p className="text-[11px] text-white/70 leading-snug line-clamp-2 mt-0.5">{title || 'Título do produto'}</p>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="text-[9px] uppercase font-black tracking-widest text-slate-500 mb-1 block">
                  Título Chamativo
                </label>
                <textarea
                  required value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Título do produto para a vitrine..."
                  className="w-full bg-[#080808] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-accent/50 resize-none h-16 transition-colors"
                />
              </div>

              {/* URL da Foto */}
              <div>
                <label className="text-[9px] uppercase font-black tracking-widest text-slate-500 mb-1 block">
                  URL da Foto
                </label>
                <input
                  type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
                  placeholder="https://cf.shopee.com.br/..."
                  className="w-full bg-[#080808] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              {/* Link de Afiliado */}
              <div>
                <label className="text-[9px] uppercase font-black tracking-widest text-slate-500 mb-1 flex items-center gap-1.5">
                  <Link size={10} /> Link de Afiliado Shopee
                </label>
                <input
                  type="url" required value={link} onChange={e => setLink(e.target.value)}
                  placeholder="https://shope.ee/..."
                  className="w-full bg-[#080808] border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-accent/50 transition-colors"
                />
                {!link && (
                  <p className="text-[9px] text-amber-400/70 mt-1 flex items-center gap-1">
                    ⚠ Cole aqui o link de afiliado gerado na Central Shopee
                  </p>
                )}
              </div>

              <button
                type="submit" disabled={saving || done}
                className="w-full py-3 bg-accent hover:bg-accent/90 disabled:opacity-50 text-slate-900 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
              >
                {saving
                  ? <><RefreshCcw size={14} className="animate-spin" /> Publicando...</>
                  : done
                  ? <><Check size={14} /> Publicado com Sucesso!</>
                  : <><Zap size={14} /> Publicar na Vitrine Agora</>
                }
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
