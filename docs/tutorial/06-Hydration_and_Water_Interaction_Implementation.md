# Hydration and Water Interaction System Implementation Tutorial

## Overview

This tutorial provides a comprehensive, step-by-step guide to implementing a complete hydration and water interaction system in the d-EPR mobility simulation. The system includes:

1. **Hydration and defecation needs tracking**
2. **Visual indicators for agent needs**
3. **Water-seeking behavior that bypasses normal water avoidance**
4. **Water interaction state management**
5. **Complete cycle: seek → stay → return → resume normal behavior**

## Prerequisites

- Basic understanding of the d-EPR mobility simulation
- Familiarity with the existing water avoidance system
- Knowledge of JavaScript canvas 2D rendering
- Understanding of the agent movement and pathfinding system

---

## Step 1: Define Hydration and Defecation Constants

### 1.1 Add Basic Constants

First, we need to define the thresholds and timing for hydration and defecation needs:

```javascript
// Hydration and Defecation Constants
const hydrationDistanceThreshold = 2000; // Agent needs hydration after moving this many pixels
const defecationFrequencyHours = 24; // Agent defecates once every 24 hours
const waterStayDuration = 0.5; // Time in seconds to stay in water for hydration/defecation
```

**Code Explanation:**
- `hydrationDistanceThreshold`: Distance-based trigger for hydration needs (2000 pixels = realistic walking distance)
- `defecationFrequencyHours`: Time-based trigger for defecation needs (24 hours = realistic biological cycle)
- `waterStayDuration`: Duration agent spends at water body (0.5 seconds = quick interaction)

### 1.2 Define Water Interaction Modes

Create an enumeration for different water interaction states:

```javascript
// Water interaction modes
const WATER_MODES = {
    AVOIDING: 'avoiding',       // Normal mode - avoid water bodies
    SEEKING: 'seeking',         // Seeking water for hydration/defecation
    IN_WATER: 'in_water',       // Currently in water body
    RETURNING: 'returning'      // Returning to schedule after water interaction
};
```

**Code Explanation:**
- `AVOIDING`: Default state where agents avoid water bodies (existing behavior)
- `SEEKING`: Agent actively moves toward water, bypassing avoidance logic
- `IN_WATER`: Agent has reached water and is staying for the required duration
- `RETURNING`: Agent is moving back to normal schedule after water interaction

---

## Step 2: Extend Agent Data Structure

### 2.1 Add Hydration Tracking Properties

Extend the agent object in the `createAgent()` function to include hydration tracking:

```javascript
// Add to agent object in createAgent() function
hydration: {
    distanceTraveled: 0,         // Track cumulative distance for hydration trigger
    needsHydration: false,       // Boolean flag for hydration need
    lastX: houseX,               // Previous X position for distance calculation
    lastY: houseY                // Previous Y position for distance calculation
},
```

**Code Explanation:**
- `distanceTraveled`: Accumulates distance moved to trigger hydration needs
- `needsHydration`: Boolean flag indicating if agent currently needs hydration
- `lastX/lastY`: Store previous position to calculate distance moved per frame

### 2.2 Add Defecation Tracking Properties

```javascript
// Add to agent object in createAgent() function
defecation: {
    needsDefecation: false,      // Boolean flag for defecation need
    lastDefecationTime: Math.random() * defecationFrequencyHours // Random initial timer
},
```

**Code Explanation:**
- `needsDefecation`: Boolean flag indicating if agent currently needs defecation
- `lastDefecationTime`: Timer tracking time since last defecation (randomized initial value prevents all agents triggering simultaneously)

### 2.3 Add Water Interaction State Management

```javascript
// Add to agent object in createAgent() function
waterInteraction: {
    mode: WATER_MODES.AVOIDING,     // Current water interaction mode
    waterTarget: null,               // Target water body center coordinates
    waterStayTimer: 0,               // Timer for staying in water
    previousScheduleMode: null,      // Store schedule mode before water interaction
    previousTarget: null,            // Store movement target before water interaction
    satisfyingNeed: null            // Track which need is being satisfied ('hydration' or 'defecation')
}
```

