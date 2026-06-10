import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Sliders, Play, Check, HelpCircle, Flame, Eye, RefreshCw, Smartphone } from 'lucide-react';

export interface ThemePreset {
  id: string;
  nameBn: string;
  nameEn: string;
  descBn: string;
  descEn: string;
  colors: string[];
  type: 'organic' | 'fluid' | 'bubble' | 'mist' | 'particle' | 'bloom' | 'line' | 'star' | 'ray' | 'galaxy';
  defaultAlpha: number;
  defaultSpeed: number;
  defaultMaxRadius: number;
}

export const ANIMATION_PRESETS: ThemePreset[] = [
  {
    id: 'cool-water',
    nameBn: 'শান্ত জলতরঙ্গ (Classic Water Ripple)',
    nameEn: 'Classic Water Ripple',
    descBn: 'স্নিগ্ধ অ্যাকোয়া ও ফিরোজা কালারের শান্ত জলতরঙ্গ যা স্ক্রিনে আলতো করে ভেসে ওঠে।',
    descEn: 'Gentle, soothing aqua and turquoise ripples floating upward with elegant tranquility.',
    colors: ['rgba(14, 165, 233, ', 'rgba(20, 184, 166, ', 'rgba(45, 212, 191, '],
    type: 'organic',
    defaultAlpha: 0.25,
    defaultSpeed: 1.5,
    defaultMaxRadius: 160
  },
  {
    id: 'ocean-drift',
    nameBn: 'গভীর মহাসাগর (Deep Ocean Sheet)',
    nameEn: 'Deep Ocean Sheet',
    descBn: 'নীল সমুদ্রের স্রোতের মতো ধীরগতির চওড়া পানির শিট যা স্ক্রোল করলে প্রবহমান মনে হয়।',
    descEn: 'Slow-moving, broad oceanic sheets that surge and drift fluidly when scrolling.',
    colors: ['rgba(30, 64, 175, ', 'rgba(99, 102, 241, ', 'rgba(56, 189, 248, '],
    type: 'fluid',
    defaultAlpha: 0.15,
    defaultSpeed: 1.0,
    defaultMaxRadius: 280
  },
  {
    id: 'spring-rain',
    nameBn: 'ঝিরিঝিরি বৃষ্টি (Gentle Spring Rain)',
    nameEn: 'Gentle Spring Rain',
    descBn: 'গ্রীষ্মের বৃষ্টির ফোটার মতো সূক্ষ্ম ও শান্ত ড্রপ যা স্ক্রোল করলে নিচের দিকে নেমে আসে।',
    descEn: 'Crystalline fluid droplets that fall down softly, mirroring sweet summer rain.',
    colors: ['rgba(56, 189, 248, ', 'rgba(224, 242, 254, ', 'rgba(125, 211, 252, '],
    type: 'bubble',
    defaultAlpha: 0.35,
    defaultSpeed: 2.2,
    defaultMaxRadius: 100
  },
  {
    id: 'cosmic-aurora',
    nameBn: 'রহস্যময় অরোরা (Mystic Cosmic Aurora)',
    nameEn: 'Mystic Cosmic Aurora',
    descBn: 'সবুজ ও বেগুনি রঙের ছোঁয়া যা ইথারের মতো স্ক্রিনের কোণ দিয়ে মিটমিট করে ভেসে বেড়ায়।',
    descEn: 'Ethereal green and violet nebulae drifting like high-atmosphere dynamic auroras.',
    colors: ['rgba(34, 197, 94, ', 'rgba(168, 85, 247, ', 'rgba(236, 72, 153, '],
    type: 'mist',
    defaultAlpha: 0.20,
    defaultSpeed: 0.8,
    defaultMaxRadius: 240
  },
  {
    id: 'golden-glimmer',
    nameBn: 'সোনালী জলকণা (Shimmering Golden Sand)',
    nameEn: 'Shimmering Golden Sand',
    descBn: 'উষ্ণ সোনালী ও অ্যাম্বার কালারের ঝিলমিল ঢেউ যা মনে করাবে পড়ন্ত বিকালের বালুকণা।',
    descEn: 'Warm gold and sparkling amber liquid waves reminiscent of sunset beach tides.',
    colors: ['rgba(245, 158, 11, ', 'rgba(251, 191, 36, ', 'rgba(217, 119, 6, '],
    type: 'particle',
    defaultAlpha: 0.18,
    defaultSpeed: 1.2,
    defaultMaxRadius: 180
  },
  {
    id: 'deepsea-bubbles',
    nameBn: 'গভীর সমুদ্রের বুদ্বুদ (Abyssal Floating Bubbles)',
    nameEn: 'Abyssal Floating Bubbles',
    descBn: 'ফাঁপা ও নরম পানির বুদবুদ যা স্ক্রোল করার সময় হালকা নেচে নেচে উপরের দিকে উঠে আসে।',
    descEn: 'Delicate hollow physical water bubbles that ascend dancingly when you scroll.',
    colors: ['rgba(14, 165, 233, ', 'rgba(34, 211, 238, ', 'rgba(186, 230, 253, '],
    type: 'bubble',
    defaultAlpha: 0.30,
    defaultSpeed: 1.6,
    defaultMaxRadius: 120
  },
  {
    id: 'emerald-mist',
    nameBn: 'হরিৎ কুয়াশা (Jade Garden Mist)',
    nameEn: 'Jade Garden Mist',
    descBn: 'সবুজ মখমলের মতো নরম এবং রিফ্রেশিং রঙের জলকণা যা চোখকে আরাম দেয়।',
    descEn: 'Velvety jade and emerald waters breathing a restorative cool botanical atmosphere.',
    colors: ['rgba(16, 185, 129, ', 'rgba(52, 211, 153, ', 'rgba(110, 231, 183, '],
    type: 'mist',
    defaultAlpha: 0.22,
    defaultSpeed: 1.4,
    defaultMaxRadius: 210
  },
  {
    id: 'lotus-bloom',
    nameBn: 'পদ্মের পাপড়ি মেলা (Lotus Bloom Mandalas)',
    nameEn: 'Lotus Bloom Mandalas',
    descBn: 'পদ্মফুলের মতো জ্যামিতিক শান্ত পাপড়ির বিন্যাস যা স্পর্শের সাথে সাথে চক্রাকারে বিকশিত হয়।',
    descEn: 'Geometric nested lotus leaf outlines expanding and revolving beautifully in circular harmony.',
    colors: ['rgba(244, 63, 94, ', 'rgba(236, 72, 153, ', 'rgba(251, 113, 133, '],
    type: 'bloom',
    defaultAlpha: 0.24,
    defaultSpeed: 1.1,
    defaultMaxRadius: 190
  },
  {
    id: 'sinuous-lines',
    nameBn: 'সমান্তরাল তরঙ্গ রেখা (Sinuous Ribbon Trails)',
    nameEn: 'Sinuous Ribbon Trails',
    descBn: 'অত্যন্ত মসৃণ, সমান্তরাল এবং রেশমের মতো বাঁকা সুতার ঢেউ যা স্রোতের মতো বয়ে যায়।',
    descEn: 'Silky smooth parallel curves undulating dynamically to form beautiful stream paths.',
    colors: ['rgba(99, 102, 241, ', 'rgba(139, 92, 246, ', 'rgba(196, 181, 253, '],
    type: 'line',
    defaultAlpha: 0.16,
    defaultSpeed: 1.3,
    defaultMaxRadius: 220
  },
  {
    id: 'bioluminescent-star',
    nameBn: 'আলোর জোনাকি (Deepsea Fireflies)',
    nameEn: 'Deepsea Fireflies',
    descBn: 'শ্বাসপ্রশ্বাসের মতো হালকা জ্বলজ্বলে জোনাকির আলো যা স্ক্রল করার সময় এদিক-ওদিক দোলে।',
    descEn: 'Softly breathing point fireflies drifting left and right dynamically as you scroll.',
    colors: ['rgba(234, 179, 8, ', 'rgba(132, 204, 22, ', 'rgba(163, 230, 53, '],
    type: 'star',
    defaultAlpha: 0.32,
    defaultSpeed: 1.5,
    defaultMaxRadius: 130
  },
  {
    id: 'supernova-rays',
    nameBn: 'মহাজাগতিক আলোকছটা (Supernova Solar Rays)',
    nameEn: 'Supernova Solar Rays',
    descBn: 'নক্ষত্রের বিস্ফোরণের মতো কোমল ও বিস্তৃত আলোক রশ্মি যা স্পর্শে চর্তুদিকে ছড়িয়ে পড়ে।',
    descEn: 'Expansive soft visual solar rays emanating outward from the click or scroll source.',
    colors: ['rgba(249, 115, 22, ', 'rgba(239, 68, 68, ', 'rgba(253, 186, 116, '],
    type: 'ray',
    defaultAlpha: 0.20,
    defaultSpeed: 1.8,
    defaultMaxRadius: 170
  },
  {
    id: 'magma-flow',
    nameBn: 'লাভা প্রবাহ (Magma Flow)',
    nameEn: 'Magma Flow',
    descBn: 'উত্তপ্ত লাভা প্রবাহের মতো গাঢ় লাল এবং কমলা রঙের তরল ছায়া।',
    descEn: 'Deep red and bright orange fluid waves resembling hot flowing magma.',
    colors: ['rgba(239, 68, 68, ', 'rgba(249, 115, 22, ', 'rgba(234, 179, 8, '],
    type: 'fluid',
    defaultAlpha: 0.25,
    defaultSpeed: 0.9,
    defaultMaxRadius: 260
  },
  {
    id: 'crystal-frost',
    nameBn: 'তুষার বৃত্ত (Crystal Frost)',
    nameEn: 'Crystal Frost',
    descBn: 'হিমশীতল নীল কণা যা বরফের গুঁড়োর মতো স্ক্রিনে ছড়িয়ে পড়ে।',
    descEn: 'Icy cyan and white particles shattering and freezing beautifully.',
    colors: ['rgba(224, 242, 254, ', 'rgba(186, 230, 253, ', 'rgba(125, 211, 252, '],
    type: 'particle',
    defaultAlpha: 0.35,
    defaultSpeed: 1.4,
    defaultMaxRadius: 150
  },
  {
    id: 'neon-city',
    nameBn: 'নিওন রেখা (Neon City Trails)',
    nameEn: 'Neon City Trails',
    descBn: 'ভবিষ্যতের সাইবারপাঙ্ক শহরের মতো উজ্জ্বল ম্যাজেন্টা এবং সায়ান রেখা।',
    descEn: 'Bright magenta and cyan abstract vector trails representing cyberpunk energy.',
    colors: ['rgba(236, 72, 153, ', 'rgba(168, 85, 247, ', 'rgba(6, 182, 212, '],
    type: 'line',
    defaultAlpha: 0.25,
    defaultSpeed: 1.6,
    defaultMaxRadius: 200
  },
  {
    id: 'fairy-dust',
    nameBn: 'পরীর ধুলো (Fairy Dust)',
    nameEn: 'Fairy Dust',
    descBn: 'মিষ্টি গোলাপি ও সোনালী রঙের ম্যাজিক তারা যা স্ক্রিনে ঝলমল করে।',
    descEn: 'Tiny golden and pink magical stars glittering gracefully as you scroll.',
    colors: ['rgba(253, 164, 175, ', 'rgba(253, 230, 138, ', 'rgba(255, 255, 255, '],
    type: 'star',
    defaultAlpha: 0.4,
    defaultSpeed: 1.1,
    defaultMaxRadius: 110
  },
  {
    id: 'toxic-sludge',
    nameBn: 'বিষাক্ত স্লাইম (Toxic Sludge)',
    nameEn: 'Toxic Sludge',
    descBn: 'গাঢ় সবুজ রঙের স্লাইম ইফেক্ট যা অদ্ভুত জৈব আকৃতি গঠন করে।',
    descEn: 'A fascinating organic blend of bright lime and dark greens mimicking sludge.',
    colors: ['rgba(132, 204, 22, ', 'rgba(101, 163, 13, ', 'rgba(77, 124, 15, '],
    type: 'organic',
    defaultAlpha: 0.3,
    defaultSpeed: 0.7,
    defaultMaxRadius: 180
  },
  {
    id: 'cloud-puff',
    nameBn: 'মেঘের ভেলা (Fluffy Clouds)',
    nameEn: 'Fluffy Clouds',
    descBn: 'সাদা ও ছাই রঙের তুলতুলে শান্ত মেঘের কুয়াশা।',
    descEn: 'Very clean white and silver-grey fog recreating a cloudy daytime sky.',
    colors: ['rgba(248, 250, 252, ', 'rgba(226, 232, 240, ', 'rgba(203, 213, 225, '],
    type: 'mist',
    defaultAlpha: 0.15,
    defaultSpeed: 0.6,
    defaultMaxRadius: 250
  },
  {
    id: 'electric-burst',
    nameBn: 'বৈদ্যুতিক ঝলক (Electric Burst)',
    nameEn: 'Electric Burst',
    descBn: 'বিদ্যুৎ চমকের মতো দ্রুত আলোকিত হওয়া নীল রশ্মি।',
    descEn: 'Intense and rapid sharp cyan light rays mimicking an electrical pulse.',
    colors: ['rgba(56, 189, 248, ', 'rgba(14, 165, 233, ', 'rgba(2, 132, 199, '],
    type: 'ray',
    defaultAlpha: 0.3,
    defaultSpeed: 2.0,
    defaultMaxRadius: 190
  },
  {
    id: 'sakura-petals',
    nameBn: 'সাকুরা পুষ্প (Sakura Petals)',
    nameEn: 'Sakura Petals',
    descBn: 'হালকা গোলাপি চেরি ফুলের পাপড়ির মতো জ্যামিতিক নকশা।',
    descEn: 'Pink mandalas and falling geometric blooms inspired by japanese cherry blossoms.',
    colors: ['rgba(253, 164, 175, ', 'rgba(244, 114, 182, ', 'rgba(251, 207, 232, '],
    type: 'bloom',
    defaultAlpha: 0.28,
    defaultSpeed: 1.0,
    defaultMaxRadius: 160
  },
  {
    id: 'autumn-leaves',
    nameBn: 'শরতের পাতা (Autumn Leaves)',
    nameEn: 'Autumn Leaves',
    descBn: 'উষ্ণ কমলা আর সোনালী পাতার গুচ্ছে বাতাসের দোলা।',
    descEn: 'Swirling bronze and orange particles drifting like autumn foliage.',
    colors: ['rgba(217, 119, 6, ', 'rgba(180, 83, 9, ', 'rgba(146, 64, 14, '],
    type: 'particle',
    defaultAlpha: 0.25,
    defaultSpeed: 1.2,
    defaultMaxRadius: 170
  },
  {
    id: 'blood-moon',
    nameBn: 'রক্তিম চন্দ্র (Blood Lunar Tide)',
    nameEn: 'Blood Lunar Tide',
    descBn: 'রহস্যময় গাঢ় লাল স্রোত যা অন্ধকারের মাঝে প্রবাহিত হয়।',
    descEn: 'Deep crimson heavy waters swaying gracefully under darkness.',
    colors: ['rgba(153, 27, 27, ', 'rgba(185, 28, 28, ', 'rgba(220, 38, 38, '],
    type: 'fluid',
    defaultAlpha: 0.2,
    defaultSpeed: 1.1,
    defaultMaxRadius: 270
  },
  {
    id: 'cyber-grid',
    nameBn: 'সাইবার ম্যাট্রিক্স (Cyber Matrix Net)',
    nameEn: 'Cyber Matrix Net',
    descBn: 'ডিজিটাল জালিকাবিন্যাসের মতো সবুজ রেখা যা ডেটা ফ্লো মনে করায়।',
    descEn: 'Digital emerald parallel datastreams cascading systematically.',
    colors: ['rgba(16, 185, 129, ', 'rgba(5, 150, 105, ', 'rgba(4, 120, 87, '],
    type: 'line',
    defaultAlpha: 0.2,
    defaultSpeed: 1.5,
    defaultMaxRadius: 210
  },
  {
    id: 'soap-bubbles',
    nameBn: 'রঙিন সাবান বুদ্বুদ (Prism Bubbles)',
    nameEn: 'Prism Bubbles',
    descBn: 'রঙিন বুদবুদ যা আকাশে উড়ে যাওয়ার সময় আলোর ছটা ছড়ায়।',
    descEn: 'Multicolor hollow bubbles shimmering in cyan, pink, and yellow hues.',
    colors: ['rgba(244, 114, 182, ', 'rgba(34, 211, 238, ', 'rgba(250, 204, 21, '],
    type: 'bubble',
    defaultAlpha: 0.35,
    defaultSpeed: 1.7,
    defaultMaxRadius: 140
  },
  {
    id: 'plasma-sphere',
    nameBn: 'প্লাজমা বিন্দু (Plasma Sphere)',
    nameEn: 'Plasma Sphere',
    descBn: 'বেগুনি ও নীল আলোর উজ্জ্বল বর্তুলাকার শক্তি যা তারার মতো জ্বলে।',
    descEn: 'Glowing violet points of intense energy fading softly in the darkness.',
    colors: ['rgba(147, 51, 234, ', 'rgba(168, 85, 247, ', 'rgba(192, 132, 252, '],
    type: 'star',
    defaultAlpha: 0.3,
    defaultSpeed: 1.4,
    defaultMaxRadius: 160
  },
  {
    id: 'frost-nova',
    nameBn: 'হিমশীতল নোভা (Frost Nova Ray)',
    nameEn: 'Frost Nova Ray',
    descBn: 'বরফের তীক্ষ্ণ স্রোতের মতো যা চারদিকে ছড়িয়ে যায়।',
    descEn: 'Sharp icy blue lines diverging outward resembling freezing spells.',
    colors: ['rgba(125, 211, 252, ', 'rgba(56, 189, 248, ', 'rgba(14, 165, 233, '],
    type: 'ray',
    defaultAlpha: 0.25,
    defaultSpeed: 1.9,
    defaultMaxRadius: 200
  },
  {
    id: 'void-energy',
    nameBn: 'শূন্যস্থানের শক্তি (Void Energy Mist)',
    nameEn: 'Void Energy Mist',
    descBn: 'কালো এবং মহাজাগতিক বেগুনি রঙের গভীর কুয়াশা।',
    descEn: 'Deep purple and obsidian fog swirling slowly like black hole accretion.',
    colors: ['rgba(88, 28, 135, ', 'rgba(107, 33, 168, ', 'rgba(126, 34, 206, '],
    type: 'mist',
    defaultAlpha: 0.18,
    defaultSpeed: 0.9,
    defaultMaxRadius: 260
  },
  {
    id: 'desert-mirage',
    nameBn: 'মরুভূমির মরীচিকা (Desert Mirage)',
    nameEn: 'Desert Mirage',
    descBn: 'মরুভূমির বালুঝড়ের মতো বিশাল হলুদ-কমলা রঙের ঢেউ।',
    descEn: 'Large sweeping amber currents resembling hot desert winds.',
    colors: ['rgba(253, 186, 116, ', 'rgba(251, 146, 60, ', 'rgba(249, 115, 22, '],
    type: 'fluid',
    defaultAlpha: 0.15,
    defaultSpeed: 0.8,
    defaultMaxRadius: 290
  },
  {
    id: 'jellyfish-glow',
    nameBn: 'জেলিফিশের আলো (Jellyfish Bioluminescence)',
    nameEn: 'Jellyfish Bioluminescence',
    descBn: 'সমুদ্রের জেলিফিশের মতো নরম ব্লুম আকৃতি যা নীলচে আলো দেয়।',
    descEn: 'Organic geometric mandalas that evoke deep sea jellyfish movement.',
    colors: ['rgba(45, 212, 191, ', 'rgba(20, 184, 166, ', 'rgba(13, 148, 136, '],
    type: 'bloom',
    defaultAlpha: 0.3,
    defaultSpeed: 1.2,
    defaultMaxRadius: 180
  },
  {
    id: 'starlight-ripple',
    nameBn: 'তারকাজলের ঢেউ (Starlight Ripple)',
    nameEn: 'Starlight Ripple',
    descBn: 'জলের মধ্যে প্রতিফলিত হলুদ তারার মতো কোমল তরঙ্গ।',
    descEn: 'Pale yellow liquid ripples that mirror starlight hitting a calm pond.',
    colors: ['rgba(254, 240, 138, ', 'rgba(253, 224, 71, ', 'rgba(250, 204, 21, '],
    type: 'organic',
    defaultAlpha: 0.22,
    defaultSpeed: 1.4,
    defaultMaxRadius: 150
  },
  {
    id: 'meteor-shower',
    nameBn: 'উল্কাপাত (Meteor Shower)',
    nameEn: 'Meteor Shower',
    descBn: 'আকাশ থেকে দ্রুত খসে পড়া কমলা আগুনের শিখার মতো কণা।',
    descEn: 'Fast intense burning particles resembling shooting stars entering atmosphere.',
    colors: ['rgba(239, 68, 68, ', 'rgba(245, 158, 11, ', 'rgba(252, 211, 77, '],
    type: 'particle',
    defaultAlpha: 0.35,
    defaultSpeed: 2.1,
    defaultMaxRadius: 130
  },
  {
    id: 'velvet-night',
    nameBn: 'মখমলের রজনী (Velvet Night)',
    nameEn: 'Velvet Night',
    descBn: 'শান্ত ও ধীর গতির গাঢ় নীল রাতের আকাশের মতো আবহ।',
    descEn: 'Extremely soft and dark blue foggy overlay moving almost invisibly.',
    colors: ['rgba(30, 58, 138, ', 'rgba(30, 64, 175, ', 'rgba(29, 78, 216, '],
    type: 'mist',
    defaultAlpha: 0.12,
    defaultSpeed: 0.5,
    defaultMaxRadius: 300
  },
  {
    id: 'stellar-galaxy',
    nameBn: 'ছায়াপথ (Stellar Galaxy)',
    nameEn: 'Stellar Galaxy',
    descBn: 'ঘূর্ণায়মান তারার মতো মহাজাগতিক স্পাইরাল গ্যালাক্সি।',
    descEn: 'Swirling cosmic spiral galaxies of purple and pink stars that gracefully follow your cursor.',
    colors: ['rgba(139, 92, 246, ', 'rgba(236, 72, 153, ', 'rgba(56, 189, 248, '],
    type: 'galaxy',
    defaultAlpha: 0.35,
    defaultSpeed: 1.1,
    defaultMaxRadius: 280
  }
];

