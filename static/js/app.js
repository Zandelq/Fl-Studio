// FL-style web playlist (Phase 1)
// Requires wavesurfer.js loaded in index.html

// DOM refs
const tracksContainer = document.getElementById('tracksContainer');
const tracklist = document.getElementById('tracklist');
const fileInput = document.getElementById('fileInput');
const addTrackBtn = document.getElementById('addTrackBtn');
const dropModeBtn = document.getElementById('dropModeBtn');
const zoomRange = document.getElementById('zoomRange');
const zoomIn = document.getElementById('zoomIn');
const zoomOut = document.getElementById('zoomOut');
const playAllBtn = document.getElementById('playAll');
const stopAllBtn = document.getElementById('stopAll');
const exportRegionBtn = document.getElementById('exportRegionBtn');
const timeRuler = document.getElementById('timeRuler');

let pxPerSecond = parseInt(zoomRange.value);
let trackCounter = 0;
let SELECTED_TRACK = null;
let DROP_MODE = false;
let SELECTED_REGION = null;

// Keep wavesurfer instances per clip id
const CLIPS = {}; // clipId -> { ws, clipEl, trackId, filename, objURL }

// Create initial tracks similar to FL layout
['Drums','Kick','Snare','Bass','Guitar','Piano','Strings','FX'].forEach(n => createTrack(n));

// Create track function
function createTrack(name){
  trackCounter++;
  const id = `track-${trackCounter}`;
  const trackName = name || `Track ${trackCounter}`;

  // sidebar entry
  const entry = document.createElement('div');
  entry.className = 'track-entry';
  entry.dataset.trackId = id;
  entry.innerHTML = `<div>${trackName}</div><input class="volume-slider" type="range" min="0" max="1" step="0.01" value="1">`;
  entry.addEventListener('click', () => selectTrack(id));
  tracklist.appendChild(entry);

  // playlist row
  const left = document.createElement('div');
  left.className = 'track-left';
  left.innerHTML = `<span class="label">${trackName}</span>`;

  const right = document.createElement('div');
  right.className = 'track-right';
  right.id = `${id}-right`;

  // enable drop to this track
  right.addEventListener('dragover', (e)=> e.preventDefault());
  right.addEventListener('drop', (e)=>{
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length) {
      const f = e.dataTransfer.files[0];
      uploadFileToTrack(f, id);
    }
  });

  const row = document.createElement('div');
  row.className = 'track-row';
  row.id = id;
  row.appendChild(left);
  row.appendChild(right);
  tracksContainer.appendChild(row);

  // wire volume slider
  const volSlider = entry.querySelector('.volume-slider');
  volSlider.addEventListener('input', ()=>{
    const vol = parseFloat(volSlider.value);
    Object.values(CLIPS).forEach(c => {
      if (c.trackId === id) try { c.ws.setVolume(vol); } catch(e){}
    });
  });

  // auto-select newly created track
  selectTrack(id);
  return id;
}

function selectTrack(id){
  SELECTED_TRACK = id;
  document.querySelectorAll('.track-entry').forEach(el => el.classList.toggle('selected', el.dataset.trackId === id));
}

// file input handler
fileInput.addEventListener('change', async (ev) => {
  const f = ev.target.files[0];
  if (!f) return;
  if (!SELECTED_TRACK) {
    alert('Select a track in the left sidebar first.');
    fileInput.value = '';
    return;
  }
  await uploadFileToTrack(f, SELECTED_TRACK);
  fileInput.value = '';
});

// drag-drop mode toggles full-area drops onto selected track
dropModeBtn.addEventListener('click', ()=>{
  DROP_MODE = !DROP_MODE;
  dropModeBtn.textContent = DROP_MODE ? 'Drop Mode: ON' : 'Drop Mode';
  if (DROP_MODE){
    tracksContainer.addEventListener('dragover', onGlobalDragOver);
    tracksContainer.addEventListener('drop', onGlobalDrop);
  } else {
    tracksContainer.removeEventListener('dragover', onGlobalDragOver);
    tracksContainer.removeEventListener('drop', onGlobalDrop);
  }
});
function onGlobalDragOver(e){ e.preventDefault(); }
function onGlobalDrop(e){
  e.preventDefault();
  if (e.dataTransfer.files && e.dataTransfer.files.length){
    if (!SELECTED_TRACK) return alert('Select a track first.');
    uploadFileToTrack(e.dataTransfer.files[0], SELECTED_TRACK);
  }
}

// upload function (client-only) — create object URL and add clip
async function uploadFileToTrack(file, trackId){
  const filename = file.name;
  const objURL = URL.createObjectURL(file);
  addClip(objURL, filename, trackId);
}

