// Get the canvas element
const canvas = document.getElementById('gameCanvas');

// Get the canvas context
const ctx = canvas.getContext('2d');

// Set the car x position
let carX = canvas.width / 2 - 10;

// Set the car y position
let carY = canvas.height - 30;

// Car height
let carHeight = 30;

// Car width
let carWidth = 20;

// Car speed
let carSpeed = 1;

// Load road image
const road = new Image();
road.src = "images/road.png";

// Load car image
const car = new Image();
car.src = "images/Car1.png";


// Draw road function
function drawRoad() {
    ctx.drawImage(road, 0, 0, canvas.width, canvas.height);
}

// Draw car function
function drawCar() {
    ctx.drawImage(car, carX, carY, carWidth, carHeight);
}


// Enemy car dimensions should match the main car
let enemy_carWidth = carWidth;  // Match the width of Car1
let enemy_carHeight = carHeight;  // Match the height of Car1

// Enemy car's initial x position (centered on the road)
let enemyCarX = canvas.width / 2 - enemy_carWidth / 2;

// Enemy car's initial y position
let enemyCarY = canvas.height - 150;

// Load enemy car image
const enemyCar = new Image();
enemyCar.src = "images/EnemyCar.png";

// Draw the enemy car function
function drawEnemyCar() {
    ctx.drawImage(enemyCar, enemyCarX, enemyCarY, enemy_carWidth, enemy_carHeight);
}







// Animation loop
function animate() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the road image
    drawRoad();

    // Update player's car position
    carY -= carSpeed;

    // Reset player's car position if it goes off screen
    if (carY < -carHeight) {
        carY = canvas.height;
    }

    // Update enemy car position
    enemyCarY += carSpeed;

    // Reset enemy car position if it goes off screen (bottom of the canvas)
    if (enemyCarY > canvas.height) {
        enemyCarY = -enemy_carHeight; // Reset to above the screen
        enemyCarX = Math.random() * (canvas.width - enemy_carWidth); // Randomize X position
    }

    // Draw the enemy car
    drawEnemyCar();

    // Draw the player's car
    drawCar();

    // Request the next frame
    requestAnimationFrame(animate);
}


// Start animation when images are loaded
road.onload = car.onload = animate;





