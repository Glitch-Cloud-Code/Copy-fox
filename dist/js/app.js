import { FoxScene } from './fox-scene.js';
import { getDimensions } from './text-art.js';

const $ = selector => document.querySelector(selector);
const art = $('#art');
const viewport = $('#viewport');
const message = $('#preview-message');
const modelSelect = $('#model');
const playButton = $('#play');
const copyButton = $('#copy');
const zoom = $('#zoom');
let scene;
let models = [];
let style = 'ascii';
let preset = 'medium';
let ready = false;
let loadSequence = 0;
let frameRequest = 0;
let lastFrame = 0;
let lastAnimation = 0;
let copying = false;

function fitArt() {
  const { columns, rows } = getDimensions(style, preset);
  const width = viewport.clientWidth - 48;
  const height = viewport.clientHeight - 48;
  // Monospace glyphs are approximately half as wide as the line height.
  const size = Math.min(width / (columns * 0.61), height / rows, 30);
  art.style.fontSize = `${Math.max(5, size)}px`;
  art.style.lineHeight = '1';
}

function syncCamera() {
  zoom.value = Math.round(scene.zoom * 100);
  $('#zoom-value').value = `${Math.round(scene.zoom * 100)}%`;
}

function paint(now) {
  frameRequest = 0;
  if (!ready) return;
  if (scene.playing) {
    if (now - lastFrame < 1000 / 24) { requestPaint(); return; }
    scene.update((now - lastAnimation) / 1000);
    lastAnimation = now;
  }
  lastFrame = now;
  art.textContent = scene.render(style, preset);
  const { columns, rows } = getDimensions(style, preset);
  $('#dimensions').textContent = `${columns} × ${rows}`;
  $('#character-count').textContent = `${art.textContent.length.toLocaleString()} CHARACTERS`;
  $('#render-state').textContent = scene.playing ? 'PLAYING' : 'STILL';
  syncCamera();
  if (scene.playing) requestPaint();
}

function requestPaint() { if (!frameRequest) frameRequest = requestAnimationFrame(paint); }

function pause() {
  if (!scene) return;
  scene.playing = false;
  if (frameRequest) cancelAnimationFrame(frameRequest);
  frameRequest = 0;
  playButton.textContent = 'Play';
  playButton.setAttribute('aria-pressed', 'false');
  $('#render-state').textContent = 'STILL';
}

async function loadSelected() {
  const sequence = ++loadSequence;
  pause();
  ready = false;
  copyButton.disabled = true;
  $('#camera-controls').disabled = true;
  viewport.setAttribute('aria-busy', 'true');
  message.hidden = false;
  message.textContent = 'Waking up your fox…';
  art.textContent = '';
  $('#render-state').textContent = 'LOADING';
  $('#copy-fallback').hidden = true;
  const model = models.find(item => item.id === modelSelect.value);
  try {
    const clips = await scene.load(model);
    if (sequence !== loadSequence || !clips) return;
    $('#file-name').textContent = `fox://${model.id}`;
    $('#model-description').textContent = model.description;
    const animationSelect = $('#animation');
    animationSelect.replaceChildren(...clips.map((name, index) => new Option(name.replaceAll('_', ' '), index)));
    $('#animation-control').hidden = !clips.length;
    $('#animation-note').textContent = clips.length ? 'Copy pauses on the frame you see.' : 'This fox holds its pose.';
    playButton.disabled = !clips.length;
    $('#camera-controls').disabled = false;
    ready = true;
    message.hidden = true;
    viewport.setAttribute('aria-busy', 'false');
    copyButton.disabled = false;
    $('#copy-status').textContent = 'A fox-shaped message, ready to send.';
    fitArt();
    requestPaint();
  } catch (error) {
    if (sequence !== loadSequence) return;
    console.error('Fox loading failed:', error);
    message.textContent = 'This fox could not load. Choose another fox, or select this one again to retry.';
    viewport.setAttribute('aria-busy', 'false');
    $('#render-state').textContent = 'LOAD FAILED';
  }
}

function rotate(direction) {
  if (!ready) return;
  if (direction === 'left') scene.yaw -= 0.15;
  if (direction === 'right') scene.yaw += 0.15;
  if (direction === 'up') scene.pitch += 0.1;
  if (direction === 'down') scene.pitch -= 0.1;
  requestPaint();
}

function setZoom(value) {
  if (!ready) return;
  scene.zoom = Math.max(0.5, Math.min(2.5, value));
  syncCamera();
  requestPaint();
}

