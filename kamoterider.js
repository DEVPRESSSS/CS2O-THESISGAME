// Get the canvas element
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 600;

// Trap Game Variables
const HIGH_SCORE_THRESHOLD = 200;
const SPECIAL_BEHAVIOR_CHANCE = 0.3; // 30% chance for special behavior
const SPEED_BOOST_MULTIPLIER = 1.5;
const SIDE_MOVE_SPEED = 2;

// Difficulty game variables
let baseEnemySpeed = 4;
let baseRoadSpeed = 2;
let difficultyInterval = 500; // Increase difficulty every 500 points
let nextDifficultyThreshold = difficultyInterval;

// Update vehicle dimensions in the game variables section
let carX = canvas.width / 2 - 15;  // Centered position for new width
let carY = canvas.height - 70;      // Adjusted vertical position
let carWidth = 30;                  // Narrow motorcycle width
let carHeight = 60;                 // Shorter motorcycle height
let carSpeed = 3;

let enemyCars = [];
let enemyCarWidth = 50;             // Wider car width
let enemyCarHeight = 100;           // Taller car height
let enemyCarSpeed = 4;

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
let roadSpeed = 2;

// Draw functions
function drawRoad() {
    ctx.drawImage(road, 0, roadY, canvas.width, canvas.height);
    ctx.drawImage(road, 0, roadY - canvas.height, canvas.width, canvas.height);
    roadY += roadSpeed;

    // Loop the road image
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

// Modify the updateDifficulty function
function updateDifficulty(currentScore) {
    // Difficulty scaling
    if (currentScore >= HIGH_SCORE_THRESHOLD) {
        enemyCars.forEach(enemy => {
            if (Math.random() < SPECIAL_BEHAVIOR_CHANCE && enemy.behavior === 'normal') {
                // Determine available lanes
                const possibleLanes = [];
                if (enemy.lane > 0) possibleLanes.push(enemy.lane - 1);
                if (enemy.lane < LANES.length - 1) possibleLanes.push(enemy.lane + 1);
                
                if (possibleLanes.length > 0) {
                    enemy.behavior = 'laneChange';
                    enemy.targetLane = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
                }
            }
        });
    }

    // Special behaviors (independent of difficulty interval)
    if (currentScore >= HIGH_SCORE_THRESHOLD) {
        enemyCars.forEach(enemy => {
            if (Math.random() < SPECIAL_BEHAVIOR_CHANCE && enemy.behavior === 'normal') {
                enemy.behavior = Math.random() < 0.5 ? 'speedBoost' : 'laneChange';
                if (enemy.behavior === 'speedBoost') {
                    enemy.speed = baseEnemySpeed * SPEED_BOOST_MULTIPLIER;
                }
            }
        });
    }
}

// Add lane definitions at the top
const LANES = [40, 125, 220, 310]; // X positions for 3 lanes
const MIN_VERTICAL_DISTANCE = 200; // Minimum space between cars in same lane

// Check if a new enemy car position would overlap with existing cars
function wouldOverlap(newX, newY) {
    return enemyCars.some(enemy => {
        // Check vertical distance regardless of lane
        return Math.abs(newY - enemy.y) < MIN_VERTICAL_DISTANCE;
    });
}

// Modified generateSafePosition function
function generateSafePosition() {
    let attempts = 0;
    const maxAttempts = 50;
    let newX, newY;

    do {
        // Select random lane and position
        newX = LANES[Math.floor(Math.random() * LANES.length)];
        newY = Math.random() * -canvas.height - 200; // Start higher above canvas
        
        attempts++;
    } while (wouldOverlap(newX, newY) && attempts < maxAttempts);

    // Fallback position if all attempts fail
    return { 
        x: newX,
        y: Math.min(newY, -MIN_VERTICAL_DISTANCE) // Ensure minimum spacing
    };
}

// Modified wouldOverlap function
function wouldOverlap(newX, newY) {
    return enemyCars.some(enemy => {
        // Check if same lane and vertical proximity
        return enemy.x === newX && 
               Math.abs(newY - enemy.y) < MIN_VERTICAL_DISTANCE;
    });
}

// Modified enemy car reset in animate function
enemyCars.forEach(enemy => {
    enemy.y += enemyCarSpeed;

    if (enemy.y > canvas.height) {
        const newPosition = generateSafePosition();
        enemy.x = newPosition.x;
        enemy.y = newPosition.y;
    }
});

// Collision detection
function detectCollision() {
    
    // Use motorcycle's smaller dimensions for collision check
    const paddingX = 4;  // Reduced horizontal collision area
    const paddingY = 5;  // Reduced vertical collision area

    return enemyCars.some(enemy => (
        carX + paddingX < enemy.x + enemyCarWidth - paddingX &&
        carX + carWidth - paddingX > enemy.x + paddingX &&
        carY + paddingY < enemy.y + enemyCarHeight - paddingY &&
        carY + carHeight - paddingY > enemy.y
    ));
}

// Animation loop
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

    // Move player
    if (keys['w'] && carY > 0) carY -= carSpeed;
    if (keys['s'] && carY < canvas.height - carHeight) carY += carSpeed;
    if (keys['a'] && carX > 0) carX -= carSpeed;
    if (keys['d'] && carX < canvas.width - carWidth) carX += carSpeed;

    // Update enemy movement
    enemyCars.forEach(enemy => {
        // Vertical movement with current speed
        enemy.y += enemy.speed;
        
        // Lane changing logic
        if (enemy.behavior === 'laneChange') {
            // Calculate target position based on lane
            const targetX = LANES[enemy.targetLane];
            const direction = targetX > enemy.x ? 1 : -1;
            
            // Move horizontally
            enemy.x += SIDE_MOVE_SPEED * direction;
            
            // Snap to lane and reset behavior when reached
            if (Math.abs(enemy.x - targetX) < SIDE_MOVE_SPEED) {
                enemy.x = targetX;
                enemy.lane = enemy.targetLane;
                enemy.behavior = 'normal';
            }
        }

        // Reset when off screen
        if (enemy.y > canvas.height) {
            const newPosition = generateSafePosition();
            enemy.x = newPosition.x;
            enemy.y = newPosition.y;
            enemy.speed = baseEnemySpeed;
            enemy.behavior = 'normal';
            enemy.lane = LANES.indexOf(newPosition.x);
        }
    });

    // Collision detection
    if (detectCollision()) {
        // Before ending the game, update the high score
        updateHighScore(Math.floor(score));
        gameOver();
    }

    requestAnimationFrame(animate);
}

