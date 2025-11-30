// games/flappy-clone/game.js

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const messageBox = document.getElementById('game-message');

// --- Konfigurasi Game ---
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;

// Player (Burung/Objek)
let player = {
    x: 50,
    y: CANVAS_HEIGHT / 2,
    width: 30,
    height: 30,
    color: '#ffdd00', // Kuning Emas
    velocity: 0,
    gravity: 0.8,
    jumpPower: -12
};

// Pipa
let pipes = [];
const pipeWidth = 50;
const pipeGap = 150;
let pipeSpawnRate = 120; // Frame count
let frame = 0;
let score = 0;
let gameRunning = false;

// --- Fungsi Gambar ---
function drawPlayer() {
    ctx.fillStyle = player.color;
    // Menggambar player sebagai lingkaran (lebih ramah di Canvas)
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.stroke();
}

function drawPipes() {
    ctx.fillStyle = '#00cc00'; // Hijau Cerah
    ctx.strokeStyle = '#000000';
    pipes.forEach(pipe => {
        // Pipa Atas
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.top);
        ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.top);
        
        // Pipa Bawah
        ctx.fillRect(pipe.x, CANVAS_HEIGHT - pipe.bottom, pipeWidth, pipe.bottom);
        ctx.strokeRect(pipe.x, CANVAS_HEIGHT - pipe.bottom, pipeWidth, pipe.bottom);
    });
}

function drawScore() {
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Orbitron';
    ctx.fillText('SCORE: ' + score, 10, 30);
}

// --- Fungsi Logika ---
function jump() {
    if (gameRunning) {
        player.velocity = player.jumpPower;
    }
}

function updateGame() {
    if (!gameRunning) return;

    // 1. Clear Canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#273453';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 2. Update Player (Gravitasi & Posisi)
    player.velocity += player.gravity;
    player.y += player.velocity;

    // 3. Spawning Pipa
    if (frame % pipeSpawnRate === 0) {
        // Tentukan tinggi gap secara acak
        const gapPosition = Math.random() * (CANVAS_HEIGHT - pipeGap - 200) + 100;
        
        pipes.push({
            x: CANVAS_WIDTH,
            top: gapPosition,
            bottom: CANVAS_HEIGHT - (gapPosition + pipeGap),
            passed: false // Untuk menghitung skor
        });
    }
    frame++;

    // 4. Update Pipa dan Deteksi Tabrakan
    pipes.forEach((pipe, index) => {
        pipe.x -= 3; // Kecepatan Pipa
        
        // Tabrakan (Sederhana)
        const hitTop = player.x < pipe.x + pipeWidth && player.x + player.width > pipe.x && player.y < pipe.top;
        const hitBottom = player.x < pipe.x + pipeWidth && player.x + player.width > pipe.x && player.y + player.height > CANVAS_HEIGHT - pipe.bottom;

        if (hitTop || hitBottom) {
            endGame();
            return;
        }

        // Skor
        if (pipe.x + pipeWidth < player.x && !pipe.passed) {
            score++;
            pipe.passed = true;
        }

        // Hapus pipa yang sudah keluar dari layar
        if (pipe.x + pipeWidth < 0) {
            pipes.splice(index, 1);
        }
    });

    // 5. Batasan Langit dan Tanah
    if (player.y + player.height > CANVAS_HEIGHT || player.y < 0) {
        endGame();
        return;
    }

    // 6. Gambar Ulang
    drawPipes();
    drawPlayer();
    drawScore();
    
    // Ulangi loop
    requestAnimationFrame(updateGame);
}

function startGame() {
    gameRunning = true;
    player.y = CANVAS_HEIGHT / 2;
    player.velocity = 0;
    pipes = [];
    score = 0;
    frame = 0;
    messageBox.style.display = 'none';
    requestAnimationFrame(updateGame);
}

function endGame() {
    gameRunning = false;
    messageBox.style.display = 'block';
    messageBox.innerHTML = `GAME OVER! Skor Akhir: ${score}. Tekan Spasi untuk main lagi.`;
}

// --- Event Listener ---
function handleInput(e) {
    if (e.code === 'Space' || e.type === 'mousedown') {
        if (!gameRunning) {
            startGame();
        } else {
            jump();
        }
    }
}

// Mendeteksi Spasi dan Klik Mouse/Tap
document.addEventListener('keydown', handleInput);
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', handleInput);

// Tampilkan pesan awal
messageBox.innerHTML = "Tekan Spasi atau Klik untuk Mulai!";
