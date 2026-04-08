import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Link, Image as ImageIcon, Type, Copy, Check,
  MousePointerClick, RefreshCcw, AtSign, Zap, ExternalLink, ShoppingBag, Globe,
  ShieldCheck, Lightbulb, Upload, Loader2, Palette, User, ArrowLeft, Share2, Sparkles
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import { generateViralProductName } from '../utils/viralNaming';

interface BioItem {
  id: string;
  title: string;
  image_url: string;
  affiliate_link: string;
  price?: string;
}

interface StoreSettings {
  theme_color: string;
  accent_color: string;
  bg_color: string;
  text_color: string;
  layout_type: string;
  font_style: string;
  header_style: string;
  show_watermark: boolean;
  card_radius: string;
  profile_image: string;
}

const defaultSettings: StoreSettings = {
  theme_color: '#10b981',
  accent_color: '#10b981',
  bg_color: '#050505',
  text_color: '#e2e8f0',
  layout_type: 'grid',
  font_style: 'sans',
  header_style: 'default',
  show_watermark: true,
  card_radius: '1.5rem',
  profile_image: '',
};

const colorPresets = [
  { name: 'Emerald', color: '#10b981' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Cyan', color: '#06b6d4' },
  { name: 'Gold', color: '#eab308' },
];

const layoutOptions = [
  { id: 'grid', name: 'Grid', icon: '⊞' },
  { id: 'list', name: 'Lista', icon: '☰' },
  { id: 'masonry', name: 'Masonry', icon: '▥' },
];

const fontOptions = [
  { id: 'sans', name: 'Moderna' },
  { id: 'mono', name: 'Tech' },
  { id: 'serif', name: 'Clássica' },
];

const headerOptions = [
  { id: 'default', name: 'Padrão' },
  { id: 'minimal', name: 'Minimalista' },
  { id: 'bold', name: 'Impacto' },
];

const PRO_TIPS = [
  "💡 Títulos curtos e com emojis aumentam os cliques em 25%.",
  "⚡ Links da Shopee gerados na Central do Afiliado garantem 100% da comissão.",
  "📸 Use fotos com fundo limpo para sua vitrine parecer mais profissional.",
  "🔥 O link personalizado 'meusachadinhos' é o que mais converte no TikTok."
];

const FALLBACK_THUMBNAIL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'%3E%3Crect width='160' height='160' rx='24' fill='%23070b16'/%3E%3Crect x='16' y='16' width='128' height='128' rx='22' fill='%2311172a' stroke='%2322c55e' stroke-opacity='.22'/%3E%3Cpath d='M54 102h52' stroke='%2322c55e' stroke-width='8' stroke-linecap='round'/%3E%3Cpath d='M80 52c-11 0-20 9-20 20v9h40v-9c0-11-9-20-20-20Z' fill='none' stroke='%23e5e7eb' stroke-width='8' stroke-linejoin='round'/%3E%3Ccircle cx='80' cy='81' r='6' fill='%2322c55e'/%3E%3C/svg%3E";

let toastCounter = 0;

export const BioManager: React.FC<{
  onProceed?: () => void;
  initialStoreSlug?: string;
  initialStoreReady?: boolean;
  onStoreConfigured?: (slug: string) => void;
  user?: any;
}> = ({ onProceed, initialStoreSlug = 'meu-link', initialStoreReady = false, onStoreConfigured, user }) => {
  const [items, setItems] = useState<BioItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('');
  const [price, setPrice] = useState('');

  const [storeSlug, setStoreSlug] = useState(() => initialStoreSlug || 'meu-link');
  const [slugInput, setSlugInput] = useState(storeSlug);
  const [editingSlug, setEditingSlug] = useState(false);

  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [activeTip, setActiveTip] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showCustomizer, setShowCustomizer] = useState(false);
  const [_settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [previewSettings, setPreviewSettings] = useState<StoreSettings>(defaultSettings);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const handleViralize = () => {
    if (!title) {
      showToast('Digite um nome primeiro!', 'info');
      return;
    }
    const viralName = generateViralProductName(title).toUpperCase();
    setTitle(viralName);
    showToast('✨ NOME VIRALIZADO!', 'success');
  };

    const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user?.id) {
      showToast('Erro: Usuário não autenticado', 'error');
      return;
    }
    setUploadingProfile(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(`profiles/${user.id}/${fileName}`, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(uploadData.path);
      updatePreview({ profile_image: publicUrl });
      showToast('Foto de perfil atualizada!', 'success');
    } catch (err: any) {
      console.error('Erro ao subir foto:', err);
      showToast('Erro ao subir foto: ' + (err?.message || 'Verifique o bucket storage'), 'error');
    } finally {
      setUploadingProfile(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = ++toastCounter + Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setActiveTip(prev => (prev + 1) % PRO_TIPS.length);
    }, 8000);
    return () => clearInterval(tipInterval);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [storeSlug]);

  useEffect(() => {
    setStoreSlug(initialStoreSlug || 'meu-link');
    setSlugInput(initialStoreSlug || 'meu-link');
  }, [initialStoreSlug]);

  useEffect(() => {
    if (user && user.user_metadata) loadSettings();
  }, [user]);

  const loadSettings = async () => {
    try {
      const meta = user?.user_metadata || {};
      if (meta?.store_settings) {
        setSettings(prev => ({ ...prev, ...meta.store_settings }));
        setPreviewSettings(prev => ({ ...prev, ...meta.store_settings }));
      }
    } catch (e) {
      console.warn('Erro ao carregar settings:', e);
    }
  };

  const updatePreview = (newSettings: Partial<StoreSettings>) => {
    setPreviewSettings(prev => ({ ...prev, ...newSettings }));
  };

  const saveSettings = async (newSettings: Partial<StoreSettings>) => {
    if (!user) return;
    setSavingSettings(true);
    try {
      const merged = { ...previewSettings, ...newSettings };
      const { error } = await supabase.auth.updateUser({
        data: { store_settings: merged }
      });
      if (error) throw error;
       
      setSettings(merged);
      setPreviewSettings(merged);
      showToast('✨ Personalização salva!');
    } catch (e: any) {
      console.error('Erro ao salvar settings:', e);
      showToast('Erro ao salvar personalização', 'error');
    } finally {
      setSavingSettings(false);
    }
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

  const handleSaveSlug = () => {
    const clean = slugInput.toLowerCase().replace(/[^a-z0-9-_]/g, '').trim();
    if (!clean) {
      showToast('URL inválida! Use apenas letras, números ou hífens.', 'error');
      return;
    }
    setSaving(true);
    try {
      setStoreSlug(clean);
      setSlugInput(clean);
      setEditingSlug(false);
      if (onStoreConfigured) {
        onStoreConfigured(clean);
      }
      showToast(`✅ Link atualizado para: /?loja=${clean}`, 'success');
    } catch (err: any) {
      showToast('Erro ao salvar: ' + (err?.message || 'Tente novamente'), 'error');
    } finally {
      setSaving(false);
    }
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
      affiliate_link: link,
      price: price
    });
    setSaving(false);
    if (!error) {
      setTitle('');
      setImageUrl('');
      setLink('');
      setPrice('');
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
      console.error('Erro no upload');
      showToast('Erro ao enviar imagem.', 'error');
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

  const handleShare = async (item: BioItem) => {
    const shareTitle = `🔥 ${item.title.toUpperCase()} 🔥`;
    const shareText = `Olha esse achadinho que encontrei! 😱\n\n✅ Qualidade Premium\n✅ Testado e Aprovado\n\n🛍️ COMPRE AQUI: ${item.affiliate_link}\n\nSiga meu perfil para mais achados! ✨`;

    if (navigator.share) {
      try {
        const response = await fetch(item.image_url);
        const blob = await response.blob();
        const file = new File([blob], 'produto.jpg', { type: 'image/jpeg' });

        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [file],
        });
      } catch (err) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: item.affiliate_link
          });
        } catch (shareErr) {
          console.error('Share failed', shareErr);
          const encodedText = encodeURIComponent(`${shareTitle}\n\n${shareText}`);
          window.open(`https://wa.me/?text=${encodedText}`, '_blank');
        }
      }
    } else {
      const encodedText = encodeURIComponent(`${shareTitle}\n\n${shareText}`);
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
    }
  };

  const copyBioLink = () => {
    const url = `${window.location.origin}/?loja=${storeSlug}`;
    const textarea = document.createElement('textarea');
    textarea.value = url;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showToast('📋 Link da loja copiado!', 'success');
  };

  const toastColors: Record<string, string> = {
    success: 'bg-emerald-500 text-white border border-emerald-300/40',
    error:   'bg-red-600 text-white border border-red-400/40',
    info:    'bg-sky-600 text-white border border-sky-400/40'
  };

  return (
    <div className={`w-full mx-auto pb-20 relative transition-all duration-500 ${showCustomizer && user ? 'max-w-7xl' : 'max-w-5xl'}`}>
      <div className="noise-overlay" />

      {/* Painel Fixo Lateral de Personalização */}
      <AnimatePresence>
        {showCustomizer && user && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowCustomizer(false)}
              className="fixed inset-0 bg-transparent z-[9998] lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: 400 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 400 }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
              style={{ 
                scrollbarWidth: 'thin', 
                scrollbarColor: '#22c55e33 transparent',
              }}
              className="fixed z-[9999] bg-[#0a0a0a] border-t border-white/10 shadow-2xl flex flex-col
                bottom-0 left-0 right-0 h-[65vh] rounded-t-[2.5rem]
                lg:top-12 lg:right-12 lg:bottom-12 lg:left-auto lg:w-[420px] lg:h-auto lg:border-l lg:rounded-3xl"
            >
              {/* Alça de arraste (apenas mobile) */}
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-3 mb-1 lg:hidden" />
              
               {/* Preview da Loja (Destaque no Topo) */}
               <div className="px-3 pt-3 pb-1 lg:hidden shrink-0">
                 <div className="rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl h-[320px] relative transition-all duration-300 flex flex-col" style={{ backgroundColor: previewSettings.bg_color }}>
                   {/* Scroll interno da prévia da loja */}
                   <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-6">
                     {previewSettings.profile_image && (
                       <div className="mb-4 text-center">
                         <img src={previewSettings.profile_image} alt="Preview" className="w-16 h-16 mx-auto rounded-full object-cover border-2 shadow-lg" style={{ borderColor: previewSettings.theme_color }} />
                       </div>
                     )}
                     {previewSettings.header_style === 'bold' ? (
                       <div className="p-3 rounded-xl text-center mb-3" style={{ background: `linear-gradient(135deg, ${previewSettings.theme_color}22, ${previewSettings.theme_color}11)`, border: `1px solid ${previewSettings.theme_color}33` }}>
                         <p className="font-black text-xs tracking-tighter text-white uppercase">LOJA <span style={{ color: previewSettings.theme_color }}>@{storeSlug}</span></p>
                       </div>
                     ) : (
                       <div className="text-center mb-3">
                         <p className="font-black text-xs tracking-tighter text-white uppercase">@{storeSlug}</p>
                         <div className="w-6 h-0.5 mx-auto mt-1" style={{ backgroundColor: previewSettings.theme_color }} />
                       </div>
                     )}
                     <div className={previewSettings.layout_type === 'list' ? 'space-y-1.5' : 'grid grid-cols-2 gap-2'}>
                       {items.length > 0 ? items.slice(0, 10).map((item: any) => (
                         <div key={item.id} className="aspect-square rounded-xl overflow-hidden flex items-center justify-center bg-white/5 border border-white/5" style={{ borderRadius: previewSettings.card_radius }}>
                           {item.image_url ? (
                             <img src={item.image_url} alt={item.title} className="w-full h-full object-cover opacity-90" />
                           ) : (
                             <ShoppingBag size={14} className="opacity-20" style={{ color: previewSettings.theme_color }} />
                           )}
                         </div>
                       )) : [1,2,3,4,5,6].map(i => (
                         <div key={i} className="aspect-square rounded-xl flex items-center justify-center bg-white/5 border border-white/10" style={{ borderRadius: previewSettings.card_radius }}>
                           <ShoppingBag size={14} className="opacity-10" style={{ color: previewSettings.theme_color }} />
                         </div>
                       ))}
                     </div>
                   </div>
                 </div>
               </div>

               {/* Header Compacto (Abaixo da Prévia) */}
               <div className="sticky top-0 z-10 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 px-4 py-2.5 flex items-center justify-between shrink-0">
                 <button onClick={() => setShowCustomizer(false)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg font-black text-[9px] uppercase transition-all shadow-lg active:scale-95">
                   <ArrowLeft size={12} />
                   VOLTAR
                 </button>
                 <button onClick={() => setShowCustomizer(false)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 text-slate-500 hover:text-white transition-colors shrink-0">
                   ✕
                 </button>
               </div>

               {/* Opções de Customização (Scrollable) */}
               <div className="px-5 pb-10 pt-4 space-y-7 flex-1 overflow-y-auto custom-scrollbar">
                 {/* Preview para Desktop */}
                 <div className="hidden lg:block rounded-2xl overflow-hidden border border-white/10" style={{ backgroundColor: previewSettings.bg_color }}>
                <div className="p-4 pt-6">
                  {previewSettings.profile_image && (
                    <div className="mb-4 text-center">
                      <img src={previewSettings.profile_image} alt="Preview" className="w-16 h-16 mx-auto rounded-full object-cover border-2" style={{ borderColor: previewSettings.theme_color }} />
                    </div>
                  )}
                  {previewSettings.header_style === 'bold' ? (
                    <div className="p-3 rounded-xl text-center mb-3" style={{ background: `linear-gradient(135deg, ${previewSettings.theme_color}22, ${previewSettings.theme_color}11)`, border: `1px solid ${previewSettings.theme_color}33` }}>
                      <p className="font-black text-sm tracking-tighter text-white">LOJA <span style={{ color: previewSettings.theme_color }}>@{storeSlug}</span></p>
                    </div>
                  ) : previewSettings.header_style === 'minimal' ? (
                    <div className="text-center mb-3">
                      <p className="font-black text-sm tracking-tighter text-white">@{storeSlug}</p>
                      <div className="w-6 h-0.5 mx-auto my-1.5" style={{ backgroundColor: previewSettings.theme_color }} />
                    </div>
                  ) : (
                    <div className="mb-3">
                      <p className="text-lg font-black" style={{ color: previewSettings.theme_color }}>LOJA</p>
                      <p className="text-white font-black text-sm tracking-tighter">@<span style={{ color: previewSettings.theme_color }}>{storeSlug}</span></p>
                    </div>
                  )}
                  <div className={previewSettings.layout_type === 'list' ? 'space-y-1.5' : 'grid grid-cols-2 gap-1.5'}>
                    {items.length > 0 ? items.slice(0, 4).map((item: any) => (
                      <div key={item.id} className="aspect-square rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: previewSettings.card_radius }}>
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag size={14} className="opacity-20" style={{ color: previewSettings.theme_color }} />
                        )}
                      </div>
                    )) : [1,2,3,4].map(i => (
                      <div key={i} className="aspect-square rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.06)`, borderRadius: previewSettings.card_radius }}>
                        <ShoppingBag size={14} className="opacity-20" style={{ color: previewSettings.theme_color }} />
                      </div>
                    ))}
                  </div>
                  {previewSettings.show_watermark && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03]">
                      <span className="text-[40px] font-black rotate-12">SHOPEE</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Controles Compactos */}
              <div className="space-y-4">
              {/* Cor Principal */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: previewSettings.theme_color }} />
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">Cor</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {colorPresets.map(p => (
                    <button key={p.name} onClick={() => updatePreview({ theme_color: p.color, accent_color: p.color })}
                      className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${previewSettings.theme_color === p.color ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: p.color }} />
                  ))}
                  <input type="color" value={previewSettings.theme_color} onChange={(e) => updatePreview({ theme_color: e.target.value, accent_color: e.target.value })}
                    className="w-7 h-7 rounded-full border border-white/20 cursor-pointer bg-transparent" />
                </div>
              </div>

              {/* Fundo */}
              <div>
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">Fundo</span>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {['#050505','#0f172a','#1a0a2e','#0a1a0a','#1a0a0a'].map(bg => (
                    <button key={bg} onClick={() => updatePreview({ bg_color: bg })}
                      className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${previewSettings.bg_color === bg ? 'border-white scale-110' : 'border-white/10'}`}
                      style={{ backgroundColor: bg }} />
                  ))}
                  <input type="color" value={previewSettings.bg_color} onChange={(e) => updatePreview({ bg_color: e.target.value })}
                    className="w-7 h-7 rounded-full border border-white/20 cursor-pointer bg-transparent" />
                </div>
              </div>

              {/* Layout */}
              <div>
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">Layout</span>
                <div className="flex gap-1.5 mt-1.5">
                  {layoutOptions.map(opt => (
                    <button key={opt.id} onClick={() => updatePreview({ layout_type: opt.id })}
                      className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${previewSettings.layout_type === opt.id ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-600'}`}>
                      {opt.icon} {opt.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fonte */}
              <div>
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">Fonte</span>
                <div className="flex gap-1.5 mt-1.5">
                  {fontOptions.map(opt => (
                    <button key={opt.id} onClick={() => updatePreview({ font_style: opt.id })}
                      className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${previewSettings.font_style === opt.id ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-600'}`}>
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Header */}
              <div>
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">Header</span>
                <div className="flex gap-1.5 mt-1.5">
                  {headerOptions.map(opt => (
                    <button key={opt.id} onClick={() => updatePreview({ header_style: opt.id })}
                      className={`flex-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${previewSettings.header_style === opt.id ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-600'}`}>
                      {opt.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Watermark */}
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">Marca D'água</span>
                <button onClick={() => updatePreview({ show_watermark: !previewSettings.show_watermark })}
                  className={`w-10 h-6 rounded-full transition-all relative ${previewSettings.show_watermark ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${previewSettings.show_watermark ? 'left-5' : 'left-1'}`} />
                </button>
              </div>

              {/* Border Radius */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">Arredondamento</span>
                  <span className="text-[8px] font-mono text-slate-600">{previewSettings.card_radius}</span>
                </div>
                <input type="range" min="0" max="3" step="0.25" value={parseFloat(previewSettings.card_radius)}
                  onChange={(e) => updatePreview({ card_radius: `${e.target.value}rem` })}
                  className="w-full accent-emerald-500 h-1" />
              </div>

              {/* Foto de Perfil */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <User size={12} className="text-slate-500" />
                  <span className="text-[8px] font-black uppercase tracking-[0.15em] text-slate-500">Foto de Perfil</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={profileInputRef}
                  onChange={handleProfileUpload}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => profileInputRef.current?.click()}
                    disabled={uploadingProfile}
                    className="flex-1 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-slate-400 hover:text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {uploadingProfile ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    {previewSettings.profile_image ? 'TROCAR' : 'ADICIONAR'}
                  </button>
                  {previewSettings.profile_image && (
                    <button
                      onClick={() => updatePreview({ profile_image: '' })}
                      className="px-3 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-[8px] font-black uppercase transition-all"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="space-y-2 pt-2">
                <button onClick={() => saveSettings(previewSettings)} disabled={savingSettings}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {savingSettings ? <><Loader2 size={12} className="animate-spin" /> SALVANDO...</> : <><Check size={12} /> SALVAR</>}
                </button>
                <button onClick={() => setPreviewSettings(defaultSettings)}
                  className="w-full py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-slate-500 hover:text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all">
                  RESETAR PADRÃO
                </button>
              </div>
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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

      <motion.div
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="glass-acid p-4 sm:p-8 flex flex-col gap-4 sm:gap-6 relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-[80px]" />
        
          <div className="flex items-center justify-between flex-wrap gap-6 relative z-10">
            <div className="flex items-center space-x-4 space-y-2 flex-wrap">
              <div className="space-y-1 flex-1">
                <h2 className="text-3xl font-black text-white flex items-center gap-3 tracking-tighter">
                  <MousePointerClick className="text-emerald-500" size={32} /> LOJA LINK NA <span className="text-emerald-500 italic">BIO</span>
                </h2>
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.4em]">Dashboard de Afiliados Pro</p>
              </div>
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
              {user && (
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCustomizer(!showCustomizer)}
                  className={`p-3 rounded-2xl transition-all border ${showCustomizer ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400'}`}
                >
                  <Palette size={18} />
                </motion.button>
              )}
            </div>
          </div>

        {/* URL Personalizada */}
        <div className="bg-black/40 border border-white/5 rounded-[2rem] p-6 space-y-5 relative">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Domínio da sua Vitrine</span>
          </div>

          {editingSlug ? (
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-emerald-500/5 rounded-2xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <AtSign size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 z-10" />
                <input
                  type="text"
                  value={slugInput}
                  onChange={e => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                  placeholder="ex: meus-achadinhos"
                  className="w-full bg-[#0a0a0a] border-2 border-emerald-500/30 rounded-2xl pl-12 pr-6 py-5 text-white font-mono font-bold focus:outline-none focus:border-emerald-500 transition-all text-base sm:text-sm relative z-10"
                  onKeyDown={e => e.key === 'Enter' && handleSaveSlug()}
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleSaveSlug} 
                  className="flex-1 px-8 py-5 bg-emerald-500 text-black rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
                >
                  SALVAR ALTERAÇÕES
                </button>
                <button 
                  onClick={() => setEditingSlug(false)} 
                  className="px-6 py-5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-colors hover:bg-white/5 active:scale-[0.98]"
                >
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

        {storeSlug && storeSlug !== 'meu-link' && (initialStoreReady || onStoreConfigured) && onProceed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={onProceed}
              className="w-full py-6 bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-black uppercase italic tracking-[0.2em] rounded-3xl shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex items-center justify-center gap-4 group"
            >
              <Zap size={24} fill="currentColor" className="group-hover:animate-pulse" />
              <span className="text-sm">INICIAR BUSCAS DE PRODUTOS E VÍDEOS VIRAIS</span>
              <ExternalLink size={24} />
            </motion.button>
          </motion.div>
        )}

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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
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
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 hover:border-emerald-500/40 rounded-xl text-slate-400 hover:text-emerald-400 transition-all text-[10px] font-black uppercase tracking-widest">
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
                    className="w-full bg-black/40 border-2 border-white/5 rounded-2xl py-4 pl-12 pr-12 text-[13px] text-white focus:outline-none focus:border-emerald-500/50 transition-all font-bold" />
                  <button type="button" onClick={handleViralize}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl transition-all"
                    title="Viralizar Nome ✨">
                    <Sparkles size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-widest text-emerald-500/70 ml-1">Preço Sugerido (Opcional)</label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 font-bold">R$</span>
                  <input type="text" placeholder="Ex: 49,90" value={price} onChange={e => setPrice(e.target.value)}
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
                     className="glass-acid p-4 flex items-center gap-5 group hover:border-emerald-500/30 transition-all duration-500 rounded-[1.5rem]">
                    
                     <div className="relative w-16 h-16 shrink-0">
                       <img src={item.image_url || FALLBACK_THUMBNAIL} alt={item.title}
                         className="w-full h-full rounded-xl object-cover bg-black/50 border border-white/5"
                         onError={(e) => { const img = e.currentTarget; if (img.src === FALLBACK_THUMBNAIL) return; img.src = FALLBACK_THUMBNAIL; }}
                       />
                       <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                     </div>

                    <div className="flex-1 min-w-0 space-y-2">
                       <div className="flex items-center gap-2">
                         <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" />
                         <span className="text-emerald-500 text-[9px] font-black uppercase tracking-widest">Online</span>
                       </div>
                        <h4 className="text-white font-bold text-xs leading-snug line-clamp-2 italic tracking-tight">{item.title}</h4>
                        <div className="flex items-center gap-3">
                          <a href={item.affiliate_link} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-emerald-500/10 rounded-lg text-slate-500 hover:text-emerald-400 text-[10px] uppercase font-black tracking-widest transition-all">
                            <ExternalLink size={10} /> Ver na Shopee
                          </a>
                          <button onClick={() => handleShare(item)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-white/5 hover:bg-emerald-500/10 rounded-lg text-slate-500 hover:text-emerald-400 text-[10px] uppercase font-black tracking-widest transition-all">
                            <Share2 size={10} /> Compartilhar
                          </button>
                        </div>
                        {item.price && (
                          <div className="inline-flex items-center px-3 py-1 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-emerald-400 text-[10px] font-black">
                             💰 R$ {item.price.replace('R$', '').trim()}
                          </div>
                        )}
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
