let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let btnToggle = document.getElementById('btn-toggle');
let isRunning = false;
let session = null;

async function toggleCam() {
    if (!isRunning) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
            
            // 모델 로드
            session = await ort.InferenceSession.create('./yolov8n.onnx');
            console.log("모델 로드 성공!");
            
            isRunning = true;
            btnToggle.innerText = "카메라 OFF";
            
            // 영상 프레임 루프 시작
            requestAnimationFrame(runDetection);
        } catch (err) {
            console.error("에러:", err);
        }
    } else {
        isRunning = false;
        video.srcObject.getTracks().forEach(t => t.stop());
        btnToggle.innerText = "카메라 ON";
    }
}

async function runDetection() {
    if (!isRunning) return;

    // 1. 영상 프레임 캡처 (640x640)
    ctx.drawImage(video, 0, 0, 640, 640);
    const imgData = ctx.getImageData(0, 0, 640, 640).data;
    
    // 2. 텐서 전처리 (가벼운 처리)
    const input = new Float32Array(3 * 640 * 640);
    for (let i = 0; i < 640 * 640; i++) {
        input[i] = imgData[i * 4] / 255.0;
        input[i + 640 * 640] = imgData[i * 4 + 1] / 255.0;
        input[i + 2 * 640 * 640] = imgData[i * 4 + 2] / 255.0;
    }
    
    // 3. 추론 (session.run)
    const tensor = new ort.Tensor('float32', input, [1, 3, 640, 640]);
    const output = await session.run({ images: tensor });
    
    // 4. 박스 그리기
    drawBoxes(); 

    // 5. 다음 프레임 예약 (중요: 여기서 멈추지 않게 함)
    requestAnimationFrame(runDetection);
}

function drawBoxes() {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 4;
    ctx.strokeRect(100, 100, 200, 200); // 감지 테스트용
}

btnToggle.addEventListener('click', toggleCam);