// Game over function
function gameOver() {
    gameActive = false;
    gameOverScreen.style.display = "block";
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

    // Reset difficulty parameters
    enemyCarSpeed = baseEnemySpeed;
    roadSpeed = baseRoadSpeed;
    nextDifficultyThreshold = difficultyInterval;
    
    // Create enemy cars with non-overlapping positions
    enemyCars = [];
    let currentY = -MIN_VERTICAL_DISTANCE * 2; // Start position

    // Modify enemy initialization in startGame
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

function gameOver() {
    gameActive = false;
    // Remove the "hidden" class to show the game over screen
    gameOverScreen.classList.remove("hidden");
    finalScore.innerText = Math.floor(score);
}

// Update high score using localStorage
function updateHighScore(currentScore) {
    let highScore = localStorage.getItem('highScore');
    highScore = highScore ? parseInt(highScore) : 0;
    
    if (currentScore > highScore) {
        localStorage.setItem('highScore', currentScore);
        highScore = currentScore;
    }
    
    // Update the high score display (make sure an element with id 'highScoreDisplay' exists in your HTML)
    document.getElementById('highScoreDisplay').innerText = highScore;
}

function loadHighScore() {
    let highScore = localStorage.getItem('highScore');
    return highScore ? parseInt(highScore) : 0;
}

// Event listeners
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);
window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));


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
  
