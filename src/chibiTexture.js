import * as THREE from 'three';

// Procedural Canvas Texture Generator — Faithful to "CHIBI SUMO #1 - 3D MODEL REFERENCE"
export class ChibiTextureFactory {
  // 1. High-Resolution Reference-Faithful Chibi Face Texture (512x320 for concentric head shell)
  static createFaceTexture(state = 'normal', traitVariant = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    this.renderFaceOnCanvas(ctx, state, traitVariant);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return { canvas, ctx, texture };
  }

  static renderFaceOnCanvas(ctx, state = 'normal', traitVariant = 0) {
    const W = 512;
    const H = 320;
    ctx.clearRect(0, 0, W, H);

    // Spherical coordinates matched to 3D brow ridges (y≈74), eyes (y≈132), 3D nose (y≈194), mouth (y≈252)
    const leftEyeX = 154;
    const rightEyeX = 358;
    const eyeY = 132;

    // 1. Soft Natural Peachy-Coral Cheek Warmth (no white vinyl sticker ovals)
    [
      { x: leftEyeX - 30, y: eyeY + 58 },
      { x: rightEyeX + 30, y: eyeY + 58 }
    ].forEach(cheek => {
      const blush = ctx.createRadialGradient(cheek.x, cheek.y, 4, cheek.x, cheek.y, 66);
      blush.addColorStop(0, 'rgba(236, 112, 92, 0.36)');
      blush.addColorStop(0.55, 'rgba(236, 120, 98, 0.16)');
      blush.addColorStop(1, 'rgba(236, 120, 98, 0.0)');
      ctx.fillStyle = blush;
      ctx.beginPath();
      ctx.ellipse(cheek.x, cheek.y, 66, 46, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Soft Organic Shadow + Subtle Nostril Indents under the 3D Skin-Toned Nose (x=256, y=194)
    const noseUnder = ctx.createRadialGradient(256, 203, 2, 256, 203, 22);
    noseUnder.addColorStop(0, 'rgba(155, 76, 58, 0.34)');
    noseUnder.addColorStop(0.65, 'rgba(155, 76, 58, 0.12)');
    noseUnder.addColorStop(1, 'rgba(155, 76, 58, 0.0)');
    ctx.fillStyle = noseUnder;
    ctx.beginPath();
    ctx.ellipse(256, 203, 22, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(135, 62, 46, 0.32)';
    ctx.beginPath();
    ctx.ellipse(246, 201, 3.6, 2.2, 0.25, 0, Math.PI * 2);
    ctx.ellipse(266, 201, 3.6, 2.2, -0.25, 0, Math.PI * 2);
    ctx.fill();

    // 3. Soft Lower-Jaw / Chin Warm Shading Arc at bottom of face patch
    ctx.strokeStyle = 'rgba(158, 78, 58, 0.22)';
    ctx.lineWidth = 6.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(202, 298);
    ctx.quadraticCurveTo(256, 312, 310, 298);
    ctx.stroke();

    // Helper: Chunky Charcoal-Brown Capsule Eyebrows (\ /) matching CHIBI SUMO #1 Front View
    const drawReferenceBrows = () => {
      const tiltBoost = traitVariant === 2 ? 4 : traitVariant === 1 ? -3 : traitVariant === 3 ? 2 : 0;

      // Soft warm brow-ridge shadow tucked right under the chunky brows
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(155, 78, 58, 0.26)';
      ctx.lineWidth = 30;
      ctx.beginPath();
      ctx.moveTo(106, 68 - tiltBoost);
      ctx.quadraticCurveTo(154, 74, 200, 88 + tiltBoost);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(406, 68 - tiltBoost);
      ctx.quadraticCurveTo(358, 74, 312, 88 + tiltBoost);
      ctx.stroke();

      // Bold dark charcoal-espresso capsule brows
      ctx.strokeStyle = '#291f1c';
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.moveTo(106, 64 - tiltBoost);
      ctx.quadraticCurveTo(154, 70, 200, 84 + tiltBoost);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(406, 64 - tiltBoost);
      ctx.quadraticCurveTo(358, 70, 312, 84 + tiltBoost);
      ctx.stroke();
    };

    // Helper: Stoic Determined Sumo Pout Mouth matching CHIBI SUMO #1 Front View
    const drawReferenceMouth = () => {
      // Soft lower-lip cushion shadow beneath the mouth
      const lipShade = ctx.createRadialGradient(256, 267, 2, 256, 267, 20);
      lipShade.addColorStop(0, 'rgba(156, 76, 58, 0.34)');
      lipShade.addColorStop(1, 'rgba(156, 76, 58, 0.0)');
      ctx.fillStyle = lipShade;
      ctx.beginPath();
      ctx.ellipse(256, 267, 20, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#5c261e';
      ctx.lineWidth = 5.4;
      ctx.lineCap = 'round';

      if (traitVariant === 1) {
        // Subtle confident upward-curved sumo smile
        ctx.beginPath();
        ctx.moveTo(224, 254);
        ctx.quadraticCurveTo(256, 260, 288, 254);
        ctx.stroke();
      } else if (traitVariant === 3) {
        // Subtle composed asymmetric sumo smirk
        ctx.beginPath();
        ctx.moveTo(224, 256);
        ctx.quadraticCurveTo(256, 253, 288, 251);
        ctx.stroke();
      } else {
        // Exact CHIBI SUMO #1 firm determined pout (gently arched center, slightly downturned corners)
        ctx.beginPath();
        ctx.moveTo(223, 257);
        ctx.quadraticCurveTo(256, 250, 289, 257);
        ctx.stroke();
      }

      // Soft mouth-corner dimple accents
      ctx.fillStyle = 'rgba(145, 68, 52, 0.28)';
      ctx.beginPath();
      ctx.arc(220, 258, 3.2, 0, Math.PI * 2);
      ctx.arc(292, 258, 3.2, 0, Math.PI * 2);
      ctx.fill();
    };

    // Helper: Rounded-Almond Eye Path
    const traceAlmondEye = (cx, cy, rx, ry, isLeft) => {
      const dir = isLeft ? 1 : -1; // +1 toward nose for left eye
      ctx.beginPath();
      ctx.moveTo(cx - rx, cy + 3);
      ctx.bezierCurveTo(
        cx - rx * 0.72, cy - ry * 1.08,
        cx + rx * 0.72, cy - ry * 1.04,
        cx + rx, cy + 4
      );
      ctx.bezierCurveTo(
        cx + rx * 0.65, cy + ry * 0.96,
        cx - rx * 0.65, cy + ry * 0.96,
        cx - rx, cy + 3
      );
      ctx.closePath();
      return dir;
    };

    if (state === 'normal') {
      drawReferenceBrows();

      [
        { cx: leftEyeX, isLeft: true },
        { cx: rightEyeX, isLeft: false }
      ].forEach(({ cx, isLeft }) => {
        const rx = 51;
        const ry = 42;

        // Warm upper eyelid fold crease
        ctx.strokeStyle = 'rgba(138, 68, 52, 0.36)';
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, eyeY - 3, rx + 2, Math.PI * 1.16, Math.PI * 1.84);
        ctx.stroke();

        // Soft warm lower-lid fullness shadow
        ctx.strokeStyle = 'rgba(165, 84, 64, 0.25)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(cx, eyeY + 5, rx - 2, Math.PI * 0.18, Math.PI * 0.82);
        ctx.stroke();

        // Clip inside rounded-almond eye shape so iris hugs upper & lower lids cleanly
        ctx.save();
        traceAlmondEye(cx, eyeY, rx, ry, isLeft);

        // Clean warm-white sclera visible on inner & outer sides
        const scleraGrad = ctx.createLinearGradient(cx, eyeY - ry, cx, eyeY + ry);
        scleraGrad.addColorStop(0, '#ddd6d0');
        scleraGrad.addColorStop(0.28, '#fcfaf8');
        scleraGrad.addColorStop(1, '#ffffff');
        ctx.fillStyle = scleraGrad;
        ctx.fill();
        ctx.clip();

        // Slight inward focus convergence matching reference gaze
        const irisX = cx + (isLeft ? 3 : -3);
        const irisY = eyeY - 1;

        // Large Rich Dark Espresso-Brown Iris
        const irisGrad = ctx.createRadialGradient(irisX, irisY + 12, 4, irisX, irisY, 40);
        irisGrad.addColorStop(0, '#7c472c');
        irisGrad.addColorStop(0.45, '#482819');
        irisGrad.addColorStop(0.82, '#23130d');
        irisGrad.addColorStop(1, '#120a07');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.ellipse(irisX, irisY, 36, 40, 0, 0, Math.PI * 2);
        ctx.fill();

        // Warm chestnut lower iris bounce crescent
        ctx.fillStyle = 'rgba(210, 126, 72, 0.36)';
        ctx.beginPath();
        ctx.arc(irisX, irisY + 9, 25, Math.PI * 0.14, Math.PI * 0.86);
        ctx.fill();

        // Deep velvet pupil
        ctx.fillStyle = '#0c0605';
        ctx.beginPath();
        ctx.ellipse(irisX, irisY - 1, 19, 21, 0, 0, Math.PI * 2);
        ctx.fill();

        // Primary crisp white catchlight on UPPER-LEFT of BOTH eyes (exact CHIBI SUMO #1 placement)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(irisX - 12, irisY - 12, 9.8, 8.6, -0.25, 0, Math.PI * 2);
        ctx.fill();

        // Subtle tiny warm secondary reflection on lower-right
        ctx.fillStyle = 'rgba(255, 238, 224, 0.40)';
        ctx.beginPath();
        ctx.arc(irisX + 11, irisY + 14, 3.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Crisp dark charcoal-brown eye outline + bold upper lash arch (no red wing flicks)
        ctx.strokeStyle = '#1b1210';
        ctx.lineWidth = 4.4;
        traceAlmondEye(cx, eyeY, rx, ry, isLeft);
        ctx.stroke();

        // Thickened upper lash line
        ctx.strokeStyle = '#18100e';
        ctx.lineWidth = 7.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - rx + 2, eyeY + 1);
        ctx.bezierCurveTo(
          cx - rx * 0.70, eyeY - ry * 1.07,
          cx + rx * 0.70, eyeY - ry * 1.03,
          cx + rx - 2, eyeY + 2
        );
        ctx.stroke();
      });

      drawReferenceMouth();

    } else if (state === 'charging' || state === 'slap') {
      // Fierce Power Charging / Harite Strike Expression
      ctx.strokeStyle = '#201816';
      ctx.lineWidth = 24;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(110, 68);
      ctx.lineTo(202, 92);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(402, 68);
      ctx.lineTo(310, 92);
      ctx.stroke();

      if (state === 'slap') {
        // Energetic > < strike eyes
        ctx.strokeStyle = '#1b1210';
        ctx.lineWidth = 8.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(leftEyeX - 28, eyeY - 18);
        ctx.lineTo(leftEyeX + 20, eyeY + 2);
        ctx.lineTo(leftEyeX - 28, eyeY + 22);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rightEyeX + 28, eyeY - 18);
        ctx.lineTo(rightEyeX - 20, eyeY + 2);
        ctx.lineTo(rightEyeX + 28, eyeY + 22);
        ctx.stroke();
      } else {
        // Intense narrowed power eyes
        [leftEyeX, rightEyeX].forEach(cx => {
          ctx.fillStyle = '#fcfaf8';
          ctx.beginPath();
          ctx.ellipse(cx, eyeY + 4, 38, 24, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#18100e';
          ctx.lineWidth = 5.0;
          ctx.stroke();

          ctx.fillStyle = '#21120c';
          ctx.beginPath();
          ctx.arc(cx, eyeY + 4, 19, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx - 7, eyeY - 3, 6.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Fierce clenched sumo grit mouth
      ctx.fillStyle = '#6e181e';
      ctx.beginPath();
      ctx.roundRect(222, 242, 68, 28, 10);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(228, 244, 56, 10);
      ctx.fillRect(228, 258, 56, 9);
      ctx.strokeStyle = '#3d1012';
      ctx.lineWidth = 3.8;
      ctx.beginPath();
      ctx.roundRect(222, 242, 68, 28, 10);
      ctx.stroke();

    } else if (state === 'shocked') {
      // High raised capsule brows + wide shocked O_O eyes
      ctx.strokeStyle = '#241c1a';
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY - 46, 36, Math.PI * 1.18, Math.PI * 1.82);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rightEyeX, eyeY - 46, 36, Math.PI * 1.18, Math.PI * 1.82);
      ctx.stroke();

      [leftEyeX, rightEyeX].forEach(cx => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, eyeY + 2, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#18100e';
        ctx.lineWidth = 4.8;
        ctx.stroke();

        ctx.fillStyle = '#180d09';
        ctx.beginPath();
        ctx.arc(cx, eyeY + 2, 11, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx - 4, eyeY - 3, 4.0, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = '#7c1b22';
      ctx.beginPath();
      ctx.ellipse(256, 256, 17, 21, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3d1012';
      ctx.lineWidth = 3.8;
      ctx.stroke();

    } else if (state === 'falling') {
      // Dizzy Spiral Eyes (@ @)
      ctx.strokeStyle = '#241c1a';
      ctx.lineWidth = 5.2;
      ctx.lineCap = 'round';
      [leftEyeX, rightEyeX].forEach(cx => {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(cx, eyeY, 37, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        for (let a = 0; a < Math.PI * 5.2; a += 0.18) {
          const r = 2.1 * a;
          const x = cx + Math.cos(a) * r;
          const y = eyeY + Math.sin(a) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      ctx.fillStyle = '#7c1b22';
      ctx.beginPath();
      ctx.ellipse(256, 256, 25, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#3d1012';
      ctx.lineWidth = 4;
      ctx.stroke();

    } else if (state === 'blink') {
      drawReferenceBrows();

      ctx.strokeStyle = '#1b1210';
      ctx.lineWidth = 6.5;
      ctx.lineCap = 'round';
      [leftEyeX, rightEyeX].forEach(cx => {
        ctx.beginPath();
        ctx.arc(cx, eyeY - 4, 34, Math.PI * 0.18, Math.PI * 0.82);
        ctx.stroke();
      });

      drawReferenceMouth();
    }
  }

  // 2. Warm Espresso-Chocolate Combed Sumo Hair Texture (Matches CHIBI SUMO #1 matte-satin brown hair)
  static createHairTexture() {
    if (this._hairTex) return this._hairTex;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Warm dark chocolate-espresso base (#433029 renders as rich espresso brown under ACES Filmic)
    ctx.fillStyle = '#433029';
    ctx.fillRect(0, 0, 512, 512);

    // Soft combed meridian hair strands converging toward crown & nape
    for (let x = 0; x < 512; x += 4) {
      const isHighlight = x % 12 === 0;
      const isMidLight = x % 8 === 0;
      ctx.strokeStyle = isHighlight
        ? 'rgba(132, 98, 84, 0.36)'
        : isMidLight
          ? 'rgba(104, 76, 65, 0.28)'
          : 'rgba(34, 22, 18, 0.42)';
      ctx.lineWidth = isHighlight ? 2.4 : 1.8;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(
        x + Math.sin(x * 0.08) * 3, 170,
        x - Math.sin(x * 0.08) * 3, 340,
        x, 512
      );
      ctx.stroke();
    }

    // Subtle warm crown sheen & lower nape ambient shading
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, 'rgba(92, 68, 58, 0.18)');
    grad.addColorStop(0.24, 'rgba(158, 118, 102, 0.24)');
    grad.addColorStop(0.50, 'rgba(72, 52, 44, 0.05)');
    grad.addColorStop(1.0, 'rgba(26, 17, 14, 0.42)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    this._hairTex = texture;
    return texture;
  }

  // Helper: Boost pale hex skin colors toward the warm peachy-apricot palette of CHIBI SUMO #1
  static resolveWarmSkinColor(skinHex = 0xffcbb2) {
    const base = new THREE.Color(skinHex);
    const refPeach = new THREE.Color(0xf6ad8c);
    return base.lerp(refPeach, 0.42);
  }

  // 3. Full Seamless Torso Skin Texture:
  // Front (+Z) centered at x=256; Back (-Z) centered at wrap seam x=0 & x=512!
  static createTorsoTexture(skinHex = 0xffcbb2) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const c = this.resolveWarmSkinColor(skinHex);
    const r = Math.round(c.r * 255);
    const g = Math.round(c.g * 255);
    const b = Math.round(c.b * 255);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, 512, 512);

    const shadeR = Math.max(0, r - 54);
    const shadeG = Math.max(0, g - 76);
    const shadeB = Math.max(0, b - 68);

    const lightR = Math.min(255, r + 22);
    const lightG = Math.min(255, g + 16);
    const lightB = Math.min(255, b + 14);

    // ================= FRONT VIEW DETAILS (Centered at x = 256) =================
    // Soft upper pectoral highlights
    [210, 302].forEach(px => {
      const pecHi = ctx.createRadialGradient(px, 166, 4, px, 170, 44);
      pecHi.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, 0.36)`);
      pecHi.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, 0.0)`);
      ctx.fillStyle = pecHi;
      ctx.beginPath();
      ctx.arc(px, 170, 44, 0, Math.PI * 2);
      ctx.fill();
    });

    // Subtle sternum valley shadow between pectorals
    const sternumGrad = ctx.createRadialGradient(256, 184, 2, 256, 184, 22);
    sternumGrad.addColorStop(0, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.24)`);
    sternumGrad.addColorStop(1, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.0)`);
    ctx.fillStyle = sternumGrad;
    ctx.beginPath();
    ctx.ellipse(256, 184, 14, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soft curved pectoral under-creases matching Front & Side reference
    ctx.strokeStyle = `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.34)`;
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(182, 198);
    ctx.quadraticCurveTo(214, 214, 246, 200);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(330, 198);
    ctx.quadraticCurveTo(298, 214, 266, 200);
    ctx.stroke();

    // Small warm-tan nipples
    ctx.fillStyle = `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.46)`;
    ctx.beginPath();
    ctx.arc(198, 191, 4.4, 0, Math.PI * 2);
    ctx.arc(314, 191, 4.4, 0, Math.PI * 2);
    ctx.fill();

    // Soft sunlit potbelly crown highlight
    const bellyHi = ctx.createRadialGradient(256, 264, 8, 256, 268, 92);
    bellyHi.addColorStop(0, `rgba(${lightR}, ${lightG}, ${lightB}, 0.38)`);
    bellyHi.addColorStop(1, `rgba(${lightR}, ${lightG}, ${lightB}, 0.0)`);
    ctx.fillStyle = bellyHi;
    ctx.beginPath();
    ctx.arc(256, 268, 92, 0, Math.PI * 2);
    ctx.fill();

    // Horizontal oval belly button (navel) above mawashi top edge
    const navelShadow = ctx.createRadialGradient(256, 322, 2, 256, 322, 12);
    navelShadow.addColorStop(0, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.72)`);
    navelShadow.addColorStop(0.6, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.24)`);
    navelShadow.addColorStop(1, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.0)`);
    ctx.fillStyle = navelShadow;
    ctx.beginPath();
    ctx.ellipse(256, 322, 10.5, 6.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // ================= BACK VIEW DETAILS (Centered at seam x = 0 & x = 512) =================
    [0, 512].forEach(bx => {
      // Vertical center spine groove (y = 128 .. 308)
      const spineGrad = ctx.createLinearGradient(bx - 14, 0, bx + 14, 0);
      spineGrad.addColorStop(0.0, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.0)`);
      spineGrad.addColorStop(0.5, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.34)`);
      spineGrad.addColorStop(1.0, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.0)`);
      ctx.fillStyle = spineGrad;
      ctx.fillRect(bx - 14, 128, 28, 185);

      // Subtle lumbar hollow above rear mawashi knot
      const lumbarGrad = ctx.createRadialGradient(bx, 305, 4, bx, 305, 36);
      lumbarGrad.addColorStop(0, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.25)`);
      lumbarGrad.addColorStop(1, `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.0)`);
      ctx.fillStyle = lumbarGrad;
      ctx.beginPath();
      ctx.ellipse(bx, 305, 36, 22, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Subtle shoulder-blade (scapula) contours on upper-left & upper-right back
    ctx.strokeStyle = `rgba(${shadeR}, ${shadeG}, ${shadeB}, 0.26)`;
    ctx.lineWidth = 5.0;
    ctx.beginPath();
    ctx.moveTo(46, 155);
    ctx.quadraticCurveTo(30, 195, 52, 224);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(466, 155);
    ctx.quadraticCurveTo(482, 195, 460, 224);
    ctx.stroke();

    // Warm soft lower-torso occlusion under mawashi
    const underGrad = ctx.createLinearGradient(0, 355, 0, 512);
    underGrad.addColorStop(0, 'rgba(170, 82, 60, 0.0)');
    underGrad.addColorStop(1, 'rgba(148, 66, 48, 0.28)');
    ctx.fillStyle = underGrad;
    ctx.fillRect(0, 355, 512, 157);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    return texture;
  }

  // 4. Clean Reference-Faithful Folded Cloth Mawashi Texture (No gold border stripes)
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

    // Subtle fine cotton-silk weave
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1.5;
    for (let i = -256; i < 512; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 256, 256);
      ctx.stroke();
    }

    // Two-fold cloth shading: soft upper roll highlight, center horizontal fold crease, lower roll sheen
    const sheen = ctx.createLinearGradient(0, 0, 0, 256);
    sheen.addColorStop(0.0, 'rgba(0, 0, 0, 0.16)');
    sheen.addColorStop(0.14, 'rgba(255, 255, 255, 0.16)');
    sheen.addColorStop(0.45, 'rgba(255, 255, 255, 0.04)');
    sheen.addColorStop(0.51, 'rgba(0, 0, 0, 0.24)'); // Single horizontal mid-fold crease
    sheen.addColorStop(0.60, 'rgba(255, 255, 255, 0.12)');
    sheen.addColorStop(0.88, 'rgba(0, 0, 0, 0.12)');
    sheen.addColorStop(1.0, 'rgba(0, 0, 0, 0.22)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
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
    grad.addColorStop(0, 'rgba(45, 28, 12, 0.44)');
    grad.addColorStop(0.55, 'rgba(45, 28, 12, 0.18)');
    grad.addColorStop(1, 'rgba(45, 28, 12, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    this._shadowTex = new THREE.CanvasTexture(canvas);
    return this._shadowTex;
  }
}
