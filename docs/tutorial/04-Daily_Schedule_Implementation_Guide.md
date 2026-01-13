# Complete Daily Schedule Implementation Guide - ALIGNED VERSION

## Overview

This is the **complete, aligned implementation guide** that matches the big picture concept while incorporating your actual implementation progress. This guide addresses all inconsistencies and provides a clear path from start to finish.

## 🎯 Big Picture Concept

We're adding a **daily schedule system** that makes agents behave like real people with daily routines, while preserving your existing d-EPR exploration model.

**Key Concept**: Agents switch between 3 behavioral modes based on simulation time: - **🏠 atHome**: Stay near home (sleep time: 23:00-05:00) - **🏢 atWork**: Stay near work (work hours: 09:00-15:00) - **🚶 deprMobile**: Use your existing d-EPR exploration logic (mobility periods: 05:00-09:00 & 15:00-23:00)

## Time Scaling Strategy

**Your Implementation**: `timeScale: 0.5` (2 simulation seconds = 1 real hour) - **Full day cycle**: 48 simulation seconds - **Perfect for**: Testing and observation - **Realistic timing**: Each period has sufficient duration for behavioral observation

## Daily Schedule Design (ALIGNED WITH YOUR CODE)

### Schedule Periods

| Time Period | Duration | Behavior Mode | Agent Activity                   |
|-------------|----------|---------------|----------------------------------|
| 23:00-05:00 | 6 hours  | atHome        | Stay near home, minimal movement |
| 05:00-09:00 | 4 hours  | deprMobile    | Morning d-EPR exploration        |
| 09:00-15:00 | 6 hours  | atWork        | Stay near work, minimal movement |
| 15:00-23:00 | 8 hours  | deprMobile    | Evening d-EPR exploration        |

### Agent State Machine

```         
atHome (sleeping) ←→ deprMobile (exploring) ←→ atWork (working)
     ↑                        ↓                        ↑
     └────── Schedule transitions based on time ───────┘
```

## Implementation Status & Alignment Check

# Step-by-Step Implementation Plan

## Phase 1: Time Management Foundation

### Step 1.1: Add Time Manager

**Location**: After line 15 (after color definitions)

``` javascript
// Time Management System for Daily Scheduling
const timeManager = {
    scheduleStartTime: 0,
    currentSimulationTime: 0,
    timeScale: 1, // 1 sim second = 1 real hour
    
    getCurrentHour: function() {
        return Math.floor(this.currentSimulationTime * this.timeScale) % 24;
    },
    
    update: function(deltaTime) {
        this.currentSimulationTime += deltaTime;
    },
    
    reset: function() {
        this.scheduleStartTime = 0;
        this.currentSimulationTime = 0;
    },
    
    getTimeString: function() {
        const hour = this.getCurrentHour();
        return `${hour.toString().padStart(2, '0')}:00`;
    }
};
```

**What this code does:** This creates a centralized time management system for the daily schedule. Think of it as the "clock" that tracks what time of day it is in your simulation.

**Code breakdown:**

-   `scheduleStartTime: 0` - Records when the schedule timing started (separate from your existing SEIR timing)
-   `currentSimulationTime: 0` - Tracks elapsed simulation time in "simulation seconds" (where 1 sim second = 1 real hour)
-   `timeScale: 1` - Conversion factor (currently 1:1, but could be adjusted later)
    -   If `timeScale = 3`, that would mean 1 simulation second = 3 real hours

**Object Methods Explained (Line by Line):**

``` javascript
getCurrentHour: function() {
```

-   This declares a **method (function inside an object)** called `getCurrentHour`
-   `methodName: function() { }` is the syntax for creating methods in JavaScript objects
-   Think of it like: "this object has a function called getCurrentHour"

``` javascript
    return Math.floor(this.currentSimulationTime) % 24;
```

-   `this.currentSimulationTime` - **`this` refers to the timeManager object itself**
-   `this` is like saying **"my own property"** - so `this.currentSimulationTime` means "timeManager's currentSimulationTime"
-   `Math.floor()` - Rounds down to nearest whole number (e.g., 5.7 becomes 5)
-   `% 24` - **Modulo operator** - gives remainder when divided by 24 (creates 0-23 hour cycle)
-   Example: if currentSimulationTime = 25.3, then Math.floor(25.3) = 25, and 25 % 24 = 1 (so hour = 1)

