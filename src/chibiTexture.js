import * as THREE from 'three';

// Procedural Canvas Texture Generator for Toy-Grade Chibi Sumos
export class ChibiTextureFactory {
  // 1. High-Resolution Expressive Chibi Face Texture (512x280 isotropic for curved head shell)
  static createFaceTexture(state = 'normal', traitVariant = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');
    this.renderFaceOnCanvas(ctx, state, traitVariant);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return { canvas, ctx, texture };
  }

  static renderFaceOnCanvas(ctx, state = 'normal', traitVariant = 0) {
    const W = 512;
    const H = 280;
    ctx.clearRect(0, 0, W, H);

    const leftEyeX = 168;
    const rightEyeX = 344;
    const eyeY = 138;

    // 1. Soft Rosy Airbrushed Cheeks + Cute Vinyl Blush Shine Oval
    [
      { x: leftEyeX - 32, y: eyeY + 48, shineOffset: -10 },
      { x: rightEyeX + 32, y: eyeY + 48, shineOffset: 10 }
    ].forEach(cheek => {
      const blush = ctx.createRadialGradient(cheek.x, cheek.y, 4, cheek.x, cheek.y, 58);
      blush.addColorStop(0, 'rgba(255, 98, 125, 0.62)');
      blush.addColorStop(0.5, 'rgba(255, 115, 138, 0.30)');
      blush.addColorStop(1, 'rgba(255, 115, 138, 0.0)');
      ctx.fillStyle = blush;
      ctx.beginPath();
      ctx.ellipse(cheek.x, cheek.y, 58, 42, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tiny glossy vinyl cheek highlight
      ctx.save();
      ctx.translate(cheek.x + cheek.shineOffset, cheek.y - 8);
      ctx.rotate(cheek.shineOffset < 0 ? -0.3 : 0.3);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Subtle soft shadow just under the 3D button nose (at center x=256, y=170)
    const noseUnder = ctx.createRadialGradient(256, 176, 1, 256, 176, 14);
    noseUnder.addColorStop(0, 'rgba(165, 80, 65, 0.32)');
    noseUnder.addColorStop(1, 'rgba(165, 80, 65, 0.0)');
    ctx.fillStyle = noseUnder;
    ctx.beginPath();
    ctx.ellipse(256, 176, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Helper for personality eyebrows in normal/blink states
    const drawPersonalityBrows = () => {
      ctx.fillStyle = '#191516';
      if (traitVariant === 2) {
        // Fierce Powerhouse / Berserker V-angled brows
        ctx.beginPath();
        ctx.moveTo(122, 74);
        ctx.quadraticCurveTo(168, 62, 214, 86);
        ctx.quadraticCurveTo(174, 84, 130, 88);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(390, 74);
        ctx.quadraticCurveTo(344, 62, 298, 86);
        ctx.quadraticCurveTo(338, 84, 382, 88);
        ctx.closePath();
        ctx.fill();
      } else if (traitVariant === 1) {
        // Playful Trickster high rounded brows
        ctx.beginPath();
        ctx.moveTo(128, 78);
        ctx.quadraticCurveTo(168, 44, 210, 68);
        ctx.quadraticCurveTo(172, 62, 136, 84);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(384, 78);
        ctx.quadraticCurveTo(344, 44, 302, 68);
        ctx.quadraticCurveTo(340, 62, 376, 84);
        ctx.closePath();
        ctx.fill();
      } else if (traitVariant === 3) {
        // Cool Tactician sleek sharp brows
        ctx.beginPath();
        ctx.moveTo(124, 78);
        ctx.quadraticCurveTo(170, 58, 214, 72);
        ctx.quadraticCurveTo(174, 70, 132, 85);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(388, 78);
        ctx.quadraticCurveTo(342, 58, 298, 72);
        ctx.quadraticCurveTo(338, 70, 380, 85);
        ctx.closePath();
        ctx.fill();
      } else {
        // Classic Bold Arched Sumo Brows
        ctx.beginPath();
        ctx.moveTo(125, 80);
        ctx.quadraticCurveTo(168, 50, 214, 74);
        ctx.quadraticCurveTo(176, 68, 135, 88);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(387, 80);
        ctx.quadraticCurveTo(344, 50, 298, 74);
        ctx.quadraticCurveTo(336, 68, 377, 88);
        ctx.closePath();
        ctx.fill();
      }
    };

    // Helper for personality mouths in normal/blink states
    const drawPersonalityMouth = () => {
      ctx.strokeStyle = '#63241f';
      ctx.lineWidth = 5.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (traitVariant === 1) {
        // Playful cheerful grin (:3 / upbeat smile)
        ctx.beginPath();
        ctx.moveTo(230, 202);
        ctx.quadraticCurveTo(243, 213, 256, 203);
        ctx.quadraticCurveTo(269, 213, 282, 202);
        ctx.stroke();
      } else if (traitVariant === 2) {
        // Bold competitive toothy grin
        ctx.fillStyle = '#7a1620';
        ctx.beginPath();
        ctx.moveTo(228, 198);
        ctx.quadraticCurveTo(256, 204, 284, 196);
        ctx.quadraticCurveTo(278, 218, 256, 218);
        ctx.quadraticCurveTo(234, 218, 228, 198);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(235, 199, 42, 8, 3);
        ctx.fill();

        ctx.strokeStyle = '#591816';
        ctx.lineWidth = 3.5;
        ctx.stroke();
      } else if (traitVariant === 3) {
        // Confident cool side-smirk
        ctx.beginPath();
        ctx.moveTo(234, 205);
        ctx.quadraticCurveTo(260, 207, 282, 195);
        ctx.stroke();
      } else {
        // Determined sumo smile/firm curve with cute corner dimples
        ctx.beginPath();
        ctx.moveTo(230, 202);
        ctx.quadraticCurveTo(256, 212, 282, 202);
        ctx.stroke();

        // Subtle lower lip warmth
        ctx.fillStyle = 'rgba(218, 96, 88, 0.42)';
        ctx.beginPath();
        ctx.ellipse(256, 213, 9, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    if (state === 'normal') {
      drawPersonalityBrows();

      // Subtle upper eyelid crease
      ctx.strokeStyle = 'rgba(75, 45, 35, 0.35)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      [leftEyeX, rightEyeX].forEach(cx => {
        ctx.beginPath();
        ctx.arc(cx, eyeY - 6, 36, Math.PI * 1.18, Math.PI * 1.82);
        ctx.stroke();
      });

      // Glossy Expressive Chibi Eyes
      [
        { cx: leftEyeX, isLeft: true },
        { cx: rightEyeX, isLeft: false }
      ].forEach(({ cx, isLeft }) => {
        // Crisp sclera white with soft top shadow
        const scleraGrad = ctx.createLinearGradient(cx, eyeY - 36, cx, eyeY + 36);
        scleraGrad.addColorStop(0, '#e3e8f0');
        scleraGrad.addColorStop(0.28, '#ffffff');
        scleraGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = scleraGrad;
        ctx.beginPath();
        ctx.ellipse(cx, eyeY, 34, 36, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rich layered amber-espresso iris
        const irisGrad = ctx.createRadialGradient(cx, eyeY + 8, 4, cx, eyeY, 28);
        irisGrad.addColorStop(0, '#6b3e26');
        irisGrad.addColorStop(0.45, '#3b2114');
        irisGrad.addColorStop(0.85, '#1c100a');
        irisGrad.addColorStop(1, '#0e0805');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.ellipse(cx, eyeY + 1, 26, 28, 0, 0, Math.PI * 2);
        ctx.fill();

        // Subtle warm lower iris bounce crescent
        ctx.fillStyle = 'rgba(235, 155, 85, 0.38)';
        ctx.beginPath();
        ctx.arc(cx, eyeY + 8, 19, Math.PI * 0.15, Math.PI * 0.85);
        ctx.fill();

        // Deep velvet pupil
        ctx.fillStyle = '#070403';
        ctx.beginPath();
        ctx.ellipse(cx, eyeY + 2, 14, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye contour + bold sumo upper lash wing
        ctx.strokeStyle = '#140e0c';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.ellipse(cx, eyeY, 34, 36, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Thicker upper lash & kumadori-style outer wing flick
        const wingSign = isLeft ? -1 : 1;
        ctx.fillStyle = '#140e0c';
        ctx.beginPath();
        ctx.arc(cx, eyeY, 35.5, Math.PI * 1.12, Math.PI * 1.88);
        ctx.arc(cx, eyeY + 3, 32, Math.PI * 1.88, Math.PI * 1.12, true);
        ctx.closePath();
        ctx.fill();

        // Subtle festive crimson outer corner accent (kumadori touch)
        ctx.strokeStyle = 'rgba(217, 4, 41, 0.55)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(cx + wingSign * 33, eyeY - 8);
        ctx.quadraticCurveTo(cx + wingSign * 42, eyeY - 14, cx + wingSign * 45, eyeY - 20);
        ctx.stroke();

        // Primary glossy white catchlight
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(cx + 10, eyeY - 10, 9.5, 8.5, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // Secondary sky-tinted sparkle catchlight
        ctx.fillStyle = '#e8f7ff';
        ctx.beginPath();
        ctx.arc(cx - 9, eyeY + 12, 4.5, 0, Math.PI * 2);
        ctx.fill();
      });

      drawPersonalityMouth();

    } else if (state === 'charging' || state === 'slap') {
      // Fierce Power Charging / Harite Strike Expression
      ctx.fillStyle = '#161214';
      // Sharp angled kabuki brows
      ctx.beginPath();
      ctx.moveTo(118, 92);
      ctx.lineTo(222, 64);
      ctx.lineTo(216, 82);
      ctx.lineTo(128, 106);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(394, 92);
      ctx.lineTo(290, 64);
      ctx.lineTo(296, 82);
      ctx.lineTo(384, 106);
      ctx.closePath();
      ctx.fill();

      if (state === 'slap') {
        // Energetic > < strike eyes
        ctx.strokeStyle = '#161214';
        ctx.lineWidth = 7.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(leftEyeX - 24, eyeY - 16);
        ctx.lineTo(leftEyeX + 16, eyeY + 2);
        ctx.lineTo(leftEyeX - 24, eyeY + 20);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rightEyeX + 24, eyeY - 16);
        ctx.lineTo(rightEyeX - 16, eyeY + 2);
        ctx.lineTo(rightEyeX + 24, eyeY + 20);
        ctx.stroke();
      } else {
        // Intense narrowed power eyes with fiery glint
        [leftEyeX, rightEyeX].forEach(cx => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(cx, eyeY + 2, 30, 21, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#140e0c';
          ctx.lineWidth = 4.5;
          ctx.stroke();

          ctx.fillStyle = '#1a0d08';
          ctx.beginPath();
          ctx.arc(cx, eyeY + 2, 16, 0, Math.PI * 2);
          ctx.fill();

          // Fiery gold pupil ring
          ctx.strokeStyle = '#ffb703';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, eyeY + 2, 11, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx + 6, eyeY - 4, 6, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Fierce clenched grit mouth
      ctx.fillStyle = '#78121d';
      ctx.beginPath();
      ctx.roundRect(226, 196, 60, 28, 10);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(231, 198, 50, 10);
      ctx.fillRect(231, 213, 50, 9);
      ctx.strokeStyle = '#3b0a10';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(226, 196, 60, 28, 10);
      ctx.stroke();

    } else if (state === 'shocked') {
      // Wide Shocked O_O Eyes
      ctx.strokeStyle = '#191516';
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY - 46, 30, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rightEyeX, eyeY - 46, 30, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      [leftEyeX, rightEyeX].forEach(cx => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, eyeY, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#140e0c';
        ctx.lineWidth = 4.5;
        ctx.stroke();

        ctx.fillStyle = '#0e0907';
        ctx.beginPath();
        ctx.arc(cx, eyeY, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + 4, eyeY - 4, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Comedic gasp mouth
      ctx.fillStyle = '#851622';
      ctx.beginPath();
      ctx.ellipse(256, 208, 16, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff758f';
      ctx.beginPath();
      ctx.ellipse(256, 216, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3b0a10';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.ellipse(256, 208, 16, 20, 0, 0, Math.PI * 2);
      ctx.stroke();

    } else if (state === 'falling') {
      // Spiral Dizzy Eyes (@ @)
      ctx.strokeStyle = '#191516';
      ctx.lineWidth = 5.0;
      ctx.lineCap = 'round';
      [leftEyeX, rightEyeX].forEach(cx => {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath();
        ctx.arc(cx, eyeY, 34, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        for (let a = 0; a < Math.PI * 5.2; a += 0.18) {
          const r = 2.0 * a;
          const x = cx + Math.cos(a) * r;
          const y = eyeY + Math.sin(a) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // Wobbly cartoon scream mouth
      ctx.fillStyle = '#851622';
      ctx.beginPath();
      ctx.ellipse(256, 210, 24, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3b0a10';
      ctx.lineWidth = 4;
      ctx.stroke();

    } else if (state === 'blink') {
      drawPersonalityBrows();

      // Happy / natural curved closed eyelids
      ctx.strokeStyle = '#191516';
      ctx.lineWidth = 5.5;
      ctx.lineCap = 'round';
      [
        { cx: leftEyeX, isLeft: true },
        { cx: rightEyeX, isLeft: false }
      ].forEach(({ cx, isLeft }) => {
        ctx.beginPath();
        ctx.arc(cx, eyeY - 4, 26, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();

        const s = isLeft ? -1 : 1;
        ctx.beginPath();
        ctx.moveTo(cx + s * 22, eyeY + 8);
        ctx.lineTo(cx + s * 30, eyeY + 3);
        ctx.stroke();
      });

      drawPersonalityMouth();
    }
  }

  // 2. Waxed Sumo Hair Texture (Binzuke Camellia Oil Sheen)
  static createHairTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Deep glossy espresso-black hair base
    ctx.fillStyle = '#1b1618';
    ctx.fillRect(0, 0, 256, 256);

    // Fine combed strand striations (vertical along sphere meridians toward crown)
    for (let x = 0; x < 256; x += 3) {
      ctx.strokeStyle = x % 6 === 0 ? 'rgba(85, 72, 68, 0.36)' : 'rgba(10, 8, 9, 0.45)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + Math.sin(x * 0.15) * 2, 256);
      ctx.stroke();
    }

    // Anisotropic glossy halo band across upper crown
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, 'rgba(90, 80, 95, 0.18)');
    grad.addColorStop(0.28, 'rgba(205, 195, 215, 0.34)');
    grad.addColorStop(0.42, 'rgba(95, 85, 100, 0.08)');
    grad.addColorStop(1, 'rgba(12, 9, 10, 0.55)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // 3. Clean Non-Multiplying Torso Skin Texture (Centered at u=0.5 after rotateY(-PI/2))
  static createTorsoTexture(skinHex = 0xffcbb2, part = 'belly') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const c = new THREE.Color(skinHex);
    const r = Math.round(c.r * 255);
    const g = Math.round(c.g * 255);
    const b = Math.round(c.b * 255);

    // Exact base skin color (used with material color: 0xffffff to prevent muddy darkening)
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, 512, 512);

    const shadeR = Math.max(0, r - 48);
    const shadeG = Math.max(0, g - 68);
    const shadeB = Math.max(0, b - 58);

    const lightR = Math.min(255, r + 24);
    const lightG = Math.min(255, g + 18);
    const lightB = Math.min(255, b + 15);

    if (part === 'full') {
      // Unified Seamless Sumo Torso (Upper Pectorals + Smooth Round Potbelly + Navel)
      // 1. Soft upper pectoral highlights (v around y=155..205)
      [214, 298].forEach(px => {
        const pecHi = ctx.createRadialGradient(px, 168, 4, px, 172, 42);
        pecHi.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, 0.40)`);
        pecHi.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, 0.0)`);
        ctx.fillStyle = pecHi;
        ctx.beginPath();
        ctx.arc(px, 172, 42, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle sumo pectoral under-curves
      ctx.strokeStyle = `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.34)`;
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(186, 196);
      ctx.quadraticCurveTo(216, 212, 248, 198);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(326, 196);
      ctx.quadraticCurveTo(296, 212, 264, 198);
      ctx.stroke();

      // Cute subtle chest dots
      ctx.fillStyle = `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.40)`;
      ctx.beginPath();
      ctx.arc(198, 190, 4.0, 0, Math.PI * 2);
      ctx.arc(314, 190, 4.0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Glossy sunlit round potbelly highlight
      const bellyHi = ctx.createRadialGradient(256, 255, 8, 256, 265, 92);
      bellyHi.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, 0.42)`);
      bellyHi.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, 0.0)`);
      ctx.fillStyle = bellyHi;
      ctx.beginPath();
      ctx.arc(256, 265, 92, 0, Math.PI * 2);
      ctx.fill();

      // 3. Cute centered navel (belly button) on lower potbelly
      const navelShadow = ctx.createRadialGradient(256, 318, 2, 256, 318, 11);
      navelShadow.addColorStop(0, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.72)`);
      navelShadow.addColorStop(0.6, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.25)`);
      navelShadow.addColorStop(1, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.0)`);
      ctx.fillStyle = navelShadow;
      ctx.beginPath();
      ctx.ellipse(256, 318, 10, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Warm soft under-belly crease shadow above mawashi
      const underGrad = ctx.createLinearGradient(0, 355, 0, 512);
      underGrad.addColorStop(0, 'rgba(180, 95, 70, 0.0)');
      underGrad.addColorStop(1, 'rgba(155, 72, 52, 0.24)');
      ctx.fillStyle = underGrad;
      ctx.fillRect(0, 355, 512, 157);
    } else if (part === 'chest') {
      // Soft upper pectoral highlight
      [212, 300].forEach(px => {
        const pecHi = ctx.createRadialGradient(px, 215, 4, px, 220, 48);
        pecHi.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, 0.42)`);
        pecHi.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, 0.0)`);
        ctx.fillStyle = pecHi;
        ctx.beginPath();
        ctx.arc(px, 220, 48, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle sumo pectoral under-curves
      ctx.strokeStyle = `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.34)`;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(182, 248);
      ctx.quadraticCurveTo(214, 268, 248, 252);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(330, 248);
      ctx.quadraticCurveTo(298, 268, 264, 252);
      ctx.stroke();

      // Cute subtle chest dots
      ctx.fillStyle = `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.42)`;
      ctx.beginPath();
      ctx.arc(198, 242, 4.5, 0, Math.PI * 2);
      ctx.arc(314, 242, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Soft glossy top-of-belly highlight
      const bellyHi = ctx.createRadialGradient(256, 195, 10, 256, 205, 95);
      bellyHi.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, 0.45)`);
      bellyHi.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, 0.0)`);
      ctx.fillStyle = bellyHi;
      ctx.beginPath();
      ctx.arc(256, 205, 95, 0, Math.PI * 2);
      ctx.fill();

      // Cute sculpted-looking navel (belly button) dead-center at x=256
      const navelShadow = ctx.createRadialGradient(256, 278, 2, 256, 278, 12);
      navelShadow.addColorStop(0, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.72)`);
      navelShadow.addColorStop(0.6, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.25)`);
      navelShadow.addColorStop(1, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.0)`);
      ctx.fillStyle = navelShadow;
      ctx.beginPath();
      ctx.ellipse(256, 278, 11, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Warm soft under-belly crease shadow
      const underGrad = ctx.createLinearGradient(0, 330, 0, 512);
      underGrad.addColorStop(0, 'rgba(180, 95, 70, 0.0)');
      underGrad.addColorStop(1, 'rgba(160, 75, 55, 0.22)');
      ctx.fillStyle = underGrad;
      ctx.fillRect(0, 330, 512, 182);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // 4. Ceremonial Woven Silk Mawashi Texture
  static createMawashiTexture(mawashiHex = 0xd90429) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    const c = new THREE.Color(mawashiHex);
    const r = Math.round(c.r * 255);
    const g = Math.round(c.g * 255);
    const b = Math.round(c.b * 255);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, 256, 256);

    // Heavy silk diagonal weave threads
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.lineWidth = 2;
    for (let i = -256; i < 512; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 256, 256);
      ctx.stroke();
    }

    // Horizontal folded silk bands & sheen
    const sheen = ctx.createLinearGradient(0, 0, 0, 256);
    sheen.addColorStop(0.0, 'rgba(255, 255, 255, 0.22)');
    sheen.addColorStop(0.25, 'rgba(0, 0, 0, 0.14)');
    sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)');
    sheen.addColorStop(0.75, 'rgba(0, 0, 0, 0.18)');
    sheen.addColorStop(1.0, 'rgba(255, 255, 255, 0.12)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, 256, 256);

    // Subtle gold/light edge piping near top and bottom of belt
    ctx.fillStyle = 'rgba(255, 230, 150, 0.28)';
    ctx.fillRect(0, 10, 256, 5);
    ctx.fillRect(0, 241, 256, 5);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 5. Soft Ground Contact Shadow Blob Texture
  static createContactShadowTexture() {
    if (this._shadowTex) return this._shadowTex;
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
    grad.addColorStop(0, 'rgba(45, 28, 12, 0.42)');
    grad.addColorStop(0.55, 'rgba(45, 28, 12, 0.18)');
    grad.addColorStop(1, 'rgba(45, 28, 12, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    this._shadowTex = new THREE.CanvasTexture(canvas);
    return this._shadowTex;
  }
}
