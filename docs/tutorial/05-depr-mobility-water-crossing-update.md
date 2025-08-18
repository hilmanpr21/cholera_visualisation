# Tutorial 5: d-EPR Mobility - Water Body Obstacle Avoidance Update

## Overview

This tutorial documents a critical issue identified in the d-EPR (dispersed Episodic-Probabilistic Return) mobility implementation and presents four potential solution approaches to make agent movement more realistic around water bodies.

------------------------------------------------------------------------

## Problem Identification

### Issue: Agents Walking Through Water Bodies

**Current Behavior**: Agents in the simulation walk directly through water bodies during their d-EPR movement, treating water as normal terrain.

**Why This is Problematic**:

1\. **Unrealistic movement patterns**: People don't typically walk through water bodies in real life\
2. **Uncontrolled contamination**: Agents cross water unnecessarily, potentially contaminating it or getting contaminated\
3. **Missing behavioral logic**: No distinction between when agents should or shouldn't interact with water

### Root Cause Analysis

The current d-EPR implementation has these limitations:

1.  **Grid-based movement without terrain awareness**: The algorithm selects any grid cell as a target without considering terrain type. Terrain mean hierarchical grid selection
2.  **No obstacle detection**: Direct movement toward targets doesn't account for water bodies as obstacles
3.  **Uniform cell treatment**: No classification system exists to distinguish water areas from accessible land areas
4.  **Missing behavioral motivations**: No logic for when agents actually need to access waterbody

### Current Code Location

The issue is primarily in the d-EPR movement functions within `sim_depr_mobility.js`:

-   `chooseNewExplorationTarget()` - selects targets without terrain consideration

-   `chooseReturnTarget()` - doesn't filter out water-based cells

-   `moveTowardsLocation()` - moves directly without pathfinding

------------------------------------------------------------------------

## Proposed Solution Options

### Ultimate Solution:

**Concept**

-   **Modified d-EPR with grid cells classification awareness.** classify grid into into different types:

    -   `accessible`: Normal ground areas where agents can move freely

    -   `water`: Water body areas that should be avoided unless specifically needed

    -   `restricted`: Areas agents should never enter

    -   Target selection respects terrain classification

    -   Maintains core d-EPR algorithm principles

-   **Water access logic**: Only move to water cells when:

    -   Agent needs water (thirsty/needs to collect water)

    -   Agent is infected and seeks to contaminate water

    -   Agent has no other choice (emergency pathfinding)

    -   Thirsty agents seek nearest water\|

-   **Simple Obstacle Avoidance** (simplified from Option 2)

    -   Basic pathfinding around water when needed
    -   Avoids complex A\* implementation initially

### Option 1: Grid Classification System (Recommended)

**Concept**: Implement a terrain classification system to distinguish different area types.

-   **Classify grid cells** into different types:

    -   `accessible`: Normal ground areas where agents can move freely

    -   `water`: Water body areas that should be avoided unless specifically needed

    -   `restricted`: Areas agents should never enter

-   **Implement simple pathfinding**: Instead of direct movement, use A\* or similar algorithm

    -   **Water as obstacles**: Treat water bodies as obstacles to go around

-   **Modify target selection**: Only select `accessible` cells for exploration/return targets

-   **Water access logic**: Only move to water cells when:

    -   Agent needs water (thirsty/needs to collect water)

    -   Agent is infected and seeks to contaminate water

    -   Agent has no other choice (emergency pathfinding)

**Implementation Strategy**:

