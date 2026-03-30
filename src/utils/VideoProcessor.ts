
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
  // Canvas auxiliar: recebe frame bruto; ctx.filter é aplicado ao copiar para o canvas principal
  private auxCanvas: HTMLCanvasElement;
  private auxCtx: CanvasRenderingContext2D;
  private ownedVideo: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
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
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos max por proxy
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
    return url; // fallback: URL original
  }

  public async processAndDownload(videoUrl: string, options: ProcessingOptions): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        let video: HTMLVideoElement;
        let blobUrl: string | null = null;

        let useExisting = false;
        if (options.existingVideoEl && options.existingVideoEl.readyState >= 2) {
          try {
            // Verifica se o vídeo irá corromper/taintar o Canvas (CORS)
            const testC = document.createElement('canvas');
            testC.width = 1; testC.height = 1;
            const testCtx = testC.getContext('2d')!;
            testCtx.drawImage(options.existingVideoEl, 0, 0, 1, 1);
            testCtx.getImageData(0, 0, 1, 1); // Dispara erro se cruzou origem indevidamente
            useExisting = true;
          } catch (e) {
            console.warn("⚠️ Vídeo UI bloqueado por CORS. Usando fallback via Proxy...");
            useExisting = false;
          }
        }

        let wasMuted = false;
        let wasVolume = 1;

        if (useExisting && options.existingVideoEl) {
          // ✅ Usar o elemento que já está carregado na UI (limpo e sem CORS block)
          video = options.existingVideoEl;
          video.loop = false; // Força para não repetir, garantindo o onended
          const wasPaused = video.paused;
          
          wasMuted = video.muted;
          wasVolume = video.volume;
          // Unmute hardware output temporarily to inject stream correctly 
          video.muted = false;
          video.volume = 1;

          video.currentTime = options.trimStart || 0;
          await new Promise<void>(r => { video.onseeked = () => r(); setTimeout(r, 1500); });
          if (wasPaused) video.pause();
        } else {
          // Fallback: tentar baixar via proxy
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
        this.ctx.imageSmoothingQuality = 'low'; // Ganho de performance mantendo upscale
        this.auxCanvas.width = W;
        this.auxCanvas.height = H;
        this.auxCtx.imageSmoothingEnabled = true;
        this.auxCtx.imageSmoothingQuality = 'low';

        await video.play();
        
        // ── NOVO SISTEMA DE ÁUDIO (AudioContext) ──
        this.stream = this.canvas.captureStream(30); // 30 FPS é suficiente e mais leve que 60

        if (!options.isMuted) {
          try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const destination = audioCtx.createMediaStreamDestination();
            
            const originalSource = audioCtx.createMediaElementSource(video);
            const originalGain = audioCtx.createGain();
            
            // Lógica de mixagem baseada na opção do usuário
            const mode = options.audioMixMode || 'original';
            
            // Configurar Volumes Base
            if (mode === 'original') {
              originalGain.gain.value = 1;
            } else if (mode === 'mix') {
              originalGain.gain.value = 0.4; // Voz original ao fundo
            } else {
              originalGain.gain.value = 0; // Silenciado
            }

            originalSource.connect(originalGain);
            originalGain.connect(destination);
            originalGain.connect(audioCtx.destination);

            // Carregar e Mixar Música se houver
            if (options.musicUrl && mode !== 'original') {
               const musicAudio = new Audio();
               musicAudio.crossOrigin = "anonymous";
               musicAudio.src = options.musicUrl;
               musicAudio.loop = true;
               
               const musicSource = audioCtx.createMediaElementSource(musicAudio);
               const musicGain = audioCtx.createGain();
               
               if (mode === 'mix') {
                 musicGain.gain.value = 0.8; // Música de fundo firme
               } else {
                 musicGain.gain.value = 1; // Somente música
               }
               
               musicSource.connect(musicGain);
               musicGain.connect(destination);
               
               // Sincronizar play da música
               musicAudio.currentTime = Math.random() * 20; // Começa em ponto aleatório para 'tempero'
               musicAudio.play().catch(e => console.warn("[MUSIC] Play falhou:", e));
               
               // Cleanup no stop
               const oldOnStop = this.recorder?.onstop;
               if (this.recorder) {
                 this.recorder.onstop = (e) => {
                   musicAudio.pause();
                   if (oldOnStop) (oldOnStop as any)(e);
                 };
               }
            }
            
            const audioTrack = destination.stream.getAudioTracks()[0];
            if (audioTrack) {
              this.stream.addTrack(audioTrack);
              console.log(`[AUDIO] Mix [${mode}] pronto.`);
            }
          } catch (audioErr) {
            console.warn("[AUDIO] Falha ao capturar via AudioContext (CORS provável):", audioErr);
            try {
               const vs = (video as any).captureStream?.() || (video as any).mozCaptureStream?.();
               if (vs?.getAudioTracks().length > 0) this.stream.addTrack(vs.getAudioTracks()[0]);
            } catch {}
          }
        }

        const mimeType =
          MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2') ? 'video/mp4;codecs=avc1,mp4a.40.2' :
          MediaRecorder.isTypeSupported('video/mp4;codecs=avc1') ? 'video/mp4;codecs=avc1' :
          MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' :
          MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus') ? 'video/webm;codecs=vp8,opus' :
          MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';

        console.log(`[RECORDER] Iniciando com MimeType: ${mimeType}`);

        this.recorder = new MediaRecorder(this.stream, {
          mimeType,
          videoBitsPerSecond: 8_000_000, // 8Mbps é balanceado para mobile (era 25Mbps!)
        });

        this.chunks = [];
        this.recorder.ondataavailable = e => { if (e.data.size > 0) this.chunks.push(e.data); };

        this.recorder.onstop = () => {
          const blob = new Blob(this.chunks, { type: mimeType });
          const outUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          const ext = 'mp4'; // Força mp4 sempre
          a.href = outUrl;
          a.download = `VIRAL_8K_${ts}.${ext}`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(outUrl); }, 500);
          if (blobUrl) URL.revokeObjectURL(blobUrl);

          // Restaura o video original caso esteja rodando na UI
          if (options.existingVideoEl) {
            options.existingVideoEl.muted = wasMuted;
            options.existingVideoEl.volume = wasVolume;
            options.existingVideoEl.loop = true;
            options.existingVideoEl.play().catch(() => {});
          }

          resolve();
        };

        // Primeiro frame (evita preto)
        this.ctx.drawImage(video, 0, 0, W, H);
        this.recorder.start(100);

        const filterCSS = this.getFilterCSS(options.filter || 'none');
        const transition = options.transition || 'none';
        const transitionTs = options.transitionTimestamps || [];

        const renderFrame = () => {
          if (video.paused || video.ended) return;
          const ct = video.currentTime;
          if (options.trimEnd && ct >= options.trimEnd) { this.recorder?.stop(); return; }

          // 1. Frame bruto no canvas auxiliar
          this.auxCtx.clearRect(0, 0, W, H);
          this.auxCtx.drawImage(video, 0, 0, W, H);

          // 2. Limpa canvas principal
          this.ctx.clearRect(0, 0, W, H);

          // 3. Aplica filtro ANTES do drawImage (único método correto no Canvas API)
          this.ctx.filter = filterCSS;
          this.ctx.drawImage(this.auxCanvas, 0, 0, W, H);
          this.ctx.filter = 'none';

          // 4. Transições
          const isTransition = transitionTs.some(t => ct >= t && ct < t + 1.5);
          if (isTransition) this.applyTransitionEffect(transition, ct, transitionTs, W, H);

          // 5. Legenda
          if (options.legend) this.drawLegend(options.legend, W, H);

          if (video.readyState >= 2) requestAnimationFrame(renderFrame);
        };

        renderFrame();

        // Auto-stop ao fim do vídeo
        video.onended = () => { setTimeout(() => this.recorder?.stop(), 300); };
      } catch (err) {
        if (options.existingVideoEl) {
          options.existingVideoEl.loop = true; // Restaura no caso de falha
        }
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
        // Simulação de Giro 3D avançada (rotateY + zoom dinâmico)
        const scaleX = Math.cos(progress * Math.PI * 2); // Vai de 1 -> -1 -> 1 (efeito de moeda/giro)
        const scaleY = 1 + Math.sin(progress * Math.PI) * 0.15; // Suave aproximação do vídeo
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
}
