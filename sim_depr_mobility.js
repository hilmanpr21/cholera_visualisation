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

    // Time management system for Daily Schedule
    const timeManager = {
        scheduleStartTime: 5,           // Start schedule at 5am instead of midnight
        currentSimulationTime: 0,
        timeScale: 1,                   // how many hour per second

        getCurrentHour: function() {
            return Math.floor((this.currentSimulationTime * this.timeScale) + this.scheduleStartTime) % 24; // Get current hour (0-23) starting from 3am
        },

        update: function(deltaTime) {
            this.currentSimulationTime += deltaTime;    // Update current simulation time
        },

        reset: function() {
            this.currentSimulationTime = 0;
        },

        getTimeString: function() {
            const hour = this.getCurrentHour();
            return `${hour.toString().padStart(2, '0')}:00`;  // Format: HH:MM for the time
        }
    }

    // declare function to display current simulation time
    function displaySimulationTime() {
        const timeString = timeManager.getTimeString();
        const hour = timeManager.getCurrentHour();

        // Get the existing elements from HTML
        let timeDisplay = document.getElementById('timeCount');
        let periodDisplay = document.getElementById('activityPeriodTime');

        // Show time with period indicator
        let period = '';
        if (hour >= 23 || hour < 5 ) period = 'Home';
        else if ( hour > 5 && hour < 9 ) period = 'Morning mobility';
        else if ( hour >= 9 && hour < 15 ) period = 'Work';
        else if ( hour >= 15 && hour < 23 ) period = 'Evening Mobility';

        // Update both display elements separately
        timeDisplay.innerHTML = timeString;
        periodDisplay.innerHTML = period;

        console.log(`Current time: ${timeString}, Period: ${period}`); // Log the current time and period
    }

    // declare function for scheduling
    function getCurrentScheduleMode(hourInput) {
        if (hourInput >= 23 || hourInput < 5 ) return 'atHome';
        if (hourInput >= 5 && hourInput < 9 ) return 'deprMobile';
        if (hourInput >= 9 && hourInput < 15 ) return 'atWork';
        if (hourInput >= 15 && hourInput < 23 ) return 'deprMobile';
        return 'deprMobile';        // as a fallback 
    }
    
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

    // Track which grid cells are occupied by buildings
    const occupiedGridCells = new Set();

    // Function to get a free grid cell and mark it as occupied
    function getAvailableGridCell(minGridX, maxGridX, minGridY, maxGridY) {
        const attempts = 100; // Max attempts to find a free cell
        
        for (let i = 0; i < attempts; i++) {
            // Generate random grid coordinates within the specified range
            const gridX = minGridX + Math.floor(Math.random() * (maxGridX - minGridX + 1));
            const gridY = minGridY + Math.floor(Math.random() * (maxGridY - minGridY + 1));
            const cellKey = `${gridX},${gridY}`;
            
            // Check if this grid cell is free
            if (!occupiedGridCells.has(cellKey)) {
                // Mark this cell as occupied
                occupiedGridCells.add(cellKey);
                
                // Return the center coordinates of this grid cell
                const centerX = (gridX + 0.5) * gridSize;
                const centerY = (gridY + 0.5) * gridSize;
                
                return { x: centerX, y: centerY };
            }
        }
        
        // Fallback if no free cell found
        console.warn("No free grid cell found, using fallback position");
        const fallbackX = (minGridX + Math.random() * (maxGridX - minGridX)) * gridSize + gridSize/2;
        const fallbackY = (minGridY + Math.random() * (maxGridY - minGridY)) * gridSize + gridSize/2;
        return { x: fallbackX, y: fallbackY };
    }

    // Function to store agent's initial characters
    function createAgent(){
        // Calculate grid boundaries for house area (left middle section)
        const houseMinGridX = Math.floor((canvas.width * 0) / gridSize);  // 0% from left
        const houseMaxGridX = Math.floor((canvas.width * 0.4) / gridSize);  // 40% from left
        const houseMinGridY = Math.floor((canvas.height * 0) / gridSize); // 0% from top
        const houseMaxGridY = Math.floor((canvas.height * 1) / gridSize); // 100% from top
        
        // Calculate grid boundaries for work area (right middle section)
        const workMinGridX = Math.floor((canvas.width * 0.6) / gridSize);   // 60% from left
        const workMaxGridX = Math.floor((canvas.width * 1) / gridSize);   // 90% from left
        const workMinGridY = Math.floor((canvas.height * 0) / gridSize);  // 0% from top
        const workMaxGridY = Math.floor((canvas.height * 1) / gridSize);  // 100% from top

        // Get available grid cells for house and work
        const housePosition = getAvailableGridCell(houseMinGridX, houseMaxGridX, houseMinGridY, houseMaxGridY);
        const workPosition = getAvailableGridCell(workMinGridX, workMaxGridX, workMinGridY, workMaxGridY);
        
        const houseX = housePosition.x;
        const houseY = housePosition.y;
        const workX = workPosition.x;
        const workY = workPosition.y;

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

            // scheduler specific properties
            scheduleMode: 'atHome', // start scheduling mode at home
            previousMode: null,     // to track mode changes

            // d-EPR state preservation for smooth transition between mode
            deprState: {
                savedTarget: null,      // Save d-epr target when entering home/work mode
                wasExploring: false     // remember if agemt was exploring 
            },
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

            if (!agentInput.visitedCells[cellKey]) { // check if the cell never been visited
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
        // Get all cell that has been visited by the agent
        const visitedLocations = Object.keys(agentInput.visitedCells);

        // if no visited locations, return current position
        // this case should not happen in normal operation, but it's a safety check
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

    // function to move agent to specific location (like home or work)
    function moveTowardsLocation(agentInput, targetLocationInput) {
        // Calculate distance between current position with the target location
        const dx = targetLocationInput.x - agentInput.x;
        const dy = targetLocationInput.y - agentInput.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // Agent not at target position yet - move towards target location
            agentInput.x += (dx / distance) * agentInput.speed;                
            agentInput.y += (dy / distance) * agentInput.speed;
        } 
        // else: Agent is already at target position (distance = 0) - stop moving
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

    // Function to handle d-EPR mmovement 
    function handleDEPMovement(agentInput) {

        // If agent is at home or work Aand moved back to depr mobility mode
        if (!agentInput.currentTarget && agentInput.deprState.savedTarget) {
            agentInput.currentTarget = agentInput.deprState.savedTarget;
            agentInput.deprState.savedTarget = null;                            // clear the caved target again
        }

        // if agent has no target or has reached the current target, choose a new target
        // d-EPR model implementation
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
        moveTowardsLocation(agentInput, agentInput.currentTarget);

        // track the current cell visitation
        const currentCellKey = grid.getCellKey(agentInput.x, agentInput.y); // get the current cell key based on agent's position
        if (!agentInput.visitedCells[currentCellKey]) { // if the cell has not been visited
            agentInput.visitedCells[currentCellKey] = 0; // initialize the visit count
            agentInput.uniqueVisitCount++; // increment unique visit count
        }
        agentInput.visitedCells[currentCellKey]++; // increment the visit count for the current cell
    }

    // Function to update agent movement based on schedule
    function updateAgentMovement(agentInput) {
        // get current schedule mode based on time
        const currentHour = timeManager.getCurrentHour();
        const newMode = getCurrentScheduleMode(currentHour); 

        // Handle mode transition
        // check if agent is changing from atHome or atWork to DEPR mobility
        // `agentInput.scheduleMode` is agent mode in previous frame
        if (agentInput.scheduleMode !== newMode) {
            //save d-EPR state when leaving mobile mode
            // if previously agent is in D-EPR mobility mode
            if (agentInput.scheduleMode === 'deprMobile') {
                // save the current target and state
                agentInput.deprState.savedTarget = agentInput.currentTarget; // save the current target in the `savedTarget` to be recalled later
                agentInput.deprState.wasExploring = true; // mark that agent was exploring
            }

            agentInput.previousMode = agentInput.scheduleMode;  // save the previous mode before changing
            agentInput.scheduleMode = newMode;                  // set the agent mode from the new mode
            agentInput.currentTarget = null;                    // reset the current target when changing mode
        }

        // Helper function to check if agent is close enough to target to stop moving
        function isAtTarget(agent, target) {
            const dx = target.x - agent.x;
            const dy = target.y - agent.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= agent.speed; // If distance is less than or equal to speed, consider agent "at" target
        }

        // execute movement based on  current schedule mode
        switch (agentInput.scheduleMode) {
            case 'atHome':
                // Only move if agent is not already at home
                // check if agent is not at home, so move towards home
                if (!isAtTarget(agentInput, agentInput.house)) {
                    moveTowardsLocation(agentInput, agentInput.house); // move towards home
                }
                // else: agent is at home, stay still (no movement)
                break;
            
            case 'atWork':
                // Only move if agent is not already at work
                // check if a
                if (!isAtTarget(agentInput, agentInput.work)) {
                    moveTowardsLocation(agentInput, agentInput.work); // move towards work
                }
                // else: agent is at work, stay still (no movement)
                break;

            case 'deprMobile':
                handleDEPMovement(agentInput); // handle d-EPR movement
                break;

            default:
                // fallback to d-EPR if something goes wrong
                handleDEPMovement(agentInput);
                break;
        }
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
            return distance <= waterbodies.radius + agentInput.radius;
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
            if (distance  <=  agentInput.radius + waterbody.radius) {

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
        // document.getElementById('timeCount').textContent = count.time.toFixed(0);
        document.getElementById('susceptibleCount').textContent = count.susceptible;
        document.getElementById('exposedCount').textContent = count.exposed;
        document.getElementById('infectedCount').textContent = count.infected;
        document.getElementById('recoveredCount').textContent = count.recovered;

        return count;

    }

    // MAKE THE CHART
    function drawSEIRChart() {
        if (SEIRDataOverTime.length < 0 ) return;

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

        // Update simulation time
        timeManager.update(deltaTime);
        
        // Update time display
        displaySimulationTime();
        
        
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

        // Clear occupied grid cells so new buildings can be placed
        occupiedGridCells.clear();

        // recreate agents array 
        agents = [];
        for (let i = 0; i < 2; i++){
            agents.push(createAgent())
        }

        // Reset time manager when simulation resets
        timeManager.reset();

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