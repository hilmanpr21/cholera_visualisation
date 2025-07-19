const canvas = document.getElementById('simCanvas')
const ctx = canvas.getContext('2d');

// define waterbodies at the start
const contaminatedWaterbodies = [
    { 
        x: canvas.width * 0.5,         // define x-center point
        y: canvas.height * 0.5,          // define y-center point
        radius: 40      // radius of the waterbody
    }
];

// Function to store agent's initial characters
function createAgent(){
    const radius = 10;
    let x, y, valid = false;

    while (!valid) {
        x = Math.random() * (canvas.width - 2 * radius) + radius;
        y = Math.random() * (canvas.height - 2 * radius) + radius;
        valid = true;

        // check waterbody collision
        for (const waterbody of contaminatedWaterbodies) {
            const dx = x - waterbody.x;
            const dy = y - waterbody.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < waterbody.radius + radius + 5) {
                valid = false;
                break;
            }
        }

        // Check boundaries
        if (x <= radius || x >= canvas.width - radius || y <= radius || y >= canvas.height - radius) {
            valid = false;
        }
    }
    
    return {
        x,      // starting x position
        y,     // starting y position 
        radius,  // the agent cirle radius size
        vx: (Math.random() - 0.5) * 8,      // velocity in x (pixels per frame), random velocity between -4 and +4
        vy: (Math.random() - 0.5) * 8,      // velocity in y (pixels per frame), random velocity between -4 and +4   
        state: "susceptible", // initial state of SEIR
        statetimer: 0, // define how many secons in this current state
    }
}

// Create array to store the agent array value, 50 agents
let agents = [];
for (let i = 0; i < 100 ; i++) {
    agents.push(createAgent());
}



