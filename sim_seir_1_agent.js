(function() {

    const canvas = document.getElementById('simCanvas')
    const ctx = canvas.getContext('2d');

    // Get the variable color from CSS file
    const style = getComputedStyle(document.documentElement);
    const susceptibleColor = style.getPropertyValue('--susceptible-color');
    const exposedColor = style.getPropertyValue('--exposed-color');
    const infectedColor = style.getPropertyValue('--infected-color');
    const recoveredColor = style.getPropertyValue('--recovered-color');

    // define waterbodies at the start
    const contaminatedWaterbodies = [
        { 
            x: canvas.width * 0.1,         // define x-center point
            y: canvas.height * 0.5,          // define y-center point
            radius: 40      // radius of the waterbody
        }
    ];

    // Function to store agent's initial characters
    function createAgent(){
        return {
            x: canvas.height * 0.7,      // starting x position
            y: canvas.height * 0.5,     // starting y position 
            radius: 15,  // the agent cirle radius size
            vx: -2.5,      // velocity in x (pixels per frame), random velocity between -4 and +4
            vy: 0,      // velocity in y (pixels per frame), random velocity between -4 and +4   
            state: "susceptible", // initial state of SEIR
            statetimer: 0, // define how many secons in this current state
        }
    }

    // Create array to store the agent array value, 50 agents
    let agents = [];
    for (let i = 0; i < 1 ; i++) {
        agents.push(createAgent());
    }

    // function to draw the scene
    function drawScene() {
        
        // Clear the entire canvas to start fresh
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw timeline markers first (so they appear behind other elements)
        drawTimelineMarkers();

        // Draw contaminated waterbody
        for (const waterbodies of contaminatedWaterbodies) {
            ctx.beginPath();
            ctx.arc(waterbodies.x, waterbodies.y, waterbodies.radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'darkblue'; //choose the background colour
            ctx.fill();
            //ctx.stroke();
            ctx.closePath();
        }

        //Draw the agent
        agents.forEach(drawAgent);
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
        
        // make agent bounce back after recovered state
        if (agentInput.x >= canvas.width*0.92 - agentInput.radius) {
            agentInput.vx *= -1;
            agentInput.state = "susceptible"; // reset the state to susceptible
            agentInput.statetimer = 0; // reset the state timer
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
                if (agentInput.statetimer >= 0.8) {       // checking the condition where the agent have been int he exposed state more than 5 seconds
                    agentInput.state = "infected";      // change the state to infected
                    agentInput.statetimer = 0;          // Set the timer to 0 again
                }
                break;
            case "infected":
                agentInput.statetimer += deltaTime;
                if (agentInput.statetimer >= 1.6) {      // checking the condition where the agent have been in the infected state more than 10 seconds
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

    // Function to calculate deltaTime
    // This function calculates the time difference between the current frame and the last frame
    function getDeltaTime(currentTimeInput) {
        let deltaTime = (currentTimeInput - lastTime) / 1000;       // divided to 1000 to change the unit of deltaTime from milisecond to second
        lastTime = currentTimeInput;                                // Assign new lastTime with currentTime for the next frame calculation
        return deltaTime;                                           // Return the result of deltatime
    }

    // Draw timeline markers
    function drawTimelineMarkers() {
        // Get the agent's current state
        const agentState = agents[0].state; // agents[0] Assuming we are only drawing for the first agent
        
        // get the agent's position
        const agentX = agents[0].x; 

        // Only draw markers if agent is not in susceptible state
        if (agentState === "susceptible" && agentX < canvas.width * 0.45) {
            return; // Don't draw any markers
        }

        const markerData = [
            { day: "Day 0", x: canvas.width * 0.1 + 40, state: "Exposed" },   // Near contaminated water
            { day: "Day 5", x: canvas.width * 0.30, state: "Infected" },  // Somewhere along the path
            { day: "Day 15", x: canvas.width * 0.6, state: "Recovered" },  // Mid-recovery
            { day: "Day 215", x: canvas.width * 0.90, state: "Susceptible" } // End of cycle
        ];

        // Filter markers based on agent's current state
        // make a new array to store visible markers
        let visibleMarkers = [];
        
        // Filter markers based on the agent's current state
        if (agentState === "exposed") {
            visibleMarkers = [markerData[0]]; // Only show exposed marker
        } else if (agentState === "infected") {
            visibleMarkers = [markerData[0], markerData[1]]; // Only show exposed marker and infected marker
        } else if (agentState === "recovered") {
            visibleMarkers = [markerData[0], markerData[1], markerData[2]]; // Only show exposed, infected, and recovered marker
        } else if (agentState === "susceptible" && agentX > canvas.width * 0.75) {
            visibleMarkers = markerData; // Show all markers
        }
        
        ctx.font = "bold 16px Arial";
        //ctx.fillStyle = "#333"; //to colour the text
        ctx.textAlign = "center";
        
        // Draw each marker
        visibleMarkers.forEach(marker => {
            // Draw vertical line
            ctx.beginPath();
            ctx.strokeStyle = "#888";
            ctx.setLineDash([5, 3]); // Dashed line
            ctx.moveTo(marker.x, canvas.height * 0.5 - 45);
            ctx.lineTo(marker.x, canvas.height * 0.5 + 45);
            ctx.stroke();
            ctx.setLineDash([]); // Reset to solid line

            // Set text color based on state
            switch (marker.state) {
                case "Susceptible":
                    ctx.fillStyle = susceptibleColor;
                    break;
                case "Exposed":
                    ctx.fillStyle = exposedColor;
                    break;
                case "Infected":
                    ctx.fillStyle = infectedColor;
                    break;
                case "Recovered":
                    ctx.fillStyle = recoveredColor;
                    break;
                default:
                    ctx.fillStyle = "#333";
            }
            
            // Draw day text
            ctx.fillText(marker.day, marker.x, canvas.height * 0.5 - 65);
            ctx.fillText(marker.state, marker.x, canvas.height * 0.5 - 50);
        });
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


    // DRAWING STACKED CHART OVERTIME
    // Calling the chart canvas
    const chartCanvas = document.getElementById('chartCanvas');
    const chartCtx  = chartCanvas.getContext('2d');

    // store the simmulation starting time
    let simulationStartTime = performance.now();

    // create global array to store SEIR count over time
    const SEIRDataOverTime = [];

    // How often in second the log SEIR counts
    const logInterval = 0.1; //in second
    let timeAccumulator = 0; // set initial time


    // Store the ID of the current animation frame
    let animationId = null; 

    // Render the canvas in loop
    function animate(currentTime) {
        const deltaTime = getDeltaTime(currentTime)     // to calculate the deltaTime

        agents.forEach(agent => {
            changeToExposed(agent);                         // to change from susceptible to exposed
            updateAgentMovement(agent);                     // to call control agent movement
            updateAgentState(agent, deltaTime);             // to chaneg the SEIR state
        })
        
        drawScene();   
        
        animationId = requestAnimationFrame(animate);                 // To schedule next frame (re-run animation) before processing and capture the ID  
    }

    //declare reset function
    function reset() {
        console.log("resetting simulation");

        // recreate agents array 
        agents = [];
        for (let i = 0; i < 1; i++){
            agents.push(createAgent())
        }

        // Reset timing variables -- basically decalring everyting to null or zero again 
        // simulationStartTime = performance.now();
        // SEIRDataOverTime.length = 0;
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


    window.sim_seir_1_agent = { 
        start, 
        stop,
        reset // Optional but useful for debugging
    };


})();