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
    // Otimização de filtros para cores vibrantes e pretos profundos (anti-lavado)
    switch (filter) {
      case 'elite':     return 'contrast(1.8) saturate(2.3) brightness(1.05)';
      case 'vhs':       return 'contrast(1.2) saturate(0.9) sepia(0.2) brightness(1.02)';
      case 'cinematic': return 'contrast(1.7) saturate(1.6) brightness(1.0) hue-rotate(-2deg)';
      case 'bw':        return 'contrast(1.5) grayscale(1)';
      case 'bloom':     return 'brightness(1.05) saturate(1.8) contrast(1.4)';
      case 'glitch':    return 'hue-rotate(90deg) brightness(1.1) contrast(1.6)';
      case 'ultra8k':   return 'contrast(1.9) saturate(2.5) brightness(1.0)';
      case 'dramatic':  return 'contrast(1.9) saturate(1.2) brightness(0.9)';
      case 'tealAndOrange': return 'contrast(1.5) saturate(1.9) hue-rotate(-8deg) brightness(1.0)';
      case 'vintageGold': return 'sepia(0.3) contrast(1.4) brightness(1.05) saturate(1.7)';
      case 'professional': return 'contrast(1.4) saturate(1.5) brightness(1.0)';
      case 'tiktok viral': return 'contrast(1.6) saturate(1.8) brightness(1.05)';
      default:          return 'contrast(1.5) saturate(1.7) brightness(1.05)';
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

  // ─────────────────────────────────────────────────────────────────────────
  // MOTION ANALYSIS: mede diferença de pixel entre frame atual e anterior
  // Usa canvas 32x32 para performance máxima. Retorna 0..1 (0=parado, 1=tudo mudou)
  // ─────────────────────────────────────────────────────────────────────────


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
        
        const W = isMobile ? 720 : 1080;
        const H = isMobile ? 1280 : 1920;
        this.canvas.width = W; this.canvas.height = H;
        this.auxCanvas.width = W; this.auxCanvas.height = H;

        const targetSampleRate = 44100;
        const pitchFactor = 1.0; // Não mexer na voz conforme solicitado
        let mainAudioBuffer = await this.processAudioBuffer(await (await fetch(videoUrl)).arrayBuffer(), targetSampleRate, pitchFactor);
        if (options.musicUrl) {
          const bg = await this.loadAndResampleAudio(options.musicUrl, targetSampleRate);
          const mixed = new AudioBuffer({ numberOfChannels: 2, length: Math.max(mainAudioBuffer.length, bg.length), sampleRate: targetSampleRate });
          for (let ch = 0; ch < 2; ch++) {
            const m = mainAudioBuffer.getChannelData(ch % mainAudioBuffer.numberOfChannels);
            const b = bg.getChannelData(ch % bg.numberOfChannels);
            const out = mixed.getChannelData(ch);
            for (let s = 0; s < mixed.length; s++) {
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
        let isError = false;
        const videoEncoder = new VideoEncoder({ 
          output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), 
          error: (e) => { isError = true; console.error("VideoEncoder error:", e); reject(e); } 
        });
        const baseBitrate = options.isAutoral ? 6_000_000 : 4_000_000;
        const targetBitrate = isMobile ? Math.min(baseBitrate, 2_500_000) : baseBitrate;
        videoEncoder.configure({ 
          codec: isMobile ? 'avc1.42E032' : 'avc1.4d002a',
          width: W, height: H, 
          bitrate: targetBitrate,
          latencyMode: 'quality'
        });
        const audioEncoder = new AudioEncoder({ 
          output: (chunk, meta) => muxer.addAudioChunk(chunk, meta), 
          error: (e) => { isError = true; console.error("AudioEncoder error:", e); reject(e); } 
        });
        audioEncoder.configure({ codec: 'mp4a.40.2', numberOfChannels: 2, sampleRate: 44100, bitrate: 128_000 });

        const fps = 30;
        const totalFrames = Math.floor(video.duration * fps);
        const filterCSS = this.getFilterCSS(options.filter);
        
        if (options.storeLogo && (!this.logoCache || this.logoUrl !== options.storeLogo)) {
          try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = await this.fetchAsBlob(options.storeLogo, 'image');
            await new Promise((res) => { img.onload = res; img.onerror = res; });
            this.logoCache = img;
            this.logoUrl = options.storeLogo;
          } catch (e) {}
        }

        // Inicia a reprodução nativa para evitar engasgos (stuttering) de decodificação
        video.muted = true;
        video.currentTime = 0;
        await video.play();
        
        let lastRawTime = -1;
        let i = 0;

        while (i < totalFrames) {
          if (isError) break;
          const currentTime = i / fps;
          const targetTime = currentTime % video.duration;

          // Detecta se o vídeo fez um loop (voltou para o começo)
          if (targetTime < lastRawTime || video.ended) {
             video.pause();
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
               setTimeout(onSeeked, 300); // Timeout seguro para o loop
             });
             await video.play();
          }
          lastRawTime = targetTime;

          // Sincroniza a captura com o tempo real de reprodução do vídeo
          // Isso elimina o "picotamento" pois deixamos o player nativo decodificar suavemente
          if (video.currentTime < targetTime && !video.ended) {
            await new Promise(r => requestAnimationFrame(r));
            continue; // Tenta novamente no próximo frame de tela
          }

          // Desenha no canvas auxiliar
          if (video.readyState >= 2) {
            this.auxCtx.drawImage(video, 0, 0, W, H);
          } else {
            await new Promise(r => setTimeout(r, 10));
            this.auxCtx.drawImage(video, 0, 0, W, H);
          }

          // ── RENDER FRAME ─────────────────────────────────────────────────
          this.ctx.save();
          if (options.isAutoral) {
            this.ctx.translate(W, 0);
            this.ctx.scale(-1, 1);
            // Reduzido zoom para evitar cortes excessivos e vultos
            this.ctx.translate(W/2, H/2);
            this.ctx.scale(1.03, 1.03);
            this.ctx.translate(-W/2, -H/2);
          }
          
          if (options.transition !== 'none' && options.transitionTimestamps) {
            this.applyTransitionEffect(options.transition, currentTime, options.transitionTimestamps, W, H);
          }

          this.ctx.filter = filterCSS;
          this.ctx.drawImage(this.auxCanvas, 0, 0, W, H);
          this.ctx.restore();

          // ── OVERLAYS ─────────────────────────────────────────────────────
          // Reset de segurança absoluto para que nada herde opacidade ou filtros
          this.ctx.filter = 'none';
          this.ctx.globalAlpha = 1;
          this.ctx.setTransform(1, 0, 0, 1, 0, 0);

          if (options.isAutoral) {
            const cardH = H * 0.25;
            const gradient = this.ctx.createLinearGradient(0, H - cardH, 0, H);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.3, 'rgba(0,0,0,0.85)');
            gradient.addColorStop(1, 'rgba(0,0,0,0.95)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, H - cardH, W, cardH);
            this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
            this.ctx.fillRect(W * 0.1, H - cardH + 10, W * 0.8, 2);
          } else {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(0, H * 0.82, W, H * 0.18);
          }

          if (options.script) {
            this.drawSpintaxOverlay(options.script, currentTime, W, H, options.storeSlug, video.duration, options.isAutoral);
          }

          if (options.isAutoral) {
            this.drawVignette(W, H);
            this.drawCinematicOverlay(W, H, currentTime);
            // Novos efeitos anti-algoritmo + Bloom
            this.drawRandomFlash(W, H, currentTime);
            this.drawRandomLightLeak(W, H, currentTime);
            this.drawCinematicBloom(W, H);
          }

          if (options.storeName && !options.isAutoral) {
            this.drawStoreBranding(W, H, options);
          }

          const timestamp = currentTime * 1_000_000;
          const vFrame = new VideoFrame(this.canvas, { timestamp });
          try {
            if (videoEncoder.state === 'configured') {
              videoEncoder.encode(vFrame, { keyFrame: i % 60 === 0 });
            }
          } catch (e) { isError = true; reject(e); vFrame.close(); break; }
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
            try {
              if (audioEncoder.state === 'configured') {
                audioEncoder.encode(audioData);
              }
            } catch (e) { isError = true; reject(e); audioData.close(); break; }
            audioData.close();
          }
          
          options.onProgress?.((i / totalFrames) * 100);
          
          i++; // Avança para o próximo frame

          if (i % (isMobile ? 3 : 10) === 0) await new Promise(r => setTimeout(r, 0));

          // CONTROLE DE FLUXO E ESTABILIDADE:
          // Se o encoder estiver ficando para trás (muitos frames na fila), pausamos o vídeo
          // Isso evita que o vídeo toque até o fim e a gente perca os frames intermediários.
          if (videoEncoder.encodeQueueSize > 5) {
            video.pause();
            while (videoEncoder.encodeQueueSize > 2) {
              await new Promise(r => setTimeout(r, 20));
            }
            await video.play();
          }
        }

        if (!isError) {
          await videoEncoder.flush();
          await audioEncoder.flush();
          muxer.finalize();
          resolve(new Blob([muxer.target.buffer], { type: 'video/mp4' }));
        } else {
          reject(new Error("Erro durante o processamento do vídeo (Mobile Safety)"));
        }
      } catch (err) { reject(err); }
    });
  }

  private async extractFrames(videoUrl: string, count: number = 10): Promise<ImageBitmap[]> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = async () => {
        try {
          const frames: ImageBitmap[] = [];
          const duration = video.duration;
          // Evitar o exato início e fim para pegar cenas melhores
          const startOffset = duration * 0.1;
          const endOffset = duration * 0.9;
          const usableDuration = endOffset - startOffset;
          const interval = usableDuration / (count - 1);

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = video.videoWidth;
          tempCanvas.height = video.videoHeight;
          const tCtx = tempCanvas.getContext('2d', { alpha: false })!;

          for (let i = 0; i < count; i++) {
            video.currentTime = startOffset + (i * interval);
            await new Promise(r => {
              const onSeeked = () => {
                video.removeEventListener('seeked', onSeeked);
                r(null);
              };
              video.addEventListener('seeked', onSeeked);
            });
            
            tCtx.drawImage(video, 0, 0);
            // Reduzir tamanho dos bitmaps extraídos no mobile para economizar RAM
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
            if (isMobile) {
              const bW = 720;
              const bH = (video.videoHeight / video.videoWidth) * bW;
              frames.push(await createImageBitmap(tempCanvas, 0, 0, video.videoWidth, video.videoHeight, { resizeWidth: bW, resizeHeight: bH }));
            } else {
              frames.push(await createImageBitmap(tempCanvas));
            }
            // Pequena pausa para o GC respirar entre extrações
            if (i % 3 === 0) await new Promise(r => setTimeout(r, 10));
          }
          
          video.src = "";
          video.load();
          resolve(frames);
        } catch (e) {
          reject(e);
        }
      };
      
      video.onerror = (e) => reject(new Error("Falha ao carregar vídeo para extração de frames"));
    });
  }

  public async renderAutoralSlideshow(videoUrl: string, options: ProcessingOptions): Promise<Blob> {
    const frames = await this.extractFrames(videoUrl, 12); // Aumentado para mais dinamismo
    // Extrair áudio original para manter a voz no slideshow
    const audioBuffer = await this.loadAndResampleAudio(videoUrl, 44100);
    return this.renderSlideshowFromBitmaps(frames, options, audioBuffer);
  }

  private async renderSlideshowFromBitmaps(imgs: ImageBitmap[], options: ProcessingOptions, originalAudio?: AudioBuffer): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
        
        // Mobile Optimization: Downscale if on mobile to prevent OOM (Out of Memory)
        const W = isMobile ? 720 : 1080;
        const H = isMobile ? 1280 : 1920;
        const bitrate = isMobile ? 2_500_000 : 6_000_000;
        const fps = 30;
        
        console.log(`[VideoProcessor] Renderizando Slideshow (${W}x${H}) @ ${bitrate/1000000}Mbps | Mobile: ${isMobile}`);

        this.canvas.width = W;
        this.canvas.height = H;
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        const targetDuration = originalAudio ? Math.max(originalAudio.duration, 5) : 25; // Sincroniza com áudio original se existir
        const totalFrames = Math.floor(targetDuration * fps);
        const slideDuration = targetDuration / imgs.length;
        const filterCSS = this.getFilterCSS(options.filter || 'cinematic');

        const muxer = new Muxer({ 
          target: new ArrayBufferTarget(), 
          video: { codec: 'avc', width: W, height: H }, 
          audio: { codec: 'aac', numberOfChannels: 2, sampleRate: 44100 }, 
          fastStart: 'in-memory'
        });
        
        let isError = false;
        const videoEncoder = new VideoEncoder({
          output: (chunk, metadata) => muxer.addVideoChunk(chunk, metadata),
          error: (e) => { isError = true; console.error("VideoEncoder error:", e); reject(e); }
        });
        videoEncoder.configure({
          codec: 'avc1.42E032', // Baseline profile para máxima compatibilidade mobile
          width: W,
          height: H,
          bitrate: bitrate,
          latencyMode: 'quality'
        });
        
        const audioEncoder = new AudioEncoder({ 
          output: (chunk, meta) => muxer.addAudioChunk(chunk, meta), 
          error: (e) => { isError = true; console.error("AudioEncoder error:", e); reject(e); } 
        });
        audioEncoder.configure({ codec: 'mp4a.40.2', numberOfChannels: 2, sampleRate: 44100, bitrate: 128_000 });

        let audioBuffer = originalAudio;
        if (options.musicUrl) {
          const bg = await this.loadAndResampleAudio(options.musicUrl, 44100, options.musicBpm, options.musicGenre);
          if (originalAudio) {
            // Mixar voz original com música de fundo
            const mixed = new AudioBuffer({ numberOfChannels: 2, length: Math.max(originalAudio.length, bg.length), sampleRate: 44100 });
            for (let ch = 0; ch < 2; ch++) {
              const m = originalAudio.getChannelData(ch % originalAudio.numberOfChannels);
              const b = bg.getChannelData(ch % bg.numberOfChannels);
              const out = mixed.getChannelData(ch);
              for (let s = 0; s < mixed.length; s++) {
                out[s] = (m[s] || 0) * 1.0 + (b[s % b.length] || 0) * 0.3; // Voz 100% + Música 30%
              }
            }
            audioBuffer = mixed;
          } else {
            audioBuffer = bg;
          }
        } else if (!audioBuffer) {
           audioBuffer = await this.loadAndResampleAudio('', 44100); // Silêncio se nada houver
        }

        // Pre-selecionar transições para cada slide para consistência
        const transitionTypes = ['zoomBurst', 'whipRight', 'scaleDown', 'pushUp', 'crossFade'];
        const slideTransitions = imgs.map(() => transitionTypes[Math.floor(Math.random() * transitionTypes.length)]);
        const kbDirections = imgs.map(() => Math.random() > 0.5 ? 1 : -1);

        for (let i = 0; i < totalFrames; i++) {
          if (isError) break;
          const currentTime = i / fps;
          const slideIdx = Math.min(Math.floor(currentTime / slideDuration), imgs.length - 1);
          const img = imgs[slideIdx];
          const progress = (currentTime % slideDuration) / slideDuration;

          this.ctx.fillStyle = '#000';
          this.ctx.fillRect(0, 0, W, H);

          const fadeTime = 0.4; // Transição mais rápida para cortes perfeitos
          const isTransitioning = (currentTime % slideDuration) < fadeTime && slideIdx > 0;
          const transProgress = (currentTime % slideDuration) / fadeTime;
          const currentTrans = slideTransitions[slideIdx];

          // Desenhar Slide Anterior (se em transição)
          if (isTransitioning) {
            const prevImg = imgs[slideIdx - 1];
            this.ctx.save();
            const prevScale = Math.max(W / prevImg.width, H / prevImg.height) * (1.12 + (kbDirections[slideIdx-1] * 0.05));
            this.applyProfessionalTransitionOut(currentTrans, transProgress, W, H);
            this.ctx.filter = filterCSS;
            this.ctx.drawImage(prevImg, (W - prevImg.width * prevScale)/2, (H - prevImg.height * prevScale)/2, prevImg.width * prevScale, prevImg.height * prevScale);
            this.ctx.restore();
          }

          // Desenhar Slide Atual
          this.ctx.save();
          if (isTransitioning) {
            this.applyProfessionalTransitionIn(currentTrans, transProgress, W, H);
          }

          const baseScale = Math.max(W / img.width, H / img.height);
          // Imagem parada conforme solicitado para evitar vultos e desfoque de movimento
          const kbScale = 1.05;
          
          const sw = img.width * baseScale * kbScale;
          const sh = img.height * baseScale * kbScale;
          const sx = (W - sw) / 2;
          const sy = (H - sh) / 2;

          this.ctx.filter = filterCSS;
          this.ctx.drawImage(img, sx, sy, sw, sh);
          this.ctx.restore();

          // Overlays e Partículas (Premium)
          this.ctx.globalAlpha = 1;
          this.ctx.filter = 'none';
          
          if (options.script) {
            this.drawSpintaxOverlay(options.script, currentTime, W, H, options.storeSlug, targetDuration, true);
          }
          
          this.drawVignette(W, H);
          this.drawParticles(W, H, currentTime);
          this.drawCinematicOverlay(W, H, currentTime);
          
          // Novos efeitos anti-algoritmo + Bloom
          this.drawRandomFlash(W, H, currentTime);
          this.drawRandomLightLeak(W, H, currentTime);
          this.drawCinematicBloom(W, H);
          
          this.drawProgressBar(W, H, currentTime, targetDuration);

          // Frame output
          const timestamp = currentTime * 1_000_000;
          const vFrame = new VideoFrame(this.canvas, { timestamp });
          try {
            if (videoEncoder.state === 'configured') {
              videoEncoder.encode(vFrame, { keyFrame: i % 30 === 0 });
            }
          } catch (e) { isError = true; reject(e); vFrame.close(); break; }
          vFrame.close();

          if (audioBuffer && !isError) {
            const start = Math.floor(i * (44100 / fps));
            const len = Math.floor(44100 / fps);
            const aData = new Float32Array(len * 2);
            for (let ch = 0; ch < 2; ch++) {
              const src = audioBuffer.getChannelData(ch);
              for (let s = 0; s < len; s++) {
                // Removemos o loop (%) para evitar que a voz repita. 
                // A música de fundo já foi mixada com loop no 'mixed' buffer.
                aData[ch * len + s] = src[start + s] || 0;
              }
            }
            const audioData = new AudioData({ format: 'f32-planar', sampleRate: 44100, numberOfFrames: len, numberOfChannels: 2, timestamp, data: aData });
            try {
              if (audioEncoder.state === 'configured') {
                audioEncoder.encode(audioData);
              }
            } catch (e) { isError = true; reject(e); audioData.close(); break; }
            audioData.close();
          }

          if (i % (isMobile ? 15 : 30) === 0) options.onProgress?.((i / totalFrames) * 100);
          
          const maxQueueSize = isMobile ? 5 : 12;
          if (videoEncoder.encodeQueueSize > maxQueueSize) {
            if (isMobile) {
              await new Promise(r => requestAnimationFrame(r));
            } else {
              await new Promise(r => setTimeout(r, 10));
            }
          }
          
          if (i % (isMobile ? 3 : 10) === 0) await new Promise(r => setTimeout(r, 0));
        }

        await videoEncoder.flush();
        await audioEncoder.flush();
        muxer.finalize();
        resolve(new Blob([muxer.target.buffer], { type: 'video/mp4' }));
      } catch (err) { 
        reject(err); 
      } finally {
        imgs.forEach(img => {
          try { img.close(); } catch(e) {}
        });
      }
    });
  }

  public async renderSlideshow(imageUrls: string[], options: ProcessingOptions, price: string, productName: string): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const W = isMobile ? 720 : 1080; 
        const H = isMobile ? 1280 : 1920;
        this.canvas.width = W; this.canvas.height = H;
        let isError = false;

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

        const bitrate = isMobile ? 2_500_000 : 6_000_000;
        const muxer = new Muxer({ 
          target: new ArrayBufferTarget(), 
          video: { codec: 'avc', width: W, height: H }, 
          audio: { codec: 'aac', numberOfChannels: 2, sampleRate: 44100 }, 
          fastStart: 'in-memory',
          firstTimestampBehavior: 'offset' 
        });
        const videoEncoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => console.error(e) });
        // Baseline profile para máxima compatibilidade mobile
        videoEncoder.configure({
          codec: 'avc1.42E032',
          width: W,
          height: H,
          bitrate: bitrate,
          latencyMode: 'quality'
        });
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
          if (isError) break;
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
          const FADE_DURATION = 0.35; // Transição mais curta para corte perfeito e seco
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
              const kbNext = 1.05;
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
            const kbScale2 = 1.05;
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
              const kbPrev = 1.05;
              const sxPrev = (W - prevImg.width * bsPrev * kbPrev) / 2;
              const syPrev = (H - prevImg.height * bsPrev * kbPrev) / 2;
              this.ctx.globalAlpha = 1;
              this.ctx.filter = filterCSS;
              this.ctx.drawImage(prevImg, sxPrev, syPrev, prevImg.width * bsPrev * kbPrev, prevImg.height * bsPrev * kbPrev);
            }

            // Slide atual entrando com efeito
            this.applyProfessionalTransitionIn(nextTransition, easedIn, W, H);
            const baseScale3 = Math.max(W / img.width, H / img.height);
            const kbScale3 = 1.05;
            const sx3 = (W - img.width * baseScale3 * kbScale3) / 2;
            const sy3 = (H - img.height * baseScale3 * kbScale3) / 2;
            this.ctx.filter = filterCSS;
            this.ctx.drawImage(img, sx3, sy3, img.width * baseScale3 * kbScale3, img.height * baseScale3 * kbScale3);

          } else {
            // Slide estável: Ken Burns suave
            const baseScale = Math.max(W / img.width, H / img.height);
            const kbScale = 1.05;
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
          try {
            if (videoEncoder.state === 'configured') {
              videoEncoder.encode(vFrame, { keyFrame: i % 60 === 0 });
            }
          } catch (e) { isError = true; reject(e); vFrame.close(); break; }
          vFrame.close();

          const maxQueueSize = isMobile ? 5 : 12;
          if (videoEncoder.encodeQueueSize > maxQueueSize) {
            if (isMobile) {
              await new Promise(r => requestAnimationFrame(r));
            } else {
              await new Promise(r => setTimeout(r, 10));
            }
          }

          if (i % (isMobile ? 3 : 10) === 0) await new Promise(r => setTimeout(r, 0));

          if (audioBuffer) {
            const start = Math.floor(i * (44100 / fps));
            const len = Math.floor(44100 / fps);
            const aData = new Float32Array(len * 2);
            for (let ch = 0; ch < 2; ch++) {
              const src = audioBuffer.getChannelData(ch);
              for (let s = 0; s < len; s++) {
                // No modo viral, se o áudio acabar, melhor silêncio do que voz repetida.
                aData[ch * len + s] = src[start + s] || 0;
              }
            }
            const audioData = new AudioData({ format: 'f32-planar', sampleRate: 44100, numberOfFrames: len, numberOfChannels: 2, timestamp, data: aData });
            try {
              if (audioEncoder.state === 'configured') {
                audioEncoder.encode(audioData);
              }
            } catch (e) { isError = true; reject(e); audioData.close(); break; }
            audioData.close();
          }
          options.onProgress?.((i / totalFrames) * 100);
        }

        await videoEncoder.flush();
        await audioEncoder.flush();
        muxer.finalize();
        resolve(new Blob([muxer.target.buffer], { type: 'video/mp4' }));
      } catch (err) { 
        reject(err); 
      } finally {
        imgs.forEach(img => {
          try { img.close(); } catch(e) {}
        });
      }
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
    const rectY = H * 0.76; // Ajustado mais para baixo para não tapar o produto no centro

    // Aplicar Transformação de Pop + Pequena variação aleatória para cada vídeo (Anti-Algoritmo)
    const spintaxOffset = isAutoral ? (Math.sin(time * 100) * 0.5) : 0;
    this.ctx.translate(W/2 + spintaxOffset, rectY + rectH/2 + spintaxOffset);
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
    
    const gradient = this.ctx.createRadialGradient(W / 2, H / 2, W * 0.25, W / 2, H / 2, W * 1.05);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
    
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
    gradient.addColorStop(0, 'rgba(255, 120, 0, 0.08)');
    gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.03)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, W, H);
    this.ctx.restore();
  }

  private drawParticles(W: number, H: number, time: number) {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.globalCompositeOperation = 'screen';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    
    // 25 partículas flutuantes
    for (let i = 0; i < 25; i++) {
      const seed = i * 13.5;
      const x = ((Math.sin(time * 0.2 + seed) * 0.5 + 0.5) * W);
      const y = ((Math.cos(time * 0.15 + seed * 0.8) * 0.5 + 0.5) * H);
      const size = Math.abs(Math.sin(time * 0.5 + seed)) * 4 + 1;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  private drawProgressBar(W: number, H: number, time: number, duration: number) {
    const progress = time / duration;
    const barH = 6;
    
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Fundo da barra
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.fillRect(0, H - barH, W, barH);
    
    // Progresso
    const grad = this.ctx.createLinearGradient(0, 0, W * progress, 0);
    grad.addColorStop(0, '#10b981'); // Emerald 500
    grad.addColorStop(1, '#34d399'); // Emerald 400
    
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, H - barH, W * progress, barH);
    
    // Glow no final do progresso
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#10b981';
    this.ctx.fillRect(W * progress - 2, H - barH, 2, barH);
    
    this.ctx.restore();
  }

  private drawRandomFlash(W: number, H: number, time: number) {
    // Flash ocorre a cada ~3-4 segundos de forma semi-aleatória
    const flashFreq = 3.5;
    const flashDur = 0.08;
    const isFlash = (time % flashFreq) < flashDur;
    
    if (isFlash) {
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      const intensity = 1 - (time % flashFreq) / flashDur;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.4})`;
      this.ctx.fillRect(0, 0, W, H);
      this.ctx.restore();
    }
  }

  private drawRandomLightLeak(W: number, H: number, time: number) {
    // Vazamento de luz que muda de cor e posição lentamente
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.globalCompositeOperation = 'screen';
    
    const colors = [
      'rgba(255, 100, 0, 0.08)', // Laranja
      'rgba(0, 200, 255, 0.05)', // Azul
      'rgba(255, 0, 255, 0.04)', // Magenta
      'rgba(255, 255, 0, 0.06)'  // Amarelo
    ];
    
    const colorIdx = Math.floor((time / 4) % colors.length);
    const x = (Math.sin(time * 0.4) * 0.5 + 0.5) * W;
    const y = (Math.cos(time * 0.3) * 0.5 + 0.5) * H;
    
    const grad = this.ctx.createRadialGradient(x, y, 0, x, y, W * 1.2);
    grad.addColorStop(0, colors[colorIdx]);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, W, H);
    this.ctx.restore();
  }

  private drawCinematicBloom(W: number, H: number) {
    // Adiciona um brilho suave (bloom) nas partes claras do vídeo
    // Reduzido para 0.04 para evitar aspecto "lavado/esbranquiçado"
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.globalCompositeOperation = 'screen';
    this.ctx.globalAlpha = 0.04;
    
    // Gradiente central para simular bloom de lente
    const grad = this.ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    this.ctx.fillStyle = grad;
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
