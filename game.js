// MAFIA STREETS - Fixed Version
(function() {
    // Get canvas and context
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Game dimensions
    const W = 800;
    const H = 600;
    
    // Player object
    let player = {
        x: W/2,
        y: H/2,
        radius: 16,
        health: 100,
        maxHealth: 100,
        speed: 4,
        invincibleFrames: 0,
        attackCooldown: 0,
        attackRange: 45
    };
    
    // Game state
    let money = 0;
    let kills = 0;
    let score = 0;
    let gameRunning = true;
    
    // Dynamic arrays
    let enemies = [];
    let collectibles = [];
    let attackEffects = [];
    
    // Movement flags
    const keys = {
        ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
        w: false, s: false, a: false, d: false
    };
    
    // Mouse position
    let mouseX = player.x;
    let mouseY = player.y;
    
    // Helper functions
    function random(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    function distance(x1, y1, x2, y2) {
        const dx = x1 - x2;
        const dy = y1 - y2;
        return Math.sqrt(dx*dx + dy*dy);
    }
    
    // Spawn enemy at edge
    function spawnEnemy() {
        let side = Math.floor(random(0, 4));
        let x, y;
        if (side === 0) { x = random(30, W-30); y = -20; }
        else if (side === 1) { x = W+20; y = random(30, H-30); }
        else if (side === 2) { x = random(30, W-30); y = H+20; }
        else { x = -20; y = random(30, H-30); }
        
        enemies.push({
            x: x, y: y,
            radius: 14,
            health: 30,
            maxHealth: 30,
            speed: 1.2,
            damage: 10,
            color: '#aa3333'
        });
    }
    
    // Spawn money bag
    function spawnMoney(x, y) {
        collectibles.push({
            x: x, y: y,
            radius: 8,
            value: Math.floor(random(10, 30))
        });
    }
    
    // Attack towards target (mouse/click)
    function attack(targetX, targetY) {
        if (!gameRunning) return;
        if (player.attackCooldown > 0) return;
        
        // Direction vector
        let dx = targetX - player.x;
        let dy = targetY - player.y;
        let len = Math.hypot(dx, dy);
        if (len < 0.01) len = 1;
        let dirX = dx / len;
        let dirY = dy / len;
        
        // Attack effect
        attackEffects.push({
            x: player.x + dirX * 22,
            y: player.y + dirY * 22,
            radius: 18,
            life: 8
        });
        
        // Damage enemies in range
        let hit = false;
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            const dist = distance(player.x, player.y, e.x, e.y);
            if (dist < player.attackRange + e.radius) {
                e.health -= 25;
                hit = true;
                if (e.health <= 0) {
                    spawnMoney(e.x, e.y);
                    enemies.splice(i, 1);
                    kills++;
                    score += 50;
                    i--;
                }
            }
        }
        if (hit) score += 5;
        
        player.attackCooldown = 18;
    }
    
    // Update game logic
    function update() {
        if (!gameRunning) return;
        
        // Cooldowns
        if (player.invincibleFrames > 0) player.invincibleFrames--;
        if (player.attackCooldown > 0) player.attackCooldown--;
        
        // Movement
        let moveX = 0, moveY = 0;
        if (keys.ArrowUp || keys.w) moveY -= 1;
        if (keys.ArrowDown || keys.s) moveY += 1;
        if (keys.ArrowLeft || keys.a) moveX -= 1;
        if (keys.ArrowRight || keys.d) moveX += 1;
        if (moveX !== 0 || moveY !== 0) {
            const len = Math.hypot(moveX, moveY);
            moveX = moveX / len * player.speed;
            moveY = moveY / len * player.speed;
        }
        let newX = player.x + moveX;
        let newY = player.y + moveY;
        newX = Math.min(Math.max(newX, player.radius + 5), W - player.radius - 5);
        newY = Math.min(Math.max(newY, player.radius + 5), H - player.radius - 5);
        player.x = newX;
        player.y = newY;
        
        // Enemy AI (chase player)
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            const dx = player.x - e.x;
            const dy = player.y - e.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0.1) {
                const move = e.speed;
                e.x += (dx / dist) * move;
                e.y += (dy / dist) * move;
            }
            // Boundary
            e.x = Math.min(Math.max(e.x, 10), W - 10);
            e.y = Math.min(Math.max(e.y, 10), H - 10);
            
            // Collision with player
            if (distance(player.x, player.y, e.x, e.y) < player.radius + e.radius) {
                if (player.invincibleFrames <= 0 && gameRunning) {
                    player.health -= e.damage;
                    player.invincibleFrames = 25;
                    if (player.health <= 0) {
                        player.health = 0;
                        gameRunning = false;
                        document.getElementById('finalScore').innerText = Math.floor(score);
                        document.getElementById('gameOverScreen').classList.remove('hidden');
                    }
                }
            }
        }
        
        // Collect money
        for (let i = 0; i < collectibles.length; i++) {
            const c = collectibles[i];
            if (distance(player.x, player.y, c.x, c.y) < player.radius + c.radius) {
                money += c.value;
                score += c.value;
                collectibles.splice(i, 1);
                i--;
            }
        }
        
        // Spawn enemies dynamically
        const targetEnemies = 4 + Math.floor(kills / 8);
        if (enemies.length < targetEnemies && enemies.length < 15) {
            if (Math.random() < 0.02) spawnEnemy();
        }
        
        // Update UI
        document.getElementById('health').innerHTML = Math.max(0, player.health);
        document.getElementById('money').innerHTML = Math.floor(money);
        document.getElementById('kills').innerHTML = kills;
        document.getElementById('score').innerHTML = Math.floor(score);
        
        // Attack effects lifetime
        for (let i = 0; i < attackEffects.length; i++) {
            attackEffects[i].life--;
            if (attackEffects[i].life <= 0) {
                attackEffects.splice(i, 1);
                i--;
            }
        }
    }
    
    // Drawing functions
    function draw() {
        // Clear canvas
        ctx.clearRect(0, 0, W, H);
        
        // Background grid
        ctx.strokeStyle = '#333355';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < W + 50; i += 50) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, H);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i % H);
            ctx.lineTo(W, i % H);
            ctx.stroke();
        }
        
        // Draw collectibles (money)
        for (let c of collectibles) {
            ctx.beginPath();
            ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#ffcc44';
            ctx.fill();
            ctx.fillStyle = '#aa8833';
            ctx.font = 'bold 14px monospace';
            ctx.fillText('💰', c.x - 9, c.y + 5);
        }
        
        // Draw enemies
        for (let e of enemies) {
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
            ctx.fillStyle = e.color;
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 16px monospace';
            ctx.fillText('👿', e.x - 10, e.y + 7);
            // Health bar
            const hpPercent = e.health / e.maxHealth;
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(e.x - 15, e.y - 18, 30, 5);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(e.x - 15, e.y - 18, 30 * hpPercent, 5);
        }
        
        // Draw player
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#2a6f8f';
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px monospace';
        ctx.fillText('🕴️', player.x - 14, player.y + 10);
        
        // Invincibility blink
        if (player.invincibleFrames > 0 && (Math.floor(Date.now() / 50) % 2 === 0)) {
            ctx.beginPath();
            ctx.arc(player.x, player.y, player.radius + 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffffaa';
            ctx.fill();
        }
        
        // Attack effects
        for (let a of attackEffects) {
            ctx.beginPath();
            ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 100, 0, ${a.life / 10})`;
            ctx.fill();
        }
        
        // Attack range indicator
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.attackRange, 0, Math.PI * 2);
        ctx.strokeStyle = player.attackCooldown > 0 ? '#ff8844' : '#ff884488';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        // Direction line to mouse
        const dx = mouseX - player.x;
        const dy = mouseY - player.y;
        const angle = Math.atan2(dy, dx);
        const tipX = player.x + Math.cos(angle) * player.attackRange;
        const tipY = player.y + Math.sin(angle) * player.attackRange;
        ctx.beginPath();
        ctx.moveTo(player.x, player.y);
        ctx.lineTo(tipX, tipY);
        ctx.strokeStyle = '#ffaa55';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    
    // Animation loop
    function gameLoop() {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
    
    // ========== EVENT HANDLERS ==========
    function handleKeyDown(e) {
        const key = e.key;
        if (keys.hasOwnProperty(key)) {
            keys[key] = true;
            e.preventDefault();
        }
        if (key === ' ' || key === 'Space') {
            e.preventDefault();
            attack(mouseX, mouseY);
        }
        if (key === 'r' || key === 'R') {
            restartGame();
        }
    }
    
    function handleKeyUp(e) {
        const key = e.key;
        if (keys.hasOwnProperty(key)) {
            keys[key] = false;
            e.preventDefault();
        }
    }
    
    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let canvasX = (e.clientX - rect.left) * scaleX;
        let canvasY = (e.clientY - rect.top) * scaleY;
        canvasX = Math.min(Math.max(canvasX, 0), W);
        canvasY = Math.min(Math.max(canvasY, 0), H);
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
    
    // Restart function (global for button)
    window.restartGame = function() {
        // Reset player
        player = {
            x: W/2,
            y: H/2,
            radius: 16,
            health: 100,
            maxHealth: 100,
            speed: 4,
            invincibleFrames: 0,
            attackCooldown: 0,
            attackRange: 45
        };
        money = 0;
        kills = 0;
        score = 0;
        gameRunning = true;
        enemies = [];
        collectibles = [];
        attackEffects = [];
        
        // Spawn initial enemies
        for (let i = 0; i < 3; i++) {
            spawnEnemy();
        }
        
        // Hide game over screen
        document.getElementById('gameOverScreen').classList.add('hidden');
        
        // Update UI
        document.getElementById('health').innerHTML = 100;
        document.getElementById('money').innerHTML = 0;
        document.getElementById('kills').innerHTML = 0;
        document.getElementById('score').innerHTML = 0;
    };
    
    // Register events
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleCanvasClick);
    
    // Start game
    restartGame();
    gameLoop();
})();
