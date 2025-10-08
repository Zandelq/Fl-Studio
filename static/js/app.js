let zoom = 1.0;
const tracks = document.getElementById('tracks');
const fileInput = document.getElementById('fileInput');

// Generate fake tracks for UI
for (let i = 0; i < 10; i++) {
    const track = document.createElement('div');
    track.className = 'track';
    track.dataset.track = i;
    tracks.appendChild(track);
}

// Upload files
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/upload', { method: 'POST', body: formData });
    const data = await res.json();
    
    if (data.success) {
        addClip(data.filename);
    } else {
        alert('Invalid file type');
    }
});

// Add clip visually
function addClip(name) {
    const track = document.querySelector('.track');
    const clip = document.createElement('div');
    clip.className = 'clip';
    clip.style.left = `${Math.random() * 400}px`;
    clip.style.width = '200px';
    clip.innerHTML = `
        <div class="waveform"></div>
        <span style="position:absolute;left:5px;top:5px;font-size:12px;">${name}</span>
    `;
    clip.draggable = true;

    clip.addEventListener('dragstart', e => {
        e.dataTransfer.setData('offsetX', e.offsetX);
    });
    clip.addEventListener('dragend', e => {
        const offsetX = parseInt(e.dataTransfer.getData('offsetX') || 0);
        clip.style.left = `${e.pageX - tracks.offsetLeft - offsetX}px`;
    });

    track.appendChild(clip);
}

// Zoom controls
document.getElementById('zoomIn').addEventListener('click', () => {
    zoom += 0.2;
    tracks.style.transform = `scaleX(${zoom})`;
});

document.getElementById('zoomOut').addEventListener('click', () => {
    zoom = Math.max(0.5, zoom - 0.2);
    tracks.style.transform = `scaleX(${zoom})`;
});