// Add clip DOM + wavesurfer setup
function addClip(objURL, filename, trackId){
  const right = document.getElementById(`${trackId}-right`);
  if (!right) return;

  const clip = document.createElement('div');
  clip.className = 'clip color' + (Math.floor(Math.random()*5));
  clip.style.left = '60px';
  clip.style.width = '600px';
  clip.draggable = false;

  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = filename;
  clip.appendChild(name);

  const wf = document.createElement('div');
  wf.className = 'wf wavesurfer-container';
  clip.appendChild(wf);
  right.appendChild(clip);

  // wavesurfer
  const ws = WaveSurfer.create({
    container: wf,
    waveColor: 'rgba(255,255,255,0.6)',
    progressColor: 'rgba(255,255,255,0.06)',
    height: clip.clientHeight,
    normalize: true,
    responsive: true,
    plugins: [
      WaveSurfer.regions.create({ dragSelection: { slop: 5 } })
    ]
  });

  const clipId = `clip_${Date.now()}_${Math.floor(Math.random()*9999)}`;
  CLIPS[clipId] = { ws, clipEl: clip, trackId, filename, objURL };

  ws.load(objURL);

  ws.on('ready', ()=>{
    const dur = ws.getDuration();
    clip.style.width = Math.max(120, Math.round(dur * pxPerSecond)) + 'px';
    ws.zoom(pxPerSecond);
    drawTimeRuler();
    // set initial volume from track slider
    const entry = Array.from(document.querySelectorAll('.track-entry')).find(e=>e.dataset.trackId===trackId);
    const vol = entry ? parseFloat(entry.querySelector('.volume-slider').value) : 1;
    try{ ws.setVolume(vol); }catch(e){}
  });

  // double click to add region
  wf.addEventListener('dblclick', (ev)=>{
    const rect = wf.getBoundingClientRect();
    const clickX = ev.clientX - rect.left;
    const duration = ws.getDuration();
    const seconds = (clickX / clip.clientWidth) * duration;
    const start = Math.max(0, seconds - 0.5);
    const end = Math.min(duration, start + 1.0);
    const region = ws.addRegion({ start, end, color: 'rgba(255,255,255,0.08)', drag:true, resize:true });
    region.clipId = clipId;
    region.trackId = trackId;
    selectRegion(region);
  });

  // region clicked
  ws.on('region-click', (region, e)=>{
    e.stopPropagation();
    selectRegion(region);
  });

  // play/pause on click
  wf.addEventListener('click', ()=> ws.playPause());

  // drag clip horizontal
  enableDrag(clip);

  // assign id for lookups
  clip.dataset.clipId = clipId;
}

// dragging DOM element inside its parent horizontally
function enableDrag(el){
  let dragging=false, startX=0, origLeft=0;
  el.addEventListener('pointerdown', (e) => {
    dragging=true; startX=e.clientX; origLeft=parseFloat(el.style.left||0);
    el.setPointerCapture(e.pointerId); el.style.cursor='grabbing';
  });
  el.addEventListener('pointermove', (e) => {
    if(!dragging) return;
    const dx = e.clientX - startX; let newLeft = origLeft + dx; newLeft = Math.max(0, newLeft);
    el.style.left = `${newLeft}px`;
  });
  el.addEventListener('pointerup', (e)=>{
    dragging=false; el.style.cursor='grab';
    try{ el.releasePointerCapture(e.pointerId) }catch{}
  });
  el.addEventListener('pointercancel', ()=>{ dragging=false; el.style.cursor='grab'; });
}

// zoom controls
zoomRange.addEventListener('input', ()=>{
  pxPerSecond = parseInt(zoomRange.value); updateAllZoom();
});
zoomIn.addEventListener('click', ()=> { pxPerSecond = Math.min(2000, pxPerSecond+100); zoomRange.value = pxPerSecond; updateAllZoom(); });
zoomOut.addEventListener('click', ()=> { pxPerSecond = Math.max(50, pxPerSecond-100); zoomRange.value = pxPerSecond; updateAllZoom(); });

// update wavesurfer zoom and clip widths
function updateAllZoom(){
  Object.values(CLIPS).forEach(c => {
    const ws = c.ws; const clip = c.clipEl;
    const dur = ws.getDuration() || 1; const w = Math.max(120, Math.round(dur * pxPerSecond));
    clip.style.width = w + 'px';
    try{ ws.zoom(pxPerSecond); }catch(e){}
  });
  drawTimeRuler();
}