``` javascript
update: function(deltaTime) {
```

-   Another method declaration - this one takes a parameter called `deltaTime`

``` javascript
    this.currentSimulationTime += deltaTime;
```

-   `this.currentSimulationTime` - refers to timeManager's currentSimulationTime property
-   `+=` - shorthand for "add to existing value" (same as `this.currentSimulationTime = this.currentSimulationTime + deltaTime`)
-   This advances the simulation time by the amount of time that passed since last frame

``` javascript
reset: function() {
```

-   Method to reset the time back to zero (no parameters needed)

``` javascript
    this.scheduleStartTime = 0;
    this.currentSimulationTime = 0;
```

-   Sets both time properties back to 0
-   `this.scheduleStartTime` = timeManager's scheduleStartTime property
-   `this.currentSimulationTime` = timeManager's currentSimulationTime property

``` javascript
getTimeString: function() {
```

-   Method to format the time as a readable string

``` javascript
    const hour = this.getCurrentHour();
```

-   Calls the `getCurrentHour()` method we defined above
-   `this.getCurrentHour()` means "call MY getCurrentHour method"

``` javascript
    return `${hour.toString().padStart(2, '0')}:00`;
```

-   **Template literal**: `` `text ${variable} more text` `` - allows inserting variables into strings
-   `hour.toString()` - Converts number to string (e.g., 5 becomes "5")
-   `.padStart(2, '0')` - **Pads the string to 2 characters by adding '0' at the start if needed**
    -   Example: "5".padStart(2, '0') becomes "05"
    -   Example: "12".padStart(2, '0') stays "12" (already 2 characters)
-   `${hour.toString().padStart(2, '0')}:00` - Creates time format like "05:00" or "12:00"

**Why use `this`?** - `this` refers to the current object (timeManager) - It lets methods access the object's own properties and other methods - Without `this`, JavaScript wouldn't know which object's properties you mean

**Object Method vs Function:**

-   **Function**: `function doSomething() { }` - standalone

-   **Object Method**: `objectName: { methodName: function() { } }` - belongs to an object - Methods can access the object's properties using `this`

### **Object Pattern** (timeManager):

``` javascript
const timeManager = {
    currentSimulationTime: 0,
    timeScale: 0.5,
    getCurrentHour: function() { ... },
    update: function(deltaTime) { ... },
    getTimeString: function() { ... }
}
```

#### Why the object approach works well for timeManager:

1.  **Shared State**: [currentSimulationTime](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) and [timeScale](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) need to be shared between methods

2.  **Encapsulation**: Time-related data and functions are logically grouped

3.  **Namespace**: Avoids global variable pollution

4.  **Single Creation**: Object created once, **methods reused**

### **Standalone Functions Pattern** (rest of your code):

``` javascript
function updateAgentMovement(agentInput) { ... }
function drawScene() { ... }
function getDeltaTime(currentTimeInput) { ... }
```

**Why standalone functions work well for your other code:**

1.  **No Shared State**: Functions like [drawScene()](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) don't need persistent data

2.  **Simpler**: Direct function calls are more straightforward

3.  **Performance**: Slightly faster (no property lookup)

#### Step 1.2: Add Time Display Function

**Location**: After timeManager definition

``` javascript
// Function to display current simulation time
function displaySimulationTime() {
    const timeString = timeManager.getTimeString();
    const hour = timeManager.getCurrentHour();

    // Get the existing elements from HTML
    let timeDisplay = document.getElementById('timeCount');
    let periodDisplay = document.getElementById('activityPeriodTime');

    // Show time with period indicator
    let period = '';
    if (hour >= 23 || hour < 5) period = 'Home';
    else if (hour >= 5 && hour < 9) period = 'Morning Mobility';
    else if (hour >= 9 && hour < 15) period = 'Work';
    else period = 'Evening Mobility';

    // Update both display elements separately
    timeDisplay.innerHTML = timeString;
    periodDisplay.innerHTML = period;
}
```