``` javascript
// Grid cell types
const CELL_TYPES = {
    ACCESSIBLE: 'accessible',    // Normal ground areas where agents can move freely
    WATER: 'water',             // Water body areas that should be avoided unless necessary
    RESTRICTED: 'restricted'     // Areas agents should never enter
};

// Grid classification during initialization
const gridClassification = {};

function classifyGridCells() {
    const gridWidth = Math.ceil(canvas.width / gridSize);
    const gridHeight = Math.ceil(canvas.height / gridSize);
    
    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            const cellKey = `${x},${y}`;
            const cellCenter = grid.getCellCenter(cellKey);
            
            // Check if cell overlaps with water bodies
            if (isInWaterBody(cellCenter.x, cellCenter.y)) {
                gridClassification[cellKey] = CELL_TYPES.WATER;
            } else {
                gridClassification[cellKey] = CELL_TYPES.ACCESSIBLE;
            }
        }
    }
}

// Modified target selection for d-EPR
function chooseNewExplorationTarget(agentInput) {
    const gridWidth = Math.ceil(canvas.width / gridSize);
    const gridHeight = Math.ceil(canvas.height / gridSize);
    
    let attempts = 0;
    while (attempts < 50) { // Increased attempts for accessible cells
        const gridX = Math.floor(Math.random() * gridWidth);
        const gridY = Math.floor(Math.random() * gridHeight);
        const cellKey = `${gridX},${gridY}`;
        
        // Only select accessible cells that haven't been visited
        if (gridClassification[cellKey] === CELL_TYPES.ACCESSIBLE && 
            !agentInput.visitedCells[cellKey]) {
            return grid.getCellCenter(cellKey);
        }
        attempts++;
    }
    
    // Fallback: find any accessible cell
    return findNearestAccessibleCell(agentInput.x, agentInput.y);
}
```

**Benefits**: - Simple to implement and understand - Clear separation of concerns between terrain types - Maintains d-EPR algorithm integrity - Extensible for future terrain types (buildings, obstacles, etc.) - Low computational overhead

**Implementation Priority**: High (implement first)

### Option 2: Obstacle Avoidance with Pathfinding

**Concept**: Implement pathfinding algorithms to navigate around water bodies while maintaining destination goals.

-   **Implement simple pathfinding**: Instead of direct movement, use A\* or similar algorithm

-   **Water as obstacles**: Treat water bodies as obstacles to go around

-   **Designated water access points**: Create specific "shore" cells where agents can access water

**Implementation Strategy**:

``` javascript
// Simple A* pathfinding implementation
function findPathAroundObstacles(startX, startY, targetX, targetY) {
    // Convert coordinates to grid cells
    const startCell = grid.getCellKey(startX, startY);
    const targetCell = grid.getCellKey(targetX, targetY);
    
    // Use A* algorithm to find path avoiding water cells
    const path = aStarPathfinding(startCell, targetCell, gridClassification);
    
    return path; // Array of cell keys representing the path
}

// Modified movement function
function moveTowardsLocationWithPathfinding(agentInput, targetLocationInput) {
    if (!agentInput.currentPath || agentInput.currentPath.length === 0) {
        // Calculate new path if none exists
        agentInput.currentPath = findPathAroundObstacles(
            agentInput.x, agentInput.y, 
            targetLocationInput.x, targetLocationInput.y
        );
        agentInput.pathIndex = 0;
    }
    
    // Move along the path
    if (agentInput.pathIndex < agentInput.currentPath.length) {
        const nextCell = agentInput.currentPath[agentInput.pathIndex];
        const nextPosition = grid.getCellCenter(nextCell);
        
        // Move towards next position in path
        const dx = nextPosition.x - agentInput.x;
        const dy = nextPosition.y - agentInput.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < agentInput.speed) {
            // Reached waypoint, move to next
            agentInput.pathIndex++;
        } else {
            // Move towards current waypoint
            agentInput.x += (dx / distance) * agentInput.speed;
            agentInput.y += (dy / distance) * agentInput.speed;
        }
    }
}
```

**Benefits**: - More realistic movement patterns around obstacles - Sophisticated navigation behavior - Handles complex terrain layouts - Agents find efficient routes around water

**Drawbacks**: - More complex to implement - Higher computational cost - May require significant changes to existing movement logic

**Implementation Priority**: Medium (after grid classification)

### Option 3: Behavioral Motivation System

**Concept**: Add agent needs and motivations that drive water interaction decisions.

