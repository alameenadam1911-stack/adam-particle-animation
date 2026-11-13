
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
const video = document.getElementById("camera");
const button = document.getElementById("startCamera");
const statusText = document.getElementById("status");

let particles = [];
let forming = false;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    createTargets();
}

function createTargets() {
    const off = document.createElement("canvas");
    off.width = canvas.width;
    off.height = canvas.height;

    const c = off.getContext("2d");
    c.fillStyle = "white";
    c.font = `bold ${Math.min(canvas.width * 0.13, 65)}px Arial`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("I LOVE YOU", canvas.width / 2, canvas.height / 2);

    const data = c.getImageData(0, 0, off.width, off.height).data;
    const targets = [];

    for (let y = 0; y < off.height; y += 5) {
        for (let x = 0; x < off.width; x += 5) {
            if (data[(y * off.width + x) * 4 + 3] > 100) {
                targets.push({ x, y });
            }
        }
    }

    particles = targets.map(t => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        tx: t.x,
        ty: t.y,
        size: 2,
        color: Math.random() > 0.5 ? "#00aaff" : "#ff8c00"
    }));
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
        if (forming) {
            p.x += (p.tx - p.x) * 0.07;
            p.y += (p.ty - p.y) * 0.07;
        } else {
            p.x += (Math.random() - 0.5) * 3;
            p.y += (Math.random() - 0.5) * 3;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.fill();
    });

    ctx.shadowBlur = 0;
    requestAnimationFrame(animate);
}

async function startCamera() {
    try {
        statusText.textContent = "Starting camera...";

        const hands = new Hands({
            locateFile: file =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6
        });

        hands.onResults(results => {
            if (results.multiHandLandmarks &&
                results.multiHandLandmarks.length > 0) {

                const hand = results.multiHandLandmarks[0];

                let fingers = 0;

                [8, 12, 16, 20].forEach(tip => {
                    if (hand[tip].y < hand[tip - 2].y) {
                        fingers++;
                    }
                });

                forming = fingers >= 3;
                statusText.textContent = forming
                    ? "Open hand: Forming words"
                    : "Closed hand: Scattering particles";

            } else {
                statusText.textContent = "Show your hand to the camera";
            }
        });

        const camera = new Camera(video, {
            onFrame: async () => {
                await hands.send({ image: video });
            },
            width: 640,
            height: 480
        });

        await camera.start();
        button.textContent = "CAMERA STARTED";

    } catch (error) {
        statusText.textContent = "Camera error: " + error.message;
    }
}

button.addEventListener("click", startCamera);
window.addEventListener("resize", resize);

resize();
animate();
