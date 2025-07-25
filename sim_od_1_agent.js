(function(){

    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d');

    // Get the variable color from CSS file
    const style = getComputedStyle(document.documentElement);
    const susceptibleColor = style.getPropertyValue('--susceptible-color');
    const exposedColor = style.getPropertyValue('--exposed-color');
    const infectedColor = style.getPropertyValue('--infected-color');
    const recoveredColor = style.getPropertyValue('--recovered-color');

    // Declare one agent object
    const agent = {
        x: 0,                         // initial agent x-coordinate, will be set to the house.x later
        y: 0,                         // initial Agent location y-coordinate, will be set to the house.y later
        house: {                      // Set the pixel location of house  
            x: Math.random() * (canvas.width / 3),            // Randomise the x-coordinate for house onleft third part of the canvas
            y: Math.random() * canvas.clientHeight      // randomise the y-coordinate for house
        },        
        work: {
            x: (2/3 * canvas.width) + Math.random() * (canvas.width / 3),            // Randomise the x-coordinate for work on right third part of the canvas
            y: Math.random() * canvas.clientHeight      // randomise the y-coordinate for work
        },         // Set the pixel location of work
        target: 'work',                 // Set the initial target
        speed: 3.5                      // movement speed in pixels/frame
    }


    // Set Agent starting point from house
    agent.x = agent.house.x;
    agent.y = agent.house.y;

    // Agent movement and position logic
    function updateAgentMovement() {
        const target = agent.target === 'work' ? agent.work : agent.house;

        const dx = target.x - agent.x;
        const dy = target.y - agent.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if(distance > agent.speed) {
            agent.x += (dx / distance) * agent.speed;       // to find new x posiiton. (dx / distance) is cos -> cos * agent.speed = x-coordinate position
            agent.y += (dy / distance) * agent.speed;       // to find new y posiiton. (dy / distance) is sin -> sin * agent.speed = y-coordinate position
        } else {
            agent.target = agent.target === 'work' ? 'house' : 'work';
        }
    }

    function drawScene() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw house
        ctx.fillStyle = 'green';
        ctx.fillRect(agent.house.x-5, agent.house.y, 20, 20);           // agent.house.x is the center pixel of the house, `-5` is because the house size is 10 pixels so the starting point to draw the rectangle should be reduce by half of the pixels size

        // draw work
        ctx.fillStyle = 'red';
        ctx.fillRect(agent.work.x - 5, agent.work.y , 20, 20);

        // draw Agent 
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = susceptibleColor;
        ctx.fill();
        ctx.closePath();
    }

    // create object to store animation Id
    let animationId = null;

    // Declare animation function
    function animate() {
        updateAgentMovement()
        drawScene()

        animationId = requestAnimationFrame(animate);
    }

    // Create reset function
    function reset() {
        agent.x = agent.house.x;
        agent.y = agent.house.y;
        agent.target = "work";
    }

    function start() {
        console.log("Starting Simulation");

        // Cancel Animation loop if running or the animationId is not not null
        if (animationId != null){
            cancelAnimationFrame(animationId);
            animationId = null;
        }

        // calling the reset function
        reset();
        animationId = requestAnimationFrame(animate)
    }

    // Declare stop function
    function stop() {

        // Cancel Animation loop if running or the animationId is not not null
        if (animationId != null) {
            cancelAnimationFrame(animationId);
            animationId=null;
            console.log("Stopping simulation");
        }

        // Clear simulation canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Clear chart canvas
        // const chartCtx = chartCanvas.getContext('2d');
        // chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    }

    window.sim_od_agent = {start, stop, reset};

})();