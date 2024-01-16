const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Load images
const playerImg = new Image();
playerImg.src = 'user.png'; // Path to player image
const redBulletImg = new Image();
redBulletImg.src = 'c1.png'; // Path to red bullet image
const purpleBulletImg = new Image();
purpleBulletImg.src = 'c2.png'; // Path to purple bullet image
const orangeBulletImg = new Image();
orangeBulletImg.src = 'c4.png'; // Path to orange bullet image

const player = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    width: 20,
    height: 20,
    speed: 5,
    lives: 3
};

let bullets = [];
let enemyBullets = [];
let enemies = [];
let currentWave = 1;
const totalWaves = 5;
let enemySpeed = 1; // Initial enemy speed
const bulletSpeed = 10;
const enemyBulletSpeed = 2;
let lastEnemyShotTime = 0;
const enemyShotInterval = 2000; // 2 seconds

let gameOver = false;
let gameWon = false;

let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false
};

document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('click', handleMouseClick);

function spawnEnemies() {
    const numEnemies = 5 * currentWave; 
    enemies = [];
    for (let i = 0; i < numEnemies; i++) {
        let enemy;
        let overlap;
        let type = Math.random() < 0.5 ? "red" : (Math.random() < 0.5 ? "purple" : "orange"); // Randomly select enemy type
        do {
            overlap = false;
            enemy = {
                x: Math.random() * (canvas.width - 20),
                y: -30,
                width: 20,
                height: 20,
                type: type // Add type property to each enemy
            };
            for (let j = 0; j < enemies.length; j++) {
                let other = enemies[j];
                if (Math.abs(enemy.x - other.x) < enemy.width && Math.abs(enemy.y - other.y) < enemy.height) {
                    overlap = true;
                    break;
                }
            }
        } while (overlap);
        enemies.push(enemy);
    }
}

spawnEnemies();

function handleKeyDown(e) {
    if (keys[e.key] !== undefined) {
        keys[e.key] = true;
    }
}

function handleKeyUp(e) {
    if (keys[e.key] !== undefined) {
        keys[e.key] = false;
    }
}

function handleMouseClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dx = mouseX - player.x;
    const dy = mouseY - player.y;
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    const bulletVx = (dx / magnitude) * bulletSpeed;
    const bulletVy = (dy / magnitude) * bulletSpeed;

    bullets.push({ x

: player.x, y: player.y, vx: bulletVx, vy: bulletVy });
}

function handleInput() {
    if (keys.ArrowUp) player.y -= player.speed;
    if (keys.ArrowDown) player.y += player.speed;
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
}

function checkPlayerEnemyCollision() {
    enemies.forEach((enemy, index) => {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            // Deduct more lives based on enemy type
            player.lives -= enemy.type === "red" ? 1 : (enemy.type === "purple" ? 2 : 3);
            enemies.splice(index, 1); // Remove the enemy that collided with the player
            if (player.lives <= 0) {
                gameOver = true;
                alert("Game Over!");
            }
        }
    });
}

function checkPlayerHit() {
    enemyBullets = enemyBullets.filter((bullet, index) => {
        if (bullet.x > player.x && bullet.x < player.x + player.width &&
            bullet.y > player.y && bullet.y < player.y + player.height) {
            player.lives -= 1;
            return false; // Remove bullet
        }
        return true;
    });

    if (player.lives <= 0) {
        gameOver = true;
        alert("Game Over!");
    }
}

function updateGame() {
    if (gameOver) {
        return;
    }

    // Move bullets
    bullets.forEach(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
    });

    const now = Date.now();
    enemies.forEach(enemy => {
        // Move towards player
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        enemy.x += (dx / magnitude) * enemySpeed;
        enemy.y += (dy / magnitude) * enemySpeed;
    
        // Enemy shooting
        if (now - lastEnemyShotTime > enemyShotInterval) {
            lastEnemyShotTime = now;
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const magnitude = Math.sqrt(dx * dx + dy * dy);
            if (magnitude !== 0) { // Ensure we don't divide by zero
                const normalizedDx = dx / magnitude;
                const normalizedDy = dy / magnitude;
                enemyBullets.push({
                    x: enemy.x + enemy.width / 2, // Shoot from the center of the enemy
                    y: enemy.y + enemy.height / 2,
                    vx: normalizedDx * enemyBulletSpeed,
                    vy: normalizedDy * enemyBulletSpeed
                });
            }
        }
    });
    

    // Bullet collision detection
    bullets = bullets.filter(bullet => {
        let hit = false;
        enemies = enemies.filter(enemy => {
            if (bullet.x > enemy.x && bullet.x < enemy.x + enemy.width && bullet.y > enemy.y && bullet.y < enemy.y + enemy.height) {
                hit = true;
                return false; // Remove enemy if hit
            }
            return true;
        });
        return !hit;
    });

    // Check if wave is complete
    if (enemies.length === 0) {
        if (currentWave === totalWaves) {
            gameWon = true;
            return;
        } else {
            currentWave += 1;
            enemySpeed += 0.5; // Increase enemy speed each wave
            spawnEnemies();
        }
    }

    checkPlayerHit();
    checkPlayerEnemyCollision();
}

const heartImage = new Image();
heartImage.src="heart.png";
heartImage.onload = function() {
    gameLoop();
};
    
function drawLives() {
    for (let i = 0; i < player.lives; i++) {
        ctx.drawImage(heartImage, canvas.width - 30 * (i + 1), 10, 24, 24);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
        ctx.fillStyle = 'red';
        ctx.font = '48px Arial';
        ctx.fillText("Game Over!", canvas.width / 2 - 120, canvas.height / 2);
        return;
    }

    if (gameWon) {
        ctx.fillStyle = 'green';
        ctx.font = '48px Arial';
        ctx.fillText("You Win!", canvas.width / 2 - 100, canvas.height / 2);
        return;
    }

    if (player.lives > 0) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    }

    bullets.forEach(bullet => {
        let bulletImg;
        switch (bullet.type) {
            case 'red': bulletImg = redBulletImg; break;
            case 'purple': bulletImg = purpleBulletImg; break;
            case 'orange': bulletImg = orangeBulletImg; break;
            default: bulletImg = redBulletImg; // Default to red if no type is set
        }
        ctx.drawImage(bulletImg, bullet.x, bullet.y, 10, 10); // Adjust the size as needed
    });

    // Draw player
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // Draw bullets
    ctx.fillStyle = 'green';
    bullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw enemy bullets
    ctx.fillStyle = 'black';
    enemyBullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fill();
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
    });

    // Draw enemies
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.type;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
    });

    if (player.lives > 0) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // Draw player lives
    drawLives();
}

function gameLoop() {
    handleInput();
    updateGame();
    draw();
    if (!gameOver && !gameWon) {
        requestAnimationFrame(gameLoop);
    }
}

Promise.all([
    playerImg.decode(),
    redBulletImg.decode(),
    purpleBulletImg.decode(),
    orangeBulletImg.decode()
]).then(() => {
    gameLoop(); // Start the game loop after all images are loaded
}).catch(error => {
    console.error('Error loading images', error);
});