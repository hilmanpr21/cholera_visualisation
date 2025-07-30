(function() {
    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d');

    // Get the variable color from CSS file
    const style = getComputedStyle(document.documentElement);
    const susceptibleColor = style.getPropertyValue('--susceptible-color');
    const exposedColor = style.getPropertyValue('--exposed-color');
    const infectedColor = style.getPropertyValue('--infected-color');
    const recoveredColor = style.getPropertyValue('--recovered-color');

    // Grid system settings
    const gridSize = 50; // 50x50 pixel cells
    let showGrid = false; // Toggle grid visibility
    let showTrails = true; // Toggle trail visibility

    // Grid utility functions
    const grid = {
        cells: {}, // Will store visited cells by agent ID
        getCellKey: function(x, y) {
            // Convert canvas coordinates to grid cell coordinates
            const gridX = Math.floor(x / gridSize);
            const gridY = Math.floor(y / gridSize);
            return `${gridX},${gridY}`;
        },
        getCellCenter: function(cellKey) {
            // Convert cell key back to canvas coordinates (center of cell)
            const [gridX, gridY] = cellKey.split(',').map(Number);
            return {
                x: (gridX + 0.5) * gridSize,
                y: (gridY + 0.5) * gridSize
            };
        },
        getRandomCell: function() {
            const gridWidth = Math.ceil(canvas.width / gridSize);
            const gridHeight = Math.ceil(canvas.height / gridSize);
            const gridX = Math.floor(Math.random() * gridWidth);
            const gridY = Math.floor(Math.random() * gridHeight);
            return `${gridX},${gridY}`;
        }
    };

    // Define water bodies
    const contaminatedWaterbodies = [
        { 
            x: canvas.width * 0.2,         // define x-center point
            y: canvas.height * 0.5,        // define y-center point
            radius: 40                      // radius of the waterbody
        }
    ];

    const cleanWaterbodies = [
        { 
            x: canvas.width * 0.8,         // define x-center point
            y: canvas.height * 0.5,        // define y-center point
            radius: 40,                     // radius of the waterbody
            isContaminated: false,          // define if the waterbody is contaminated or not
            bacteria: 0,                    // define the bacteria count in the waterbody
            contaminationLevel: 0,          // visual representation of contamination (0 to 1)
            volume: 1000000                 // define the volume of the waterbody in ml
        }
    ];

    // Define bacteria counts for different agent states
    const bacteriaCounts = {
        susceptible: 12800,
        exposed: 19200,
        infected: 128000000,
        recovered: 0
    };

    // Contamination threshold (bacteria/ml)
    const contaminatedWaterbodyThreshold = 1000;

    // Create an agent with d-EPR mobility model properties
    function createAgent() {
        // Determine home location (left side of canvas)
        const homeX = Math.random() * (canvas.width * 0.3);
        const homeY = Math.random() * canvas.height;
        
        // Determine work location (right side of canvas)
        const workX = canvas.width * 0.7 + Math.random() * (canvas.width * 0.3);
        const workY = Math.random() * canvas.height;
        
        const agent = {
            // Basic properties
            x: homeX,
            y: homeY,
            radius: 15,
            speed: 2.5,
            state: "susceptible",
            statetimer: 0,
            bacteria: bacteriaCounts.susceptible,
            
            // d-EPR specific properties
            visitedCells: {},
            uniqueVisitCount: 0,
            currentTarget: null,
            rho: 0.6,      // Exploration parameter
            gamma: 0.2,    // Memory parameter
            lastBacteriaTransfer: 0,
            
            // Important locations
            home: { x: homeX, y: homeY },
            work: { x: workX, y: workY },
            cleanWaterbody: { 
                x: cleanWaterbodies[0].x, 
                y: cleanWaterbodies[0].y 
            },
            contaminatedWaterbody: { 
                x: contaminatedWaterbodies[0].x, 
                y: contaminatedWaterbodies[0].y 
            }
        };
        
        // Mark home cell as visited
        const homeCellKey = grid.getCellKey(agent.home.x, agent.home.y);
        agent.visitedCells[homeCellKey] = 1;
        agent.uniqueVisitCount = 1;
        
        return agent;
    }

    // Create array to store agents
    let agents = [];
    for (let i = 0; i < 10; i++) {
        agents.push(createAgent());
    }

    // Function to check if agent has reached its target
    function reachedTarget(agent) {
        if (!agent.currentTarget) return true;
        
        const dx = agent.currentTarget.x - agent.x;
        const dy = agent.currentTarget.y - agent.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        return distance < agent.speed;
    }

    // Function to move agent toward its target
    function moveTowardTarget(agent) {
        if (!agent.currentTarget) return;
        
        const dx = agent.currentTarget.x - agent.x;
        const dy = agent.currentTarget.y - agent.y;
        const distance = Math.sqrt(dx*dx + dy*dy);
        
        if (distance < agent.speed) {
            // If close enough, just set position to target
            agent.x = agent.currentTarget.x;
            agent.y = agent.currentTarget.y;
        } else {
            // Move toward target at agent's speed
            agent.x += (dx / distance) * agent.speed;
            agent.y += (dy / distance) * agent.speed;
        }
    }

    // Function to choose a new exploration target
    function chooseNewExplorationTarget(agent) {
        const gridWidth = Math.ceil(canvas.width / gridSize);
        const gridHeight = Math.ceil(canvas.height / gridSize);
        
        // Try to find an unvisited cell
        let attempts = 0;
        while (attempts < 20) {
            const gridX = Math.floor(Math.random() * gridWidth);
            const gridY = Math.floor(Math.random() * gridHeight);
            const cellKey = `${gridX},${gridY}`;
            
            if (!agent.visitedCells[cellKey]) {
                console.log(`Agent exploring new location: ${cellKey}`);
                return grid.getCellCenter(cellKey);
            }
            attempts++;
        }
        
        // If all cells visited or couldn't find unvisited cell, return random cell
        const gridX = Math.floor(Math.random() * gridWidth);
        const gridY = Math.floor(Math.random() * gridHeight);
        const cellKey = `${gridX},${gridY}`;
        console.log(`Agent couldn't find unvisited cell, returning random: ${cellKey}`);
        return grid.getCellCenter(cellKey);
    }

    // Function to choose a return target based on visitation history
    function chooseReturnTarget(agent) {
        // Water need - if susceptible or recovered, may need water
        if ((agent.state === "susceptible" || agent.state === "recovered") && 
            Math.random() < 0.3) {
            console.log("Agent needs water, returning to clean waterbody");
            return agent.cleanWaterbody;
        }
        
        // Infected agents may go to contaminated water
        if (agent.state === "infected" && Math.random() < 0.4) {
            console.log("Infected agent returning to contaminated waterbody");
            return agent.contaminatedWaterbody;
        }

        // Home and work are common return locations
        if (Math.random() < 0.5) {
            console.log("Agent returning to home");
            return agent.home;
        } else if (Math.random() < 0.3) {
            console.log("Agent returning to work");
            return agent.work;
        }
        
        // Otherwise do weighted selection from visited cells
        const visitedLocations = Object.keys(agent.visitedCells);
        const totalVisits = Object.values(agent.visitedCells).reduce((sum, count) => sum + count, 0);
        let randomValue = Math.random() * totalVisits;
        
        for (const cellKey of visitedLocations) {
            randomValue -= agent.visitedCells[cellKey];
            if (randomValue <= 0) {
                console.log(`Agent returning to previously visited location: ${cellKey}`);
                return grid.getCellCenter(cellKey);
            }
        }
        
        // Fallback to home
        console.log("Agent defaulting to return home");
        return agent.home;
    }

    // Update agent movement using d-EPR model
    function updateAgentMovement(agent) {
        // If agent has no target or has reached current target, choose a new one
        if (!agent.currentTarget || reachedTarget(agent)) {
            // Get current cell and mark as visited
            const currentCellKey = grid.getCellKey(agent.x, agent.y);
            if (!agent.visitedCells[currentCellKey]) {
                agent.visitedCells[currentCellKey] = 0;
                agent.uniqueVisitCount++;
            }
            agent.visitedCells[currentCellKey]++;
            
            // Calculate exploration probability using d-EPR formula
            const pNew = agent.rho * Math.pow(agent.uniqueVisitCount, -agent.gamma);
            
            // Decide whether to explore or return
            if (Math.random() < pNew) {
                // EXPLORE: Choose a new unvisited cell
                agent.currentTarget = chooseNewExplorationTarget(agent);
            } else {
                // RETURN: Choose a previously visited cell
                agent.currentTarget = chooseReturnTarget(agent);
            }
        }
        
        // Move toward current target
        moveTowardTarget(agent);
        
        // Check for waterbody interactions
        checkContaminatedWaterContact(agent);
        updateCleanWaterbodyBacteria(agent);
    }

    // Check if agent is touching contaminated water
    function checkContaminatedWaterContact(agent) {
        for (const waterbody of contaminatedWaterbodies) {
            const dx = agent.x - waterbody.x;
            const dy = agent.y - waterbody.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= waterbody.radius + agent.radius) {
                // If susceptible, change to exposed
                if (agent.state === "susceptible") {
                    agent.state = "exposed";
                    agent.bacteria = bacteriaCounts.exposed;
                    agent.statetimer = 0;
                    console.log("Agent became exposed from contaminated water");
                }
                return true;
            }
        }
        return false;
    }

    // Update bacteria in clean waterbody when agent touches it
    function updateCleanWaterbodyBacteria(agent) {
        for (const waterbody of cleanWaterbodies) {
            const dx = agent.x - waterbody.x;
            const dy = agent.y - waterbody.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= waterbody.radius + agent.radius) {
                // Only transfer bacteria if not recently transferred (every 500ms)
                const now = performance.now();
                if (!agent.lastBacteriaTransfer || now - agent.lastBacteriaTransfer > 500) {
                    // Transfer a percentage of bacteria
                    const transferAmount = Math.floor(agent.bacteria * 0.1); // 10% transfer
                    waterbody.bacteria += transferAmount;
                    
                    // Check if water is now contaminated
                    if (waterbody.bacteria > contaminatedWaterbodyThreshold * waterbody.volume) {
                        waterbody.isContaminated = true;
                    }
                    
                    // Update contamination level for visualization
                    waterbody.contaminationLevel = Math.min(
                        (waterbody.bacteria / bacteriaCounts.infected) * 10, 
                        1
                    );
                    
                    agent.lastBacteriaTransfer = now;
                    console.log(`Bacteria transferred to water: ${transferAmount}, Total: ${waterbody.bacteria}, Level: ${waterbody.contaminationLevel}`);
                }
            }
        }
    }

    // Update agent SEIR state
    function updateAgentState(agent, deltaTime) {
        switch (agent.state) {
            case "exposed":
                agent.statetimer += deltaTime;
                if (agent.statetimer >= 3) {
                    agent.state = "infected";
                    agent.bacteria = bacteriaCounts.infected;
                    agent.statetimer = 0;
                    console.log("Agent transitioned from exposed to infected");
                }
                break;
                
            case "infected":
                agent.statetimer += deltaTime;
                if (agent.statetimer >= 5) {
                    agent.state = "recovered";
                    agent.bacteria = bacteriaCounts.recovered;
                    agent.statetimer = 0;
                    console.log("Agent transitioned from infected to recovered");
                }
                break;
                
            case "recovered":
                agent.statetimer += deltaTime;
                if (agent.statetimer >= 10) {
                    agent.state = "susceptible";
                    agent.bacteria = bacteriaCounts.susceptible;
                    agent.statetimer = 0;
                    console.log("Agent transitioned from recovered to susceptible");
                }
                break;
        }
    }

    // Draw the simulation scene
    function drawScene() {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid if enabled
        if (showGrid) {
            drawGrid();
        }
        
        // Draw agent trails if enabled
        if (showTrails) {
            agents.forEach(drawAgentTrail);
        }
        
        // Draw water bodies
        drawWaterBodies();
        
        // Draw houses and workplaces
        drawLocations();
        
        // Draw agents
        agents.forEach(drawAgent);
        
        // Draw stats
        drawStats();
    }

    // Draw the grid
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

    // Draw agent visitation trails
    function drawAgentTrail(agent) {
        for (const cellKey in agent.visitedCells) {
            const center = grid.getCellCenter(cellKey);
            const visitCount = agent.visitedCells[cellKey];
            const maxOpacity = 0.5;
            const opacity = Math.min(maxOpacity, 0.1 + (visitCount / 20) * maxOpacity);
            
            let trailColor;
            switch (agent.state) {
                case "susceptible": trailColor = `rgba(100, 200, 255, ${opacity})`; break;
                case "exposed": trailColor = `rgba(255, 200, 100, ${opacity})`; break;
                case "infected": trailColor = `rgba(255, 100, 100, ${opacity})`; break;
                case "recovered": trailColor = `rgba(100, 255, 100, ${opacity})`; break;
            }
            
            ctx.fillStyle = trailColor;
            ctx.fillRect(
                center.x - gridSize/2, 
                center.y - gridSize/2, 
                gridSize, 
                gridSize
            );
        }
    }

    // Draw water bodies
    function drawWaterBodies() {
        // Draw contaminated waterbodies
        for (const waterbody of contaminatedWaterbodies) {
            ctx.beginPath();
            ctx.arc(waterbody.x, waterbody.y, waterbody.radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'darkblue';
            ctx.fill();
            ctx.closePath();
            
            // Label
            ctx.font = '14px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText('Contaminated', waterbody.x, waterbody.y);
        }
        
        // Draw clean waterbodies
        for (const waterbody of cleanWaterbodies) {
            // Outer circle (clean water)
            ctx.beginPath();
            ctx.arc(waterbody.x, waterbody.y, waterbody.radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'lightblue';
            ctx.fill();
            ctx.closePath();
            
            // Inner circle (contamination level)
            if (waterbody.bacteria > 0) {
                ctx.beginPath();
                ctx.arc(
                    waterbody.x, 
                    waterbody.y, 
                    waterbody.radius * waterbody.contaminationLevel, 
                    0, 
                    2 * Math.PI
                );
                ctx.fillStyle = 'darkblue';
                ctx.fill();
                ctx.closePath();
                
                // Show bacteria count
                ctx.font = '12px Arial';
                ctx.fillStyle = 'black';
                ctx.textAlign = 'center';
                ctx.fillText(
                    `${(waterbody.bacteria/1000).toFixed(0)}K bacteria`, 
                    waterbody.x, 
                    waterbody.y + waterbody.radius + 15
                );
                
                // Show contamination percentage
                ctx.fillText(
                    `${Math.floor(waterbody.contaminationLevel * 100)}% contaminated`, 
                    waterbody.x, 
                    waterbody.y + waterbody.radius + 30
                );
            }
            
            // Label
            ctx.font = '14px Arial';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.fillText('Clean Water', waterbody.x, waterbody.y);
        }
    }

    // Draw houses and workplaces
    function drawLocations() {
        agents.forEach(agent => {
            // Draw house
            ctx.fillStyle = 'green';
            ctx.fillRect(agent.home.x - 10, agent.home.y - 10, 20, 20);
            
            // Draw work
            ctx.fillStyle = 'orange';
            ctx.fillRect(agent.work.x - 10, agent.work.y - 10, 20, 20);
        });
    }

    // Draw an agent
    function drawAgent(agent) {
        // Draw agent circle
        ctx.beginPath();
        ctx.arc(agent.x, agent.y, agent.radius, 0, 2 * Math.PI);
        
        // Set color based on state
        switch (agent.state) {
            case "susceptible": ctx.fillStyle = susceptibleColor; break;
            case "exposed": ctx.fillStyle = exposedColor; break;
            case "infected": ctx.fillStyle = infectedColor; break;
            case "recovered": ctx.fillStyle = recoveredColor; break;
        }
        
        ctx.fill();
        ctx.closePath();
        
        // Draw line to current target if one exists
        if (agent.currentTarget) {
            ctx.beginPath();
            ctx.moveTo(agent.x, agent.y);
            ctx.lineTo(agent.currentTarget.x, agent.currentTarget.y);
            ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.closePath();
        }
    }

    // Draw stats and information
    function drawStats() {
        // Count agents in each state
        const counts = {
            susceptible: 0,
            exposed: 0,
            infected: 0,
            recovered: 0
        };
        
        agents.forEach(agent => {
            counts[agent.state]++;
        });
        
        // Draw stats box
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(10, 10, 200, 130);
        
        ctx.font = '16px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        
        ctx.fillText(`Susceptible: ${counts.susceptible}`, 20, 30);
        ctx.fillText(`Exposed: ${counts.exposed}`, 20, 50);
        ctx.fillText(`Infected: ${counts.infected}`, 20, 70);
        ctx.fillText(`Recovered: ${counts.recovered}`, 20, 90);
        ctx.fillText(`ρ: ${agents[0].rho.toFixed(1)}`, 20, 110);
        ctx.fillText(`γ: ${agents[0].gamma.toFixed(1)}`, 20, 130);
        
        // Update UI counters if they exist
        try {
            document.getElementById('susceptibleCount').textContent = counts.susceptible;
            document.getElementById('exposedCount').textContent = counts.exposed;
            document.getElementById('infectedCount').textContent = counts.infected;
            document.getElementById('recoveredCount').textContent = counts.recovered;
        } catch (e) {
            // Elements might not exist
        }
    }

    // Calculate deltaTime between frames
    let lastTime = performance.now();
    function getDeltaTime(currentTime) {
        const deltaTime = (currentTime - lastTime) / 1000;
        lastTime = currentTime;
        return deltaTime;
    }

    // Animation loop
    let animationId = null;
    function animate(currentTime) {
        const deltaTime = getDeltaTime(currentTime);
        
        // Update all agents
        agents.forEach(agent => {
            updateAgentMovement(agent);
            updateAgentState(agent, deltaTime);
        });
        
        drawScene();
        
        animationId = requestAnimationFrame(animate);
    }

    // Reset the simulation
    function reset() {
        console.log("Resetting simulation");
        
        // Recreate agents
        agents = [];
        for (let i = 0; i < 10; i++) {
            agents.push(createAgent());
        }
        
        // Reset clean waterbodies
        for (const waterbody of cleanWaterbodies) {
            waterbody.bacteria = 0;
            waterbody.isContaminated = false;
            waterbody.contaminationLevel = 0;
        }
        
        // Reset timing variables
        lastTime = performance.now();
        
        // Reset UI
        try {
            document.getElementById('susceptibleCount').textContent = '10';
            document.getElementById('exposedCount').textContent = '0';
            document.getElementById('infectedCount').textContent = '0';
            document.getElementById('recoveredCount').textContent = '0';
        } catch (e) {
            // Elements might not exist
        }
    }

    // Setup UI controls
    function setupControls() {
        // Create control panel if it doesn't exist
        if (!document.getElementById('deprControls')) {
            const controlsDiv = document.createElement('div');
            controlsDiv.id = 'deprControls';
            controlsDiv.className = 'simulation-controls';
            controlsDiv.style.position = 'absolute';
            controlsDiv.style.top = '10px';
            controlsDiv.style.right = '10px';
            controlsDiv.style.background = 'rgba(255, 255, 255, 0.8)';
            controlsDiv.style.padding = '10px';
            controlsDiv.style.borderRadius = '5px';
            
            controlsDiv.innerHTML = `
                <div style="margin-bottom: 10px;">
                    <label for="rhoSlider">Exploration rate (ρ): <span id="rhoValue">0.6</span></label>
                    <input type="range" id="rhoSlider" min="0.1" max="1" step="0.1" value="0.6" style="width: 100%;">
                </div>
                <div style="margin-bottom: 10px;">
                    <label for="gammaSlider">Memory effect (γ): <span id="gammaValue">0.2</span></label>
                    <input type="range" id="gammaSlider" min="0.1" max="1" step="0.1" value="0.2" style="width: 100%;">
                </div>
                <div style="margin-bottom: 10px;">
                    <button id="resetBtn" style="margin-right: 10px;">Reset</button>
                    <label><input type="checkbox" id="showGridCheckbox"> Show Grid</label>
                </div>
                <div>
                    <label><input type="checkbox" id="showTrailsCheckbox" checked> Show Trails</label>
                </div>
            `;
            
            document.body.appendChild(controlsDiv);
            
            // Add event listeners
            document.getElementById('rhoSlider').addEventListener('input', function(e) {
                const value = parseFloat(e.target.value);
                document.getElementById('rhoValue').textContent = value;
                agents.forEach(agent => agent.rho = value);
            });
            
            document.getElementById('gammaSlider').addEventListener('input', function(e) {
                const value = parseFloat(e.target.value);
                document.getElementById('gammaValue').textContent = value;
                agents.forEach(agent => agent.gamma = value);
            });
            
            document.getElementById('resetBtn').addEventListener('click', reset);
            
            document.getElementById('showGridCheckbox').addEventListener('change', function(e) {
                showGrid = e.target.checked;
            });
            
            document.getElementById('showTrailsCheckbox').addEventListener('change', function(e) {
                showTrails = e.target.checked;
            });
        }
    }

    // Start the simulation
    function start() {
        console.log("Starting d-EPR Mobility Simulation");
        
        // Create UI controls
        setupControls();
        
        // Stop any existing animation
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        
        // Reset the simulation
        reset();
        
        // Start animation
        animationId = requestAnimationFrame(animate);
    }

    // Stop the simulation
    function stop() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
            console.log("Stopping d-EPR Mobility Simulation");
        }
        
        // Remove controls when stopping
        const controls = document.getElementById('deprControls');
        if (controls) {
            controls.remove();
        }
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Export API
    window.sim_depr_mobility_backup = {
        start,
        stop,
        reset
    };
})();