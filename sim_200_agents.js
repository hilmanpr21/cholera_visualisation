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
        for (const waterbody of contaminatedWaterbodies) {
            const dx = x - waterbody.x;
            const dy = y - waterbody.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < waterbody.radius + 10) { // 10 is agent radius
                valid = false;
                break;
            }
        }
        if (x <= radius || x >=canvas.width - radius || y <= radius || y >=canvas.height -radius) {
            valid = false;
            break;
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

// Create array to store the agent array value
let agents = [];

for (let i = 0; i < 50 ; i++) {
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
        if (distance <= waterbodies.radius + agentInput.radius) {
            return true;
        }
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
    drawSEIRChart(SEIRDataOverTime); // << add this
}

// MAKE THE CHART
function drawSEIRChart(data) {
    const svg = d3.select("#seirChart");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    svg.selectAll("*").remove(); // clear old chart

    const keys = ["susceptible", "exposed", "infected", "recovered"];

    const stackedData = d3.stack().keys(keys)(data);

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.time))
        .range([40, width - 10]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => keys.reduce((sum, k) => sum + d[k], 0))])
        .range([height - 20, 10]);

    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(["pink", "orange", "red", "purple"]);

    const area = d3.area()
        .x(d => x(d.data.time))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

    svg.selectAll("path")
        .data(stackedData)
        .join("path")
        .attr("fill", d => color(d.key))
        .attr("d", area);

     // Add x-axis
    svg.append("g")
        .attr("transform", `translate(0,${height - 20})`)
        .call(d3.axisBottom(x));

    // Add y-axis
    svg.append("g")
        .attr("transform", `translate(40,0)`)
        .call(d3.axisLeft(y));
}



// start animation by calling
animate() 

// to update chart every few second
setInterval(() => drawSEIRChart(SEIRDataOverTime), 1000);
