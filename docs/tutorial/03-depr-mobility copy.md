# Building d-EPR Model

### **d-EPR Model (from the paper)**

The d-EPR (density-Exploration and Preferential Return) model simulates human mobility by balancing two behaviors:

1.  **Preferential Return**: Returning to previously visited locations.
2.  **Exploration**: Visiting new, previously unvisited locations.

The probability of exploring a new location is given by:

![](image.png)

Where:

-   *ρ* and *γ* are model parameters.
-   S*S* is the number of unique locations the agent has already visited.

### **Option 1: Grid-Based (Pixel-Based) Locations**

-   Divide your map into a grid (e.g., 100x100 cells).
-   Each cell represents a potential location.
-   When an agent explores, randomly select a cell that hasn't been visited yet.

**Pros**: Simple to implement, good for raster-based maps.

**Cons**: May not reflect real-world geography or infrastructure.

### **✅ Should You Still Use a Grid?**

Yes — but you can **map the grid onto your pixel space**. Think of the grid as a **logical layer** on top of your canvas. Each grid cell can be a square of, say, **50×50 pixels**, depending on your canvas size and desired resolution.

### **🧠 Why Not Use Pixels Directly?**

Using individual pixels as grid cells would make your grid **too fine-grained**, especially since:

-   Your agents have a **radius of 10 pixels**, meaning they already occupy a 20×20 pixel area.
-   If each pixel were a location, agents would "explore" new locations too frequently and unrealistically.

### **🧭 How to Use This Grid for Exploration**

1.  **Track visited cells** for each agent (e.g., using a Set of `row,col` strings).
2.  When the agent decides to explore:
    -   Randomly pick a new grid cell that hasn’t been visited.
    -   Move the agent to the center of that cell.

### **🏠🏢🌊 1. Are house, work, and waterbody locations tied to a single grid cell?**

Not necessarily. Here's how you can handle it:

-   **Each location (house, work, waterbody)** can be mapped to the **grid cell it falls into**.
-   If a location spans multiple pixels (e.g., a large waterbody), it might cover **multiple grid cells**.
-   For simplicity, you can assign each location a **primary grid cell** based on its center or top-left coordinate.

So yes, a house or workplace can be **within one grid cell**, but it’s okay if it logically spans more — the grid is just a **logical abstraction** for tracking movement and exploration.

### **🧍‍♂️➡️ 2. Does this mean agent movement becomes grid-based instead of pixel-based?**

**Not entirely — and this is key.**

You can **still animate agents in pixel space** for smooth movement, but use the grid to:

-   Track which **logical location** the agent is in.
-   Determine **when an agent explores a new location** (i.e., a new grid cell).
-   Calculate **Pnew** based on visited grid cells.

### **🔄 Hybrid Approach (Recommended):**

-   **Movement**: Pixel-based (smooth animation).
-   **Exploration logic**: Grid-based (track visited cells, choose new ones).

This gives you the best of both worlds: realistic animation and meaningful exploration modeling.

Tutorial given by github copilot:

**1. Grid System Setup**

# **Implementing d-EPR Mobility Model for Cholera Simulation**

Based on the paper you've referenced and your existing code, I understand you want to implement the d-EPR (distance-based Exploration and Preferential Return) mobility model for your cholera simulation. This model would add a more realistic human movement pattern to your agents, which could significantly impact disease spread dynamics.

## **Big Picture Implementation**

The d-EPR model combines two key movement behaviors:

1.  **Exploration**: Discovering new locations with probability P_new = ρS\^(-γ)
2.  **Preferential Return**: Returning to previously visited locations with probability 1-P_new

Here's how to implement this in your simulation:

### 1. Grid System Setup

``` jsx
// Grid system to track visited locations
const gridSize = 50; // 50x50 pixel cells
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
    }
};
```

**Understanding the Grid System in Your Simulation.**

Breakdown:

``` jsx
const grid = {
    cells: {}, 
    getCellKey: function(x, y) { ... },
    getCellCenter: function(cellKey) { ... }
};
```

-   `const grid = {` create object called `grid`
-   This creates an object called `grid` with three properties:
    1.  `cells`: An empty object that will store visited cells
    2.  `getCellKey`: A function to convert canvas coordinates to grid cell identifiers
    3.  `getCellCenter`: A function to convert grid cell identifiers back to canvas coordinates (pixels)

``` jsx
getCellKey: function(x, y) {
    // Convert canvas coordinates to grid cell coordinates
    const gridX = Math.floor(x / gridSize);
    const gridY = Math.floor(y / gridSize);
    return `${gridX},${gridY}`;
}
```

-   This function takes canvas coordinates (x, y) and converts them to grid cell coordinates:
    1.  `function(x, y)` - This defines a function that takes two parameters: x and y coordinates, it is like placeholder
    2.  Math.floor(x / gridSize) - Divides the x coordinate by the grid size (20px) and rounds down to get the grid column number
    3.  Math.floor(y / gridSize) - Divides the y coordinate by the grid size and rounds down to get the grid row number
    4.  `${gridX},${gridY}` - Returns a string in the format "column,row" (e.g., "3,4")
-   For example, if your canvas coordinates are (63, 45) and gridSize is 20:
    -   gridX = Math.floor(63/20) = 3
    -   gridY = Math.floor(45/20) = 2
    -   getCellKey returns "3,2"

