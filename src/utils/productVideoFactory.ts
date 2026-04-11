import type { CampaignProduct, CreativeMode } from "./shopeeIntelligence";

interface GeneratedProductVideo {
  blob: Blob;
  duration: number;
  thumbnail: string;
}

interface SceneTemplate {
  id: string;
  duration: number;
  name: string;
  scenes: Scene[];
}

interface Scene {
  text: string;
  transition: "fade" | "slide" | "zoom" | "pulse";
  duration: number;
}

const nicheTemplates: Record<string, SceneTemplate> = {
  Cozinha: {
    id: "kitchen",
    duration: 8,
    name: "Cozinha Highlight",
    scenes: [
      { text: "🍳 Transformando sua cozinha", transition: "zoom", duration: 2 },
      { text: "Item mais vendido da semana", transition: "fade", duration: 2 },
      { text: "Preço imperdível no link!", transition: "pulse", duration: 2 },
    ],
  },
  Beleza: {
    id: "beauty",
    duration: 8,
    name: "Beleza Glow",
    scenes: [
      { text: "✨ Beleza em destaque", transition: "fade", duration: 2 },
      { text: "Queridinho das影响力", transition: "zoom", duration: 2 },
      { text: "Garantir meu desconto", transition: "slide", duration: 2 },
    ],
  },
  Tecnologia: {
    id: "tech",
    duration: 8,
    name: "Tech Vibes",
    scenes: [
      { text: "🔌 Tech que resolve", transition: "zoom", duration: 2 },
      { text: "评级五星 na Shopee", transition: "fade", duration: 2 },
      { text: "Corre que passa rápido!", transition: "pulse", duration: 2 },
    ],
  },
  Decoração: {
    id: "decor",
    duration: 8,
    name: "Home Style",
    scenes: [
      { text: "🏠 Sua casa mais bonita", transition: "fade", duration: 2 },
      { text: "Design que vende muito", transition: "zoom", duration: 2 },
      { text: "Preço de oferta!", transition: "slide", duration: 2 },
    ],
  },
  Pet: {
    id: "pet",
    duration: 8,
    name: "Pet Love",
    scenes: [
      { text: "🐾 Amor de pet", transition: "pulse", duration: 2 },
      { text: "Mimo para seu bichinho", transition: "zoom", duration: 2 },
      { text: "Link na bio!", transition: "fade", duration: 2 },
    ],
  },
  default: {
    id: "default",
    duration: 8,
    name: "Generic Showcase",
    scenes: [
      { text: "Encontrei esse achadinho", transition: "zoom", duration: 2 },
      { text: "Vendendo muito agora", transition: "fade", duration: 2 },
      { text: "Preço bom + comissão", transition: "pulse", duration: 2 },
    ],
  },
};

const nichoTemplates: Record<string, SceneTemplate> = {
  Cozinha: {
    id: "kitchen_r",
    duration: 9,
    name: "Cozinha Rhythm",
    scenes: [
      { text: "🎵 Olha o que eu achei!", transition: "pulse", duration: 2.5 },
      { text: "Coisa boa pra cozinha", transition: "zoom", duration: 2.5 },
      { text: "Corre que logo gone!", transition: "slide", duration: 2.5 },
    ],
  },
  Beleza: {
    id: "beauty_r",
    duration: 9,
    name: "Beleza Beat",
    scenes: [
      { text: "🎵 Olha esse glowww", transition: "fade", duration: 2.5 },
      { text: "Influencer approves", transition: "zoom", duration: 2.5 },
      { text: "Garantir agoraa!", transition: "pulse", duration: 2.5 },
    ],
  },
  Tecnologia: {
    id: "tech_r",
    duration: 9,
    name: "Tech Beat",
    scenes: [
      { text: "🎵 Tech mode ON!", transition: "zoom", duration: 2.5 },
      { text: "Rating lá em cima", transition: "fade", duration: 2.5 },
      { text: "Vai Rápidooo!", transition: "slide", duration: 2.5 },
    ],
  },
  default: {
    id: "default_r",
    duration: 9,
    name: "Default Rhythm",
    scenes: [
      { text: "🎵 Olha esse find!", transition: "pulse", duration: 2.5 },
      { text: "Vendendo muitooo", transition: "zoom", duration: 2.5 },
      { text: "Link na bioo!", transition: "fade", duration: 2.5 },
    ],
  },
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Falha ao carregar imagem do produto"));
    img.src = src;
  });