**What this code does:** Uses your existing HTML stats display structure to show the current simulation time and activity period. This integrates seamlessly with your UI without creating new DOM elements.

**Code breakdown:** - `const timeString = timeManager.getTimeString()` - Gets formatted time (e.g., "14:00") - `const hour = timeManager.getCurrentHour()` - Gets current hour (0-23) - `let timeDisplay = document.getElementById('timeCount')` - Gets existing time display element from your HTML - `let periodDisplay = document.getElementById('activityPeriodTime')` - Gets existing period display element from your HTML - Period detection logic: - `hour >= 23 || hour < 5` → "Home" (sleep time) - `hour >= 5 && hour < 9` → "Morning Mobility" (morning d-EPR) - `hour >= 9 && hour < 15` → "Work" (work time) - `else` → "Evening Mobility" (evening d-EPR) - `timeDisplay.innerHTML = timeString` - Updates time display with formatted time - `periodDisplay.innerHTML = period` - Updates period display with current activity

**Why this approach is better:** - Uses your existing HTML structure (lines 26 and 29 in index.html) - Maintains consistent styling with your stats display - No need to create new DOM elements or manage CSS positioning - Integrates with your existing `<span id="timeCount">0</span>` and `<span id="activityPeriodTime">0</span>` elements

**HTML Modification Required:**

**Location**: Modify your `index.html` file in the stats container section

If you don't already have the activity period element in your HTML, add it to your stats container:

``` html
<div id="logState" class="StatContainer">
    <div id="logTime" class="stat-item">
        <h3>Time (days): </h3> <span id="timeCount">0</span>
    </div>
    <!-- Add this div if it doesn't exist -->
    <div id="activityPeriod" class="stat-item">
        <h3>Activity Period: </h3><span id="activityPeriodTime">0</span>
    </div>
    <!-- Rest of your existing stats... -->
    <div id="logSusceptible" class="stat-item">
        <h3>Susceptible: </h3><span id="susceptibleCount">0</span>
    </div>
    <!-- etc... -->
</div>
```

**What this HTML does:** - Creates a new stats display row for "Activity Period" - Uses the same styling pattern as your existing stats (`stat-item` class) - Provides the `activityPeriodTime` span element that JavaScript will update - Integrates seamlessly with your existing stats layout

**Verification**: Make sure your HTML contains both required elements: - `<span id="timeCount">0</span>` - for displaying simulation time - `<span id="activityPeriodTime">0</span>` - for displaying current activity period

#### **How to Declare an Empty String**

#### **Other Common Data Types & How to Declare Them Empty**

| Data Type | Empty Declaration Example  |
|-----------|----------------------------|
| String    | `let myArray = '';`        |
| Array     | `let myArray = [];`        |
| Object    | `let myObject = {};`       |
| Number    | `let myNumber = 0;`        |
| Boolean   | `let myBool = false;`      |
| Null      | `let myValue = null;`      |
| Undefined | `let myValue = undefined;` |

#### Step 1.3: Add Time Management to animate() Function

**What to do**: Add these two lines to your existing `animate()` function.

**Location**: In your `animate()` function, add after `const deltaTime = getDeltaTime(currentTime);`

``` javascript
// Render the canvas in loop
function animate(currentTime) {
    const deltaTime = getDeltaTime(currentTime);
    
    // ADD THESE TWO LINES:
    timeManager.update(deltaTime);      // Advance simulation time
    displaySimulationTime();           // Update time display
    
    // Your existing code continues...
    animationId = requestAnimationFrame(animate);
    
    agents.forEach(agent => {
        changeToExposed(agent);
        updateAgentMovement(agent); // Will be enhanced in Phase 3
        updateAgentState(agent, deltaTime);
        updateCleanWaterbodyBacteria(agent);
    });
    
    drawScene();

    // Your existing SEIR data logging...
}
```

**Why this step**: Makes the time system active - without this, time never advances.

### Phase 2: Simplify Schedule Management (EFFICIENCY FIX)