``` jsx
getCellCenter: function(cellKey) {
    // Convert cell key back to canvas coordinates (center of cell)
    const [gridX, gridY] = cellKey.split(',').map(Number);
    return {
        x: (gridX + 0.5) * gridSize,        // 0.5 because the grid center is in the middle of the cell
        y: (gridY + 0.5) * gridSize     // 0.5 because the grid center is in the middle of the cell 
    };
}
```

-   This function does the opposite - it takes a cell identifier and returns the center coordinates of that cell:
    1.  `function(cellKey)` - Defines a function that takes one parameter, cellKey, which is a string like "3,2". “cellKey” is like a placeholder
    2.  cellKey.split(',') - Splits the string at the comma, giving an array like \["3", "2"\]
    3.  `.map(Number)` - Converts each string in the array to a number
    4.  `const [gridX, gridY] = ...` - Uses array destructuring to assign the first value to gridX and the second to gridY
    5.  `(gridX + 0.5) * gridSize` - Calculates the x-coordinate of the cell's center
    6.  `(gridY + 0.5) * gridSize` - Calculates the y-coordinate of the cell's center
-   The `+ 0.5` is crucial - it gives you the center of the cell, not the top-left corner:
    -   If gridX is 3 and gridSize is 20, the cell spans from x=60 to x=80
    -   (3 + 0.5) \* 20 = 70, which is the center of that range

## **Practical Example:**

Let's trace through a complete example:

1.  You have an agent at canvas position (63, 45)
2.  You call grid.getCellKey(63, 45):
    -   gridX = Math.floor(63/20) = 3
    -   gridY = Math.floor(45/20) = 2
    -   Returns "3,2"
3.  This key "3,2" is stored in the agent's visited cells
4.  Later, you call grid.getCellCenter("3,2"):
    -   gridX = 3, gridY = 2
    -   x = (3 + 0.5) \* 20 = 70
    -   y = (2 + 0.5) \* 20 = 50
    -   Returns {x: 70, y: 50}, the center point of cell "3,2"

## Why this system?

This system allows you to:

1.  Track which grid cells an agent has visited
2.  Count unique locations visited (for the d-EPR formula)
3.  Move agents to the center of specific grid cells
4.  Create a memory-based movement system

### 2. Enhanced Agent Creation with d-EPR Parameters

updated code:

``` jsx
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
        radius: 15,  // the agent cirle radius size
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
}
```

original code before update:

``` jsx
function createAgent(){
        // Determine home position based on canvas size
        const houseX = Math.random() * (canvas.width / 3);      // define the house X coordinate
        const houseY = Math.random() * canvas.height;     // define the house y coordinate

        // determine work position based on canvas size
        const workX = (2/3 * canvas.width) + Math.random() * (canvas.width / 3);
        const workY = Math.random() * canvas.height;

        return {
            x: houseX,      // starting x position
            y: houseY,     // starting y position
            radius: 15,  // the agent cirle radius size
            house: {                      // Set the pixel location of house  
                x: houseX,     
                y: houseY      
            },
            work: {                       // Set the pixel location of work
                x: workX,       
                y: workY
            },
            target: 'cleanWaterbody', // Set the initial target to clean waterbody
            speed: 3,  // movement speed in pixels/frame
            state: "susceptible", // initial state of SEIR
            statetimer: 0, // define how many secons in this current state
            bacteria: bacteriaCounts.susceptible, // define the iniitial bacteria count in the agent

            // d-EPR specific properties
            visitedCells: {}, // object to store visited cells and visit counts
            uniqueVisitCount: 0, // count of unique cells visited (S in the d-EPR formula)
            currentTarget: null, // current movement target cell
            rho: 0.5, // exploration parameter (0 < rho < 1)
            gamma: 0.2, // return decay parameter (0 < gamma < 1)
        }
    }
```

## **Why Define Waterbody Locations**

1.  **Preferential Return Logic**: When agents decide to return to previously visited locations rather than explore new ones, they need to know where important locations are - including waterbodies.
2.  **Disease State Behavior**: Different agent states (susceptible, infected, etc.) may need different preferences for visiting specific waterbodies:
    -   Infected agents might be more likely to visit contaminated waterbodies
    -   Susceptible agents might need to visit clean waterbodies for water
3.  **Special Movement Rules**: You may want agents to prioritize certain locations based on their needs, regardless of their normal movement patterns.

## **Regarding target vs currentTarget**

Yes, you're correct! You don't need the target property anymore since you're now using currentTarget in your d-EPR model.

The key differences:

-   target (old approach): A string identifier like 'cleanWaterbody' that indicated what the agent was targeting
-   currentTarget (new approach): An actual object with x,y coordinates that the agent moves toward

In your d-EPR implementation:

-   currentTarget is used to store the actual coordinates of where the agent is currently moving
-   The d-EPR logic will decide whether to set a new exploration target or return to a previously visited location
-   When the agent reaches its currentTarget, the function returns `true` and the movement logic can select a new target

## **Objects with Function Properties**

``` jsx
const grid = {
    cells: {}, 
    getCellKey: function(x, y) { ... },
    getCellCenter: function(cellKey) { ... }
};
```

Absolutely! In **JavaScript, objects can have functions as properties inside objects.** This is a core feature of the language. These function properties are often called "methods" when they belong to an object.

When you call `grid.getCellCenter(cellKey)`, you're:

1.  Accessing the `getCellCenter` function property of the `grid` object
2.  Calling that function with the `cellKey` parameter