function drawScene() {
    
    // Clear the entire canvas to start fresh
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw contaminated waterbody
    for (const waterbodies of contaminatedWaterbodies) {
        ctx.beginPath();
        ctx.arc(waterbodies.x, waterbodies.y, waterbodies.radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'darkblue'; //choose the background colour
        ctx.fill();
        //ctx.stroke();
        ctx.closePath();
    }
    
    //Draw the 200 agent
    agents.forEach(drawAgent);
}

// agent drawing function
function drawAgent(agentInput) {
    ctx.beginPath();
    ctx.arc(agentInput.x, agentInput.y, agentInput.radius, 0, 2 * Math.PI);
    
    switch (agentInput.state) {
        case "susceptible":
            ctx.fillStyle = "pink";
            break;
        
        case "exposed":
            ctx.fillStyle = "orange";
            break;

        case "infected" :
            ctx.fillStyle = "red";
            break;

        case "recovered" :
            ctx.fillStyle = "purple";
            break;
    }

    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
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

    // bounce when agent touch contaminated waterbodies
    for (const waterbodies of contaminatedWaterbodies) {
        const dx = agentInput.x - waterbodies.x;
        const dy = agentInput.y - waterbodies.y;
        const distance = Math.sqrt(dx * dx + dy * dy); // calculate the distance difference

        if (distance <= waterbodies.radius + agentInput.radius) {
            // reflect direction based on which side is closer
            if (Math.abs(dx) > Math.abs(dy)) {      // check if the distance is closer in the x-axis more than the y-axis
                agentInput.vx *= -1;
            } else {
                agentInput.vy *= -1;
            }
        }
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
        case "recovered":
            agentInput.statetimer += deltaTime;
            if (agentInput.statetimer >= 200) {     // checking the condition where the agent have been int he recovered state more than 200 seconds
                agentInput.state = "susceptible";   // change the state to susceptible
                agentInput.statetimer = 0;          // Set the timer to 0 again
            }
            break;
    }
}

// Get the deltaTime to calculate how long the agent have been on that state
let lastTime = performance.now();       // Define the lastTime object with timestamp from `performance.now()` for the initial value

function getDeltaTime(currentTimeInput) {
    let deltaTime = (currentTimeInput - lastTime) / 1000;       // divided to 1000 to change the unit of deltaTime from milisecond to second
    lastTime = currentTimeInput;                                // Assign new lastTime with currentTime for the next frame calculation
    return deltaTime;                                           // Return the result of deltatime
}

// Logic detect contacting contaminated waterbody
function touchingContaminatedWater(agentInput) {
    for (const waterbodies of contaminatedWaterbodies) {
        //dx is storing the x-distance between centre of agent and contaminated waterbody
        const dx = agentInput.x - waterbodies.x  // agentInput.x is the x-position of agent centre and 600 is the x-position of the contaminated waterbody
        //dy is storing the y-distance between centre of agent and contaminated wateerbody
        const dy = agentInput.y - waterbodies.y   // agentInput.y is the y-position of agent centre and 450 is the y-position of the contaminated waterbody
    
        // calculate the staighline distance between agent centre and waterbody centre using pythagoras
        const distance = Math.sqrt(dx * dx + dy * dy);

        // check if the agent is touching waterbody or not
        // contaminted water body has radius 40
        // if the distance between centres is less than the total of waterbody's radius and agent's radius, it means it is touching or even overlap
        return distance <= 40 + agentInput.radius;
    }
}

// Trigger exposed stage after suceptible agent tpuch waterbody
function changeToExposed(agentInput) {
    if (agentInput.state === "susceptible" && touchingContaminatedWater(agentInput)) {
        agentInput.state = "exposed";
        agentInput.statetimer = 0;
    }
}


// Render the canvas in loop
function animate(currentTime) {
    const deltaTime = getDeltaTime(currentTime)     // to calculate the deltaTime

    agents.forEach(agent => {
        changeToExposed(agent);                         // to change from susceptible to exposed
        updateAgentMovement(agent);                     // to call control agent movement
        updateAgentState(agent, deltaTime);             // to chaneg the SEIR state
    })
    
    drawScene();                                    // To draw the frame

    // call to count SEIR data over time
    timeAccumulator += deltaTime;                   // to calculate how long the simulation running
    if (timeAccumulator >= logInterval){
        countSEIRStates();                          // calling the function to log the SEIR count
        drawSEIRChart(SEIRDataOverTime);  // <-- draw chart here
        timeAccumulator = 0;
    }

    requestAnimationFrame(animate);                 // To schedule next frame (re-run animation)
    
}

// TRACK SEIR STATE COUNTS OVER TIME
// create global array to store SEIr count over time
const SEIRDataOverTime = [];

// How often in second the log SEIR counts
const logInterval = 0.5; //in second
let timeAccumulator = 0; // set initial time

// Function to cout SEIR states
function countSEIRStates() {
    const count = {
        time: parseFloat((performance.now() / 1000).toFixed(1)), // this change milli second to second#
        susceptible: 0,
        exposed: 0,
        infected: 0,
        recovered: 0
    };
    for (const agent of agents) {
        count[agent.state]++;
    }
    SEIRDataOverTime.push(count);
    console.log("SEIR Count at t =", count.time, count);
}

// MAKE THE CHART
function drawSEIRChart() {
    if (SEIRDataOverTime.length < 2) return;

    const width = chartCanvas.width;
    const height = chartCanvas.height;
    const margin = 40;

    chartCtx.clearRect(0, 0, width, height);

    // Calculate max total population
    const totalPopulation = agents.length;

    // Get X and Y scaling
    const maxTime = SEIRDataOverTime[SEIRDataOverTime.length - 1].time;
    const xScale = (width - 2 * margin) / maxTime;
    const yScale = (height - 2 * margin) / totalPopulation;

    // Helper to get stacked values
    function getStackedValues(index) {
        const point = SEIRDataOverTime[index];
        return {
            R: point.recovered,
            RI: point.recovered + point.infected,
            RIE: point.recovered + point.infected + point.exposed,
            RIES: point.recovered + point.infected + point.exposed + point.susceptible
        };
    }

    // Draw area for each layer in order: Recovered, Infected, Exposed, Susceptible
    function drawArea(getYTop, getYBottom, colour) {
        chartCtx.beginPath();
        for (let i = 0; i < SEIRDataOverTime.length; i++) {
            const t = SEIRDataOverTime[i].time;
            const x = margin + t * xScale;
            const y = height - margin - getYTop(i) * yScale;
            if (i === 0) {
                chartCtx.moveTo(x, y);
            } else {
                chartCtx.lineTo(x, y);
            }
        }
        for (let i = SEIRDataOverTime.length - 1; i >= 0; i--) {
            const t = SEIRDataOverTime[i].time;
            const x = margin + t * xScale;
            const y = height - margin - getYBottom(i) * yScale;
            chartCtx.lineTo(x, y);
        }
        chartCtx.closePath();
        chartCtx.fillStyle = colour;
        chartCtx.globalAlpha = 0.6;
        chartCtx.fill();
        chartCtx.globalAlpha = 1.0;
    }

    // Draw in stacking order: R, I, E, S (bottom to top)
    drawArea(i => getStackedValues(i).R, i => 0, "#800080"); // Recovered
    drawArea(i => getStackedValues(i).RI, i => getStackedValues(i).R, "#ff0000"); // Infected
    drawArea(i => getStackedValues(i).RIE, i => getStackedValues(i).RI, "#ffa500"); // Exposed
    drawArea(i => getStackedValues(i).RIES, i => getStackedValues(i).RIE, "#ff69b4"); // Susceptible

    // Optional: add axes
    chartCtx.strokeStyle = "#333";
    chartCtx.lineWidth = 1;

    // Y-axis
    chartCtx.beginPath();
    chartCtx.moveTo(margin, margin);
    chartCtx.lineTo(margin, height - margin);
    chartCtx.stroke();

    // X-axis
    chartCtx.beginPath();
    chartCtx.moveTo(margin, height - margin);
    chartCtx.lineTo(width - margin, height - margin);
    chartCtx.stroke();
}





// start animation by calling
animate() 

// to update chart every few second
setInterval(() => drawSEIRChart(SEIRDataOverTime), 1000);
