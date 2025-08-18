# Tutorial 3: Arranging House and Work in the Middle of the Cell.

## Overview

Brief description of what this tutorial covers and why it's important.

------------------------------------------------------------------------

## Stage A: Enhanced Implementation

> **Previous Code Version**: [Commit 6d50f97](https://github.com/hilmanpr21/cholera_visualisation/commit/6d50f97ffb4ea5d7f3f8a776f15c03649c1a64be) - "contamination with house"
>
> **Updated Code Version**: Code not yet committed - line numbers may change
>
> **Date**: August Y, 2025 **🏷️**
>
> **Stage**: B (Enhancement) **📋**
>
> **Previous**: [Stage A](#stage-a-basic-implementation)

#### What's New in this stage

-   The house and work previously placed randomly. This step we will make it in the center of the grid cell. And each cell only have one house and work so there will be no collision.

# Previously

In the previous version we were just generate the house and work in random point in the file `sim_depr_mobility.js`

```{javascript}
// Function to store agent's initial characters
    function createAgent(){
        // Determine home position based on canvas size
        const houseX = Math.random() * (canvas.width / 3);      // define the house X coordinate
        const houseY = Math.random() * canvas.height;     // define the house y coordinate

        // determine work position based on canvas size
        const workX = (2/3 * canvas.width) + Math.random() * (canvas.width / 3);
        const workY = Math.random() * canvas.height;

        const agent =  {
            x: houseX,      // starting x position
            y: houseY,     // starting y position
            radius: 10,  // the agent cirle radius size
            house: {                      // Set the pixel location of house  
                x: houseX,     
                y: houseY      
            },
            work: {                       // Set the pixel location of work
                x: workX,       
                y: workY
            },
            speed: 3,  // movement speed in pixels/frame
            state: "susceptible", // initial state of SEIR
            statetimer: 0, // define how many secons in this current state
            bacteria: bacteriaCounts.susceptible, // define the iniitial bacteria count in the agent

            // store know waterbody location passed from the global variable contaminatedWaterbodies and cleanWaterbodies. 
            // define this to assign agent memory
            contaminatedWaterbodyLocation: {
                x: contaminatedWaterbodies[0].x, // x-coordinate of the contaminated waterbody
                y: contaminatedWaterbodies[0].y, // y-coordinate of the contaminated waterbody
                radius: contaminatedWaterbodies[0].radius // radius of the contaminated waterbody
            },
            cleanWaterbodiesLocation: {
                x: cleanWaterbodies[0].x, // x-coordinate of the clean waterbody
                y: cleanWaterbodies[0].y, // y-coordinate of the clean waterbody
                radius: cleanWaterbodies[0].radius // radius of the clean waterbody
            },

            // d-EPR specific properties
            visitedCells: {}, // object to store visited cells and visit counts
            uniqueVisitCount: 0, // count of unique cells visited (S in the d-EPR formula)
            currentTarget: null, // current movement target cell
            rho: 0.5, // exploration parameter (0 < rho < 1)
            gamma: 0.2, // return decay parameter (0 < gamma < 1)
        }

        // mark home location as visited, since the agent starts at home
        const homeCellKey = grid.getCellKey(agent.house.x, agent.house.y);
        agent.visitedCells[homeCellKey] = 1;        // mark the home cell as visited with a count of 1
        agent.uniqueVisitCount = 1;                 // update unique visit

        return agent;
    }
```

# Updated Code

Add this on the file `sim_depr_mobility.js` add this step before declaring the function `createAgent`

## 1. **Step 1: Grid Cell Tracking**

`sim_depr_mobility.js` (line 68-69)

```{javascript}
// Add this before declaring function `createAgent()`

// Track which grid cells are occupied by buildings
 const occupiedGridCells = new Set();


```

**What this does:**

-   declaring variable `occupiedGridCells` that store the grid cell keys

-   Uses a [Set](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) to store grid cell keys like `"5,3"`, `"12,8"`, etc. This set will be the key for each grid cell.

-   Each key represents one 20x20 pixel grid cell

-   Once a cell is marked as occupied, no other building can use it

## **2. Step 2: Finding Available Grid Cells**

```{javascript}
/// Add this script before declaring the function `createAgent()` but after the previous step

 // Function to get a free grid cell and mark it as occupied
    function getAvailableGridCell(minGridX, maxGridX, minGridY, maxGridY) {
        const attempts = 100; // Max attempts to find a free cell
        
        for (let i = 0; i < attempts; i++) {
            // Generate random grid coordinates within the specified range
            const gridX = minGridX + Math.floor(Math.random() * (maxGridX - minGridX + 1));
            const gridY = minGridY + Math.floor(Math.random() * (maxGridY - minGridY + 1));
            const cellKey = `${gridX},${gridY}`;
            
            // Check if this grid cell is free
            if (!occupiedGridCells.has(cellKey)) {
                // Mark this cell as occupied
                occupiedGridCells.add(cellKey);
                
                // Return the center coordinates of this grid cell
                const centerX = (gridX + 0.5) * gridSize;
                const centerY = (gridY + 0.5) * gridSize;
                
                return { x: centerX, y: centerY };
            }
        }
        
        // Fallback if no free cell found
        console.warn("No free grid cell found, using fallback position");
        const fallbackX = (minGridX + Math.random() * (maxGridX - minGridX)) * gridSize + gridSize/2;
        const fallbackY = (minGridY + Math.random() * (maxGridY - minGridY)) * gridSize + gridSize/2;
        return { x: fallbackX, y: fallbackY };
    }
```

**Step-by-step process:**

1.  **Generate random grid coordinates** within the allowed area

2.  **Create cell key** (e.g., `"7,4"`)

3.  **Check if cell is free** using [occupiedGridCells.has(cellKey)](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)

4.  **If free**: Mark as occupied and return center coordinates

5.  **If occupied**: Try again with different coordinates

**Breakdown**

### 2.1 Function Declaration

```{javascript}
function getAvailableGridCell(minGridX, maxGridX, minGridY, maxGridY) {
```

**What this does:**

-   Creates a function that takes 4 parameters defining a rectangular area in **grid coordinates**

-   [minGridX, maxGridX](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html): Left and right boundaries (in grid cells)

-   [minGridY, maxGridY](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html): Top and bottom boundaries (in grid cells)

-   `(minGridX, maxGridX, minGridY, maxGridY)` are parameter which lter will be filled (like a placeholder)

## 2.2 Attemp Counter Setup

```{javasript}
const attempts = 100; // Max attempts to find a free cell
```

**What this does:**

-   Sets a safety limit of 100 tries to find an empty grid cell

-   Prevents infinite loops if the area gets too crowded

-   If all 100 attempts fail, we'll use a fallback position

## 2.3 Main Search Loop

```{javascript}
for (let i = 0; i < attempts; i++) {
    .....
}
```

**What this does:**

-   Starts a loop that will try up to 100 times

-   Each iteration = one attempt to find a free grid cell (will be defined in the next step)

-   Loop continues until we find a free cell OR hit the attempt limit

## 2.4 Random Grid Coordinate Generation

```{javascript}
// Generate random grid coordinates within the specified range
const gridX = minGridX + Math.floor(Math.random() * (maxGridX - minGridX + 1));
const gridY = minGridY + Math.floor(Math.random() * (maxGridY - minGridY + 1));
```

**Breaking this down further:**

-   **For gridX:**

    -   [`Math.random()`](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) → Random decimal between 0 and 0.999...

    -   `(maxGridX - minGridX + 1)` → Range of possible grid cells

    -   [`Math.floor(Math.random() * range)`](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) → choose the floor value

    -   [`minGridX + random_offset`](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) → Shifts to the correct starting position

**Example:**

-   If [minGridX = 5](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html), [maxGridX = 10](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)

-   Range = `10 - 5 + 1 = 6` (cells 5,6,7,8,9,10)

-   [Math.random() \* 6](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) → 0 to 5.999...

-   [Math.floor()](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) → 0,1,2,3,4,5

-   `5 + offset` → Final result: 5,6,7,8,9,10 ✅

**Why adding `+1`** in `(maxGridX - minGridX + 1)` ?

-   Because we are using `Math.random()` which returns: `0.0` to `0.999999...` (never exactly 1.0). Also, since we use `Math.floor()`, we will be missing the highest value because it will be round down

-   example:

    -   **Without `+1`** → we got 5,6,7,8,9 but missing 10

    -   **With `+1`** → Final result: 5,6,7,8,9,10 ✅

## 2.5 Grid Cell Key Creation

```{javascript}
const cellKey = `${gridX},${gridY}`;
```

**What this does:**

-   declare `cellKey`

-   Use template Literate `${}` to change from float to string which will be a unique string identifier for this grid cell

-   Example: Grid cell at column 7, row 4 becomes `"7,4"`

-   This key is used to track which cells are occupied

## 2.5 Checking Availability

```{javascript}
// Check if this grid cell is free
if (!occupiedGridCells.has(cellKey)) {
```

**What this does:**

-   [occupiedGridCells.has(cellKey)](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) → Returns `true` if `cellKey` value exist the in the [`occupiedGridCells`](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) set

-   `.has()` → is a method that checks if a specific value exist in the set.

-   `!` → negation, it will return `true` if the value of `cellKey` does not exist in the set

-   `!occupiedGridCells.has(cellKey)` → Returns `true` if cell is FREE

-   If the cell is free, we execute the code inside this if-block

## 2.6 **Marking Cell as Occupied**

```{javascript}
// Mark this cell as occupied
occupiedGridCells.add(cellKey);
```

**What this does:**

-   Adds the cell key (e.g., `"7,4"`) to our [Set](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) of occupied cells

-   **Critical**: This prevents future buildings from using the same cell

-   Once added, this cell is "reserved" for this building

## 2.7 **Converting to Canvas Coordinates**

```{javascript}
// Return the center coordinates of this grid cell
const centerX = (gridX + 0.5) * gridSize;
const centerY = (gridY + 0.5) * gridSize;
```

**Breaking this down:**

-   `gridSize` → is the size of each grid cell 20x20 pixels

-   this is to pixel coordinate of the center

**Why `+ 0.5`?**

-   Grid cells are squares with integer coordinates (0,0), (1,0), (2,0), etc.

-   But we want to place buildings at the **center** of each cell

Adding 0.5 moves us to the center of the cell

**Example Calculation:**

-   Grid cell (7, 4) with [gridSize = 20](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)

-   [centerX = (7 + 0.5) \* 20 = 7.5 \* 20 = 150](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)

-   [centerY = (4 + 0.5) \* 20 = 4.5 \* 20 = 90](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)

-   Building placed at canvas position (150, 90) - perfect center!

## 2.8. Fallback system

```{javascript}
// Fallback if no free cell found
console.warn("No free grid cell found, using fallback position");
const fallbackX = (minGridX + Math.random() * (maxGridX - minGridX)) * gridSize + gridSize/2;
const fallbackY = (minGridY + Math.random() * (maxGridY - minGridY)) * gridSize + gridSize/2;
return { x: fallbackX, y: fallbackY };
```

**What this does:**

-   Only executes if all 100 attempts failed to find a free cell

-   Generates a random position within the allowed area (might overlap!)

-   `+ gridSize/2` ensures the building is still somewhat grid-aligned

-   Logs a warning so we know something went wrong

NOTE that `grid` is the cell coordinate within the grid system which is different with canvas or `pixel` coordinate

# 3. **Step 3: Area Constraints**

Update the function `createAgent` with this code:

```{// Function to store agent's initial characters}
function createAgent(){
    // Calculate grid boundaries for house area (left middle section)
    const houseMinGridX = Math.floor((canvas.width * 0.1) / gridSize);  // 10% from left
    const houseMaxGridX = Math.floor((canvas.width * 0.4) / gridSize);  // 40% from left
    const houseMinGridY = Math.floor((canvas.height * 0.2) / gridSize); // 20% from top
    const houseMaxGridY = Math.floor((canvas.height * 0.8) / gridSize); // 80% from top
    
    // Calculate grid boundaries for work area (right middle section)
    const workMinGridX = Math.floor((canvas.width * 0.6) / gridSize);   // 60% from left
    const workMaxGridX = Math.floor((canvas.width * 0.9) / gridSize);   // 90% from left
    const workMinGridY = Math.floor((canvas.height * 0.2) / gridSize);  // 20% from top
    const workMaxGridY = Math.floor((canvas.height * 0.8) / gridSize);  // 80% from top
    
    // Get available grid cells for house and work
    const housePosition = getAvailableGridCell(houseMinGridX, houseMaxGridX, houseMinGridY, houseMaxGridY);
    const workPosition = getAvailableGridCell(workMinGridX, workMaxGridX, workMinGridY, workMaxGridY);
    
    const houseX = housePosition.x;
    const houseY = housePosition.y;
    const workX = workPosition.x;
    const workY = workPosition.y;

// The rest of the code goes here
    
}
```

**Breakdown:**

```{javascript}
// Calculate grid boundaries for house area (left middle section)
const houseMinGridX = Math.floor((canvas.width * 0.1) / gridSize);  // 10% from left
const houseMaxGridX = Math.floor((canvas.width * 0.4) / gridSize);  // 40% from left
const houseMinGridY = Math.floor((canvas.height * 0.2) / gridSize); // 20% from top
const houseMaxGridY = Math.floor((canvas.height * 0.8) / gridSize); // 80% from top

// Calculate grid boundaries for work area (right middle section)
const workMinGridX = Math.floor((canvas.width * 0.6) / gridSize);   // 60% from left
const workMaxGridX = Math.floor((canvas.width * 0.9) / gridSize);   // 90% from left
const workMinGridY = Math.floor((canvas.height * 0.2) / gridSize);  // 20% from top
const workMaxGridY = Math.floor((canvas.height * 0.8) / gridSize);  // 80% from top
```

-   Defining the housing and working area

```{javascript}
// Get available grid cells for house and work
const housePosition = getAvailableGridCell(houseMinGridX, houseMaxGridX, houseMinGridY, houseMaxGridY);
const workPosition = getAvailableGridCell(workMinGridX, workMaxGridX, workMinGridY, workMaxGridY);
```

-   Calculate the `housePosition` and `workPosition` which will be return with `x` and `y` value

# 4. **Step 4: Memory Management**

```{Javascript}
function reset() {
    // Clear occupied grid cells so new buildings can be placed
    occupiedGridCells.clear();
    
    // recreate agents array 
    agents = [];
    for (let i = 0; i < 50; i++){
        agents.push(createAgent())
    }
}
```

**Why this is crucial:**

-   When simulation resets, we clear [`occupiedGridCells`](vscode-file://vscode-app/c:/Users/Hilman/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)

-   This allows fresh building placement in the same cells

-   Without this, cells would remain "occupied" forever