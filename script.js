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
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 이전 프레임 지우기
    
    // data는 Float32Array임. 
    // YOLOv8n은 8400개의 박스 후보가 있고, 각 후보는 84개의 값을 가짐.
    // 여기서는 가장 간단하게 첫 번째 박스 후보라도 뜨는지 확인해 보자!
    
    // [확인용]: 데이터의 첫 10개 값을 콘솔에 찍어서 구조 확인
    // console.log(data.slice(0, 10)); 

    // 화면에 박스를 그리는 로직 (좌표 변환 예시)
    // 실제 객체 탐지 좌표는 data 배열의 특정 인덱스에 들어있어.
    
    ctx.strokeStyle = '#2ecc71'; // 초록색으로 변경
    ctx.lineWidth = 4;
    
    // 임시로 화면의 특정 위치에 박스를 그려서 캔버스 연결 확인
    ctx.strokeRect(100, 100, 200, 200); 
    ctx.font = "20px Arial";
    ctx.fillStyle = "#2ecc71";
    ctx.fillText("AI 감지 중...", 100, 90);
}


function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

btnToggle.addEventListener('click', toggleCam);
