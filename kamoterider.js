
// Get the canvas element
const canvas = document.getElementById('gameCanvas');

// Get the canvas context

const ctx = canvas.getContext('2d');


//Road image
const road = new Image();   

//Set the source of the image
road.src="images/road.png";


//Draw the image on the canvas
road.onload = function(){
    ctx.drawImage(road,0,0,canvas.width,canvas.height);

    //Car image
    const car = new Image();

    car.src = "images/Car1.png";



    //Draw the car on the canvas
    car.onload = function(){


        //Position of the car
        
        ctx.drawImage(car,canvas.width/2-10,canvas.height-30,20,30);
    }
}