export function ThemeCustomizer() {
  const navigate = useNavigate();

  // Load state from localStorage or use defaults
  const [activePreset, setActivePreset] = useState(() => localStorage.getItem('wave_preset_id') || 'cool-water');
  const [alphaScale, setAlphaScale] = useState(() => parseFloat(localStorage.getItem('wave_alpha_scale') || '1.0'));
  const [speedScale, setSpeedScale] = useState(() => parseFloat(localStorage.getItem('wave_speed_scale') || '1.0'));
  const [radiusScale, setRadiusScale] = useState(() => parseFloat(localStorage.getItem('wave_radius_scale') || '1.0'));
  const [enableScrollWaves, setEnableScrollWaves] = useState(() => localStorage.getItem('wave_enable_scroll') !== 'false');
  const [enableTouchWaves, setEnableTouchWaves] = useState(() => localStorage.getItem('wave_enable_touch') !== 'false');
  const [enableScrollFollow, setEnableScrollFollow] = useState(() => localStorage.getItem('wave_enable_scroll_follow') !== 'false');

  // Preview testing values in interactive board
  const [clickCount, setClickCount] = useState(0);

  const [enableSoundEffects, setEnableSoundEffects] = useState(() => localStorage.getItem('wave_enable_sound') === 'true');
  const [soundVolumeScale, setSoundVolumeScale] = useState(() => parseFloat(localStorage.getItem('wave_sound_volume') || '1.0'));
  const [touchSoundType, setTouchSoundType] = useState(() => localStorage.getItem('wave_touch_sound_type') || 'mixed');
  const [scrollSoundType, setScrollSoundType] = useState(() => localStorage.getItem('wave_scroll_sound_type') || 'air');

  useEffect(() => {
    localStorage.setItem('wave_preset_id', activePreset);
  }, [activePreset]);

  useEffect(() => {
    localStorage.setItem('wave_alpha_scale', alphaScale.toString());
  }, [alphaScale]);

  useEffect(() => {
    localStorage.setItem('wave_speed_scale', speedScale.toString());
  }, [speedScale]);

  useEffect(() => {
    localStorage.setItem('wave_radius_scale', radiusScale.toString());
  }, [radiusScale]);

  useEffect(() => {
    localStorage.setItem('wave_enable_scroll', enableScrollWaves.toString());
  }, [enableScrollWaves]);

  useEffect(() => {
    localStorage.setItem('wave_enable_touch', enableTouchWaves.toString());
  }, [enableTouchWaves]);

  useEffect(() => {
    localStorage.setItem('wave_enable_scroll_follow', enableScrollFollow.toString());
  }, [enableScrollFollow]);

  useEffect(() => {
    localStorage.setItem('wave_enable_sound', enableSoundEffects.toString());
  }, [enableSoundEffects]);

  useEffect(() => {
    localStorage.setItem('wave_sound_volume', soundVolumeScale.toString());
  }, [soundVolumeScale]);

  useEffect(() => {
    localStorage.setItem('wave_touch_sound_type', touchSoundType);
  }, [touchSoundType]);

  useEffect(() => {
    localStorage.setItem('wave_scroll_sound_type', scrollSoundType);
  }, [scrollSoundType]);

  const handleResetToDefault = () => {
    const selected = ANIMATION_PRESETS.find(p => p.id === activePreset) || ANIMATION_PRESETS[0];
    setAlphaScale(1.0);
    setSpeedScale(1.0);
    setRadiusScale(1.0);
    setEnableScrollWaves(true);
    setEnableTouchWaves(true);
    setEnableScrollFollow(true);
    setSoundVolumeScale(1.0);
    setTouchSoundType('mixed');
    setScrollSoundType('air');
  };

  const handlePresetSelect = (presetId: string) => {
    setActivePreset(presetId);
    // Auto reset to default scales of the newly selected preset to guarantee perfect initial aesthetic
    setAlphaScale(1.0);
    setSpeedScale(1.0);
    setRadiusScale(1.0);
  };

  const currentPreset = ANIMATION_PRESETS.find(p => p.id === activePreset) || ANIMATION_PRESETS[0];

  return (
    <div className="w-full min-h-[100dvh] flex flex-col bg-slate-50 dark:bg-[#070b14] font-sans pb-24 transition-colors duration-300">
      
      {/* Sticky Header */}
      <div className="w-full bg-white dark:bg-[#111936] border-b border-slate-200 dark:border-indigo-950/40 p-4 sticky top-0 z-40 transition-colors shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition-all font-bold text-xs text-slate-700 dark:text-slate-350"
          >
            <ArrowLeft className="w-4 h-4" /> Home (হোম)
          </button>
          
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-500 animate-[bounce_2s_infinite]" />
            <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-emerald-400">
              Interactive Animation Settings
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Banner with explanations */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-indigo-500/10 border border-emerald-500/20 rounded-[2rem] p-6 mb-8 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-emerald-400 mb-2" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
            মোবাইল স্ক্রোল ও টাচ অ্যানিমেশন কাস্টমাইজেশন
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
            আপনার স্পোকেন গাইড অ্যাপটিতে প্রানের স্পন্দন যোগ করতে আমরা তৈরি করেছি একদম বাস্তব পানির মত ভাসমান ও স্ক্রোল-রেসপন্সিভ ওয়াটার ওয়েভ সিস্টেম। আপনি এখানে নিজের পছন্দমত যেকোনো মোড সিলেক্ট করতে পারেন এবং এর গতি ও ঘনত্ব নিজের মনের মতো সাজাতে পারেন।
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
            <span className="bg-white/60 dark:bg-slate-900/40 px-2 py-1 rounded-md border border-slate-200/50 dark:border-slate-800">📱 Scroll-Responsive</span>
            <span className="bg-white/60 dark:bg-slate-900/40 px-2 py-1 rounded-md border border-slate-200/50 dark:border-slate-800">🎨 Soft Contrasts</span>
            <span className="bg-white/60 dark:bg-slate-900/40 px-2 py-1 rounded-md border border-slate-200/50 dark:border-slate-800">🍃 Eye-Care Relaxing</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT PANELS: PRESET SELECTOR (SPAN 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xs">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-150 mb-4 flex items-center gap-2" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                🎯 ওয়েভ থিম সিলেক্ট করুন ({ANIMATION_PRESETS.length}টি চমৎকার ইফেক্ট)
              </h3>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {ANIMATION_PRESETS.map((p) => {
                  const isActive = p.id === activePreset;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handlePresetSelect(p.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 relative overflow-hidden group ${
                        isActive 
                          ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/15 shadow-sm ring-1 ring-indigo-400/30' 
                          : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 hover:bg-slate-100/30 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-0.5">
                          <h4 className="text-[13px] font-black text-slate-900 dark:text-white leading-tight" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                            {p.nameBn}
                          </h4>
                          <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                            {p.type} Waves
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 pr-14">
                            {p.descBn}
                          </p>
                        </div>
                        
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border shrink-0 transition-all mt-1 ${
                          isActive 
                            ? 'bg-indigo-550 border-indigo-600 text-white dark:bg-indigo-650' 
                            : 'border-slate-300 dark:border-slate-700 bg-transparent'
                        }`}>
                          {isActive && <Check className="w-2.5" />}
                        </div>
                      </div>

                      {/* Small floating color circles bubble */}
                      <div className="absolute right-3 bottom-3 flex gap-1 items-center">
                        {p.colors.map((c, idx) => (
                          <span 
                            key={idx} 
                            className="w-2 h-2 rounded-full shadow-xs border border-white/20"
                            style={{ backgroundColor: `${c}0.85)` }}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT PANELS: CONTROLS & TEST DRUM (SPAN 1) */}
          <div className="space-y-6">
            
            {/* Live Fine-tuning Modifiers */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5" style={{ fontFamily: "'Hind Siliguri', sans-serif" }}>
                  <Sliders className="w-4 h-4 text-indigo-500" /> ফাইন-টিউন সেটিংস
                </h3>
                <button 
                  onClick={handleResetToDefault} 
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <RefreshCw className="w-3 h-3" /> Reset
                </button>
              </div>

              {/* Toggle Switches */}
              <div className="space-y-3.5 border-b border-slate-100 dark:border-slate-800 pb-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex flex-col">
                    <span>Sound Effects (সাউন্ড ইফেক্ট)</span>
                    <span className="text-[10px] font-normal text-slate-400">রিলাক্সিং ওয়েভ এবং ইন্টার‍্যাকশন সাউন্ড</span>
                  </span>
                  <input 
                    type="checkbox" 
                    checked={enableSoundEffects} 
                    onChange={(e) => setEnableSoundEffects(e.target.checked)}
                    className="w-4 h-4 text-indigo-650 rounded border-slate-350 focus:ring-indigo-500"
                  />
                </label>
                
                {enableSoundEffects && (
                  <div className="pl-4 space-y-4 pt-2 pb-2 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border-l-2 border-indigo-200 dark:border-indigo-900 mt-2">
                    {/* Volume Modifier */}
                    <div className="space-y-1.5 pr-4">
                      <div className="flex justify-between text-xs font-bold text-slate-500">
                        <span>সাউন্ড ভলিউম (Volume)</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{Math.round(soundVolumeScale * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.0" 
                        max="2.0" 
                        step="0.1"
                        value={soundVolumeScale} 
                        onChange={(e) => setSoundVolumeScale(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                    </div>

                    {/* Touch Sound Type */}
                    <div className="flex flex-col gap-1.5 pr-4">
                      <label className="text-xs font-bold text-slate-500">স্পর্শের শব্দ (Touch Sound)</label>
                      <select 
                        value={touchSoundType}
                        onChange={(e) => setTouchSoundType(e.target.value)}
                        className="bg-white dark:bg-[#0b1021] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="water">পানির ফোঁটা (Water Drop)</option>
                        <option value="bird">পাখির ডাক (Bird Chirp)</option>
                        <option value="mixed">মিশ্র (Mixed Nature)</option>
                        <option value="none">বন্ধ (None)</option>
                      </select>
                    </div>

                    {/* Scroll Sound Type */}
                    <div className="flex flex-col gap-1.5 pr-4">
                      <label className="text-xs font-bold text-slate-500">স্ক্রোল শব্দ (Scroll Sound)</label>
                      <select 
                        value={scrollSoundType}
                        onChange={(e) => setScrollSoundType(e.target.value)}
                        className="bg-white dark:bg-[#0b1021] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="air">বাতাসের শব্দ (Air Swoosh)</option>
                        <option value="none">বন্ধ (None)</option>
                      </select>
                    </div>
                  </div>
                )}

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Scroll Responsive (স্ক্রোল ইফেক্ট)
                  </span>
                  <input 
                    type="checkbox" 
                    checked={enableScrollWaves} 
                    onChange={(e) => setEnableScrollWaves(e.target.checked)}
                    className="w-4 h-4 text-indigo-650 rounded border-slate-350 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Screen Touch Wave (টাচ ওয়াটার ঢেউ)
                  </span>
                  <input 
                    type="checkbox" 
                    checked={enableTouchWaves} 
                    onChange={(e) => setEnableTouchWaves(e.target.checked)}
                    className="w-4 h-4 text-indigo-650 rounded border-slate-350 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex flex-col">
                    <span>Scroll Direction Follow (স্ক্রোল অনুসরণ)</span>
                    <span className="text-[10px] font-normal text-slate-400">স্ক্রোল গতি অনুযায়ী ঢেউ প্রবাহিত হবে</span>
                  </span>
                  <input 
                    type="checkbox" 
                    checked={enableScrollFollow} 
                    onChange={(e) => setEnableScrollFollow(e.target.checked)}
                    className="w-4 h-4 text-indigo-650 rounded border-slate-350 focus:ring-indigo-500"
                  />
                </label>
              </div>

              {/* Slider Controls */}
              <div className="space-y-4">
                {/* Opacity / Alpha Control */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>ব্রাইটনেস / অসচ্ছতা (Opacity)</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{Math.round(alphaScale * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.2" 
                    max="2.0" 
                    step="0.1"
                    value={alphaScale} 
                    onChange={(e) => setAlphaScale(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Speed Modifier */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>ঢেউয়ের গতিবেগ (Wave Speed)</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{Math.round(speedScale * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.3" 
                    max="2.0" 
                    step="0.1"
                    value={speedScale} 
                    onChange={(e) => setSpeedScale(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Wave size scale */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>ঢেউয়ের বিস্তার (Wave Size)</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{Math.round(radiusScale * 100)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0.4" 
                    max="1.8" 
                    step="0.1"
                    value={radiusScale} 
                    onChange={(e) => setRadiusScale(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Tap Playground Container */}
            <div 
              onClick={() => setClickCount(c => c + 1)}
              className="bg-gradient-to-[150deg] from-slate-900 to-[#111936] text-white p-6 rounded-3xl border border-white/5 shadow-xl text-center cursor-pointer select-none py-8 relative overflow-hidden"
            >
              <div 
                className="absolute inset-0 transition-opacity duration-300 pointer-events-none" 
                style={{ 
                  background: `radial-gradient(circle at 50% 50%, ${currentPreset.colors[0]}0.3) 0%, transparent 70%)` 
                }}
              />
              
              <div className="relative z-10 space-y-3.5">
                <span className="text-[10px] font-black tracking-widest bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 uppercase">
                  🌊 Interactive Zone
                </span>
                <p className="text-xs text-slate-300 font-medium px-4 leading-relaxed">
                  এখানে ট্যাপ বা ক্লিক করে সিলেক্টেড পানির ঢেউটির মোলায়েম মুভমেন্ট পরীক্ষা করে দেখুন।
                </p>
                <div className="w-12 h-12 rounded-full border border-white/20 bg-white/5 hover:scale-105 active:scale-95 transition-all flex items-center justify-center mx-auto shadow-sm">
                  <Play className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
                </div>
                <div className="text-[10px] font-bold text-slate-400">
                  মোট টেষ্ট ক্লিক: {clickCount} বার
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
