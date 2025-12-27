const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 1. AYARLAR ---
let gameRunning = false;
let score = 0;
let gameSpeed = 6;
const groundHeight = 100; // Zemin resminin yüksekliği (Piksel)

// Ekran Boyutlandırma
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// --- 2. RESİMLERİ YÜKLEME (İsimlere Dikkat!) ---
const playerImg = new Image();
playerImg.src = 'assets/karakter.png'; 

const obstacleImg = new Image();
obstacleImg.src = 'assets/turta.png'; // Engelimiz Turta

const backgroundImg = new Image();
backgroundImg.src = 'assets/arkaplan.png';

const groundImg = new Image();
groundImg.src = 'assets/zemin.png'; // Yeni eklediğimiz zemin

// Yükleme Kontrolü
let assetsLoaded = 0;
const totalAssets = 4; // Toplam 4 resim var

function checkAssets() {
    assetsLoaded++;
    if (assetsLoaded === totalAssets) {
        document.getElementById('loadingMessage').style.display = 'none';
        startGame();
    }
}

playerImg.onload = checkAssets;
obstacleImg.onload = checkAssets;
backgroundImg.onload = checkAssets;
groundImg.onload = checkAssets;

// Hata durumunda oyunun donmasını engelle
playerImg.onerror = () => { console.log("Karakter yok"); checkAssets(); };
obstacleImg.onerror = () => { console.log("Turta yok"); checkAssets(); };
backgroundImg.onerror = () => { console.log("Arkaplan yok"); checkAssets(); };
groundImg.onerror = () => { console.log("Zemin yok"); checkAssets(); };

// --- 3. OYUN NESNELERİ ---

const player = {
    x: 50,
    // Karakter zemin resminin tam üstünde başlasın:
    y: canvas.height - groundHeight - 100, 
    w: 60,  // Karakter genişliği (Gerekirse ayarla)
    h: 60,  // Karakter yüksekliği
    dy: 0,
    jumpPower: -15,
    gravity: 0.8,
    grounded: false
};

let obstacles = [];
let obstacleTimer = 0;

// --- 4. KONTROLLER ---

function jump() {
    if (player.grounded) {
        player.dy = player.jumpPower;
        player.grounded = false;
    }
}

// Dokunmatik (Mobil)
window.addEventListener('touchstart', function(e) {
    e.preventDefault();
    jump();
    if (!gameRunning) resetGame();
}, { passive: false });

// Klavye (PC)
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        jump();
        if (!gameRunning) resetGame();
    }
});

// --- 5. OYUN MANTIĞI ---

function update() {
    if (!gameRunning) return;

    // Yerçekimi
    player.dy += player.gravity;
    player.y += player.dy;

    // Zemin Çarpışması (Zemin resminin üstüne basmalı)
    // Zemin Y koordinatı = canvas.height - groundHeight
    if (player.y + player.h > canvas.height - groundHeight) {
        player.y = canvas.height - groundHeight - player.h;
        player.dy = 0;
        player.grounded = true;
    }

    // Engel (Turta) Oluşturma
    obstacleTimer++;
    if (obstacleTimer > 90 + Math.random() * 50) { // Biraz rastgelelik ekledim
        obstacles.push({
            x: canvas.width,
            y: canvas.height - groundHeight - 50, // Zeminin tam üstünde, 50px boyunda
            w: 50,
            h: 50
        });
        obstacleTimer = 0;
    }

    // Engelleri Hareket Ettir
    for (let i = 0; i < obstacles.length; i++) {
        let obs = obstacles[i];
        obs.x -= gameSpeed;

        if (obs.x + obs.w < 0) {
            obstacles.splice(i, 1);
            score++;
            i--;
        }

        // Çarpışma Kontrolü
        if (
            player.x < obs.x + obs.w - 10 && // -10 ve +10'lar çarpışmayı daha hassas yapar
            player.x + player.w > obs.x + 10 &&
            player.y < obs.y + obs.h - 10 &&
            player.y + player.h > obs.y + 10
        ) {
            gameOver();
        }
    }
}

// --- 6. ÇİZİM ---

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Arkaplan
    if (backgroundImg.complete) {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#87CEEB";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Zemin (Resmi ekran genişliğince uzatıyoruz)
    if (groundImg.complete) {
        ctx.drawImage(groundImg, 0, canvas.height - groundHeight, canvas.width, groundHeight);
    } else {
        ctx.fillStyle = "#654321";
        ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
    }

    // 3. Karakter
    if (playerImg.complete) {
        ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);
    } else {
        ctx.fillStyle = "red";
        ctx.fillRect(player.x, player.y, player.w, player.h);
    }

    // 4. Engeller (Turta)
    for (let obs of obstacles) {
        if (obstacleImg.complete) {
            ctx.drawImage(obstacleImg, obs.x, obs.y, obs.w, obs.h);
        } else {
            ctx.fillStyle = "orange";
            ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
        }
    }

    // 5. Skor
    ctx.fillStyle = "white";
    ctx.font = "bold 30px Arial";
    ctx.strokeStyle = "black"; // Yazı kenarlığı
    ctx.lineWidth = 3;
    ctx.strokeText("Skor: " + score, 20, 50);
    ctx.fillText("Skor: " + score, 20, 50);

    // Oyun Bitti Ekranı
    if (!gameRunning) {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "40px Arial";
        ctx.fillText("Oyun Bitti!", canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = "20px Arial";
        ctx.fillText("Tekrar oynamak için dokun", canvas.width / 2, canvas.height / 2 + 30);
        ctx.textAlign = "start"; // Ayarı normale döndür
    }
}

// --- 7. DÖNGÜ ---

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    gameRunning = true;
    gameLoop();
}

function resetGame() {
    player.y = canvas.height - groundHeight - 100;
    player.dy = 0;
    obstacles = [];
    score = 0;
    gameRunning = true;
}

function gameOver() {
    gameRunning = false;
}