-   **Add agent needs/motivations**:

    -   Thirst level (increases over time)

    -   Work/home obligations

    -   Health status affecting behavior

-   **Water interaction triggers**:

    -   Thirsty agents seek nearest water

    -   Infected agents might contaminate water

    -   Healthy agents avoid water unless necessary

**Implementation Strategy**:

``` javascript
// Agent motivation system
function enhanceAgentWithMotivations(agent) {
    agent.needs = {
        thirst: 0,                    // Increases over time (0-100)
        thirstThreshold: 70,          // When agent seeks water
        lastWaterAccess: 0,           // Time since last water access
        waterAccessFrequency: 300     // Seconds between water needs
    };
    
    agent.behavior = {
        avoidWater: true,             // Default: avoid water unless necessary
        waterSeekingMode: false,      // Active when seeking water
        preferredWaterSource: null    // Remembers preferred water location
    };
}

// Water access decision logic
function shouldAccessWater(agent) {
    return agent.needs.thirst > agent.needs.thirstThreshold ||
           agent.state === 'infected' && Math.random() < 0.1; // 10% chance infected seeks to contaminate
}

// Modified d-EPR target selection with behavioral considerations
function chooseTargetWithBehavior(agentInput) {
    if (shouldAccessWater(agentInput)) {
        // Agent needs water - override d-EPR to seek nearest water source
        agentInput.behavior.waterSeekingMode = true;
        return findNearestWaterSource(agentInput.x, agentInput.y);
    } else {
        // Normal d-EPR behavior but avoid water areas
        agentInput.behavior.waterSeekingMode = false;
        return chooseNewExplorationTarget(agentInput); // Modified to avoid water
    }
}

// Update agent needs over time
function updateAgentNeeds(agent, deltaTime) {
    // Increase thirst over time
    agent.needs.thirst += deltaTime * 0.1; // Increase by 0.1 per second
    
    // Reset thirst if agent accessed water recently
    if (agent.behavior.waterSeekingMode && isNearWater(agent.x, agent.y)) {
        agent.needs.thirst = 0;
        agent.needs.lastWaterAccess = performance.now();
        agent.behavior.waterSeekingMode = false;
    }
}
```

**Benefits**: - Realistic behavioral modeling based on human needs - Natural water interaction patterns - Extensible for other motivations (work, home, social) - Adds depth to agent personalities

**Considerations**: - Requires careful balancing of need frequencies - More complex state management - May need different behaviors for different agent types

**Implementation Priority**: Medium (can be combined with other options)

### Option 4: Hybrid Approach (Comprehensive Solution)

**Concept**: Combine multiple approaches for a comprehensive and realistic solution.

**Implementation Components**:

1.  **Grid Classification Foundation** (from Option 1)
    -   Classify all grid cells by terrain type
    -   Provide base layer for all other systems
2.  **Modified d-EPR with Terrain Awareness**
    -   Target selection respects terrain classification
    -   Maintains core d-EPR algorithm principles
3.  **Behavioral Motivation System** (from Option 3)
    -   Adds realistic water access needs
    -   Creates natural water interaction patterns
4.  **Simple Obstacle Avoidance** (simplified from Option 2)
    -   Basic pathfinding around water when needed
    -   Avoids complex A\* implementation initially

**Implementation Roadmap**:

**Phase 1: Foundation (Immediate)**

``` javascript
// Step 1: Implement grid classification
classifyGridCells();

// Step 2: Modify d-EPR target selection
function chooseNewExplorationTarget(agentInput) {
    // Only select accessible cells for exploration
    // Implementation from Option 1
}
```

**Phase 2: Behavioral Layer (Short-term)**

``` javascript
// Step 3: Add agent motivations
enhanceAgentWithMotivations(agent);

// Step 4: Implement water access logic
function updateAgentBehavior(agent, deltaTime) {
    updateAgentNeeds(agent, deltaTime);
    if (shouldAccessWater(agent)) {
        agent.currentTarget = findNearestWaterSource(agent.x, agent.y);
    }
}
```

