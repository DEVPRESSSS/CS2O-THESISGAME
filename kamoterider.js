// Get the canvas element
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 600;

// Trap Game Variables
const HIGH_SCORE_THRESHOLD = 100;
const SPECIAL_BEHAVIOR_CHANCE = 0.3; // 30% chance for special behavior
const SPEED_BOOST_MULTIPLIER = 1.5;
const SIDE_MOVE_SPEED = 2;

// Difficulty game variables
let baseEnemySpeed = 4;
let baseRoadSpeed = 2;
let difficultyInterval = 500; // Increase difficulty every 500 points

// Vehicle dimensions and player position
let carWidth = 30;                  // Narrow motorcycle width
let carHeight = 60;                 // Shorter motorcycle height
let carX = canvas.width / 2 - carWidth / 2;  // Centered horizontally
let carY = canvas.height - 70;      // Adjusted vertical position
let carSpeed = 3;

let enemyCars = [];
let enemyCarWidth = 50;             // Wider car width
let enemyCarHeight = 100;           // Taller car height

let keys = {};
let score = 0;
let gameActive = false;

// Load images
const road = new Image();
road.src = "images/cropRoad.png";
const car = new Image();
car.src = "images/Motorcycle.png";
const enemyCar = new Image();
enemyCar.src = "images/EnemyCar2.png";

// UI Elements
const startScreen = document.getElementById("startScreen");
const startButton = document.getElementById("startButton");
const scoreBox = document.getElementById("scoreBox");
const scoreDisplay = document.getElementById("score");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScore = document.getElementById("finalScore");
const restartButton = document.getElementById("restartButton");

// Road background variables
let roadY = 0;
let roadSpeed = baseRoadSpeed;

// Lane definitions and spacing
const LANES = [40, 125, 220, 310]; // X positions for lanes
const MIN_VERTICAL_DISTANCE = 200; // Minimum vertical space between enemy cars

// Unified overlap-check function (checks for same lane and vertical spacing)
function wouldOverlap(newX, newY) {
    const laneIndex = LANES.indexOf(newX);
    if (laneIndex === -1) return false;
    return enemyCars.some(enemy => {
        // If the enemy is lane changing and nearly aligned with the target, use target lane
        let enemyLane = enemy.lane;
        if (enemy.behavior === 'laneChange' && Math.abs(enemy.x - LANES[enemy.targetLane]) < SIDE_MOVE_SPEED) {
            enemyLane = enemy.targetLane;
        }
        if (enemyLane === laneIndex) {
            return Math.abs(newY - enemy.y) < MIN_VERTICAL_DISTANCE;
        }
        return false;
    });
}

// Generate a safe position for an enemy car to avoid overlapping
function generateSafePosition() {
    let attempts = 0;
    const maxAttempts = 50;
    let newX, newY;
    do {
        // Select a random lane
        const laneIndex = Math.floor(Math.random() * LANES.length);
        newX = LANES[laneIndex];
        // Position the enemy off-screen above with some randomness
        newY = Math.random() * -canvas.height - 200;
        attempts++;
    } while (wouldOverlap(newX, newY) && attempts < maxAttempts);

    return { x: newX, y: newY, lane: LANES.indexOf(newX) };
}

// Draw functions
function drawRoad() {
    ctx.drawImage(road, 0, roadY, canvas.width, canvas.height);
    ctx.drawImage(road, 0, roadY - canvas.height, canvas.width, canvas.height);
    roadY += roadSpeed;
    if (roadY >= canvas.height) {
        roadY = 0;
    }
}

function drawCar() {
    ctx.drawImage(car, carX, carY, carWidth, carHeight);
}

function drawEnemyCars() {
    enemyCars.forEach(enemy => {
        ctx.drawImage(enemyCar, enemy.x, enemy.y, enemyCarWidth, enemyCarHeight);
    });
}

// Update enemy difficulty and special behavior
function updateDifficulty(currentScore) {
    if (currentScore >= HIGH_SCORE_THRESHOLD) {
        enemyCars.forEach(enemy => {
            if (enemy.behavior === 'normal' && Math.random() < SPECIAL_BEHAVIOR_CHANCE) {
                // Randomly decide between lane change and speed boost
                if (Math.random() < 0.5) {
                    // Lane change: choose any lane different from the current one
                    const currentLaneIndex = enemy.lane;
                    const possibleLanes = LANES
                        .map((pos, index) => index)
                        .filter(index => index !== currentLaneIndex);
                    if (possibleLanes.length > 0) {
                        enemy.behavior = 'laneChange';
                        enemy.targetLane = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
                    }
                } else {
                    // Speed boost
                    enemy.behavior = 'speedBoost';
                    enemy.speed = baseEnemySpeed * SPEED_BOOST_MULTIPLIER;
                }
            }
        });
    }
}

// Collision detection between the player and enemy cars
function detectCollision() {
    const paddingX = 4;
    const paddingY = 5;
    return enemyCars.some(enemy => (
        carX + paddingX < enemy.x + enemyCarWidth - paddingX &&
        carX + carWidth - paddingX > enemy.x + paddingX &&
        carY + paddingY < enemy.y + enemyCarHeight - paddingY &&
        carY + carHeight - paddingY > enemy.y
    ));
}

