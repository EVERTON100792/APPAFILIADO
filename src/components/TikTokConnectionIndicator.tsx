import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabaseClient';
import { CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';

interface TikTokConnectionIndicatorProps {
  userId: string | undefined;
}

export const TikTokConnectionIndicator: React.FC<TikTokConnectionIndicatorProps> = ({ userId }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  // You must set this in your frontend environment variables or hardcode as requested
  const TIKTOK_CLIENT_KEY = "sbawcxdrytk259in36"; 
  const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/` : '';

  useEffect(() => {
    if (!userId) {
      setIsChecking(false);
      return;
    }

    const checkConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('user_integrations')
          .select('tiktok_access_token, tiktok_expires_at')
          .eq('user_id', userId)
          .single();

        if (error || !data) {
          setIsConnected(false);
          return;
        }

        // Check if token is expired
        if (data.tiktok_expires_at && new Date(data.tiktok_expires_at) < new Date()) {
          setIsConnected(false);
        } else {
          setIsConnected(true);
        }
      } catch (err) {
        setIsConnected(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
  }, [userId]);

  useEffect(() => {
    // Check if we are returning from TikTok OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (code && state === 'tiktok_oauth_1234') {
      setIsChecking(true);
      
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);

      const codeVerifier = sessionStorage.getItem("tiktok_code_verifier") || undefined;
      sessionStorage.removeItem("tiktok_code_verifier");

      // Call edge function to exchange code
      supabase.functions.invoke('tiktok-auth', {
        body: { code, redirect_uri: REDIRECT_URI, code_verifier: codeVerifier }
      }).then(({ data, error }) => {
        if (error || (data && data.error)) {
          console.error("TikTok Auth Error:", error || data.error);
          alert("Erro ao conectar com TikTok: " + (data?.error || error?.message));
          setIsConnected(false);
        } else {
          setIsConnected(true);
          alert("TikTok conectado com sucesso!");
        }
        setIsChecking(false);
      });
    }
  }, []);

  const handleConnect = async () => {
    // PKCE variables
    const generateRandomString = (length: number) => {
      let text = "";
      const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
      for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    };

    const generateCodeChallenge = async (codeVerifier: string) => {
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await window.crypto.subtle.digest("SHA-256", data);
      return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    };

    const codeVerifier = generateRandomString(64);
    sessionStorage.setItem("tiktok_code_verifier", codeVerifier);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const state = "tiktok_oauth_1234";
    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${TIKTOK_CLIENT_KEY}&response_type=code&scope=user.info.basic,video.publish&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
    window.location.href = authUrl;
  };

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-white/5 opacity-50">
        <RefreshCcw size={14} className="animate-spin text-slate-400" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Verificando...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
        <CheckCircle2 size={14} className="text-emerald-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">TikTok Conectado</span>
      </div>
    );
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleConnect}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00f2fe] to-[#4facfe] hover:from-[#4facfe] hover:to-[#00f2fe] rounded-full border border-white/10 shadow-lg glow cursor-pointer transition-all"
    >
      <AlertCircle size={14} className="text-slate-900" />
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Conectar TikTok</span>
    </motion.button>
  );
};