**Phase 3: Smart Movement (Medium-term)**

``` javascript
// Step 5: Add simple obstacle avoidance
function moveWithObstacleAvoidance(agentInput, targetInput) {
    // Check if direct path crosses water
    if (pathCrossesWater(agentInput.x, agentInput.y, targetInput.x, targetInput.y)) {
        // Find alternative path or waypoint
        const waypoint = findWaypointAroundWater(agentInput, targetInput);
        moveTowardsLocation(agentInput, waypoint);
    } else {
        // Direct movement is safe
        moveTowardsLocation(agentInput, targetInput);
    }
}
```

**Benefits of Hybrid Approach**: - Incremental implementation reduces risk - Each phase adds value independently - Can be tested and refined at each stage - Provides most realistic final behavior - Balances complexity with functionality

------------------------------------------------------------------------

## Ultimate Solution implementation

-   **Modified d-EPR with grid cells classification awareness.** classify grid into into different types:

    -   `accessible`: Normal ground areas where agents can move freely
    -   `water`: Water body areas that should be avoided unless specifically needed
    -   `restricted`: Areas agents should never enter
    -   Target selection respects terrain classification
    -   Maintains core d-EPR algorithm principles

-   **Simple Obstacle Avoidance** (simplified from Option 2)

    -   Basic pathfinding around water when needed
    -   Avoids complex A\* implementation initially

-   **Water access logic**: Only move to water cells when:

    -   Agent needs water (thirsty/needs to collect water)
    -   Agent is infected and seeks to contaminate water
    -   Agent has no other choice (emergency pathfinding)
    -   Thirsty agents seek nearest water
    -   Agent come to waterbody for defecatipon

------------------------------------------------------------------------

# Implementation Phase

## Phase 1

-   Grid classification system
-   Modify D-EPR target selection to avoid water body
-   Implement waypoint navigation around water

### Phase 1 Implementation Steps

#### Step 1.1: Grid Classification System Setup

Add these constants and data structures after the grid system setup in `sim_depr_mobility.js`:

``` javascript
// Add after the existing grid system setup (around line 67)

// Grid cell types for terrain classification
const CELL_TYPES = {
    ACCESSIBLE: 'accessible',    // Normal ground areas where agents can move freely
    WATER: 'water',             // Water body areas that should be avoided unless necessary
    RESTRICTED: 'restricted'     // Areas agents should never enter (future use)
};

// Grid classification storage
const gridClassification = {};
```

#### Step 1.2: Water Body Detection Function

Add this helper function to detect if a coordinate is within a water body:

``` javascript
// Add after the grid classification constants

// Function to check if a coordinate is within any water body
function isInWaterBody(x, y) {
    // Check contaminated water bodies
    for (const waterbody of contaminatedWaterbodies) {
        const dx = x - waterbody.x;
        const dy = y - waterbody.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= waterbody.radius) {
            return true;
        }
    }
    
    // Check clean water bodies
    for (const waterbody of cleanWaterbodies) {
        const dx = x - waterbody.x;
        const dy = y - waterbody.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= waterbody.radius) {
            return true;
        }
    }
    
    return false;
}
```

#### Step 1.3: Grid Classification Function

Add the main classification function:

``` javascript
// Add after the isInWaterBody function

// Function to classify all grid cells by terrain type
function classifyGridCells() {
    const gridWidth = Math.ceil(canvas.width / gridSize);
    const gridHeight = Math.ceil(canvas.height / gridSize);
    
    console.log(`Classifying ${gridWidth}x${gridHeight} grid cells...`);
    
    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            const cellKey = `${x},${y}`;
            const cellCenter = grid.getCellCenter(cellKey);
            
            // Check if cell center overlaps with water bodies
            if (isInWaterBody(cellCenter.x, cellCenter.y)) {
                gridClassification[cellKey] = CELL_TYPES.WATER;
            } else {
                gridClassification[cellKey] = CELL_TYPES.ACCESSIBLE;
            }
        }
    }
    
    // Count and log classification results
    const waterCells = Object.values(gridClassification).filter(type => type === CELL_TYPES.WATER).length;
    const accessibleCells = Object.values(gridClassification).filter(type => type === CELL_TYPES.ACCESSIBLE).length;
    console.log(`Grid classification complete: ${accessibleCells} accessible, ${waterCells} water cells`);
}
```

