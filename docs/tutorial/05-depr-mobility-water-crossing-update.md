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
    // Calculate how many grid in the canvas
    const gridWidth = Math.ceil(canvas.width / gridSize);
    const gridHeight = Math.ceil(canvas.height / gridSize);

    // Calculate cell radius for overlap detection (diagonal half-distance)
    const cellRadius = gridSize * Math.sqrt(2) / 2;
    
    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            const cellKey = `${x},${y}`;
            const cellCenter = grid.getCellCenter(cellKey);
            
            // Check if cell overlaps with water bodies
            if (isInWaterBody(cellCenter.x, cellCenter.y, cellRadius)) {
                // if the cell overlaps with water, classify as water
                gridClassification[cellKey] = CELL_TYPES.WATER;
            } else {
                // if the cell doesn't overlap with water, classify as accessible
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

-   `gridClassification` → is an empty object

#### Step 1.2: Water Body Detection Function

Add this helper function to detect (or check) if a coordinate is within a water body:

``` javascript
// Add after the grid classification constants

// Function to check if a coordinate is within any water body
// CheckRadius: 0 for point detection, >0 for cell overlap detection
function isInWaterBody(x, y, checkRadius = 0) {
    // check if the coordinate is within any contaminated waterbody
    for (const waterbody of contaminatedWaterbodies) {
        const dx = x - waterbody.x;
        const dy = y - waterbody.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= waterbody.radius + checkRadius) {
            return true;       // return true when the point/cell overlaps with contaminated waterbody
        }
    }
    
    // check if the coordinate is within any clean waterbody
    for (const waterbody of cleanWaterbodies) {
        const dx = x - waterbody.x;
        const dy = y - waterbody.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= waterbody.radius + checkRadius) {
            return true;         // return true when the point/cell overlaps with clean waterbody
        }
    }
    
    return false;
}
```

**Concept:** This function determines whether a given coordinate point (x, y) falls within any water body in the simulation.

**Code Breakdown:**

**PURPOSE**: Core collision detection function that checks if a coordinate overlaps with any circular water body (both contaminated and clean water sources).

**ALGORITHM OVERVIEW**: 1. **Dual Water Body Check**: Tests coordinates against both contaminated and clean water body arrays 2. **Circular Collision Detection**: Uses distance formula to determine if point is within circular water body boundaries 3. **Early Return Optimization**: Returns `true` immediately when first water body collision is detected 4. **Fallback Return**: Returns `false` if no water body contains the coordinate

**STEP-BY-STEP BREAKDOWN**:

``` javascript
// STEP 1: Check contaminated water bodies
for (const waterbody of contaminatedWaterbodies) {
    const dx = x - waterbody.x;  // Calculate horizontal distance from water center
    const dy = y - waterbody.y;  // Calculate vertical distance from water center
    
    // STEP 2: Apply Pythagorean theorem to get actual distance
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // STEP 3: Compare distance to water body radius (collision detection)
    if (distance <= waterbody.radius) {
        return true;  // Point is inside this contaminated water body
    }
}

// STEP 4: Repeat same process for clean water bodies
for (const waterbody of cleanWaterbodies) {
    // Same distance calculation and collision detection logic
    // ...
}

// STEP 5: No collision found with any water body
return false;
```

**MATHEMATICAL CONCEPT**: - **Distance Formula**: `distance = √[(x₂-x₁)² + (y₂-y₁)²]` - **Collision Condition**: Point is inside circle if `distance ≤ radius` - **Coordinate System**: Uses canvas pixel coordinates (x, y)

**PERFORMANCE CONSIDERATIONS**: - **O(n) Complexity**: Must check against every water body in both arrays - **Early Exit**: Stops checking once first collision is found - **Mathematical Operations**: Uses expensive `Math.sqrt()` but necessary for accurate circular boundaries

**USAGE CONTEXT**: - **Grid Classification**: Called for every grid cell center during terrain classification - **Pathfinding**: Used to verify waypoint accessibility - **Movement Validation**: Ensures agents don't target water coordinates

**RETURN VALUES**: - `true`: Coordinate is inside at least one water body (contaminated or clean) - `false`: Coordinate is on accessible land (not in any water body)

#### Step 1.3: Grid Classification Function

This step is declaring a function that running a loop for gridcell to check whether the center coordinate of each cell is in the waterbody of not.

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
                gridClassification[cellKey] = CELL_TYPES.
                ACCESSIBLE;
            }
        }
    }
    
    // Count and log classification results
    const waterCells = Object.values(gridClassification).filter(type => type === CELL_TYPES.WATER).length;
    const accessibleCells = Object.values(gridClassification).filter(type => type === CELL_TYPES.ACCESSIBLE).length;
    console.log(`Grid classification complete: ${accessibleCells} accessible, ${waterCells} water cells`);
}
```

**Concept:** This function classifies every grid cell in the simulation as either `accessible` (land) or `water` (water body) by checking the center of each cell against all water bodies. This enables terrain-aware agent movement and obstacle avoidance.

**Code Breakdown:**

1.  **Calculate Grid Dimensions**

``` javascript
const gridWidth = Math.ceil(canvas.width / gridSize);
const gridHeight = Math.ceil(canvas.height / gridSize);
```

-   Calculates how many grid cells fit horizontally and vertically based on canvas size and cell size.

2.  **Log Classification Start**

``` javascript
console.log(`Classifying ${gridWidth}x${gridHeight} grid cells...`);
```

-   Outputs the grid size for debugging and progress tracking.

3.  **Iterate Over All Grid Cells**

``` javascript
for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
        const cellKey = `${x},${y}`;
        const cellCenter = grid.getCellCenter(cellKey);
        // ...
    }
}
```

-   Loops through every cell in the grid, generating a unique key and finding the cell's center coordinates.

-   `cellkey` → is a template literate to make the cell coordinate which latert in the code block will be saved as the `gridClassification` key

-   `grid.getCellCenter(cellKey);` is a function that we previously defined to determined the center coordinate cell.

-   `for (let x = 0; x < gridWidth; x++)` & `for (let y = 0; y < gridHeight; y++)` → to make a loop that going through all the cell key by looping all x value and y value

4.  **Classify Cell by Terrain Type**

``` javascript
if (isInWaterBody(cellCenter.x, cellCenter.y)) {
    gridClassification[cellKey] = CELL_TYPES.WATER;
} else {
    gridClassification[cellKey] = CELL_TYPES.ACCESSIBLE;
}
```

-   *Checks if the cell center is inside any water body. If so, marks it as `WATER`; otherwise, marks it as `ACCESSIBLE`.*

-   basically assigning the empty object of `gridClassification` with key and values:

    -   the key → `cellKey` (eg. 2,5 or 5,9)

    -   the value → `CELL_TYPES.WATER` if the grid cell is in the waterbody or `CELL_TYPES.ACCESSIBLE` if the grid cell is not inside the waterbody

5.  **Count and Log Results**

``` javascript
const waterCells = Object.values(gridClassification).filter(type => type === CELL_TYPES.WATER).length;
const accessibleCells = Object.values(gridClassification).filter(type => type === CELL_TYPES.ACCESSIBLE).length;
console.log(`Grid classification complete: ${accessibleCells} accessible, ${waterCells} water cells`);
```

*Counts the number of each cell type and logs the results for verification and debugging.*

#### Step 1.4: Initialize Grid Classification

Add the classification call during initialization. Find the area where agents are created and add this before the agent creation:

``` javascript
// Add before the agents array creation (around line 180)

