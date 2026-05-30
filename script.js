let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let btnToggle = document.getElementById('btn-toggle');
let isRunning = false;
let session = null;
let currentMode = 'mid';

async function toggleCam() {
    if (!isRunning) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
            video.play();
            
            // 캔버스 크기 맞추기 (영상 시작 후 정확한 크기 반영)
            video.onloadedmetadata = () => {
                canvas.width = 640; // 모델 입력 크기 고정
                canvas.height = 640;
            };

            btnToggle.innerText = "카메라 OFF";
            isRunning = true;
            
            session = await ort.InferenceSession.create('./yolov8n.onnx');
            console.log("모델 로드 성공!");
            runDetection();
        } catch (err) {
            console.error("오류:", err);
            alert("카메라/모델 로드 실패: " + err.message);
        }
    } else {
        video.srcObject.getTracks().forEach(track => track.stop());
        btnToggle.innerText = "카메라 ON";
        isRunning = false;
    }
}

async function runDetection() {
    if (!isRunning) return;

    ctx.drawImage(video, 0, 0, 640, 640);
    const imgData = ctx.getImageData(0, 0, 640, 640).data;
    
    // RGB 채널 분리 정규화
    const input = new Float32Array(3 * 640 * 640);
    for (let i = 0; i < 640 * 640; i++) {
        input[i] = imgData[i * 4] / 255.0; // R
        input[i + 640 * 640] = imgData[i * 4 + 1] / 255.0; // G
        input[i + 2 * 640 * 640] = imgData[i * 4 + 2] / 255.0; // B
    }
    
    const tensor = new ort.Tensor('float32', input, [1, 3, 640, 640]);
    const output = await session.run({ images: tensor });
    const outputData = output[Object.keys(output)[0]].data;

    drawBoxes(outputData);

    // 모드별 루프 조절
    if (currentMode === 'low') setTimeout(runDetection, 500);
    else if (currentMode === 'mid') setTimeout(runDetection, 200);
    else requestAnimationFrame(runDetection);
}

function drawBoxes(data) {
    // 빨간 박스 테스트 (데이터 처리는 이 안에 추가 예정)
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 4;
    ctx.strokeRect(200, 200, 200, 200); 
}

function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

btnToggle.addEventListener('click', toggleCam);