async function copyFox() {
  if (!ready || copying || !art.textContent.trim()) return;
  copying = true;
  pause();
  const text = art.textContent;
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable.');
    await navigator.clipboard.writeText(text);
    $('#copy-status').textContent = 'Copied. Paste into Telegram and apply Monospace.';
    $('#copy-fallback').hidden = true;
  } catch {
    const fallback = $('#copy-fallback');
    fallback.hidden = false;
    fallback.open = true;
    const textarea = $('#copy-text');
    textarea.value = text;
    textarea.focus();
    textarea.select();
    $('#copy-status').textContent = 'Clipboard blocked. Your fox is selected below for manual copying.';
  } finally { copying = false; }
}

function bindControls() {
  modelSelect.addEventListener('change', loadSelected);
  for (const input of document.querySelectorAll('input[name="style"]')) input.addEventListener('change', () => { style = input.value; fitArt(); requestPaint(); });
  for (const input of document.querySelectorAll('input[name="size"]')) input.addEventListener('change', () => { preset = input.value; fitArt(); requestPaint(); });
  for (const input of document.querySelectorAll('input[name="palette"]')) input.addEventListener('change', () => { document.body.dataset.palette = input.value; });
  for (const button of document.querySelectorAll('[data-rotate]')) button.addEventListener('click', () => rotate(button.dataset.rotate));
  zoom.addEventListener('input', () => setZoom(Number(zoom.value) / 100));
  $('#reset').addEventListener('click', () => { scene.reset(); syncCamera(); requestPaint(); });
  playButton.addEventListener('click', () => {
    if (scene.playing) pause();
    else {
      scene.playing = true;
      lastAnimation = performance.now();
      playButton.textContent = 'Pause';
      playButton.setAttribute('aria-pressed', 'true');
      requestPaint();
    }
  });
  $('#animation').addEventListener('change', event => { scene.setClip(Number(event.target.value)); requestPaint(); });
  copyButton.addEventListener('click', copyFox);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  viewport.addEventListener('keydown', event => {
    const direction = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[event.key];
    if (direction) { event.preventDefault(); rotate(direction); }
    if (['+', '=', '-'].includes(event.key)) { event.preventDefault(); setZoom(scene.zoom + (event.key === '-' ? -0.1 : 0.1)); }
    if (event.key === 'Home' && ready) { event.preventDefault(); scene.reset(); requestPaint(); }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') { event.preventDefault(); copyFox(); }
  });
  viewport.addEventListener('wheel', event => { if (ready) { event.preventDefault(); setZoom(scene.zoom * Math.exp(-event.deltaY * 0.002)); } }, { passive: false });
  const pointers = new Map();
  const distance = () => { const [a, b] = [...pointers.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  viewport.addEventListener('pointerdown', event => {
    if (!ready || (event.pointerType === 'mouse' && event.button !== 0)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    viewport.setPointerCapture(event.pointerId);
    viewport.focus({ preventScroll: true });
  });
  viewport.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    const previous = pointers.get(event.pointerId);
    const before = pointers.size === 2 ? distance() : 0;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && before > 0) setZoom(scene.zoom * distance() / before);
    else if (pointers.size === 1) {
      scene.yaw -= (event.clientX - previous.x) * 0.008;
      scene.pitch += (event.clientY - previous.y) * 0.008;
      requestPaint();
    }
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) viewport.addEventListener(type, event => pointers.delete(event.pointerId));
  window.addEventListener('blur', () => pointers.clear());
  new ResizeObserver(fitArt).observe(viewport);
  window.addEventListener('pagehide', event => { pause(); if (!event.persisted) scene.dispose(); });
}

async function start() {
  try {
    scene = new FoxScene();
  } catch {
    message.textContent = 'Your browser could not start 3D graphics. Try a browser with WebGL enabled.';
    $('#render-state').textContent = 'WEBGL UNAVAILABLE';
    viewport.setAttribute('aria-busy', 'false');
    return;
  }
  try {
    const response = await fetch('./models.json');
    if (!response.ok) throw new Error('Model list unavailable.');
    models = await response.json();
    modelSelect.replaceChildren(...models.map((model, index) => new Option(`${String(index + 1).padStart(2, '0')} / ${model.name}`, model.id)));
    modelSelect.value = 'fox-v2';
    modelSelect.disabled = false;
    const list = document.createElement('ul');
    for (const model of models) {
      const item = document.createElement('li');
      const source = document.createElement('a');
      source.href = model.source;
      source.textContent = model.originalTitle;
      const license = document.createElement('a');
      license.href = model.licenseUrl;
      license.textContent = model.license;
      item.append(source, ` by ${model.author} · `, license);
      list.append(item);
    }
    $('#credits-list').append(list);
    bindControls();
    await loadSelected();
  } catch (error) {
    console.error('Startup failed:', error);
    message.textContent = 'The fox list could not load. Reload the page to try again.';
    $('#render-state').textContent = 'LOAD FAILED';
    viewport.setAttribute('aria-busy', 'false');
  }
}

start();