#### Step 2.1: Replace scheduleManager with Simple Function

**Problem Fixed**: Your efficiency concern about object vs function is valid here.

**Location**: Replace your entire `scheduleManager` object with this simple function:

``` javascript
// Simple schedule function (replaces complex scheduleManager object)
function getCurrentScheduleMode(hour) {
    if (hour >= 23 || hour < 5) return 'atHome';
    if (hour >= 5 && hour < 9) return 'deprMobile';
    if (hour >= 9 && hour < 15) return 'atWork';
    if (hour >= 15 && hour < 23) return 'deprMobile';
    return 'deprMobile'; // fallback
}
```

**Why this is better**: - ✅ **More efficient**: Direct function call (no object property lookup) - ✅ **Simpler**: No unused `periods` array - ✅ **Consistent**: Matches your standalone function style - ✅ **Same result**: Returns the same mode names your display function expects

#### Step 2.2: Add Schedule Properties to Agents

**Location**: In your `createAgent()` function, add these properties to the agent object:

``` javascript
const agent = {
    // ... your existing properties ...
    // d-EPR specific properties
    visitedCells: {}, // object to store visited cells and visit counts
    uniqueVisitCount: 0, // count of unique cells visited (S in the d-EPR formula)
    currentTarget: null, // current movement target cell
    rho: 0.5, // exploration parameter (0 < rho < 1)
    gamma: 0.2, // return decay parameter (0 < gamma < 1)
    
    // ADD THESE: Schedule-specific properties
    scheduleMode: 'atHome',  // Current behavior mode (start at home)
    previousMode: null,      // Track mode changes
    
    // ADD THIS: d-EPR state preservation for smooth transitions
    deprState: {
        savedTarget: null,   // Save d-EPR target when entering home/work mode
        wasExploring: false  // Remember if agent was exploring
    },
    
    // ... rest of existing properties ...
};
```

**What this does**: Allows each agent to track their current schedule mode and preserve d-EPR exploration state during mode transitions.

#### **Detailed Explanation: Why do you need `deprState`, `savedTarget`, and `wasExploring`?**

These properties are used to **preserve the agent's d-EPR exploration state** when switching between different daily schedule modes (like atHome, atWork, deprMobile).

**What are they for?**

-   **`deprState`**: An object attached to each agent to store temporary d-EPR exploration info.
-   **`savedTarget`**: Remembers the agent's current exploration target (the cell they were moving toward) when the agent switches from `deprMobile` (exploring) to another mode (like atHome or atWork).
-   **`wasExploring`**: Records whether the agent was actively exploring (not just returning) before switching modes.

**Why is this needed?**

When an agent switches from exploring (`deprMobile`) to another mode (like going home or to work), you don't want them to lose their place in the exploration process. By saving their target and exploration status, you can restore it later when they return to `deprMobile`.

**How does it work in practice?**

1.  **Agent is exploring (`deprMobile`)**:
    -   The agent has a current target cell (`currentTarget`) and is moving toward it.
2.  **Agent switches to another mode (e.g., `atHome`)**:
    -   You save the current target and exploration status:
        -   `deprState.savedTarget = agent.currentTarget`
        -   `deprState.wasExploring = true`
    -   The agent starts moving toward home/work, and `currentTarget` is cleared.
3.  **Agent switches back to `deprMobile`**:
    -   You check if there's a saved target:
        -   If yes, restore it: `agent.currentTarget = deprState.savedTarget`
        -   Clear `deprState.savedTarget` so it's not reused accidentally.
    -   The agent resumes exploring from where they left off.

**What's the benefit?**

-   **Smooth transitions**: Agents don't "forget" their exploration when their schedule changes.
-   **Realistic behavior**: When agents return to mobility, they continue exploring as if they never stopped.
-   **No lost progress**: Exploration statistics and movement patterns remain consistent.

### Phase 3: Location-Based Movement Functions

#### Step 3.1: Add Movement Functions

**Location**: After your existing movement functions (`chooseReturnTarget`, etc.), add:

``` javascript
// Function to move agent towards a specific location (home/work)
function moveTowardsLocation(agent, targetLocation) {
    const dx = targetLocation.x - agent.x;
    const dy = targetLocation.y - agent.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
        // Agent not at target position yet - move towards target location
        agent.x += (dx / distance) * agent.speed;
        agent.y += (dy / distance) * agent.speed;
    } 
    // else: Agent is already at target position (distance = 0) - stop moving
}

// Handle d-EPR movement (extracted from your existing logic)
function handleDEPRMovement(agent) {
    // Restore saved d-EPR target when returning to mobile mode
    if (!agent.currentTarget && agent.deprState.savedTarget) {
        agent.currentTarget = agent.deprState.savedTarget;
        agent.deprState.savedTarget = null;
    }

    // Your existing d-EPR logic
    if (!agent.currentTarget || reachedTarget(agent)) {
        // d-EPR probability calculation
        const pNew = agent.rho * Math.pow(agent.uniqueVisitCount, -agent.gamma);
        
        if (Math.random() < pNew) {
            // EXPLORE: choose new unvisited cell
            agent.currentTarget = chooseNewExplorationTarget(agent);
        } else {
            // RETURN: choose visited cell to return to
            agent.currentTarget = chooseReturnTarget(agent);
        }
    }

    // Move towards current target
    moveTowardTarget(agent);

    // Track current cell visitation
    const currentCellKey = grid.getCellKey(agent.x, agent.y);
    if (!agent.visitedCells[currentCellKey]) {
        agent.visitedCells[currentCellKey] = 0;
        agent.uniqueVisitCount++;
    }
    agent.visitedCells[currentCellKey]++;
}
```

**What these functions do**: - `moveTowardsLocation()`: Makes agents stay near home or work with minimal random movement - `handleDEPRMovement()`: Preserves your existing d-EPR exploration logic in a separate function

#### **Detailed Code Breakdown:**

##### **Function 1: `moveTowardsLocation(agent, targetLocation)`**

**Purpose**: Moves agent directly towards a specific location (home/work) and stops when they reach it.

**Code Chunk 1: Distance Calculation**

``` javascript
const dx = targetLocation.x - agent.x;
const dy = targetLocation.y - agent.y;
const distance = Math.sqrt(dx * dx + dy * dy);
```

• `const dx = targetLocation.x - agent.x;` → Calculate horizontal distance between target and agent • `const dy = targetLocation.y - agent.y;` → Calculate vertical distance between target and agent\
• `const distance = Math.sqrt(dx * dx + dy * dy);` → Calculate straight-line distance using Pythagorean theorem

**Code Chunk 2: Movement Decision Logic**

``` javascript
if (distance > 0) {
    // Move towards target location at normal speed
    agent.x += (dx / distance) * agent.speed;
    agent.y += (dy / distance) * agent.speed;
}
```

-   `if (distance > 0)` → Check if agent hasn't reached the exact target position yet

-   `agent.x += (dx / distance) * agent.speed;` → Move agent horizontally towards target (normalized direction × speed)

-   `agent.y += (dy / distance) * agent.speed;` → Move agent vertically towards target (normalized direction × speed)

**Code Chunk 3: Simplified Stopping Behavior**

Since your simplified function removes comfort zone logic, when `distance > 0` is false (meaning the agent has reached the target), the function naturally ends and the agent stops moving. No additional code is needed for stopping behavior.

##### **Function 2: `handleDEPRMovement(agent)`**

**Purpose**: Handles d-EPR (exploration/return probability) movement behavior and preserves exploration state.

**Code Chunk 1: State Restoration**

``` javascript
// Restore saved d-EPR target when returning to mobile mode
if (!agent.currentTarget && agent.deprState.savedTarget) {
    agent.currentTarget = agent.deprState.savedTarget;
    agent.deprState.savedTarget = null;
}
```

-   `if (!agent.currentTarget && agent.deprState.savedTarget)` -\> Check if agent has no current target BUT has a saved target from previous exploration

    -   this condition check when the agent needs to resume after returning from different mode like at work or at home. It restore the target

    -   `!agent.currentTarget` - The agent currently has no active target

    -   `agent.deprState.savedTarget` - There is a saved target stored in the agent's state