const makeRecorder = (stream: MediaStream) => {
  const mimeTypes = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];

  const mimeType = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
  return new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 4_000_000 } : undefined);
};

const getPalette = (mode: CreativeMode) => {
  if (mode === "cantado") {
    return {
      bgA: "#130f40",
      bgB: "#f368e0",
      accent: "#feca57",
      card: "rgba(15, 23, 42, 0.52)",
      text: "#fff7ed",
      chip: "#ff9ff3",
    };
  }

  return {
    bgA: "#04111d",
    bgB: "#0f766e",
    accent: "#34d399",
    card: "rgba(2, 6, 23, 0.55)",
    text: "#f8fafc",
    chip: "#22c55e",
  };
};

const getStoryboard = (product: CampaignProduct, mode: CreativeMode) => {
  if (mode === "cantado") {
    return [
      `Olha o ${product.title.split(" ").slice(0, 2).join(" ")} chegou!`,
      `Baratinho e lindo, clique no link!`,
      `Se piscar acabou, corre pra garantir!`,
    ];
  }

  return [
    `Achado forte para ${product.niche.toLowerCase()}`,
    `Comissao de ${product.commission_pct}% e preco de entrada`,
    `CTA pronto: ${product.intelligence.cta}`,
  ];
};

export const buildCreativeCopySet = (product: CampaignProduct, mode: CreativeMode) => {
  if (mode === "cantado") {
    return {
      overlay: `CANTA ESSE ACHADO\n${product.title.split(" ").slice(0, 2).join(" ").toUpperCase()}`,
      caption: `🎵 Achadinho que gruda na cabeca!\n${product.title}\n\n${product.intelligence.hook}\n${product.intelligence.cta}\n#shopee #achadinhos #viral #cantado #promo`,
      musicHint: "happy",
    };
  }

  return {
    overlay: `AUTORAL EXPRESS\n${product.title.split(" ").slice(0, 3).join(" ").toUpperCase()}`,
    caption: `✨ Criativo autoral pronto\n${product.title}\n\n${product.intelligence.hook}\n${product.intelligence.recommendation}\n${product.intelligence.cta}\n#shopee #achados #autoral #viral`,
    musicHint: "lofi",
  };
};

const getNicheTemplate = (niche: string, mode: CreativeMode): SceneTemplate => {
  if (mode === "cantado") {
    return nichoTemplates[niche] || nichoTemplates.default;
  }
  return nicheTemplates[niche] || nicheTemplates.default;
};

const getTransitionEffect = (
  ctx: CanvasRenderingContext2D,
  transition: Scene["transition"],
  progress: number,
  canvas: HTMLCanvasElement,
) => {
  switch (transition) {
    case "fade":
      ctx.globalAlpha = progress < 0.3 ? progress / 0.3 : progress > 0.7 ? (1 - progress) / 0.3 : 1;
      break;
    case "slide":
      ctx.translate((1 - progress) * 100, 0);
      break;
    case "zoom":
      const scale = 1 + (1 - progress) * 0.15;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
      break;
    case "pulse":
      ctx.globalAlpha = progress < 0.2 ? 0.6 + progress * 2 : progress > 0.8 ? 1 - (progress - 0.8) * 2 : 1;
      break;
  }
};

