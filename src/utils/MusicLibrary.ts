export interface ViralMusic {
  id: string;
  name: string;
  url: string;
  genre: string;
  bpm: number;
  mood: string;
}

// =================================================================
// 🎵 PREMIUM HITS — 36 faixas com nomes virais
// Todas usando SoundHelix (único CDN que permite hotlink sem 403)
// SoundHelix tem 16 sons únicos (Song-1 até Song-16)
// =================================================================
export const VIRAL_MUSIC: ViralMusic[] = [
  // --- House / EDM / Alok Vibes ---
  { id: "t01", name: "Alok Vibes - Deep Drop 🔥",    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",  genre: "deep house",  bpm: 124, mood: "energetic" },
  { id: "t02", name: "Brazilian Bass - Slap 🇧🇷",     url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",  genre: "slap house",  bpm: 126, mood: "party" },
  { id: "t03", name: "Tech House - Club Night 🎧",    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",  genre: "tech house",  bpm: 126, mood: "energetic" },
  { id: "t04", name: "EDM Festival - Peak Time ⚡",   url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",  genre: "edm",         bpm: 128, mood: "epic" },
  { id: "t05", name: "Future Bass - Emotional 🌈",    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",  genre: "future bass", bpm: 128, mood: "happy" },
  { id: "t06", name: "House Groove - Addictive 🕺",   url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",  genre: "house",       bpm: 128, mood: "classic" },
  { id: "t07", name: "Vocal House - Summer ☀️",       url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",  genre: "pop/dance",   bpm: 122, mood: "happy" },
  { id: "t08", name: "Big Room - Anthem Drop 🏟️",    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",  genre: "big room",    bpm: 130, mood: "epic" },

  // --- TikTok / Pop / Viral ---
  { id: "t09", name: "TikTok Stomp - Fashion ✨",     url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",  genre: "pop",         bpm: 115, mood: "energetic" },
  { id: "t10", name: "Catchy Hook - Reels Gold ⭐",   url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", genre: "pop",         bpm: 118, mood: "happy" },
  { id: "t11", name: "Viral Pop - Trending Now 🎤",   url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3", genre: "pop",         bpm: 120, mood: "happy" },
  { id: "t12", name: "Motivational Beat - Rise 💪",   url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", genre: "uplifting",   bpm: 125, mood: "energetic" },

  // --- Phonk / Drift / Sigma ---
  { id: "t13", name: "Phonk Sigma - Drift 🏎️",       url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3", genre: "phonk",       bpm: 145, mood: "intense" },
  { id: "t14", name: "Aggressive Drift - Dark 🔥",    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3", genre: "phonk",       bpm: 160, mood: "aggressive" },
  { id: "t15", name: "Sigma Grind - No Mercy ⚔️",    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3", genre: "phonk",       bpm: 155, mood: "aggressive" },
  { id: "t16", name: "Phonk Brazil - Noite 🌑",       url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3", genre: "phonk",       bpm: 150, mood: "intense" },

  // --- Funk / Trap / Automotivo (reusa songs 1-8 com "vibe" diferente) ---
  { id: "t17", name: "Funk Automotivo - Explosion 💥", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",  genre: "funk/trap",   bpm: 130, mood: "party" },
  { id: "t18", name: "Funk Mandrake - Noite 🌃",       url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",  genre: "funk",        bpm: 135, mood: "dark" },
  { id: "t19", name: "Trap Luxury - Diamond 💎",       url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",  genre: "trap",        bpm: 140, mood: "expensive" },
  { id: "t20", name: "Trap Viral - Street 🏙️",        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",  genre: "trap",        bpm: 138, mood: "dark" },
  { id: "t21", name: "Drill BR - Favela Style 🇧🇷",   url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",  genre: "drill",       bpm: 142, mood: "intense" },

  // --- Synthwave / Retro / Cinemático ---
  { id: "t22", name: "Synthwave 80s - Neon Drive 🏎️", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",  genre: "synthwave",   bpm: 110, mood: "nostalgic" },
  { id: "t23", name: "Heroic EDM - Epic Drop ⚔️",     url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",  genre: "orchestral",  bpm: 150, mood: "epic" },
  { id: "t24", name: "Emotional Story - Reel 🎬",      url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", genre: "cinematic",   bpm: 70,  mood: "emotional" },
  { id: "t25", name: "Cinematic Trailer - Power 🎥",   url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3", genre: "cinematic",   bpm: 90,  mood: "epic" },

  // --- LoFi / Chill ---
  { id: "t26", name: "Aesthetic LoFi - Café Day ☕",   url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3", genre: "lofi",        bpm: 85,  mood: "chill" },
  { id: "t27", name: "LoFi Hip Hop - Study Vibes 📚",  url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3", genre: "lofi",        bpm: 80,  mood: "chill" },

  // --- Electro / Special ---
  { id: "t28", name: "Electro Swing - Viral Jazz 🎷",  url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3", genre: "electro",     bpm: 124, mood: "fun" },
  { id: "t29", name: "Bass Boost Festival 🎵",          url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3", genre: "edm",         bpm: 132, mood: "energetic" },
  { id: "t30", name: "Night Club Groove 🌙",            url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3", genre: "house",       bpm: 128, mood: "energetic" },
  { id: "t31", name: "Bounce Beat 🏀",                  url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",  genre: "edm",         bpm: 126, mood: "party" },
  { id: "t32", name: "Speed Run - Go! ⚡",              url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",  genre: "phonk",       bpm: 160, mood: "intense" },
  { id: "t33", name: "Chill Wave 🌊",                   url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3", genre: "lofi",        bpm: 75,  mood: "chill" },
  { id: "t34", name: "Anthem Peak 🏆",                  url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",  genre: "big room",    bpm: 134, mood: "epic" },
  { id: "t35", name: "Dark Trap Energy 🖤",             url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3", genre: "trap",        bpm: 140, mood: "dark" },
  { id: "t36", name: "Glow Up - Shine 🌟",              url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",  genre: "pop",         bpm: 118, mood: "happy" },
];

// ======================================================
// Transições de Vídeo Premium (Estilo CapCut Pro)
// ======================================================
export const TRANSITIONS = [
  'zoom', 'glitch', 'blur', 'slide', 'shake', 'flash', 'beat', 'fire', 'rotate', 'wave', 'spiral', 'pixelate',
  'split', 'zoomOut', 'slideUp', 'slideDown', 'fade', 'wipe', 'iris', 'clock', 'checker', 'strips',
  'sweep', 'band', 'fadeColor', 'radial', 'smooth', 'slideLeft', 'slideRight', 'zoomIn', 'flip',
  'roll', 'page', 'circle', 'cross', 'diamond', 'heart', 'star', 'fisheye', 'cylinder', 'twist',
] as const;

export const FILTERS = [
  'elite', 'ultra8k', 'cinematic', 'bloom', 'glitch', 'vhs', 'bw', 'neon', 'golden', 'dramatic',
  'warm', 'cool', 'vintage', 'noir', 'sepia', 'chrome', 'fade', 'moody', 'bright', 'dark',
  'contrast', 'saturated', 'hazy', 'sharp', 'soft', 'faded', 'rich', 'vibrant', 'pastel',
] as const;

export type TransitionType = typeof TRANSITIONS[number];
export type FilterType = typeof FILTERS[number];

export const getRandomMusic = (): ViralMusic => {
  return VIRAL_MUSIC[Math.floor(Math.random() * VIRAL_MUSIC.length)];
};

export const getRandomMusicExcluding = (exclude: string): ViralMusic => {
  const available = VIRAL_MUSIC.filter(m => m.id !== exclude);
  if (available.length === 0) return getRandomMusic();
  return available[Math.floor(Math.random() * available.length)];
};

export const getRandomTransitions = (count: number = 8): TransitionType[] => {
  return [...TRANSITIONS].sort(() => Math.random() - 0.5).slice(0, count);
};

export const getRandomFilters = (count: number = 3): FilterType[] => {
  return [...FILTERS].sort(() => Math.random() - 0.5).slice(0, count);
};

export const getAllMusicCount = () => VIRAL_MUSIC.length;
export const getAllTransitionsCount = () => TRANSITIONS.length;
export const getAllFiltersCount = () => FILTERS.length;