This is a common pattern in JavaScript that allows you to organize related functions together within an object. The object acts as a namespace or module for these related functions.

# **Template Literals in JavaScript**

Yes, that's exactly right! The syntax `${gridX},${gridY}` is a template literal in JavaScript, which was introduced in ES6 (ECMAScript 2015).

## **What Are Template Literals?**

Template literals are a way to create strings in JavaScript that allow for:

1.  **String interpolation** - embedding expressions directly inside the string
2.  **Multi-line strings** - creating strings that span multiple lines without special characters
3.  **Tagged templates** - processing template literals with a function

## **How They Work**

-   Template literals use backticks (\`\`\`) instead of single or double quotes
-   Variables or expressions are embedded using `${expression}` syntax
-   The expressions inside `${}` are evaluated and their values are inserted into the string

## **Example in Your Code**

``` jsx
const cellKey = `${gridX},${gridY}`;
```

This creates a string that combines:

-   The value of the gridX variable
-   A comma character `,`
-   The value of the gridY variable

So if gridX is 3 and gridY is 5, the resulting string will be `"3,5"`.

## **Why Use Template Literals in Your Grid System?**

In your grid system, template literals provide a clean way to create the string keys that represent cell coordinates. These string keys are then used to look up cells in the visitedCells object and can be converted back to coordinates using the getCellCenter function.

### 3. d-EPR Movement Logic

``` jsx
function updateAgentMovement(agent) {
    // If agent has no target or has reached current target, choose a new target
    if (!agent.currentTarget || reachedTarget(agent)) {
        // Decide whether to explore or return based on d-EPR formula
        const pNew = agent.rho * Math.pow(agent.uniqueVisitCount, -agent.gamma);
        
        if (Math.random() < pNew) {
            // EXPLORE: Choose a new unvisited cell
            agent.currentTarget = chooseNewExplorationTarget(agent);
        } else {
            // RETURN: Choose a previously visited cell based on visit frequency
            agent.currentTarget = chooseReturnTarget(agent);
        }
    }
    
    // Move toward current target
    moveTowardTarget(agent);
    
    // Track current cell visitation
    const currentCellKey = grid.getCellKey(agent.x, agent.y);
    if (!agent.visitedCells[currentCellKey]) {
        agent.visitedCells[currentCellKey] = 0;
        agent.uniqueVisitCount++;
    }
    agent.visitedCells[currentCellKey]++;
    
    // Handle waterbody interactions
    handleWaterbodyInteractions(agent);
    
    // Handle disease state transitions
    updateAgentState(agent);
}
```

### 4. Movement Helper Functions

``` jsx
function reachedTarget(agent) {
    if (!agent.currentTarget) return true;
    
    const dx = agent.currentTarget.x - agent.x;
    const dy = agent.currentTarget.y - agent.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    return distance < agent.speed;
}

function moveTowardTarget(agent) {
    if (!agent.currentTarget) return;
    
    const dx = agent.currentTarget.x - agent.x;
    const dy = agent.currentTarget.y - agent.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    // If we're very close, just set position to target
    if (distance < agent.speed) {
        agent.x = agent.currentTarget.x;
        agent.y = agent.currentTarget.y;
    } else {
        // Move toward target at agent's speed
        agent.x += (dx / distance) * agent.speed;
        agent.y += (dy / distance) * agent.speed;
    }
}

function chooseNewExplorationTarget(agent) {
    // Get all grid cells
    const allCells = [];
    const gridWidth = Math.ceil(canvas.width / gridSize);
    const gridHeight = Math.ceil(canvas.height / gridSize);
    
    // Generate random unvisited cell
    let attempts = 0;
    while (attempts < 20) { // Limit attempts to avoid infinite loop
        const gridX = Math.floor(Math.random() * gridWidth);
        const gridY = Math.floor(Math.random() * gridHeight);
        const cellKey = `${gridX},${gridY}`;
        
        // If cell is unvisited, use it
        if (!agent.visitedCells[cellKey]) {
            return grid.getCellCenter(cellKey);
        }
        attempts++;
    }
    
    // If all cells visited or couldn't find unvisited cell, return random cell
    const gridX = Math.floor(Math.random() * gridWidth);
    const gridY = Math.floor(Math.random() * gridHeight);
    return grid.getCellCenter(`${gridX},${gridY}`);
}

function chooseReturnTarget(agent) {
    // Create weighted list of visited locations based on visit frequency
    const visitedLocations = Object.keys(agent.visitedCells);
    
    // Special case: If infected, increase probability of visiting water sources
    if (agent.state === "infected") {
        // 50% chance to go to contaminated water body
        if (Math.random() < 0.5) {
            return agent.contaminatedWaterbodyLocation;
        }
    }
    
    // Special case: If agent needs water, increase probability of visiting clean water
    if (Math.random() < 0.3) { // 30% chance to need water
        return agent.cleanWaterbodyLocation;
    }
    
    // Weighted selection based on visit count
    const totalVisits = Object.values(agent.visitedCells).reduce((sum, count) => sum + count, 0);
    let randomValue = Math.random() * totalVisits;
    
    for (const cellKey of visitedLocations) {
        randomValue -= agent.visitedCells[cellKey];
        if (randomValue <= 0) {
            return grid.getCellCenter(cellKey);
        }
    }
    
    // Fallback to home if something goes wrong
    return agent.home;
}
```

### Breakdown:

```         
function reachedTarget(agentInput) {
        if (!agentInput.currentTarget)  return true; // if no target, consider it reached

        // Calculate distance to the target
        const dx = agentInput.x - agentInput.currentTarget.x;
        const dy = agentInput.y - agentInput.currentTarget.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < agentInput.radius; // if distance is less than agent's radius, consider it reached
    }
```

-   The function basically says: "Has the agent gotten close enough to its destination that we can consider it to have arrived?”
-   `return distance < agentInput.radius;` statement
    -   It’s a boolean expression that:
        1.  Compares the calculated distance between the agent and its target
        2.  Returns `true` if the distance is less than the agent's radius
        3.  Returns `false` otherwise
-   In other words, it's checking if the agent has gotten close enough to its target. If the agent's edge (determined by its radius) reaches or overlaps with the target point, we consider the target "reached.”
-   For example:
    -   If distance = 10 and agent radius = 15, return **true** (agent has reached target)
    -   If distance = 20 and agent radius = 15, return **false** (agent hasn't reached target yet)

``` jsx
// function to move agent towards its target
function moveTowardTarget(agentInput) {
    if (!agentInput.currentTarget) return; // if no target, do nothing

    // Calculate direction vector and the distance between the target and agent current position
    const dx = agentInput.currentTarget.x - agentInput.x;
    const dy = agentInput.currentTarget.y - agentInput.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Move agent towards target
    if (distance > 0) {
        agentInput.x += (dx / distance) * agentInput.speed; // calculate x direction by speed
        agentInput.y += (dy / distance) * agentInput.speed; // calculate y direction by speed
    }
}
```

-   This is basically the function to agent moving towards the target or closer to the target

``` jsx
// Declare function to choose new exploration target
function chooseNewExplorationTarget(agentInput) {
    // get grid height and width
    const gridWidth = Math.ceil(canvas.width / gridSize); // calculate how many grid cells fit across (columns)
    const gridHeight = Math.ceil(canvas.height / gridSize); // calculate how many grid cells fit down (rows)

    // try to find unvisited cell
    let attempts = 0; // counter for attempts to find a new target
    while (attempts < 20 ) { // limit attemp to avoid infinity loop
        // generate random cell coordinates
        const gridX = Math.floor(Math.random() * gridWidth); // random x coordinate
        const gridY = Math.floor(Math.random() * gridHeight); // random y coordinate
        const cellKey = `${gridX},${gridY}`; // create cell key

        if (!agentInput.visitedCells[cellKey]) { // if the cell is not visited
            // return the center of the cell as the new target
            return grid.getCellCenter(cellKey);
        }
        attempts++;
    }

    // if all cells are visited, or could not find unvisited cell, return random cell
    const gridX = Math.floor(Math.random() * gridWidth);
    const gridY = Math.floor(Math.random() * gridHeight);
    return grid.getCellCenter(`${gridX},${gridY}`);
}
```

breakdown:

``` jsx
const gridWidth = Math.ceil(canvas.width / gridSize);
const gridHeight = Math.ceil(canvas.height / gridSize);
```

-   `gridWidth`: The number of grid cells that fit horizontally across the canvas
-   `gridHeight`: The number of grid cells that fit vertically down the canvas
-   For example, if your canvas is 800px wide and your grid cells are 20px each, you'd have Math.ceil(800/20) = 40 columns of grid cells.
-   The `Math.ceil()` function ensures that even partial cells at the edge get counted as full cells.

``` jsx
// function to choose return target
function chooseReturnTarget(agentInput) {
    // Gett all cell that has been visited by the agent
    const visitedLocations = Object.keys(agentInput.visitedCells);

    // if no visited locations, return current position
    // this case shuld not happen in normal operation, but it's a safety check
    if (visitedLocations.length === 0) {
        return { x: agentInput.x, y: agentInput.y }; // return current position
    }

    // calculate total number of visits to all cells
    const totalVisits = Object.values(agentInput.visitedCells).reduce((sum, count) =>  sum + count, 0);

    // Choose random number between 0 and total visits
    const randomValue = Math.floor(Math.random() * totalVisits);

    // go through visited cells to find the target cell by subtracting each count until you go below zero
    for (const cellKey of visitedLocations) {
        randomValue -= agentInput.visitedCells[cellKey]; // subtract the visit count
        if (randomValue < 0) {
            // return the center of the cell as the target
            return grid.getCellCenter(cellKey);
        }
    }

    // Fallback to home
    console.log("Agent defaulting to return home");
    return agent.home;
}
```

## **What This Function Does**

The `chooseReturnTarget` function decides where an agent should go when it's not exploring a new location. It creates a weighted probability distribution based on how frequently the agent has visited different locations before.

It implement the "preferential return" part of the d-EPR (distance-based Exploration and Preferential Return) mobility model. The second version is simply a more detailed implementation with logging.

The key part you're interested in is the weighted selection algorithm:

``` jsx
// Get all visited locations
const visitedLocations = Object.keys(agent.visitedCells);

// Calculate total number of visits across all locations
const totalVisits = Object.values(agent.visitedCells).reduce((sum, count) => sum + count, 0);

// Generate a random value between 0 and totalVisits
let randomValue = Math.random() * totalVisits;

// Loop through locations, subtracting their visit counts
for (const cellKey of visitedLocations) {
    randomValue -= agent.visitedCells[cellKey];
    if (randomValue <= 0) {
        // This is our selected location
        return grid.getCellCenter(cellKey);
    }
}
```

## **How the Weighted Selection Works**

This is a common algorithm for weighted random selection:

1.  It gets all locations the agent has visited before
2.  It calculates the total number of visits across all locations
3.  It picks a random number between 0 and that total
4.  It goes through each location, subtracting that location's visit count from the random number
5.  When the random number goes to or below zero, it returns that location

The effect is that locations visited more frequently have a higher chance of being selected. For example:

-   If Location A was visited 3 times
-   Location B was visited 2 times
-   Location C was visited 1 time
-   Total visits = 6

Then:

-   Location A has a 3/6 = 50% chance of being selected
-   Location B has a 2/6 = 33% chance of being selected
-   Location C has a 1/6 = 17% chance of being selected

``` jsx
const visitedLocations = Object.keys(agentInput.visitedCells);
```

`Object.key()` is a built-in JavaScript method that:

-   Takes an object as input
-   Returns an array containing all the property names (keys) of that object
-   Does not include inherited properties

`Object.values()` is a built-in JavaScript method that:

-   Takes an object as input
-   Returns an array containing all the property values of that object
-   Does not include values of inherited properties

``` jsx
const person = { name: "John", age: 30, city: "New York" };
const keys = Object.keys(person); // ["name", "age", "city"]
const values = Object.values(person); // ["John", 30, "New York"]
```

``` jsx
const totalVisits = Object.values(agentInput.visitedCells).reduce((sum, count) =>  sum + count, 0);
```

-   This is calculating the total number of visits across all cells the agent has visited. Let's break it step by step:

    1.  `Object.values(agentInput.visitedCells)` - Gets an array of all visit counts from the visitedCells object
    2.  `.reduce((sum, count) => sum + count, 0)` - Adds up all those values into a single total

-   example, if your `visitedCells` object looks like:

    ``` jsx
    {
      "3,4": 5,  // Cell at coordinates 3,4 visited 5 times
      "2,1": 3,  // Cell at coordinates 2,1 visited 3 times
      "5,7": 2   // Cell at coordinates 5,7 visited 2 times
    }
    ```

-   Then:

    1.  Object.values() gives `[5, 3, 2]`
    2.  The `reduce()` function adds these up: 5 + 3 + 2 = 10
    3.  totalVisits becomes 10

**Understanding Weighted Random Selection in Your d-EPR Model**

``` jsx
// Generate random value between 0 and total visits
let randomValue = Math.random() * totalVisits;

// Go through cells, subtracting each cell's visits
for (const cellKey of visitedLocations) {
    randomValue -= agentInput.visitedCells[cellKey];
    if (randomValue <= 0) {
        return grid.getCellCenter(cellKey);
    }
}
```

in this approach, you're picking a random number between 0-totalVisits and subtracting each count until you go below zero

steps:

1.  `let randomValue = Math.random() * totalVisits;` → picking a random number between 0-totalVisits

2.  subtracting each count until you go below zero

    ``` jsx
    for (const cellKey of visitedLocations) {
        randomValue -= agentInput.visitedCells[cellKey];
        if (randomValue <= 0) {
            return grid.getCellCenter(cellKey);
        }
    }
    ```

example with visit counts \[5, 3, 2\] totaling 10:

-   Total visits: 10
-   Random number between 0-10, let's say 6
-   Subtract first cell's count: 6 - 5 = 1
-   Subtract second cell's count: 1 - 3 = -2 (negative, so select the second cell)

## **Does This Affect the Overall Distribution?**

For a single selection, the order matters for which specific item is chosen with a given random value.

However, over many selections, the distribution will still match the intended probabilities. Each item will be selected with a frequency proportional to its probability, regardless of the order.

## **Making Order-Independent Weighted Selection**

If you want to make the selection truly order-independent, you could:

1.  **Sort by probability first** (but this changes the intended behavior)
2.  **Use the roulette wheel approach** (what your code currently does)
3.  **Pre-compute cumulative probabilities** and use binary search (more efficient for large sets)

### 5. Visualization Enhancements

``` jsx
function drawScene() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Optional: Draw grid for debugging
    if (showGrid) {
        drawGrid();
    }
    
    // Draw water bodies
    drawWaterBodies();
    
    // Draw agents
    agents.forEach(drawAgent);
    
    // Optional: Draw agent trails/paths
    if (showTrails) {
        agents.forEach(drawAgentTrail);
    }
}

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

