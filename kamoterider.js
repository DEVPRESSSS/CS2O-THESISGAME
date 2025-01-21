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

// Animation loop
function animate() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the road image
    drawRoad();

    // Update car position
    carY -= carSpeed;

    // Reset car position if it goes off screen
    if (carY < -carHeight) {
        carY = canvas.height;
    }

    // Draw the car
    drawCar();

    // Request next frame
    requestAnimationFrame(animate);
}

// Start animation when images are loaded
road.onload = car.onload = animate;