// Initialize grid classification
classifyGridCells();
```

-   this code is basically calling the function declared in the previous step (`1.3`) to run the classification

-   how the `gridClassification` object will look like:

    ``` javascript
    {
      "0,0": "accessible",
      "0,1": "accessible",
      "0,2": "water",
      "0,3": "accessible",
      "0,4": "accessible",
      "1,0": "accessible",
      "1,1": "water",
      "1,2": "water",
      "1,3": "accessible",
      "1,4": "accessible",
      // ...and so on for each cell in the grid
    }
    ```

#### Step 1.5: Modified d-EPR Target Selection

This step ensures that the process of choosing target cells only selects accessible grid cells (`CELL_TYPES.ACCESSIBLE`), which are not water bodies.

Moodify the existing `chooseNewExplorationTarget` function with this water-aware version:

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
            !agentInput.visitedCells[cellKey]) { //👈UPDATE IS HERE
            return grid.getCellCenter(cellKey);
        }
        attempts++;
    }

    // Fallback: find any accessible cell (visited or unvisited)
    // 👇 ALL BELOWS ARE UPDATES
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

    // Final fallback: find any random grid cells
    const gridX = Math.floor(Math.random() * gridWidth);
    const gridY = Math.floor(Math.random() * gridHeight);
    return grid.getCellCenter(`${gridX},${gridY}`);
}
```

the update are :

1.  new condition checking when choosing for the grid cell exploration

    ``` javascript
    if (gridClassification[cellKey] === CELL_TYPES.ACCESSIBLE && 
                !agentInput.visitedCells[cellKey]) { //👈UPDATE IS HERE
                return grid.getCellCenter(cellKey);
            }
            attempts++;
    ```

    -   `gridClassification[cellKey] === CELL_TYPES.ACCESSIBLE` → to check if the grid cell is classified as accessible

2.  making new fallback

    ``` javascript
    // ALL THESE ARE UPDATED CODE
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
    ```

    -   These code are fall back if cannot find unvisited and accessible grid cells.

    -   It will find random accessible cells

3.  Final fallback to find any random cells

    ``` javascript
    // if all cells are visited, or could not find accessible cell, return random cell
    const gridX = Math.floor(Math.random() * gridWidth);
    const gridY = Math.floor(Math.random() * gridHeight);
    return grid.getCellCenter(`${gridX},${gridY}`);
    ```

    -   find any random cells as final fallback

#### Step 1.6: Water-Aware Return Target Selection

Modify the existing `chooseReturnTarget` function:

``` javascript
// Replace the existing chooseReturnTarget function

// Function to choose return target (water-aware)
function chooseReturnTarget(agentInput) {
    // Get all accessible cells that have been visited by the agent
    const visitedAccessibleCells = Object.keys(agentInput.visitedCells).filter(cellKey => 
        gridClassification[cellKey] === CELL_TYPES.ACCESSIBLE
    ); //👈 UPDATE IN THIS LINE

    // If no accessible visited locations, return home
    if (visitedAccessibleCells.length === 0) {
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

Update:

1.  Get all the accessible cell that has been visited by the agent

    ``` javascript
    const visitedAccessibleCells = Object.keys(agentInput.visitedCells).filter(cellKey => 
            gridClassification[cellKey] === CELL_TYPES.ACCESSIBLE
        );
    ```

    -   `Object.keys(agentInput.visitedCells)` → get all the cell keys that the agent has visited (eg, "3,5", "7.1") which stored in the agent's `visitedCells` property

    -   `.filter(cellKey => gridClassification[cellKey] === CELL_TYPES.ACCESSIBLE)`

        -   for each visited cells, check if the cells is classified as `accessible` in the `gridCLassification` object or not

    -   the result `visitedAccessibleCells` → is an array of cell key that the agent has visitedf and that are accessible

    -   **How are cell keys passed from [agent.visitedCells](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) to [gridClassification](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)?**

        -   [Object.keys(agentInput.visitedCells)](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) gets all the cell keys (like `"3,5"`, `"7,2"`) that the agent has visited.

        -   The `.filter(cellKey => ...)` part loops through each of these keys, calling them [cellKey](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) one by one.

    -   **How does the check work?**

        -   For each [cellKey](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html), it checks:\
            [gridClassification\[cellKey\] === CELL_TYPES.ACCESSIBLE](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)

        -   Here, [gridClassification\[cellKey\]](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) looks up the terrain type for that cell (the value, not the key).

        -   [CELL_TYPES.ACCESSIBLE](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) is the string value `"accessible"`.

        -   ?? how could [`gridClassification[cellKey]`](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) look up for the value not the key? is it automatically??

    -   **Is [CELL_TYPES.ACCESSIBLE](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) a value or a key?**

        -   It is a value.

            -   [CELL_TYPES](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) is an object:\
                `{ ACCESSIBLE: 'accessible', WATER: 'water', ... }`

            -   So [CELL_TYPES.ACCESSIBLE](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) is the string `'accessible'`.

        -   In [gridClassification](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html), the key is the cell coordinate string (e.g., `"3,5"`), and the value is the terrain type (e.g., `'accessible'`).

2.  Make the agent return to home as fallback

    ``` javascript
    if (visitedAccessibleCells.length === 0) {
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

## Code Breakdown: Pathfinding Functions

### 1. Main Pathfinding Function: `findPathAroundWater()`

``` javascript
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
```

**Step-by-step breakdown:**

1.  **Function Purpose**: Creates a path from start to target, avoiding water bodies

2.  **Input Parameters**: Start coordinates (startX, startY) and target coordinates (targetX, targetY)

3.  **Direct Path Check**:

    ``` javascript
    // Check if direct path crosses water
    if (!pathCrossesWater(startX, startY, targetX, targetY)) {
        // Direct path is clear
        return [{ x: targetX, y: targetY }];
    }
    ```

    -   `!pathCrossesWater()` → Check if the path from start to target is clear from waterbody

    -   `return [{ x: targetX, y: targetY }];` → If direct path is clear, return array with only the target coordinate. It will automatically out of the function

4.  **Obstacle Detected**: If direct path crosses water, find a waypoint to go around it

    -   if it pass the `if (!pathCrossesWater(startX, startY, targetX, targetY))` condition, it means the path is crossing waterbody

    -   This it like `else` condition

5.  **Waypoint Creation**:

    -   Call `findWaypointAroundWater()` to find intermediate wayfinding point

6.  **Two-Step Path**:

    ``` javascript
    if (waypoint) {
        // return path with waypoint
        return [waypoint, { x: targetInputX, targetInputY }];
    }
    ```

    -   `if (waypoint)` → If waypoint found (`true`),

    -   `return [waypoint, { x: targetInputX, targetInputY }]` → return path with waypoint first, then target

7.  **Fallback Safety**: If no waypoint found, return direct path (rare emergency case)

    -   `return [{ x: targetInputX, y: targetInputY}];`

**Return Value**: Array of coordinate objects representing the path to follow

### 2. Path Collision Detection: `pathCrossesWater()`

``` javascript
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
```

**Step-by-step breakdown:**

1.  **Function Purpose**: Determines if a straight line path crosses any water body. Conceptually it breaks 10 steps between the start position (where the agent at that moment) to the target point. It will check if any of those path is on the waterbody or not
2.  **Sampling Strategy**: Check 10 evenly spaced points along the path
3.  **Loop Setup**: `for (let i = 0; i <= steps; i++)` - iterate through 11 points (0 to 10)
4.  **Progress Calculation**: `const t = i / steps;` - creates values from 0.0 to 1.0
    -   When i=0: t=0.0 (start point)
    -   When i=5: t=0.5 (middle point)
    -   When i=10: t=1.0 (end point)
5.  **Linear Interpolation**: Calculate intermediate coordinates using formula:
    -   `checkX = startX + t * (targetX - startX)` - X coordinate at position t
    -   `checkY = startY + t * (targetY - startY)` - Y coordinate at position t
6.  **Water Collision Check**: `isInWaterBody(checkX, checkY)` - test if point is in water
7.  **Early Return**: If any point touches water, immediately return `true`
8.  **Clear Path**: If all points are safe, return `false` (path is clear)
9.  return `true` → if at any point from the start to the target point there is water body.
10. return `false` → it the path between start to the target point is clear without any waterbod

**Mathematical Concept**: Linear interpolation between two points

**Why 10 steps?**: Balance between accuracy and performance - catches most water crossings

### 3. Waypoint Generation: `findWaypointAroundWater()`

``` javascript
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

        // cherck if waypoint is within the canvas boundaries
        if (waypointX < 0 || waypointX > canvas.width || waypointY < 0 || waypointY > canvas.height) {
            continue; // Skip this waypoint if it's outside canvas
        }
        
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

**Conceptually:**

this function is to find new coordinate location that avoiding the water body by calculating the midpoint between the start and target point. This function is to make the agent detour around the water body. it return with `waypointX` and `waypointY` as new target coordinate to avoid waterbody.

**Step 1:** Find the midpoint between start and target (estimated obstacle center)

**Step 2:** Calculate 6 potential waypoints around this midpoint, each 60 pixels away at different angles (45°, -45°, 90°, -90°, 135°, -135°)

**Step 3:** For each waypoint, check if it's on dry land (not in water body) AND both paths (start→waypoint and waypoint→target) are clear of water

**Step 4:** Return the first valid waypoint found, or null if none work

**Step-by-step breakdown:**

1.  **Function Purpose**: Find an intermediate point that allows navigation around water obstacles

2.  **Obstacle Center Estimation**:

    ``` javascript
    const midX = (startX + targetX) / 2;
    const midY = (startY + targetY) / 2;
    ```

    -   Calculate the **midpoint** between start and target
    -   This function assume the obstacle (water body) is roughly in the middle of the direct path between start and target point
    -   This give us a center point to navigates around

3.  **Angle Strategy Setup**:

    ``` javascript
    const angles = [Math.PI/4, -Math.PI/4, Math.PI/2, -Math.PI/2, 3*Math.PI/4, -3*Math.PI/4];
    ```

    -   Declare constanta `angles` that is an array of 6 angles to try
    -   Declare six different directions to try around the obstacle:
        -   `Math.PI/4` = 45° (northeast)
        -   `-Math.PI/4` = -45° (southeast)
        -   `Math.PI/2` = 90° (north)
        -   `-Math.PI/2` = -90° (south)
        -   `3*Math.PI/4` = 135° (northwest)
        -   `-3*Math.PI/4` = -135° (southwest)

4.  **Distance Parameter**:

    ``` javascript
    const waypointDistance = 60; // Distance to place waypoint from obstacle center
    ```

    -   Fixed distance of 60 pixels from estimated obstacle center
    -   Should be larger than typical water body radius
    -   `60` to make sure because the radius of the waterbody is less than 60, so 60 is the save value

5.  **Waypoint Generation Loop**:

    ``` javascript
    for (const angle of angles) {
        // declare new way point
        const waypointX = midX + Math.cos(angle) * waypointDistance;
        const waypointY = midY + Math.sin(angle) * waypointDistance;
    ```

    -   Making loop to try each angle in sequence

    -   Use polar coordinates: `x = centerX + radius * cos(angle)`

    -   Use polar coordinates: `y = centerY + radius * sin(angle)`

    -   `midX, midY` = center point where we think the obstacle is

    -   `Math.cos(angle) * wayPointDistance` = how far to move in x direction

    -   `Math.sin(angle) * wayPointDistance` = how far to move in Y direction

    -   in this step basically the `waypoint` is position from the midpoint (`midX` and `midY`)

6.  **Waypoint Validation (checking condition)**:

    ``` javascript
    if (!isInWaterBody(waypointX, waypointY) && 
        !pathCrossesWater(startX, startY, waypointX, waypointY) &&
        !pathCrossesWater(waypointX, waypointY, targetX, targetY)) {
        return { x: waypointX, y: waypointY };
    }
    ```

    -   **First Check**: `!isInWaterBody(waypointX, waypointY)` - waypoint itself must be on land
    -   **Second Check**: `!pathCrossesWater(startX, startY, waypointX, waypointY)` - path TO waypoint must be clear
    -   **Third Check**: `!pathCrossesWater(waypointX, waypointY, targetX, targetY)` - path FROM waypoint must be clear
    -   **Success**: If all checks pass, return this waypoint
    -   **Continue**: If any check fails, try next angle

7.  **Failure Case**:

    ``` javascript
    return null; // No suitable waypoint found
    ```

    -   If all 6 angles fail validation, return null
    -   Calling function will handle this with fallback behavior

**Strategy Summary**: Try to place waypoints in 6 directions around the estimated obstacle center, testing each for accessibility and clear paths.

**Visual Example:**

```         
Agent (A) wants to reach Target (T), but there's water (W) in the way:

A ←------ WATER ------→ T
          (W W)
         (W W W)
          (W W)

The function tries waypoints around the water:
    1
8       2
A   W   T
7       3
    6
    
It tests each numbered position until it finds one where:
- Position is on land
- Path A→position is clear  
- Path position→T is clear
```

#### Step 1.8: Enhanced Movement Function

Add pathfinding support to agent movement:

``` javascript
// Add these properties to the agent creation function (in createAgent)
// Add after the existing d-EPR properties:

function createAgent(){
    // The rest of the properties
    
    // Pathfinding properties
    currentPath: [], // Array of waypoints to follow
    pathIndex: 0,    // Current waypoint index
    needsNewPath: true, // Flag to recalculate path
}
```

Modify the `moveTowardsLocation` function to support pathfinding:

``` javascript
// Replace the existing moveTowardsLocation function

// Function to move agent to specific location with pathfinding
function moveTowardsLocation(agentInput, targetLocationInput) {
    // Check if we need a new path or current path is invalid
    // This step is to check if the current part is crossing the waterbody or not, if it is, it will return with array of waypoints to avoid waterbody
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
         // else - meaning the agent is not in the target waypoint yet
        // move towards current way point
        // calculate new position
        const newX = agentInput.x + (dx/distance) * agentInput.speed;
        const newY = agentInput.y + (dy/distance) * agentInput.speed;

        //add boundaries to present agent from going off-canvas
        agentInput.x = Math.max(agentInput.radius, Math.min(canvas.width - agentInput.radius, newX));
        agentInput.y = Math.max(agentInput.radius, Math.min(canvas.height - agentInput.radius, newY));
    }
}
```

## Code Breakdown: Enhanced Movement Function

The `moveTowardsLocation` function has been enhanced to support pathfinding around water obstacles. Let's break it down into smaller, understandable chunks:

### **chunk 1: Declare properties on `createAgent`**

``` javascript
currentPath: [], // Array of waypoints to follow
pathIndex: 0,    // Current waypoint index
needsNewPath: true, // Flag to recalculate path
```

1.  `pathIndex` → Navigation progress tracker
    -   to track which waypoint in the path the agent is currently moving toward

    -   start at `0` (first waypoint)

    -   increments by `1` each time reaches a waypoint

    -   Act like a "step counter" through the navigation sequence

    -   example:

        ``` javascript
        // If path = [{x: 100, y: 200}, {x: 300, y: 400}]
        pathIndex = 0  // Moving to first waypoint (detour point)
        pathIndex = 1  // Moving to second waypoint (final destination)
        ```
2.  `currentPath` → Navigation Route storage
    -   purpose: Stores the complete sequence of waypoints the agent must follow to reach its destination

    -   `[]` → initial stage is an empty array

    -   Array of coordinate objects: `[{x, y}, {x, y}, ...]`

    -   Created by `findPathAroundWater()` function

    -   Usually contains 1-2 waypoints (direct path or detour path)
3.  `needsNewPath` → Recalculation Flag
    -   purpose: signals, when the agent need to calculate a new navigation route

    -   when it becomes `true`

        -   agent reaches end of the current path

        -   agent gets a new target destination

        -   Agent changes schedule modes (home/work/DEPR mobility)

### **Chunk 1: Path Calculation and Initialization**

``` javascript
// Check if we need a new path or current path is invalid
if (agentInput.needsNewPath || agentInput.currentPath.length === 0) {
    agentInput.currentPath = findPathAroundWater(
        agentInput.x, agentInput.y, 
        targetLocationInput.x, targetLocationInput.y
    );
    agentInput.pathIndex = 0;
    agentInput.needsNewPath = false;
}
```

**Purpose**: Determines if the agent needs a new path and calculates one if necessary.

**Step-by-step breakdown**:

1\. `agentInput.needsNewPath || agentInput.currentPath.length === 0` → **Check Condition**

-   `agentInput.needsNewPath` → condition if `needsNewPath` property in `agentInput` is `true`. indicates path recalculation is required

-   `currentPath.length === 0` means no existing path exists

-   this is the condition where no path destionation and needs new path

2\. `agentInput.currentPath = findPathAroundWater( agentInput.x, agentInput.y, targetLocationInput.x, targetLocationInput.y );` → **Path Calculation**

-   `findPathAroundWater()` returns an array of waypoints to follow

-   Input:

    -   agent's current position (`agentInput.x` & `agentInput.Y`)

    -   and target destination (`targetLocationInput.x` & \``targetLocationInput.y`)

-   Output: array like `[{x: 100, y: 200}, {x: 300, y: 400}]` (waypoint, then final target)

-   So instead of the agent directly heading to the target as as the initial function, it now have an array of point as target coordinate

3\. `agentInput.pathIndex = 0`

-   Reset Path Index

-   starts navigation from the first waypoint or target

4\. `agentInput.needsNewPath = false;`

-   Prevents unnecessary recalculation until needed

### **Chunk 2: Current Waypoint Retrieval**

``` javascript
// Get current waypoint
const currentWaypoint = agentInput.currentPath[agentInput.pathIndex];
if (!currentWaypoint) {
    // Path completed
    agentInput.needsNewPath = true;
    return;
}
```

**Purpose**: Gets the next destination point in the path sequence.

**Step-by-step breakdown**:

1\. `const currentWaypoint = agentInput.currentPath[agentInput.pathIndex]`

-   **Get Current Target**: `currentPath[pathIndex]` retrieves the current waypoint to move toward
-   to get the current target which is:
    -   If `pathIndex = 0`: get first waypoint (detour point)

    -   If `pathIndex = 1`: get second waypoint (final destination)
-   The `pathIndex` acts as a pointer to which waypoint the agent should currently be moving towards in their path. 
-   the output of `currentWaypoint` is coordinate of the current point or target

2.  `if (!currentWaypoint)` → check if waypoint not exist
    -   If no waypoint exists, meaning the path is complete
3.  `agentInput.needsNewPath = true;`
    -   if the path is complete, set `needsNewPath = true` for next movement cycle
4.  `return;`
    -   `return` stops further execution

    -   exit the function

### **Chunk 3: Distance Calculation and Movement Logic**

``` javascript
// Calculate distance to current waypoint
const dx = currentWaypoint.x - agentInput.x;
const dy = currentWaypoint.y - agentInput.y;
const distance = Math.sqrt(dx * dx + dy * dy);
```

**Purpose**: Calculates how far the agent is from its current target waypoint.

**Step-by-step breakdown**:

1\. **X Distance**: `dx = currentWaypoint.x - agentInput.x` (horizontal gap)

2\. **Y Distance**: `dy = currentWaypoint.y - agentInput.y` (vertical gap)

3\. **Straight-line Distance**: `Math.sqrt(dx * dx + dy * dy)` (Pythagorean theorem) - Formula: `distance = √[(x₂-x₁)² + (y₂-y₁)²]`

### **Chunk 4: Waypoint Reached Detection**

``` javascript
if (distance <= agentInput.speed) {
    // Reached current waypoint, move to next
    agentInput.pathIndex++;
    
    // If we've reached the end of the path, mark for new path calculation
    if (agentInput.pathIndex >= agentInput.currentPath.length) {
        agentInput.needsNewPath = true;
    }
}
```

**Purpose**: Detects when agent reaches a waypoint and advances to the next one.

**Step-by-step breakdown**:

1\. **Proximity Check**: `distance <= agentInput.speed`

-   If distance is less than movement speed, consider waypoint "**reached**"

2\. **Advance to Next**: `agentInput.pathIndex++` moves to next waypoint in sequence

3\. **End of Path Check**: `agentInput.pathIndex >= agentInput.currentPath.length` means no more waypoints

4\. **Request New Path**: `agentInput.needsNewPath = true` triggers path recalculation for next cycle

### **Chunk 5: Movement Execution**

``` javascript
} else {
    // Move towards current waypoint
    agentInput.x += (dx / distance) * agentInput.speed;
    agentInput.y += (dy / distance) * agentInput.speed;
}
```

**Purpose**: Moves the agent toward the current waypoint if not yet reached.

**Step-by-step breakdown**:

1\. **Normalize Direction**: `(dx / distance)` and `(dy / distance)` create unit vector - Converts distance into direction (values between -1 and 1) - Ensures consistent movement speed regardless of distance

2\. **Apply Speed**: Multiply normalized direction by `agentInput.speed`

3\. **Update Position**: Add movement values to agent's current coordinates

4\. **Result**: Agent moves at constant speed toward current waypoint

### **Overall Function Flow**

```         
1. Need new path? → Calculate path around water
2. Get current waypoint from path
3. Calculate distance to waypoint
4. If close enough → Move to next waypoint
5. If not close → Move toward current waypoint
6. Repeat until path complete
```

**Key Benefits of This Approach**: - **Water Avoidance**: Uses pathfinding to navigate around obstacles - **Smooth Movement**: Maintains constant speed and direction - **Flexible Navigation**: Handles multi-step paths with waypoints - **Efficient Updates**: Only recalculates path when necessary

### **Example Scenario**

**Initial Setup:**

``` javascript
// Agent is at position (100, 200)
// Work location is at (400, 300)
// Water body blocks the direct path

