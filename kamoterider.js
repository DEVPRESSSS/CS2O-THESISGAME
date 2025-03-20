// Get the canvas element
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 600;

// Load sound effects and music
const crashSound = new Audio('Sounds/explosion.wav');
const speedBoostSound = new Audio('Sounds/speeding.wav');
const engineStart = new Audio('Sounds/startEngine.wav');
const newScore = new Audio('Sounds/newscore.wav');
const bgMusic = new Audio('Sounds/bgmusic.mp3');

// For continuous background music, enable looping
bgMusic.loop = true;

//Start the BgMusic when the page loads
bgMusic.currentTime = 0;
bgMusic.play();

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

// Unified overlap-check function
function wouldOverlap(newX, newY) {
    const laneIndex = LANES.indexOf(newX);
    if (laneIndex === -1){

        return false;
    };
    return enemyCars.some(enemy => {
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

// Generate safe position for an enemy car
function generateSafePosition() {
    let attempts = 0;
    const maxAttempts = 50;
    let newX, newY;
    do {
        const laneIndex = Math.floor(Math.random() * LANES.length);
        newX = LANES[laneIndex];
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


//Draw the player's motorbike
function drawCar() {
    ctx.drawImage(car, carX, carY, carWidth, carHeight);
}


// Draw enemy cars
function drawEnemyCars() {
    enemyCars.forEach(enemy => {
        ctx.drawImage(enemyCar, enemy.x, enemy.y, enemyCarWidth, enemyCarHeight);
    });
}

// Update enemy difficulty and special behavior
// Update enemy difficulty and special behavior
function updateDifficulty(currentScore) {
    if (currentScore >= HIGH_SCORE_THRESHOLD) {
        enemyCars.forEach(enemy => {
            if (enemy.behavior === 'normal' && Math.random() < SPECIAL_BEHAVIOR_CHANCE) {
                if (Math.random() < 0.5) {
                    const currentLaneIndex = enemy.lane;
                    const possibleLanes = LANES
                        .map((pos, index) => index)
                        .filter(index => index !== currentLaneIndex);
                    
                    // Check if any lane is safe to change to
                    const safeLanes = possibleLanes.filter(laneIndex => {
                        // Check if any car is too close in the target lane
                        return !enemyCars.some(otherCar => 
                            otherCar !== enemy && 
                            (otherCar.lane === laneIndex || 
                             (otherCar.behavior === 'laneChange' && otherCar.targetLane === laneIndex)) &&
                            Math.abs(otherCar.y - enemy.y) < MIN_VERTICAL_DISTANCE
                        );
                    });
                    
                    // Only change lane if there's a safe lane to change to
                    if (safeLanes.length > 0) {
                        enemy.behavior = 'laneChange';
                        enemy.targetLane = safeLanes[Math.floor(Math.random() * safeLanes.length)];
                    } else {
                        // If no safe lane, give speed boost instead
                        enemy.behavior = 'speedBoost';
                        enemy.speed = baseEnemySpeed * SPEED_BOOST_MULTIPLIER;
                    }
                } else {
                    enemy.behavior = 'speedBoost';
                    enemy.speed = baseEnemySpeed * SPEED_BOOST_MULTIPLIER;
                }
            }
        });
        resolveEnemyOverlaps();
    }
}

// Collision detection between player and enemy cars
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

    score += 0.1;
    let displayedScore = Math.floor(score);
    scoreDisplay.innerText = displayedScore;
    updateLiveHighScore(displayedScore);
    updateDifficulty(score);

    // Player movement with speed boost sound handling
    speedBoostSound.loop = true;
    if (keys['w'] && carY > 0) {
        carY -= carSpeed;
        if (speedBoostSound.paused) {
            speedBoostSound.currentTime = 0;
            speedBoostSound.play();
        }
    } else {
        if (!keys['w'] && !speedBoostSound.paused) {
            speedBoostSound.pause();
            speedBoostSound.currentTime = 0;
        }
    }
    
    if (keys['s'] && carY < canvas.height - carHeight) carY += carSpeed;
    if (keys['a'] && carX > LANES[0]) carX -= carSpeed; 
    if (keys['d'] && carX < LANES[LANES.length -1] + carWidth) carX += carSpeed; 


    enemyCars.forEach(enemy => {
        enemy.y += enemy.speed || baseEnemySpeed;
        if (enemy.behavior === 'laneChange') {

            const targetX = LANES[enemy.targetLane];
            const direction = targetX > enemy.x ? 1 : -1;
            enemy.x += SIDE_MOVE_SPEED * direction;
            if (Math.abs(enemy.x - targetX) < SIDE_MOVE_SPEED) {
                enemy.x = targetX;
                enemy.lane = enemy.targetLane;
                enemy.behavior = 'normal';
                enemy.speed = baseEnemySpeed;
            }
        }
        if (enemy.y > canvas.height) {
            const newPosition = generateSafePosition();
            enemy.x = newPosition.x;
            enemy.y = newPosition.y;
            enemy.speed = baseEnemySpeed;
            enemy.behavior = 'normal';
            enemy.lane = newPosition.lane;
        }
    });

    resolveEnemyOverlaps();

    if (detectCollision()) {
        updateHighScore(Math.floor(score));
        crashSound.currentTime = 0;
        crashSound.play();
        if (!speedBoostSound.paused) {
            speedBoostSound.pause();
            speedBoostSound.currentTime = 0;
        }
        gameOver();
    }    

    requestAnimationFrame(animate);
}

// Game over function: resume bgMusic when game ends
function gameOver() {
    gameActive = false;
    gameOverScreen.classList.remove("hidden");
    finalScore.innerText = Math.floor(score);
    saveHighScore(Math.floor(score));
    
    // Start the background music when the game ends
    bgMusic.currentTime = 0;
    bgMusic.play();
}

// Start game function: pause bgMusic when game starts
function startGame() {
    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    score = 0;
    scoreDisplay.innerText = score;
    carX = canvas.width / 2 - carWidth / 2;
    carY = canvas.height - 150;
    roadY = 0;

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

    // Start engine sound and pause background music
    engineStart.currentTime = 0;
    engineStart.play();
    
    bgMusic.pause();
    bgMusic.currentTime = 0;

    // Reset the high score flag for new game runs
    highScoreSurpassed = false;
    
    gameActive = true;
    animate();
}

// Live high score functions
let highScoreSurpassed = false;

function loadHighScore() {
    let highScore = localStorage.getItem('highScore');
    return highScore ? (highScore) : 0;
}

function updateLiveHighScore(currentScore) {
    const storedHighScore = loadHighScore();
    const liveHighScore = currentScore > storedHighScore ? currentScore : storedHighScore;
    document.getElementById('highScoreDisplay').innerText = liveHighScore;
    
    if (currentScore > storedHighScore && !highScoreSurpassed) {
        highScoreSurpassed = true;
        newScore.currentTime = 0;
        newScore.play();
    }
}

function updateHighScore(currentScore) {
    let highScore = loadHighScore();
    if (currentScore > highScore) {
        localStorage.setItem('highScore', currentScore);
    }
    document.getElementById('highScoreDisplay').innerText = loadHighScore();
}

function saveHighScore(finalScore) {
    const storedHighScore = loadHighScore();
    if (finalScore > storedHighScore) {
        localStorage.setItem('highScore', finalScore);
    }
}

// Event listeners
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
window.addEventListener("keydown", (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

// Start bgMusic on page load (if allowed by browser)
window.addEventListener('load', () => {
    bgMusic.currentTime = 0;
    bgMusic.play();
});

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
