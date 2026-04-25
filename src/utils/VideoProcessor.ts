import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import type { ViralScript } from './viralScriptGenerator';

export interface ProcessingOptions {
  filter: string;
  legend: string;
  isMuted: boolean;
  transition: 'crossFade' | 'whipLeft' | 'whipRight' | 'pushUp' | 'pushDown' | 'zoomBurst' | 'lensBlur' | 'flashWhite' | 'glitchShift' | 'rotateIn' | 'scaleDown' | 'lightLeak' | 'zoomIn' | 'slideL' | 'slideR' | 'flash' | 'glitchLite' | 'cinematic' | 'fade' | 'zoom' | 'slide' | 'beat' | 'blur' | 'shake' | 'rotate' | 'fire' | 'glitch' | 'none';
  transitionList?: string[];
  videoId?: string;
  trimStart?: number;
  trimEnd?: number;
  transitionTimestamps?: number[];
  existingVideoEl?: HTMLVideoElement;
  musicUrl?: string;
  musicBpm?: number;
  musicGenre?: string;
  audioMixMode?: 'original' | 'music' | 'mix' | 'mute';
  script?: ViralScript;
  storeSlug?: string;
  mobileTurbo?: boolean;
  useNarration?: boolean;
  narrationVoice?: 'M' | 'F';
  narrationStyle?: string;
  onProgress?: (p: number) => void;
  isAutoral?: boolean;
  storeLogo?: string;
  storeName?: string;
}