export const generateProductVideo = async (
  product: CampaignProduct,
  mode: CreativeMode,
): Promise<GeneratedProductVideo> => {
  const image = await loadImage(product.image || product.item_image);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Falha ao iniciar canvas do video autoral");
  }

  const palette = getPalette(mode);
  const template = getNicheTemplate(product.niche, mode);
  const stream = canvas.captureStream(30);
  const recorder = makeRecorder(stream);
  const chunks: BlobPart[] = [];
  const duration = template.duration;

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const finished = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
  });

  const drawFrame = (time: number) => {
    const progress = time / duration;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, palette.bgA);
    gradient.addColorStop(1, palette.bgB);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(180, 240, 210 + Math.sin(progress * Math.PI * 2) * 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(910, 1650, 260 + Math.cos(progress * Math.PI * 2) * 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const cardX = 84;
    const cardY = 210;
    const cardW = canvas.width - cardX * 2;
    const cardH = 980;
    ctx.fillStyle = palette.card;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 42);
    ctx.fill();
    ctx.stroke();

    const imgBoxX = 130;
    const imgBoxY = 270;
    const imgBoxW = canvas.width - 260;
    const imgBoxH = 720;
    const zoom = 1.02 + progress * (mode === "cantado" ? 0.14 : 0.08);
    const driftX = Math.sin(progress * Math.PI * 2) * 24;
    const driftY = Math.cos(progress * Math.PI * 2) * 18;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(imgBoxX, imgBoxY, imgBoxW, imgBoxH, 34);
    ctx.clip();
    const scale = Math.max(imgBoxW / image.width, imgBoxH / image.height) * zoom;
    const drawW = image.width * scale;
    const drawH = image.height * scale;
    const drawX = imgBoxX + (imgBoxW - drawW) / 2 + driftX;
    const drawY = imgBoxY + (imgBoxH - drawH) / 2 + driftY;
    ctx.drawImage(image, drawX, drawY, drawW, drawH);
    ctx.restore();

    ctx.fillStyle = palette.chip;
    ctx.beginPath();
    ctx.roundRect(128, 124, 254, 56, 28);
    ctx.fill();
    ctx.fillStyle = "#020617";
    ctx.font = "bold 28px Arial";
    ctx.fillText(mode === "cantado" ? "MODO CANTADO" : "MODO AUTORAL", 160, 160);

    ctx.fillStyle = palette.text;
    ctx.font = "900 64px Arial";
    const title = product.title.toUpperCase().slice(0, 46);
    const titleWords = title.split(" ");
    const firstLine = titleWords.slice(0, Math.ceil(titleWords.length / 2)).join(" ");
    const secondLine = titleWords.slice(Math.ceil(titleWords.length / 2)).join(" ");
    ctx.fillText(firstLine, 96, 1320, canvas.width - 180);
    if (secondLine) ctx.fillText(secondLine, 96, 1390, canvas.width - 180);

    ctx.font = "bold 34px Arial";
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillText(`Ritmo ${mode === "cantado" ? "chiclete" : "fast showcase"}`, 98, 1460);

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.roundRect(92, 1506, canvas.width - 184, 210, 36);
    ctx.fill();

    const sceneIndex = Math.min(template.scenes.length - 1, Math.floor(progress * template.scenes.length));
    const activeLine = template.scenes[sceneIndex].text;
    ctx.fillStyle = palette.text;
    ctx.font = mode === "cantado" ? "900 44px Arial" : "bold 38px Arial";
    wrapText(ctx, activeLine, 128, 1580, canvas.width - 256, 52);

    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.roundRect(94, 1750, canvas.width - 188, 92, 28);
    ctx.fill();
    ctx.fillStyle = "#03111f";
    ctx.font = "900 44px Arial";
    ctx.fillText(`${product.price}  |  ${product.commission_pct}% COMISSAO`, 138, 1810);

    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = "bold 30px Arial";
    ctx.fillText(product.intelligence.cta.toUpperCase(), 286, 1888);
  };

  recorder.start(250);
  const fps = 30;
  const totalFrames = duration * fps;

  for (let frame = 0; frame < totalFrames; frame += 1) {
    drawFrame(frame / fps);
    await wait(1000 / fps);
  }

  recorder.stop();
  const blob = await finished;

  return {
    blob,
    duration,
    thumbnail: canvas.toDataURL("image/jpeg", 0.9),
  };
};

const wrapText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) => {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let i = 0; i < words.length; i += 1) {
    const testLine = `${line}${words[i]} `;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line.trim(), x, currentY);
      line = `${words[i]} `;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  if (line.trim()) {
    ctx.fillText(line.trim(), x, currentY);
  }
};
