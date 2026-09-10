const TEMPLATE_SIZE = { width: 591, height: 1772 };
const TEMPLATES = [
  { id: 'plain', name: 'Plain / classic', file: '1.png', slots: [{ x: 28, y: 233, w: 534, h: 366 }, { x: 28, y: 613, w: 534, h: 366 }, { x: 28, y: 994, w: 534, h: 366 }] },
  { id: 'bbq', name: 'Welcome Back BBQ', file: '2.png', slots: [{ x: 28, y: 233, w: 534, h: 366 }, { x: 28, y: 613, w: 534, h: 366 }, { x: 28, y: 994, w: 534, h: 366 }] },
  { id: 'shells', name: 'Purple shells', file: '3.png', slots: [{ x: 31, y: 269, w: 529, h: 351 }, { x: 31, y: 635, w: 529, h: 351 }, { x: 31, y: 1001, w: 529, h: 351 }] }
];

const state = { template: null, photos: [null, null, null], current: 0, stream: null, mirror: true, reviewing: false };
const $ = (selector) => document.querySelector(selector);
const screens = { landing: $('#landing-screen'), camera: $('#camera-screen'), result: $('#result-screen') };

function showScreen(name) { Object.values(screens).forEach((screen) => screen.classList.remove('active')); screens[name].classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function updateLandingAction() { $('.landing-cta').firstChild.textContent = state.photos.some(Boolean) ? 'Use this frame' : 'Choose a frame to begin'; }
function makeFallbackTemplate(template) {
  const canvas = document.createElement('canvas'); canvas.width = TEMPLATE_SIZE.width; canvas.height = TEMPLATE_SIZE.height;
  const ctx = canvas.getContext('2d'); ctx.fillStyle = template.id === 'bbq' ? '#b9def0' : template.id === 'shells' ? '#f4ead3' : '#111514'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = template.id === 'plain' ? '#f2ede4' : '#252c28'; ctx.font = 'bold 26px sans-serif'; ctx.fillText('UBC CSS', 32, 70);
  ctx.font = 'bold 34px sans-serif'; ctx.fillText(template.id === 'bbq' ? 'WELCOME BACK BBQ' : template.id === 'shells' ? 'CSS SUMMER' : 'PHOTO STRIP', 30, 174);
  ctx.strokeStyle = template.id === 'plain' ? '#f2ede4' : '#766d5f'; ctx.lineWidth = 5; template.slots.forEach((slot) => ctx.strokeRect(slot.x, slot.y, slot.w, slot.h));
  return canvas.toDataURL();
}
function templateImage(template) { const image = new Image(); image.src = template.file; return image; }
function renderTemplateCards() {
  const grid = $('#template-grid');
  TEMPLATES.forEach((template, index) => {
    const card = document.createElement('button'); card.className = 'template-card'; card.dataset.template = template.id; card.innerHTML = `<img class="template-thumb" alt="${template.name} template preview"><span class="template-meta"><span>${String(index + 1).padStart(2, '0')} / ${template.name}</span><span>Select frame</span></span>`;
    const image = card.querySelector('img'); image.src = template.file; image.onerror = () => { image.src = makeFallbackTemplate(template); image.dataset.fallback = 'true'; };
    card.addEventListener('click', () => { state.template = template; document.querySelectorAll('.template-card').forEach((item) => item.classList.remove('selected')); card.classList.add('selected'); $('.landing-cta').disabled = false; updateLandingAction(); }); grid.append(card);
  });
}
function updateCaptureList() { document.querySelectorAll('.capture-slot').forEach((slot, index) => { slot.classList.toggle('active', index === state.current); slot.classList.toggle('done', Boolean(state.photos[index])); slot.querySelector('.slot-text').textContent = state.photos[index] ? 'Captured' : `Photo ${String(index + 1).padStart(2, '0')}`; }); $('#progress-label').textContent = `PHOTO ${String(state.current + 1).padStart(2, '0')} / 03`; }
function setupCaptureList() { $('#capture-list').innerHTML = [1, 2, 3].map((number) => `<div class="capture-slot"><span class="slot-number">${number}</span><span class="slot-text">Photo ${String(number).padStart(2, '0')}</span></div>`).join(''); }
async function startCamera() {
  if (state.photos.every(Boolean)) { await renderResult(); showScreen('result'); return; }
  showScreen('camera'); state.current = state.photos.findIndex((photo) => !photo); if (state.current < 0) state.current = 0; updateCaptureList();
  try { state.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false }); $('#camera-video').srcObject = state.stream; $('#camera-error').hidden = true; $('#capture-button').disabled = false; $('#camera-status').textContent = 'Ready when you are'; }
  catch (error) { $('#camera-error').hidden = false; $('#capture-button').disabled = true; $('#camera-status').textContent = error.name === 'NotAllowedError' ? 'Camera permission was denied' : 'Camera is unavailable'; }
}
function countdownAndCapture() { if (!state.template || !$('#camera-video').srcObject) return; const countdown = $('#countdown'); let value = 3; countdown.textContent = value; const timer = setInterval(() => { value -= 1; if (value > 0) countdown.textContent = value; else { clearInterval(timer); countdown.textContent = ''; captureFrame(); } }, 800); }
function captureFrame() { const video = $('#camera-video'); const canvas = document.createElement('canvas'); canvas.width = video.videoWidth || 1280; canvas.height = video.videoHeight || 960; const ctx = canvas.getContext('2d'); ctx.save(); if (state.mirror) { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); } ctx.drawImage(video, 0, 0, canvas.width, canvas.height); ctx.restore(); state.photos[state.current] = canvas.toDataURL('image/jpeg', .92); $('#flash').classList.remove('fire'); void $('#flash').offsetWidth; $('#flash').classList.add('fire'); advanceAfterCapture(); }
function showCaptureReview() { state.reviewing = true; $('#capture-preview').src = state.photos[state.current]; $('#capture-review').hidden = false; $('#capture-button').disabled = true; $('#camera-status').textContent = 'Check the frame, then keep it or retake it.'; }
function continueCurrentPhoto() { state.reviewing = false; $('#capture-review').hidden = true; $('#capture-button').disabled = false; if (state.current < 2) { state.current += 1; updateCaptureList(); $('#camera-status').textContent = 'Nice. Next frame when you’re ready.'; } else { stopCamera(); renderResult(); showScreen('result'); } }
function retakeCurrentPhoto() { state.photos[state.current] = null; state.reviewing = false; $('#capture-review').hidden = true; $('#capture-button').disabled = false; updateCaptureList(); $('#camera-status').textContent = 'Ready when you are'; }
function advanceAfterCapture() { showCaptureReview(); }
function uploadPhoto(file) { if (!file) return; const reader = new FileReader(); reader.onload = () => { state.photos[state.current] = reader.result; showCaptureReview(); }; reader.readAsDataURL(file); }
function stopCamera() { if (state.stream) { state.stream.getTracks().forEach((track) => track.stop()); state.stream = null; } $('#camera-video').srcObject = null; }
function drawCover(ctx, image, slot) { const scale = Math.max(slot.w / image.naturalWidth, slot.h / image.naturalHeight); const width = image.naturalWidth * scale; const height = image.naturalHeight * scale; ctx.drawImage(image, slot.x + (slot.w - width) / 2, slot.y + (slot.h - height) / 2, width, height); }
async function renderResult() { const canvas = $('#result-canvas'); const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height); const templateImageElement = templateImage(state.template); await new Promise((resolve) => { templateImageElement.onload = resolve; templateImageElement.onerror = () => { const fallback = new Image(); fallback.onload = () => { ctx.drawImage(fallback, 0, 0); resolve(); }; fallback.src = makeFallbackTemplate(state.template); }; }); if (templateImageElement.complete && templateImageElement.naturalWidth) ctx.drawImage(templateImageElement, 0, 0); for (let index = 0; index < state.photos.length; index += 1) { if (!state.photos[index]) continue; const photo = new Image(); await new Promise((resolve) => { photo.onload = () => { drawCover(ctx, photo, state.template.slots[index]); resolve(); }; photo.src = state.photos[index]; }); } }
function downloadResult() { const link = document.createElement('a'); link.download = `ubc-css-photo-strip-${state.template.id}.png`; link.href = $('#result-canvas').toDataURL('image/png'); link.click(); }
async function shareResult() { const status = $('#share-status'); if (!navigator.share) { status.textContent = 'Sharing is not supported here. Download the PNG instead.'; return; } const blob = await new Promise((resolve) => $('#result-canvas').toBlob(resolve, 'image/png')); const file = new File([blob], 'ubc-css-photo-strip.png', { type: 'image/png' }); try { await navigator.share({ title: 'My UBC CSS photo strip', files: [file] }); } catch (error) { if (error.name !== 'AbortError') status.textContent = 'Could not share this strip from your browser.'; } }

document.addEventListener('click', (event) => { const action = event.target.closest('[data-action]')?.dataset.action; if (!action) return; if (action === 'start') startCamera(); if (action === 'capture') countdownAndCapture(); if (action === 'upload-current') $('#upload-input').click(); if (action === 'continue-current') continueCurrentPhoto(); if (action === 'retake-current') retakeCurrentPhoto(); if (action === 'download') downloadResult(); if (action === 'share') shareResult(); if (action === 'change-template') { stopCamera(); showScreen('landing'); updateLandingAction(); } if (action === 'retake') { state.photos = [null, null, null]; updateLandingAction(); startCamera(); } if (action === 'home') { stopCamera(); state.photos = [null, null, null]; updateLandingAction(); showScreen('landing'); } });
$('#upload-input').addEventListener('change', (event) => uploadPhoto(event.target.files[0]));
$('#mirror-toggle').addEventListener('change', (event) => { state.mirror = event.target.checked; });
renderTemplateCards(); setupCaptureList();