// After updating enemy positions, adjust any that are too close in the same lane
function resolveEnemyOverlaps() {
    enemyCars.forEach((enemy, i) => {
        enemyCars.forEach((other, j) => {
            if (i !== j && enemy.lane === other.lane) {
                if (Math.abs(enemy.y - other.y) < MIN_VERTICAL_DISTANCE) {
                    // Push the lower enemy further down to ensure proper spacing
                    if (enemy.y > other.y) {
                        enemy.y = other.y + MIN_VERTICAL_DISTANCE;
                    } else {
                        other.y = enemy.y + MIN_VERTICAL_DISTANCE;
                    }
                }
            }
        });
    });
}

// Main animation loop
function animate() {
    if (!gameActive) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoad();
    drawCar();
    drawEnemyCars();

    // Update score and difficulty
    score += 0.1;
    scoreDisplay.innerText = Math.floor(score);
    updateDifficulty(score);

    // Player movement with keyboard input
    if (keys['w'] && carY > 0) carY -= carSpeed;
    if (keys['s'] && carY < canvas.height - carHeight) carY += carSpeed;
    if (keys['a'] && carX > 0) carX -= carSpeed;
    if (keys['d'] && carX < canvas.width - carWidth) carX += carSpeed;

    // Update enemy cars
    enemyCars.forEach(enemy => {
        // Vertical movement (use enemy.speed if set, else baseEnemySpeed)
        enemy.y += enemy.speed || baseEnemySpeed;

        // Handle lane-changing behavior
        if (enemy.behavior === 'laneChange') {
            const targetX = LANES[enemy.targetLane];
            const direction = targetX > enemy.x ? 1 : -1;
            enemy.x += SIDE_MOVE_SPEED * direction;
            if (Math.abs(enemy.x - targetX) < SIDE_MOVE_SPEED) {
                enemy.x = targetX;
                enemy.lane = enemy.targetLane;
                enemy.behavior = 'normal';
                enemy.speed = baseEnemySpeed; // Reset speed if it was boosted
            }
        }

        // Reset enemy if it goes off-screen
        if (enemy.y > canvas.height) {
            const newPosition = generateSafePosition();
            enemy.x = newPosition.x;
            enemy.y = newPosition.y;
            enemy.speed = baseEnemySpeed;
            enemy.behavior = 'normal';
            enemy.lane = newPosition.lane;
        }
    });

    // Resolve any overlapping enemy cars after movement
    resolveEnemyOverlaps();

    // Check for collision with player's car
    if (detectCollision()) {
        updateHighScore(Math.floor(score));
        gameOver();
    }

    requestAnimationFrame(animate);
}

// Game over function
function gameOver() {
    gameActive = false;
    gameOverScreen.classList.remove("hidden");
    finalScore.innerText = Math.floor(score);
}

// Start game function
function startGame() {
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    score = 0;
    scoreDisplay.innerText = score;
    carX = canvas.width / 2 - carWidth / 2;
    carY = canvas.height - 150;
    roadY = 0;

    // Reset enemy cars array and initialize them with safe spacing
    enemyCars = [];
    let currentY = -MIN_VERTICAL_DISTANCE * 2;
    for (let i = 0; i < 5; i++) {
        const laneIndex = Math.floor(Math.random() * LANES.length);
        const newEnemy = {
            x: LANES[laneIndex],
            y: currentY,
            speed: baseEnemySpeed,
            behavior: 'normal',
            lane: laneIndex,
            targetLane: laneIndex
        };
        enemyCars.push(newEnemy);
        currentY -= MIN_VERTICAL_DISTANCE + 100;
    }

    gameActive = true;
    animate();
}

// Update high score using localStorage
function updateHighScore(currentScore) {
    let highScore = localStorage.getItem('highScore');
    highScore = highScore ? parseInt(highScore) : 0;
    if (currentScore > highScore) {
        localStorage.setItem('highScore', currentScore);
        highScore = currentScore;
    }
    document.getElementById('highScoreDisplay').innerText = highScore;
}

function loadHighScore() {
    let highScore = localStorage.getItem('highScore');
    return highScore ? parseInt(highScore) : 0;
}

// Event listeners
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
window.addEventListener("keydown", (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

// Mobile control buttons
document.getElementById('upBtn').addEventListener('click', () => {
    keys['w'] = true;
    setTimeout(() => keys['w'] = false, 150);
});
document.getElementById('downBtn').addEventListener('click', () => {
    keys['s'] = true;
    setTimeout(() => keys['s'] = false, 150);
});
document.getElementById('leftBtn').addEventListener('click', () => {
    keys['a'] = true;
    setTimeout(() => keys['a'] = false, 150);
});
document.getElementById('rightBtn').addEventListener('click', () => {
    keys['d'] = true;
    setTimeout(() => keys['d'] = false, 150);
});
