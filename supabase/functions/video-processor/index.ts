// @ts-nocheck
import { serve } from 'std/http/server';
import { createCanvas, loadImage } from 'std/canvas';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ProcessingOptions {
  filter: string;
  isMuted: boolean;
  isAutoral: boolean;
  trimStart?: number;
  trimEnd?: number;
  script?: any;
  storeSlug?: string;
}

function getFilterCSS(filter: string): string {
  switch (filter) {
    case 'elite': return 'contrast(1.35) saturate(1.7) brightness(1.15)';
    case 'vhs': return 'contrast(0.9) saturate(0.55) sepia(0.3) brightness(1.1)';
    case 'cinematic': return 'contrast(1.3) saturate(1.1) brightness(1.05) hue-rotate(-5deg)';
    case 'bw': return 'none';
    case 'bloom': return 'brightness(1.2) saturate(1.3)';
    case 'glitch': return 'hue-rotate(90deg) brightness(1.2) contrast(1.25)';
    case 'ultra8k': return 'contrast(1.4) saturate(1.8) brightness(1.12)';
    case 'dramatic': return 'contrast(1.5) saturate(0.9) brightness(0.9) sepia(0.1)';
    case 'tealAndOrange': return 'contrast(1.2) saturate(1.4) hue-rotate(-10deg) sepia(0.1) brightness(1.1)';
    case 'vintageGold': return 'sepia(0.4) contrast(1.1) brightness(1.1) saturate(1.3)';
    case 'professional': return 'contrast(1.15) saturate(1.15) brightness(1.08)';
    case 'tiktok viral': return 'contrast(1.25) saturate(1.35) brightness(1.1)';
    default: return 'contrast(1.08) saturate(1.08)';
  }
}

function applyEffectToImageData(imageData: ImageData, filter: string): ImageData {
  const data = imageData.data;
  const filterCSS = getFilterCSS(filter);
  
  // Parse simple filter adjustments
  let contrast = 1, brightness = 1, saturate = 1, hueRotate = 0, sepia = 0;
  
  const contrastMatch = filterCSS.match(/contrast\(([\d.]+)\)/);
  const brightnessMatch = filterCSS.match(/brightness\(([\d.]+)\)/);
  const saturateMatch = filterCSS.match(/saturate\(([\d.]+)\)/);
  const hueMatch = filterCSS.match(/hue-rotate\(([\d.]+)deg\)/);
  const sepiaMatch = filterCSS.match(/sepia\(([\d.]+)\)/);
  
  if (contrastMatch) contrast = parseFloat(contrastMatch[1]);
  if (brightnessMatch) brightness = parseFloat(brightnessMatch[1]);
  if (saturateMatch) saturate = parseFloat(saturateMatch[1]);
  if (hueMatch) hueRotate = parseFloat(hueMatch[1]);
  if (sepiaMatch) sepia = parseFloat(sepiaMatch[1]);

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];
    
    if (sepia > 0) {
      const sr = r * (1 - sepia * 0.787) + g * sepia * 0.213 + b * sepia * 0.131;
      const sg = r * sepia * 0.168 + g * (1 - sepia * 0.772) + b * sepia * 0.414;
      const sb = r * sepia * 0.131 + g * sepia * 0.213 + b * (1 - sepia * 0.787);
      r = sr; g = sg; b = sb;
    }
    
    if (hueRotate !== 0) {
      const rad = hueRotate * Math.PI / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      const nr = r * (cos + (1 - cos) / 3) + g * ((1 - cos) / 3 - sin / 3) + b * ((1 - cos) / 3 + sin / 3);
      const ng = r * ((1 - cos) / 3 + sin / 3) + g * (cos + (1 - cos) / 3) + b * ((1 - cos) / 3 - sin / 3);
      const nb = r * ((1 - cos) / 3 - sin / 3) + g * ((1 - cos) / 3 + sin / 3) + b * (cos + (1 - cos) / 3);
      r = nr; g = ng; b = nb;
    }
    
    r = ((r / 255 - 0.5) * contrast + 0.5) * brightness * 255 * saturate;
    g = ((g / 255 - 0.5) * contrast + 0.5) * brightness * 255 * saturate;
    b = ((b / 255 - 0.5) * contrast + 0.5) * brightness * 255 * saturate;
    
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }
  
  return imageData;
}

async function fetchVideoAsBlob(url: string): Promise<Blob> {
  const PROXY = 'https://vzydpqilvyjqjbhzgzhq.supabase.co/functions/v1/video-proxy';
  const targetUrl = url.includes('http') ? `${PROXY}?url=${encodeURIComponent(url)}` : url;
  
  const res = await fetch(targetUrl);
  if (!res.ok) throw new Error('Failed to fetch video');
  return res.blob();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;
    const optionsStr = formData.get('options') as string;
    const options: ProcessingOptions = optionsStr ? JSON.parse(optionsStr) : {};

    if (!videoFile) {
      return new Response('Missing video file', { status: 400, headers: corsHeaders });
    }

    console.log('[VideoProcessor] Processing video with options:', JSON.stringify(options));
    console.log('[VideoProcessor] Video size:', videoFile.size);

    // For now, we'll do basic processing - just copy the video with minimal processing
    // Full video encoding would require ffmpeg which may not be available
    // This is a simplified version that avoids browser processing
    
    const videoData = await videoFile.arrayBuffer();
    const blob = new Blob([videoData], { type: 'video/mp4' });

    console.log('[VideoProcessor] Done processing');

    return new Response(blob, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="processed-video.mp4"',
      },
    });

  } catch (error) {
    console.error('[VideoProcessor] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});