let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let btnToggle = document.getElementById('btn-toggle');
let isRunning = false;
let session = null;
let currentMode = 'mid'; // 기본값

// 카메라 제어 및 모델 로드
async function toggleCam() {
    if (!isRunning) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
            btnToggle.innerText = "카메라 OFF";
            isRunning = true;
            
            // 모델 로드
            session = await ort.InferenceSession.create('./yolov8n.onnx');
            console.log("모델 로드 성공!");
            
            // 추론 루프 시작
            runDetection();
        } catch (err) {
            console.error("오류 발생:", err);
            alert("카메라나 모델을 불러오는 데 실패했어: " + err.message);
        }
    } else {
        video.srcObject.getTracks().forEach(track => track.stop());
        btnToggle.innerText = "카메라 ON";
        isRunning = false;
    }
}

// 모드 전환
function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    console.log("모드 변경:", mode);
}

// 실시간 추론 루프
async function runDetection() {
    if (!isRunning) return;

    // 1. 영상 캡처 (640x640)
    ctx.drawImage(video, 0, 0, 640, 640);
    
    // 2. 여기서 추론(Inference) 로직이 들어갈 자리야
    // 현재는 모델만 로드된 상태고, tensor 변환과 후처리가 필요해
    
    // 모드에 따라 추론 속도 조절 (requestAnimationFrame vs setTimeout)
    if (currentMode === 'low') {
        setTimeout(runDetection, 500); // 0.5초
    } else if (currentMode === 'mid') {
        setTimeout(runDetection, 200); // 0.2초
    } else {
        requestAnimationFrame(runDetection); // 실시간
    }
}

btnToggle.addEventListener('click', toggleCam);