// timeline ruler drawing
function drawTimeRuler(){
  timeRuler.innerHTML = '';
  const width = Math.max(tracksContainer.scrollWidth, tracksContainer.clientWidth);
  const totalSec = Math.max(4, Math.round(width / pxPerSecond));
  const step = Math.max(1, Math.round(totalSec / 20));
  for(let s=0;s<=totalSec;s+=step){
    const x = s * pxPerSecond;
    const tick = document.createElement('div');
    tick.className = 'time-tick';
    tick.style.left = `${x}px`;
    tick.textContent = `${s}s`;
    timeRuler.appendChild(tick);
  }
}

// select region
function selectRegion(region){
  SELECTED_REGION = region;
}

// export region — client-side decode / slice / WAV encode and trigger download
exportRegionBtn.addEventListener('click', async ()=>{
  if (!SELECTED_REGION) return alert('Create/select a region first.');
  const region = SELECTED_REGION;
  const clipObj = CLIPS[region.clipId];
  if (!clipObj) return alert('Clip not found for region.');

  try {
    exportRegionBtn.disabled = true; exportRegionBtn.textContent = 'Exporting...';

    // fetch audio as arraybuffer
    const resp = await fetch(clipObj.objURL);
    const ab = await resp.arrayBuffer();
    const audioCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1,1,44100);
    const decoded = await audioCtx.decodeAudioData(ab.slice(0)); // clone
    // slice buffer channels
    const sampleRate = decoded.sampleRate;
    const startSample = Math.floor(region.start * sampleRate);
    const endSample = Math.floor(region.end * sampleRate);
    const length = endSample - startSample;

    // create new buffer
    const outCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(decoded.numberOfChannels, length, sampleRate);
    const newBuf = outCtx.createBuffer(decoded.numberOfChannels, length, sampleRate);
    for (let ch=0; ch<decoded.numberOfChannels; ch++){
      const src = decoded.getChannelData(ch).subarray(startSample, endSample);
      newBuf.copyToChannel(src, ch, 0);
    }

    // render to buffer
    const render = await outCtx.startRendering();
    // get interleaved PCM
    const wavBlob = encodeWAV(render);
    // download
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `region_${clipObj.filename.replace(/\.\w+$/,'')}_${Math.floor(region.start*1000)}-${Math.floor(region.end*1000)}.wav`;
    document.body.appendChild(a); a.click();
    a.remove();
    URL.revokeObjectURL(url);

    alert('Export ready — check your downloads.');
  } catch (e){
    console.error(e);
    alert('Export failed: ' + e.message);
  } finally {
    exportRegionBtn.disabled = false; exportRegionBtn.textContent = 'Export Region';
  }
});

// WAV encoding helper (from AudioBuffer) -> Blob
function encodeWAV(audioBuffer){
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  // interleave
  let interleaved;
  if (numChannels === 2) {
    const left = audioBuffer.getChannelData(0);
    const right = audioBuffer.getChannelData(1);
    interleaved = new Float32Array(left.length + right.length);
    let idx = 0;
    for (let i = 0; i < left.length; i++){
      interleaved[idx++] = left[i];
      interleaved[idx++] = right[i];
    }
  } else {
    interleaved = audioBuffer.getChannelData(0);
  }

  // convert to 16-bit PCM
  const buffer = new ArrayBuffer(44 + interleaved.length * 2);
  const view = new DataView(buffer);
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + interleaved.length * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sampleRate * blockAlign) */
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, numChannels * (bitDepth / 8), true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, interleaved.length * 2, true);

  // write PCM samples
  floatTo16BitPCM(view, 44, interleaved);

  return new Blob([view], { type: 'audio/wav' });
}
function floatTo16BitPCM(output, offset, input){
  for (let i = 0; i < input.length; i++, offset += 2){
    let s = Math.max(-1, Math.min(1, input[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7FFF;
    output.setInt16(offset, s, true);
  }
}
function writeString(view, offset, string){
  for (let i = 0; i < string.length; i++){
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// play/stop all
playAllBtn.addEventListener('click', ()=> Object.values(CLIPS).forEach(c=>{ try{ c.ws.play(); }catch{} }));
stopAllBtn.addEventListener('click', ()=> Object.values(CLIPS).forEach(c=>{ try{ c.ws.stop(); }catch{} }));

// keep ruler updated
let redrawTimer = null;
tracksContainer.addEventListener('scroll', ()=> {
  if (redrawTimer) clearTimeout(redrawTimer);
  redrawTimer = setTimeout(drawTimeRuler, 80);
});
window.addEventListener('resize', drawTimeRuler);
drawTimeRuler();