// After calling findPathAroundWater(), the agent gets:
agentInput.currentPath = [
    { x: 250, y: 150 },  // Index 0: waypoint around the water
    { x: 400, y: 300 }   // Index 1: final destination (work)
];
agentInput.pathIndex = 0;  // Start with first waypoint
```

**Step-by-step movement:**

**Frame 1-20:** Moving to first waypoint

``` javascript
agentInput.pathIndex = 0;
const currentWaypoint = agentInput.currentPath[0];  // Gets { x: 250, y: 150 }
// Agent moves towards (250, 150) - the waypoint around water
```

**Frame 21:** Agent reaches first waypoint

``` javascript
// Distance check shows agent reached waypoint
agentInput.pathIndex++;  // Now pathIndex becomes 1
```

**Frame 22-40:** Moving to final destination

``` javascript
agentInput.pathIndex = 1;
const currentWaypoint = agentInput.currentPath[1];  // Gets { x: 400, y: 300 }
// Agent moves towards (400, 300) - the work location
```

**Frame 41:** Agent reaches work

``` javascript
agentInput.pathIndex++;  // Now pathIndex becomes 2
// pathIndex (2) >= currentPath.length (2), so path is complete
agentInput.needsNewPath = true;  // Ready for next path calculation
```

##### Visual Representation

``` javascript
Start (100,200) → Waypoint (250,150) → Work (400,300)
      ↑                ↑                    ↑
   pathIndex=0      pathIndex=1         pathIndex=2
                                      (path complete)
