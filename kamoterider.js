// Get the canvas element
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 400;
canvas.height = 600;

// Game variables
let carX = canvas.width / 2 - 10;
let carY = canvas.height - 50;
let carWidth = 50;
let carHeight = 100;
let carSpeed = 3;

let enemyCars = [];
let enemyCarWidth = carWidth + 50;
let enemyCarHeight = carHeight;
let enemyCarSpeed = 2;

let keys = {};
let score = 0;
let gameActive = false;

// Load images
const road = new Image();
road.src = "images/road.png";

const car = new Image();
car.src = "images/Car1.png";

const enemyCar = new Image();
enemyCar.src = "images/EnemyCar.png";

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

// Collision detection
function detectCollision() {
    const paddingX = 18; // Adjust horizontal collision sensitivity
    const paddingY = 0.02; // Adjust vertical collision sensitivity

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

    // Move player
    if (keys['w'] && carY > 0) carY -= carSpeed;
    if (keys['s'] && carY < canvas.height - carHeight) carY += carSpeed;
    if (keys['a'] && carX > 0) carX -= carSpeed;
    if (keys['d'] && carX < canvas.width - carWidth) carX += carSpeed;

    // Move enemy cars
    enemyCars.forEach(enemy => {
        enemy.y += enemyCarSpeed;

        // Reset enemy when it leaves the screen
        if (enemy.y > canvas.height) {
            enemy.y = -enemyCarHeight;
            enemy.x = Math.random() * (canvas.width - enemyCarWidth);
            score++;
            scoreDisplay.innerText = score;
        }
    });

    // Collision detection
    if (detectCollision()) {
        gameOver();
    }

    requestAnimationFrame(animate);
}

// Game over function
function gameOver() {
    gameActive = false;
    gameOverScreen.style.display = "block";
    finalScore.innerText = score;
}

// Start game function
function startGame() {
    startScreen.style.display = "none";
    gameOverScreen.style.display = "none";
    score = 0;
    scoreDisplay.innerText = score;
    carX = canvas.width / 2 - carWidth / 2;
    carY = canvas.height - 50;
    roadY = 0;
    enemyCars = Array.from({ length: 5 }, () => ({
        x: Math.random() * (canvas.width - enemyCarWidth),
        y: Math.random() * -canvas.height
    })).map(enemy => ({
        ...enemy,
        x: Math.max(0, Math.min(enemy.x, canvas.width - enemyCarWidth))
    }));
    gameActive = true;
    animate();
}

// Event listeners
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

window.addEventListener("keydown", (e) => (keys[e.key] = true));
window.addEventListener("keyup", (e) => (keys[e.key] = false));
