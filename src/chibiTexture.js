import * as THREE from 'three';

// Procedural Canvas Texture Generator matching the reference model sheet
export class ChibiTextureFactory {
  // 1. High-Resolution Expressive Chibi Face Texture
  static createFaceTexture(state = 'normal') {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    this.renderFaceOnCanvas(ctx, state);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return { canvas, ctx, texture };
  }

  static renderFaceOnCanvas(ctx, state = 'normal') {
    ctx.clearRect(0, 0, 512, 256);

    const leftEyeX = 175;
    const rightEyeX = 337;
    const eyeY = 135;

    // Soft Rosy Airbrushed Cheeks
    const leftBlush = ctx.createRadialGradient(leftEyeX - 25, eyeY + 45, 5, leftEyeX - 25, eyeY + 45, 55);
    leftBlush.addColorStop(0, 'rgba(255, 110, 130, 0.65)');
    leftBlush.addColorStop(0.5, 'rgba(255, 110, 130, 0.35)');
    leftBlush.addColorStop(1, 'rgba(255, 110, 130, 0.0)');
    ctx.fillStyle = leftBlush;
    ctx.beginPath();
    ctx.arc(leftEyeX - 25, eyeY + 45, 55, 0, Math.PI * 2);
    ctx.fill();

    const rightBlush = ctx.createRadialGradient(rightEyeX + 25, eyeY + 45, 5, rightEyeX + 25, eyeY + 45, 55);
    rightBlush.addColorStop(0, 'rgba(255, 110, 130, 0.65)');
    rightBlush.addColorStop(0.5, 'rgba(255, 110, 130, 0.35)');
    rightBlush.addColorStop(1, 'rgba(255, 110, 130, 0.0)');
    ctx.fillStyle = rightBlush;
    ctx.beginPath();
    ctx.arc(rightEyeX + 25, eyeY + 45, 55, 0, Math.PI * 2);
    ctx.fill();

    if (state === 'normal') {
      // --- Thick Arched Black Eyebrows (Signature from reference sheet) ---
      ctx.fillStyle = '#1c1b1f';
      // Left eyebrow
      ctx.beginPath();
      ctx.moveTo(135, 78);
      ctx.quadraticCurveTo(175, 52, 218, 72);
      ctx.quadraticCurveTo(185, 68, 145, 84);
      ctx.closePath();
      ctx.fill();

      // Right eyebrow
      ctx.beginPath();
      ctx.moveTo(377, 78);
      ctx.quadraticCurveTo(337, 52, 294, 72);
      ctx.quadraticCurveTo(327, 68, 367, 84);
      ctx.closePath();
      ctx.fill();

      // Subtle upper eyelid fold lines
      ctx.strokeStyle = 'rgba(60, 40, 30, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY - 26, 32, Math.PI * 1.15, Math.PI * 1.85);
      ctx.arc(rightEyeX, eyeY - 26, 32, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // --- Dark Expressive Eyes with Highlights ---
      [leftEyeX, rightEyeX].forEach(cx => {
        // Eye White / Base
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(cx, eyeY, 32, 34, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dark Iris with gradient
        const irisGrad = ctx.createRadialGradient(cx, eyeY - 4, 4, cx, eyeY, 28);
        irisGrad.addColorStop(0, '#36281e');
        irisGrad.addColorStop(0.7, '#1b140f');
        irisGrad.addColorStop(1, '#0d0907');
        ctx.fillStyle = irisGrad;
        ctx.beginPath();
        ctx.arc(cx, eyeY, 26, 0, Math.PI * 2);
        ctx.fill();

        // Outer crisp eye contour
        ctx.strokeStyle = '#110d0a';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.ellipse(cx, eyeY, 32, 34, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Deep black pupil
        ctx.fillStyle = '#050302';
        ctx.beginPath();
        ctx.arc(cx, eyeY + 2, 14, 0, Math.PI * 2);
        ctx.fill();

        // Crisp White Catchlight (top-right highlight from reference)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + 9, eyeY - 9, 8.5, 0, Math.PI * 2);
        ctx.fill();

        // Secondary smaller reflection
        ctx.beginPath();
        ctx.arc(cx - 7, eyeY + 11, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- Cute Button Nose ---
      ctx.fillStyle = '#d48872';
      ctx.beginPath();
      ctx.ellipse(256, 172, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // --- Determined Mouth (firm horizontal line with slight corner indents) ---
      ctx.strokeStyle = '#6e2b24';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(234, 198);
      ctx.quadraticCurveTo(256, 204, 278, 198);
      ctx.stroke();

      // Subtle lower lip warmth
      ctx.fillStyle = 'rgba(215, 100, 90, 0.45)';
      ctx.beginPath();
      ctx.arc(256, 206, 8, 0, Math.PI);
      ctx.fill();

    } else if (state === 'charging') {
      // Fierce Charging Eyes & Eyebrows
      ctx.fillStyle = '#1c1b1f';
      // Left angry brow
      ctx.beginPath();
      ctx.moveTo(130, 95);
      ctx.lineTo(220, 68);
      ctx.lineTo(145, 108);
      ctx.fill();
      // Right angry brow
      ctx.beginPath();
      ctx.moveTo(382, 95);
      ctx.lineTo(292, 68);
      ctx.lineTo(367, 108);
      ctx.fill();

      // Narrowed fierce eyes
      [leftEyeX, rightEyeX].forEach(cx => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(cx, eyeY, 28, 20, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0a0806';
        ctx.beginPath();
        ctx.arc(cx, eyeY, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + 6, eyeY - 4, 5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Clenched open grit mouth
      ctx.fillStyle = '#80141b';
      ctx.beginPath();
      ctx.roundRect(236, 192, 40, 24, 8);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(240, 194, 32, 8); // White teeth line

    } else if (state === 'shocked') {
      // Wide Shocked O_O Eyes
      ctx.strokeStyle = '#1c1b1f';
      ctx.lineWidth = 5;
      // High raised brows
      ctx.beginPath();
      ctx.arc(leftEyeX, eyeY - 50, 28, Math.PI * 1.15, Math.PI * 1.85);
      ctx.arc(rightEyeX, eyeY - 50, 28, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      [leftEyeX, rightEyeX].forEach(cx => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, eyeY, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#110d0a';
        ctx.stroke();

        ctx.fillStyle = '#0a0806';
        ctx.beginPath();
        ctx.arc(cx, eyeY, 9, 0, Math.PI * 2); // Tiny shocked pupil
        ctx.fill();
      });

      // Shocked "O" mouth
      ctx.fillStyle = '#80141b';
      ctx.beginPath();
      ctx.arc(256, 202, 14, 0, Math.PI * 2);
      ctx.fill();

    } else if (state === 'falling') {
      // Spiral Dizzy Eyes (@ @)
      ctx.strokeStyle = '#1c1b1f';
      ctx.lineWidth = 4.5;
      [leftEyeX, rightEyeX].forEach(cx => {
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 5; a += 0.2) {
          const r = 3.2 * a;
          const x = cx + Math.cos(a) * r;
          const y = eyeY + Math.sin(a) * r;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      // Wobbly mouth
      ctx.beginPath();
      ctx.moveTo(230, 200);
      ctx.bezierCurveTo(240, 215, 270, 185, 282, 200);
      ctx.stroke();

    } else if (state === 'blink') {
      // --- Natural Closed Eyelid Blink ---
      ctx.fillStyle = '#1c1b1f';
      // Eyebrows
      ctx.beginPath();
      ctx.moveTo(135, 78);
      ctx.quadraticCurveTo(175, 52, 218, 72);
      ctx.quadraticCurveTo(185, 68, 145, 84);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(377, 78);
      ctx.quadraticCurveTo(337, 52, 294, 72);
      ctx.quadraticCurveTo(327, 68, 367, 84);
      ctx.closePath();
      ctx.fill();

      // Closed curved eyelid arcs with lash detail
      ctx.strokeStyle = '#1c1b1f';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      [leftEyeX, rightEyeX].forEach(cx => {
        ctx.beginPath();
        ctx.arc(cx, eyeY - 4, 24, Math.PI * 0.15, Math.PI * 0.85);
        ctx.stroke();

        // Subtle lash accent
        ctx.beginPath();
        ctx.moveTo(cx + 20, eyeY + 10);
        ctx.lineTo(cx + 26, eyeY + 6);
        ctx.stroke();
      });

      // Button nose
      ctx.fillStyle = '#d48872';
      ctx.beginPath();
      ctx.ellipse(256, 172, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mouth
      ctx.strokeStyle = '#6e2b24';
      ctx.lineWidth = 4.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(234, 198);
      ctx.quadraticCurveTo(256, 204, 278, 198);
      ctx.stroke();
    }
  }

  // 2. Combed Hair Texture with Glossy Highlights
  static createHairTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base dark hair
    ctx.fillStyle = '#1c1815';
    ctx.fillRect(0, 0, 256, 256);

    // Subtle combed hair streaks
    ctx.strokeStyle = 'rgba(70, 60, 55, 0.4)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < 256; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(256, y + (Math.sin(y * 0.1) * 3));
      ctx.stroke();
    }

    // Glossy rim highlight
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, 'rgba(100, 85, 75, 0.25)');
    grad.addColorStop(0.35, 'rgba(180, 160, 145, 0.35)');
    grad.addColorStop(0.5, 'rgba(100, 85, 75, 0.1)');
    grad.addColorStop(1, 'rgba(20, 16, 14, 0.6)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // 3. Torso / Belly Skin Texture with Navel & Soft Shading
  static createTorsoTexture(skinHex = 0xffcbb2) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Convert hex to rgb
    const c = new THREE.Color(skinHex);
    const r = Math.round(c.r * 255);
    const g = Math.round(c.g * 255);
    const b = Math.round(c.b * 255);

    // Base skin fill
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, 256, 256);

    // Cute small nipples (front chest)
    const nipColor = `rgba(${Math.max(0, r - 45)}, ${Math.max(0, g - 65)}, ${Math.max(0, b - 55)}, 0.45)`;
    ctx.fillStyle = nipColor;
    ctx.beginPath();
    ctx.arc(88, 75, 3.5, 0, Math.PI * 2);
    ctx.arc(168, 75, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Cute belly button (navel) indent on the lower belly
    ctx.fillStyle = `rgba(${Math.max(0, r - 65)}, ${Math.max(0, g - 85)}, ${Math.max(0, b - 75)}, 0.55)`;
    ctx.beginPath();
    ctx.ellipse(128, 148, 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soft shading under the belly
    const bellyShadow = ctx.createLinearGradient(0, 170, 0, 256);
    bellyShadow.addColorStop(0, 'rgba(0,0,0,0)');
    bellyShadow.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = bellyShadow;
    ctx.fillRect(0, 170, 256, 86);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
}