#### Step 1.4: Initialize Grid Classification

Add the classification call during initialization. Find the area where agents are created and add this before the agent creation:

``` javascript
// Add before the agents array creation (around line 180)

// Initialize grid classification
classifyGridCells();
```

#### Step 1.5: Modified d-EPR Target Selection

Replace the existing `chooseNewExplorationTarget` function with this water-aware version:

``` javascript
// Replace the existing chooseNewExplorationTarget function

// Declare function to choose new exploration target (water-aware)
function chooseNewExplorationTarget(agentInput) {
    const gridWidth = Math.ceil(canvas.width / gridSize);
    const gridHeight = Math.ceil(canvas.height / gridSize);

    // First, try to find unvisited accessible cells
    let attempts = 0;
    while (attempts < 50) { // Increased attempts for accessible cells
        const gridX = Math.floor(Math.random() * gridWidth);
        const gridY = Math.floor(Math.random() * gridHeight);
        const cellKey = `${gridX},${gridY}`;

        // Only select accessible cells that haven't been visited
        if (gridClassification[cellKey] === CELL_TYPES.ACCESSIBLE && 
            !agentInput.visitedCells[cellKey]) {
            return grid.getCellCenter(cellKey);
        }
        attempts++;
    }

    // Fallback: find any accessible cell (visited or unvisited)
    attempts = 0;
    while (attempts < 100) {
        const gridX = Math.floor(Math.random() * gridWidth);
        const gridY = Math.floor(Math.random() * gridHeight);
        const cellKey = `${gridX},${gridY}`;

        if (gridClassification[cellKey] === CELL_TYPES.ACCESSIBLE) {
            return grid.getCellCenter(cellKey);
        }
        attempts++;
    }

    // Final fallback: return current position (should rarely happen)
    console.warn("Could not find accessible cell, agent staying in place");
    return { x: agentInput.x, y: agentInput.y };
}
```

#### Step 1.6: Water-Aware Return Target Selection

Replace the existing `chooseReturnTarget` function:

``` javascript
// Replace the existing chooseReturnTarget function

// Function to choose return target (water-aware)
function chooseReturnTarget(agentInput) {
    // Get all accessible cells that have been visited by the agent
    const visitedAccessibleCells = Object.keys(agentInput.visitedCells).filter(cellKey => 
        gridClassification[cellKey] === CELL_TYPES.ACCESSIBLE
    );

    // If no accessible visited locations, return home
    if (visitedAccessibleCells.length === 0) {
        console.log("No accessible visited cells, returning home");
        return { x: agentInput.house.x, y: agentInput.house.y };
    }

    // Calculate total visits for accessible cells only
    const totalAccessibleVisits = visitedAccessibleCells.reduce((sum, cellKey) => 
        sum + agentInput.visitedCells[cellKey], 0
    );

    // Choose random number between 0 and total accessible visits
    let randomValue = Math.floor(Math.random() * totalAccessibleVisits);

    // Find the target cell by weighted selection
    for (const cellKey of visitedAccessibleCells) {
        randomValue -= agentInput.visitedCells[cellKey];
        if (randomValue < 0) {
            return grid.getCellCenter(cellKey);
        }
    }

    // Fallback to home
    console.log("Agent defaulting to return home");
    return { x: agentInput.house.x, y: agentInput.house.y };
}
```

#### Step 1.7: Simple Pathfinding Around Water

Add a basic pathfinding function to navigate around water bodies:

