import type { ShopeeProduct } from "../services/shopeeService";

export type CreativeMode = "viral" | "autoral" | "cantado";

export interface ProductSnapshot {
  price: number;
  commissionRate: number;
  capturedAt: string;
}

export interface ProductMonitor {
  availability: "stable" | "monitor" | "replace";
  priceDirection: "up" | "down" | "steady";
  commissionDirection: "up" | "down" | "steady";
  lastCheckedAt: string;
}

export interface ProductIntelligence {
  score: number;
  scoreLabel: string;
  niche: string;
  hook: string;
  cta: string;
  recommendation: string;
  storeCollection: string;
  monitor: ProductMonitor;
}

export interface CampaignProduct {
  id: string;
  item_id: number;
  shop_id: number;
  title: string;
  item_name: string;
  price: string;
  price_value: number;
  price_before_discount?: number;
  discount?: string;
  product_link: string;
  commission_rate: number;
  commission_pct: number;
  commission_value: number;
  sales: string;
  sales_value: number;
  query: string;
  url: string;
  affiliate_link: string;
  image: string;
  item_image: string;
  niche: string;
  source: "shopee_api";
  monitor: ProductMonitor;
  intelligence: ProductIntelligence;
  creative_modes: CreativeMode[];
}

const nicheRules = [
  { niche: "Cozinha", terms: ["cozinha", "airfryer", "panela", "geladeira", "fritadeira", "azeite", "cafe", "copo", "talher"] },
  { niche: "Beleza", terms: ["maqui", "cabelo", "skincare", "pele", "escova", "serum", "perfume", "unha", "facial"] },
  { niche: "Tecnologia", terms: ["bluetooth", "usb", "led", "rgb", "smart", "camera", "wifi", "fone", "gamer", "projetor"] },
  { niche: "Decoração", terms: ["lumin", "decor", "quarto", "sala", "mesa", "lustre", "espelho", "vaso", "almofada"] },
  { niche: "Pet", terms: ["pet", "gato", "cachorro", "coleira", "racao", "brinquedo"] },
  { niche: "Esportes", terms: ["fitness", "academia", "yoga", "corrida", "muscul", "bike"] },
  { niche: "Kids", terms: ["bebe", "infantil", "crianca", "kids", "brinquedo", "educativo"] },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const parseSalesValue = (sales: string | number | undefined): number => {
  if (typeof sales === "number") return sales;
  if (!sales) return 0;

  const match = sales.match(/[\d,.]+/);
  if (!match) return 0;

  let numeric = Number(match[0].replace(/\./g, "").replace(",", "."));
  if (sales.toLowerCase().includes("k")) numeric *= 1000;
  if (sales.toLowerCase().includes("m")) numeric *= 1000000;
  return Number.isFinite(numeric) ? numeric : 0;
};

export const formatSalesValue = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${Math.round(value)}`;
};

export const inferNicheFromText = (text: string): string => {
  const normalized = text.toLowerCase();
  const matched = nicheRules.find((rule) => rule.terms.some((term) => normalized.includes(term)));
  return matched?.niche || "Tecnologia";
};

const buildMonitor = (product: ShopeeProduct, previous?: ProductSnapshot): ProductMonitor => {
  const priceChanged = previous ? product.price - previous.price : 0;
  const commissionChanged = previous ? product.commission_rate - previous.commissionRate : 0;

  let availability: ProductMonitor["availability"] = "stable";
  if (product.commission_rate < 8 || product.price < 12) availability = "replace";
  else if (Math.abs(priceChanged) >= 10 || Math.abs(commissionChanged) >= 5) availability = "monitor";

  return {
    availability,
    priceDirection: priceChanged > 0 ? "up" : priceChanged < 0 ? "down" : "steady",
    commissionDirection: commissionChanged > 0 ? "up" : commissionChanged < 0 ? "down" : "steady",
    lastCheckedAt: new Date().toISOString(),
  };
};

const getStoreCollection = (price: number, commissionRate: number, score: number): string => {
  if (commissionRate >= 14 && price <= 99) return "Impulso";
  if (score >= 60) return "Top do Dia"; // Mais inclusivo para garantir que a aba não fique vazia
  if (price >= 109) return "Ticket Premium";
  return "Escala";
};

export const buildProductIntelligence = (product: ShopeeProduct, keyword = "", previous?: ProductSnapshot): ProductIntelligence => {
  const niche = inferNicheFromText(`${keyword} ${product.item_name}`);
  const priceScore = clamp(100 - Math.abs(product.price - 69), 40, 100);
  const commissionScore = clamp(product.commission_rate * 3.5, 10, 100);
  const conversionBias = product.price <= 99 ? 22 : 8;
  const score = Math.round(clamp(priceScore * 0.4 + commissionScore * 0.4 + conversionBias, 1, 99));
  const monitor = buildMonitor(product, previous);
  const scoreLabel = score >= 80 ? "Muito quente" : score >= 65 ? "Boa aposta" : "Testar rapido";
  const recommendation = monitor.availability === "replace"
    ? "Trocar se cair mais"
    : monitor.availability === "monitor"
      ? "Monitorar preco/comissao"
      : "Pode escalar agora";

  return {
    score,
    scoreLabel,
    niche,
    hook: `Olha esse ${product.item_name.split(" ").slice(0, 4).join(" ")} vendendo muito agora`,
    cta: "Link na bio com meu desconto",
    recommendation,
    storeCollection: getStoreCollection(product.price, product.commission_rate, score),
    monitor,
  };
};

export const adaptShopeeProductToCampaign = (
  product: ShopeeProduct,
  keyword = "",
  previous?: ProductSnapshot,
): CampaignProduct => {
  const intelligence = buildProductIntelligence(product, keyword, previous);
  const salesValue = parseSalesValue(product.sales);

  return {
    id: `shopee_${product.shop_id}_${product.item_id}`,
    item_id: product.item_id,
    shop_id: product.shop_id,
    title: product.item_name,
    item_name: product.item_name,
    price: `R$ ${(Number(product.price) || 0).toFixed(2).replace('.', ',')}`,
    price_value: Number(product.price) || 0,
    price_before_discount: product.price_before_discount,
    discount: product.discount !== undefined ? String(product.discount) : undefined,
    product_link: product.product_link,
    commission_rate: Math.round(Number(product.commission_rate) || 0),
    commission_pct: Math.round(Number(product.commission_rate) || 0),
    commission_value: Number(product.commission) || 0,
    sales: salesValue > 0 ? formatSalesValue(salesValue) : `${Math.max(1, Math.round(intelligence.score * 1.7))}k`,
    sales_value: salesValue,
    query: keyword || product.item_name,
    url: product.product_link,
    affiliate_link: product.product_link,
    image: product.item_image,
    item_image: product.item_image,
    niche: intelligence.niche,
    source: "shopee_api",
    monitor: intelligence.monitor,
    intelligence,
    creative_modes: ["viral", "autoral", "cantado"],
  };
};


export const shouldReplaceProduct = (product: CampaignProduct): boolean => {
  return (
    product.monitor.availability === "replace" ||
    product.intelligence.score < 45 ||
    product.commission_pct < 8 ||
    product.price_value < 12
  );
};

export const getReplacementScore = (
  current: CampaignProduct,
  candidate: CampaignProduct,
): number => {
  const scoreDiff = candidate.intelligence.score - current.intelligence.score;
  const commDiff = candidate.commission_pct - current.commission_pct;
  const priceDiff = current.price_value - candidate.price_value;
  
  if (scoreDiff > 15 && commDiff >= 0) return 100;
  if (scoreDiff > 8 && commDiff >= -3 && priceDiff > 5) return 80;
  if (scoreDiff > 0 && commDiff > -5) return 60;
  return 30;
};

export const findBestReplacement = (
  currentProduct: CampaignProduct,
  candidates: CampaignProduct[],
): CampaignProduct | null => {
  const valid = candidates.filter(c => 
    c.id !== currentProduct.id &&
    c.niche === currentProduct.niche &&
    !shouldReplaceProduct(c)
  );
  
  if (valid.length === 0) return null;
  
  let best: CampaignProduct | null = null;
  let bestScore = -1;
  
  for (const candidate of valid) {
    const score = getReplacementScore(currentProduct, candidate);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  
  return bestScore >= 60 ? best : null;
};
