import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import type { ViralScript } from './viralScriptGenerator';

export interface ProcessingOptions {
  filter: string;
  legend: string;
  isMuted: boolean;
  transition: 'zoom' | 'flash' | 'slide' | 'beat' | 'blur' | 'shake' | 'rotate' | 'fire' | 'glitch' | 'whipDown' | 'zoomBlur' | 'glassSplit' | 'colorBurn' | 'none';
  transitionList?: ('zoom' | 'flash' | 'slide' | 'beat' | 'blur' | 'shake' | 'rotate' | 'fire' | 'glitch' | 'whipDown' | 'zoomBlur' | 'glassSplit' | 'colorBurn' | 'wave' | 'spiral' | 'pixelate' | 'none')[];
  videoId?: string;
  trimStart?: number;
  trimEnd?: number;
  transitionTimestamps?: number[];
  existingVideoEl?: HTMLVideoElement;
  musicUrl?: string;
  audioMixMode?: 'original' | 'music' | 'mix' | 'mute';
  script?: ViralScript;
  storeSlug?: string;
}

export class VideoProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private auxCanvas: HTMLCanvasElement;
  private auxCtx: CanvasRenderingContext2D;
  private ownedVideo: HTMLVideoElement;
  private stream: MediaStream | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.auxCanvas = document.createElement('canvas');
    this.auxCtx = this.auxCanvas.getContext('2d')!;
    this.ownedVideo = document.createElement('video');
    this.ownedVideo.muted = false;
    this.ownedVideo.playsInline = true;
  }

  private getFilterCSS(filter: string): string {
    switch (filter) {
      case 'elite':     return 'contrast(1.35) saturate(1.7) brightness(1.15)';
      case 'vhs':       return 'contrast(0.9) saturate(0.55) sepia(0.3) brightness(1.1) blur(0.8px)';
      case 'cinematic': return 'contrast(1.3) saturate(1.1) brightness(1.05) hue-rotate(-5deg)';
      case 'bw':        return 'grayscale(1) contrast(1.5) brightness(1.05)';
      case 'bloom':     return 'brightness(1.2) saturate(1.3)';
      case 'glitch':    return 'hue-rotate(90deg) brightness(1.2) contrast(1.25)';
      case 'ultra8k':   return 'contrast(1.4) saturate(1.8) brightness(1.12) drop-shadow(0 0 12px rgba(6, 182, 212, 0.25))';
      case 'dramatic':  return 'contrast(1.5) saturate(0.9) brightness(0.9) sepia(0.1)';
      case 'tealAndOrange': return 'contrast(1.2) saturate(1.4) hue-rotate(-10deg) sepia(0.1) brightness(1.1)';
      case 'vintageGold': return 'sepia(0.4) contrast(1.1) brightness(1.1) saturate(1.3)';
      default:          return 'contrast(1.08) saturate(1.08)';
    }
  }

  private async fetchAsBlob(url: string, type: 'image' | 'video' = 'video'): Promise<string> {
    const PROXY_BASE = 'https://vzydpqilvyjqjbhzgzhq.supabase.co/functions/v1/video-proxy';
    
    // PRIORIDADE 1: Proxy Interno (Evita CORS e 403)
    const proxies = [
      (u: string) => u.includes(PROXY_BASE) ? u : `${PROXY_BASE}?url=${encodeURIComponent(u)}`,
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    ];

    // Se for imagem da shopee, tenta carregar
    for (const proxyFn of proxies) {
      try {
        const targetUrl = proxyFn(url);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s para garantir imagens pesadas
        
        console.log(`[VideoProcessor] Tentando carregar: ${targetUrl}`);
        const res = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 100) {
            console.log(`[VideoProcessor] Sucesso: ${url}`);
            return URL.createObjectURL(blob);
          }
        }
      } catch (e) {
        console.warn(`[VideoProcessor] Falha no proxy para ${url}`);
      }
    }
    return url;
  }



  private generateSyntheticBeat(sampleRate: number, bpm: number = 128, durationSec: number = 35, genre: string = 'house'): AudioBuffer {
  // Beat sintetico com variacao por genero (house/phonk/funk/lofi/trap)
    const buf = new AudioBuffer({ numberOfChannels: 2, length: sampleRate * durationSec, sampleRate });
    const L = buf.getChannelData(0);
    const R = buf.getChannelData(1);
    const spb = (60 / bpm) * sampleRate; // samples per beat
    const totalBeats = Math.floor(sampleRate * durationSec / spb);

    // Padroes de bateria por genero (16 passos = 1 compasso)
    const patterns: Record<string, { kick: number[], snare: number[], hihat: number[], bass: number[] }> = {
      'house':  { kick:  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], snare: [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hihat: [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], bass: [60,0,0,0,0,0,0,65,0,0,0,0,0,0,0,0] },
      'phonk':  { kick:  [1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,0], snare: [0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], hihat: [1,0,1,1,0,1,0,1,1,0,1,1,0,1,0,1], bass: [55,0,0,55,0,0,69,0,55,0,0,55,0,0,73,0] },
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

      // KICK: sine sweep grave
      if (p.kick[pat]) {
        [L, R].forEach(ch => {
          for (let s = 0; s < stepLen && (off + s) < ch.length; s++) {
            const env = Math.exp(-s / (sampleRate * 0.055));
            const freq = 80 + 150 * Math.exp(-s / (sampleRate * 0.025));
            ch[off + s] += Math.sin(2 * Math.PI * freq * s / sampleRate) * env * 0.75;
          }
        });
      }

      // SNARE: ruido + harmonico
      if (p.snare[pat]) {
        [L, R].forEach(ch => { addNoise(ch, off, Math.floor(sampleRate * 0.12), 0.55, sampleRate * 0.04); });
        [L, R].forEach(ch => { addSine(ch, off, 200, Math.floor(sampleRate * 0.1), 0.2, sampleRate * 0.03); });
      }

      // HIHAT: ruido agudo breve
      if (p.hihat[pat]) {
        const hhDur = genre === 'trap' ? Math.floor(sampleRate * 0.04) : Math.floor(stepLen / 3);
        [L, R].forEach(ch => { addNoise(ch, off, hhDur, 0.18, sampleRate * 0.008); });
      }

      // BASS: nota sinusoidal grave (nota MIDI ? Hz)
      const bassNote = p.bass[pat];
      if (bassNote > 0) {
        const bassFreq = 440 * Math.pow(2, (bassNote - 69) / 12);
        const bassDur = Math.floor(stepLen * 3.5);
        [L, R].forEach(ch => { addSine(ch, off, bassFreq, bassDur, 0.35, sampleRate * 0.18); });
        // Harm�nico do baixo (oitava + quinta)
        [L, R].forEach(ch => { addSine(ch, off, bassFreq * 2, bassDur, 0.08, sampleRate * 0.10); });
      }
    }

    // LoFi: adicionar crackle de vinil
    if (genre === 'lofi') {
      for (let s = 0; s < L.length; s++) {
        if (Math.random() < 0.003) { L[s] += (Math.random() - 0.5) * 0.12; R[s] += (Math.random() - 0.5) * 0.12; }
      }
    }

    // Normalizar para evitar clipping
    let mx = 0;
    for (let i = 0; i < L.length; i++) mx = Math.max(mx, Math.abs(L[i]), Math.abs(R[i]));
    if (mx > 0.9) {
      const gain = 0.88 / mx;
      for (let i = 0; i < L.length; i++) { L[i] *= gain; R[i] *= gain; }
    }
    return buf;
  }


  private async loadAndResampleAudio(url: string, targetSampleRate: number, bpm: number = 128, genre: string = 'house'): Promise<AudioBuffer> {
    const SUPABASE_PROXY = 'https://vzydpqilvyjqjbhzgzhq.supabase.co/functions/v1/video-proxy';
    
    // 1. Detecta URLs locais/blob e busca direto (Ignora Proxy)
    if (url.startsWith('blob:') || url.startsWith('http://localhost') || url.startsWith('/')) {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        return this.processAudioBuffer(arrayBuffer, targetSampleRate);
      } catch (e) {
        console.warn("[Audio] Falha ao carregar áudio local direto:", e);
      }
    }

    const proxies = [
      `${SUPABASE_PROXY}?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    ];

    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl, { cache: 'no-store' });
        if (!response.ok) continue;
        return this.processAudioBuffer(arrayBuffer, targetSampleRate);
      } catch (e) {
        console.warn(`[Audio] Proxy falhou: ${proxyUrl.substring(0, 50)}`);
      }
    }

  }

  private async processAudioBuffer(arrayBuffer: ArrayBuffer, targetSampleRate: number): Promise<AudioBuffer> {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    try {
      const originalBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
      if (originalBuffer.sampleRate === targetSampleRate) {
        return originalBuffer;
      }
      const offlineCtx = new OfflineAudioContext(
        originalBuffer.numberOfChannels,
        Math.ceil(originalBuffer.duration * targetSampleRate),
        targetSampleRate
      );
      const src = offlineCtx.createBufferSource();
      src.buffer = originalBuffer;
      src.connect(offlineCtx.destination);
      src.start();
      const resampled = await offlineCtx.startRendering();
      return resampled;
    } finally {
      await audioCtx.close();
    }
  }


  public async renderVideo(videoUrl: string, options: ProcessingOptions): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        let video: HTMLVideoElement;
        let blobUrl: string | null = null;
        let useExisting = false;

        if (options.existingVideoEl && options.existingVideoEl.readyState >= 2) {
          try {
            const testC = document.createElement('canvas');
            testC.width = 1; testC.height = 1;
            const testCtx = testC.getContext('2d')!;
            testCtx.drawImage(options.existingVideoEl, 0, 0, 1, 1);
            testCtx.getImageData(0, 0, 1, 1);
            useExisting = true;
          } catch (e) {
            console.warn("Video UI bloqueado por CORS. Usando fallback via Proxy.");
            useExisting = false;
          }
        }

        let wasMuted = false;
        let wasVolume = 1;

        if (useExisting && options.existingVideoEl) {
          video = options.existingVideoEl;
          video.loop = false;
          const wasPaused = video.paused;
          wasMuted = video.muted;
          wasVolume = video.volume;
          video.muted = false;
          video.volume = 1;
          video.currentTime = options.trimStart || 0;
          await new Promise<void>(r => { video.onseeked = () => r(); setTimeout(r, 1500); });
          if (wasPaused) video.pause();
        } else {
          video = this.ownedVideo;
          const sourceUrl = await this.fetchAsBlob(videoUrl, 'video');
          blobUrl = sourceUrl.startsWith('blob:') ? sourceUrl : null;
          video.crossOrigin = blobUrl ? '' : 'anonymous';
          video.src = sourceUrl;
          const timeout = setTimeout(() => reject(new Error('Timeout')), 25000);
          await new Promise<void>((res, rej) => {
            video.onloadedmetadata = () => { clearTimeout(timeout); res(); };
            video.onerror = () => { clearTimeout(timeout); rej(new Error('CORS')); };
          });
          video.currentTime = options.trimStart || 0;
          await new Promise<void>(r => { video.onseeked = () => r(); });
        }

        const vW = video.videoWidth;
        const vH = video.videoHeight;
        if (!vW || !vH) { reject(new Error('Dimensões inválidas')); return; }

        // MODO 8K / ESTABILIDADE MOBILE
        // Se ultra8k, miramos em 1080p (Full HD de cinema). Se normal, 720p (Segurança Mobile).
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isUltra = options.filter === 'ultra8k' && !isMobile; // Desativar 8K real no mobile para estabilidade
        const targetH = isUltra ? 1920 : (isMobile ? 720 : 1280);
        
        let scale = targetH / vH;
        // Impedir upscale exagerado que trava o Chrome Mobile
        if (scale > 2.5) scale = 2.5; 
        if (isMobile && scale > 1.2) scale = 1.2; // Mais conservador no Mobile

        const W = Math.floor((vW * scale) / 2) * 2;
        const H = Math.floor((vH * scale) / 2) * 2;
        
        this.canvas.width = W;
        this.canvas.height = H;
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        this.auxCanvas.width = W;
        this.auxCanvas.height = H;
        this.auxCtx.imageSmoothingEnabled = true;
        this.auxCtx.imageSmoothingQuality = 'low';

        video.muted = true; // Mute original to avoid conflict
        video.pause(); // IMPORTANT: Pause UI playback to allow deterministic seeking
        
        // 1. Setup determinístico de Áudio (Sync Perfeito)
        let mainAudioBuffer: AudioBuffer | null = null;
        const targetSampleRate = 44100;
        
        if (!options.isMuted) {
          try {
            // Pegar o áudio do próprio vídeo original (essencial para vídeos autorais)
            mainAudioBuffer = await this.loadAndResampleAudio(videoUrl, targetSampleRate);
            
            // Se tiver música de fundo, precisamos mixar
            if (options.musicUrl && (options.audioMixMode === 'mix' || options.audioMixMode === 'music')) {
              const bgMusicBuffer = await this.loadAndResampleAudio(options.musicUrl, targetSampleRate);
              // Lógica de mixagem simples (soma ponderada)
              const mixed = new AudioBuffer({ 
                numberOfChannels: 2, 
                length: Math.max(mainAudioBuffer.length, bgMusicBuffer.length), 
                sampleRate: targetSampleRate 
              });
              
              const mGain = options.audioMixMode === 'mix' ? 0.4 : 0;
              const bgGain = options.audioMixMode === 'mix' ? 0.8 : 1.0;

              for (let ch = 0; ch < 2; ch++) {
                const mCh = mainAudioBuffer.getChannelData(ch % mainAudioBuffer.numberOfChannels);
                const bgCh = bgMusicBuffer.getChannelData(ch % bgMusicBuffer.numberOfChannels);
                const outCh = mixed.getChannelData(ch);
                for (let s = 0; s < mixed.length; s++) {
                  const mVal = s < mCh.length ? mCh[s] : 0;
                  const bgVal = bgCh[s % bgCh.length]; // Loop background
                  outCh[s] = (mVal * mGain) + (bgVal * bgGain);
                }
              }
              mainAudioBuffer = mixed;
            }
          } catch (audioErr) {
            console.warn("Falha ao preparar buffer de áudio deterministicamente.");
          }
        }

        this.stream = this.canvas.captureStream(30); 
        let audioTrackToEncode: MediaStreamTrack | null = null;

        const muxer = new Muxer({
          target: new ArrayBufferTarget(),
          video: { codec: 'avc', width: W, height: H },
          audio: { codec: 'aac', numberOfChannels: 2, sampleRate: 44100 },
          fastStart: 'in-memory',
          firstTimestampBehavior: 'offset'
        });

        const videoEncoder = new VideoEncoder({
          output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
          error: () => console.error("Erro no video encoder")
        });

        const isMobileBitrate = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const targetBitrate = isUltra ? 12_000_000 : (isMobileBitrate ? 3_500_000 : 7_000_000);

        videoEncoder.configure({
          codec: 'avc1.4d0033', // High Profile, Level 5.1
          width: W,
          height: H,
          bitrate: targetBitrate,
          avc: { format: 'avc' }
        });

        // Áudio Encoder Setup (AAC)
        const audioEncoder = new AudioEncoder({
          output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
          error: (e) => console.error("Erro no audio encoder", e)
        });

        audioEncoder.configure({
          codec: 'mp4a.40.2', 
          numberOfChannels: 2,
          sampleRate: 44100,
          bitrate: 128_000
        });

        const filterCSS = this.getFilterCSS(options.filter || 'none');
        const transition = options.transition || 'none';
        const transitionTs = options.transitionTimestamps || [];

        // LOOP DETERMINÍSTICO (Estabilidade Android)
        // Em vez de requestAnimationFrame, processamos frame por frame manual
        const fps = 30;
        const frameInterval = 1 / fps;
        let currentTime = video.currentTime;
        const startTime = video.currentTime;
        const duration = (options.trimEnd || video.duration) - startTime;
        const totalFramesToRender = Math.floor(duration * fps);

        const renderLoop = async () => {
          for (let i = 0; i <= totalFramesToRender; i++) {
            if (videoEncoder.state !== 'configured') break;

            currentTime = startTime + (i * frameInterval);
            
            // Força o vídeo para o tempo exato e espera o processamento
            video.currentTime = currentTime;
            await new Promise<void>(res => {
              let resolved = false;
              const onSeeked = () => {
                if (resolved) return;
                resolved = true;
                video.removeEventListener('seeked', onSeeked);
                res();
              };
              video.addEventListener('seeked', onSeeked);
              // Fallback para não travar infinitamente (aumentado para mobile lento)
              setTimeout(() => {
                if (!resolved) {
                  resolved = true;
                  video.removeEventListener('seeked', onSeeked);
                  res();
                }
              }, isMobile ? 1500 : 600); 
            });

            this.auxCtx.clearRect(0, 0, W, H);
            this.auxCtx.drawImage(video, 0, 0, W, H);
            this.ctx.clearRect(0, 0, W, H);
            
            // --- LÓGICA DE LIMPEZA AUTORAL PRO (CROP & CONCEAL) ---
            this.ctx.save();
            
            // 1. Mirroring (Espelhamento para conteúdo único)
            this.ctx.translate(W, 0);
            this.ctx.scale(-1, 1);
            
            // 2. Safe-Zone Zoom (De 1.02x para 1.15x para remover legendas nas bordas)
            const sOffset = 1.15;
            
            // 3. Vertical Offset: Empurra o vídeo 5% para cima (legendas originais costumam estar embaixo)
            const vShift = H * 0.05; 
            
            this.ctx.translate(W * (1 - sOffset) / 2, (H * (1 - sOffset) / 2) - vShift);
            this.ctx.scale(sOffset, sOffset);
            
            this.ctx.filter = filterCSS;
            this.ctx.drawImage(this.auxCanvas, 0, 0, W, H);
            this.ctx.restore();

            // 4. Gradient Mask (Esconde resquícios na base e melhora estética)
            const bottomGrad = this.ctx.createLinearGradient(0, H * 0.8, 0, H);
            bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
            bottomGrad.addColorStop(1, 'rgba(0,0,0,0.5)'); // Escurece a base para esconder texto original
            this.ctx.fillStyle = bottomGrad;
            this.ctx.fillRect(0, H * 0.8, W, H * 0.2);
            // ------------------------------------------------------

            this.ctx.filter = 'none';

            if (options.script) {
              this.drawSpintaxOverlay(options.script, currentTime - startTime, W, H, options.storeSlug, duration);
            }

            const isTransition = transitionTs.some(t => currentTime >= t && currentTime < t + 1.2);
            if (isTransition) this.applyTransitionEffect(transition, currentTime, transitionTs, W, H);

            const timestamp = (currentTime - startTime) * 1_000_000;
            const frame = new VideoFrame(this.canvas, { timestamp });
            
            try {
              videoEncoder.encode(frame, { keyFrame: i % 45 === 0 });
              
              // 2. Encode Audio Chunk (Sync Determinístico)
              if (mainAudioBuffer && audioEncoder.state === 'configured') {
                const samplesPerFrame = targetSampleRate / fps;
                const startSample = Math.floor(i * samplesPerFrame);
                const numSamples = Math.floor(samplesPerFrame);
                
                if (startSample < mainAudioBuffer.length) {
                  const audioData = new Float32Array(numSamples * 2);
                  for (let channel = 0; channel < 2; channel++) {
                    const chData = mainAudioBuffer.getChannelData(channel % mainAudioBuffer.numberOfChannels);
                    for (let s = 0; s < numSamples; s++) {
                      const sampleIdx = startSample + s;
                      audioData[s * 2 + channel] = sampleIdx < chData.length ? chData[sampleIdx] : 0;
                    }
                  }

                  const aData = new AudioData({
                    format: 'f32-planar',
                    sampleRate: targetSampleRate,
                    numberOfFrames: numSamples,
                    numberOfChannels: 2,
                    timestamp: timestamp, 
                    data: audioData
                  });

                  audioEncoder.encode(aData);
                  aData.close();
                }
              }
            } catch (e) {
              console.error("Erro ao codificar frame:", e);
            } finally {
              frame.close();
            }

            // Reporta algum progresso se necessário ou cede CPU (Yield progressivo)
            const yieldRate = isMobile ? 12 : 30;
            if (i % yieldRate === 0) {
              await new Promise(r => setTimeout(r, 0));
              // Controle de pressão do Encoder para não estourar memória do celular
              if (videoEncoder.encodeQueueSize > 5) {
                await new Promise(r => setTimeout(r, 100));
              }
            }
          }

          this.finishEncoding(videoEncoder, audioEncoder, muxer, options, wasMuted, wasVolume, blobUrl, resolve, reject);
        };

        await renderLoop().catch(reject);
      } catch (err) {
        if (options.existingVideoEl) options.existingVideoEl.loop = true;
        reject(err);
      }
    });
  }

  public async renderSlideshow(imageUrls: string[], options: ProcessingOptions, price: string, productName: string): Promise<Blob> {
    return new Promise(async (resolve, reject) => {
      try {
        // Mobile-optimized resolution (720x1280 instead of 1080x1920)
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const W = isMobile ? 720 : 1080;
        const H = isMobile ? 1280 : 1920; 
        this.canvas.width = W;
        this.canvas.height = H;
        
        // Reduced duration for mobile performance (30s mobile, 38s desktop)
        const targetDuration = isMobile ? 30 : 38; 
        const fps = isMobile ? 24 : 30;
        const totalFrames = targetDuration * fps;
        const slideChangeInterval = 3;

        // 1. Preload images with proxy support
        const images = await Promise.all(imageUrls.map(async url => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          return new Promise<HTMLImageElement>(async (res) => {
            try {
              const blobUrl = await this.fetchAsBlob(url, 'image');
              img.src = blobUrl;
              img.onload = () => res(img);
              img.onerror = () => { img.src = url; img.onload = () => res(img); img.onerror = () => res(img); };
            } catch (e) { res(img); }
          });
        }));

        const cleanImages = images.filter(img => img.width > 10);
        if (cleanImages.length === 0) throw new Error("Nenhuma imagem válida carregada");

        // Se tiver apenas 1 imagem, criar variações para ter mais diversidade
        let finalImages = cleanImages;
        if (cleanImages.length < 3) {
          // Duplicar a imagem 4x para ter mais tempo de vídeo com transições
          finalImages = [...cleanImages, ...cleanImages, ...cleanImages, ...cleanImages];
        }

        // 2. Setup Muxer & Encoders
        const muxer = new Muxer({
          target: new ArrayBufferTarget(),
          video: { codec: 'avc', width: W, height: H },
          audio: { codec: 'aac', numberOfChannels: 2, sampleRate: 44100 },
          fastStart: 'in-memory'
        });

        const videoEncoder = new VideoEncoder({
          output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
          error: e => console.error("VideoEncoder error", e)
        });
        const videoBitrate = isMobile ? 2_800_000 : 6_000_000;
        videoEncoder.configure({
          codec: 'avc1.4d0033', width: W, height: H, bitrate: videoBitrate, avc: { format: 'avc' }
        });

        const audioEncoder = new AudioEncoder({
          output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
          error: e => console.error("AudioEncoder error", e)
        });
        audioEncoder.configure({
          codec: 'mp4a.40.2', numberOfChannels: 2, sampleRate: 44100, bitrate: 128_000
        });

        // 3. Setup Audio Buffer (Sincronização Perfeita)
        let audioBuffer: AudioBuffer | null = null;
        if (options.musicUrl) {
          try {
            audioBuffer = await this.loadAndResampleAudio(options.musicUrl, 44100, (options as any).musicBpm || 128, (options as any).musicGenre || 'house');
          } catch (e) {
            console.warn("Falha ao carregar áudio, seguindo sem som");
          }
        }

        const filterCSS = this.getFilterCSS(options.filter || 'elite');
        const CAPCUT_TRANSITIONS = [
          'zoomPunch', 'whipLeft', 'whipRight', 'whipDown', 'zoomBlur', 'glassSplit', 'colorBurn',
          'lightLeak', 'beatFlash', 'glitch', 'slideUp', 'slideDown', 'zoomOut', 'shake', 'spin', 'fade'
        ];
        const shuffledTransitions = [...CAPCUT_TRANSITIONS].sort(() => Math.random() - 0.5);
        const getSlideTransition = (slideNum: number) => shuffledTransitions[slideNum % shuffledTransitions.length];

        // Dire��es Ken Burns �nicas por slide (aleat�rias)
        const kbDirections = [
          { panX: 0, panY: -1 }, { panX: 0, panY: 1 },
          { panX: -1, panY: 0 }, { panX: 1, panY: 0 },
          { panX: -0.5, panY: -0.5 }, { panX: 0.5, panY: 0.5 }
        ].sort(() => Math.random() - 0.5);

        // Sequencia unica de transicoes por slide (embaralhada por video - nunca repete igual)

        // 4. Render Loop (Sync Video + Audio)
        for (let i = 0; i < totalFrames; i++) {
          const currentTime = i / fps;
          const slideIdx = Math.floor(currentTime / slideChangeInterval) % finalImages.length;
          const img = finalImages[slideIdx];
          const progress = (currentTime % slideChangeInterval) / slideChangeInterval;
          const isCTA = currentTime > (targetDuration - 3.5);

          this.ctx.clearRect(0, 0, W, H);
          this.ctx.fillStyle = "#020617";
          this.ctx.fillRect(0, 0, W, H);

          if (!isCTA) {
            // High-End Ken Burns
            const baseScale = Math.max(W / img.width, H / img.height);
            // Alternate scale directions
            const zoomIn = Math.floor(currentTime / slideChangeInterval) % 2 === 0;
            const scale = zoomIn ? baseScale * (1 + progress * 0.2) : baseScale * (1.2 - progress * 0.2);
            
            const scrollY = (H - img.height * scale) / 2;
            const scrollX = (W - img.width * scale) / 2;

            this.ctx.save();
            this.ctx.filter = filterCSS;
            this.ctx.drawImage(img, scrollX, scrollY, img.width * scale, img.height * scale);
            this.ctx.restore();

            // CTA Messages - primeiro 12 segundos
            this.drawCallToAction(currentTime, W, H, progress);
            
            // Product Info - aparece após 12 segundos
            this.drawProductInfo(`${productName}\n${price}`, W, H, currentTime);
          } else {
            // CTA Final
            this.ctx.fillStyle = "#10b981";
            this.ctx.font = "bold 90px Inter, sans-serif";
            this.ctx.textAlign = "center";
            this.ctx.shadowColor = "rgba(16, 185, 129, 0.5)";
            this.ctx.shadowBlur = 30;
            this.ctx.fillText("PEÇA O LINK!", W / 2, H / 2 - 40);
            this.ctx.shadowBlur = 0;
            this.ctx.font = "50px Inter";
            this.ctx.fillStyle = "white";
            this.ctx.fillText("OU LINK NA BIO", W / 2, H / 2 + 60);
          }

          // Growth Hack Overlays (Novidade!)
          this.drawGrowthHacks(currentTime, W, H);

          // CapCut Pro Transitions - unicas por slide, nunca repetem na mesma ordem
          const slideNum = Math.floor(currentTime / slideChangeInterval);
          const tType = getSlideTransition(slideNum);
          const tZone = 0.35; // 35% do slide = transicao de entrada (beat-sync)

          if (progress < tZone && slideNum > 0 && !isCTA) {
            const tp = progress / tZone; // 0 ? 1 dentro da zona de transicao
            this.applyCapCutTransition(tType, tp, W, H);
          }

          // Mid-slide: pulse sutil no beat (sincroniza com BPM)
          const musicBpm = (options as any).musicBpm || 128;
          const beatInterval = 60 / musicBpm;
          const beatPhase = (currentTime % beatInterval) / beatInterval;
          if (beatPhase < 0.05 && !isCTA) {
            const beatPulse = 1 + (1 - beatPhase / 0.05) * 0.015;
            this.ctx.save();
            this.ctx.transform(beatPulse, 0, 0, beatPulse, W * (1 - beatPulse) / 2, H * (1 - beatPulse) / 2);
            this.ctx.restore();
          }

          // Encode Video Frame
          const vFrame = new VideoFrame(this.canvas, { timestamp: currentTime * 1_000_000 });
          videoEncoder.encode(vFrame, { keyFrame: i % 30 === 0 });
          vFrame.close();

          // Encode Audio Chunk (matching the video frame)
          if (audioBuffer) {
            const samplesPerFrame = 44100 / fps;
            const startSample = Math.floor(i * samplesPerFrame) % audioBuffer.length;
            const endSample = startSample + samplesPerFrame;
            
            // Extract samples for this frame
            const audioData = new Float32Array(Math.floor(samplesPerFrame) * 2);
            for (let channel = 0; channel < 2; channel++) {
                const channelData = audioBuffer.getChannelData(channel % audioBuffer.numberOfChannels);
                for (let s = 0; s < samplesPerFrame; s++) {
                    audioData[s * 2 + channel] = channelData[(startSample + s) % audioBuffer.length];
                }
            }

            const aData = new AudioData({
              format: 'f32-planar',
              sampleRate: 44100,
              numberOfFrames: Math.floor(samplesPerFrame),
              numberOfChannels: 2,
              timestamp: currentTime * 1_000_000,
              data: audioData
            });

            if (audioEncoder.state === 'configured') {
              audioEncoder.encode(aData);
            }
            aData.close();
          }
          
          // Yield to UI sometimes for feedback (not really needed in for loop but good practice)
          const yieldRateSlideshow = isMobile ? 15 : 45;
          if (i % yieldRateSlideshow === 0) {
            await new Promise(r => setTimeout(r, 0));
            if (videoEncoder.encodeQueueSize > 4) {
              await new Promise(r => setTimeout(r, 80));
            }
          }
        }

        // Flush encoders with state check
        if (videoEncoder.state === 'configured') {
          await videoEncoder.flush();
        }
        if (audioEncoder.state === 'configured') {
          await audioEncoder.flush();
        }
        muxer.finalize();
        
        const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' });
        resolve(blob);
      } catch (err) {
        console.error("Slideshow error:", err);
        reject(err);
      }
    });
  }

  private applyCapCutTransition(type: string, progress: number, W: number, H: number) {
    const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; 
    const ep = ease(progress); 

    this.ctx.save();
    switch (type) {
      case 'zoomPunch': {
        const scale = 1 + (1 - ep) * 0.4;
        this.ctx.transform(scale, 0, 0, scale, W * (1 - scale) / 2, H * (1 - scale) / 2);
        this.ctx.globalAlpha = ep;
        break;
      }
      case 'zoomOut': {
        const scale = 0.6 + ep * 0.4;
        this.ctx.transform(scale, 0, 0, scale, W * (1 - scale) / 2, H * (1 - scale) / 2);
        this.ctx.globalAlpha = ep;
        break;
      }
      case 'whipLeft': {
        const offsetX = W * (1 - ep) * -1;
        this.ctx.translate(offsetX, 0);
        const blur = (1 - ep);
        this.ctx.fillStyle = `rgba(0,0,0,${blur * 0.7})`;
        this.ctx.fillRect(-W, 0, W * 2, H);
        break;
      }
      case 'whipRight': {
        const offsetX = W * (1 - ep);
        this.ctx.translate(offsetX, 0);
        const blur = (1 - ep);
        this.ctx.fillStyle = `rgba(0,0,0,${blur * 0.7})`;
        this.ctx.fillRect(-W, 0, W * 2, H);
        break;
      }
      case 'whipDown': {
        const offsetY = H * (1 - ep);
        this.ctx.translate(0, offsetY);
        const blur = (1 - ep);
        this.ctx.fillStyle = `rgba(0,0,0,${blur * 0.7})`;
        this.ctx.fillRect(0, -H, W, H * 2);
        break;
      }
      case 'slideUp': {
        const offsetY = H * (1 - ep) * -1;
        this.ctx.translate(0, offsetY);
        this.ctx.globalAlpha = Math.min(1, ep * 1.5);
        break;
      }
      case 'slideDown': {
        const offsetY = H * (1 - ep);
        this.ctx.translate(0, offsetY);
        this.ctx.globalAlpha = Math.min(1, ep * 1.5);
        break;
      }
      case 'lightLeak': {
        this.ctx.globalAlpha = ep;
        const leakIntensity = (1 - ep) * 0.8;
        const grad = this.ctx.createRadialGradient(W * 0.2, H * 0.15, 0, W * 0.2, H * 0.15, W * 0.8);
        grad.addColorStop(0, `rgba(255,220,100,${leakIntensity})`);
        grad.addColorStop(0.5, `rgba(255,160,80,${leakIntensity * 0.3})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, W, H);
        break;
      }
      case 'beatFlash': {
        const flashEnv = Math.exp(-progress * 6);
        this.ctx.globalAlpha = ep;
        if (flashEnv > 0.01) {
          this.ctx.fillStyle = `rgba(255,255,255,${flashEnv * 0.9})`;
          this.ctx.fillRect(0, 0, W, H);
        }
        const s = 1 + flashEnv * 0.1;
        this.ctx.transform(s, 0, 0, s, W * (1 - s) / 2, H * (1 - s) / 2);
        break;
      }
      case 'glitch': {
        this.ctx.globalAlpha = ep;
        const slices = 6;
        const sliceH = H / slices;
        for (let s = 0; s < slices; s++) {
          const shift = (Math.random() - 0.5) * W * 0.08 * (1 - progress);
          const srcY = s * sliceH;
          try {
            const imgData = this.ctx.getImageData(0, srcY, W, sliceH);
            this.ctx.putImageData(imgData, shift, srcY);
            this.ctx.fillStyle = `rgba(255,0,128,${(1 - progress) * 0.08})`;
            this.ctx.fillRect(shift + 4, srcY, W, sliceH);
          } catch(e) {}
        }
        break;
      }
      case 'zoomBlur': {
        const scale = 1 + (1 - ep) * 0.6;
        this.ctx.translate(W / 2, H / 2);
        this.ctx.scale(scale, scale);
        this.ctx.translate(-W / 2, -H / 2);
        this.ctx.filter = `blur(${Math.floor((1 - ep) * 15)}px)`;
        this.ctx.globalAlpha = ep;
        break;
      }
      case 'glassSplit': {
        this.ctx.globalAlpha = ep;
        const offset = (1 - ep) * 40;
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(0, 0, W / 2, H);
        this.ctx.clip();
        this.ctx.translate(-offset, 0);
        this.ctx.drawImage(this.canvas, 0, 0);
        this.ctx.restore();
        
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.rect(W / 2, 0, W / 2, H);
        this.ctx.clip();
        this.ctx.translate(offset, 0);
        this.ctx.drawImage(this.canvas, 0, 0);
        this.ctx.restore();
        break;
      }
      case 'colorBurn': {
        this.ctx.globalAlpha = ep;
        if (progress < 0.3) {
          this.ctx.fillStyle = '#ff3e00';
          this.ctx.globalCompositeOperation = 'color-burn';
          this.ctx.fillRect(0, 0, W, H);
          this.ctx.globalCompositeOperation = 'source-over';
        }
        break;
      }
      case 'shake': {
        const intensity = (1 - ep) * 12;
        this.ctx.translate(
          (Math.random() - 0.5) * intensity,
          (Math.random() - 0.5) * intensity
        );
        this.ctx.globalAlpha = Math.min(1, ep * 2);
        break;
      }
      case 'spin': {
        const angle = (1 - ep) * Math.PI * 0.08;
        this.ctx.translate(W / 2, H / 2);
        this.ctx.rotate(angle);
        this.ctx.translate(-W / 2, -H / 2);
        this.ctx.globalAlpha = ep;
        break;
      }
      case 'fade':
      default: {
        this.ctx.globalAlpha = ep;
        break;
      }
    }
    this.ctx.restore();
  }

  private applyTransitionEffect(type: string, ct: number, timestamps: number[], W: number, H: number) {
    const ts = timestamps.find(t => ct >= t && ct < t + 1.5) || 0;
    const progress = (ct - ts) / 1.5;
    const sin = Math.sin(progress * Math.PI);

    switch (type) {
      case 'zoom': {
        const scale = 1 + sin * 0.25;
        const ox = W * (1 - scale) / 2;
        const oy = H * (1 - scale) / 2;
        this.ctx.save();
        this.ctx.drawImage(this.canvas, 0, 0, W, H, ox, oy, W * scale, H * scale);
        this.ctx.restore();
        break;
      }
      case 'flash':
        this.ctx.fillStyle = `rgba(255,255,255,${sin * 0.7})`;
        this.ctx.fillRect(0, 0, W, H);
        break;
      case 'beat':
        this.ctx.fillStyle = `rgba(6,182,212,${Math.max(0, Math.sin(progress * Math.PI * 3) * 0.35)})`;
        this.ctx.fillRect(0, 0, W, H);
        break;
      case 'fire':
        this.ctx.fillStyle = `rgba(255,${Math.floor(100 + Math.sin(ct * 15) * 50)},0,${sin * 0.45})`;
        this.ctx.fillRect(0, 0, W, H);
        break;
      case 'glitch': {
        const glitchStep = Math.floor(ct * 6);
        if (glitchStep % 3 === 0) {
          const sliceH = 40 + (Math.sin(ct * 10) * 20);
          const sy = (Math.cos(ct * 5) * 0.5 + 0.5) * (H - sliceH);
          const dx = Math.sin(ct * 40) * 30;
          this.ctx.drawImage(this.canvas, 0, sy, W, sliceH, dx, sy, W, sliceH);
          this.ctx.globalCompositeOperation = 'screen';
          this.ctx.globalAlpha = 0.2;
          this.ctx.fillStyle = `rgba(2,132,199,0.3)`;
          this.ctx.fillRect(dx + 4, sy, 60, sliceH);
          this.ctx.globalCompositeOperation = 'source-over';
          this.ctx.globalAlpha = 1;
        }
        break;
      }
      case 'shake': {
        const sx = Math.sin(ct * 45) * 12 * sin;
        const sy2 = Math.cos(ct * 38) * 12 * sin;
        this.ctx.save();
        this.ctx.translate(sx, sy2);
        this.ctx.drawImage(this.canvas, -sx, -sy2, W, H);
        this.ctx.restore();
        break;
      }
      case 'blur': {
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.filter = `blur(${Math.floor(sin * 20)}px) brightness(1.6)`;
        this.ctx.globalAlpha = 0.25;
        this.ctx.drawImage(this.canvas, 0, 0);
        this.ctx.filter = 'none';
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.restore();
        break;
      }
      case 'slide': {
        const offset = Math.floor(sin * W * 0.15);
        this.ctx.save();
        this.ctx.drawImage(this.canvas, offset, 0, W, H);
        this.ctx.restore();
        break;
      }
      case 'rotate': {
        const scaleX = Math.cos(progress * Math.PI * 2); 
        const scaleY = 1 + Math.sin(progress * Math.PI) * 0.15; 
        this.ctx.save();
        this.ctx.translate(W / 2, H / 2);
        this.ctx.scale(scaleX * scaleY, scaleY);
        this.ctx.drawImage(this.canvas, -W / 2, -H / 2, W, H);
        this.ctx.restore();
        break;
      }
      // Distorted effects removed per user request for premium aesthetic

      case 'light_leak': {
        const gradient = this.ctx.createRadialGradient(W * 0.8, H * 0.2, 0, W * 0.7, H * 0.3, W * 0.6);
        gradient.addColorStop(0, `rgba(255, 165, 0, ${sin * 0.6})`);
        gradient.addColorStop(0.5, `rgba(255, 69, 0, ${sin * 0.3})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, W, H);
        this.ctx.restore();
        break;
      }
      case 'glass_shine': {
        const xOffset = progress * W * 2 - W;
        const gradient = this.ctx.createLinearGradient(xOffset, 0, xOffset + W * 0.4, H);
        gradient.addColorStop(0, 'rgba(255,255,255,0)');
        gradient.addColorStop(0.5, `rgba(255,255,255,${sin * 0.5})`);
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'overlay';
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, W, H);
        this.ctx.restore();
        break;
      }
      case 'whip_push': {
        const tx = -progress * W;
        this.ctx.save();
        this.ctx.filter = `blur(${Math.min(20, progress * 40)}px)`;
        this.ctx.translate(tx, 0);
        this.ctx.drawImage(this.canvas, 0, 0);
        this.ctx.restore();
        break;
      }
      case 'mirror_flip': {
        const scaleX = Math.cos(progress * Math.PI);
        this.ctx.save();
        this.ctx.translate(W / 2, 0);
        this.ctx.scale(scaleX, 1);
        this.ctx.drawImage(this.canvas, -W / 2, 0);
        this.ctx.restore();
        break;
      }
      case 'pan_cinematic': {
        // Fix: Substituído movimento "ondulado" de seno por um pan suave e linear
        const panX = (progress - 0.5) * W * 0.08;
        this.ctx.save();
        this.ctx.translate(panX, 0);
        this.ctx.scale(1.15, 1.15);
        this.ctx.drawImage(this.canvas, -W * 0.075, -H * 0.075);
        this.ctx.restore();
        break;
      }
    }
  }

  private drawCallToAction(time: number, W: number, H: number, progress: number) {
    // Mensagens curtas de chamada para comprar
    const ctaMessages = [
      "🔥 COMPRE AGORA!",
      "⚡ OFERTA RELÂMPAGO!",
      "🛒 NÃO PERCA ESSA!",
      "✨ ACHADINHO VIP!",
      "😱 PREÇO SURREAL!",
      "😍 EU PRECISO DISSO!",
      "🎁 PRESENTE IDEAL!",
      "💎 QUALIDADE PREMIUM!",
      "💸 MENOR PREÇO!",
      "🚀 ENVIO IMEDIATO!",
      "🏆 CAMPEÃO DE VENDAS!",
      "🌟 NOTA MÁXIMA!",
      "📦 FRETE GRÁTIS HOJE!",
      "🔥 ÚLTIMAS UNIDADES!",
      "⚠️ ESTOQUE LIMITADO!",
      "💥 DESCONTO EXCLUSIVO!",
      "🌈 VÁRIAS CORES!",
      "🛠️ SUPER RESISTENTE!",
      "🏡 PARA SUA CASA!",
      "🧸 SEUS FILHOS VÃO AMAR!",
      "🍳 FACILITE SUA VIDA!",
      "📱 TECNOLOGIA PURA!",
      "👟 ESTILO E CONFORTO!",
      "💄 BELEZA E CHARME!",
      "🧘 BEM-ESTAR TOTAL!",
      "🐶 PARA SEU PET!",
      "🚲 VIDA SAUDÁVEL!",
      "🎉 APROVEITE AGORA!",
      "🎯 ACHADO PERFEITO!",
      "🔥 O MAIS DESEJADO!",
    ];

    // Mostrar apenas nos primeiros 6 segundos
    if (time > 6) return;

    // Selecionar mensagem baseada no tempo
    const msgIndex = Math.floor(time / 2.5) % ctaMessages.length;
    const message = ctaMessages[msgIndex];

    // Animação de opacidade - aparece e some
    const phaseDuration = 2.5;
    const localProgress = (time % phaseDuration) / phaseDuration;
    
    let opacity = 1;
    if (localProgress < 0.15) {
      opacity = localProgress / 0.15;
    } else if (localProgress > 0.7) {
      opacity = (1 - localProgress) / 0.3;
    }

    const fontSize = Math.floor(W * 0.04);
    
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.textAlign = 'center';
    
    // Fundo compacto na parte superior
    this.ctx.fillStyle = 'rgba(0,0,0,0.75)';
    this.ctx.fillRect(W * 0.2, H * 0.08, W * 0.6, H * 0.07);
    
    // Texto branco com shadow
    this.ctx.font = `900 ${fontSize + 1}px Inter, Arial, sans-serif`;
    this.ctx.fillStyle = '#000000';
    this.ctx.fillText(message, W / 2 + 1, H * 0.135 + 1);
    this.ctx.font = `900 ${fontSize}px Inter, Arial, sans-serif`;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText(message, W / 2, H * 0.135);

    this.ctx.globalAlpha = 1;
    this.ctx.restore();
  }

  private drawProductInfo(text: string, W: number, H: number, time: number) {
    // Aparece a partir de 10 segundos para dar tempo de ver as imagens
    if (time < 10) return;

    const lines = text.split('\n');
    const productName = lines[0] || "";
    const price = lines[1] || "";

    // Fontes proporcionais - adapts to resolution
    const titleSize = Math.floor(W * 0.035);
    this.ctx.font = `900 ${titleSize}px Inter, Arial, sans-serif`;
    const titleLines = this.wrapText(productName, titleSize, W * 0.85);
    const priceSize = Math.floor(W * 0.055);
    
    // Animação de entrada suave
    const fadeProgress = Math.min((time - 10) / 1.5, 1);
    const opacity = fadeProgress;

    const startY = H * 0.68;
    
    this.ctx.save();
    this.ctx.globalAlpha = opacity;

    // Fundo escuro semi-transparente na parte inferior
    this.ctx.fillStyle = 'rgba(0,0,0,0.75)';
    this.ctx.fillRect(0, startY - 20, W, H * 0.32);

    // Título do produto - centralizado com shadow
    this.ctx.textAlign = 'center';
    const titleY = startY;
    
    titleLines.forEach((line, idx) => {
      const lineY = titleY + (idx * titleSize * 1.2);
      const upperLine = line.toUpperCase();
      
      // Text shadow
      this.ctx.font = `900 ${titleSize + 2}px Inter, Arial, sans-serif`;
      this.ctx.fillStyle = '#000000';
      this.ctx.fillText(upperLine, W / 2 + 2, lineY + 2);
      
      this.ctx.font = `900 ${titleSize}px Inter, Arial, sans-serif`;
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillText(upperLine, W / 2, lineY);
    });
    
    // Preço em badge verde
    const priceY = startY + titleLines.length * titleSize * 1.2 + 25;
    
    this.ctx.fillStyle = '#10b981';
    this.ctx.beginPath();
    this.ctx.roundRect(W * 0.28, priceY - priceSize/2, W * 0.44, priceSize + 16, 10);
    this.ctx.fill();
    
    this.ctx.font = `900 ${priceSize}px Inter, Arial, sans-serif`;
    this.ctx.fillStyle = '#000000';
    this.ctx.fillText(price, W / 2, priceY + priceSize * 0.35);

    // CTA
    const ctaY = priceY + priceSize + 22;
    this.ctx.font = `bold ${Math.floor(W * 0.022)}px Inter, Arial, sans-serif`;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('🔗 LINK NA BIO', W / 2, ctaY);

    // Hashtags
    const hashY = ctaY + 18;
    this.ctx.font = `${Math.floor(W * 0.016)}px Inter, Arial, sans-serif`;
    this.ctx.fillStyle = '#22d3ee';
    this.ctx.fillText('#viral #shopee #achadinhos', W / 2, hashY);

    this.ctx.restore();
  }

  private drawGrowthHacks(time: number, W: number, H: number) {
    // 1. Selo de Frete Grátis (Efeito Emergência)
    if (time > 1 && time < 8) {
      const sealSize = Math.floor(W * 0.18);
      const pulse = 1 + Math.sin(time * 10) * 0.05;
      
      this.ctx.save();
      this.ctx.translate(W * 0.82, H * 0.12);
      this.ctx.scale(pulse, pulse);
      this.ctx.rotate(Math.PI / 12);
      
      // Círculo
      this.ctx.fillStyle = '#ff4d4f';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, sealSize/2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Texto
      this.ctx.fillStyle = 'white';
      this.ctx.textAlign = 'center';
      this.ctx.font = `bold ${Math.floor(sealSize * 0.22)}px Inter`;
      this.ctx.fillText("FRETE", 0, -5);
      this.ctx.fillText("GRÁTIS", 0, 15);
      
      this.ctx.restore();
    }

    // 2. Balão de Prova Social (Pergunta do Cliente)
    if (time > 12 && time < 17) {
      const progress = (time - 12) / 5;
      const opacity = progress < 0.1 ? progress / 0.1 : (progress > 0.8 ? (1 - progress) / 0.2 : 1);
      
      this.ctx.save();
      this.ctx.globalAlpha = opacity;
      
      const bW = W * 0.7;
      const bH = H * 0.08;
      const bX = (W - bW) / 2;
      const bY = H * 0.25;
      
      // Fundo Balão
      this.ctx.fillStyle = 'white';
      this.ctx.beginPath();
      this.ctx.roundRect(bX, bY, bW, bH, 20);
      this.ctx.fill();
      
      // Triângulo do balão
      this.ctx.beginPath();
      this.ctx.moveTo(bX + 40, bY + bH);
      this.ctx.lineTo(bX + 60, bY + bH + 20);
      this.ctx.lineTo(bX + 80, bY + bH);
      this.ctx.fill();
      
      // Avatar Fake
      this.ctx.fillStyle = '#f0f0f0';
      this.ctx.beginPath();
      this.ctx.arc(bX + 40, bY + bH/2, 20, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Texto da Pergunta
      this.ctx.fillStyle = '#333';
      this.ctx.textAlign = 'left';
      this.ctx.font = `500 ${Math.floor(W * 0.03)}px Inter`;
      this.ctx.fillText("Ainda tem estoque? Chega rápido?", bX + 75, bY + bH/2 + 8);
      
      this.ctx.restore();
    }

    // 3. Selo de Cupom (Efeito Glow)
    if (time > 20 && time < 26) {
      this.ctx.save();
      const cW = W * 0.6;
      const cH = H * 0.06;
      const cX = (W - cW) / 2;
      const cY = H * 0.15;
      
      this.ctx.shadowColor = '#fbbf24';
      this.ctx.shadowBlur = 15;
      this.ctx.fillStyle = '#fbbf24';
      this.ctx.beginPath();
      this.ctx.roundRect(cX, cY, cW, cH, 12);
      this.ctx.fill();
      
      this.ctx.fillStyle = 'black';
      this.ctx.textAlign = 'center';
      this.ctx.font = `black ${Math.floor(W * 0.035)}px Inter`;
      this.ctx.fillText("🎟️ USE SEU CUPOM AQUÍ!", W / 2, cY + cH/2 + 10);
      this.ctx.restore();
    }
  }

  private wrapText(text: string, fontSize: number, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [''];
    let cur = 0;
    
    words.forEach(word => {
      const test = lines[cur] + (lines[cur] ? ' ' : '') + word;
      if (this.ctx.measureText(test).width > maxWidth && lines[cur]) { 
        cur++; 
        lines[cur] = word; 
      }
      else lines[cur] = test;
    });
    
    return lines;
  }

  private async finishEncoding(
    videoEncoder: VideoEncoder, 
    audioEncoder: AudioEncoder, 
    muxer: Muxer<ArrayBufferTarget>,
    options: ProcessingOptions,
    wasMuted: boolean,
    wasVolume: number,
    blobUrl: string | null,
    resolve: (blob: Blob) => void,
    reject: (err: any) => void
  ) {
    if (videoEncoder.state === 'closed') return;
    
    try {
      await videoEncoder.flush();
      if (audioEncoder.state === 'configured') await audioEncoder.flush();
      muxer.finalize();

      const { buffer } = muxer.target;
      const blob = new Blob([buffer], { type: 'video/mp4' });

      if (blobUrl) URL.revokeObjectURL(blobUrl);

      if (options.existingVideoEl) {
        options.existingVideoEl.muted = wasMuted;
        options.existingVideoEl.volume = wasVolume;
        options.existingVideoEl.loop = true;
        options.existingVideoEl.play().catch(() => {});
      }

      // IMPORTANTE: Liberar memória para evitar que o Chrome feche no celular
      videoEncoder.close();
      if (audioEncoder.state !== 'closed') audioEncoder.close();

      resolve(blob);
    } catch (err) {
      console.error("Erro ao finalizar muxer");
      // Garantir cleanup em caso de erro
      try { 
        videoEncoder.close(); 
        if (audioEncoder.state !== 'closed') audioEncoder.close(); 
      } catch {}
      reject(err);
    }
  }

  private drawSpintaxOverlay(script: any, time: number, W: number, H: number, storeSlug?: string, totalDuration: number = 15) {
    let text = "";
    let type: 'hook' | 'presentation' | 'cta' = 'hook';
    
    // Fix: Legendas agora adaptativas ao tempo total do vídeo
    const hookEnd = totalDuration * 0.20;
    const presEnd = totalDuration * 0.65;
    const ctaEnd = totalDuration * 0.95;

    if (time < hookEnd) {
      text = script.hook;
      type = 'hook';
    } else if (time < presEnd) {
      text = script.presentation;
      type = 'presentation';
    } else if (time < ctaEnd) {
      text = script.cta;
      type = 'cta';
    } else {
      return;
    }

    const margin = W * 0.04;
    const fontSize = Math.floor(W * 0.055);
    const bigFontSize = Math.floor(W * 0.075);
    this.ctx.font = `900 ${fontSize}px Inter, Arial, sans-serif`;
    
    const lines = this.wrapText(text, fontSize, W - (margin * 2) - 60);
    const boxPadding = Math.floor(W * 0.025);
    const lineHeight = fontSize * 1.3;
    const boxHeight = (lines.length * lineHeight) + (boxPadding * 2) + 50;
    const boxWidth = W * 0.85;
    
    const x = (W - boxWidth) / 2;
    const baseY = H * 0.12;
    const pulse = Math.sin(time * 3) * 0.03 + 1;
    const y = baseY;

    this.ctx.save();
    
    // Glow effect based on type
    const glowColor = type === 'hook' ? '#FF3131' : type === 'presentation' ? '#FFD700' : '#00FF7F';
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = 25 * pulse;
    
    // Gradient background with transparency
    const gradient = this.ctx.createLinearGradient(x, y, x + boxWidth, y + boxHeight);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
    gradient.addColorStop(0.5, 'rgba(20, 20, 20, 0.92)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.88)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    const radius = 16;
    this.ctx.roundRect(x, y, boxWidth, boxHeight, radius);
    this.ctx.fill();
    
    // Border with glow
    this.ctx.strokeStyle = glowColor;
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = 0.5 + (pulse - 1) * 15;
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
    
    // Decorative line at top
    this.ctx.strokeStyle = glowColor;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 15, y + 3);
    this.ctx.lineTo(x + boxWidth - 15, y + 3);
    this.ctx.stroke();
    
    this.ctx.restore();

    // Icon based on type
    this.ctx.save();
    const iconText = type === 'hook' ? '🔥' : type === 'presentation' ? '⚡' : '🛒';
    this.ctx.font = `900 ${bigFontSize}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(iconText, W/2, y + boxPadding + bigFontSize/2);
    this.ctx.restore();

    // Text with enhanced styling
    this.ctx.save();
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    
    lines.forEach((line, i) => {
      const ty = y + boxPadding + 40 + (i + 0.5) * lineHeight;
      
      // Text shadow/depth
      this.ctx.shadowColor = "rgba(0,0,0,0.9)";
      this.ctx.shadowBlur = 12;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 3;
      
      // Main text
      this.ctx.font = `900 ${fontSize}px Inter, Arial, sans-serif`;
      this.ctx.fillStyle = '#fff';
      
      // Stroke outline
      this.ctx.strokeStyle = "rgba(0,0,0,0.95)";
      this.ctx.lineWidth = 5;
      this.ctx.lineJoin = "round";
      this.ctx.strokeText(line.toUpperCase(), W/2, ty);
      
      this.ctx.fillText(line.toUpperCase(), W/2, ty);
    });
    this.ctx.restore();

    // Show "Siga @username" at the end of CTA (after 10 seconds)
    if (type === 'cta' && time > 10 && storeSlug) {
      const followText = `Siga @${storeSlug.replace('@', '')} para mais!`;
      const followFontSize = Math.floor(W * 0.035);
      const followY = y + boxHeight + followFontSize + 20;
      
      this.ctx.save();
      this.ctx.font = `900 ${followFontSize}px Inter, Arial, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#fff';
      this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
      this.ctx.shadowBlur = 8;
      this.ctx.fillText(followText, W/2, followY);
      this.ctx.restore();
    }
  }
}



