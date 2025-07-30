// This function is simlationg how water body gets contaminated by agents

(function() {

    const canvas = document.getElementById('simCanvas')
    const ctx = canvas.getContext('2d');

    // Get the variable color from CSS file
    const style = getComputedStyle(document.documentElement);
    const susceptibleColor = style.getPropertyValue('--susceptible-color');
    const exposedColor = style.getPropertyValue('--exposed-color');
    const infectedColor = style.getPropertyValue('--infected-color');
    const recoveredColor = style.getPropertyValue('--recovered-color');

    // Grid System Setup
    const gridSize = 20; // Size of each grid cell 20x20 pixels

    // Define grid utility functions
    const grid = {
        cells: {}, // will store visited cells by agent ID
        getCellKey: function(x, y) {
            // convert canvas coordinate to grid cell coordinates
            const cellX = Math.floor(x / gridSize);     //become the cell x-coordinate
            const cellY = Math.floor(y / gridSize);     //become the cell y-coordinate
            return `${cellX},${cellY}`;                 // return the key for the cell
        }, 
        getCellCenter: function(cellKey) {
            // convert cell key to canvas coordinates (center of cell)
            const [gridX, gridY] = cellKey.split(',').map(Number); // split the key and convert to number
            return {
                x: (gridX + 0.5) * gridSize,        // 0.5 because the grid center is in the middle of the cell
                y: (gridY + 0.5) * gridSize     // 0.5 because the grid center is in the middle of the cell 
            };
        }
    };
    
    // define contaminatedwaterbodies at the start
    const contaminatedWaterbodies = [
        { 
            x: canvas.width * 0.5,         // define x-center point
            y: canvas.height * 0.3,          // define y-center point
            radius: 30      // radius of the waterbody
        }
    ];


    // define clean waterbodies at the start
    const cleanWaterbodies = [
        { 
            x: canvas.width * 0.5,         // define x-center point
            y: canvas.height * 0.7,          // define y-center point
            radius: 30,      // radius of the waterbody
            isContaminated: false, // define if the waterbody is contaminated or not
            bacteria: 0, // define the bacteria count in the waterbody
            contaminationLevel: 0,         // visual representation of contamination (0 to 1)
            volume: 1000000 // define the volume of the waterbody in ml
        }
    ];

    // define bacteria counts for different agent state
    const bacteriaCounts = {
        susceptible: 12800,
        exposed: 19200,
        infected: 128000000,
        recovered: 0
    };

    // Function to store agent's initial characters
    function createAgent(){
        // Determine home position based on canvas size
        const houseX = Math.random() * (canvas.width / 3);      // define the house X coordinate
        const houseY = Math.random() * canvas.height;     // define the house y coordinate

        // determine work position based on canvas size
        const workX = (2/3 * canvas.width) + Math.random() * (canvas.width / 3);
        const workY = Math.random() * canvas.height;

        const agent =  {
            x: houseX,      // starting x position
            y: houseY,     // starting y position
            radius: 10,  // the agent cirle radius size
            house: {                      // Set the pixel location of house  
                x: houseX,     
                y: houseY      
            },
            work: {                       // Set the pixel location of work
                x: workX,       
                y: workY
            },
            speed: 3,  // movement speed in pixels/frame
            state: "susceptible", // initial state of SEIR
            statetimer: 0, // define how many secons in this current state
            bacteria: bacteriaCounts.susceptible, // define the iniitial bacteria count in the agent

            // store know waterbody location passed from the global variable contaminatedWaterbodies and cleanWaterbodies. 
            // define this to assign agent memory
            contaminatedWaterbodyLocation: {
                x: contaminatedWaterbodies[0].x, // x-coordinate of the contaminated waterbody
                y: contaminatedWaterbodies[0].y, // y-coordinate of the contaminated waterbody
                radius: contaminatedWaterbodies[0].radius // radius of the contaminated waterbody
            },
            cleanWaterbodiesLocation: {
                x: cleanWaterbodies[0].x, // x-coordinate of the clean waterbody
                y: cleanWaterbodies[0].y, // y-coordinate of the clean waterbody
                radius: cleanWaterbodies[0].radius // radius of the clean waterbody
            },

            // d-EPR specific properties
            visitedCells: {}, // object to store visited cells and visit counts
            uniqueVisitCount: 0, // count of unique cells visited (S in the d-EPR formula)
            currentTarget: null, // current movement target cell
            rho: 0.5, // exploration parameter (0 < rho < 1)
            gamma: 0.2, // return decay parameter (0 < gamma < 1)
        }

        // mark home location as visited, since the agent starts at home
        const homeCellKey = grid.getCellKey(agent.house.x, agent.house.y);
        agent.visitedCells[homeCellKey] = 1;        // mark the home cell as visited with a count of 1
        agent.uniqueVisitCount = 1;                 // update unique visit

        return agent;
    }


    // Create array to store the agent array value, 50 agents
    let agents = [];
    for (let i = 0; i < 20; i++) {
        agents.push(createAgent());
    }

    // function to check if the agent has reached its target
    function reachedTarget(agentInput) {
        if (!agentInput.currentTarget)  return true; // if no target, consider it reached

        // Calculate distance to the target
        const dx = agentInput.x - agentInput.currentTarget.x;
        const dy = agentInput.y - agentInput.currentTarget.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < agentInput.radius; // if distance is less than agent's radius, consider it reached
    }

    // function to move agent towards its target
    function moveTowardTarget(agentInput) {
        if (!agentInput.currentTarget) return; // if no target, do nothing

        // Calculate direction vector and the distance between the target and agent current position
        const dx = agentInput.currentTarget.x - agentInput.x;
        const dy = agentInput.currentTarget.y - agentInput.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Move agent towards target
        if (distance > 0) {
            agentInput.x += (dx / distance) * agentInput.speed; // calculate x direction by speed
            agentInput.y += (dy / distance) * agentInput.speed; // calculate y direction by speed
        }
    }

    // Declare function to choose new exploration target
    function chooseNewExplorationTarget(agentInput) {
        // get grid height and width
        const gridWidth = Math.ceil(canvas.width / gridSize); // calculate how many grid cells fit across (columns)
        const gridHeight = Math.ceil(canvas.height / gridSize); // calculate how many grid cells fit down (rows)

        // try to find unvisited cell
        let attempts = 0; // counter for attempts to find a new target
        while (attempts < 20 ) { // limit attemp to avoid infinity loop
            // generate random cell coordinates
            const gridX = Math.floor(Math.random() * gridWidth); // random x coordinate
            const gridY = Math.floor(Math.random() * gridHeight); // random y coordinate
            const cellKey = `${gridX},${gridY}`; // create cell key

            if (!agentInput.visitedCells[cellKey]) { // if the cell never been visited
                // return the center of the cell as the new target
                return grid.getCellCenter(cellKey);
            }
            attempts++;
        }

        // if all cells are visited, or could not find unvisited cell, return random cell
        const gridX = Math.floor(Math.random() * gridWidth);
        const gridY = Math.floor(Math.random() * gridHeight);
        return grid.getCellCenter(`${gridX},${gridY}`);
    }

    // function to choose return target
    function chooseReturnTarget(agentInput) {
        // Gett all cell that has been visited by the agent
        const visitedLocations = Object.keys(agentInput.visitedCells);

        // if no visited locations, return current position
        // this case shuld not happen in normal operation, but it's a safety check
        if (visitedLocations.length === 0) {
            return { x: agentInput.x, y: agentInput.y }; // return current position
        }

        // calculate total number of visits to all cells
        const totalVisits = Object.values(agentInput.visitedCells).reduce((sum, count) =>  sum + count, 0);

        // Choose random number between 0 and total visits
        let randomValue = Math.floor(Math.random() * totalVisits);

        // go through visited cells to find the target cell by subtracting each count until you go below zero
        for (const cellKey of visitedLocations) {
            randomValue -= agentInput.visitedCells[cellKey]; // subtract the visit count
            if (randomValue < 0) {
                // return the center of the cell as the target
                return grid.getCellCenter(cellKey);
            }
        }

        // Fallback to home
        console.log("Agent defaulting to return home");
        return agent.home;
    }

    // function to draw the scene
    function drawScene() {
        
        // Clear the entire canvas to start fresh
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw waterbodies
        drawWaterBodies()

        // Optional: Draw grid for debugging
        drawGrid();
        
        // Draw agent trails
        // agents.forEach(agent => {
        //     drawAgentTrail(agent);
        // });

        //Draw the agent and their house
        agents.forEach(agent => {
            drawHouse(agent);
            drawAgent(agent);
            drawWork(agent);
        });
    }

    // agent drawing function
    function drawAgent(agentInput) {
        ctx.beginPath();
        ctx.arc(agentInput.x, agentInput.y, agentInput.radius, 0, 2 * Math.PI);
        
        switch (agentInput.state) {
            case "susceptible":
                ctx.fillStyle = susceptibleColor;
                break;
            
            case "exposed":
                ctx.fillStyle = exposedColor;
                break;

            case "infected" :
                ctx.fillStyle = infectedColor;
                break;

            case "recovered" :
                ctx.fillStyle = recoveredColor;
                break;
        }

        ctx.fill();
        // ctx.strokeStyle = '#333';
        // ctx.lineWidth = 1;
        // ctx.stroke();
        ctx.closePath();
    }

    // Draw House
    function drawHouse(agentInput) {
        ctx.fillStyle = 'green'; // Set the color for the house
        ctx.fillRect(agentInput.house.x - 10, agentInput.house.y - 10, 20, 20); // Draw a square house
    }

    // Draw House
    function drawWork(agentInput) {
        ctx.fillStyle = 'brown'; // Set the color for the work
        ctx.fillRect(agentInput.work.x - 10, agentInput.work.y - 10, 20, 20); // Draw a square work
    }

    // Draw water bodies
    function drawWaterBodies() {
        // Draw contaminated waterbody
        for (const waterbodies of contaminatedWaterbodies) {
            ctx.beginPath();
            ctx.arc(waterbodies.x, waterbodies.y, waterbodies.radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'darkblue'; //choose the background colour
            ctx.fill();
            //ctx.stroke();
            ctx.closePath();
        }

        // Draw clean waterbody
        for (const waterbodies of cleanWaterbodies) {
            ctx.beginPath();
            ctx.arc(waterbodies.x, waterbodies.y, waterbodies.radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'lightblue'; //choose the background colour
            ctx.fill();
            //ctx.stroke();
            ctx.closePath();

            //if the waterbody has bacteria, draw a darker circle
            if (waterbodies.bacteria > 0) {
                ctx.beginPath();
                ctx.arc(waterbodies.x, waterbodies.y, waterbodies.radius * waterbodies.contaminationLevel, 0, 2 * Math.PI);
                ctx.fillStyle = 'darkblue'; // dark blue with transparency
                ctx.fill();
                ctx.closePath();
            }
        }
    }

    // Draw grid for debugging
    function drawGrid() {
        ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
        ctx.lineWidth = 0.5;
        
        // Draw vertical lines
        for (let x = 0; x <= canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal lines
        for (let y = 0; y <= canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    }

    // Draw visited cells with opacity based on visit count
    function drawAgentTrail(agent) {
        for (const cellKey in agent.visitedCells) {
            const center = grid.getCellCenter(cellKey);
            const visitCount = agent.visitedCells[cellKey];
            const maxOpacity = 0.7;
            const opacity = Math.min(maxOpacity, 0.1 + (visitCount / 20) * maxOpacity);
            
            ctx.fillStyle = `rgba(255, 200, 200, ${opacity})`;
            ctx.fillRect(
                center.x - gridSize/2, 
                center.y - gridSize/2, 
                gridSize, 
                gridSize
            );
        }
    }

    // update agent position or agent movement
    function updateAgentMovement(agentInput) {

        // if agent has no target or has reached the current target, choose a new target
        // d-EPR model implememntation
        if( !agentInput.currentTarget || reachedTarget(agentInput)) {
            // decide whether to explore or return based on d-EPR formula
            const pNew = agentInput.rho * Math.pow(agentInput.uniqueVisitCount, -agentInput.gamma); // calculate the probability of choosing a new target

            if (Math.random() < pNew) {
                // meaning EXPLORE: choose a new unvisited cell
                agentInput.currentTarget = chooseNewExplorationTarget(agentInput);
            } else {
                // meaning RETURN: choose a return target
                agentInput.currentTarget = chooseReturnTarget(agentInput);
            }
        }

        // Move towards the current target
        moveTowardTarget(agentInput);

        // track the current cell visitation
        const currentCellKey = grid.getCellKey(agentInput.x, agentInput.y); // get the current cell key based on agent's position
        if (!agentInput.visitedCells[currentCellKey]) { // if the cell has not been visited
            agentInput.visitedCells[currentCellKey] = 0; // initialize the visit count
            agentInput.uniqueVisitCount++; // increment unique visit count
        }
        agentInput.visitedCells[currentCellKey]++; // increment the visit count for the current cell
    }



    // Logic of agent SEIR state transition
    function updateAgentState(agentInput, deltaTime) {
        switch (agentInput.state) {
            case "exposed":
                agentInput.statetimer += deltaTime;
                if (agentInput.statetimer >= 3) {       // checking the condition where the agent have been int he exposed state more than 5 seconds
                    agentInput.state = "infected";      // change the state to infected
                    agentInput.bacteria = bacteriaCounts.infected; // update the bacteria count to infected
                    agentInput.statetimer = 0;          // Set the timer to 0 again
                }
                break;
            case "infected":
                agentInput.statetimer += deltaTime;
                if (agentInput.statetimer >= 4) {      // checking the condition where the agent have been in the infected state more than 10 seconds
                    agentInput.state = "recovered";     // change the state to recovered
                    agentInput.bacteria = bacteriaCounts.recovered; // update the bacteria count to recovered
                    agentInput.statetimer = 0;          // Set the timer to 0 again
                }
                break;
            case "recovered":
                agentInput.statetimer += deltaTime;
                if (agentInput.statetimer >= 50) {     // checking the condition where the agent have been int he recovered state more than 200 seconds
                    agentInput.state = "susceptible";   // change the state to susceptible
                    agentInput.bacteria = bacteriaCounts.susceptible; // update the bacteria count to susceptible
                    agentInput.statetimer = 0;          // Set the timer to 0 again
                }
                break;
        }
    }

    // Get the deltaTime to calculate how long the agent have been on that state
    let lastTime = performance.now();       // Define the lastTime object with timestamp from `performance.now()` for the initial value

    // Function to calculate deltaTime
    // This function calculates the time difference between the current frame and the last frame
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
            agentInput.bacteria = bacteriaCounts.exposed; // update the bacteria count to exposed
            agentInput.statetimer = 0;
        }
    }

    // contaminated waterbody threshold (bacteria/ml)
    const contaminatedWaterbodyThreshold = 1000;

    //function to updatebacteria count in clean waterbodies
    function updateCleanWaterbodyBacteria(agentInput) {
        for (const waterbody of cleanWaterbodies) {
            const dx = waterbody.x - agentInput.x // calculate the distance in x-axis
            const dy = waterbody.y - agentInput.y // calculate the distance in y-axis
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if agent touching waterbody
            if (distance  <=  agentInput.speed + waterbody.radius) {

                //console.log(`Before transfer - Agent state: ${agentInput.state}, Agent bacteria: ${agentInput.bacteria}, Water bacteria: ${waterbody.bacteria}`);

                // transfer bacteria in to the waterbody
                waterbody.bacteria += agentInput.bacteria; // add the bacteria count from agent to the waterbody

                //check if celanwaterbody got contaminated
                if (waterbody.bacteria > contaminatedWaterbodyThreshold * waterbody.volume) {
                    waterbody.isContaminated = true; // set the waterbody to contaminated
                }

                // calculate the contamination level (0 to 1) of the waterbody
                waterbody.contaminationLevel = Math.min ((waterbody.bacteria /  bacteriaCounts.infected) * 1000, 1);    // `Math.min()` is to decide which one is the smallest number, so if the bacteria exceed the threshold, the value will be 1. times 1000 to multiply the value so become more significant to draw radius circle

                console.log(`After transfer - Agent state: ${agentInput.state}, Agent bacteria: ${agentInput.bacteria}, Water bacteria: ${waterbody.bacteria}, contamination level: ${waterbody.contaminationLevel}, contaminated: ${waterbody.isContaminated}`);
            }
        }
    }
    

    // DRAWING STACKED CHART OVERTIME
    // Calling the chart canvas
    const chartCanvas = document.getElementById('chartCanvas');
    const chartCtx  = chartCanvas.getContext('2d');

    // store the simmulation starting time
    let simulationStartTime = performance.now();

    // create global array to store SEIR count over time
    const SEIRDataOverTime = [];

    // Function to cout SEIR states
    function countSEIRStates() {
        const count = {
            time: parseFloat(((performance.now() - simulationStartTime) / 1000).toFixed(2)), // this change milli second to second#
            susceptible: 0,
            exposed: 0,
            infected: 0,
            recovered: 0
        };

        // To count how may agent on each state
        for (const agent of agents) {
            count[agent.state]++;
        }
        SEIRDataOverTime.push(count);
        // console.log("SEIR Count at t =", count.time, count);

        // update DOM stats 
        document.getElementById('timeCount').textContent = count.time.toFixed(0);
        document.getElementById('susceptibleCount').textContent = count.susceptible;
        document.getElementById('exposedCount').textContent = count.exposed;
        document.getElementById('infectedCount').textContent = count.infected;
        document.getElementById('recoveredCount').textContent = count.recovered;

        return count;

    }

    // MAKE THE CHART
    function drawSEIRChart() {
        if (SEIRDataOverTime.length < 1 ) return;

        const width = chartCanvas.width;                // Define the Canvas width
        const height = chartCanvas.height;              // Define canvas Height
        const margin = 0;                              // 40 pixels

        chartCtx.clearRect(0, 0, width, height);        // Clear previous drawings

        const totalPopulation = agents.length;          // Define the total population variable with the length of 'agents' array
        const maxTime = SEIRDataOverTime[SEIRDataOverTime.length - 1].time;
        
        const xScale = (width - 2 * margin ) / maxTime;                 //defining the x-axis scales
        const yScale = (height -2 * margin ) / totalPopulation;         //defining the Y-axis scales

        // Calculate stacked value
        function getStackedValues(index) {
            const point = SEIRDataOverTime[index];
            
            // this will return record how many agent points on each stack 
            return {
                R: point.recovered,                                                             // will the bottom of the stack, of the top of overlaying
                RI: point.recovered + point.infected,                                           // will be the second layer from the front, so the stack will be behind "R" and when it stacked together with "R" it only show the value of "I"
                RIE: point.recovered + point.infected + point.exposed,                          // will be the third layer from the front, so the stack will be behind "RI" and when it stacked together with "RI" it only show the value of "E" sit on top of "I"
                REIS: point.recovered + point.infected + point.exposed + point.susceptible      // will be the second layer from the front, so the stack will be behind "RIE" and when it stacked together with "RIE" it only show the value of "S" sit on top of "E"
            };
        }

        // Draw one Coloured Area
        function drawArea(getYtop, getYbottom, colour) {
            
            chartCtx.beginPath();

            // draw the upper line (left to right)
            for (let i=0; i < SEIRDataOverTime.length; i++) {
                const t = SEIRDataOverTime[i].time;
                const x = margin + t * xScale;
                const y = height - margin - getYtop(i) * yScale;
                if (i === 0) {
                    chartCtx.moveTo(x,y);
                } else {
                    chartCtx.lineTo(x,y);
                }
            }

            // lower line (right to lext)
            for (let i = SEIRDataOverTime.length - 1; i>=0; i--) {
                const t = SEIRDataOverTime[i].time;
                const x = margin + t * xScale;
                const y = height - margin - getYbottom(i) * yScale;
                chartCtx.lineTo(x, y);
            }
            chartCtx.closePath();
            chartCtx.fillStyle = colour;
            //chartCtx.globalAlpha = 0.6;
            chartCtx.fill();
            //chartCtx.globalAlpha = 1.0;
        }

        // Draw all SEIR layer
        // for "recovered" state
        drawArea(i => getStackedValues(i).R, i => 0, recoveredColor)
        // for "Infected" state
        drawArea(i => getStackedValues(i).RI, i => getStackedValues(i).R, infectedColor)
        // for "exposed" state
        drawArea(i => getStackedValues(i).RIE, i => getStackedValues(i).RI, exposedColor)
        // for "Susceptible" state
        drawArea(i => getStackedValues(i).REIS, i => getStackedValues(i).RIE, susceptibleColor)

        // Define stroke line
        chartCtx.strokeStyle = "#333";              // Set the stroke (line) colour to dark grey (#333)
        chartCtx.lineWidth = 1;                     // Set the line thickness to 1 pixel

        // draw Y-axis
        chartCtx.beginPath();                       // Start a new drawing path
        chartCtx.moveTo(margin, margin);            // Move the pen to the top-left corner of the plot area (left margin, top margin)
        chartCtx.lineTo(margin, height - margin);   // Draw a vertical line down to the bottom-left corner of the plot area
        chartCtx.stroke();                          // Render the vertical line on the canvas

        // draw x-axis
        chartCtx.beginPath();                       // Start a new drawing path
        chartCtx.moveTo(margin, height - margin);   // Move the pen to the bottom-left corner of the plot area
        chartCtx.lineTo(width - margin, height - margin); // Draw a horizontal line to the bottom-right corner of the plot area
        chartCtx.stroke();                          // Render the horizontal line on the canvas

    }

    // How often in second the log SEIR counts
    const logInterval = 0.5; //in second
    let timeAccumulator = 0; // set initial time



    // Store the ID of the current animation frame
    let animationId = null; 

    // Render the canvas in loop
    function animate(currentTime) {
        const deltaTime = getDeltaTime(currentTime)     // to calculate the deltaTime

        agents.forEach(agent => {
            changeToExposed(agent);                         // to change from susceptible to exposed
            updateAgentMovement(agent);                     // to call control agent movement
            updateAgentState(agent, deltaTime);             // to change the SEIR state
            updateCleanWaterbodyBacteria(agent);            // to update the clean waterbody bacteria count
        })
        
        drawScene();   

        // call to count SEIR data over time
        timeAccumulator += deltaTime;                   // to calculate how long the simulation running
        if (timeAccumulator >= logInterval){
            countSEIRStates();                          // calling the function to log the SEIR count
            drawSEIRChart();  // <-- draw chart here
            timeAccumulator = 0;
        }

        
        animationId = requestAnimationFrame(animate);                 // To schedule next frame (re-run animation) before processing and capture the ID  
    }

    //declare reset function
    function reset() {
        console.log("resetting simulation");

        // recreate agents array 
        agents = [];
        for (let i = 0; i < 50; i++){
            agents.push(createAgent())
        }

        // Reset contaminated waterbodies
        // Reset clean waterbodies
        for (const waterbody of cleanWaterbodies) {
            waterbody.bacteria = 0;
            waterbody.isContaminated = false;
            waterbody.contaminationLevel = 0;
        }

        // Reset timing variables -- basically decalring everyting to null or zero again 
        simulationStartTime = performance.now();
        SEIRDataOverTime.length = 0;
        timeAccumulator = 0;
        lastTime = performance.now();


        // Reset UI counters
        document.getElementById('timeCount').textContent = '0';
        document.getElementById('susceptibleCount').textContent = '0';
        document.getElementById('exposedCount').textContent = '0';
        document.getElementById('infectedCount').textContent = '0';
        document.getElementById('recoveredCount').textContent = '0';       
    }

    // Declare start function
    function start() {
        console.log("Starting Simulation");

        // Stop any existing animation first! y canceling the animation request
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        // calling the reset function
        reset();

        // start the animation
        animationId = requestAnimationFrame(animate);
    }

    // Declare stop function
    function stop() {   

        // Cancel Animation loop if running or the animationId is not not null
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId=null;
            console.log("Stopping simulation");
        }

        // Clear the entire canvas to start fresh
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }


    window.sim_depr_mobility = { 
        start, 
        stop,
        reset // Optional but useful for debugging
    };


})();