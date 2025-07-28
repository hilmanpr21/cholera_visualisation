document.addEventListener('DOMContentLoaded', function() {
    // Initialize scrollama
    const scroller = scrollama();
    
    // Track the current active simulation
    let currentSimulation = null;
    
    // Collection of all simulations
    const simulations = {
        sim_200_agents: window.sim_200_agents,
        sim_seir_1_agent: window.sim_seir_1_agent,
        sim_od_200_agents: window.sim_od_200_agents,
        sim_waterbody_to_contaminated_waterbody: window.sim_waterbody_to_contaminated_waterbody
    };
    
    // Function to handle step enter (when a new step becomes active)
    function handleStepEnter(response) {
        // Update UI to show which step is active
        response.element.classList.add('is-active');
        
        // Get the simulation name from the data-step attribute
        const simName = response.element.dataset.step;
        console.log("Entering step:", simName);
        
        // Stop the current simulation if one is running
        if (currentSimulation) {
            currentSimulation.stop();
        }
        
        // Start the new simulation if it exists
        if (simulations[simName]) {
            // Add a small delay to ensure clean transition
            setTimeout(() => {
                simulations[simName].start();
                currentSimulation = simulations[simName];
                console.log("Started simulation:", simName);
            }, 300);
        } else {
            console.error("Simulation not found:", simName);
        }
    }
    
    // Function to handle step exit (when a step is no longer active)
    function handleStepExit(response) {
        // Remove active class from the step
        response.element.classList.remove('is-active');
    }
    
    // Set up scrollama
    function init() {
        // Check if all simulations are loaded
        const allSimulationsLoaded = Object.values(simulations).every(sim => sim !== undefined);
        
        if (!allSimulationsLoaded) {
            console.log("Waiting for simulations to load...");
            setTimeout(init, 100);
            return;
        }
        
        // Setup the scroller
        scroller
            .setup({
                step: '.step',          // Steps are elements with class 'step'
                offset: 0.5,            // Trigger when step is 50% in viewport
                debug: false,           // Set to true to see trigger points
                progress: false         // We don't need progress updates
            })
            .onStepEnter(handleStepEnter)
            .onStepExit(handleStepExit);
        
        // Start the first simulation by default
        simulations.sim_200_agents.start();
        currentSimulation = simulations.sim_200_agents;
        
        // Handle window resize
        window.addEventListener('resize', scroller.resize);
    }
    
    // Initialize
    init();
});