-   `agent.currentTarget = agent.deprState.savedTarget;` -\> Restore the previously saved exploration target

<!-- -->

-   `agent.deprState.savedTarget = null;` -\> Clear saved target to avoid reusing it accidentally

**Code Chunk 2: d-EPR Target Selection Logic**

``` javascript
// Your existing d-EPR logic
if (!agent.currentTarget || reachedTarget(agent)) {
    // d-EPR probability calculation
    const pNew = agent.rho * Math.pow(agent.uniqueVisitCount, -agent.gamma);
    
    if (Math.random() < pNew) {
        // EXPLORE: choose new unvisited cell
        agent.currentTarget = chooseNewExplorationTarget(agent);
    } else {
        // RETURN: choose visited cell to return to
        agent.currentTarget = chooseReturnTarget(agent);
    }
}
```

• `if (!agent.currentTarget || reachedTarget(agent))` -\> Check if agent needs a new target (no target OR reached current target) • `const pNew = agent.rho * Math.pow(agent.uniqueVisitCount, -agent.gamma);` -\> Calculate exploration probability using d-EPR formula • `if (Math.random() < pNew)` -\> Random decision: explore (pNew probability) vs return (1-pNew probability) • `agent.currentTarget = chooseNewExplorationTarget(agent);` -\> EXPLORE: Find new unvisited cell to explore • `agent.currentTarget = chooseReturnTarget(agent);` -\> RETURN: Choose previously visited cell to return to

**Code Chunk 3: Movement and Cell Tracking**

``` javascript
// Move towards current target
moveTowardTarget(agent);

// Track current cell visitation
const currentCellKey = grid.getCellKey(agent.x, agent.y);
if (!agent.visitedCells[currentCellKey]) {
    agent.visitedCells[currentCellKey] = 0;
    agent.uniqueVisitCount++;
}
agent.visitedCells[currentCellKey]++;
```

• `moveTowardTarget(agent);` -\> Move agent towards their current target using existing movement function • `const currentCellKey = grid.getCellKey(agent.x, agent.y);` -\> Get grid cell key for agent's current position • `if (!agent.visitedCells[currentCellKey])` -\> Check if this cell has never been visited before • `agent.visitedCells[currentCellKey] = 0;` -\> Initialize visit count for new cell • `agent.uniqueVisitCount++;` -\> Increment unique cell counter (S in d-EPR formula) • `agent.visitedCells[currentCellKey]++;` -\> Increment visit count for current cell

#### Step 3.2: Replace updateAgentMovement with Schedule-Aware Version

**Location**: Replace your entire `updateAgentMovement()` function with:

``` javascript
// Schedule-aware agent movement function
function updateAgentMovement(agentInput) {
    // Get current schedule mode based on time
    const currentHour = timeManager.getCurrentHour();
    const newMode = getCurrentScheduleMode(currentHour);
    
    // Handle mode transitions
    if (agentInput.scheduleMode !== newMode) {
        // Save d-EPR state when leaving mobile mode
        if (agentInput.scheduleMode === 'deprMobile') {
            agentInput.deprState.savedTarget = agentInput.currentTarget;
            agentInput.deprState.wasExploring = true;
        }
        
        agentInput.previousMode = agentInput.scheduleMode;
        agentInput.scheduleMode = newMode;
        agentInput.currentTarget = null; // Clear target for new mode
    }

    // Helper function to check if agent is close enough to target to stop moving
    function isAtTarget(agent, target) {
        const dx = target.x - agent.x;
        const dy = target.y - agent.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= agent.speed; // If distance is less than or equal to speed, consider agent "at" target
    }

    // Execute movement based on current schedule mode
    switch (agentInput.scheduleMode) {
        case 'atHome':
            moveTowardsLocation(agentInput, agentInput.house);
            break;
            
        case 'atWork':
            moveTowardsLocation(agentInput, agentInput.work);
            break;
            
        case 'deprMobile':
            handleDEPRMovement(agentInput);
            break;
            
        default:
            // Fallback to d-EPR if something goes wrong
            handleDEPRMovement(agentInput);
            break;
    }
}
```

