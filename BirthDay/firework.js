// 瀏覽器兼容的 requestAnimationFrame 方法
window.requestAnimationFrame = (function () {
    return (
        window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        }
    );
})();

// 全局變數
let fireworks = [];
let particles = [];
let hue = 120;
let limiterTotal = 5;
let limiterTick = 0;
let timerTotal = 5;
let timerTick = 0;
let maxFireworks = 1;
let isFirstFirework = true; // 標記是否是第一個煙火
let mousedown = false;
let mx, my;
let showText = false; // 控制文字顯示
let textOpacity = 1; // 控制文字的透明度，實現漸變消失
let displayText = "祝妳生日快樂🎂🎊"; // 控制顯示的文字

// 獲取畫布元素
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let cw = window.innerWidth;
let ch = window.innerHeight;
canvas.width = cw;
canvas.height = ch;

// 音樂播放邏輯
let music;
let fireworksStarted = false;

// 調整 Canvas 尺寸的函數
function resizeCanvas() {
    cw = window.innerWidth;
    ch = window.innerHeight;
    canvas.width = cw;
    canvas.height = ch;
}

// 當視窗大小改變時，調整 Canvas 尺寸
window.addEventListener('resize', resizeCanvas);

// 初始化時設置 Canvas 尺寸
resizeCanvas();

// 初始化動畫和音樂播放
function startAnimation() {
    const music1 = document.getElementById("background-music-1");
    const music2 = document.getElementById("background-music-2");
    music1.volume = 0.35
    music2.volume = 1

    music1.play();
    music2.play();

    fireworksStarted = true;
    loop();

    // 移除點擊事件以防止重複觸發
     canvas.removeEventListenerEventListener('click', startAnimation);
}


// 隨機數函數
function random(min, max) {
    return Math.random() * (max - min) + min;
}

