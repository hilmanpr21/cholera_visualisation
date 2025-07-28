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

    // define contaminatedwaterbodies at the start
    const contaminatedWaterbodies = [
        { 
            x: canvas.width * 0.2,         // define x-center point
            y: canvas.height * 0.5,          // define y-center point
            radius: 40      // radius of the waterbody
        }
    ];


    // define clean waterbodies at the start
    const cleanWaterbodies = [
        { 
            x: canvas.width * 0.8,         // define x-center point
            y: canvas.height * 0.5,          // define y-center point
            radius: 40,      // radius of the waterbody
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
        return {
            x: canvas.width * 0.45,      // starting x position
            y: canvas.height * 0.5,     // starting y position 
            radius: 15,  // the agent cirle radius size
            vx: 2.5,      // velocity in x (pixels per frame), random velocity between -4 and +4
            vy: 0,      // velocity in y (pixels per frame), random velocity between -4 and +4   
            state: "susceptible", // initial state of SEIR
            statetimer: 0, // define how many secons in this current state
            bacteria: bacteriaCounts.susceptible // define the iniitial bacteria count in the agent
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

        // draw waterbodies
        drawWaterBodies()

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
        
        // bounce when agent touch clean waterbodies
        for (const waterbodies of cleanWaterbodies) {
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

        // logic to bounce in the middle
        if (agentInput.state === "infected" && agentInput.x <= canvas.width * 0.5) {
            // if the agent is infected and touching clean water, bounce back
            agentInput.vx *= -1;
        } else if (agentInput.state === "recovered" && agentInput.x <= canvas.width * 0.5) {
            // if the agent is exposed and touching contaminated water, bounce back
            agentInput.vx *= -1;
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
                if (agentInput.statetimer >= 3) {      // checking the condition where the agent have been in the infected state more than 10 seconds
                    agentInput.state = "recovered";     // change the state to recovered
                    agentInput.bacteria = bacteriaCounts.recovered; // update the bacteria count to recovered
                    agentInput.statetimer = 0;          // Set the timer to 0 again
                }
                break;
            case "recovered":
                agentInput.statetimer += deltaTime;
                if (agentInput.statetimer >= 200) {     // checking the condition where the agent have been int he recovered state more than 200 seconds
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
            const dx = agentInput.x - waterbody.x
            const dy = agentInput.y - waterbody.y
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if agent touching waterbody
            if (distance <= waterbody.radius + agentInput.radius) {

                // console.log(`Before transfer - Agent state: ${agentInput.state}, Agent bacteria: ${agentInput.bacteria}, Water bacteria: ${waterbody.bacteria}`);

                // transfer bacteria in to the waterbody
                waterbody.bacteria += agentInput.bacteria; // add the bacteria count from agent to the waterbody

                //check if celanwaterbody got contaminated
                if (waterbody.bacteria > contaminatedWaterbodyThreshold * waterbody.volume) {
                    waterbody.isContaminated = true; // set the waterbody to contaminated
                }

                // calculate the contamination level (0 to 1) of the waterbody
                waterbody.contaminationLevel = Math.min ((waterbody.bacteria /  bacteriaCounts.infected) * 1000, 1);    // `Math.min()` is to decide which one is the smallest number, so if the bacteria exceed the threshold, the value will be 1. times 1000 to multiply the value so become more significant to draw radius circle

                // console.log(`After transfer - Agent state: ${agentInput.state}, Agent bacteria: ${agentInput.bacteria}, Water bacteria: ${waterbody.bacteria}, contamination level: ${waterbody.contaminationLevel}, contaminated: ${waterbody.isContaminated}`);
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
            updateAgentState(agent, deltaTime);             // to change the SEIR state
            updateCleanWaterbodyBacteria(agent);            // to update the clean waterbody bacteria count
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

        // Reset contaminated waterbodies
        // Reset clean waterbodies
        for (const waterbody of cleanWaterbodies) {
            waterbody.bacteria = 0;
            waterbody.isContaminated = false;
            waterbody.contaminationLevel = 0;
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


    window.sim_waterbody_to_contaminated_waterbody = { 
        start, 
        stop,
        reset // Optional but useful for debugging
    };


})();