// MAFIA STREETS - Canvas RPG Game
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game dimensions
const W = 800, H = 600;

// Player
let player = {
    x: W/2,
    y: H/2,
    radius: 16,
    health: 100,
    maxHealth: 100,
    speed: 4,
    invincibleFrames: 0,
    attackCooldown: 0,
    attackRange: 40
};

// Game state
let money = 0;
let kills = 0;
let score = 0;
let gameRunning = true;

// Enemies array
let enemies = [];

// Collectibles (money bags)
let collectibles = [];

// Attack effect (particles)
let attackEffects = [];

// Movement flags
const keys = {
    ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
    w: false, s: false, a: false, d: false
};

// Mouse position for attack direction
let mouseX = player.x, mouseY = player.y;

// ========== UTILITIES ==========
function random(min, max) {
    return Math.random() * (max - min) + min;
}

function distance(x1,y1,x2,y2) {
    const dx = x1-x2, dy = y1-y2;
    return Math.hypot(dx,dy);
}

// ========== SPAWN ENEMY ==========
function spawnEnemy() {
    let side = Math.floor(random(0,4));
    let x,y;
    if(side === 0) { x = random(20, W-20); y = -20; }
    else if(side === 1) { x = W+20; y = random(20, H-20); }
    else if(side === 2) { x = random(20, W-20); y = H+20; }
    else { x = -20; y = random(20, H-20); }
    
    enemies.push({
        x: x, y: y,
        radius: 14,
        health: 30,
        speed: 1.2,
        damage: 12,
        color: '#aa3333'
    });
}

// ========== SPAWN MONEY ==========
function spawnMoney(x,y) {
    collectibles.push({
        x: x, y: y,
        radius: 8,
        value: random(10, 30)
    });
}

// ========== ATTACK ==========
function attack(targetX, targetY) {
    if(!gameRunning) return;
    if(player.attackCooldown > 0) return;
    
    // Calculate direction to mouse/click
    let dx = targetX - player.x;
    let dy = targetY - player.y;
    let len = Math.hypot(dx,dy);
    if(len < 0.01) len = 1;
    let dirX = dx/len;
    let dirY = dy/len;
    
    // Attack effect
    attackEffects.push({
        x: player.x + dirX * 20,
        y: player.y + dirY * 20,
        radius: 18,
        life: 8
    });
    
    // Damage enemies in range
    let hit = false;
    for(let i=0; i<enemies.length; i++) {
        const e = enemies[i];
        const dist = distance(player.x, player.y, e.x, e.y);
        if(dist < player.attackRange + e.radius) {
            e.health -= 25;
            hit = true;
            if(e.health <= 0) {
                // kill enemy
                spawnMoney(e.x, e.y);
                enemies.splice(i,1);
                kills++;
                score += 50;
                i--;
            }
        }
    }
    if(hit) {
        // small score for hit
        score += 5;
    }
    
    player.attackCooldown = 18; // frames
}

// ========== UPDATE ==========
function update() {
    if(!gameRunning) return;
    
    // cooldowns
    if(player.invincibleFrames > 0) player.invincibleFrames--;
    if(player.attackCooldown > 0) player.attackCooldown--;
    
    // Player movement
    let moveX = 0, moveY = 0;
    if(keys.ArrowUp || keys.w) moveY -= 1;
    if(keys.ArrowDown || keys.s) moveY += 1;
    if(keys.ArrowLeft || keys.a) moveX -= 1;
    if(keys.ArrowRight || keys.d) moveX += 1;
    if(moveX !== 0 || moveY !== 0) {
        let len = Math.hypot(moveX,moveY);
        moveX = moveX/len * player.speed;
        moveY = moveY/len * player.speed;
    }
    let newX = player.x + moveX;
    let newY = player.y + moveY;
    // boundaries
    newX = Math.min(Math.max(newX, player.radius+5), W - player.radius-5);
    newY = Math.min(Math.max(newY, player.radius+5), H - player.radius-5);
    player.x = newX;
    player.y = newY;
    
    // enemies AI (chase)
    for(let i=0; i<enemies.length; i++) {
        const e = enemies[i];
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let dist = Math.hypot(dx,dy);
        if(dist > 0.1) {
            let move = e.speed;
            e.x += (dx/dist) * move;
            e.y += (dy/dist) * move;
        }
        // boundary clamp
        e.x = Math.min(Math.max(e.x, 5), W-5);
        e.y = Math.min(Math.max(e.y, 5), H-5);
        
        // collision with player
        if(distance(player.x,player.y, e.x,e.y) < player.radius + e.radius) {
            if(player.invincibleFrames <= 0 && gameRunning) {
                player.health -= e.damage;
                player.invincibleFrames = 25;
                if(player.health <= 0) {
                    player.health = 0;
                    gameRunning = false;
                    document.getElementById('finalScore').innerText = Math.floor(score);
                    document.getElementById('gameOverScreen').classList.remove('hidden');
                }
            }
        }
    }
    
    // collect money
    for(let i=0; i<collectibles.length; i++) {
        const c = collectibles[i];
        if(distance(player.x,player.y, c.x,c.y) < player.radius + c.radius) {
            money += Math.floor(c.value);
            score += Math.floor(c.value);
            collectibles.splice(i,1);
            i--;
        }
    }
    
    // enemy spawner (dynamic)
    if(enemies.length < 4 + Math.floor(kills/10)) {
        if(Math.random() < 0.02) spawnEnemy();
    }
    
    // UI update
    document.getElementById('health').innerText = player.health;
    document.getElementById('money').innerText = Math.floor(money);
    document.getElementById('kills').innerText = kills;
    document.getElementById('score').innerText = Math.floor(score);
    
    // attack effects lifetime
    for(let i=0; i<attackEffects.length; i++) {
        attackEffects[i].life--;
        if(attackEffects[i].life <= 0) {
            attackEffects.splice(i,1);
            i--;
        }
    }
}

