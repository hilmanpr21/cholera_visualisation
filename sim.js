const canvas = document.getElementById('simCanvas')
const ctx = canvas.getContext('2d');

// Create Object to store the agent position and velocity
let agent = {
    x: 10,      // starting x position
    y: 100,     // starting y position 
    radius: 10,  // the agent cirle radius size
    vx: 1,      // velocity in x (pixels per frame)
    vy: 4,      // velocity in y (pixels per frame)   
    state: "susceptible", // initial state of SEIR
    statetimer: 0, // define how many secons in this current state
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

// update agent position or agent movement
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

// Logic of agent SEIR state transition
function updateAgentState(agentInput, deltaTime) {
    switch (agentInput.state) {
        case "exposed":
            agentInput.statetimer += deltaTime;
            if (agentInput.statetimer >= 5) {       // checking the condition where the agent have been int he exposed state more than 5 seconds
                agentInput.state = "infected";      // change the state to infected
                agentInput.statetimer = 0;          // Set the timer to 0 again
            }
            break;
        case "infected":
            agentInput.statetimer += deltaTime;
            if (agentInput.statetimer >= 10) {      // checking the condition where the agent have been in the infected state more than 10 seconds
                agentInput.state = "recovered";     // change the state to recovered
                agentInput.statetimer = 0;          // Set the timer to 0 again
            }
            break;
        case "recover":
            agentInput.statetimer += deltaTime;
            if (agentInput.statetimer >= 200) {     // checking the condition where the agent have been int he recovered state more than 200 seconds
                agentInput.state = "susceptible";   // change the state to susceptible
                agentInput.statetimer = 0;          // Set the timer to 0 again
            }
            break;
    }
}

// Logic detect contacting contaminated waterbody
function touchingContaminatedWater(agentInput) {
    //dx is storing the x-distance between centre of agent and contaminated waterbody
    const dx = agentInput.x - 600   // agentInput.x is the x-position of agent centre and 600 is the x-position of the contaminated waterbody
    //dy is storing the y-distance between centre of agent and contaminated wateerbody
    const dy = agentInput.y - 450   // agentInput.y is the y-position of agent centre and 450 is the y-position of the contaminated waterbody

    // calculate the staighline distance between agent centre and waterbody centre using pythagoras
    const distance = Math.sqrt(dx * dx + dy * dy);

    // check if the agent is touching waterbody or not
    // contaminted water body has radius 40
    // if the distance between centres is less than the totaal of waterbody's radius and agent's radius, it meens it is touching or even overlap
    return distance <= 40 + agentInput.radius;
}

// Trigger exposed stage after suceptible agent tpuch waterbody
function changeToExposed(agentInput) {
    if (agentInput.state === "susceptible" && touchingContaminatedWater(agentInput)) {
        agentInput.state = "exposed";
        agentInput.statetimer = 0;
    }
}


// Render the canvas in loop
let lastTime = performance.now(); // initialise last frame time

function animate(currentTime) {
    let deltaTime = (currentTime - lastTime) / 1000; // ms to seconds
    lastTime = currentTime;

    changeToExposed(agent);
    updateAgentMovement(agent);
    updateAgentState(agent, deltaTime);
    drawScene();

    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

function drawAgent(agent) {
    ctx.beginPath();
    ctx.arc(agent.x, agent.y, agent.radius, 0, 2 * Math.PI);

    switch (agent.state) {
        case "susceptible":
            ctx.fillStyle = "pink";
            break;
        case "exposed":
            ctx.fillStyle = "orange";
            break;
        case "infected":
            ctx.fillStyle = "red";
            break;
        case "recovered":
            ctx.fillStyle = "green";
            break;
    }

    ctx.fill();
    ctx.closePath();
}


// start animation by calling
animate() 