```

#### Step 1.9: Update Path Recalculation Triggers

Modify the `handleDEPRMovement` function to trigger path recalculation:

``` javascript
// In the handleDEPRMovement function, after setting a new target, add:

// If agent is at home or work and moved back to depr mobility mode
if (!agentInput.currentTarget && agentInput.deprState.savedTarget) {
    agentInput.currentTarget = agentInput.deprState.savedTarget;
    agentInput.deprState.savedTarget = null;
    agentInput.needsNewPath = true; // ←←← Add this line
}

// In the target selection section, after setting currentTarget, add:
if( !agentInput.currentTarget || reachedTarget(agentInput)) {
    const pNew = agentInput.rho * Math.pow(agentInput.uniqueVisitCount, -agentInput.gamma);

    if (Math.random() < pNew) {
        agentInput.currentTarget = chooseNewExplorationTarget(agentInput);
    } else {
        agentInput.currentTarget = chooseReturnTarget(agentInput);
    }
    
    agentInput.needsNewPath = true; // ←←← Add this line
}
```

breakdown:

-   `agentInput.needsNewPath = true;` → to assign the agent to calculate or choose new path and target

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

**breakdown:**

``` javascript
Object.keys(gridClassification).forEach(key => delete gridClassification[key]);
classifyGridCells();
```

1.  `Object.keys(gridClassification)`
    -   this gets an array of all property names (keys) in the object `gridClassification`

    -   example: if `gridClassification = {a: 1, b: 2, c: 3}` then `Object.keys(gridClassification)` gives `["a", "b", "c"]`
2.  `.forEach(key => delete gridClassification[key])`
    -   for each keys in the object, it deletes that properties

    -   effectively, this clear out (empties) the object `gridClassification`, removing all of its properties

    -   after this, the `gridClassification` is still the same object in memory bu, but now it has no keys, so equivalent to resetting it to `{}`
3.  `classifyGridCells()`
    -   calls the function `classifyGridCells()`

    -   to run new grid cells classification

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

------------------------------------------------------------------------

# Critical Bug Fixes and Improvements

## Issues Identified During Implementation

After implementing the water body obstacle avoidance system, several critical issues were discovered that caused agents to behave unexpectedly:

### Issue 1: Agents Disappearing from Simulation

**Problem**: Agents would suddenly disappear after certain periods of time during the simulation.

**Root Cause**: 1. **Pathfinding Bug**: There was a syntax error in the `findPathAroundWater()` function where `targetInputY` was used instead of `targetInputY` in the return statement 2. **Boundary Issues**: Agents could move outside canvas boundaries, making them invisible 3. **Invalid Coordinates**: Waypoints could be generated outside the canvas area

**Solutions Implemented**:

#### Fix 1: Corrected Pathfinding Return Statement

``` javascript
// BEFORE (Bug):
return [waypoint, { x: targetInputX, targetInputY }];