``` javascript
// Add after the chooseReturnTarget function

// Simple pathfinding to avoid water bodies
function findPathAroundWater(startX, startY, targetX, targetY) {
    // Check if direct path crosses water
    if (!pathCrossesWater(startX, startY, targetX, targetY)) {
        // Direct path is clear
        return [{ x: targetX, y: targetY }];
    }

    // Find intermediate waypoint to go around water
    const waypoint = findWaypointAroundWater(startX, startY, targetX, targetY);
    
    if (waypoint) {
        // Return path with waypoint
        return [waypoint, { x: targetX, y: targetY }];
    }

    // Fallback: direct path (shouldn't happen often)
    return [{ x: targetX, y: targetY }];
}

// Function to check if a direct path crosses water
function pathCrossesWater(startX, startY, targetX, targetY) {
    const steps = 10; // Number of points to check along the path
    
    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const checkX = startX + t * (targetX - startX);
        const checkY = startY + t * (targetY - startY);
        
        if (isInWaterBody(checkX, checkY)) {
            return true;
        }
    }
    
    return false;
}

// Function to find a waypoint around water bodies
function findWaypointAroundWater(startX, startY, targetX, targetY) {
    // Find the center of water bodies between start and target
    const midX = (startX + targetX) / 2;
    const midY = (startY + targetY) / 2;
    
    // Try waypoints at different angles around the obstacle
    const angles = [Math.PI/4, -Math.PI/4, Math.PI/2, -Math.PI/2, 3*Math.PI/4, -3*Math.PI/4];
    const waypointDistance = 60; // Distance to place waypoint from obstacle center
    
    for (const angle of angles) {
        const waypointX = midX + Math.cos(angle) * waypointDistance;
        const waypointY = midY + Math.sin(angle) * waypointDistance;
        
        // Check if waypoint is accessible and paths to/from it are clear
        if (!isInWaterBody(waypointX, waypointY) && 
            !pathCrossesWater(startX, startY, waypointX, waypointY) &&
            !pathCrossesWater(waypointX, waypointY, targetX, targetY)) {
            return { x: waypointX, y: waypointY };
        }
    }
    
    return null; // No suitable waypoint found
}
```

#### Step 1.8: Enhanced Movement Function

Add pathfinding support to agent movement:

``` javascript
// Add these properties to the agent creation function (in createAgent)
// Add after the existing d-EPR properties:

// Pathfinding properties
currentPath: [], // Array of waypoints to follow
pathIndex: 0,    // Current waypoint index
needsNewPath: true, // Flag to recalculate path
```

Modify the `moveTowardsLocation` function to support pathfinding:

``` javascript
// Replace the existing moveTowardsLocation function

// Function to move agent to specific location with pathfinding
function moveTowardsLocation(agentInput, targetLocationInput) {
    // Check if we need a new path or current path is invalid
    if (agentInput.needsNewPath || agentInput.currentPath.length === 0) {
        agentInput.currentPath = findPathAroundWater(
            agentInput.x, agentInput.y, 
            targetLocationInput.x, targetLocationInput.y
        );
        agentInput.pathIndex = 0;
        agentInput.needsNewPath = false;
    }

    // Get current waypoint
    const currentWaypoint = agentInput.currentPath[agentInput.pathIndex];
    if (!currentWaypoint) {
        // Path completed
        agentInput.needsNewPath = true;
        return;
    }

    // Calculate distance to current waypoint
    const dx = currentWaypoint.x - agentInput.x;
    const dy = currentWaypoint.y - agentInput.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= agentInput.speed) {
        // Reached current waypoint, move to next
        agentInput.pathIndex++;
        
        // If we've reached the end of the path, mark for new path calculation
        if (agentInput.pathIndex >= agentInput.currentPath.length) {
            agentInput.needsNewPath = true;
        }
    } else {
        // Move towards current waypoint
        agentInput.x += (dx / distance) * agentInput.speed;
        agentInput.y += (dy / distance) * agentInput.speed;
    }
}
```

#### Step 1.9: Update Path Recalculation Triggers

Modify the `handleDEPMovement` function to trigger path recalculation:

``` javascript
// In the handleDEPMovement function, after setting a new target, add:

// If agent is at home or work and moved back to depr mobility mode
if (!agentInput.currentTarget && agentInput.deprState.savedTarget) {
    agentInput.currentTarget = agentInput.deprState.savedTarget;
    agentInput.deprState.savedTarget = null;
    agentInput.needsNewPath = true; // Add this line
}

// In the target selection section, after setting currentTarget, add:
if( !agentInput.currentTarget || reachedTarget(agentInput)) {
    const pNew = agentInput.rho * Math.pow(agentInput.uniqueVisitCount, -agentInput.gamma);

    if (Math.random() < pNew) {
        agentInput.currentTarget = chooseNewExplorationTarget(agentInput);
    } else {
        agentInput.currentTarget = chooseReturnTarget(agentInput);
    }
    
    agentInput.needsNewPath = true; // Add this line
}
```

#### Step 1.10: Update Reset Function

Add grid classification reset to the reset function:

``` javascript
// In the reset function, after clearing occupiedGridCells, add:

function reset() {
    console.log("resetting simulation");

    // Clear occupied grid cells so new buildings can be placed
    occupiedGridCells.clear();

    // Reset grid classification
    Object.keys(gridClassification).forEach(key => delete gridClassification[key]);
    classifyGridCells();

    // ... rest of existing reset code
}
```

#### Step 1.11: Visual Debugging (Optional)

Add grid classification visualization for debugging:

``` javascript
// Add this function for debugging (optional)
function drawGridClassification() {
    for (const cellKey in gridClassification) {
        const center = grid.getCellCenter(cellKey);
        const cellType = gridClassification[cellKey];
        
        if (cellType === CELL_TYPES.WATER) {
            ctx.fillStyle = 'rgba(0, 0, 255, 0.2)'; // Light blue overlay
            ctx.fillRect(
                center.x - gridSize/2, 
                center.y - gridSize/2, 
                gridSize, 
                gridSize
            );
        } else if (cellType === CELL_TYPES.ACCESSIBLE) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.1)'; // Light green overlay
            ctx.fillRect(
                center.x - gridSize/2, 
                center.y - gridSize/2, 
                gridSize, 
                gridSize
            );
        }
    }
}

// Add this call in drawScene function (optional, for debugging):
// drawGridClassification();
```

### Phase 1 Testing Checklist

After implementing these steps, verify:

1.  **Grid Classification**: Console should show classification count on startup
2.  **Target Selection**: Agents should avoid selecting water cells as targets
3.  **Pathfinding**: Agents should navigate around water bodies instead of through them
4.  **Performance**: Simulation should maintain smooth performance with pathfinding
5.  **Visual Behavior**: Agents should visibly avoid crossing water during mobility phases

### Phase 1 Implementation Order

1.  Add constants and data structures (Steps 1.1-1.2)
2.  Implement grid classification (Steps 1.3-1.4)
3.  Update target selection functions (Steps 1.5-1.6)
4.  Add pathfinding system (Steps 1.7-1.8)
5.  Update movement integration (Step 1.9)
6.  Update reset functionality (Step 1.10)
7.  Add debugging tools if needed (Step 1.11)

## Phase 2

1.  Implement thirst system
2.  Implement agent defecation logic
3.  Add water-seeking behavior triggers
4.  Add contamination logic

## Conclusion

This water body obstacle avoidance update represents a crucial step toward more realistic agent behavior modeling in the cholera transmission simulation. The hybrid approach provides a clear roadmap for incremental improvements while maintaining system stability and performance.

The implementation will significantly enhance the scientific validity of the simulation by ensuring agents interact with water sources in realistic patterns, leading to more accurate modeling of cholera transmission dynamics in communities.

------------------------------------------------------------------------

**Document Status**: Initial Documentation\
**Date**: August 18, 2025\
**Next Review**: After Phase 1 Implementation\
**Related Files**: `sim_depr_mobility.js`, `03-depr-mobility-house-work.md`