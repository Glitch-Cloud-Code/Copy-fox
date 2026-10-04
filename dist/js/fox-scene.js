import * as THREE from 'three';
import { GLTFLoader } from '../vendor/loaders/GLTFLoader.js';
import { getDimensions, pixelsToText } from './text-art.js';

function disposeModel(root) {
  const textures = new Set();
  const materials = new Set();
  const geometries = new Set();
  const skeletons = new Set();
  const images = new Set();
  root.traverse(node => {
    if (node.geometry) geometries.add(node.geometry);
    if (node.skeleton) skeletons.add(node.skeleton);
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) {
        textures.add(value);
        if (value.source?.data?.close) images.add(value.source.data);
      }
    }
  });
  for (const texture of textures) texture.dispose();
  for (const material of materials) material.dispose();
  for (const geometry of geometries) geometry.dispose();
  // Bone textures and decoded ImageBitmaps have separate lifetimes.
  for (const skeleton of skeletons) skeleton.dispose();
  for (const image of images) image.close();
}

export class FoxScene {
  constructor() {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    this.renderer.setSize(1, 1);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1.5, 1.5, 1.5, -1.5, 0.01, 100);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x7e8499, 2.6));
    const key = new THREE.DirectionalLight(0xffffff, 3.2);
    key.position.set(-3, 5, 6);
    this.scene.add(key);
    this.loader = new GLTFLoader();
    this.target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
    this.target.texture.colorSpace = THREE.SRGBColorSpace;
    this.pixels = new Uint8Array(4);
    this.loadSequence = 0;
    this.clips = [];
    this.playing = false;
    this.reset();
  }

  reset() {
    this.yaw = this.defaults?.yaw ?? 0.65;
    this.pitch = this.defaults?.pitch ?? 0.12;
    this.zoom = 1;
  }

  async load(model) {
    const sequence = ++this.loadSequence;
    this.playing = false;
    const gltf = await this.loader.loadAsync(model.path);
    if (sequence !== this.loadSequence) { disposeModel(gltf.scene); return null; }
    if (this.model) {
      this.mixer?.stopAllAction();
      this.mixer?.uncacheRoot(this.model);
      this.scene.remove(this.container);
      disposeModel(this.model);
    }
    this.model = gltf.scene;
    this.clips = gltf.animations.filter(clip => !clip.name.includes('|'));
    this.clips.sort((a, b) => Number(b.name === 'Idle') - Number(a.name === 'Idle'));
    this.mixer = this.clips.length ? new THREE.AnimationMixer(this.model) : null;
    this.container = new THREE.Group();
    this.container.add(this.model);
    this.scene.add(this.container);
    this.setClip(0);
    this.model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(this.model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const span = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(span) || span <= 0) throw new Error('This fox has no visible geometry.');
    this.container.scale.setScalar(2.25 / span);
    this.container.position.copy(center).multiplyScalar(-2.25 / span);
    this.defaults = model.view;
    this.reset();
    return this.clips.map(clip => clip.name);
  }

  setClip(index) {
    if (!this.mixer || !this.clips[index]) return;
    this.mixer.stopAllAction();
    this.mixer.clipAction(this.clips[index]).reset().play();
    this.mixer.update(0);
  }

  update(seconds) { if (this.playing) this.mixer?.update(Math.min(seconds, 0.1)); }

  render(style, preset) {
    const { width, height } = getDimensions(style, preset);
    if (this.target.width !== width || this.target.height !== height) {
      this.target.setSize(width, height);
      this.pixels = new Uint8Array(width * height * 4);
    }
    this.pitch = THREE.MathUtils.clamp(this.pitch, -1.35, 1.35);
    this.zoom = THREE.MathUtils.clamp(this.zoom, 0.5, 2.5);
    this.camera.position.set(6 * Math.sin(this.yaw) * Math.cos(this.pitch), 6 * Math.sin(this.pitch), 6 * Math.cos(this.yaw) * Math.cos(this.pitch));
    this.camera.lookAt(0, 0, 0);
    this.camera.zoom = this.zoom;
    this.camera.updateProjectionMatrix();
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(this.scene, this.camera);
    this.renderer.readRenderTargetPixels(this.target, 0, 0, width, height, this.pixels);
    this.renderer.setRenderTarget(null);
    return pixelsToText(this.pixels, width, height, style);
  }

  dispose() {
    this.loadSequence++;
    this.playing = false;
    this.mixer?.stopAllAction();
    if (this.model) { this.mixer?.uncacheRoot(this.model); disposeModel(this.model); }
    this.target.dispose();
    this.renderer.dispose();
  }
}