// 計算兩點間距離
function calculateDistance(p1x, p1y, p2x, p2y) {
    const xDistance = p1x - p2x;
    const yDistance = p1y - p2y;
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

// 煙火類
function Firework(sx, sy, tx, ty, slow = false) {
    this.x = sx;
    this.y = sy;
    this.sx = sx;
    this.sy = sy;
    this.tx = tx;
    this.ty = ty;
    this.distanceToTarget = calculateDistance(sx, sy, tx, ty);
    this.distanceTraveled = 0;
    this.coordinates = [];
    this.coordinateCount = 5;
    while (this.coordinateCount--) {
        this.coordinates.push([this.x, this.y]);
    }
    this.angle = Math.atan2(ty - sy, tx - sx);
    this.speed = slow ? 0.5 : 1.5; // 第一個煙火速度更慢，後續正常
    this.acceleration = slow ? 1.01 : 1.03; // 第一個煙火加速更輕微，後續正常
    this.brightness = random(50, 70);
    this.targetRadius = 1;
}

// 更新煙火狀態
Firework.prototype.update = function (index) {
    this.coordinates.pop();
    this.coordinates.unshift([this.x, this.y]);

    if (this.targetRadius < 8) {
        this.targetRadius += 0.3;
    } else {
        this.targetRadius = 1;
    }

    this.speed *= this.acceleration;
    const vx = Math.cos(this.angle) * this.speed;
    const vy = Math.sin(this.angle) * this.speed;
    this.distanceTraveled = calculateDistance(this.sx, this.sy, this.x + vx, this.y + vy);

    if (this.distanceTraveled >= this.distanceToTarget) {
        createParticles(this.tx, this.ty);
        fireworks.splice(index, 1);
    } else {
        this.x += vx;
        this.y += vy;
    }
};

// 繪製煙火
Firework.prototype.draw = function () {
    ctx.beginPath();
    ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = `hsl(${hue}, 100%, ${this.brightness}%)`;
    ctx.stroke();
};

// 粒子類
function Particle(x, y) {
    this.x = x;
    this.y = y;
    this.coordinates = [];
    this.coordinateCount = 5;
    while (this.coordinateCount--) {
        this.coordinates.push([this.x, this.y]);
    }
    this.angle = random(0, Math.PI * 2);
    this.speed = random(1, 10);
    this.friction = 0.97;
    this.gravity = 0.5;
    this.hue = random(hue - 50, hue + 50);
    this.brightness = random(50, 80);
    this.alpha = 1;
    this.decay = random(0.01, 0.02);
}

// 更新粒子狀態
Particle.prototype.update = function (index) {
    this.coordinates.pop();
    this.coordinates.unshift([this.x, this.y]);
    this.speed *= this.friction;
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed + this.gravity;
    this.alpha -= this.decay;

    if (this.alpha <= this.decay) {
        particles.splice(index, 1);
    }
};

// 繪製粒子
Particle.prototype.draw = function () {
    ctx.beginPath();
    ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
    ctx.lineTo(this.x, this.y);
    ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
    ctx.stroke();
};

// 創建粒子群
function createParticles(x, y) {
    let particleCount = 200;
    while (particleCount--) {
        particles.push(new Particle(x, y));
    }
}

// 繪製文字
function renderText() {
    const fontSize = Math.min(cw, ch) * 0.08; // 動態字體大小
    ctx.fillStyle = `rgba(255, 255, 255, ${textOpacity})`; // 使用透明度實現漸變消失
    ctx.font = "80px 'DFKai-SB' , Times New Roman"; // 修改字體，粉圓體對應標準字體名稱可能不同
    ctx.textAlign = "center"; // 文字居中對齊
    ctx.fillText(displayText, cw / 2, ch / 2 + 150); // 將文字稍微向下
}

// 動畫主循環
function loop() {
    requestAnimationFrame(loop);

    hue = random(0, 360);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, cw, ch);

    ctx.globalCompositeOperation = 'lighter';

    let i = fireworks.length;
    while (i--) {
        fireworks[i].draw();
        fireworks[i].update(i);
    }

    i = particles.length;
    while (i--) {
        particles[i].draw();
        particles[i].update(i);
    }

     // 在動畫啟動後才顯示文字
     if (fireworksStarted) {
        renderText();
    }

    // 確保煙火在 5 秒後才開始
    if (fireworksStarted && timerTick >= timerTotal) {
        let fireworkCount = 5; // 每次放 5 顆煙火
        while (fireworkCount--) {
            // 隨機生成煙火發射位置
            let startX = random(0, cw); // 隨機生成 X 座標
            let startY = random(ch * 0.5, ch); // 隨機生成 Y 座標，使煙火能從下半區域發射
            if (isFirstFirework) {
                fireworks.push(new Firework(startX, startY, random(0, cw), random(0, ch / 2), true));
                isFirstFirework = false; // 只執行一次
            } else {
                fireworks.push(new Firework(startX, startY, random(0, cw), random(0, ch / 2)));
            }
        }
        timerTick = 0;
    } else {
        timerTick++;
    }

    // 文字漸變消失的效果
    if (textOpacity > 0) {
        textOpacity -= 0.001; // 減少透明度
    }
}

// 設定 5 秒後開始煙火
setTimeout(() => {
    fireworksStarted = true; // 5 秒後開始煙火
}, 2500);

// 設定 10 秒後更改文字
setTimeout(() => {
    displayText = "大學生活加油🔥"; // 10 秒後顯示
}, 20000);

// 設定文字消失過程
setTimeout(() => {
    textOpacity = 0.8; // 文字可見，並開始消失
}, 20000);

setTimeout(() => {
    displayText = "㊗️妳之後所有科目不會被當！"; // 20 秒後顯示
}, 30000);

setTimeout(() => {
    textOpacity = 1; // 文字可見，並開始消失
}, 30000);

setTimeout(() => {
    displayText = "㊗️妳天天開心"; // 30 秒後顯示
}, 40000);

setTimeout(() => {
    textOpacity = 0.8; // 文字可見，並開始消失
}, 45000);

setTimeout(() => {
    displayText = "㊗️19歲快樂！"; // 40 秒後顯示
}, 55000);

setTimeout(() => {
    displayText = "Happy Birthday, 劉宸羽! 🎊🎂"; // 50 秒後顯示
}, 65000);

setTimeout(() => {
    textOpacity = 10; // 文字可見，並開始消失
}, 65000);

// 啟動動畫
/*window.onload = function() {
    loadMusic();  // 延遲 5 秒播放音樂
    loop(); // 開始煙火動畫
};*/

window.onload = function () {
    alert("點擊畫面會有驚喜 🎉");
    canvas.addEventListener('click', startAnimation);
}