// ========== DRAW ==========
function draw() {
    ctx.clearRect(0,0,W,H);
    
    // draw floor grid (mafia vibe)
    ctx.strokeStyle = '#333355';
    ctx.lineWidth = 0.5;
    for(let i=0; i<W+50; i+=50){
        ctx.beginPath();
        ctx.moveTo(i,0);
        ctx.lineTo(i,H);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0,i%H);
        ctx.lineTo(W,i%H);
        ctx.stroke();
    }
    
    // draw collectibles (money bags)
    for(let c of collectibles) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.radius, 0, Math.PI*2);
        ctx.fillStyle = '#ffcc44';
        ctx.fill();
        ctx.fillStyle = '#aa8833';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('💰', c.x-9, c.y+5);
    }
    
    // draw enemies
    for(let e of enemies) {
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, Math.PI*2);
        ctx.fillStyle = e.color;
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('👿', e.x-10, e.y+7);
        // health bar
        let hpPercent = e.health / 30;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(e.x-15, e.y-18, 30, 5);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(e.x-15, e.y-18, 30*hpPercent, 5);
    }
    
    // draw player (mafia guy)
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI*2);
    ctx.fillStyle = '#2a6f8f';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px monospace';
    ctx.fillText('🕴️', player.x-14, player.y+10);
    // invincibility blink
    if(player.invincibleFrames > 0 && (Math.floor(Date.now()/50)%2===0)) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius+3, 0, Math.PI*2);
        ctx.fillStyle = '#ffffffaa';
        ctx.fill();
    }
    
    // attack effects
    for(let a of attackEffects) {
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,100,0,${a.life/10})`;
        ctx.fill();
    }
    
    // attack range indicator
    if(player.attackCooldown > 0) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.attackRange, 0, Math.PI*2);
        ctx.strokeStyle = '#ff8844';
        ctx.lineWidth = 1;
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.attackRange, 0, Math.PI*2);
        ctx.strokeStyle = '#ff884488';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // mouse direction line
    let dx = mouseX - player.x;
    let dy = mouseY - player.y;
    let angle = Math.atan2(dy,dx);
    let tipX = player.x + Math.cos(angle)*player.attackRange;
    let tipY = player.y + Math.sin(angle)*player.attackRange;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(tipX, tipY);
    ctx.strokeStyle = '#ffaa55';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// ========== KEYBOARD/MOUSE HANDLERS ==========
function handleKeyDown(e) {
    let key = e.key;
    if(keys.hasOwnProperty(key)) keys[key] = true;
    if(key === ' ' || key === 'Space') {
        e.preventDefault();
        attack(mouseX, mouseY);
    }
    if(key === 'r' || key === 'R') {
        restartGame();
    }
}

function handleKeyUp(e) {
    let key = e.key;
    if(keys.hasOwnProperty(key)) keys[key] = false;
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let canvasX = (e.clientX - rect.left) * scaleX;
    let canvasY = (e.clientY - rect.top) * scaleY;
    canvasX = Math.min(Math.max(canvasX,0),W);
    canvasY = Math.min(Math.max(canvasY,0),H);
    mouseX = canvasX;
    mouseY = canvasY;
}

function handleCanvasClick(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clickX = (e.clientX - rect.left) * scaleX;
    let clickY = (e.clientY - rect.top) * scaleY;
    attack(clickX, clickY);
}

// restart function (global for button)
window.restartGame = function() {
    player = {
        x: W/2, y: H/2, radius: 16, health: 100, maxHealth: 100,
        speed: 4, invincibleFrames: 0, attackCooldown: 0, attackRange: 40
    };
    money = 0;
    kills = 0;
    score = 0;
    enemies = [];
    collectibles = [];
    attackEffects = [];
    gameRunning = true;
    document.getElementById('gameOverScreen').classList.add('hidden');
    // initial enemies
    for(let i=0;i<3;i++) spawnEnemy();
};

// ========== INIT & GAME LOOP ==========
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// set event listeners
window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('click', handleCanvasClick);

// start game
restartGame();
gameLoop();
