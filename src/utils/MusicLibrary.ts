export interface ViralMusic {
  id: string;
  name: string;
  url: string;
  genre: string;
  bpm: number;
  mood: string;
}

const SOUNDHELIX_BASE = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-";

const createSoundHelixMusic = (num: number, genre: string, bpm: number, mood: string, suffix: string = ""): ViralMusic => {
  const songNum = num <= 16 ? num : ((num - 1) % 16) + 1;
  return {
    id: `sh${num}${suffix}`,
    name: `${genre} ${num}${suffix ? ` ${suffix}` : ""} 🎵`,
    url: `${SOUNDHELIX_BASE}${songNum}.mp3`,
    genre: genre.toLowerCase(),
    bpm,
    mood
  };
};

// Gerar 400+ músicas combinando genres, moods e BPMS
export const VIRAL_MUSIC: ViralMusic[] = [
  // Songs 1-20: Phonk/Drift
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 1, "Phonk", 140 + (i % 10), "intense", i < 10 ? "🔥" : "🏎️")),
  
  // Songs 21-40: Funk Brasil
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 21, "Funk", 125 + (i % 10), "party", i < 10 ? "🇧🇷" : "🎶")),
  
  // Songs 41-60: Electronic/EDM
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 41, "EDM", 128 + (i % 15), "energetic", i < 10 ? "⚡" : "🎧")),
  
  // Songs 61-80: Hip Hop
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 61, "HipHop", 85 + (i % 15), "chill", i < 10 ? "🎤" : "🛤️")),
  
  // Songs 81-100: Trap
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 81, "Trap", 135 + (i % 10), "dark", i < 10 ? "🔥" : "💀")),
  
  // Songs 101-120: Pop
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 101, "Pop", 100 + (i % 20), "happy", i < 10 ? "☀️" : "✨")),
  
  // Songs 121-140: Lofi
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 121, "Lofi", 70 + (i % 15), "relax", i < 10 ? "☕" : "🌙")),
  
  // Songs 141-160: Cinematic
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 141, "Cinematic", 80 + (i % 20), "epic", i < 10 ? "🎬" : "⚔️")),
  
  // Songs 161-180: Techno
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 161, "Techno", 130 + (i % 15), "dark", i < 10 ? "🔊" : "🕺")),
  
  // Songs 181-200: Latin
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 181, "Latin", 95 + (i % 10), "dance", i < 10 ? "💃" : "🌴")),
  
  // Songs 201-220: Gaming
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 201, "Gaming", 140 + (i % 10), "action", i < 10 ? "🎮" : "🏆")),
  
  // Songs 221-240: Ambient
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 221, "Ambient", 60 + (i % 20), "chill", i < 10 ? "🌊" : "🧘")),
  
  // Songs 241-260: Rock
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 241, "Rock", 120 + (i % 15), "energetic", i < 10 ? "🎸" : "🤘")),
  
  // Songs 261-280: R&B
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 261, "RnB", 85 + (i % 10), "smooth", i < 10 ? "💜" : "🎵")),
  
  // Songs 281-300: Dubstep
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 281, "Dubstep", 140 + (i % 10), "heavy", i < 10 ? "🎛️" : "💥")),
  
  // Songs 301-320: House
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 301, "House", 124 + (i % 10), "dance", i < 10 ? "🏠" : "🪩")),
  
  // Songs 321-340: Drum & Bass
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 321, "DnB", 170 + (i % 10), "intense", i < 10 ? "🥁" : "⚡")),
  
  // Songs 341-360: Acoustic
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 341, "Acoustic", 80 + (i % 15), "warm", i < 10 ? "🎸" : "🌲")),
  
  // Songs 361-380: World
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 361, "World", 90 + (i % 20), "exotic", i < 10 ? "🌍" : "🗺️")),
  
  // Songs 381-400: Experimental
  ...Array.from({ length: 20 }, (_, i) => createSoundHelixMusic(i + 381, "Experimental", 100 + (i % 30), "unique", i < 10 ? "🔮" : "🧪")),
];

