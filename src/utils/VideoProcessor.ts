import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export interface ProcessingOptions {
  filter: string;
  legend: string;
  isMuted: boolean;
  transition: 'zoom' | 'flash' | 'slide' | 'beat' | 'blur' | 'shake' | 'rotate' | 'fire' | 'glitch' | 'none';
  transitionList?: ('zoom' | 'flash' | 'slide' | 'beat' | 'blur' | 'shake' | 'rotate' | 'fire' | 'glitch' | 'none' | 'wave' | 'spiral' | 'pixelate')[];
  videoId?: string;
  trimStart?: number;
  trimEnd?: number;
  transitionTimestamps?: number[];
  existingVideoEl?: HTMLVideoElement;
  musicUrl?: string;
  audioMixMode?: 'original' | 'music' | 'mix';
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

  private async loadAndResampleAudio(url: string, targetSampleRate: number): Promise<AudioBuffer> {
    const PROXY_BASE = 'https://vzydpqilvyjqjbhzgzhq.supabase.co/functions/v1/video-proxy';
    const proxyUrl = `${PROXY_BASE}?url=${encodeURIComponent(url)}`;
    
    try {
      console.log(`[VideoProcessor] Carregando Áudio via Proxy: ${proxyUrl}`);
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        console.error(`[VideoProcessor] Erro de Rede Áudio: HTTP ${response.status} para URL: ${url}`);
        throw new Error(`HTTP ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const originalBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      if (originalBuffer.sampleRate === targetSampleRate) {
        return originalBuffer;
      }

      // Resampling logic if needed
      const offlineCtx = new OfflineAudioContext(
        originalBuffer.numberOfChannels,
        originalBuffer.duration * targetSampleRate,
        targetSampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = originalBuffer;
      source.connect(offlineCtx.destination);
      source.start();

      const resampledBuffer = await offlineCtx.startRendering();
      await audioCtx.close();
      return resampledBuffer;

    } catch (err) {
      console.error("[VideoProcessor] Falha fatal no áudio (usando fallback silencioso):", err);
      const audioCtx = new AudioContext({ sampleRate: targetSampleRate });
      return audioCtx.createBuffer(1, targetSampleRate, targetSampleRate);
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
        const isUltra = options.filter === 'ultra8k';
        const targetH = isUltra ? 1920 : 1280;
        
        let scale = targetH / vH;
        // Impedir upscale exagerado que trava o Chrome Mobile
        if (scale > 2.5) scale = 2.5; 

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

        video.muted = false;
        video.volume = 1;
        await video.play();
        
        this.stream = this.canvas.captureStream(30); 
        let audioTrackToEncode: MediaStreamTrack | null = null;

        if (!options.isMuted) {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
              sampleRate: 44100
            });
            if (audioCtx.state === 'suspended') {
              await audioCtx.resume();
            }
            const destination = audioCtx.createMediaStreamDestination();
            
            const originalSource = audioCtx.createMediaElementSource(video);
            const originalGain = audioCtx.createGain();
            const mode = options.audioMixMode || 'original';
            
            if (mode === 'original') originalGain.gain.value = 1;
            else if (mode === 'mix') originalGain.gain.value = 0.4;
            else originalGain.gain.value = 0;

            originalSource.connect(originalGain);
            originalGain.connect(destination);
            originalGain.connect(audioCtx.destination);

            if (options.musicUrl && mode !== 'original') {
                const musicAudio = new Audio();
                musicAudio.crossOrigin = "anonymous";
                musicAudio.onerror = () => {
                  if (musicAudio.src === options.musicUrl) {
                    musicAudio.src = `https://api.allorigins.win/raw?url=${encodeURIComponent(options.musicUrl!)}`;
                  }
                };
                musicAudio.src = options.musicUrl;
                musicAudio.loop = true;
                
                const musicSource = audioCtx.createMediaElementSource(musicAudio);
                const musicGain = audioCtx.createGain();
                musicGain.gain.value = mode === 'mix' ? 0.8 : 1;
                
                musicSource.connect(musicGain);
                musicGain.connect(destination);
                musicAudio.currentTime = Math.random() * 20;
                musicAudio.play().catch(() => {});
                video.addEventListener('pause', () => musicAudio.pause(), { once: true });
            }
            
            audioTrackToEncode = destination.stream.getAudioTracks()[0];
            if (audioTrackToEncode) this.stream.addTrack(audioTrackToEncode);
          } catch (audioErr) {
            console.warn("AudioContext falhou.");
          }
        }

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

        videoEncoder.configure({
          codec: 'avc1.4d0033', // High Profile, Level 5.1
          width: W,
          height: H,
          bitrate: isUltra ? 12_000_000 : 6_000_000,
          avc: { format: 'avc' }
        });

        const audioEncoder = new AudioEncoder({
          output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
          error: () => console.error("Erro no audio encoder")
        });

        audioEncoder.configure({
          codec: 'mp4a.40.2', 
          numberOfChannels: 2,
          sampleRate: 44100,
          bitrate: 128_000
        });

        if (audioTrackToEncode) {
          const processor = new (window as any).MediaStreamTrackProcessor({ track: audioTrackToEncode });
          const reader = processor.readable.getReader();
          const readAudio = async () => {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (audioEncoder.state === 'configured') audioEncoder.encode(value);
              value.close();
            }
          };
          readAudio();
        }

        let frameCount = 0;
        const startTime = video.currentTime;
        const filterCSS = this.getFilterCSS(options.filter || 'none');
        const transition = options.transition || 'none';
        const transitionTs = options.transitionTimestamps || [];

        const renderFrame = () => {
          const ct = video.currentTime;
          if ((options.trimEnd && ct >= options.trimEnd) || video.paused || video.ended) { 
             this.finishEncoding(videoEncoder, audioEncoder, muxer, options, wasMuted, wasVolume, blobUrl, resolve, reject);
             return; 
          }

          this.auxCtx.clearRect(0, 0, W, H);
          this.auxCtx.drawImage(video, 0, 0, W, H);
          this.ctx.clearRect(0, 0, W, H);
          this.ctx.filter = filterCSS;
          this.ctx.drawImage(this.auxCanvas, 0, 0, W, H);
          this.ctx.filter = 'none';

          const isTransition = transitionTs.some(t => ct >= t && ct < t + 1.5);
          if (isTransition) this.applyTransitionEffect(transition, ct, transitionTs, W, H);
          // Legend is now handled by drawCallToAction and drawProductInfo in renderSlideshow

          const timestamp = (ct - startTime) * 1_000_000;
          const frame = new VideoFrame(this.canvas, { timestamp });
          
          try {
            if (videoEncoder.state === 'configured') {
              videoEncoder.encode(frame, { keyFrame: frameCount % 60 === 0 });
            }
          } catch (e) {
            console.error("Erro ao codificar frame do video");
          } finally {
            frame.close();
          }
          
          frameCount++;
          if (video.readyState >= 2) requestAnimationFrame(renderFrame);
        };

        renderFrame();
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
        const videoBitrate = isMobile ? 2_500_000 : 6_000_000;
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
            audioBuffer = await this.loadAndResampleAudio(options.musicUrl, 44100);
          } catch (e) {
            console.warn("Falha ao carregar áudio, seguindo sem som");
          }
        }

        const filterCSS = this.getFilterCSS(options.filter || 'elite');
        const transitionTypes = options.transitionList || ['zoom', 'glitch', 'blur', 'slide', 'shake', 'flash'];

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

          // Premium Transitions
          const transitionZone = 0.6; // 600ms transition
          if (progress < transitionZone && i > 0 && !isCTA) {
            const tType = transitionTypes[Math.floor(currentTime / slideChangeInterval) % transitionTypes.length];
            // Normalize progress for the transition zone
            const tp = progress / transitionZone;
            // Fake the timestamp for applyTransition
            this.applyTransitionEffect(tType, tp * 1.5, [0], W, H);
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
          if (i % 60 === 0) await new Promise(r => setTimeout(r, 0));
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
        this.ctx.fillStyle = `rgba(255,${Math.floor(80 + Math.random() * 80)},0,${sin * 0.4})`;
        this.ctx.fillRect(0, 0, W, H);
        break;
      case 'glitch': {
        if (Math.random() > 0.6) {
          const sliceH = Math.random() * 60;
          const sy = Math.random() * H;
          const dx = (Math.random() - 0.5) * 60;
          this.ctx.drawImage(this.canvas, 0, sy, W, sliceH, dx, sy, W, sliceH);
          this.ctx.globalCompositeOperation = 'screen';
          this.ctx.globalAlpha = 0.3;
          this.ctx.fillStyle = `rgba(255,0,0,0.4)`;
          this.ctx.fillRect(dx + 4, sy, Math.random() * 40, sliceH);
          this.ctx.globalCompositeOperation = 'source-over';
          this.ctx.globalAlpha = 1;
        }
        break;
      }
      case 'shake': {
        const sx = (Math.random() - 0.5) * 30;
        const sy2 = (Math.random() - 0.5) * 30;
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
      case 'wave': {
        const waveOffset = Math.sin(progress * Math.PI * 4) * 20;
        this.ctx.save();
        this.ctx.translate(waveOffset, 0);
        this.ctx.drawImage(this.canvas, -waveOffset, 0, W, H);
        this.ctx.restore();
        break;
      }
      case 'spiral': {
        const angle = progress * Math.PI * 2;
        const scale = 1 + Math.sin(progress * Math.PI) * 0.1;
        this.ctx.save();
        this.ctx.translate(W / 2, H / 2);
        this.ctx.rotate(angle);
        this.ctx.scale(scale, scale);
        this.ctx.drawImage(this.canvas, -W / 2, -H / 2, W, H);
        this.ctx.restore();
        break;
      }
      case 'pixelate': {
        const pixelSize = Math.floor(10 + sin * 30);
        if (pixelSize > 2) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = Math.floor(W / pixelSize);
          tempCanvas.height = Math.floor(H / pixelSize);
          const tempCtx = tempCanvas.getContext('2d')!;
          tempCtx.drawImage(this.canvas, 0, 0, tempCanvas.width, tempCanvas.height);
          this.ctx.imageSmoothingEnabled = false;
          this.ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, W, H);
          this.ctx.imageSmoothingEnabled = true;
        }
        break;
      }
    }
  }

  private drawCallToAction(time: number, W: number, H: number, progress: number) {
    // Mensagens curtas de chamada para comprar
    const ctaMessages = [
      "🔥 COMPRE AGORA!",
      "⚡ OFERTA!",
      "🛒 NÃO PERCA!",
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
}
