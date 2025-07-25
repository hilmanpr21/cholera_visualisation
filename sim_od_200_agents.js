(function() {
    
    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d');

    // Get the variable color from CSS file
    const style = getComputedStyle(document.documentElement);
    const susceptibleColor = style.getPropertyValue('--susceptible-color');
    const exposedColor = style.getPropertyValue('--exposed-color');
    const infectedColor = style.getPropertyValue('--infected-color');
    const recoveredColor = style.getPropertyValue('--recovered-color');


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

    // create array of agents
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
        ctx.fillStyle = susceptibleColor;
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


    // Create object to stroe animation frame ID
    let animationId = null; 

    // Declare animation function
    function animate() {
        agents.forEach(agent => {
            updateAgentMovement(agent)
        })
        drawScene()

        animationId = requestAnimationFrame(animate);
    }

    //declare reset function
    function reset() {

        console.log("resetting simulation");

        // recreate array of agents
        agents = [];    // declare empty array
        for (let i = 0; i < 100; i++) {
            agents.push(createAgent())
        }
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

        // 
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

        // Clear simulation canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Clear chart canvas
        const chartCtx = chartCanvas.getContext('2d');
        chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    }


    window.sim_od_200_agents = { 
        start, 
        stop,
        reset // Optional but useful for debugging
    };

})();