**Code Explanation:**
- `mode`: Current state in the water interaction state machine
- `waterTarget`: Coordinates of the nearest water body center to move toward
- `waterStayTimer`: Tracks time spent in water (compared against `waterStayDuration`)
- `previousScheduleMode/previousTarget`: Store state to resume after water interaction
- `satisfyingNeed`: Tracks whether agent is satisfying hydration or defecation need

---

## Step 3: Implement Needs Tracking Functions

### 3.1 Distance-Based Hydration Tracking

Create a function to track distance traveled and trigger hydration needs:

```javascript
// Function to update agent hydration needs based on distance traveled
function updateHydrationNeeds(agent, deltaTime) {
    // Calculate distance moved this frame
    const currentX = agent.x;
    const currentY = agent.y;
    
    if (agent.hydration.lastX !== undefined && agent.hydration.lastY !== undefined) {
        const deltaX = currentX - agent.hydration.lastX;
        const deltaY = currentY - agent.hydration.lastY;
        const distanceMoved = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        agent.hydration.distanceTraveled += distanceMoved;
    }
    
    // Store current position for next frame
    agent.hydration.lastX = currentX;
    agent.hydration.lastY = currentY;
    
    // Check if agent needs hydration
    if (agent.hydration.distanceTraveled >= hydrationDistanceThreshold && 
        !agent.hydration.needsHydration && 
        agent.waterInteraction.mode === WATER_MODES.AVOIDING) {
        
        agent.hydration.needsHydration = true;
        
        // Find nearest water center and start seeking
        const waterTarget = findNearestWaterCenter(agent.x, agent.y);
        if (waterTarget) {
            agent.waterInteraction.mode = WATER_MODES.SEEKING;
            agent.waterInteraction.waterTarget = waterTarget;
            agent.waterInteraction.satisfyingNeed = 'hydration';
            console.log(`Agent needs hydration at (${agent.x.toFixed(1)}, ${agent.y.toFixed(1)}), seeking water at (${waterTarget.x}, ${waterTarget.y})`);
        }
    }
}
```

**Code Explanation:**
1. **Distance Calculation**: Uses Pythagorean theorem to calculate distance moved since last frame
2. **Accumulation**: Adds distance to running total for threshold comparison
3. **Position Storage**: Updates last position for next frame's calculation
4. **Threshold Check**: Triggers hydration need when distance exceeds threshold
5. **Condition Checks**: Only triggers if not already needing hydration and not already in water interaction
6. **Water Seeking**: Immediately finds nearest water and switches to SEEKING mode

### 3.2 Time-Based Defecation Tracking

Create a function to track time and trigger defecation needs:

```javascript
// Function to update agent defecation needs based on time
function updateDefecationNeeds(agent, deltaTime) {
    // Update time since last defecation
    agent.defecation.lastDefecationTime += deltaTime;
    
    // Check if it's time for defecation (only during mobility periods)
    const currentHour = timeManager.getCurrentHour();
    const isMobilityPeriod = (currentHour >= 5 && currentHour < 9) || (currentHour >= 15 && currentHour < 23);
    
    if (agent.defecation.lastDefecationTime >= defecationFrequencyHours && 
        !agent.defecation.needsDefecation &&
        agent.waterInteraction.mode === WATER_MODES.AVOIDING &&
        isMobilityPeriod) {
        
        agent.defecation.needsDefecation = true;
        
        // Find nearest water center and start seeking
        const waterTarget = findNearestWaterCenter(agent.x, agent.y);
        if (waterTarget) {
            agent.waterInteraction.mode = WATER_MODES.SEEKING;
            agent.waterInteraction.waterTarget = waterTarget;
            agent.waterInteraction.satisfyingNeed = 'defecation';
            console.log(`Agent needs defecation at (${agent.x.toFixed(1)}, ${agent.y.toFixed(1)}), seeking water at (${waterTarget.x}, ${waterTarget.y})`);
        }
    }
}
```

**Code Explanation:**
1. **Time Accumulation**: Adds deltaTime to track hours since last defecation
2. **Schedule Awareness**: Only triggers during mobility periods (5-9am, 3-11pm) for realism
3. **Threshold Check**: Triggers when time exceeds frequency threshold
4. **Condition Checks**: Similar to hydration - only when not already triggered and not in water interaction
5. **Water Seeking**: Immediately finds nearest water and switches to SEEKING mode

