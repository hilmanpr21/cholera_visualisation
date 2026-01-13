# Gravity Kernel D-EPR Mobility Implementation Guide

## Overview

This tutorial explains the implementation of gravity kernel density for D-EPR (Preferential Return) mobility model in the cholera simulation. The gravity kernel replaces random cell selection with distance-weighted probabilities, creating more realistic spatial movement patterns.

## Table of Contents

1.  [Mathematical Foundation](#mathematical-foundation)
2.  [Implementation Components](#implementation-components)
3.  [Step-by-Step Implementation](#step-by-step-implementation)
4.  [Code Examples](#code-examples)
5.  [Integration with D-EPR](#integration-with-d-epr)
6.  [Benefits and Improvements](#benefits-and-improvements)
7.  [Testing and Validation](#testing-and-validation)

------------------------------------------------------------------------

## Mathematical Foundation {#mathematical-foundation}

### Gravity Kernel Formula

The core formula that drives the gravity-based selection:

```         
p_ij = (A_i * A_j) / (r_ij ^ beta)
```

**Where:**

-   `p_ij` = probability/attractiveness between locations i and j

-   `A_i, A_j` = attractiveness factors (currently set to 1 as placeholder)

-   `r_ij` = Euclidean distance between locations i and j

-   `beta` = distance decay parameter (higher values = stronger preference for closer locations)

### Exploration Logic

For unvisited cells, the probability of selecting cell j is:

```         
P(j) = p_ij / Σ_k p_ik
```

This means closer unvisited cells have higher probability of being selected.

### Preferential Return Logic

For visited cells, the probability combines frequency with distance:

```         
P(j) = (f_j * p_ij) / Σ_k (f_k * p_ik)
```

**Where:**

\- `f_j` = visit frequency for cell j (how many times the agent visited)

\- This combines familiarity preference (from the visit frequency) with distance preference

------------------------------------------------------------------------

## Implementation Components {#implementation-components}

### 1. Set Global Parameters

``` javascript
const GRAVITY_KERNEL_PARAMS = {
    ATTRACTIVENESS: 1,          // A_i and A_j (placeholder for future modifications)
    BETA: 2,                    // Distance decay parameter
    MIN_DISTANCE: 1             // Prevents division by zero
};
```

**Purpose:**

-   `ATTRACTIVENESS`: Currently set to 1, can be modified for different location types

-   `BETA`: Controls how strongly distance affects selection (2 = quadratic decay)

-   `MIN_DISTANCE`: Prevents mathematical errors when agent is at exact cell center

### 2. Core Calculation Function

``` javascript
function calculateGravityKernel(distance, attractiveness1, attractiveness2, beta)
```

**Functionality:**

-   Implements the gravity kernel formula

-   Handles edge cases (minimum distance)

-   Returns probability value for location pair

### 3. Gravity-Based Exploration

``` javascript
function chooseGravityBasedExplorationTarget(agentInput)
```

**Process:**

1\. Scans all unvisited accessible cells

2\. Calculates distance from agent to each cell

3\. Computes gravity kernel probability for each

4\. Uses weighted random selection

5\. Returns selected cell coordinates

### 4. Gravity-Based Return

``` javascript
function chooseGravityBasedReturnTarget(agentInput)
```

**Process:**

1\. Gets all visited accessible cells 2. Calculates weighted probability (frequency × gravity kernel) 3. Uses weighted random selection 4. Returns selected cell coordinates

------------------------------------------------------------------------

## Step-by-Step Implementation {#step-by-step-implementation}

### Step 1: Add Global Parameters

Add the gravity kernel parameters after the grid classification storage:

``` javascript
// Grid classification storage
const gridClassification = {};

// Gravity kernel parameters for D-EPR mobility
const GRAVITY_KERNEL_PARAMS = {
    ATTRACTIVENESS: 1,          // A_i and A_j (degree of attractiveness)
    BETA: 2,                    // Distance decay parameter for gravity kernel
    MIN_DISTANCE: 1             // Minimum distance to prevent division by zero
};
```

**Purpose:**

-   `ATTRACTIVENESS`: Currently set to 1, can be modified for different location types

-   `BETA`: Controls how strongly distance affects selection (2 = quadratic decay)

-   `MIN_DISTANCE`: Prevents mathematical errors when agent is at exact cell center

### Step 2: Implement Core Gravity Kernel Function

``` javascript
/**
 * Calculate gravity kernel probability between two locations
 * Formula: p_ij = (A_i * A_j) / (r_ij ^ beta)
 */
function calculateGravityKernel(distance, attractiveness1 = GRAVITY_KERNEL_PARAMS.ATTRACTIVENESS, 
                               attractiveness2 = GRAVITY_KERNEL_PARAMS.ATTRACTIVENESS, 
                               beta = GRAVITY_KERNEL_PARAMS.BETA) {
    // Prevent division by zero
    const effectiveDistance = Math.max(distance, GRAVITY_KERNEL_PARAMS.MIN_DISTANCE);
    
    // Calculate gravity kernel
    const probability = (attractiveness1 * attractiveness2) / Math.pow(effectiveDistance, beta);
    
    return probability;
}
```

**Functionality:**

-   Implements the gravity kernel formula

    ``` plaintext
    p_ij = (A_i * A_j) / (r_ij ^ beta)
    ```

-   Handles edge cases (minimum distance)

-   Returns probability value for location pair

**Breakdown:**

``` javascript
function calculateGravityKernel(distance, attractiveness1 = GRAVITY_KERNEL_PARAMS.ATTRACTIVENESS, 
                               attractiveness2 = GRAVITY_KERNEL_PARAMS.ATTRACTIVENESS, 
                               beta = GRAVITY_KERNEL_PARAMS.BETA) {
```

-   Declaring function called `calculateGravityKernel`

-   Input parameter:

    -   `distance` → Euclidean distance between location i and j (r_ij)

    -   `attractiveness1 = GRAVITY_KERNEL_PARAMS.ATTRACTIVENESS` → Attractiveness of location i (A_i). Location i is the agent agent current location

    -   `attractiveness2 = GRAVITY_KERNEL_PARAMS.ATTRACTIVENESS` → Attractiveness of location j (A_j). Location j is the agent target location

    -    `beta = GRAVITY_KERNEL_PARAMS.BETA` → the distance decay parameter. `beta` equal to `2`

``` javaScript
// Prevent division by zero by using minimum distance
        const effectiveDistance = Math.max(distance, GRAVITY_KERNEL_PARAMS.MIN_DISTANCE);
```

-   To choose the distance, fall back incase the distance is 0, it will choose `GRAVITY_KERNEL_PARAMS.MIN_DISTANCE` which is one

-   `Math.max` → to choose the highet value between `GRAVITY_KERNEL_PARAMS.MIN_DISTANCE` (which is 1) or the `distance`

``` javaScript
// Calculate gravity kernel: p_ij = (A_i * A_j) / (r_ij ^ beta)
const probability = (attractiveness1 * attractiveness2) / Math.pow(effectiveDistance, beta);
```

-   Implement calculation of gravity kernel formula

-   `Math.pow(effectiveDistance, beta)` → `effectiveDistance`\^`beta`

-   safe the kernell calculation to `probability`

``` javaScript
return probability;
```

-   Return the `probability` value

### Step 3: Implement Gravity-Based Exploration

``` javascript
/**
 * Choose exploration target using gravity-based probability for unvisited cells
 */
function chooseGravityBasedExplorationTarget(agentInput) {
    const gridWidth = Math.ceil(canvas.width / gridSize);
    const gridHeight = Math.ceil(canvas.height / gridSize);
    
    // Collections for analysis
    const unvisitedCells = [];
    const probabilities = [];
    let totalProbability = 0;
    
    // Agent's current position
    const agentX = agentInput.x;
    const agentY = agentInput.y;
    
    // Scan all grid cells
    for (let gridX = 0; gridX < gridWidth; gridX++) {
        for (let gridY = 0; gridY < gridHeight; gridY++) {
            const cellKey = `${gridX},${gridY}`;
            
            // Check if cell is unvisited and accessible
            if (!agentInput.visitedCells[cellKey] && 
                gridClassification[cellKey] === CELL_TYPES.ACCESSIBLE) {
                
                const cellCenter = grid.getCellCenter(cellKey);
                
                // Safety check for water
                if (isPositionSafeFromWater(cellCenter.x, cellCenter.y, agentInput.radius)) {
                    // Calculate distance
                    const distance = Math.sqrt(
                        Math.pow(agentX - cellCenter.x, 2) + Math.pow(agentY - cellCenter.y, 2)
                    );
                    
                    // Calculate probability
                    const probability = calculateGravityKernel(distance);
                    
                    // Store for selection
                    unvisitedCells.push({
                        cellKey: cellKey,
                        center: cellCenter,
                        distance: distance
                    });
                    probabilities.push(probability);
                    totalProbability += probability;
                }
            }
        }
    }
    
    // Return null if no suitable cells
    if (unvisitedCells.length === 0 || totalProbability === 0) {
        return null;
    }
    
    // Weighted random selection
    let randomValue = Math.random() * totalProbability;
    
    for (let i = 0; i < unvisitedCells.length; i++) {
        randomValue -= probabilities[i];
        if (randomValue <= 0) {
            return unvisitedCells[i].center;
        }
    }
    
    // Fallback
    return unvisitedCells[unvisitedCells.length - 1].center;
}
```

**Functionality:**

-   Choose exploration target using gravity-based probability for unvisited cells

-   Selects unvisited accessible cells with probability proportional to gravity kernel

-   Formula: P(j) = p_ij / sum_k p_ik for all unvisited accessible cells k

    ``` plaintext
    P(j) = p_ij / Σ_k p_ik
    ```

**Process:**

1\. Scans all unvisited accessible cells

2\. Calculates distance from agent to each cell

3\. Computes gravity kernel probability for each

4\. Uses weighted random selection

5\. Returns selected cell coordinates or null if no suitable target found

**Breakdown:**

``` javaScript
function chooseGravityBasedExplorationTarget(agentInput)
```

-   Declare function `chooseGravityBasedExplorationTarget`

-   taking parameter `agentInput` → agent object that containing agent current position and visited cells

``` javcaScript
const gridWidth = Math.ceil(canvas.width / gridSize);
const gridHeight = Math.ceil(canvas.height / gridSize);
```

-   calculate total grid

### Step 4: Implement Gravity-Based Return

``` javascript
/**
 * Choose return target using gravity-based preferential return
 */
function chooseGravityBasedReturnTarget(agentInput) {
    // Get visited accessible cells
    const visitedAccessibleCells = Object.keys(agentInput.visitedCells).filter(cellKey => 
        gridClassification[cellKey] === CELL_TYPES.ACCESSIBLE
    );

    // Fallback to home if no visited cells
    if (visitedAccessibleCells.length === 0) {
        return { x: agentInput.house.x, y: agentInput.house.y };
    }

    // Agent's current position
    const agentX = agentInput.x;
    const agentY = agentInput.y;
    
    // Calculate weighted probabilities
    const cellData = [];
    const weightedProbabilities = [];
    let totalWeightedProbability = 0;
    
    for (const cellKey of visitedAccessibleCells) {
        const cellCenter = grid.getCellCenter(cellKey);
        const frequency = agentInput.visitedCells[cellKey]; // f_j
        
        // Calculate distance
        const distance = Math.sqrt(
            Math.pow(agentX - cellCenter.x, 2) + Math.pow(agentY - cellCenter.y, 2)
        );
        
        // Calculate gravity probability
        const gravityProbability = calculateGravityKernel(distance);
        
        // Calculate weighted probability: f_j * p_ij
        const weightedProbability = frequency * gravityProbability;
        
        cellData.push({
            cellKey: cellKey,
            center: cellCenter,
            frequency: frequency,
            distance: distance,
            gravityProbability: gravityProbability
        });
        weightedProbabilities.push(weightedProbability);
        totalWeightedProbability += weightedProbability;
    }
    
    // Fallback to home if zero probability
    if (totalWeightedProbability === 0) {
        return { x: agentInput.house.x, y: agentInput.house.y };
    }
    
    // Weighted random selection
    let randomValue = Math.random() * totalWeightedProbability;
    
    for (let i = 0; i < cellData.length; i++) {
        randomValue -= weightedProbabilities[i];
        if (randomValue <= 0) {
            return cellData[i].center;
        }
    }
    
    // Final fallback
    return cellData[cellData.length - 1].center;
}
```

### Step 5: Update D-EPR Movement Logic

Replace the random selection in `handleDEPRMovement()`:

``` javascript
// OLD CODE (REMOVED):
if (Math.random() < pNew) {
    agentInput.currentTarget = chooseNewExplorationTarget(agentInput);
} else {
    agentInput.currentTarget = chooseReturnTarget(agentInput);
}

// NEW CODE:
if (Math.random() < pNew) {
    // Gravity-based exploration
    agentInput.currentTarget = chooseGravityBasedExplorationTarget(agentInput);
    
    // If no unvisited cells available, switch to return behavior naturally
    if (!agentInput.currentTarget) {
        agentInput.currentTarget = chooseGravityBasedReturnTarget(agentInput);
    }
} else {
    // Gravity-based return
    agentInput.currentTarget = chooseGravityBasedReturnTarget(agentInput);
}
```

### Step 6: Update Stuck Detection

Also update the stuck detection logic:

``` javascript
// Force new gravity-based exploration target for stuck agents
agentInput.currentTarget = chooseGravityBasedExplorationTarget(agentInput);

// If no unvisited cells available, use return behavior
if (!agentInput.currentTarget) {
    agentInput.currentTarget = chooseGravityBasedReturnTarget(agentInput);
}
```

### Step 7: Remove Legacy Functions

The old random selection functions can now be safely removed: - `chooseNewExplorationTarget()` - No longer needed - `chooseReturnTarget()` - No longer needed

These functions have been completely replaced by the gravity-based implementations which include their own robust fallback mechanisms.

------------------------------------------------------------------------

## Integration with D-EPR {#integration-with-d-epr}

### How It Works with Existing D-EPR Logic

1.  **D-EPR Decision Making**: The original d-EPR formula still determines whether to explore or return:

    ``` javascript
    const pNew = agentInput.rho * Math.pow(agentInput.uniqueVisitCount, -agentInput.gamma);
    ```

2.  **Enhanced Target Selection**: Instead of random selection, gravity kernel provides spatial reasoning:

    -   **Explore**: Prefers closer unvisited cells
    -   **Return**: Prefers frequently visited, nearby cells

3.  **Preserved Safety**: All water avoidance and safety checks remain intact

4.  **Maintained Scheduling**: Daily schedule (home/work/mobile) system unchanged

### Behavioral Changes

**Before (Random Selection):** - Agents could jump to any accessible cell randomly - No spatial coherence in movement patterns - Equal probability for all valid cells

**After (Gravity Kernel):** - Agents prefer nearby targets - Movement patterns show spatial clustering - Frequently visited areas become "attractors" - More realistic human-like movement

------------------------------------------------------------------------

## Benefits and Improvements {#benefits-and-improvements}

### 1. Realistic Movement Patterns

-   **Spatial Coherence**: Agents move in spatially coherent patterns
-   **Distance Preference**: Closer locations are naturally preferred
-   **Clustering**: Movement concentrates in familiar areas

### 2. Configurable Behavior

``` javascript
// Modify BETA for different distance preferences:
BETA: 1,    // Linear distance decay
BETA: 2,    // Quadratic distance decay (default)
BETA: 3,    // Strong preference for nearby locations
```

### 3. Future Extensibility

``` javascript
// Different attractiveness for location types:
ATTRACTIVENESS: {
    MARKET: 2,     // Markets are more attractive
    WATER: 1.5,    // Water sources moderately attractive
    RESIDENTIAL: 1  // Normal residential areas
}
```

### 4. Maintains All Safety Features

-   Water avoidance preserved
-   Pathfinding integration maintained
-   Boundary checking intact
-   Fallback mechanisms included

------------------------------------------------------------------------

## Testing and Validation {#testing-and-validation}

### 1. Visual Observation

-   **Agent Trails**: Check if movement patterns show spatial clustering
-   **Water Avoidance**: Ensure agents still avoid water bodies
-   **Return Behavior**: Verify agents return to frequently visited areas

### 2. Console Logging

The implementation includes detailed logging:

``` javascript
console.log(`Gravity-based exploration: selected cell at distance ${distance.toFixed(1)}`);
console.log(`Gravity-based return: selected cell (freq=${frequency}, dist=${distance.toFixed(1)})`);
```

### 3. Parameter Adjustment

Test different `BETA` values to observe behavioral changes:

``` javascript
// More random (weaker distance preference)
BETA: 1

// Default (moderate distance preference)  
BETA: 2

// Highly clustered (strong distance preference)
BETA: 3
```

### 4. Performance Monitoring

-   Check frame rate impact during simulation
-   Monitor memory usage with large agent populations
-   Verify no infinite loops in selection algorithms

------------------------------------------------------------------------

## Fallback Mechanisms

The implementation includes robust internal safety nets that eliminate the need for external fallbacks:

### 1. **Exploration Fallbacks** (Internal to `chooseGravityBasedExplorationTarget`)

-   **No unvisited cells**: Returns `null`, naturally triggering return behavior
-   **Zero probability sum**: Mathematical safeguards prevent division by zero
-   **Water safety**: Multiple layers of water avoidance checks

### 2. **Return Fallbacks** (Internal to `chooseGravityBasedReturnTarget`)

-   **No visited cells**: Automatically returns home location
-   **Zero probability sum**: Fallback to home location\
-   **Mathematical stability**: Uses safe probability calculations

### 3. **System-Level Fallbacks**

-   **Exploration failure**: Automatically switches to return behavior
-   **Complete failure**: Agent returns to home location
-   **Stuck agent recovery**: Uses enhanced gravity-based logic

### 4. **Removed Legacy Fallbacks**

The old random selection functions (`chooseNewExplorationTarget`, `chooseReturnTarget`) have been removed as they are no longer needed. The gravity-based implementation is self-contained and robust.

------------------------------------------------------------------------

## Code Integration Points

### Main Files Modified

-   `sim_depr_mobility.js`: Core implementation
-   Integration with existing D-EPR logic
-   Maintained water avoidance system

### Functions Added

-   `calculateGravityKernel()`: Core gravity kernel calculation
-   `chooseGravityBasedExplorationTarget()`: Gravity-based exploration selection\
-   `chooseGravityBasedReturnTarget()`: Gravity-based return selection

### Functions Removed

-   `chooseNewExplorationTarget()`: Replaced by gravity-based exploration
-   `chooseReturnTarget()`: Replaced by gravity-based return

### Functions Modified

-   `handleDEPRMovement()`: Updated to use gravity-based selection exclusively
-   `detectAndHandleStuck()`: Enhanced with gravity-based recovery

### Global Variables Added

-   `GRAVITY_KERNEL_PARAMS`: Configuration object

------------------------------------------------------------------------

## Future Enhancements

### 1. Dynamic Attractiveness

``` javascript
// Location-specific attractiveness
const locationAttractiveness = {
    'market': 2.0,
    'water_source': 1.5,
    'social_hub': 1.8,
    'residential': 1.0
};
```

### 2. Time-Dependent Parameters

``` javascript
// Different movement preferences by time of day
const timeBasedBeta = {
    'morning': 1.5,   // More exploratory
    'noon': 2.5,      // More clustered
    'evening': 2.0    // Moderate clustering
};
```

### 3. Agent-Specific Parameters

``` javascript
// Individual agent characteristics
agent.mobilityProfile = {
    beta: 2.2,                    // Personal distance preference
    attractiveness: 1.1,          // Personal attractiveness factor
    explorationTendency: 0.6      // Tendency to explore vs return
};
```

------------------------------------------------------------------------

## Conclusion

The gravity kernel implementation transforms the D-EPR mobility model from random selection to realistic, distance-aware movement patterns while preserving all existing safety and scheduling features. The modular design allows for easy parameter adjustment and future enhancements, making the simulation more scientifically accurate and behaviorally realistic.