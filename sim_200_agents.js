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


    // function to draw the scene
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
        
        //Draw the 100 agent
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
            updateAgentState(agent, deltaTime);             // to chaneg the SEIR state
        })
        
        drawScene();   
        
        //countSEIRStates();                          // calling the function to log the SEIR count
        // drawSEIRChart();

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
        for (let i = 0; i < 100; i++){
            agents.push(createAgent())
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


        // Clear the entire canvas to start fresh
        chartCtx.clearRect(0, 0, canvas.width, canvas.height);


    }


    window.sim_200_agents = { 
        start, 
        stop,
        reset // Optional but useful for debugging
    };


})();