---

## Step 4: Implement Water Target Finding

### 4.1 Find Nearest Water Body Center

Create a function to locate the closest water body for the agent to visit:

```javascript
// Function to find the center of the nearest water body for hydration/defecation
function findNearestWaterCenter(agentX, agentY) {
    let nearestCenter = null;
    let nearestDistance = Infinity;

    // Check contaminated water bodies (these have radius, not width/height)
    for (const waterbody of contaminatedWaterbodies) {
        const distance = Math.sqrt(
            Math.pow(waterbody.x - agentX, 2) + 
            Math.pow(waterbody.y - agentY, 2)
        );
        
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestCenter = {
                x: waterbody.x,
                y: waterbody.y,
                type: 'contaminated'
            };
        }
    }

    // Check clean water bodies (these also have radius, not width/height)
    for (const waterbody of cleanWaterbodies) {
        const distance = Math.sqrt(
            Math.pow(waterbody.x - agentX, 2) + 
            Math.pow(waterbody.y - agentY, 2)
        );
        
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestCenter = {
                x: waterbody.x,
                y: waterbody.y,
                type: 'clean'
            };
        }
    }

    return nearestCenter;
}
```

**Code Explanation:**
1. **Distance Calculation**: Uses Euclidean distance formula to find closest water body
2. **Multiple Water Types**: Checks both contaminated and clean water bodies
3. **Closest Selection**: Keeps track of shortest distance and corresponding water body
4. **Return Format**: Returns object with x, y coordinates and water body type
5. **Error Handling**: Returns null if no water bodies exist (handled by calling code)

---

## Step 5: Implement Water-Seeking Movement

### 5.1 Direct Water Movement Function

Create a function for direct movement toward water that bypasses water avoidance:

```javascript
// Function to move towards water without avoiding water bodies (for hydration/defecation)
function moveTowardsWater(agentInput, targetWaterLocation) {
    // Calculate direct distance to water target
    const dx = targetWaterLocation.x - agentInput.x;
    const dy = targetWaterLocation.y - agentInput.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if agent has reached the water target
    if (distance <= agentInput.speed) {
        // Agent reached water center
        agentInput.x = targetWaterLocation.x;
        agentInput.y = targetWaterLocation.y;
        return true; // Indicate that water was reached
    } else {
        // Move towards water center (direct line, no pathfinding)
        const moveX = (dx / distance) * agentInput.speed;
        const moveY = (dy / distance) * agentInput.speed;
        
        agentInput.x += moveX;
        agentInput.y += moveY;
        return false; // Still moving towards water
    }
}
```

**Code Explanation:**
1. **Direct Movement**: Calculates straight-line movement toward water (no pathfinding)
2. **Distance Check**: Uses agent speed as threshold for "reached" determination
3. **Position Snapping**: When close enough, snaps agent exactly to water center
4. **Vector Movement**: Uses normalized direction vector multiplied by speed for smooth movement
5. **Return Values**: Boolean indicating whether water has been reached

---

## Step 6: Implement Water Interaction State Management

### 6.1 Water State Transition Function

Create a function to manage the water interaction state machine:

