const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

// Declare one agent object
const agent = {
    x: 0,                         // initial agent x-coordinate, will be set to the house.x later
    y: 0,                         // initial Agent location y-coordinate, will be set to the house.y later
    house: {                      // Set the pixel location of house  
        x: Math.random() * (canvas.width / 3),            // Randomise the x-coordinate for house onleft third part of the canvas
        y: Math.random() * canvas.clientHeight      // randomise the y-coordinate for house
    },        
    work: {
        x: (2/3 * canvas.width) + Math.random() * (canvas.width / 3),            // Randomise the x-coordinate for work on right third part of the canvas
        y: Math.random() * canvas.clientHeight      // randomise the y-coordinate for work
    },         // Set the pixel location of work
    target: 'work',                 // Set the initial target
    speed: 1.5                      // movement speed in pixels/frame
}


// Set Agent starting point from house
agent.x = agent.house.x;
agent.y = agent.house.y;

// Agent movement and position logic
function updateAgentMovement() {
    const target = agent.target === 'work' ? agent.work : agent.house;

    const dx = target.x - agent.x;
    const dy = target.y - agent.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if(distance > agent.speed) {
        agent.x += (dx / distance) * agent.speed;       // to find new x posiiton. (dx / distance) is cos -> cos * agent.speed = x-coordinate position
        agent.y += (dy / distance) * agent.speed;       // to find new y posiiton. (dy / distance) is sin -> sin * agent.speed = y-coordinate position
    } else {
        agent.target = agent.target === 'work' ? 'house' : 'work';
    }
}

function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw house
    ctx.fillStyle = 'green';
    ctx.fillRect(agent.house.x-5, agent.house.y, 10, 10);           // agent.house.x is the center pixel of the house, `-5` is because the house size is 10 pixels so the starting point to draw the rectangle should be reduce by half of the pixels size

    // draw work
    ctx.fillStyle = 'red';
    ctx.fillRect(agent.work.x - 5, agent.work.y - 5, 10, 10);

    // draw Agent 
    ctx.beginPath();
    ctx.arc(agent.x, agent.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.closePath();
}

// Declare animation function
function animate() {
    updateAgentMovement()
    drawScene()

    requestAnimationFrame(animate);
}

// call the animation function to start the sumilation
animate()