// AFTER (Fixed):
return [waypoint, { x: targetInputX, y: targetInputY }];
```

#### Fix 2: Added Boundary Checks to Agent Movement

``` javascript
// on function moveTowardsLocation

// Enhanced movement with boundary protection
} else {
    // Calculate new position
    const newX = agentInput.x + (dx/distance) * agentInput.speed;
    const newY = agentInput.y + (dy/distance) * agentInput.speed;
    
    // Add boundary checks to prevent agents from going off-canvas
    agentInput.x = Math.max(agentInput.radius, Math.min(canvas.width - agentInput.radius, newX));
    agentInput.y = Math.max(agentInput.radius, Math.min(canvas.height - agentInput.radius, newY));
}
```

-   ?? what is this one for??

#### Fix 3: Added Canvas Boundary Validation for Waypoints

``` javascript
// Enhanced waypoint generation with boundary checking
for (const angle of angles) {
    const waypointX = midX + Math.cos(angle) * wayPointDistance;
    const waypointY = midY + Math.sin(angle) * wayPointDistance;

    // Check if waypoint is within canvas boundaries
    if (waypointX < 0 || waypointX > canvas.width || waypointY < 0 || waypointY > canvas.height) {
        continue; // Skip this waypoint if it's outside canvas
    }

    // Continue with existing validation...
}
```

### Issue 2: Agents Still Crossing Water Bodies

**Problem**: Despite implementing grid classification, agents were still walking through water bodies.

**Root Cause**: The original grid classification only checked if the **center** of each grid cell was in water, but ignored cells where water bodies overlapped **part** of the cell area.

**Solution Implemented**:

#### Enhanced Grid Classification with Cell Overlap Detection

**Problem with Original Approach**:

``` javascript
// ORIGINAL (Inadequate): Only checked cell center
if (isInWaterBody(cellCenter.x, cellCenter.y)) {
    gridClassification[cellKey] = CELL_TYPES.WATER;
}
```

**New Improved Approach**:

``` javascript
// ENHANCED: Modify isInWaterBody to support both point and cell overlap detection
function isInWaterBody(x, y, checkRadius = 0) {
    // Check contaminated water bodies
    for (const waterbody of contaminatedWaterbodies) {
        const dx = x - waterbody.x;
        const dy = y - waterbody.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // If checkRadius is provided, check for overlap; otherwise check if point is inside
        if (distance <= waterbody.radius + checkRadius) {
            return true;
        }
    }
    
    // Check clean water bodies
    for (const waterbody of cleanWaterbodies) {
        const dx = x - waterbody.x;
        const dy = y - waterbody.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= waterbody.radius + checkRadius) {
            return true;
        }
    }
    
    return false;
}