function drawAgentTrail(agent) {
    // Draw visited cells with opacity based on visit count
    for (const cellKey in agent.visitedCells) {
        const center = grid.getCellCenter(cellKey);
        const visitCount = agent.visitedCells[cellKey];
        const maxOpacity = 0.7;
        const opacity = Math.min(maxOpacity, 0.1 + (visitCount / 20) * maxOpacity);
        
        ctx.fillStyle = `rgba(255, 200, 200, ${opacity})`;
        ctx.fillRect(
            center.x - gridSize/2, 
            center.y - gridSize/2, 
            gridSize, 
            gridSize
        );
    }
}
```

### 6. UI Controls for Parameters

``` html
// Add UI controls for adjusting rho and gamma
function setupControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'simulation-controls';
    controlsDiv.innerHTML = `
        <div>
            <label for="rhoSlider">Exploration rate (ρ): <span id="rhoValue">0.6</span></label>
            <input type="range" id="rhoSlider" min="0.1" max="1" step="0.1" value="0.6">
        </div>
        <div>
            <label for="gammaSlider">Memory effect (γ): <span id="gammaValue">0.2</span></label>
            <input type="range" id="gammaSlider" min="0.1" max="1" step="0.1" value="0.2">
        </div>
        <div>
            <button id="resetSimulation">Reset</button>
            <label><input type="checkbox" id="showGridCheckbox"> Show Grid</label>
            <label><input type="checkbox" id="showTrailsCheckbox"> Show Trails</label>
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
    
    document.getElementById('resetSimulation').addEventListener('click', reset);
    
    document.getElementById('showGridCheckbox').addEventListener('change', function(e) {
        showGrid = e.target.checked;
    });
    
    document.getElementById('showTrailsCheckbox').addEventListener('change', function(e) {
        showTrails = e.target.checked;
    });
}
```

