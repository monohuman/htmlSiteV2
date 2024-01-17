// setup canvas and images
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let playerImg, redBulletImg;

// load images function
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to load image at ' + src));
        img.src = src;
    });
}

//when images are loaded start the game loop
Promise.all([
    loadImage('user.png'),
    loadImage('blue_bullet.png'),
    loadImage('c1.png'),
    loadImage('c4.png'),
    loadImage('c2.png'),
]).then(images => {
    [playerImg, redBulletImg, redEnemyImg, yellowEnemyImg, purpleEnemyImg] = images;
    gameLoop();
}).catch(error => {
    console.error('Error loading images:', error);
});

// player details
const player = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    width: 20,
    height: 20,
    speed: 5,
    lives: 3
};

// setting a bunch of variables
let bullets = [];
let enemyBullets = [];
let enemies = [];
let currentWave = 1;
const totalWaves = 5;
let enemySpeed = 1;
const bulletSpeed = 10;
const enemyBulletSpeed = 2;
let lastEnemyShotTime = 0;
const enemyShotInterval = 2000;

// make sure the game doesnt end as it starts
let gameOver = false;
let gameWon = false;

// for movement
let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false,
};

// event listeners to check when a key is pressed, a key isnt pressed, or mouse is clicked
document.addEventListener('keydown', handleKeyDown);
document.addEventListener('keyup', handleKeyUp);
canvas.addEventListener('click', handleMouseClick);

// this was very annoying to code
// spawns enemies
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

// handles keypresses
function handleKeyDown(e) {
    if (keys[e.key] !== undefined) {
        keys[e.key] = true;
    }
}

// handles not keypresses
function handleKeyUp(e) {
    if (keys[e.key] !== undefined) {
        keys[e.key] = false;
    }
}

// what do you think this does
// i didnt enjoy learning velocity in javascript
function handleMouseClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dx = mouseX - (player.x + player.width / 2);
    const dy = mouseY - (player.y + player.height / 2);
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    const bulletVx = (dx / magnitude) * bulletSpeed;
    const bulletVy = (dy / magnitude) * bulletSpeed;

    bullets.push({
        x: player.x + player.width / 2,
        y: player.y + player.height / 2,
        vx: bulletVx,
        vy: bulletVy,
        type: 'red'
    });
}

//handle keypresses
function handleInput() {
    if (keys.ArrowUp || keys.w) player.y -= player.speed;
    if (keys.ArrowDown || keys.s) player.y += player.speed;
    if (keys.ArrowLeft || keys.a) player.x -= player.speed;
    if (keys.ArrowRight || keys.d) player.x += player.speed;
}

//check if players touch the enemy
function checkPlayerEnemyCollision() {
    enemies.forEach((enemy, index) => {
        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            // deduct more lives due to color (now images but it used to be colors)
            player.lives -= enemy.type === "red" ? 1 : (enemy.type === "purple" ? 2 : 3);
            enemies.splice(index, 1); //remove enemies that touch the player
            if (player.lives <= 0) {
                gameOver = true;
            }
        }
    });
}

//check if the player is hit by a bullet
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

// make the game actually work
// i didnt like writing this function 2/10
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
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        enemy.x += (dx / magnitude) * enemySpeed;
        enemy.y += (dy / magnitude) * enemySpeed;
    
        // enemy shooting
        // made me very angry
        if (now - lastEnemyShotTime > enemyShotInterval) {
            lastEnemyShotTime = now;
            const bulletDx = player.x - (enemy.x + enemy.width / 2);
            const bulletDy = player.y - (enemy.y + enemy.height / 2);
            const bulletMagnitude = Math.sqrt(bulletDx * bulletDx + bulletDy * bulletDy);
            if (bulletMagnitude !== 0) {
                const bulletVx = (bulletDx / bulletMagnitude) * enemyBulletSpeed;
                const bulletVy = (bulletDy / bulletMagnitude) * enemyBulletSpeed;
                enemyBullets.push({
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y + enemy.height / 2,
                    vx: bulletVx,
                    vy: bulletVy
                });
            }
        }
    });

    // bullet collision detection
    bullets = bullets.filter(bullet => {
        let hit = false;
        enemies = enemies.filter(enemy => {
            if (bullet.x > enemy.x && bullet.x < enemy.x + enemy.width && bullet.y > enemy.y && bullet.y < enemy.y + enemy.height) {
                hit = true;
                return false; // remove enemy if hit (hitboxes arent perfected)
            }
            return true;
        });
        return !hit;
    });

    // check if wave is complete
    if (enemies.length === 0) {
        if (currentWave === totalWaves) {
            gameWon = true;
            return;
        } else {
            currentWave += 1;
            enemySpeed += 0.5; // increase enemy speed each wave
            spawnEnemies();
        }
    }

    checkPlayerHit();
    checkPlayerEnemyCollision();
}

//hearts
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

//drawing player, enemies, text
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameOver) {
        ctx.fillStyle = '#e86060';
        ctx.font = '48px Helvetica';
        ctx.fillText("Game Over!", canvas.width / 2 - 120, canvas.height / 2);
        canvas.style.backgroundColor = "black";
        ctx.shadowColor = "#e86060";
        ctx.shadowBlur = 15;
        return;
    }

    if (gameWon) {
        ctx.fillStyle = '#73d164';
        ctx.font = '48px Helvetica';
        ctx.fillText("You Win!", canvas.width / 2 - 100, canvas.height / 2);
        canvas.style.backgroundColor = "black";
        ctx.shadowColor = "#73d164";
        ctx.shadowBlur = 15;
        return;
    }

    // draw player
    if (player.lives > 0) {
        ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
    }

    // draw bullets
    bullets.forEach(bullet => {
        let bulletImg;
        switch (bullet.type) {
            case 'red': bulletImg = redBulletImg; break;
            default: bulletImg = redBulletImg;
        }

        ctx.drawImage(bulletImg, bullet.x, bullet.y, 10, 10); // Adjust size as needed
    });

    // draw enemy bullets
    ctx.fillStyle = 'black';
    enemyBullets.forEach(bullet => {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
        ctx.fill();

        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
    });

    // draw enemies
    enemies.forEach(enemy => {
        let enemyImg;
        switch (enemy.type) {
            case 'red': enemyImg = redEnemyImg; break;
            case 'purple': enemyImg = purpleEnemyImg; break;
            case 'yellow': enemyImg = yellowEnemyImg; break;
            default: enemyImg = redEnemyImg; // Default image if no type
        }
        ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
    });

    // draw player lives
    drawLives();
}

// gameloop which runs all necessary functions
function gameLoop() {
    handleInput();
    updateGame();
    draw();
    if (!gameOver && !gameWon) {
        requestAnimationFrame(gameLoop);
    }
}