// Updated classification function - much cleaner!
function classifyGridCells() {
    const cellRadius = gridSize * Math.sqrt(2) / 2; // Half diagonal of grid cell
    
    for (let x = 0; x < gridWidth; x++) {
        for (let y = 0; y < gridHeight; y++) {
            const cellKey = `${x},${y}`;
            const cellCenter = grid.getCellCenter(cellKey);

            // Check if ANY PART of the cell overlaps with water bodies
            if (isInWaterBody(cellCenter.x, cellCenter.y, cellRadius)) {
                gridClassification[cellKey] = CELL_TYPES.WATER;
            } else {
                gridClassification[cellKey] = CELL_TYPES.ACCESSIBLE;
            }
        }
    }
}
```

### Issue 3: Incomplete Water Body Detection Function

**Problem**: The `isInWaterBody()` function had a logic error that caused early returns and didn't properly check all water bodies.

**Root Cause**:

``` javascript
// BUGGY CODE (Original):
for (const waterbody of contaminatedWaterbodies) {
    const dx = x - waterbody.x;
    const dy = y - waterbody.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= waterbody.radius) {
        return true;
    };
    return false; // ❌ BUG: This exits the loop prematurely!
}
```

**Solution Implemented**:

``` javascript
// FIXED CODE:
function isInWaterBody(x, y) {
    // check if the coordinate is within any contaminated water body
    for (const waterbody of contaminatedWaterbodies) {
        const dx = x - waterbody.x;
        const dy = y - waterbody.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= waterbody.radius) {
            return true; // Only return true when found
        }
        // ✅ FIXED: Continue to next waterbody instead of returning false
    }

    // check if the coordinate is within any clean waterbody
    for (const waterbody of cleanWaterbodies) {
        const dx = x - waterbody.x;
        const dy = y - waterbody.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= waterbody.radius) {
            return true;
        }
    }

    return false; // ✅ FIXED: Only return false after checking all waterbodies
}
```

## Mathematical Explanation: Grid Cell Overlap Detection

### Why Cell Center Detection Wasn't Sufficient

**Original Problem**:

```         
Grid Cell (20x20 pixels):     Water Body (radius 20):
┌─────────────────────┐            ●●●●●●●
│                     │          ●●●●●●●●●●
│                     │         ●●●●●●●●●●●
│         ×           │        ●●●●●●●●●●●●
│      (center)       │         ●●●●●●●●●●●
│                     │          ●●●●●●●●●
│                     │            ●●●●●●●
└─────────────────────┘