```javascript
// Function to handle water stay timer and state transitions
function updateWaterInteraction(agent, deltaTime) {
    const waterMode = agent.waterInteraction.mode;

    switch (waterMode) {
        case WATER_MODES.IN_WATER:
            // Increment water stay timer
            agent.waterInteraction.waterStayTimer += deltaTime;
            
            // Check if required duration has passed
            if (agent.waterInteraction.waterStayTimer >= waterStayDuration) {
                // Satisfy the need
                if (agent.waterInteraction.satisfyingNeed === 'hydration') {
                    agent.hydration.needsHydration = false;
                    agent.hydration.distanceTraveled = 0; // Reset distance counter
                } else if (agent.waterInteraction.satisfyingNeed === 'defecation') {
                    agent.defecation.needsDefecation = false;
                    agent.defecation.lastDefecationTime = 0; // Reset defecation timer
                }

                // Transition to returning mode
                agent.waterInteraction.mode = WATER_MODES.RETURNING;
                agent.waterInteraction.waterStayTimer = 0;
                agent.needsNewPath = true; // Force new path calculation
                
                // Set target based on current schedule
                const currentHour = timeManager.getCurrentHour();
                const currentScheduleMode = getCurrentScheduleMode(currentHour);
                
                if (currentScheduleMode === 'atHome') {
                    agent.currentTarget = agent.house;
                } else if (currentScheduleMode === 'atWork') {
                    agent.currentTarget = agent.work;
                } else {
                    // For mobile mode, choose a d-EPR target
                    agent.currentTarget = chooseNewExplorationTarget(agent);
                }
            }
            break;

        case WATER_MODES.RETURNING:
            // Agent is returning to schedule target
            // Once agent reaches the first target after water, switch back to avoiding mode
            if (agent.currentTarget && reachedTarget(agent)) {
                agent.waterInteraction.mode = WATER_MODES.AVOIDING;
                agent.waterInteraction.waterTarget = null;
                agent.waterInteraction.satisfyingNeed = null;
                agent.needsNewPath = true;
            }
            break;
    }
}
```

**Code Explanation:**
1. **Timer Management**: Tracks time spent in water using deltaTime accumulation
2. **Need Satisfaction**: Resets appropriate need flags and counters when duration complete
3. **State Transitions**: Moves from IN_WATER → RETURNING → AVOIDING in sequence
4. **Schedule Integration**: Determines appropriate target based on current time and schedule mode
5. **Path Reset**: Forces new path calculation to ensure proper movement after water interaction

---

## Step 7: Integrate Water Interaction into Movement System

### 7.1 Priority-Based Movement Logic

Modify the main movement function to prioritize water interaction over normal schedule:

```javascript
// Function to update agent movement based on schedule
function updateAgentMovement(agentInput) {
    // PRIORITY 1: Handle water interaction (overrides all schedule behaviors)
    if (agentInput.waterInteraction.mode === WATER_MODES.SEEKING) {
        // Agent is seeking water for hydration/defecation
        if (agentInput.waterInteraction.waterTarget) {
            const reachedWater = moveTowardsWater(agentInput, agentInput.waterInteraction.waterTarget);
            if (reachedWater) {
                // Agent reached water center, start staying timer
                agentInput.waterInteraction.mode = WATER_MODES.IN_WATER;
                agentInput.waterInteraction.waterStayTimer = 0;
            }
        }
        return; // Skip normal movement logic when seeking water
    }

    if (agentInput.waterInteraction.mode === WATER_MODES.IN_WATER) {
        // Agent stays still while in water
        return; // Skip normal movement logic when in water
    }

    if (agentInput.waterInteraction.mode === WATER_MODES.RETURNING) {
        // Agent is returning from water - use normal movement but ignore water avoidance
        // Set a flag or modify pathfinding to ignore water obstacles temporarily
        const destination = agentInput.currentTarget;
        if (destination) {
            moveTowardsLocation(agentInput, destination);
        }
        return; // Skip normal schedule logic but allow movement
    }

    // PRIORITY 2: Normal schedule-based movement (only when not interacting with water)
    // ... existing schedule-based movement logic continues here ...
}
```

**Code Explanation:**
1. **Priority System**: Water interaction takes precedence over all normal movement
2. **Early Returns**: Uses return statements to skip normal movement when water interaction active
3. **Mode-Specific Behavior**: Each water mode has specific movement behavior
4. **State Isolation**: Water interaction is completely separate from normal schedule logic

---

## Step 8: Implement Visual Indicators

### 8.1 Need Visualization

Add visual indicators to show agent needs and water interaction states:

