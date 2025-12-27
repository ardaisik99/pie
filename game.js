const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('scoreBoard');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');

// --- RESİMLERİN YÜKLENMESİ ---
// Senin verdiğin isimlere göre assets klasöründen çağırıyoruz
const bgImg = new Image();
bgImg.src = 'assets/arkaplan.png'; 

const playerImg = new Image();
playerImg.src = 'assets/karakter.png'; 

const pieImg = new Image();
pieImg.src = 'assets/turta.png'; 

const groundImg = new Image();
groundImg.src = 'assets/zemin.png';

// --- EKRAN AYARLARI ---
function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// --- OYUN DEĞİŞKENLERİ ---
let gameRunning = true;
let score = 0;
let frames = 0;
let dropSpeed = 5; // Turtaların düşüş hızı

// Oyuncu Ayarları
const player = {
    x: canvas.width / 2,
    y: canvas.height - 130, // Zeminin hemen üstü
    width: 80,  
    height: 80, 
    speed: 9 // Sağa sola gitme hızı
};

// Düşen Turtalar
let pies = [];

// Kontrol Durumları
let leftPressed = false;
let rightPressed = false;

// --- KONTROLLER (KLAVYE & DOKUNMATİK) ---

// Klavye
document.addEventListener('keydown', (e) => {
    if(e.key === 'ArrowLeft') leftPressed = true;
    if(e.key === 'ArrowRight') rightPressed = true;
});
document.addEventListener('keyup', (e) => {
    if(e.key === 'ArrowLeft') leftPressed = false;
    if(e.key === 'ArrowRight') rightPressed = false;
});

// Mobil Dokunmatik
document.addEventListener('touchstart', handleTouch, {passive: false});
document.addEventListener('touchend', () => {
    leftPressed = false;
    rightPressed = false;
});

function handleTouch(e) {
    // Ekranın yarısından soluna basılırsa sola, sağına basılırsa sağa
    const touchX = e.touches[0].clientX;
    if (touchX < canvas.width / 2) {
        leftPressed = true;
        rightPressed = false;
    } else {
        rightPressed = true;
        leftPressed = false;
    }
}

// --- OYUN FONKSİYONLARI ---

function spawnPie() {
    const size = 60; // Turta boyutu
    // Ekran dışına taşmayacak şekilde rastgele X
    const x = Math.random() * (canvas.width - size);
    
    pies.push({
        x: x,
        y: -70, // Ekranın üstünden başlar
        size: size,
        speed: dropSpeed + Math.random() * 2 // Hızda ufak rastgelelik
    });
}

function update() {
    if (!gameRunning) return;

    // 1. Oyuncu Hareketi
    if (leftPressed && player.x > 0) {
        player.x -= player.speed;
    }
    if (rightPressed && player.x + player.width < canvas.width) {
        player.x += player.speed;
    }
    
    // Y konumunu sürekli güncelle (Ekran dönerse bozulmasın diye)
    player.y = canvas.height - 130; 

    // 2. Turta Üretimi
    if (frames % 50 === 0) { // Her ~0.8 saniyede bir
        spawnPie();
        // Zorluk: Skor arttıkça hızlansın
        if(score > 0 && score % 10 === 0) dropSpeed += 0.05;
    }

    // 3. Turtaları Güncelle
    for (let i = 0; i < pies.length; i++) {
        let p = pies[i];
        p.y += p.speed;

        // Çarpışma Kontrolü (AABB Yöntemi)
        if (
            p.x < player.x + player.width &&
            p.x + p.size > player.x &&
            p.y < player.y + player.height &&
            p.y + p.size > player.y
        ) {
            // Yakalandı!
            score++;
            scoreElement.innerText = "Skor: " + score;
            pies.splice(i, 1); // Diziden sil
            i--;
        }
        // Yere çarptı mı? (Oyun Biter)
        else if (p.y > canvas.height - 40) { // Zemin seviyesi
            gameOver();
        }
    }

    frames++;
    requestAnimationFrame(draw);
    requestAnimationFrame(update);
}

function draw() {
    if (!gameRunning) return;

    // A. Arkaplanı Çiz
    if (bgImg.complete && bgImg.naturalWidth !== 0) {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#87CEEB"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // B. Zemini Çiz
    if (groundImg.complete && groundImg.naturalWidth !== 0) {
        ctx.drawImage(groundImg, 0, canvas.height - 50, canvas.width, 50);
    } else {
        ctx.fillStyle = "#4CAF50"; ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
    }

    // C. Karakteri Çiz
    if (playerImg.complete && playerImg.naturalWidth !== 0) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    } else {
        ctx.fillStyle = "red"; ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // D. Turtaları Çiz
    for (let p of pies) {
        if (pieImg.complete && pieImg.naturalWidth !== 0) {
            ctx.drawImage(pieImg, p.x, p.y, p.size, p.size);
        } else {
            ctx.fillStyle = "orange"; ctx.fillRect(p.x, p.y, p.size, p.size);
        }
    }
}

function gameOver() {
    gameRunning = false;
    gameOverScreen.style.display = 'block';
    finalScoreElement.innerText = "Skorun: " + score;
}

// Global Reset Fonksiyonu
window.resetGame = function() {
    score = 0;
    frames = 0;
    dropSpeed = 5;
    pies = [];
    scoreElement.innerText = "Skor: 0";
    gameOverScreen.style.display = 'none';
    gameRunning = true;
    requestAnimationFrame(draw);
    update();
}

// Başlat
update();