If center (×) is outside water (●), 
cell was marked as "accessible" even though 
part of the cell overlaps with water!
```

**Enhanced Solution**:

```         
Cell Overlap Detection:
┌─────────────────────┐
│     cellRadius      │     
│         ●●●●●●●     │ 
│       ●●●●●●●●●●    │
│      ●●●●×●●●●●●    │  ← If distance ≤ (waterRadius + cellRadius)
│       ●●●●●●●●●●    │     then cell overlaps with water
│         ●●●●●●●     │
└─────────────────────┘

cellRadius = gridSize * √2 / 2  (half diagonal of square cell)
```

### Mathematical Formula

**Distance Check**:

``` javascript
distance = √[(cellCenterX - waterCenterX)² + (cellCenterY - waterCenterY)²]

if (distance ≤ waterRadius + cellRadius) {
    // Cell overlaps with water body
    return true;
}
```

**Cell Radius Calculation**:

``` javascript
// For a square grid cell, the maximum distance from center to corner is half the diagonal
cellRadius = gridSize * Math.sqrt(2) / 2;

// For gridSize = 20:
cellRadius = 20 * 1.414 / 2 ≈ 14.14 pixels
```

## Testing and Validation

### Before Fixes:

-   ❌ Agents would disappear after 30-60 seconds
-   ❌ Agents walked directly through water bodies
-   ❌ Pathfinding failed near canvas edges
-   ❌ Inconsistent terrain classification

### After Fixes:

-   ✅ Agents remain visible throughout simulation
-   ✅ Agents properly navigate around water bodies
-   ✅ Pathfinding works reliably near edges
-   ✅ Accurate terrain classification with cell overlap detection

## Implementation Recommendations

### For Future Water Body Avoidance Systems:

1.  **Always use overlap detection** rather than point-in-circle for grid classification
2.  **Include boundary validation** for all generated waypoints and movement
3.  **Test edge cases** like agents near canvas boundaries
4.  **Validate pathfinding return values** for correct coordinate properties
5.  **Use visual debugging** to verify grid classification accuracy

### Code Review Checklist:

-   [ ] All return statements use correct variable names
-   [ ] Boundary checks prevent off-canvas movement
-   [ ] Grid classification considers cell overlap, not just centers\
-   [ ] Loop logic doesn't have premature returns
-   [ ] Mathematical formulas are implemented correctly

## Performance Impact

The enhanced grid classification and boundary checking adds minimal computational overhead:

-   **Grid Classification**: O(n) where n = number of grid cells (one-time cost)
-   **Cell Overlap Detection**: O(w) where w = number of water bodies per cell check
-   **Boundary Checks**: O(1) per agent movement
-   **Overall Impact**: \< 5% performance decrease for significantly improved accuracy

## Conclusion of Bug Fixes

These critical fixes transform the water body avoidance system from a partially functional prototype into a robust, reliable navigation system. The improvements ensure:

1.  **Agent Persistence**: No more disappearing agents
2.  **Water Avoidance**: True obstacle avoidance around water bodies\
3.  **Boundary Safety**: Agents stay within simulation area
4.  **Mathematical Accuracy**: Proper overlap detection for terrain classification

The enhanced system now provides a solid foundation for Phase 2 implementation (behavioral motivation system) and future advanced pathfinding features.