**What this does**: - Checks current hour and determines what mode agent should be in - Smoothly transitions between modes while preserving d-EPR state\
- Uses appropriate movement function based on schedule mode

#### **Detailed Code Breakdown:**

##### **Function: `updateAgentMovement(agentInput)`**

**Purpose**: This is the main scheduling function that controls agent behavior based on time of day and manages smooth transitions between different modes.

**Code Chunk 1: Time-Based Mode Determination**

``` javascript
// Get current schedule mode based on time
const currentHour = timeManager.getCurrentHour();
const newMode = getCurrentScheduleMode(currentHour);
```

• `const currentHour = timeManager.getCurrentHour();` → Get the current simulation hour (0-23) from time manager • `const newMode = getCurrentScheduleMode(currentHour);` → Determine what mode agent should be in based on current hour: - Hours 0-4, 23: `'atHome'` - Hours 5-8, 15-22: `'deprMobile'` - Hours 9-14: `'atWork'`

**Code Chunk 2: Mode Transition Logic**

``` javascript
// Handle mode transitions
if (agentInput.scheduleMode !== newMode) {
    // Save d-EPR state when leaving mobile mode
    if (agentInput.scheduleMode === 'deprMobile') {
        agentInput.deprState.savedTarget = agentInput.currentTarget;
        agentInput.deprState.wasExploring = true;
    }
    
    agentInput.previousMode = agentInput.scheduleMode;
    agentInput.scheduleMode = newMode;
    agentInput.currentTarget = null; // Clear target for new mode
}
```

• `if (agentInput.scheduleMode !== newMode)` → Check if agent needs to change modes (only runs during transitions) • `if (agentInput.scheduleMode === 'deprMobile')` → Special handling when leaving exploration mode • `agentInput.deprState.savedTarget = agentInput.currentTarget;` → Save current exploration target so agent can resume later • `agentInput.deprState.wasExploring = true;` → Mark that agent was exploring (for state restoration) • `agentInput.previousMode = agentInput.scheduleMode;` → Store what mode agent was in before transition • `agentInput.scheduleMode = newMode;` → Update agent to new mode • `agentInput.currentTarget = null;` → Clear current target since agent is changing behavior

**Code Chunk 3: Function to check if agent is already in the destination**

``` javascript
function isAtTarget(agent, target) {
    const dx = target.x - agent.x;
    const dy = target.y - agent.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= agent.speed; // If distance is less than or equal to speed, consider agent "at" target
}
```

**Code Chunk 4: Mode-Based Movement Execution**

``` javascript
// Execute movement based on current schedule mode
switch (agentInput.scheduleMode) {
    case 'atHome':
        // Only move if agent is not already at home
        // check if agent is not at home, so move towards home
        if (!isAtTarget(agentInput, agentInput.house)) {
            moveTowardsLocation(agentInput, agentInput.house); // move towards home
        }
        // else: agent is at home, stay still (no movement)
        break;
        
    case 'atWork':
        // Only move if agent is not already at work
        // check if agent is not at work, so move towards work
        if (!isAtTarget(agentInput, agentInput.work)) {
            moveTowardsLocation(agentInput, agentInput.work); // move towards work
        }
        // else: agent is at work, stay still (no movement)
        break;

    case 'deprMobile':
        handleDEPRMovement(agentInput);
        break;
        
    default:
        // Fallback to d-EPR if something goes wrong
        handleDEPRMovement(agentInput);
        break;
}
```

-    `switch (agentInput.scheduleMode)` → Execute different movement behavior based on current mode

<!-- -->

-   `case 'atHome':` → When agent should be home (hours 0-4, 23)

