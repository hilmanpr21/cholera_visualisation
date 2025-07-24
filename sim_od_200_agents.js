const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');


function createAgent() {
    const radius = 10;
    const houseX = Math.random() * (canvas.width / 3);
    const houseY = Math.random() * canvas.clientHeight;
    const workX = (2/3 * canvas.width) + Math.random() * (canvas.width / 3);
    const workY = Math.random() * canvas.clientHeight;

    return {
        x: houseX,                         // initial agent x-coordinate, will be set to the house.x later
        y: houseY,                         // initial Agent location y-coordinate, will be set to the house.y later
        house: {                      // Set the pixel location of house  
            x: houseX,            // Randomise the x-coordinate for house onleft third part of the canvas
            y: houseY      // randomise the y-coordinate for house
        },        
        work: {
            x: workX,            // Randomise the x-coordinate for work on right third part of the canvas
            y: workY     // randomise the y-coordinate for work
        },         // Set the pixel location of work
        target: 'work',                 // Set the initial target
        speed: Math.random()  * 4,  //randomise the speed between                      // movement speed in pixels/frame
        radius: radius
    }
}

// create array pf agents
let agents = [];    // declare empty array
for (let i = 0; i < 100; i++) {
    agents.push(createAgent())
}

// Agent movement and position logic
function updateAgentMovement(agentInput) {
    const target = agentInput.target === 'work' ? agentInput.work : agentInput.house;

    const dx = target.x - agentInput.x;
    const dy = target.y - agentInput.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if(distance > agentInput.speed) {
        agentInput.x += (dx / distance) * agentInput.speed;       // to find new x posiiton. (dx / distance) is cos -> cos * agent.speed = x-coordinate position
        agentInput.y += (dy / distance) * agentInput.speed;       // to find new y posiiton. (dy / distance) is sin -> sin * agent.speed = y-coordinate position
    } else {
        agentInput.target = agentInput.target === 'work' ? 'house' : 'work';
    }
}

// function to draw agent
function drawAgent(agentInput) {
    // draw Agent 
    ctx.beginPath();
    ctx.arc(agentInput.x, agentInput.y, agentInput.radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'blue';
    ctx.fill();
    ctx.closePath();
}

function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const agent of agents) {
        // draw house
        ctx.fillStyle = 'green';
        ctx.fillRect(agent.house.x-5, agent.house.y, 15, 15);           // agent.house.x is the center pixel of the house, `-5` is because the house size is 10 pixels so the starting point to draw the rectangle should be reduce by half of the pixels size

        // draw work
        ctx.fillStyle = 'red';
        ctx.fillRect(agent.work.x - 5, agent.work.y - 5, 10, 10);

    }
   
    // draw the agents
    agents.forEach(drawAgent)
}

// Declare animation function
function animate() {
    agents.forEach(agent => {
        updateAgentMovement(agent)
    })
    drawScene()

    requestAnimationFrame(animate);
}

// call the animation function to start the sumilation
animate()