export class VideoProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private auxCanvas: HTMLCanvasElement;
  private auxCtx: CanvasRenderingContext2D;
  private ownedVideo: HTMLVideoElement;
  private frameCache: Map<string, ImageBitmap[]> = new Map();
  private stream: MediaStream | null = null;
  private logoCache: HTMLImageElement | null = null;
  private logoUrl: string | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.auxCanvas = document.createElement('canvas');
    this.auxCtx = this.auxCanvas.getContext('2d')!;
    this.ownedVideo = document.createElement('video');
    this.ownedVideo.muted = false;
    this.ownedVideo.playsInline = true;
  }

  public dispose() {
    this.ownedVideo.pause();
    this.ownedVideo.src = "";
    this.ownedVideo.load();
    this.ownedVideo.remove();
    this.canvas.width = 0;
    this.canvas.height = 0;
    this.auxCanvas.width = 0;
    this.auxCanvas.height = 0;
  }

  private getFilterCSS(filter: string): string {
    switch (filter) {
      case 'elite':     return 'contrast(1.35) saturate(1.7) brightness(1.15)';
      case 'vhs':       return 'contrast(0.9) saturate(0.55) sepia(0.3) brightness(1.1)'; // Removido blur
      case 'cinematic': return 'contrast(1.3) saturate(1.1) brightness(1.05) hue-rotate(-5deg)';
      case 'bw':        // Removido filtros de imagem (contrast/brightness) para evitar travamentos em celulares
        return 'none';
      case 'bloom':     return 'brightness(1.2) saturate(1.3)';
      case 'glitch':    return 'hue-rotate(90deg) brightness(1.2) contrast(1.25)';
      case 'ultra8k':   return 'contrast(1.4) saturate(1.8) brightness(1.12)'; // Removido drop-shadow
      case 'dramatic':  return 'contrast(1.5) saturate(0.9) brightness(0.9) sepia(0.1)';
      case 'tealAndOrange': return 'contrast(1.2) saturate(1.4) hue-rotate(-10deg) sepia(0.1) brightness(1.1)';
      case 'vintageGold': return 'sepia(0.4) contrast(1.1) brightness(1.1) saturate(1.3)';
      case 'professional': return 'contrast(1.15) saturate(1.15) brightness(1.08)';
      case 'tiktok viral': return 'contrast(1.25) saturate(1.35) brightness(1.1) brightness(1.12)';
      default:          return 'contrast(1.08) saturate(1.08)';
    }
  }

  private async fetchAsBlob(url: string, type: 'image' | 'video' = 'video'): Promise<string> {
    if (url.startsWith('blob:') || url.startsWith('data:') || url.includes('localhost') || url.startsWith('/')) {
      return url;
    }
    
    const PROXY_BASE = 'https://vzydpqilvyjqjbhzgzhq.supabase.co/functions/v1/video-proxy';
    const proxyGenerators = [
      (u: string) => u.includes(PROXY_BASE) ? u : `${PROXY_BASE}?url=${encodeURIComponent(u)}`,
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    ];

    const attempts = proxyGenerators.map(async (proxyFn) => {
      const targetUrl = proxyFn(url);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); 
      
      try {
        const res = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 200) return URL.createObjectURL(blob);
        }
        throw new Error("Proxy failed or returned small data");
      } catch (e) {
        clearTimeout(timeoutId);
        // Silently fail so Promise.any can try the next one
        throw e;
      }
    });

    try {
      // Tentar todos em paralelo e pegar o primeiro que funcionar
      // Adicionamos um timeout global para o Promise.any
      return await Promise.race([
        Promise.any(attempts),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout Global")), 15000))
      ]) as string;
    } catch (e) {
      console.warn(`[VideoProcessor] Falha crítica de proxy para ${url}, usando original.`);
      return url;
    }
  }

  private generateSyntheticBeat(sampleRate: number, bpm: number = 128, durationSec: number = 35, genre: string = 'house'): AudioBuffer {
    const buf = new AudioBuffer({ numberOfChannels: 2, length: sampleRate * durationSec, sampleRate });
    const L = buf.getChannelData(0);
    const R = buf.getChannelData(1);
    const spb = (60 / bpm) * sampleRate;
    const patterns: Record<string, { kick: number[], snare: number[], hihat: number[], bass: number[] }> = {
      'house':  { kick:  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], bass: [60,0,0,0,0,0,0,65,0,0,0,0,0,0,0,0] },
      'phonk':  { kick:  [1,0,1,1,0,0,1,0,1,0,1,1,0,1,1,0], snare: [0,0,1,0,0,0,1,0,0,0,1,0,0,1,1,0], hihat: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], bass: [36,0,0,36,0,0,38,0,36,0,0,36,0,41,0,0] },
      'funk':   { kick:  [1,0,0,1,0,1,0,0,1,0,0,1,0,1,0,0], snare: [0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,1], hihat: [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0], bass: [41,0,0,41,0,0,0,0,41,0,0,41,0,48,0,0] },
      'lofi':   { kick:  [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat: [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0], bass: [48,0,0,0,0,0,0,0,43,0,0,0,0,0,0,0] },
      'trap':   { kick:  [1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat: [0,1,1,0,1,1,0,1,0,1,1,0,1,1,1,1], bass: [36,0,0,0,0,0,0,36,0,0,33,0,0,0,0,0] },
    };
    const p = patterns[genre] || patterns['house'];
    const stepsPerBeat = 4;
    const stepLen = Math.floor(spb / stepsPerBeat);
    const totalSteps = Math.floor(sampleRate * durationSec / stepLen);

    const addSine = (ch: Float32Array, offset: number, freq: number, dur: number, amp: number, decay: number) => {
      for (let s = 0; s < dur && (offset + s) < ch.length; s++) {
        ch[offset + s] += Math.sin(2 * Math.PI * freq * s / sampleRate) * amp * Math.exp(-s / decay);
      }
    };
    const addNoise = (ch: Float32Array, offset: number, dur: number, amp: number, decay: number) => {
      for (let s = 0; s < dur && (offset + s) < ch.length; s++) {
        ch[offset + s] += (Math.random() * 2 - 1) * amp * Math.exp(-s / decay);
      }
    };

    for (let step = 0; step < totalSteps; step++) {
      const pat = step % 16;
      const off = step * stepLen;
      if (p.kick[pat]) {
        [L, R].forEach(ch => {
          for (let s = 0; s < stepLen && (off + s) < ch.length; s++) {
            const env = Math.exp(-s / (sampleRate * 0.055));
            const freq = 60 + 150 * Math.exp(-s / (sampleRate * 0.025));
            ch[off + s] += Math.sin(2 * Math.PI * freq * s / sampleRate) * env * 0.9;
            // Distorção leve para "pegada" viral
            if (ch[off+s] > 0.8) ch[off+s] = 0.8;
            if (ch[off+s] < -0.8) ch[off+s] = -0.8;
          }
        });
      }
      if (p.snare[pat]) {
        [L, R].forEach(ch => { addNoise(ch, off, Math.floor(sampleRate * 0.12), 0.6, sampleRate * 0.035); });
      }
      if (p.hihat[pat]) {
        [L, R].forEach(ch => { addNoise(ch, off, Math.floor(sampleRate * 0.02), 0.25, sampleRate * 0.005); });
      }
      const bassNote = p.bass[pat];
      if (bassNote > 0) {
        const bassFreq = 440 * Math.pow(2, (bassNote - 69) / 12) * 0.5; // Sub-bass
        const bassDur = Math.floor(stepLen * 2);
        [L, R].forEach(ch => { addSine(ch, off, bassFreq, bassDur, 0.45, sampleRate * 0.15); });
      }
    }
    return buf;
  }

  private async loadAndResampleAudio(url: string, targetSampleRate: number, bpm: number = 128, genre: string = 'house'): Promise<AudioBuffer> {
    const SUPABASE_PROXY = 'https://vzydpqilvyjqjbhzgzhq.supabase.co/functions/v1/video-proxy';
    if (url.startsWith('blob:') || url.startsWith('http://localhost') || url.startsWith('/')) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return this.processAudioBuffer(arrayBuffer, targetSampleRate, 1.14); // Pitch viral energético
      } catch (e) { console.warn("[Audio] Falha ao carregar áudio local direto:", e); }
    }
    const proxies = [
      `${SUPABASE_PROXY}?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    ];
    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl);
        if (!response.ok) continue;
        const arrayBuffer = await response.arrayBuffer();
        return this.processAudioBuffer(arrayBuffer, targetSampleRate, 1.14); // Pitch viral energético
      } catch (e) {}
    }
    return this.generateSyntheticBeat(targetSampleRate, bpm, 35, genre || 'phonk');
  }

  private async processAudioBuffer(arrayBuffer: ArrayBuffer, targetSampleRate: number, pitchFactor: number = 1.0): Promise<AudioBuffer> {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    try {
      const originalBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      // Se pitchFactor > 1, estamos mudando a identidade da voz (estilo TikTok viral)
      const durationFactor = 1 / pitchFactor;
      const newLen = Math.ceil(originalBuffer.duration * targetSampleRate * durationFactor);
      const offlineCtx = new OfflineAudioContext(originalBuffer.numberOfChannels, newLen, targetSampleRate);
      
      const src = offlineCtx.createBufferSource();
      src.buffer = originalBuffer;
      src.playbackRate.value = pitchFactor; // Altera tom e velocidade simultaneamente
      
      // Aplicar um leve "Compressor/Limiter" para voz profissional
      const compressor = offlineCtx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, 0);
      compressor.knee.setValueAtTime(30, 0);
      compressor.ratio.setValueAtTime(12, 0);
      compressor.attack.setValueAtTime(0.003, 0);
      compressor.release.setValueAtTime(0.25, 0);
      
      src.connect(compressor);
      compressor.connect(offlineCtx.destination);
      src.start();
      return await offlineCtx.startRendering();
    } finally { await audioCtx.close(); }
  }

  public async renderVideo(videoUrl: string, options: ProcessingOptions): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const sourceUrl = await this.fetchAsBlob(videoUrl, 'video');
        const video = this.ownedVideo;
        video.crossOrigin = 'anonymous';
        video.src = sourceUrl;
        await new Promise<void>((res, rej) => {
          video.onloadedmetadata = () => res();
          video.onerror = (e) => rej(e);
        });
        
        // Otimização Mobile: 720p em vez de 1080p para evitar estouro de memória/GPU
        const W = isMobile ? 1080 : 1080; 
        const H = isMobile ? 1920 : 1920;
        this.canvas.width = W; this.canvas.height = H;
        this.auxCanvas.width = W; this.auxCanvas.height = H;

        const targetSampleRate = 44100;
        // Mobile Turbo: mantém áudio original (não processa pitch - muito pesado)
        // Desktop/Normal: aplica pitch se for autoral (0.92 = voz mais grossa conforme solicitado)
        const pitchFactor = (options.isAutoral && !options.mobileTurbo) ? 0.92 : 1.0;
        let mainAudioBuffer = await this.processAudioBuffer(await (await fetch(videoUrl)).arrayBuffer(), targetSampleRate, pitchFactor);
        if (options.musicUrl) {
          const bg = await this.loadAndResampleAudio(options.musicUrl, targetSampleRate);
          // Mix logic (simplified)
          const mixed = new AudioBuffer({ numberOfChannels: 2, length: Math.max(mainAudioBuffer.length, bg.length), sampleRate: targetSampleRate });
          for (let ch = 0; ch < 2; ch++) {
            const m = mainAudioBuffer.getChannelData(ch % mainAudioBuffer.numberOfChannels);
            const b = bg.getChannelData(ch % bg.numberOfChannels);
            const out = mixed.getChannelData(ch);
            for (let s = 0; s < mixed.length; s++) {
              // Mixagem viral: Voz clara (0.95), Fundo enérgico (0.35)
              out[s] = (m[s] || 0) * 0.95 + (b[s % b.length] || 0) * 0.35;
            }
          }
          mainAudioBuffer = mixed;
        }

        const muxer = new Muxer({ 
          target: new ArrayBufferTarget(), 
          video: { codec: 'avc', width: W, height: H }, 
          audio: { codec: 'aac', numberOfChannels: 2, sampleRate: 44100 }, 
          fastStart: 'in-memory',
          firstTimestampBehavior: 'offset' 
        });
        const videoEncoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => console.error(e) });
        
        // Bitrate de Alta Performance (HQ): 6Mbps para Autoral garantindo nitidez máxima
        const targetBitrate = options.isAutoral ? 6_000_000 : 4_000_000;
        videoEncoder.configure({ 
          codec: 'avc1.4d002a', // High Profile Level 4.2
          width: W, 
          height: H, 
          bitrate: targetBitrate,
          latencyMode: 'quality' // Foca na integridade do frame
        });
        const audioEncoder = new AudioEncoder({ output: (chunk, meta) => muxer.addAudioChunk(chunk, meta), error: e => console.error(e) });
        audioEncoder.configure({ codec: 'mp4a.40.2', numberOfChannels: 2, sampleRate: 44100, bitrate: 128_000 });

        const fps = 30;
        const totalFrames = Math.floor(video.duration * fps);
        const filterCSS = this.getFilterCSS(options.filter);
        
        // Pré-carregar logo se existir para performance (evitar fetch em cada frame)
        if (options.storeLogo && (!this.logoCache || this.logoUrl !== options.storeLogo)) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const blobUrl = await this.fetchAsBlob(options.storeLogo, 'image');
            img.src = blobUrl;
            await new Promise((res) => { img.onload = res; img.onerror = res; });
            this.logoCache = img;
            this.logoUrl = options.storeLogo;
          } catch (e) {
            console.warn("[VideoProcessor] Falha no pré-carregamento do logo:", e);
          }
        }

        const framesToCache = isMobile ? 0 : Math.min(totalFrames, 300); // Desativar cache em mobile para economizar RAM
        const cachedFrames = this.frameCache.get(videoUrl) || [];
        const useCache = !isMobile && cachedFrames.length > 0;

        for (let i = 0; i < totalFrames; i++) {
          const currentTime = i / fps;
          
          if (useCache) {
            const frameIdx = i % cachedFrames.length;
            this.auxCtx.drawImage(cachedFrames[frameIdx], 0, 0, W, H);
          } else {
            const targetTime = currentTime % video.duration;
            if (Math.abs(video.currentTime - targetTime) > 0.01) {
              video.currentTime = targetTime;
              await new Promise<void>(res => {
                let resolved = false;
                const onSeeked = () => {
                  if (resolved) return;
                  resolved = true;
                  video.removeEventListener('seeked', onSeeked);
                  res();
                };
                video.addEventListener('seeked', onSeeked);
                setTimeout(onSeeked, isMobile ? 400 : 150); // Timeout robusto para evitar lags
              });
            }
            
            // Garantir que temos dados suficientes para desenhar o frame sem flicker
            if (video.readyState >= 2) {
              this.auxCtx.drawImage(video, 0, 0, W, H);
            } else {
              // Se falhar o seek, espera um pouco mais no próximo ciclo ou pula (melhor pular do que lagar)
              await new Promise(r => setTimeout(r, 10));
              this.auxCtx.drawImage(video, 0, 0, W, H);
            }
            
            // Alimentar cache se possível
            if (i < framesToCache) {
              try {
                // Usar auxCanvas em vez de video diretamente (mais estável)
                const bmp = await createImageBitmap(this.auxCanvas);
                cachedFrames.push(bmp);
                if (i === framesToCache - 1) this.frameCache.set(videoUrl, cachedFrames);
              } catch (e) {
                console.warn("[VideoProcessor] Falha ao criar bitmap do frame:", e);
              }
            }
          }

          this.ctx.save();
          if (options.isAutoral) {
            // ESPELHAMENTO: Inverte horizontalmente
            this.ctx.translate(W, 0);
            this.ctx.scale(-1, 1);
            // SAFE-ZOOM: 1.05x (5% de zoom) para mudar a assinatura sem perder qualidade
            this.ctx.translate(W/2, H/2);
            this.ctx.scale(1.05, 1.05);
            this.ctx.translate(-W/2, -H/2);
          }
          
          this.ctx.filter = filterCSS;
          this.ctx.drawImage(this.auxCanvas, 0, 0, W, H);
          
          

          this.ctx.restore();

          if (options.isAutoral) {
            // CARD DE PRODUTO: Cobre 25% da base para esconder legendas originais de forma profissional
            const cardH = H * 0.25;
            const gradient = this.ctx.createLinearGradient(0, H - cardH, 0, H);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.3, 'rgba(0,0,0,0.85)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.95)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, H - cardH, W, cardH);
            
            // Borda decorativa superior do card
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.fillRect(W * 0.1, H - cardH + 10, W * 0.8, 2);
          } else {
            // Overlay solid mask simples para modo normal
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, H * 0.82, W, H * 0.18);
          }

          if (options.transition !== 'none' && options.transitionTimestamps) {
            this.applyTransitionEffect(options.transition, currentTime, options.transitionTimestamps, W, H);
          }

          if (options.script) {
            this.drawSpintaxOverlay(options.script, currentTime, W, H, options.storeSlug, video.duration, options.isAutoral);
          }

          // Efeitos Cinematográficos para modo Autoral
          if (options.isAutoral) {
            this.drawVignette(W, H);
            this.drawCinematicOverlay(W, H, currentTime);
          }

          // BRANDING: Apenas se não for autoral (Shopee ban)
          if (options.storeName && !options.isAutoral) {
            this.drawStoreBranding(W, H, options);
          }

          const timestamp = currentTime * 1_000_000;
          const vFrame = new VideoFrame(this.canvas, { timestamp });
          videoEncoder.encode(vFrame, { keyFrame: i % 60 === 0 });
          vFrame.close();

          if (mainAudioBuffer) {
            const start = Math.floor(i * (targetSampleRate / fps));
            const len = Math.floor(targetSampleRate / fps);
            const aData = new Float32Array(len * 2);
            for (let ch = 0; ch < 2; ch++) {
              const src = mainAudioBuffer.getChannelData(ch);
              for (let s = 0; s < len; s++) aData[ch * len + s] = src[start + s] || 0;
            }
            const audioData = new AudioData({ format: 'f32-planar', sampleRate: 44100, numberOfFrames: len, numberOfChannels: 2, timestamp, data: aData });
            audioEncoder.encode(audioData);
            audioData.close();
          }
          options.onProgress?.((i / totalFrames) * 100);
        }

        await videoEncoder.flush();
        await audioEncoder.flush();
        muxer.finalize();
        resolve(new Blob([muxer.target.buffer], { type: 'video/mp4' }));
      } catch (err) { reject(err); }
    });
  }

  public async renderSlideshow(imageUrls: string[], options: ProcessingOptions, price: string, productName: string): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const W = isMobile ? 720 : 1080; 
        const H = isMobile ? 1280 : 1920;
        this.canvas.width = W; this.canvas.height = H;

        const targetDuration = 35;
        const fps = 30;
        const totalFrames = targetDuration * fps;
        const slideDuration = 3.5;
        const filterCSS = this.getFilterCSS(options.filter);

        const imgs = await Promise.all(imageUrls.map(async url => {
          try {
            const blobUrl = await this.fetchAsBlob(url, 'image');
            const img = new Image();
            img.src = blobUrl;
            await img.decode();
            
            // Criar bitmap usando canvas para máxima compatibilidade
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tCtx = tempCanvas.getContext('2d')!;
            tCtx.drawImage(img, 0, 0);
            return await createImageBitmap(tempCanvas);
          } catch (e) {
            console.error("[VideoProcessor] Erro ao carregar imagem para slideshow:", url, e);
            // Fallback: carregar um placeholder ou ignorar
            return null;
          }
        })).then(results => results.filter((img): img is ImageBitmap => img !== null));

        const muxer = new Muxer({ 
          target: new ArrayBufferTarget(), 
          video: { codec: 'avc', width: W, height: H }, 
          audio: { codec: 'aac', numberOfChannels: 2, sampleRate: 44100 }, 
          fastStart: 'in-memory',
          firstTimestampBehavior: 'offset' 
        });
        const videoEncoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => console.error(e) });
        // Usar Baseline profile (42E01E) e bitrate menor para máxima compatibilidade e leveza
        videoEncoder.configure({ codec: 'avc1.4d002a', width: W, height: H, bitrate: 3_000_000 });
        const audioEncoder = new AudioEncoder({ output: (chunk, meta) => muxer.addAudioChunk(chunk, meta), error: e => console.error(e) });
        audioEncoder.configure({ codec: 'mp4a.40.2', numberOfChannels: 2, sampleRate: 44100, bitrate: 128_000 });

        const audioBuffer = await this.loadAndResampleAudio(options.musicUrl || '', 44100, options.musicBpm, options.musicGenre);

        // Pré-carregar logo se existir
        if (options.storeLogo && (!this.logoCache || this.logoUrl !== options.storeLogo)) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const blobUrl = await this.fetchAsBlob(options.storeLogo, 'image');
            img.src = blobUrl;
            await new Promise((res) => { img.onload = res; img.onerror = res; });
            this.logoCache = img;
            this.logoUrl = options.storeLogo;
          } catch (e) {
            console.warn("[VideoProcessor] Falha no pré-carregamento do logo:", e);
          }
        }

        for (let i = 0; i < totalFrames; i++) {
          const currentTime = i / fps;
          const slideIdx = Math.floor(currentTime / slideDuration) % imgs.length;
          const img = imgs[slideIdx];
          const progress = (currentTime % slideDuration) / slideDuration;
          const isCTA = currentTime > (targetDuration - 5);

          this.ctx.fillStyle = '#010409';
          this.ctx.fillRect(0, 0, W, H);

          const beatInterval = 60 / (options.musicBpm || 128);
          const beatPhase = (currentTime % beatInterval) / beatInterval;
          let beatPulse = 1;
          if (beatPhase < 0.1 && !isCTA) beatPulse = 1 + (1 - beatPhase / 0.1) * 0.03;

          // --- CROSSFADE PROFISSIONAL ENTRE SLIDES ---
          const FADE_DURATION = 0.45; // 450ms de crossfade suave
          const slideProgress = currentTime % slideDuration; // tempo dentro do slide atual
          const isInTransitionOut = slideProgress > (slideDuration - FADE_DURATION); // saindo
          const isInTransitionIn  = slideProgress < FADE_DURATION;                   // entrando

          // Calcula qual transição usar para este slide
          const transitionTypes = options.transitionList && options.transitionList.length > 0
            ? options.transitionList
            : ['crossFade', 'whipLeft', 'zoomBurst', 'flashWhite', 'lensBlur'];
          const transIdx = slideIdx % transitionTypes.length;
          const currentTransition = transitionTypes[transIdx];
          const nextTransition = transitionTypes[(transIdx + 1) % transitionTypes.length];

          this.ctx.save();

          if (isInTransitionOut) {
            // Slide saindo: aplica efeito de saída
            const tOut = (slideProgress - (slideDuration - FADE_DURATION)) / FADE_DURATION; // 0→1
            const easedOut = this.easeInOutCubic(tOut);

            // Desenhar próximo slide por baixo (blend)
            const nextSlideIdx = (slideIdx + 1) % imgs.length;
            const nextImg = imgs[nextSlideIdx];
            if (nextImg) {
              const bsNext = Math.max(W / nextImg.width, H / nextImg.height);
              const kbNext = 1 + (0) * 0.1;
              const sxNext = (W - nextImg.width * bsNext * kbNext) / 2;
              const syNext = (H - nextImg.height * bsNext * kbNext) / 2;
              this.ctx.globalAlpha = easedOut;
              this.ctx.filter = filterCSS;
              this.ctx.drawImage(nextImg, sxNext, syNext, nextImg.width * bsNext * kbNext, nextImg.height * bsNext * kbNext);
              this.ctx.globalAlpha = 1;
            }

            // Desenhar slide atual por cima com efeito de saída
            this.applyProfessionalTransitionOut(currentTransition, easedOut, W, H);
            const baseScale2 = Math.max(W / img.width, H / img.height);
            const kbScale2 = 1 + progress * 0.08;
            const sx2 = (W - img.width * baseScale2 * kbScale2) / 2;
            const sy2 = (H - img.height * baseScale2 * kbScale2) / 2;
            this.ctx.filter = filterCSS;
            this.ctx.drawImage(img, sx2, sy2, img.width * baseScale2 * kbScale2, img.height * baseScale2 * kbScale2);

          } else if (isInTransitionIn) {
            // Slide entrando
            const tIn = slideProgress / FADE_DURATION; // 0→1
            const easedIn = this.easeInOutCubic(tIn);

            // Desenhar slide anterior por baixo
            const prevSlideIdx = (slideIdx - 1 + imgs.length) % imgs.length;
            const prevImg = imgs[prevSlideIdx];
            if (prevImg) {
              const bsPrev = Math.max(W / prevImg.width, H / prevImg.height);
              const kbPrev = 1 + 0.08;
              const sxPrev = (W - prevImg.width * bsPrev * kbPrev) / 2;
              const syPrev = (H - prevImg.height * bsPrev * kbPrev) / 2;
              this.ctx.globalAlpha = 1;
              this.ctx.filter = filterCSS;
              this.ctx.drawImage(prevImg, sxPrev, syPrev, prevImg.width * bsPrev * kbPrev, prevImg.height * bsPrev * kbPrev);
            }

            // Slide atual entrando com efeito
            this.applyProfessionalTransitionIn(nextTransition, easedIn, W, H);
            const baseScale3 = Math.max(W / img.width, H / img.height);
            const kbScale3 = 1 + progress * 0.08;
            const sx3 = (W - img.width * baseScale3 * kbScale3) / 2;
            const sy3 = (H - img.height * baseScale3 * kbScale3) / 2;
            this.ctx.filter = filterCSS;
            this.ctx.drawImage(img, sx3, sy3, img.width * baseScale3 * kbScale3, img.height * baseScale3 * kbScale3);

          } else {
            // Slide estável: Ken Burns suave
            const baseScale = Math.max(W / img.width, H / img.height);
            const kbScale = 1 + progress * 0.08;
            const scrollX = (W - img.width * baseScale * kbScale) / 2;
            const scrollY = (H - img.height * baseScale * kbScale) / 2;
            this.ctx.globalAlpha = 1;
            this.ctx.filter = filterCSS;
            this.ctx.drawImage(img, scrollX, scrollY, img.width * baseScale * kbScale, img.height * baseScale * kbScale);
          }

          this.ctx.restore();

          // RESET OBRIGATÓRIO: garante que o alpha/filter do crossfade NÃO vaze para a legenda
          this.ctx.globalAlpha = 1;
          this.ctx.filter = 'none';
          this.ctx.setTransform(1, 0, 0, 1, 0, 0);
          if (options.script) {
            this.drawSpintaxOverlay(options.script, currentTime, W, H, options.storeSlug, targetDuration, options.isAutoral);
          }

          // Efeitos Cinematográficos para modo Autoral
          if (options.isAutoral) {
            this.drawVignette(W, H);
            this.drawCinematicOverlay(W, H, currentTime);
          }

          // BRANDING: Apenas se não for autoral (Shopee ban)
          if (options.storeName && !options.isAutoral) {
            this.drawStoreBranding(W, H, options);
          }

          const timestamp = currentTime * 1_000_000;
          const vFrame = new VideoFrame(this.canvas, { timestamp });
          videoEncoder.encode(vFrame, { keyFrame: i % 60 === 0 });
          vFrame.close();

          // CONTROLE DE FLUXO: Evita que a memória RAM estoure se o encoder for mais lento que o loop
          if (videoEncoder.encodeQueueSize > 5) {
            await new Promise(r => setTimeout(r, 20)); // Pausa para o processador respirar
            if (videoEncoder.encodeQueueSize > 15) {
              await new Promise(r => setTimeout(r, 100)); // Pausa maior se a fila estiver crítica
            }
          }


          if (audioBuffer) {
            const start = Math.floor(i * (44100 / fps));
            const len = Math.floor(44100 / fps);
            const aData = new Float32Array(len * 2);
            for (let ch = 0; ch < 2; ch++) {
              const src = audioBuffer.getChannelData(ch);
              for (let s = 0; s < len; s++) aData[ch * len + s] = src[(start + s) % src.length] || 0;
            }
            const audioData = new AudioData({ format: 'f32-planar', sampleRate: 44100, numberOfFrames: len, numberOfChannels: 2, timestamp, data: aData });
            audioEncoder.encode(audioData);
            audioData.close();
          }
          options.onProgress?.((i / totalFrames) * 100);
        }

        await videoEncoder.flush();
        await audioEncoder.flush();
        muxer.finalize();
        resolve(new Blob([muxer.target.buffer], { type: 'video/mp4' }));
      } catch (err) { reject(err); }
    });
  }

  private drawSpintaxOverlay(script: any, time: number, W: number, H: number, storeSlug?: string, totalDuration: number = 15, isAutoral: boolean = false) {
    // RESET COMPLETO: a legenda deve aparecer sempre em full opacity,
    // independente de qualquer efeito de transição de slide ativo
    this.ctx.globalAlpha = 1;
    this.ctx.filter = 'none';
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    let text = "";
    let typeIndex = 0;
    const splitPoints = [0, totalDuration * 0.20, totalDuration * 0.55, totalDuration * 0.80];
    
    if (time < splitPoints[1]) { text = script.hook; typeIndex = 0; }
    else if (time < splitPoints[2]) { text = script.presentation; typeIndex = 1; }
    else if (time < splitPoints[3]) { text = script.midroll || script.presentation; typeIndex = 2; }
    else { text = script.cta; typeIndex = 3; }

    if (!text) return;

    // Calcular animação de "Pop"
    const elapsed = time - splitPoints[typeIndex];
    let popScale = 1.0;
    if (elapsed < 0.4) {
      popScale = 0.9 + Math.sin(Math.min(elapsed / 0.4, 1) * Math.PI) * 0.15;
    }

    this.ctx.save();
    
    // Fonte mais equilibrada para não tapar o produto
    const fontSize = typeIndex === 0 ? W * 0.075 : W * 0.065;
    this.ctx.font = `900 ${fontSize}px "Outfit", "Inter", sans-serif`;
    
    // Wrap text
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
        const width = this.ctx.measureText(currentLine + " " + words[i]).width;
        if (width < W * 0.8) {
            currentLine += " " + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);

    const lineHeight = fontSize * 1.2;
    const padding = W * 0.05;
    const rectH = lines.length * lineHeight + padding * 2;
    const rectW = W * 0.85;
    const rectX = (W - rectW) / 2;
    const rectY = H * 0.72; // POSICIONADO NO RODAPÉ (AJUSTADO PARA ~72-78% DA TELA)

    // Aplicar Transformação de Pop
    this.ctx.translate(W/2, rectY + rectH/2);
    this.ctx.scale(popScale, popScale);
    this.ctx.translate(-W/2, -(rectY + rectH/2));

    // Desenhar fundo estilizado (Vibe Glassmorphism / Viral)
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    this.ctx.shadowBlur = 20;
    
    // Gradiente sutil no fundo
    const grad = this.ctx.createLinearGradient(rectX, rectY, rectX, rectY + rectH);
    if (typeIndex === 3) {
      grad.addColorStop(0, '#DC2626');
      grad.addColorStop(1, '#991B1B');
    } else {
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
    }
    this.ctx.fillStyle = grad;
    
    this.ctx.beginPath();
    if (typeof (this.ctx as any).roundRect === 'function') {
      (this.ctx as any).roundRect(rectX, rectY, rectW, rectH, 18);
    } else {
      this.ctx.rect(rectX, rectY, rectW, rectH);
    }
    this.ctx.fill();
    
    // Borda brilhante
    this.ctx.strokeStyle = typeIndex === 3 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(34, 197, 94, 0.3)';
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const powerWords = ['OFERTA', 'GRÁTIS', 'AGORA', 'PROMOÇÃO', 'IMPERDÍVEL', 'CHOQUE', 'OLHA', 'VEJA', 'VOCÊ', 'SHOPEE', 'ACHADINHO', 'LINK'];

    lines.forEach((line, idx) => {
      const lineY = rectY + padding + (idx + 0.5) * lineHeight;
      const xCenter = W / 2;
      
      // Calcular largura total da linha para alinhamento manual
      const lineText = line.toUpperCase();
      const totalLineWidth = this.ctx.measureText(lineText).width;
      let currentX = xCenter - (totalLineWidth / 2);
      
      const lineWords = line.split(' ');
      
      this.ctx.textAlign = 'left';
      this.ctx.lineJoin = 'round';
      this.ctx.lineWidth = 8;
      this.ctx.strokeStyle = '#000000';

      lineWords.forEach(word => {
        const wordText = word.toUpperCase();
        const cleanWord = wordText.replace(/[.,!]/g, '');
        const isPower = powerWords.includes(cleanWord);
        
        // Desenhar STROKE (Contorno) da palavra individualmente para alinhar com o preenchimento
        this.ctx.strokeText(wordText, currentX, lineY);

        if (isPower) {
          this.ctx.save();
          this.ctx.shadowColor = '#FFD700';
          this.ctx.shadowBlur = 10;
          this.ctx.fillStyle = '#FFD700';
          this.ctx.fillText(wordText, currentX, lineY);
          this.ctx.restore();
        } else {
          this.ctx.fillStyle = '#FFFFFF';
          this.ctx.fillText(wordText, currentX, lineY);
        }
        currentX += this.ctx.measureText(wordText + " ").width;
      });
    });

    if (typeIndex === 3 && storeSlug && !isAutoral) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); 
      this.ctx.font = `italic 800 ${Math.floor(W * 0.045)}px "Inter"`;
      this.ctx.fillStyle = '#FFD700';
      this.ctx.textAlign = 'center';
      // Posicionar handle logo abaixo do box central
      this.ctx.fillText(`@${storeSlug.replace('@', '')}`, W/2, rectY + rectH + 60);
    }

    this.ctx.restore();
  }

  private drawStoreBranding(W: number, H: number, options: ProcessingOptions) {
    if (!options.storeName) return;

    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);

    const padding = W * 0.04;
    const topOffset = H * 0.05; // 5% do topo
    
    // 1. Desenhar Fundo (Barra de Branding)
    const barH = W * 0.11;
    const barW = W * 0.82;
    const barX = (W - barW) / 2;
    const barY = topOffset;
    
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 20;
    
    // Gradiente escuro para contraste
    const grad = this.ctx.createLinearGradient(barX, barY, barX, barY + barH);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
    
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    if (typeof (this.ctx as any).roundRect === 'function') {
      (this.ctx as any).roundRect(barX, barY, barW, barH, 20);
    } else {
      this.ctx.rect(barX, barY, barW, barH);
    }
    this.ctx.fill();
    
    // Borda brilhante sutil
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    // 2. Desenhar Logo
    let contentStartX = barX + padding;
    if (this.logoCache && this.logoCache.complete && this.logoCache.naturalWidth > 0) {
      const logoSize = barH * 0.7;
      const logoY = barY + (barH - logoSize) / 2;
      
      this.ctx.save();
      // Clip circular para o logo
      this.ctx.beginPath();
      this.ctx.arc(contentStartX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
      this.ctx.clip();
      this.ctx.drawImage(this.logoCache, contentStartX, logoY, logoSize, logoSize);
      this.ctx.restore();
      
      contentStartX += logoSize + padding * 0.5;
    }

    // 3. Desenhar Nome da Loja
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'left';
    this.ctx.textBaseline = 'middle';
    const fontSize = barH * 0.35;
    this.ctx.font = `900 ${fontSize}px "Outfit", "Inter", sans-serif`;
    
    const storeName = options.storeName.toUpperCase();
    this.ctx.fillText(storeName, contentStartX, barY + barH/2);
    
    // Badge de Verificado
    const nameWidth = this.ctx.measureText(storeName).width;
    const badgeX = contentStartX + nameWidth + 12;
    const badgeY = barY + barH/2;
    
    this.ctx.fillStyle = '#22C55E';
    this.ctx.beginPath();
    this.ctx.arc(badgeX, badgeY, 7, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Checkmark branco minúsculo no badge
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(badgeX - 3, badgeY);
    this.ctx.lineTo(badgeX - 1, badgeY + 2);
    this.ctx.lineTo(badgeX + 3, badgeY - 2);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  private drawVignette(W: number, H: number) {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    const gradient = this.ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 1.1);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.15)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, W, H);
    this.ctx.restore();
  }

  private drawCinematicOverlay(W: number, H: number, time: number) {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.globalCompositeOperation = 'screen';
    
    // Light leak simulado com gradiente linear móvel
    const x = Math.sin(time * 0.5) * W * 0.5 + W * 0.5;
    const y = Math.cos(time * 0.3) * H * 0.5 + H * 0.5;
    
    const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, W * 0.8);
    gradient.addColorStop(0, 'rgba(255, 120, 0, 0.12)');
    gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.05)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, W, H);
    this.ctx.restore();
  }

  private applyTransitionEffect(transition: string, time: number, timestamps: number[], W: number, H: number) {
    if (!timestamps) return;
    const t = timestamps.find(ts => Math.abs(time - ts) < 0.3);
    if (!t) return;
    const p = 1 - Math.abs(time - t) / 0.3; // 0→1→0
    const smoothP = this.easeInOutCubic(p);
    this.applyProfessionalTransitionIn(transition, smoothP, W, H);
  }

  private easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  private easeOutQuart(x: number): number {
    return 1 - Math.pow(1 - x, 4);
  }

  // Efeito de SAÍDA do slide atual (slide que vai embora)
  private applyProfessionalTransitionOut(type: string, p: number, W: number, H: number) {
    if (p <= 0) return;
    const s = this.easeInOutCubic(p);
    switch (type) {
      case 'crossFade':
      case 'fade':
        this.ctx.globalAlpha = 1 - s;
        break;
      case 'whipLeft':
        this.ctx.translate(-s * W * 1.1, 0);
        this.ctx.globalAlpha = 1 - s * 0.5;
        break;
      case 'whipRight':
        this.ctx.translate(s * W * 1.1, 0);
        this.ctx.globalAlpha = 1 - s * 0.5;
        break;
      case 'pushUp':
        this.ctx.translate(0, -s * H);
        break;
      case 'pushDown':
        this.ctx.translate(0, s * H);
        break;
      case 'zoomBurst':
        this.ctx.translate(W/2, H/2);
        this.ctx.scale(1 + s * 0.25, 1 + s * 0.25);
        this.ctx.translate(-W/2, -H/2);
        this.ctx.globalAlpha = 1 - s;
        break;
      case 'scaleDown':
        this.ctx.translate(W/2, H/2);
        this.ctx.scale(1 - s * 0.3, 1 - s * 0.3);
        this.ctx.translate(-W/2, -H/2);
        this.ctx.globalAlpha = 1 - s;
        break;
      case 'flashWhite':
        this.ctx.globalAlpha = 1 - s;
        // Flash no topo
        this.ctx.fillStyle = `rgba(255,255,255,${s * 0.9})`;
        this.ctx.fillRect(0, 0, W, H);
        break;
      case 'glitchShift':
        this.ctx.translate((Math.round(Math.random()) * 2 - 1) * s * W * 0.04, 0);
        this.ctx.globalAlpha = 1 - s * 0.6;
        break;
      case 'rotateIn':
        this.ctx.translate(W/2, H/2);
        this.ctx.rotate(s * 0.08);
        this.ctx.translate(-W/2, -H/2);
        this.ctx.globalAlpha = 1 - s;
        break;
      case 'lensBlur':
        this.ctx.globalAlpha = 1 - s;
        break;
      case 'lightLeak':
        this.ctx.globalAlpha = 1 - s;
        // Vazamento de luz laranja
        this.ctx.fillStyle = `rgba(255, 140, 0, ${s * 0.6})`;
        this.ctx.fillRect(0, 0, W * 0.3, H);
        break;
      default:
        this.ctx.globalAlpha = 1 - s;
    }
  }

  // Efeito de ENTRADA do próximo slide
  private applyProfessionalTransitionIn(type: string, p: number, W: number, H: number) {
    if (p <= 0) {
      this.ctx.globalAlpha = 0;
      return;
    }
    const s = this.easeOutQuart(p);
    switch (type) {
      case 'crossFade':
      case 'fade':
        this.ctx.globalAlpha = s;
        break;
      case 'whipLeft':
        this.ctx.translate(W * (1 - s), 0);
        this.ctx.globalAlpha = s;
        break;
      case 'whipRight':
        this.ctx.translate(-W * (1 - s), 0);
        this.ctx.globalAlpha = s;
        break;
      case 'pushUp':
        this.ctx.translate(0, H * (1 - s));
        break;
      case 'pushDown':
        this.ctx.translate(0, -H * (1 - s));
        break;
      case 'zoomBurst':
        this.ctx.translate(W/2, H/2);
        this.ctx.scale(0.75 + s * 0.25, 0.75 + s * 0.25);
        this.ctx.translate(-W/2, -H/2);
        this.ctx.globalAlpha = s;
        break;
      case 'scaleDown':
        this.ctx.translate(W/2, H/2);
        this.ctx.scale(1.3 - s * 0.3, 1.3 - s * 0.3);
        this.ctx.translate(-W/2, -H/2);
        this.ctx.globalAlpha = s;
        break;
      case 'flashWhite':
        this.ctx.globalAlpha = s;
        break;
      case 'glitchShift':
        if (p < 0.5) {
          this.ctx.translate((Math.round(Math.random()) * 2 - 1) * (1-p) * W * 0.03, 0);
        }
        this.ctx.globalAlpha = s;
        break;
      case 'rotateIn':
        this.ctx.translate(W/2, H/2);
        this.ctx.rotate(-(1-s) * 0.08);
        this.ctx.translate(-W/2, -H/2);
        this.ctx.globalAlpha = s;
        break;
      case 'lensBlur':
        this.ctx.globalAlpha = s;
        break;
      case 'lightLeak':
        this.ctx.globalAlpha = s;
        break;
      default:
        this.ctx.globalAlpha = s;
    }
  }

  // Mantido para compatibilidade com renderVideo (transições em timestamps)
  private applyCapCutTransition(type: string, p: number, W: number, H: number) {
    this.applyProfessionalTransitionIn(type, p, W, H);
  }
}