-   `if (!isAtTarget(agentInput, agentInput.house))` → check if \``isAtTarget` function return false, which means the agent position is close enough or at the house

-   `moveTowardsLocation(agentInput, agentInput.house);` → Move directly to and stop at home location

-   `case 'atWork':` → When agent should be at work (hours 9-14)

-   `moveTowardsLocation(agentInput, agentInput.work);` → Move directly to and stop at work location

-   `case 'deprMobile':` → When agent should be exploring (hours 5-8, 15-22) • `handleDEPRMovement(agentInput);` → Execute d-EPR exploration behavior with state preservation

-   `default:` → Safety fallback if mode is somehow invalid

-   `handleDEPRMovement(agentInput);` → Use exploration as default behavior to prevent agent from getting stuck

### Phase 4: Integration and Testing

#### Step 4.1: Update Reset Function (if you have one)

**Location**: In your reset function, add:

``` javascript
// Reset time manager when simulation resets
timeManager.reset();
```

**Why needed**: Ensures every simulation restart begins at hour 0 (midnight).

## Implementation Order

1.  **✅ Phase 1 Steps 1.1-1.2**: Already completed by you
2.  **🔄 Phase 1 Step 1.3**: Add time management to animate() function\
3.  **🔄 Phase 2**: Replace scheduleManager with simple function + add agent properties
4.  **🔄 Phase 3**: Add movement functions + replace updateAgentMovement
5.  **🔄 Phase 4**: Update reset function

## Expected Behavior After Full Implementation

### Hours 0-4 (atHome):

-   **Visual**: Agents move directly to and stop at green home squares
-   **Movement**: Direct movement to home location, then stationary

### Hours 5-8 (deprMobile):

-   **Visual**: Agents spread out across canvas
-   **Movement**: Your existing d-EPR exploration behavior

### Hours 9-14 (atWork):

-   **Visual**: Agents move directly to and stop at brown work squares
-   **Movement**: Direct movement to work location, then stationary

### Hours 15-22 (deprMobile):

-   **Visual**: Agents spread out again
-   **Movement**: d-EPR exploration continues from saved state

### Hour 23 (atHome):

-   **Visual**: Agents return home for sleep
-   **Movement**: Transition back to home clustering

## Addressing Your Efficiency Concerns

### Why timeManager Uses Object Pattern:

``` javascript
// ✅ EFFICIENT for timeManager (stateful component)
const timeManager = {
    currentSimulationTime: 0,  // Shared state
    timeScale: 0.5,           // Shared state
    getCurrentHour: function() { ... } // Needs access to state
}
```

**Benefits**: - **State Management**: Multiple properties need to work together - **Encapsulation**: Time logic grouped in one place\
- **Single Creation**: Object created once, methods reused - **this Context**: Methods can access shared state

### Why scheduleManager Becomes Simple Function:

``` javascript
// ✅ MORE EFFICIENT as simple function (stateless operation)
function getCurrentScheduleMode(hour) {
    // Simple logic, no state needed
}
```

**Benefits**: - **No State**: Pure function with no persistent data - **Direct Call**: No object property lookup overhead - **Simpler**: Less complexity for simple logic - **Consistent**: Matches your coding style

## Testing Strategy

### Phase 1 Testing:

-   ✅ Verify time display increments correctly
-   ✅ Check 24-hour cycle (0→23→0)
-   ✅ Confirm period names match visual behavior

### Phase 2 Testing:

-   🔄 Console log agent mode changes
-   🔄 Verify mode transitions at correct hours
-   🔄 Test midnight crossing (23→0)

### Phase 3 Testing:

-   🔄 Watch agents cluster at home/work during scheduled times
-   🔄 Confirm d-EPR exploration continues during mobile periods\
-   🔄 Verify smooth transitions preserve d-EPR state

## Key Alignment Fixes Made

1.  **✅ Mode Names**: Consistent use of `atHome`, `deprMobile`, `atWork`
2.  **✅ Time Scale**: Your `0.5` scale properly documented and explained
3.  **✅ Efficiency**: scheduleManager replaced with simple function per your concern
4.  **✅ Coding Style**: Mixed approach - objects for stateful components, functions for stateless
5.  **✅ Unused Code**: Removed unnecessary `periods` array
6.  **✅ Integration**: Proper steps to integrate with your existing animate() function

This guide now perfectly aligns the big picture concept with your actual implementation style and addresses all your efficiency concerns while providing a complete path to full daily scheduling functionality.