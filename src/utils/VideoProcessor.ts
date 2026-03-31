import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

export interface ProcessingOptions {
  filter: string;
  legend: string;
  isMuted: boolean;
  transition: 'zoom' | 'flash' | 'slide' | 'beat' | 'blur' | 'shake' | 'rotate' | 'fire' | 'glitch' | 'none';
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
  private readonly UPSCALE = 2;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!;
    this.auxCanvas = document.createElement('canvas');
    this.auxCtx = this.auxCanvas.getContext('2d')!;
    this.ownedVideo = document.createElement('video');
    this.ownedVideo.muted = true;
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
      default:          return 'contrast(1.08) saturate(1.08)';
    }
  }

  private async fetchVideoAsBlob(url: string): Promise<string> {
    const proxies = [
      (u: string) => `https://vzydpqilvyjqjbhzgzhq.supabase.co/functions/v1/video-proxy?url=${encodeURIComponent(u)}`,
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u: string) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    ];
    for (const proxy of proxies) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(proxy(url), { cache: 'no-cache', signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 50000) return URL.createObjectURL(blob);
        }
      } catch (e) {
        console.warn('Proxy falhou: ', proxy('...'));
      }
    }
    return url;
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
            console.warn("⚠️ Vídeo UI bloqueado por CORS. Usando fallback via Proxy...");
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
          const sourceUrl = await this.fetchVideoAsBlob(videoUrl);
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

        const W = vW * this.UPSCALE;
        const H = vH * this.UPSCALE;
        this.canvas.width = W;
        this.canvas.height = H;
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'low';
        this.auxCanvas.width = W;
        this.auxCanvas.height = H;
        this.auxCtx.imageSmoothingEnabled = true;
        this.auxCtx.imageSmoothingQuality = 'low';

        await video.play();
        
        this.stream = this.canvas.captureStream(30); 
        let audioTrackToEncode: MediaStreamTrack | null = null;

        if (!options.isMuted) {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
            console.warn("[AUDIO] AudioContext fail:", audioErr);
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
          error: (e) => console.error("[VIDEO ENCODER] Erro:", e)
        });

        videoEncoder.configure({
          codec: 'avc1.424028', 
          width: W,
          height: H,
          bitrate: 6_000_000,
          avc: { format: 'annexb' }
        });

        const audioEncoder = new AudioEncoder({
          output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
          error: (e) => console.error("[AUDIO ENCODER] Erro:", e)
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
             this.finishEncoding(videoEncoder, audioEncoder, muxer, options, wasMuted, wasVolume, blobUrl, resolve);
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
          if (options.legend) this.drawLegend(options.legend, W, H);

          const timestamp = (ct - startTime) * 1_000_000;
          const frame = new VideoFrame(this.canvas, { timestamp });
          videoEncoder.encode(frame, { keyFrame: frameCount % 60 === 0 });
          frame.close();
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
    }
  }

  private drawLegend(text: string, W: number, H: number) {
    let fontSize = Math.floor(W * 0.052);
    this.ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;
    this.ctx.textAlign = 'center';
    const maxWidth = W * 0.86;

    const words = text.split(' ');
    const lines: string[] = [''];
    let cur = 0;
    words.forEach(word => {
      const test = lines[cur] + (lines[cur] ? ' ' : '') + word;
      if (this.ctx.measureText(test).width > maxWidth && lines[cur]) { cur++; lines[cur] = word; }
      else lines[cur] = test;
    });

    if (lines.length > 3) fontSize = Math.floor(W * 0.038);
    this.ctx.font = `bold ${fontSize}px Inter, Arial, sans-serif`;

    const lh = fontSize * 1.35;
    const pad = 28;
    const totalH = lines.length * lh + pad;
    const startY = H - totalH - Math.floor(H * 0.055);
    const bx = W * 0.07, bw = W * 0.86, r = 20;

    this.ctx.fillStyle = 'rgba(0,0,0,0.84)';
    this.ctx.beginPath();
    this.ctx.moveTo(bx + r, startY - 8);
    this.ctx.arcTo(bx + bw, startY - 8, bx + bw, startY + totalH, r);
    this.ctx.arcTo(bx + bw, startY + totalH, bx, startY + totalH, r);
    this.ctx.arcTo(bx, startY + totalH, bx, startY - 8, r);
    this.ctx.arcTo(bx, startY - 8, bx + bw, startY - 8, r);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.fillStyle = '#FFFFFF';
    lines.forEach((line, i) => {
      this.ctx.fillText(line, W / 2, startY + (i + 1) * lh - 4);
    });
  }

  private async finishEncoding(
    videoEncoder: VideoEncoder, 
    audioEncoder: AudioEncoder, 
    muxer: Muxer<ArrayBufferTarget>,
    options: ProcessingOptions,
    wasMuted: boolean,
    wasVolume: number,
    blobUrl: string | null,
    resolve: (blob: Blob) => void
  ) {
    if (videoEncoder.state === 'closed') return;
    
    console.log("[ENCODER] Finalizando Muxer...");
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

      console.log("[ENCODER] Renderização MP4 finalizada!");
      videoEncoder.close();
      audioEncoder.close();
      resolve(blob);
    } catch (e) {
      console.error("[ENCODER] Erro ao finalizar:", e);
    }
  }
}
