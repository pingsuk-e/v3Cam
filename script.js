let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let btnToggle = document.getElementById('btn-toggle');
let isRunning = false;

async function toggleCam() {
    if (!isRunning) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
        btnToggle.innerText = "카메라 OFF";
        isRunning = true;
    } else {
        video.srcObject.getTracks().forEach(track => track.stop());
        btnToggle.innerText = "카메라 ON";
        isRunning = false;
    }
}

function setMode(mode) {
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    console.log("선택된 모드:", mode);
}

btnToggle.addEventListener('click', toggleCam);