```javascript
// Add to drawAgent() function after drawing the main agent circle
function drawAgent(agentInput) {
    // ... existing agent drawing code ...

    // Draw visual indicators for hydration and defecation needs
    // White dot for hydration need
    if (agentInput.hydration.needsHydration) {
        ctx.beginPath();
        ctx.fillStyle = 'white';
        ctx.arc(agentInput.x, agentInput.y - agentInput.radius - 5, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    }

    // Black border for defecation need
    if (agentInput.defecation.needsDefecation) {
        ctx.beginPath();
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.arc(agentInput.x, agentInput.y, agentInput.radius + 2, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
    }

    // Visual indicators for water interaction modes (colored rings)
    if (agentInput.waterInteraction.mode !== WATER_MODES.AVOIDING) {
        ctx.beginPath();
        ctx.lineWidth = 2;
        
        switch (agentInput.waterInteraction.mode) {
            case WATER_MODES.SEEKING:
                ctx.strokeStyle = 'cyan';
                break;
            case WATER_MODES.IN_WATER:
                ctx.strokeStyle = 'yellow';
                break;
            case WATER_MODES.RETURNING:
                ctx.strokeStyle = 'orange';
                break;
        }
        
        ctx.arc(agentInput.x, agentInput.y, agentInput.radius + 8, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.closePath();
    }
}
```

**Code Explanation:**
1. **Hydration Indicator**: White dot above agent indicates hydration need
2. **Defecation Indicator**: Black border around agent indicates defecation need
3. **Water Mode Indicators**: Colored rings show current water interaction state
4. **Color Coding**: Cyan (seeking), Yellow (in water), Orange (returning)
5. **Visual Hierarchy**: Different positions and styles prevent visual overlap

---

## Step 9: Integration with Main Simulation Loop

### 9.1 Update Main Animation Loop

Integrate the new functions into the main simulation loop:

```javascript
// Add to the animate() function, in the agents.forEach loop
function animate(currentTime) {
    // ... existing animation code ...
    
    agents.forEach(agent => {
        // Update hydration and defecation needs
        updateHydrationNeeds(agent, deltaTime);
        updateDefecationNeeds(agent, deltaTime);
        
        // Update water interaction state
        updateWaterInteraction(agent, deltaTime);
        
        // Update agent state (SEIR model)
        updateAgentState(agent, deltaTime);
        
        // Update agent movement (includes water interaction priority)
        updateAgentMovement(agent);
        
        // ... other existing agent updates ...
    });
    
    // ... rest of animation loop ...
}
```

**Code Explanation:**
1. **Order Dependencies**: Needs update before movement, state management before transitions
2. **Delta Time**: All time-dependent functions receive deltaTime for frame-rate independence
3. **Integration**: New functions work alongside existing SEIR model and movement logic

---

## Step 10: Testing and Validation

### 10.1 Testing Parameters

For easier testing during development, you can temporarily reduce thresholds:

```javascript
// Temporary testing values (restore to normal after testing)
const hydrationDistanceThreshold = 200; // Reduced from 2000 for faster testing
const defecationFrequencyHours = 1; // Reduced from 24 for faster testing
const waterStayDuration = 0.1; // Reduced from 0.5 for faster testing
```

### 10.2 Console Debugging

The implementation includes console.log statements for debugging:
- Water target selection
- Mode transitions
- Need satisfaction
- Movement progress

### 10.3 Expected Behavior

When working correctly, you should observe:
1. **Agents moving normally** until needs trigger
2. **Visual indicators appearing** when agents need hydration/defecation
3. **Direct movement to water** bypassing normal water avoidance
4. **Brief pause at water center** (0.5 seconds)
5. **Return to normal schedule** with resumed water avoidance

---

## Summary

This implementation creates a complete biological needs system that:

1. **Tracks realistic biological needs** (distance-based hydration, time-based defecation)
2. **Provides clear visual feedback** (indicators for needs and water interaction states)
3. **Integrates seamlessly** with existing d-EPR mobility and SEIR disease models
4. **Maintains simulation realism** through appropriate timing and behavior patterns
5. **Uses a clean state machine** for predictable and debuggable water interaction logic

The system demonstrates how complex behaviors can be added to agent-based models while maintaining code organization and system reliability.

## Key Design Principles Applied

1. **State Machine Pattern**: Clean separation of water interaction modes
2. **Priority System**: Water needs override normal movement but don't break existing logic
3. **Visual Feedback**: Multiple indicator types provide clear system status
4. **Time-Based Logic**: Frame-rate independent timing using deltaTime
5. **Modular Functions**: Each function has a single, clear responsibility
6. **Integration Points**: New system hooks into existing simulation loop cleanly

This approach ensures the hydration system enhances the simulation without compromising its existing functionality or performance.