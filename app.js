// ── Supabase client ──────────────────────────────────
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ── Stars ────────────────────────────────────────────
const starsBg = document.getElementById('starsBg');
for (let i = 0; i < 90; i++) {
  const s = document.createElement('div');
  s.className = 'star';
  const size = Math.random() * 2.5 + 0.5;
  s.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${2+Math.random()*4}s;--delay:${Math.random()*5}s;`;
  starsBg.appendChild(s);
}

// ── Petals ───────────────────────────────────────────
const petalsBg = document.getElementById('petalsBg');
const sym = ['🌸','🌹','✿','❀','⁕'];
for (let i = 0; i < 16; i++) {
  const p = document.createElement('div');
  p.className = 'petal';
  p.textContent = sym[i % sym.length];
  p.style.cssText = `left:${Math.random()*100}%;animation-duration:${9+Math.random()*12}s;animation-delay:${Math.random()*12}s;font-size:${13+Math.random()*14}px;`;
  petalsBg.appendChild(p);
}

// ── Toast notification ───────────────────────────────
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => { t.className = 'toast'; }, 3500);
}

// ── Load all saved content on page load ──────────────
async function loadContent() {
  try {
    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) return;

    // Restore name
    if (data.name) {
      document.getElementById('displayName').textContent = data.name;
      document.getElementById('inputName').value = data.name;
    }

    // Restore message
    if (data.message) {
      document.getElementById('displayMessage').innerHTML = data.message;
      document.getElementById('inputMessage').value = data.message.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
    }

    // Restore photos
    if (data.photos && Array.isArray(data.photos)) {
      data.photos.forEach((url, idx) => {
        if (url) setImageInSlot(idx, url);
      });
    }

    // Restore music
    if (data.music_url) {
      loadAudioFromUrl(data.music_url, data.music_name || 'Our Song');
    }
  } catch (e) {
    console.error('Load error:', e);
  } finally {
    document.getElementById('loadingOverlay').style.display = 'none';
  }
}

// ── Save name + message to Supabase ──────────────────
async function saveEdits() {
  const name    = document.getElementById('inputName').value.trim() || 'My Little Princess';
  const rawMsg  = document.getElementById('inputMessage').value.trim();
  const htmlMsg = rawMsg
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\n/g,'<br>');

  document.getElementById('saveLabel').textContent = 'Menyimpan...';

const { error } = await supabaseClient
  .from(TABLE_NAME)
  .update({ name, message: htmlMsg })
  .eq('id', 1);

  if (error) {
    showToast('Gagal menyimpan. Cek koneksi & konfigurasi Supabase.', true);
    console.error(error);
  } else {
    document.getElementById('displayName').textContent = name;
    document.getElementById('displayMessage').innerHTML = htmlMsg;
    showToast('Tersimpan! 🌹');
    closeModal();
  }

  document.getElementById('saveLabel').textContent = 'Simpan ✦';
}

// ── Upload image to Supabase Storage ─────────────────
async function uploadImage(input, idx) {
  const file = input.files[0];
  if (!file) return;

  showUploadOverlay('Mengupload foto...');

  const ext      = file.name.split('.').pop();
  const fileName = `photo_${idx}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    hideUploadOverlay();
    showToast('Gagal upload foto. Cek konfigurasi Storage.', true);
    console.error(uploadError);
    return;
  }

  const { data: urlData } = supabaseClient.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);

  const publicUrl = urlData.publicUrl;

  // Update DB: get current photos array then patch slot idx
  const { data: row } = await supabaseClient
    .from(TABLE_NAME)
    .select('photos')
    .eq('id', 1)
    .single();

  const photos = row?.photos || Array(5).fill(null);
  photos[idx]  = publicUrl;

const { error: dbError } = await supabaseClient
  .from(TABLE_NAME)
  .update({ photos })
  .eq('id', 1);

