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
            video.play();
            isRunning = true;
            btnToggle.innerText = "카메라 OFF";
            
            // 모델 로드
            session = await ort.InferenceSession.create('./yolov8n.onnx');
            console.log("모델 로드 완료!");
            requestAnimationFrame(runDetection);
        } catch (err) {
            console.error("오류:", err);
        }
    } else {
        isRunning = false;
        video.srcObject.getTracks().forEach(t => t.stop());
        btnToggle.innerText = "카메라 ON";
    }
}

async function runDetection() {
    if (!isRunning) return;

    // 1. 영상 캡처 및 전처리
    ctx.drawImage(video, 0, 0, 640, 640);
    const imgData = ctx.getImageData(0, 0, 640, 640).data;
    const input = new Float32Array(3 * 640 * 640);
    for (let i = 0; i < 640 * 640; i++) {
        input[i] = imgData[i * 4] / 255.0;
        input[i + 640 * 640] = imgData[i * 4 + 1] / 255.0;
        input[i + 2 * 640 * 640] = imgData[i * 4 + 2] / 255.0;
    }
    
    // 2. 모델 추론
    const tensor = new ort.Tensor('float32', input, [1, 3, 640, 640]);
    const output = await session.run({ images: tensor });
    const outputData = output[Object.keys(output)[0]].data;

    // 3. 박스 그리기
    drawDetection(outputData);

    // 4. 무한 루프
    requestAnimationFrame(runDetection);
}

function drawDetection(data) {
    ctx.clearRect(0, 0, 640, 640);
    
    // YoloV8 데이터 구조 [1, 84, 8400]
    // confidence가 0.5 이상인 것만 찾아서 그리는 아주 기초적인 로직
    for (let i = 0; i < 8400; i++) {
        const confidence = data[i + 8400 * 4]; // 대략적인 신뢰도 위치
        if (confidence > 0.5) {
            ctx.strokeStyle = 'lime';
            ctx.strokeRect(data[i], data[i+8400], data[i+8400*2], data[i+8400*3]);
        }
    }
}

btnToggle.addEventListener('click', toggleCam);