export const TRANSITIONS = [
  'zoom', 'glitch', 'blur', 'slide', 'shake', 'flash', 'beat', 'fire', 'rotate', 'wave', 'spiral', 'pixelate',
  'split', 'zoomOut', 'slideUp', 'slideDown', 'fade', 'wipe', 'iris', 'clock', 'checker', 'strips',
  'sweep', 'band', 'fadeColor', 'radial', 'smooth', 'slideLeft', 'slideRight', 'zoomIn', 'flip',
  'roll', 'page', 'circle', 'cross', 'diamond', 'heart', 'star', 'fisheye', 'cylinder', 'twist',
  'bump', 'butterfly', 'cell', 'checkerboard', 'circleClose', 'circleOpen', 'clockWise', 'clockWiseCCW',
  'copy', 'cover', 'cube', 'displacement', 'domino', 'fall', 'flyIn', 'flyOut', 'fold', 'gradient',
  'hexagon', 'horizontalClose', 'horizontalOpen', 'horizontalWiper', 'inset', 'irisRound', 'linear',
  'mosaic', 'move', 'pinWheel', 'polar', 'polka', 'radialClose', 'radialOpen', 'radialWiper', 'random',
  'randomBlock', 'rectangle', 'reveal', 'rotateZoom', 'shader', 'shred', 'sine', 'slideAway',
  'solar', 'sparkle', 'spiralClose', 'spiralOpen', 'square', 'stretch', 'swap', 'swing', 'tile',
  'tumble', 'verticalClose', 'verticalOpen', 'verticalWiper', 'vortex', 'water', 'whip', 'wipeDown',
  'wipeLeft', 'wipeRight', 'wipeUp', 'zigzag'
] as const;

export const FILTERS = [
  'elite', 'ultra8k', 'cinematic', 'bloom', 'glitch', 'vhs', 'bw', 'neon', 'golden', 'dramatic',
  'warm', 'cool', 'vintage', 'noir', 'sepia', 'chrome', 'fade', 'moody', 'bright', 'dark',
  'contrast', 'saturated', 'desaturated', 'hazy', 'sharp', 'soft', 'faded', 'rich', 'muted',
  'vibrant', 'pastel', 'highContrast', 'lowContrast', 'blueTint', 'greenTint', 'redTint', 'purpleTint',
  'orangeTint', 'tealTint', 'pinkTint', 'amberTint', 'cement', 'rust', 'ocean', 'forest', 'sunset',
  'dawn', 'dusk', 'midnight', 'noon', 'shadow', 'highlight', 'midtone', 'infraRed', 'xRay', 'dreamy',
  'frozen', 'granular', 'halftone', 'impressionist', 'kaleidoscope', 'liquid', 'mosaic', 'oilPaint',
  'posterize', 'retro', 'sketch', 'thermal', 'vignette', 'watercolor', 'xPro', 'yPro'
] as const;

export type TransitionType = typeof TRANSITIONS[number];
export type FilterType = typeof FILTERS[number];

export const getRandomMusic = (): ViralMusic => {
  return VIRAL_MUSIC[Math.floor(Math.random() * VIRAL_MUSIC.length)];
};

export const getRandomMusicExcluding = (exclude: string): ViralMusic => {
  const available = VIRAL_MUSIC.filter(m => m.id !== exclude);
  return available[Math.floor(Math.random() * available.length)];
};

export const getRandomTransitions = (count: number = 8): TransitionType[] => {
  const shuffled = [...TRANSITIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const getRandomFilters = (count: number = 3): FilterType[] => {
  const shuffled = [...FILTERS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const getAllMusicCount = () => VIRAL_MUSIC.length;
export const getAllTransitionsCount = () => TRANSITIONS.length;
export const getAllFiltersCount = () => FILTERS.length;