if (dbError) {
  hideUploadOverlay();
  showToast('Foto terupload, tapi gagal disimpan ke database.', true);
  console.error(dbError);
  return;
}

  setImageInSlot(idx, publicUrl);
  hideUploadOverlay();
  showToast('Foto tersimpan! 📷');
}

function setImageInSlot(idx, url) {
  const item = document.getElementById('gItem' + idx);
  if (!item) return;
  const ph = item.querySelector('.gallery-placeholder');
  if (ph) ph.remove();
  let img = item.querySelector('img');
  if (!img) {
    img = document.createElement('img');
    img.alt = 'Memory ' + (idx + 1);
    item.insertBefore(img, item.querySelector('input'));
  }
  img.src = url;
}

// ── Upload music to Supabase Storage ─────────────────
async function uploadMusic(input) {
  const file = input.files[0];
  if (!file) return;

  showUploadOverlay('Mengupload lagu...');

  const ext      = file.name.split('.').pop();
  const fileName = `music_${Date.now()}.${ext}`;
  const songName = file.name.replace(/\.[^/.]+$/, '');

  const { error: uploadError } = await supabaseClient.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    hideUploadOverlay();
    showToast('Gagal upload lagu. Cek konfigurasi Storage.', true);
    console.error(uploadError);
    return;
  }

  const { data: urlData } = supabaseClient.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(fileName);

  const publicUrl = urlData.publicUrl;

const { error: dbError } = await supabaseClient
  .from(TABLE_NAME)
  .update({ music_url: publicUrl, music_name: songName })
  .eq('id', 1);

if (dbError) {
  hideUploadOverlay();
  showToast('Lagu terupload, tapi gagal disimpan ke database.', true);
  console.error(dbError);
  return;
}

  loadAudioFromUrl(publicUrl, songName);
  hideUploadOverlay();
  showToast('Lagu tersimpan! 🎵');
}

// ── Audio player ─────────────────────────────────────
let audio   = null;
let playing = false;

function loadAudioFromUrl(url, name) {
  if (audio) { audio.pause(); playing = false; }
  audio = new Audio(url);
  document.getElementById('songTitle').textContent  = name;
  document.getElementById('songArtist').textContent = '♪ siap diputar';
  document.getElementById('playBtn').textContent    = '▶';
  document.getElementById('progressFill').style.width = '0%';

  audio.ontimeupdate = () => {
    if (!audio.duration) return;
    document.getElementById('progressFill').style.width =
      (audio.currentTime / audio.duration * 100) + '%';
  };
  audio.onended = () => {
    playing = false;
    document.getElementById('playBtn').textContent = '▶';
    document.getElementById('progressFill').style.width = '0%';
  };
}

function togglePlay() {
  if (!audio) { showToast('Upload lagu dulu ya! 🎵'); return; }
  if (playing) {
    audio.pause();
    document.getElementById('playBtn').textContent = '▶';
  } else {
    audio.play();
    document.getElementById('playBtn').textContent = '⏸';
  }
  playing = !playing;
}

// ── Upload overlay ────────────────────────────────────
function showUploadOverlay(msg) {
  document.getElementById('uploadText').textContent = msg;
  document.getElementById('uploadOverlay').classList.add('open');
}
function hideUploadOverlay() {
  document.getElementById('uploadOverlay').classList.remove('open');
}

// ── Modal ─────────────────────────────────────────────
function openModal() {
  // Pre-fill modal with current values
  document.getElementById('inputName').value =
    document.getElementById('displayName').textContent;
  document.getElementById('inputMessage').value =
    document.getElementById('displayMessage').innerHTML
      .replace(/<br\s*\/?>/gi, '\n').replace(/<em>/g,'').replace(/<\/em>/g,'').replace(/<[^>]*>/g,'');
  document.getElementById('editModal').classList.add('open');
}
function closeModal() {
  document.getElementById('editModal').classList.remove('open');
}

document.getElementById('editModal').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ── Init ──────────────────────────────────────────────
loadContent();
