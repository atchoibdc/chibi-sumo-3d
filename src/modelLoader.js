import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';

export const CUSTOM_MODEL_CONFIG = {
  url: './models/chibi-sumo.glb',
  targetHeight: 2.86,
  // Set to Math.PI if an exported .glb faces -Z instead of +Z
  rotationYOffset: 0
};

class SumoModelManager {
  constructor() {
    this.templateScene = null;
    this.animations = [];
    this.isLoaded = false;
    this.loadPromise = null;
    this._tintedTextureCache = new Map();
  }

  // Safely probes and loads ./models/chibi-sumo.glb if present.
  // Verifies glTF magic header bytes so Vite/GitHub Pages SPA HTML fallbacks never throw console errors.
  async loadOptionalCustomModel(url = CUSTOM_MODEL_CONFIG.url) {
    if (this.loadPromise) return this.loadPromise;

    this.loadPromise = (async () => {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) return false;

        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (contentType.includes('text/html')) return false;

        const buffer = await res.arrayBuffer();
        if (buffer.byteLength < 20) return false;

        const view = new DataView(buffer);
        // Binary .glb magic header: 'glTF' (0x46546C67 little-endian)
        const isGlb = view.getUint32(0, true) === 0x46546c67;
        // Or ASCII JSON .gltf starting with '{'
        const firstChar = view.getUint8(0);
        const isJsonGltf = firstChar === 0x7b;

        if (!isGlb && !isJsonGltf) return false;

        const loader = new GLTFLoader();
        const basePath = url.substring(0, url.lastIndexOf('/') + 1) || './';
        const gltf = await loader.parseAsync(buffer, basePath);

        if (gltf && gltf.scene) {
          this.templateScene = gltf.scene;
          this.animations = gltf.animations || [];
          this.isLoaded = true;
          return true;
        }
      } catch {
        // Silently fall back to the 1:1 procedural model when no external .glb exists
      }
      return false;
    })();

    return this.loadPromise;
  }

  // Creates a normalized, grounded, and mawashi-colored clone for a wrestler
  createInstance(mawashiHex = 0xd90429) {
    if (!this.isLoaded || !this.templateScene) return null;

    const cloned = skeletonClone(this.templateScene);
    cloned.rotation.y = CUSTOM_MODEL_CONFIG.rotationYOffset;
    cloned.updateMatrixWorld(true);

    // Normalize height to match Dohyo scale and plant feet cleanly at y = 0
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);

    if (size.y > 0.0001) {
      const scale = CUSTOM_MODEL_CONFIG.targetHeight / size.y;
      cloned.scale.multiplyScalar(scale);
      cloned.updateMatrixWorld(true);
    }

    const scaledBox = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    scaledBox.getCenter(center);

    cloned.position.x -= center.x;
    cloned.position.y -= scaledBox.min.y;
    cloned.position.z -= center.z;

    this.applyMawashiColor(cloned, mawashiHex);

    const wrapper = new THREE.Group();
    wrapper.add(cloned);

    return {
      modelGroup: wrapper,
      animations: this.animations
    };
  }

  applyMawashiColor(rootObj, mawashiHex) {
    const targetColor = new THREE.Color(mawashiHex);
    let namedBeltFound = false;

    rootObj.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;

      const matName = (node.material?.name || '').toLowerCase();
      const meshName = (node.name || '').toLowerCase();
      if (/mawashi|belt|loin|cloth|ribbon|knot/.test(matName + ' ' + meshName)) {
        namedBeltFound = true;
        node.material = node.material.clone();
        if (node.material.map) {
          node.material.map = this.createHueShiftedRedTexture(node.material.map, targetColor, mawashiHex);
        } else {
          node.material.color.copy(targetColor);
        }
      }
    });

    // If single-mesh baked texture (e.g., Image-to-3D export from the red-mawashi reference sheet),
    // automatically re-tint saturated red mawashi pixels while preserving skin & dark brown hair!
    if (!namedBeltFound) {
      rootObj.traverse(node => {
        if (!node.isMesh || !node.material) return;
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        const clonedMats = mats.map(m => {
          const mc = m.clone();
          if (mc.map && mc.map.image) {
            mc.map = this.createHueShiftedRedTexture(mc.map, targetColor, mawashiHex);
          }
          return mc;
        });
        node.material = Array.isArray(node.material) ? clonedMats : clonedMats[0];
      });
    }
  }

  createHueShiftedRedTexture(sourceTex, targetColor, mawashiHex) {
    const cacheKey = `${sourceTex.uuid}_${mawashiHex}`;
    if (this._tintedTextureCache.has(cacheKey)) {
      return this._tintedTextureCache.get(cacheKey);
    }

    const img = sourceTex.image;
    const w = img?.width || 0;
    const h = img?.height || 0;
    if (!w || !h) return sourceTex;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      const imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Convert targetColor to sRGB 0..255
      const tr = targetColor.r * 255;
      const tg = targetColor.g * 255;
      const tb = targetColor.b * 255;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Isolate saturated crimson/red mawashi texels (leaves warm peach skin & dark brown hair untouched)
        if (r > 90 && r > g * 1.45 && r > b * 1.45) {
          const redness = Math.min(1, ((r / Math.max(1, Math.max(g, b))) - 1.45) / 0.65);
          // Preserve baked lighting/occlusion ratio relative to reference crimson (~205)
          const shade = r / 205;
          data[i] = Math.min(255, Math.round(r * (1 - redness) + tr * shade * redness));
          data[i + 1] = Math.min(255, Math.round(g * (1 - redness) + tg * shade * redness));
          data[i + 2] = Math.min(255, Math.round(b * (1 - redness) + tb * shade * redness));
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const newTex = new THREE.CanvasTexture(canvas);
      newTex.colorSpace = THREE.SRGBColorSpace;
      newTex.flipY = sourceTex.flipY;
      newTex.wrapS = sourceTex.wrapS;
      newTex.wrapT = sourceTex.wrapT;
      this._tintedTextureCache.set(cacheKey, newTex);
      return newTex;
    } catch {
      return sourceTex;
    }
  }
}

export const SumoModelLoader = new SumoModelManager();
