import React, { useEffect, useRef } from 'react';
import { initAudioCtx, playWaterDrop, playAirSwoosh, playBirdChirp } from '../lib/synthAudio';

export interface WaterWaveBlob {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
  color: string;
  seed: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  type: 'touch' | 'scroll';
  renderingStyle: 'organic' | 'fluid' | 'bubble' | 'mist' | 'particle' | 'bloom' | 'line' | 'star' | 'ray' | 'galaxy';
}

export const TouchEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let blobs: WaterWaveBlob[] = [];
    
    let w = window.innerWidth;
    let h = window.innerHeight;
    
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    
    window.addEventListener('resize', resize);
    resize();

    let lastWaveTime = 0;
    let lastScrollY = window.scrollY;

    const presets = [
      {
        id: 'cool-water',
        colors: ['rgba(14, 165, 233, ', 'rgba(20, 184, 166, ', 'rgba(45, 212, 191, '],
        type: 'organic' as const,
        defaultAlpha: 0.25,
        defaultSpeed: 1.5,
        defaultMaxRadius: 160
      },
      {
        id: 'ocean-drift',
        colors: ['rgba(30, 64, 175, ', 'rgba(99, 102, 241, ', 'rgba(56, 189, 248, '],
        type: 'fluid' as const,
        defaultAlpha: 0.15,
        defaultSpeed: 1.0,
        defaultMaxRadius: 280
      },
      {
        id: 'spring-rain',
        colors: ['rgba(56, 189, 248, ', 'rgba(224, 242, 254, ', 'rgba(125, 211, 252, '],
        type: 'bubble' as const,
        defaultAlpha: 0.35,
        defaultSpeed: 2.2,
        defaultMaxRadius: 100
      },
      {
        id: 'cosmic-aurora',
        colors: ['rgba(34, 197, 94, ', 'rgba(168, 85, 247, ', 'rgba(236, 72, 153, '],
        type: 'mist' as const,
        defaultAlpha: 0.20,
        defaultSpeed: 0.8,
        defaultMaxRadius: 240
      },
      {
        id: 'golden-glimmer',
        colors: ['rgba(245, 158, 11, ', 'rgba(251, 191, 36, ', 'rgba(217, 119, 6, '],
        type: 'particle' as const,
        defaultAlpha: 0.18,
        defaultSpeed: 1.2,
        defaultMaxRadius: 180
      },
      {
        id: 'deepsea-bubbles',
        colors: ['rgba(14, 165, 233, ', 'rgba(34, 211, 238, ', 'rgba(186, 230, 253, '],
        type: 'bubble' as const,
        defaultAlpha: 0.30,
        defaultSpeed: 1.6,
        defaultMaxRadius: 120
      },
      {
        id: 'emerald-mist',
        colors: ['rgba(16, 185, 129, ', 'rgba(52, 211, 153, ', 'rgba(110, 231, 183, '],
        type: 'mist' as const,
        defaultAlpha: 0.22,
        defaultSpeed: 1.4,
        defaultMaxRadius: 210
      },
      {
        id: 'lotus-bloom',
        colors: ['rgba(244, 63, 94, ', 'rgba(236, 72, 153, ', 'rgba(251, 113, 133, '],
        type: 'bloom' as const,
        defaultAlpha: 0.24,
        defaultSpeed: 1.1,
        defaultMaxRadius: 190
      },
      {
        id: 'sinuous-lines',
        colors: ['rgba(99, 102, 241, ', 'rgba(139, 92, 246, ', 'rgba(196, 181, 253, '],
        type: 'line' as const,
        defaultAlpha: 0.16,
        defaultSpeed: 1.3,
        defaultMaxRadius: 220
      },
      {
        id: 'bioluminescent-star',
        colors: ['rgba(234, 179, 8, ', 'rgba(132, 204, 22, ', 'rgba(163, 230, 53, '],
        type: 'star' as const,
        defaultAlpha: 0.32,
        defaultSpeed: 1.5,
        defaultMaxRadius: 130
      },
      {
        id: 'supernova-rays',
        colors: ['rgba(249, 115, 22, ', 'rgba(239, 68, 68, ', 'rgba(253, 186, 116, '],
        type: 'ray' as const,
        defaultAlpha: 0.20,
        defaultSpeed: 1.8,
        defaultMaxRadius: 170
      },
      {
        id: 'magma-flow',
        colors: ['rgba(239, 68, 68, ', 'rgba(249, 115, 22, ', 'rgba(234, 179, 8, '],
        type: 'fluid' as const,
        defaultAlpha: 0.25,
        defaultSpeed: 0.9,
        defaultMaxRadius: 260
      },
      {
        id: 'crystal-frost',
        colors: ['rgba(224, 242, 254, ', 'rgba(186, 230, 253, ', 'rgba(125, 211, 252, '],
        type: 'particle' as const,
        defaultAlpha: 0.35,
        defaultSpeed: 1.4,
        defaultMaxRadius: 150
      },
      {
        id: 'neon-city',
        colors: ['rgba(236, 72, 153, ', 'rgba(168, 85, 247, ', 'rgba(6, 182, 212, '],
        type: 'line' as const,
        defaultAlpha: 0.25,
        defaultSpeed: 1.6,
        defaultMaxRadius: 200
      },
      {
        id: 'fairy-dust',
        colors: ['rgba(253, 164, 175, ', 'rgba(253, 230, 138, ', 'rgba(255, 255, 255, '],
        type: 'star' as const,
        defaultAlpha: 0.4,
        defaultSpeed: 1.1,
        defaultMaxRadius: 110
      },
      {
        id: 'toxic-sludge',
        colors: ['rgba(132, 204, 22, ', 'rgba(101, 163, 13, ', 'rgba(77, 124, 15, '],
        type: 'organic' as const,
        defaultAlpha: 0.3,
        defaultSpeed: 0.7,
        defaultMaxRadius: 180
      },
      {
        id: 'cloud-puff',
        colors: ['rgba(248, 250, 252, ', 'rgba(226, 232, 240, ', 'rgba(203, 213, 225, '],
        type: 'mist' as const,
        defaultAlpha: 0.15,
        defaultSpeed: 0.6,
        defaultMaxRadius: 250
      },
      {
        id: 'electric-burst',
        colors: ['rgba(56, 189, 248, ', 'rgba(14, 165, 233, ', 'rgba(2, 132, 199, '],
        type: 'ray' as const,
        defaultAlpha: 0.3,
        defaultSpeed: 2.0,
        defaultMaxRadius: 190
      },
      {
        id: 'sakura-petals',
        colors: ['rgba(253, 164, 175, ', 'rgba(244, 114, 182, ', 'rgba(251, 207, 232, '],
        type: 'bloom' as const,
        defaultAlpha: 0.28,
        defaultSpeed: 1.0,
        defaultMaxRadius: 160
      },
      {
        id: 'autumn-leaves',
        colors: ['rgba(217, 119, 6, ', 'rgba(180, 83, 9, ', 'rgba(146, 64, 14, '],
        type: 'particle' as const,
        defaultAlpha: 0.25,
        defaultSpeed: 1.2,
        defaultMaxRadius: 170
      },
      {
        id: 'blood-moon',
        colors: ['rgba(153, 27, 27, ', 'rgba(185, 28, 28, ', 'rgba(220, 38, 38, '],
        type: 'fluid' as const,
        defaultAlpha: 0.2,
        defaultSpeed: 1.1,
        defaultMaxRadius: 270
      },
      {
        id: 'cyber-grid',
        colors: ['rgba(16, 185, 129, ', 'rgba(5, 150, 105, ', 'rgba(4, 120, 87, '],
        type: 'line' as const,
        defaultAlpha: 0.2,
        defaultSpeed: 1.5,
        defaultMaxRadius: 210
      },
      {
        id: 'soap-bubbles',
        colors: ['rgba(244, 114, 182, ', 'rgba(34, 211, 238, ', 'rgba(250, 204, 21, '],
        type: 'bubble' as const,
        defaultAlpha: 0.35,
        defaultSpeed: 1.7,
        defaultMaxRadius: 140
      },
      {
        id: 'plasma-sphere',
        colors: ['rgba(147, 51, 234, ', 'rgba(168, 85, 247, ', 'rgba(192, 132, 252, '],
        type: 'star' as const,
        defaultAlpha: 0.3,
        defaultSpeed: 1.4,
        defaultMaxRadius: 160
      },
      {
        id: 'frost-nova',
        colors: ['rgba(125, 211, 252, ', 'rgba(56, 189, 248, ', 'rgba(14, 165, 233, '],
        type: 'ray' as const,
        defaultAlpha: 0.25,
        defaultSpeed: 1.9,
        defaultMaxRadius: 200
      },
      {
        id: 'void-energy',
        colors: ['rgba(88, 28, 135, ', 'rgba(107, 33, 168, ', 'rgba(126, 34, 206, '],
        type: 'mist' as const,
        defaultAlpha: 0.18,
        defaultSpeed: 0.9,
        defaultMaxRadius: 260
      },
      {
        id: 'desert-mirage',
        colors: ['rgba(253, 186, 116, ', 'rgba(251, 146, 60, ', 'rgba(249, 115, 22, '],
        type: 'fluid' as const,
        defaultAlpha: 0.15,
        defaultSpeed: 0.8,
        defaultMaxRadius: 290
      },
      {
        id: 'jellyfish-glow',
        colors: ['rgba(45, 212, 191, ', 'rgba(20, 184, 166, ', 'rgba(13, 148, 136, '],
        type: 'bloom' as const,
        defaultAlpha: 0.3,
        defaultSpeed: 1.2,
        defaultMaxRadius: 180
      },
      {
        id: 'starlight-ripple',
        colors: ['rgba(254, 240, 138, ', 'rgba(253, 224, 71, ', 'rgba(250, 204, 21, '],
        type: 'organic' as const,
        defaultAlpha: 0.22,
        defaultSpeed: 1.4,
        defaultMaxRadius: 150
      },
      {
        id: 'meteor-shower',
        colors: ['rgba(239, 68, 68, ', 'rgba(245, 158, 11, ', 'rgba(252, 211, 77, '],
        type: 'particle' as const,
        defaultAlpha: 0.35,
        defaultSpeed: 2.1,
        defaultMaxRadius: 130
      },
      {
        id: 'velvet-night',
        colors: ['rgba(30, 58, 138, ', 'rgba(30, 64, 175, ', 'rgba(29, 78, 216, '],
        type: 'mist' as const,
        defaultAlpha: 0.12,
        defaultSpeed: 0.5,
        defaultMaxRadius: 300
      },
      {
        id: 'stellar-galaxy',
        colors: ['rgba(139, 92, 246, ', 'rgba(236, 72, 153, ', 'rgba(56, 189, 248, '],
        type: 'galaxy' as const,
        defaultAlpha: 0.35,
        defaultSpeed: 1.1,
        defaultMaxRadius: 280
      }
    ];

    const getActivePresetDetail = () => {
      const activeId = localStorage.getItem('wave_preset_id') || 'cool-water';
      return presets.find(p => p.id === activeId) || presets[0];
    };

    const getAlphaScale = () => parseFloat(localStorage.getItem('wave_alpha_scale') || '1.0');
    const getSpeedScale = () => parseFloat(localStorage.getItem('wave_speed_scale') || '1.0');
    const getRadiusScale = () => parseFloat(localStorage.getItem('wave_radius_scale') || '1.0');

    const createWaterBlob = (x: number, y: number, type: 'touch' | 'scroll', dx = 0, dy = 0) => {
      const isScrollEnabled = localStorage.getItem('wave_enable_scroll') !== 'false';
      const isTouchEnabled = localStorage.getItem('wave_enable_touch') !== 'false';
      const isSoundEnabled = localStorage.getItem('wave_enable_sound') === 'true';

      if (type === 'scroll' && !isScrollEnabled) return;
      if (type === 'touch' && !isTouchEnabled) return;

      const now = Date.now();
      if (type === 'scroll' && now - lastWaveTime < 100) return; // throttle scroll triggers
      if (type === 'scroll') lastWaveTime = now;

      if (isSoundEnabled) {
        initAudioCtx(); // Safe to call multiple times
        const soundVolumeScale = parseFloat(localStorage.getItem('wave_sound_volume') || '1.0');
        const touchSoundType = localStorage.getItem('wave_touch_sound_type') || 'mixed';
        const scrollSoundType = localStorage.getItem('wave_scroll_sound_type') || 'air';

        if (type === 'touch' && touchSoundType !== 'none') {
           if (touchSoundType === 'bird') {
             playBirdChirp(soundVolumeScale);
           } else if (touchSoundType === 'water') {
             playWaterDrop(soundVolumeScale);
           } else {
             // mixed
             if (Math.random() < 0.15) {
               playBirdChirp(soundVolumeScale);
             } else {
               playWaterDrop(soundVolumeScale);
             }
           }
        } else if (type === 'scroll' && scrollSoundType !== 'none') {
           if (scrollSoundType === 'air') {
             playAirSwoosh(soundVolumeScale);
           }
        }
      }

      const currentPreset = getActivePresetDetail();
      const randomColor = currentPreset.colors[Math.floor(Math.random() * currentPreset.colors.length)];

      const speedMod = getSpeedScale() * currentPreset.defaultSpeed;
      const radiusMod = getRadiusScale() * currentPreset.defaultMaxRadius;
      const alphaMod = getAlphaScale() * currentPreset.defaultAlpha;

      let vx = (Math.random() - 0.5) * 0.4;
      let vy = -0.5 - Math.random() * 0.4;

      const dragDistance = Math.sqrt(dx * dx + dy * dy);
      if (dragDistance > 0.1) {
        // Direct velocity elements relative to the physical travel direction
        vx = (dx / dragDistance) * speedMod * 0.5 + (Math.random() - 0.5) * 0.15;
        vy = (dy / dragDistance) * speedMod * 0.5 + (Math.random() - 0.5) * 0.15;
      }

      if (type === 'touch') {
        const seedVal = Math.random() * 100;
        blobs.push({
          x,
          y,
          radius: 8,
          maxRadius: (Math.random() * 0.3 + 0.85) * radiusMod * (dragDistance > 0.1 ? 0.75 : 1.0),
          speed: 1.2 * speedMod,
          alpha: dragDistance > 0.1 ? alphaMod * 0.75 : alphaMod,
          color: randomColor,
          seed: seedVal,
          vx,
          vy,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.015,
          type: 'touch',
          renderingStyle: currentPreset.type
        });

        // Soft secondary ripple only on static taps/starts to prevent trail screen clutter
        if (dragDistance < 0.1) {
          setTimeout(() => {
            const currentPresetSec = getActivePresetDetail();
            if (localStorage.getItem('wave_enable_touch') === 'false') return;
            const alphaSec = getAlphaScale() * currentPresetSec.defaultAlpha * 0.6;
            const radiusSec = getRadiusScale() * currentPresetSec.defaultMaxRadius * 0.62;
            const speedSec = getSpeedScale() * currentPresetSec.defaultSpeed * 0.75;
            const colorSec = currentPresetSec.colors[Math.floor(Math.random() * currentPresetSec.colors.length)];

            blobs.push({
              x,
              y,
              radius: 4,
              maxRadius: (Math.random() * 0.3 + 0.82) * radiusSec,
              speed: speedSec,
              alpha: alphaSec,
              color: colorSec,
              seed: seedVal + 50,
              vx: (Math.random() - 0.5) * 0.2,
              vy: -0.3,
              rotation: Math.random() * Math.PI * 2,
              rotationSpeed: (Math.random() - 0.5) * 0.01,
              type: 'touch',
              renderingStyle: currentPresetSec.type
            });
          }, 220);
        }
      } else {
        // Scroll waves are even broader, lazier floating water current sheets
        // If scroll direction follow is enabled, adjust the upward/downward velocity to match scroll
        const isScrollFollowEnabled = localStorage.getItem('wave_enable_scroll_follow') !== 'false';
        let scrollVy = (Math.random() - 0.5) * 0.2;
        if (isScrollFollowEnabled && Math.abs(dy) > 0.1) {
          const rawVy = -dy * 0.12 * speedMod;
          const maxVal = 4.5 * speedMod;
          scrollVy = Math.max(-maxVal, Math.min(maxVal, rawVy));
        }

        blobs.push({
          x: Math.random() * w,
          y: y,
          radius: 30,
          maxRadius: (Math.random() * 0.4 + 0.8) * radiusMod * 1.4,
          speed: 0.7 * speedMod,
          alpha: alphaMod * 0.5,
          color: randomColor,
          seed: Math.random() * 200,
          vx: (Math.random() - 0.5) * 0.3,
          vy: scrollVy,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.005,
          type: 'scroll',
          renderingStyle: currentPreset.type
        });
      }
    };

    let isDragging = false;
    let lastDragX = 0;
    let lastDragY = 0;

    const handlePointerDown = (e: PointerEvent | TouchEvent) => {
      let clientX, clientY;
      if ('touches' in e && e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as PointerEvent).clientX;
        clientY = (e as PointerEvent).clientY;
      }
      isDragging = true;
      lastDragX = clientX;
      lastDragY = clientY;
      createWaterBlob(clientX, clientY, 'touch', 0, 0);
    };

    const handlePointerMove = (e: PointerEvent | TouchEvent) => {
      let clientX, clientY, isMouse = false;
      if ('touches' in e && e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as PointerEvent).clientX;
        clientY = (e as PointerEvent).clientY;
        isMouse = (e as PointerEvent).pointerType === 'mouse';
      }

      if (!isDragging && !isMouse) return;

      const dx = clientX - lastDragX;
      const dy = clientY - lastDragY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Track movement. Spawn a fresh trail element moving in the exact direction of finger/mouse slide!
      if (dist > 8 || (!isDragging && isMouse && dist > 3)) {
        createWaterBlob(clientX, clientY, 'touch', dx, dy);
        lastDragX = clientX;
        lastDragY = clientY;
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    // Listen to scroll events to trigger floating background currents
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      // Adjust positions of existing floating blobs to move with the screen scroll content
      const offsetFactor = 0.5; // content moves up, so we move waves gently
      blobs.forEach(b => {
        b.y -= delta * offsetFactor;
      });

      // Generate a soft water current on substantial scrolling activity
      if (Math.abs(delta) > 5) {
        const triggerY = delta > 0 ? h - 50 : 50;
        createWaterBlob(Math.random() * w, triggerY, 'scroll', 0, delta);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown as any);
    window.addEventListener('touchstart', handlePointerDown as any, { passive: true });
    
    window.addEventListener('pointermove', handlePointerMove as any);
    window.addEventListener('touchmove', handlePointerMove as any, { passive: true });
    
    window.addEventListener('pointerup', handlePointerUp as any);
    window.addEventListener('pointercancel', handlePointerUp as any);
    window.addEventListener('touchend', handlePointerUp as any, { passive: true });
    window.addEventListener('touchcancel', handlePointerUp as any, { passive: true });
    
    window.addEventListener('scroll', handleScroll, { passive: true });

    let animationFrameId: number;
    let time = 0;

    const loop = () => {
      time += 0.015;
      ctx.clearRect(0, 0, w, h);
      
      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        
        // Progress expansion
        b.radius += b.speed;
        b.rotation += b.rotationSpeed;
        
        // Drift fluidly
        b.x += b.vx;
        b.y += b.vy;

        const progress = b.radius / b.maxRadius;
        const currentAlpha = Math.max(0, (1 - progress) * b.alpha);
        
        if (progress >= 1 || currentAlpha <= 0.001) {
          blobs.splice(i, 1);
          i--;
          continue;
        }

        // Draw style specific artistic visuals based on preset choices
        switch (b.renderingStyle) {
          case 'organic': {
            // CLASSIC WATER RIPPLE: Beautiful natural watercolor fluid droplet
            ctx.beginPath();
            const numPoints = 64;
            for (let j = 0; j <= numPoints; j++) {
              const angle = (j / numPoints) * Math.PI * 2 + b.rotation;
              const wavePhase = time * 2.5 + b.seed;
              const noiseFactor = b.type === 'scroll' ? 0.25 : 0.16;
              
              const wave1 = Math.sin(angle * 3 + wavePhase) * (b.radius * noiseFactor);
              const wave2 = Math.cos(angle * 5 - wavePhase * 0.7) * (b.radius * 0.08);
              
              const currentRadius = Math.max(2, b.radius + wave1 + wave2);
              const px = b.x + Math.cos(angle) * currentRadius;
              const py = b.y + Math.sin(angle) * currentRadius;
              
              if (j === 0) ctx.moveTo(px, py);
              else ctx.lineTo(px, py);
            }
            ctx.closePath();

            const gradient = ctx.createRadialGradient(b.x, b.y, b.radius * 0.05, b.x, b.y, b.radius * 1.1);
            gradient.addColorStop(0, `${b.color}${currentAlpha * 0.25})`);
            gradient.addColorStop(0.6, `${b.color}${currentAlpha * 0.08})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.strokeStyle = `${b.color}${currentAlpha * 0.35})`;
            ctx.lineWidth = b.type === 'touch' ? 1.2 : 0.6;
            ctx.stroke();
            break;
          }

          case 'fluid': {
            // DEEP OCEAN SHEET: Expansive wavy ribbon covering the screen horizontal sweep
            ctx.beginPath();
            const startY = b.y;
            ctx.moveTo(0, startY);
            for (let lx = 0; lx <= w; lx += 20) {
              const phase = (lx * 0.005) + (time * 1.2) + b.seed;
              const offset = Math.sin(phase) * (b.radius * 0.4) + Math.cos(phase * 0.6) * (b.radius * 0.15);
              ctx.lineTo(lx, startY + offset);
            }
            ctx.strokeStyle = `${b.color}${currentAlpha * 0.25})`;
            ctx.lineWidth = 1.8 + (1 - progress) * 2;
            ctx.stroke();

            // Soft glowing area underneath
            ctx.lineTo(w, startY + b.radius * 0.5);
            ctx.lineTo(0, startY + b.radius * 0.5);
            ctx.closePath();
            
            const oceanGrad = ctx.createLinearGradient(0, startY - b.radius * 0.2, 0, startY + b.radius * 0.6);
            oceanGrad.addColorStop(0, `${b.color}${currentAlpha * 0.12})`);
            oceanGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = oceanGrad;
            ctx.fill();
            break;
          }

          case 'bubble': {
            // DEEPSEA BUBBLE / SPRING RAIN: Concentric circles and splashing droplets
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `${b.color}${currentAlpha * 0.45})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();

            // Tiny concentric secondary bubble ring
            if (b.radius > 25) {
              ctx.beginPath();
              ctx.arc(b.x, b.y, b.radius - 20, 0, Math.PI * 2);
              ctx.strokeStyle = `${b.color}${currentAlpha * 0.25})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }

            // Draw a shiny bubble reflection curve inside
            ctx.beginPath();
            ctx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.25, Math.PI * 1.1, Math.PI * 1.6);
            ctx.strokeStyle = `rgba(255, 255, 255, ${currentAlpha * 0.65})`;
            ctx.lineWidth = 1.0;
            ctx.stroke();
            break;
          }

          case 'mist': {
            // JADE STEAM / COSMIC AURORA: Multi-layered soft foggy mist without lines
            const mistGrad = ctx.createRadialGradient(b.x, b.y, b.radius * 0.1, b.x, b.y, b.radius * 1.25);
            mistGrad.addColorStop(0, `${b.color}${currentAlpha * 0.35})`);
            mistGrad.addColorStop(0.4, `${b.color}${currentAlpha * 0.15})`);
            mistGrad.addColorStop(0.8, `${b.color}${currentAlpha * 0.05})`);
            mistGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 1.3, 0, Math.PI * 2);
            ctx.fillStyle = mistGrad;
            ctx.fill();
            break;
          }

          case 'particle': {
            // SHIMMERING GOLDEN SANDS: Orbital stream of sparks swirling and floating
            const pCount = 16;
            for (let j = 0; j < pCount; j++) {
              const pAngle = (j / pCount) * Math.PI * 2 + time * 1.5 + b.seed;
              const pRadius = b.radius * (0.4 + 0.6 * Math.sin(time + j * 0.3));
              const px = b.x + Math.cos(pAngle) * pRadius;
              const py = b.y + Math.sin(pAngle) * pRadius - (progress * 50); // drift up
              
              const particleAlpha = currentAlpha * (0.6 + 0.4 * Math.sin(time * 6 + j));
              const pSize = Math.max(1.2, 3 * (1 - progress) * (1 + 0.3 * Math.sin(j)));
              
              ctx.beginPath();
              ctx.arc(px, py, pSize, 0, Math.PI * 2);
              ctx.fillStyle = `${b.color}${particleAlpha})`;
              ctx.shadowColor = `${b.color}1)`;
              ctx.shadowBlur = 4;
              ctx.fill();
            }
            ctx.shadowBlur = 0; // reset for performance
            break;
          }

          case 'bloom': {
            // LOTUS BLOOM MANDALAS: Exquisite geometric patterns of petal clusters
            const petals = 6;
            const size = b.radius * 0.45;
            
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.rotation);
            
            for (let j = 0; j < petals; j++) {
              ctx.rotate((Math.PI * 2) / petals);
              // Draw custom bezier petal
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.quadraticCurveTo(-size * 0.5, size * 0.5, 0, size);
              ctx.quadraticCurveTo(size * 0.5, size * 0.5, 0, 0);
              ctx.closePath();
              
              ctx.fillStyle = `${b.color}${currentAlpha * 0.14})`;
              ctx.fill();
              
              ctx.strokeStyle = `${b.color}${currentAlpha * 0.45})`;
              ctx.lineWidth = 0.8;
              ctx.stroke();
            }
            ctx.restore();
            break;
          }

          case 'line': {
            // SINUOUS RIBBON TRAILS: Elegant parallel curved filament strands
            ctx.beginPath();
            const span = b.radius * 0.7;
            const steps = 32;
            for (let j = -2; j <= 2; j++) {
              const offsetY = j * 6;
              for (let k = 0; k <= steps; k++) {
                const ratio = k / steps;
                const lx = b.x - span + ratio * span * 2;
                const wavePhase = (lx * 0.04) - (time * 3) + b.seed;
                const ly = b.y + offsetY + Math.sin(wavePhase) * (offsetY * 0.3 + 12 * (1 - progress));
                
                if (k === 0) ctx.moveTo(lx, ly);
                else ctx.lineTo(lx, ly);
              }
            }
            ctx.strokeStyle = `${b.color}${currentAlpha * 0.30})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
            break;
          }

          case 'star': {
            // DEEPSEA FIREFLIES: Soft breathing circular entities swaying gracefully
            const cx = b.x + Math.sin(time + b.seed) * 15;
            const cy = b.y + Math.cos(time * 0.7 + b.seed) * 15;
            
            // core glow
            const starGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, b.radius * 0.4);
            starGrad.addColorStop(0, `rgba(255, 255, 255, ${currentAlpha * 0.95})`);
            starGrad.addColorStop(0.3, `${b.color}${currentAlpha * 0.6})`);
            starGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.beginPath();
            ctx.arc(cx, cy, b.radius * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = starGrad;
            ctx.fill();

            // Inner sparkles
            ctx.beginPath();
            ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            break;
          }

          case 'ray': {
            // SUPERNOVA SOLAR RAYS: Thin vector pins of light branching out
            const rayCount = 14;
            const outerR = b.radius;
            const innerR = b.radius * 0.2;
            
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.rotation);
            
            for (let j = 0; j < rayCount; j++) {
              const angle = (j / rayCount) * Math.PI * 2;
              const headX = Math.cos(angle) * outerR;
              const headY = Math.sin(angle) * outerR;
              const tailX = Math.cos(angle) * innerR;
              const tailY = Math.sin(angle) * innerR;
              
              ctx.beginPath();
              ctx.moveTo(tailX, tailY);
              ctx.lineTo(headX, headY);
              ctx.strokeStyle = `${b.color}${currentAlpha * (0.85 - (j % 3) * 0.25)})`;
              ctx.lineWidth = 0.9;
              ctx.stroke();
            }
            ctx.restore();
            break;
          }

          case 'galaxy': {
            // SPIRAL GALAXY: Swirling stellar arms that rotate and expand
            const arms = 3;
            const starCount = 30; // stars per arm
            
            ctx.save();
            ctx.translate(b.x, b.y);
            // Rotates based on time and individual blob rotation
            ctx.rotate(b.rotation + time * 0.5);
            
            for (let arm = 0; arm < arms; arm++) {
              const armOffset = (Math.PI * 2 / arms) * arm;
              
              for (let j = 0; j < starCount; j++) {
                // How far along the arm this star is
                const rRatio = j / starCount;
                // Logarithmic spiral math
                const angle = armOffset + rRatio * Math.PI * 3;
                
                // Radius expands outward
                const dist = rRatio * b.radius;
                
                const px = Math.cos(angle) * dist;
                const py = Math.sin(angle) * dist;
                
                // Add some noise to star positions
                const noiseX = Math.cos(b.seed + j) * 8 * rRatio;
                const noiseY = Math.sin(b.seed - j) * 8 * rRatio;
                
                const starSize = Math.max(0.2, (1 - rRatio) * 3 * (1 - progress));
                // Core is brighter, edges fade
                const starAlpha = currentAlpha * (1.2 - rRatio) * (0.5 + 0.5 * Math.sin(time * 3 + j));
                
                ctx.beginPath();
                ctx.arc(px + noiseX, py + noiseY, starSize, 0, Math.PI * 2);
                ctx.fillStyle = `${b.color}${starAlpha})`;
                ctx.fill();
                
                // Occasional bright core star
                if (j % 5 === 0) {
                  ctx.shadowColor = `${b.color}1)`;
                  ctx.shadowBlur = 4;
                  ctx.fill();
                  ctx.shadowBlur = 0;
                }
              }
            }
            ctx.restore();
            
            // Central core glow
            const coreGrad = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, b.radius * 0.35);
            coreGrad.addColorStop(0, `rgba(255, 255, 255, ${currentAlpha * 0.8})`);
            coreGrad.addColorStop(0.3, `${b.color}${currentAlpha * 0.4})`);
            coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = coreGrad;
            ctx.fill();
            break;
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(loop);
    };
    
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', handlePointerDown as any);
      window.removeEventListener('touchstart', handlePointerDown as any);
      
      window.removeEventListener('pointermove', handlePointerMove as any);
      window.removeEventListener('touchmove', handlePointerMove as any);
      
      window.removeEventListener('pointerup', handlePointerUp as any);
      window.removeEventListener('pointercancel', handlePointerUp as any);
      window.removeEventListener('touchend', handlePointerUp as any);
      window.removeEventListener('touchcancel', handlePointerUp as any);
      
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};
