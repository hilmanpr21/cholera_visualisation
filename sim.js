const canvas = document.getElementById('simCanvas')
const ctx = canvas.getContext('2d');

// Create Object to store the agent position and velocity
let agent = {
    x: 10,      // starting x position
    y: 100,     // starting y position 
    radius: 10,  // the agent cirle radius size
    vx: 0.2,      // velocity in x (pixels per frame)
    vy: 5,      // velocity in y (pixels per frame)   
};


function drawScene() {
    
    // Clear the entire canvas to start fresh
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw clean waterbody
    ctx.beginPath();
    ctx.arc(200, 150, 40, 0, 2 * Math.PI);
    ctx.fillStyle = 'lightblue'; //choose the background colour
    ctx.fill();
    //ctx.stroke();
    ctx.closePath();

    // Draw contaminated waterbody
    ctx.beginPath();
    ctx.arc(600, 450, 40, 0, 2 * Math.PI);
    ctx.fillStyle = 'darkblue'; //choose the background colour
    ctx.fill();
    //ctx.stroke();
    ctx.closePath();

    // Draw Latrine
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(350, 250, 40, 60);
    //ctx.strokeRect(350, 250, 40, 60); //to draw stroke

    //Draw the agent
    drawAgent(agent);
}

// agent drawing function
function drawAgent(agentInput) {
    ctx.beginPath();
    ctx.arc(agentInput.x, agentInput.y, agentInput.radius, 0, 2 * Math.PI);
    ctx.fillStyle = 'pink';
    ctx.fill();
    //ctx.stroke();
    ctx.closePath();
}

// update anget position or agent movement
function updateAgentMovement(agentInput) {
    agentInput.x += agentInput.vx;
    agentInput.y += agentInput.vy;

    // bounce when it touch the boundaries
    if (agentInput.x <= agentInput.radius || agentInput.x >=canvas.width - agentInput.radius) {
        agentInput.vx *= -1;
    }
    if (agentInput.y <= agentInput.radius || agentInput.y >=canvas.height - agentInput.radius) {
        agentInput.vy *= -1;
    }
}

// Render the canvas in loop
function animate() {
    updateAgentMovement(agent); // updates agent's position
    drawScene(); // redraw the scene that canvas update the agent position
    requestAnimationFrame(animate); //schedule next frame (re-run animate)
}

// start animation by calling
animate() 
