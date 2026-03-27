
export interface ProcessingOptions {
  filter: string;
  legend: string;
  isMuted: boolean;
  transition: 'zoom' | 'flash' | 'slide' | 'beat' | 'blur' | 'shake' | 'rotate' | 'fire' | 'glitch' | 'none';
  videoId?: string;
  trimStart?: number;
  trimEnd?: number;
  transitionTimestamps?: number[];
}

export class VideoProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private video: HTMLVideoElement;
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.playsInline = true;
  }

  private async fetchVideoAsBlob(url: string): Promise<string> {
    const proxies = [
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u: string) => `https://yacdn.org/proxy/${u}`,
      (u: string) => `https://thingproxy.freeboard.io/fetch/${u}`,
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`
    ];

    console.log("Tentando carregar vídeo via Proxies...");

    for (let i = 0; i < proxies.length; i++) {
      try {
        const proxyUrl = proxies[i](url);
        console.log(`Proxy ${i + 1}/${proxies.length}: ${new URL(proxyUrl).hostname}`);
        
        const response = await fetch(proxyUrl, { 
          method: 'GET',
          cache: 'no-cache'
        });

        if (response.ok) {
          const blob = await response.blob();
          console.log(`Sucesso! Blob recebido: ${blob.type}, Tamanho: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
          
          if (blob.size > 50000) {
            return URL.createObjectURL(blob);
          } else {
            console.warn("Blob muito pequeno, possivelmente erro.");
          }
        }
      } catch (err) {
        console.warn(`Falha no Proxy ${i + 1}:`, err);
      }
    }
    
    return url;
  }

  private async tryTikWMFallback(videoId: string): Promise<string | null> {
    const url = `https://www.tikwm.com/video/media/play/${videoId}.mp4`;
    console.log("Tentando Fallback Elite (TikWM):", url);
    
    const proxies = [
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`
    ];

    for (const proxy of proxies) {
      try {
        const res = await fetch(proxy(url));
        if (res.ok) {
          const blob = await res.blob();
          if (blob.size > 50000) return URL.createObjectURL(blob);
        }
      } catch (e) {
        console.warn("Falha no fallback TikWM via proxy:", e);
      }
    }
    return null;
  }

  public async processAndDownload(videoUrl: string, options: ProcessingOptions): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("Iniciando pipeline de renderização...");
        
        let sourceUrl = await this.fetchVideoAsBlob(videoUrl);
        
        if (options.videoId && (sourceUrl === videoUrl)) {
          console.log("Proxy falhou na URL original, tentando fallback TikWM...");
          const fallback = await this.tryTikWMFallback(options.videoId);
          if (fallback) sourceUrl = fallback;
        }

        if (sourceUrl.startsWith('blob:')) {
          this.video.removeAttribute('crossorigin');
        } else {
          this.video.crossOrigin = 'anonymous';
        }

        this.video.src = sourceUrl;
        
        const timeout = setTimeout(() => {
          reject(new Error("Timeout: O vídeo não carregou em 30 segundos."));
        }, 30000);

        await new Promise((res, rej) => {
          this.video.onloadedmetadata = () => {
            clearTimeout(timeout);
            res(true);
          };
          this.video.onerror = () => {
            clearTimeout(timeout);
            rej(new Error("Erro de CORS ou 403. O TikTok bloqueou essa mídia."));
          };
        });

        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        await this.video.play();
        this.stream = this.canvas.captureStream(30);
        
        if (!options.isMuted) {
          try {
            const videoStream = (this.video as any).captureStream ? (this.video as any).captureStream() : (this.video as any).mozCaptureStream ? (this.video as any).mozCaptureStream() : null;
            if (videoStream && videoStream.getAudioTracks().length > 0) {
              this.stream.addTrack(videoStream.getAudioTracks()[0]);
            }
          } catch (audioErr) {
            console.warn("Não foi possível capturar o áudio:", audioErr);
          }
        }

        // Ensure video is ready and at trimStart
        this.video.currentTime = options.trimStart || 0;
        await new Promise(r => this.video.onseeked = r);

        // Priority: H.264 (MP4) -> VP9/WebM -> Fallback
        const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1') ? 'video/mp4;codecs=avc1' :
                         MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' :
                         MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
                         
        this.recorder = new MediaRecorder(this.stream, { 
          mimeType,
          videoBitsPerSecond: 15000000 // Elite bitrate for Pro quality
        });
        
        this.chunks = [];
        this.recorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.chunks.push(e.data);
        };

        this.recorder.onstop = () => {
          const blob = new Blob(this.chunks, { type: mimeType });
          const outUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
          a.href = outUrl;
          a.style.display = 'none';
          const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
          a.download = `VIRAL_PRO_${timestamp}.${extension}`;
          a.type = mimeType;
          document.body.appendChild(a);
          setTimeout(() => {
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(outUrl);
          }, 100);
          resolve();
        };

        // Render first frame BEFORE starting recorder to avoid empty black frames
        const initialDraw = () => {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        };
        initialDraw();

        this.recorder.start(100); // Start with small timeslice for better reliability

        const renderFrame = () => {
          if (this.video.paused || this.video.ended) return;
          const ct = this.video.currentTime;

          if (options.trimEnd && ct >= options.trimEnd) {
            this.recorder?.stop();
            return;
          }

          this.ctx.save();
          this.applyFilter(options.filter || 'none');
          
          const isTransition = options.transitionTimestamps?.some(ts => ct >= ts && ct < ts + 1.5);
          
          if (isTransition) {
            this.applyPreTransition(options.transition || 'none', ct, options.transitionTimestamps || []);
          }

          this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

          if (isTransition) {
            this.applyPostTransition(options.transition || 'none', ct, options.transitionTimestamps || []);
          }
          
          if (options.legend) this.drawLegend(options.legend);
          this.ctx.restore();
          
          if (this.video.readyState >= 2) {
            requestAnimationFrame(renderFrame);
          }
        };

        renderFrame();
      } catch (err: any) {
        reject(err);
      }
    });
  }

  private applyFilter(filter: string, extraBlur: number = 0) {
    let filterStr = '';
    if (extraBlur > 0) filterStr += `blur(${extraBlur}px) `;
    
    switch (filter) {
      case 'elite': filterStr += 'contrast(1.25) saturate(1.5) brightness(1.1)'; break;
      case 'vhs': filterStr += 'contrast(0.9) saturate(0.6) sepia(0.25) brightness(1.1) blur(0.5px)'; break;
      case 'cinematic': filterStr += 'contrast(1.25) saturate(1.1) brightness(1.1)'; break;
      case 'bw': filterStr += 'grayscale(1) contrast(1.4)'; break;
      case 'bloom': filterStr += 'brightness(1.1) saturate(1.2) blur(1px)'; break;
      case 'glitch': filterStr += 'hue-rotate(90deg) brightness(1.2) contrast(1.2)'; break;
      default: break;
    }
    
    this.ctx.filter = filterStr || 'none';
  }

  private applyPreTransition(type: string, ct: number, timestamps: number[]) {
    const ts = timestamps.find(t => ct >= t && ct < t + 1.5) || 0;
    const progress = (ct - ts) / 1.5;
    
    this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
    
    switch (type) {
      case 'zoom':
        const scale = 1 + Math.sin(progress * Math.PI) * 0.2;
        this.ctx.scale(scale, scale);
        break;
      case 'fire':
        this.ctx.filter = `brightness(${1 + Math.random() * 0.5}) saturate(${1 + Math.random()}) contrast(1.2)`;
        break;
      case 'glitch':
        if (Math.random() > 0.8) this.applyGlitch();
        break;
      case 'shake':
        this.ctx.translate((Math.random()-0.5)*20, (Math.random()-0.5)*20);
        break;
      case 'blur':
        this.applyBloom();
        break;
    }
    
    this.ctx.translate(-this.canvas.width/2, -this.canvas.height/2);
  }

  private applyPostTransition(type: string, ct: number, timestamps: number[]) {
    const ts = timestamps.find(t => ct >= t && ct < t + 1.5) || 0;
    const progress = (ct - ts) / 1.5;

    if (type === 'flash') {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(progress * Math.PI) * 0.5})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  private applyGlitch() {
    if (Math.random() > 0.9) {
      const h = Math.random() * 20;
      const y = Math.random() * this.canvas.height;
      this.ctx.drawImage(this.canvas, 0, y, this.canvas.width, h, (Math.random()-0.5)*30, y, this.canvas.width, h);
    }
  }

  private applyBloom() {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'screen';
    this.ctx.filter = 'blur(10px) brightness(1.5)';
    this.ctx.globalAlpha = 0.3;
    this.ctx.drawImage(this.canvas, 0, 0);
    this.ctx.restore();
  }

  private drawLegend(text: string) {
    this.ctx.save();
    
    // Dynamic Font Scaling
    let fontSize = 80;
    this.ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    const maxWidth = this.canvas.width * 0.85;

    // Handle Long Text (Simple Wrap)
    const words = text.toUpperCase().split(' ');
    let lines: string[] = [''];
    let currentLine = 0;

    words.forEach(word => {
      const testLine = lines[currentLine] + (lines[currentLine] ? ' ' : '') + word;
      if (this.ctx.measureText(testLine).width > maxWidth && lines[currentLine] !== '') {
        currentLine++;
        lines[currentLine] = word;
      } else {
        lines[currentLine] = testLine;
      }
    });

    if (lines.length > 2) fontSize = 60; // Scale down if too many lines
    this.ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    this.ctx.textAlign = 'center';
    
    const lineHeight = fontSize * 1.2;
    const padding = 40;
    const bgH = (lines.length * lineHeight) + padding;
    const bgY = this.canvas.height - bgH - 200;

    lines.forEach((line, i) => {
      const lineMetrics = this.ctx.measureText(line);
      const bgW = lineMetrics.width + 100;
      const bgX = (this.canvas.width - bgW) / 2;
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
      this.drawRoundedRect(bgX, bgY + (i * lineHeight) + 10, bgW, fontSize + 30, 20);
      this.ctx.fill();

      this.ctx.fillStyle = 'white';
      this.ctx.fillText(line, this.canvas.width / 2, bgY + (i * lineHeight) + fontSize);
    });

    this.ctx.restore();
  }

  private drawRoundedRect(x: number, y: number, w: number, h: number, r: number) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.arcTo(x + w, y, x + w, y + h, r);
    this.ctx.arcTo(x + w, y + h, x, y + h, r);
    this.ctx.arcTo(x, y + h, x, y, r);
    this.ctx.arcTo(x, y, x + w, y, r);
    this.ctx.closePath();
  }
}