# The base file

``` jsx
// This function is simlationg how water body gets contaminated by agents

(function() {

    const canvas = document.getElementById('simCanvas')
    const ctx = canvas.getContext('2d');

    // Get the variable color from CSS file
    const style = getComputedStyle(document.documentElement);
    const susceptibleColor = style.getPropertyValue('--susceptible-color');
    const exposedColor = style.getPropertyValue('--exposed-color');
    const infectedColor = style.getPropertyValue('--infected-color');
    const recoveredColor = style.getPropertyValue('--recovered-color');

    // define contaminatedwaterbodies at the start
    const contaminatedWaterbodies = [
        { 
            x: canvas.width * 0.2,         // define x-center point
            y: canvas.height * 0.5,          // define y-center point
            radius: 40      // radius of the waterbody
        }
    ];

    // define clean waterbodies at the start
    const cleanWaterbodies = [
        { 
            x: canvas.width * 0.8,         // define x-center point
            y: canvas.height * 0.5,          // define y-center point
            radius: 40,      // radius of the waterbody
            isContaminated: false, // define if the waterbody is contaminated or not
            bacteria: 0, // define the bacteria count in the waterbody
            contaminationLevel: 0,         // visual representation of contamination (0 to 1)
            volume: 1000000 // define the volume of the waterbody in ml
        }
    ];

    // define bacteria counts for different agent state
    const bacteriaCounts = {
        susceptible: 12800,
        exposed: 19200,
        infected: 128000000,
        recovered: 0
    };

    // Function to store agent's initial characters
    function createAgent(){
        const houseX = canvas.width * 0.5 ;      // define the house X coordinate
        const houseY = canvas.height * 0.5 + 100;     // define the house y coordinate
        
        return {
            x: houseX,      // starting x position
            y: houseY,     // starting y position
            radius: 15,  // the agent cirle radius size
            house: {                      // Set the pixel location of house  
                x: houseX,     
                y: houseY      
            },
            target: 'cleanWaterbody', // Set the initial target to clean waterbody
            speed: 3,  // movement speed in pixels/frame
            state: "susceptible", // initial state of SEIR
            statetimer: 0, // define how many secons in this current state
            bacteria: bacteriaCounts.susceptible // define the iniitial bacteria count in the agent
        }
    }

    // Create array to store the agent array value, 50 agents
    let agents = [];
    for (let i = 0; i < 1 ; i++) {
        agents.push(createAgent());
    }

    // function to draw the scene
    function drawScene() {
        
        // Clear the entire canvas to start fresh
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw waterbodies
        drawWaterBodies()

        //Draw the agent and their house
        agents.forEach(agent => {
            drawHouse(agent);
            drawAgent(agent);
        });
    }

    // agent drawing function
    function drawAgent(agentInput) {
        ctx.beginPath();
        ctx.arc(agentInput.x, agentInput.y, agentInput.radius, 0, 2 * Math.PI);
        
        switch (agentInput.state) {
            case "susceptible":
                ctx.fillStyle = susceptibleColor;
                break;
            
            case "exposed":
                ctx.fillStyle = exposedColor;
                break;

            case "infected" :
                ctx.fillStyle = infectedColor;
                break;

            case "recovered" :
                ctx.fillStyle = recoveredColor;
                break;
        }

        ctx.fill();
        // ctx.strokeStyle = '#333';
        // ctx.lineWidth = 1;
        // ctx.stroke();
        ctx.closePath();
    }

    // Draw House
    function drawHouse(agentInput) {
        ctx.fillStyle = 'brown'; // Set the color for the house
        ctx.fillRect(agentInput.house.x - 20, agentInput.house.y - 20, 40, 40); // Draw a square house
    }

    function drawWaterBodies() {
        // Draw contaminated waterbody
        for (const waterbodies of contaminatedWaterbodies) {
            ctx.beginPath();
            ctx.arc(waterbodies.x, waterbodies.y, waterbodies.radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'darkblue'; //choose the background colour
            ctx.fill();
            //ctx.stroke();
            ctx.closePath();
        }

        // Draw clean waterbody
        for (const waterbodies of cleanWaterbodies) {
            ctx.beginPath();
            ctx.arc(waterbodies.x, waterbodies.y, waterbodies.radius, 0, 2 * Math.PI);
            ctx.fillStyle = 'lightblue'; //choose the background colour
            ctx.fill();
            //ctx.stroke();
            ctx.closePath();

            //if the waterbody has bacteria, draw a darker circle
            if (waterbodies.bacteria > 0) {
                ctx.beginPath();
                ctx.arc(waterbodies.x, waterbodies.y, waterbodies.radius * waterbodies.contaminationLevel, 0, 2 * Math.PI);
                ctx.fillStyle = 'darkblue'; // dark blue with transparency
                ctx.fill();
                ctx.closePath();
            }
        }
    }

    // update agent position or agent movement
    function updateAgentMovement(agentInput) {
        
        if(agentInput.target === 'cleanWaterbody') {
            const dx = cleanWaterbodies[0].x - agentInput.x; // calculate the distance in x-axis
            const dy = cleanWaterbodies[0].y - agentInput.y; // calculate the distance in y-axis
            const distance = Math.sqrt(dx * dx + dy * dy); // calculate the straight line distance between agent and waterbody

            if (distance - cleanWaterbodies[0].radius > agentInput.speed) {
                agentInput.x += (dx / distance) * agentInput.speed;       // to find new x posiiton. (dx / distance) is cos -> cos * agent.speed = x-coordinate position
                agentInput.y += (dy / distance) * agentInput.speed;       // to find new y posiiton. (dy / distance) is sin -> sin * agent.speed = y-coordinate position
            } else {
                if (agentInput.state === "susceptible") {
                    agentInput.target = 'contaminatedWaterbody'; // if the agent is close enough to the clean waterbody, change the target to contaminated waterbody
                } else {
                    agentInput.target = 'home'; // if the agent is not susceptible, change the target to home   
                }
            }
        }

        if (agentInput.target === 'contaminatedWaterbody') {
            const dx = contaminatedWaterbodies[0].x - agentInput.x; // calculate the distance in x-axis
            const dy = contaminatedWaterbodies[0].y - agentInput.y; // calculate the distance in y-axis
            const distance = Math.sqrt(dx * dx + dy * dy); // calculate the straight line distance between agent and waterbody

            if (distance - contaminatedWaterbodies[0].radius > agentInput.speed) {
                agentInput.x += (dx / distance) * agentInput.speed;       // to find new x posiiton. (dx / distance) is cos -> cos * agent.speed = x-coordinate position
                agentInput.y += (dy / distance) * agentInput.speed;       // to find new y posiiton. (dy / distance) is sin -> sin * agent.speed = y-coordinate position
            } else {
                agentInput.target = 'home'; // if the agent is close enough to the contaminated waterbody, change the target to home
            }
        }

        if (agentInput.target === 'home') {
            const dx = agentInput.house.x - agentInput.x; // calculate the distance in x-axis
            const dy = agentInput.house.y - agentInput.y; // calculate the distance in y-axis
            const distance = Math.sqrt(dx * dx + dy * dy); // calculate the straight line distance between agent and house

            if (distance > agentInput.speed) {
                agentInput.x += (dx / distance) * agentInput.speed;       // to find new x posiiton. (dx / distance) is cos -> cos * agent.speed = x-coordinate position
                agentInput.y += (dy / distance) * agentInput.speed;       // to find new y posiiton. (dy / distance) is sin -> sin * agent.speed = y-coordinate position
            } else {
                agentInput.target = 'cleanWaterbody'; // if the agent is close enough to the house, change the target to clean waterbody
            }
        }  
    }

    // Logic of agent SEIR state transition
    function updateAgentState(agentInput, deltaTime) {
        switch (agentInput.state) {
            case "exposed":
                agentInput.statetimer += deltaTime;
                if (agentInput.statetimer >= 3) {       // checking the condition where the agent have been int he exposed state more than 5 seconds
                    agentInput.state = "infected";      // change the state to infected
                    agentInput.bacteria = bacteriaCounts.infected; // update the bacteria count to infected
                    agentInput.statetimer = 0;          // Set the timer to 0 again
                }
                break;
            case "infected":
                agentInput.statetimer += deltaTime;
                if (agentInput.statetimer >= 4) {      // checking the condition where the agent have been in the infected state more than 10 seconds
                    agentInput.state = "recovered";     // change the state to recovered
                    agentInput.bacteria = bacteriaCounts.recovered; // update the bacteria count to recovered
                    agentInput.statetimer = 0;          // Set the timer to 0 again
                }
                break;
            case "recovered":
                agentInput.statetimer += deltaTime;
                if (agentInput.statetimer >= 50) {     // checking the condition where the agent have been int he recovered state more than 200 seconds
                    agentInput.state = "susceptible";   // change the state to susceptible
                    agentInput.bacteria = bacteriaCounts.susceptible; // update the bacteria count to susceptible
                    agentInput.statetimer = 0;          // Set the timer to 0 again
                }
                break;
        }
    }

    // Get the deltaTime to calculate how long the agent have been on that state
    let lastTime = performance.now();       // Define the lastTime object with timestamp from `performance.now()` for the initial value

    // Function to calculate deltaTime
    // This function calculates the time difference between the current frame and the last frame
    function getDeltaTime(currentTimeInput) {
        let deltaTime = (currentTimeInput - lastTime) / 1000;       // divided to 1000 to change the unit of deltaTime from milisecond to second
        lastTime = currentTimeInput;                                // Assign new lastTime with currentTime for the next frame calculation
        return deltaTime;                                           // Return the result of deltatime
    }

    // Logic detect contacting contaminated waterbody
    function touchingContaminatedWater(agentInput) {
        for (const waterbodies of contaminatedWaterbodies) {
            //dx is storing the x-distance between centre of agent and contaminated waterbody
            const dx = agentInput.x - waterbodies.x  // agentInput.x is the x-position of agent centre and 600 is the x-position of the contaminated waterbody
            //dy is storing the y-distance between centre of agent and contaminated wateerbody
            const dy = agentInput.y - waterbodies.y   // agentInput.y is the y-position of agent centre and 450 is the y-position of the contaminated waterbody
        
            // calculate the staighline distance between agent centre and waterbody centre using pythagoras
            const distance = Math.sqrt(dx * dx + dy * dy);

            // check if the agent is touching waterbody or not
            // contaminted water body has radius 40
            // if the distance between centres is less than the total of waterbody's radius and agent's radius, it means it is touching or even overlap
            return distance <= 40 + agentInput.radius;
        }
    }

    // Trigger exposed stage after suceptible agent tpuch waterbody
    function changeToExposed(agentInput) {
        if (agentInput.state === "susceptible" && touchingContaminatedWater(agentInput)) {
            agentInput.state = "exposed";
            agentInput.bacteria = bacteriaCounts.exposed; // update the bacteria count to exposed
            agentInput.statetimer = 0;
        }
    }

    // contaminated waterbody threshold (bacteria/ml)
    const contaminatedWaterbodyThreshold = 1000;

    //function to updatebacteria count in clean waterbodies
    function updateCleanWaterbodyBacteria(agentInput) {
        for (const waterbody of cleanWaterbodies) {
            const dx = waterbody.x - agentInput.x // calculate the distance in x-axis
            const dy = waterbody.y - agentInput.y // calculate the distance in y-axis
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if agent touching waterbody
            if (distance  <=  agentInput.speed + waterbody.radius) {

                //console.log(`Before transfer - Agent state: ${agentInput.state}, Agent bacteria: ${agentInput.bacteria}, Water bacteria: ${waterbody.bacteria}`);

                // transfer bacteria in to the waterbody
                waterbody.bacteria += agentInput.bacteria; // add the bacteria count from agent to the waterbody

                //check if celanwaterbody got contaminated
                if (waterbody.bacteria > contaminatedWaterbodyThreshold * waterbody.volume) {
                    waterbody.isContaminated = true; // set the waterbody to contaminated
                }

                // calculate the contamination level (0 to 1) of the waterbody
                waterbody.contaminationLevel = Math.min ((waterbody.bacteria /  bacteriaCounts.infected) * 1000, 1);    // `Math.min()` is to decide which one is the smallest number, so if the bacteria exceed the threshold, the value will be 1. times 1000 to multiply the value so become more significant to draw radius circle

                console.log(`After transfer - Agent state: ${agentInput.state}, Agent bacteria: ${agentInput.bacteria}, Water bacteria: ${waterbody.bacteria}, contamination level: ${waterbody.contaminationLevel}, contaminated: ${waterbody.isContaminated}`);
            }
        }
    }
    

    // DRAWING STACKED CHART OVERTIME
    // Calling the chart canvas
    const chartCanvas = document.getElementById('chartCanvas');
    const chartCtx  = chartCanvas.getContext('2d');

    // store the simmulation starting time
    let simulationStartTime = performance.now();

    // create global array to store SEIR count over time
    const SEIRDataOverTime = [];

    // How often in second the log SEIR counts
    const logInterval = 0.1; //in second
    let timeAccumulator = 0; // set initial time

    // Store the ID of the current animation frame
    let animationId = null; 

    // Render the canvas in loop
    function animate(currentTime) {
        const deltaTime = getDeltaTime(currentTime)     // to calculate the deltaTime

        agents.forEach(agent => {
            changeToExposed(agent);                         // to change from susceptible to exposed
            updateAgentMovement(agent);                     // to call control agent movement
            updateAgentState(agent, deltaTime);             // to change the SEIR state
            updateCleanWaterbodyBacteria(agent);            // to update the clean waterbody bacteria count
        })
        
        drawScene();   
        
        animationId = requestAnimationFrame(animate);                 // To schedule next frame (re-run animation) before processing and capture the ID  
    }

    //declare reset function
    function reset() {
        console.log("resetting simulation");

        // recreate agents array 
        agents = [];
        for (let i = 0; i < 1; i++){
            agents.push(createAgent())
        }

        // Reset contaminated waterbodies
        // Reset clean waterbodies
        for (const waterbody of cleanWaterbodies) {
            waterbody.bacteria = 0;
            waterbody.isContaminated = false;
            waterbody.contaminationLevel = 0;
        }

        // Reset timing variables -- basically decalring everyting to null or zero again 
        // simulationStartTime = performance.now();
        // SEIRDataOverTime.length = 0;
        timeAccumulator = 0;
        lastTime = performance.now();

        // Reset UI counters
        document.getElementById('timeCount').textContent = '0';
        document.getElementById('susceptibleCount').textContent = '0';
        document.getElementById('exposedCount').textContent = '0';
        document.getElementById('infectedCount').textContent = '0';
        document.getElementById('recoveredCount').textContent = '0';       
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

        // start the animation
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

        // Clear the entire canvas to start fresh
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    window.sim_depr_mobility = { 
        start, 
        stop,
        reset // Optional but useful for debugging
    };

})();
```

# single file version

``` jsx
// sim_depr_mobility.js - Implementing d-EPR (distance-based Exploration and Preferential Return) mobility model

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
```

## code