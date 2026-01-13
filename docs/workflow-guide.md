# Documentation Workflow Guide

## Big Picture: Hybrid Documentation System

This system combines three powerful approaches:

1\. **JSDoc** (in `.js` files) - Function-level API documentation\
2. **Markdown** (in `/docs`) - Tutorial and conceptual explanations

3\. **GitHub Permalinks** - Version-specific code references

## Daily Development Workflow

### Phase 1: Development & Initial Documentation

```         
📝 Code → 🔍 JSDoc → 📄 Draft Tutorial
```

#### Step 1: Write Code with JSDoc Comments

``` javascript
/**
 * Choose return target using frequency-weighted selection from visited cells
 * Implements the "Preferential Return" part of d-EPR model where agents
 * return to previously visited locations with probability proportional 
 * to the number of times they've been visited.
 * 
 * @param {Agent} agentInput - The agent choosing a return target
 * @returns {Object} Target coordinates {x, y} in canvas pixels
 * @example
 * const target = chooseReturnTarget(agent);
 * agent.currentTarget = target;
 */
function chooseReturnTarget(agentInput) {
    // Implementation here
}
```

#### Step 2: Create Draft Tutorial (Without Permalinks)

``` markdown
# Tutorial 3: d-EPR Mobility Model

## Stage A: Basic Implementation (DRAFT)

> **⚠️ DRAFT**: Code not yet committed - line numbers may change

### Core Algorithm
The main decision logic is in `chooseReturnTarget()` around line 240:
```js
// Draft code snippet
function chooseReturnTarget(agentInput) {
    // Basic implementation
}
```

## Stage B: Enhanced Implementation (DRAFT)

### Key Improvements

-   Enhanced collision avoidance (see `getAvailableGridCell()` around line 75)
-   Performance optimization for 200+ agents

```         

### Phase 2: Commit & Finalize Documentation  
```

💾 Git Commit → 🔗 Update Permalinks → ✅ Final Tutorial

```         

#### Step 3: Commit Your Code
```bash
git add .
git commit -m "feat: implement basic d-EPR model (Stage A)"
# Note the commit hash: e.g., a1b2c3d
```

#### Step 4: Update Tutorial with Permalinks

``` markdown
# Tutorial 3: d-EPR Mobility Model

## Stage A: Basic Implementation

> **🔗 Code Version**: [Commit a1b2c3d](https://github.com/hilmanpr21/cholera_visualisation/commit/a1b2c3d) - "Implement basic d-EPR model"  
> **📅 Date**: August 7, 2025

### Core Algorithm
**File**: [`sim_depr_mobility.js` (lines 240-265)](https://github.com/hilmanpr21/cholera_visualisation/blob/a1b2c3d/sim_depr_mobility.js#L240-L265)
```js
function chooseReturnTarget(agentInput) {
    // Exact code from commit a1b2c3d
}
```

## Stage B: Enhanced Implementation (Coming Soon)

...

```         

#### Step 5: Continue with Next Stage
When you enhance the code:
```bash
git commit -m "feat: enhance d-EPR with collision avoidance (Stage B)"
# New commit hash: x9y8z7w
```

Then add Stage B section to the same file:

``` markdown
## Stage B: Enhanced Implementation

> **🔗 Code Version**: [Commit x9y8z7w](https://github.com/hilmanpr21/cholera_visualisation/commit/x9y8z7w) - "Enhanced collision avoidance"  
> **📅 Date**: August 10, 2025

### Key Changes from Stage A
**What Changed**: Enhanced collision avoidance algorithm

**Stage A Version**: [Basic approach](https://github.com/hilmanpr21/cholera_visualisation/blob/a1b2c3d/sim_depr_mobility.js#L75-L95)
**Stage B Version**: [Enhanced approach](https://github.com/hilmanpr21/cholera_visualisation/blob/x9y8z7w/sim_depr_mobility.js#L75-L105)
```

## File Structure

```         
docs/
├── README.md                           # Project overview
├── workflow-guide.md                   # This file
├── tutorial/
│   ├── 01-basic-setup.md              # Single tutorial per topic
│   ├── 02-seir-model.md               # Contains all stages for SEIR
│   ├── 03-depr-mobility.md            # Stage A, B, C all in one file
│   └── assets/                        # Screenshots and diagrams
├── api/
│   └── auto-generated/                # JSDoc output
└── changelog/
    └── summary.md                     # High-level changes
```

## Tutorial Structure Template

Each tutorial file contains multiple stages in sequence:

``` markdown
# Tutorial X: Feature Name

## Overview
Brief description of what this tutorial covers across all stages.

## Stage A: Initial Implementation

> **🔗 Code Version**: [Commit abc123](link) - "Brief description"  
> **📅 Date**: August X, 2025

### What This Stage Covers
- Feature 1
- Feature 2

### Implementation Details
Code examples with permalinks...

### Testing & Results
Performance metrics, known issues...

---

## Stage B: Enhanced Implementation  

> **🔗 Code Version**: [Commit def456](link) - "Enhanced version"  
> **📅 Date**: August Y, 2025  
> **📋 Previous**: Stage A (above)

### What's New in Stage B
- Improvement 1
- Improvement 2

### Key Changes from Stage A
Side-by-side comparisons with permalinks...

### Migration Guide: Stage A → Stage B
Step-by-step upgrade instructions...

---

## Stage C: Advanced Implementation (Future)
Planned improvements...

## Summary & Next Steps
Links to related tutorials...
```

## Daily Checklist

### During Development

-   [ ] Add JSDoc comments to new functions
-   [ ] Update draft tutorial sections
-   [ ] Take screenshots for later use

### After Major Feature

-   [ ] Commit with descriptive message
-   [ ] Update tutorial with commit permalinks\
-   [ ] Add performance comparison table
-   [ ] Test migration steps

### Weekly Review

-   [ ] Check for broken links
-   [ ] Update overview documentation
-   [ ] Add new stages to existing tutorials

## Pro Tips

### Commit Message Format

```         
feat: add basic d-EPR model (Stage A)
fix: resolve collision detection bug (Stage B hotfix)  
docs: update mobility tutorial with Stage C
refactor: optimize grid search algorithm
```

### Link Management

-   Use relative links within docs: `[Stage A](#stage-a-implementation)`
-   Use GitHub permalinks for code: `[function](https://github.com/.../blob/abc123/file.js#L10-L20)`
-   Keep a link inventory in each tutorial for easy reference

### Image Workflow

1.  **Screenshot**: Take during development
2.  **GitHub Upload**: Drag to issue comment for URL
3.  **Local Backup**: Save in `/assets` folder\
4.  **Reference**: Use in tutorial with descriptive alt text

## Automation Opportunities

### Auto-screenshot Script

``` javascript
// Add to your simulation
function captureStage(stageName, agentCount) {
    setTimeout(() => {
        const canvas = document.getElementById('simCanvas');
        const link = document.createElement('a');
        link.download = `${stageName}-${agentCount}agents-${new Date().toISOString().slice(0,10)}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }, 2000); // Wait for simulation to stabilize
}
```

### JSDoc Auto-generation

``` bash
# Generate API docs from code comments
npx jsdoc -c jsdoc.conf.json -d docs/api/
```

### Link Checker

``` bash
# Check for broken links in documentation
npm install -g markdown-link-check
markdown-link-check docs/**/*.md
```

## Example Workflow in Action

### Day 1: Start new feature

``` bash
# 1. Code the feature
vim sim_new_feature.js  # Add JSDoc comments

# 2. Create draft tutorial
echo "# Tutorial 4: New Feature\n## Stage A (DRAFT)" > docs/tutorial/04-new-feature.md
```

### Day 3: Feature complete

``` bash
# 3. Commit the code
git add .
git commit -m "feat: implement new feature (Stage A)"
# Note commit: abc123

# 4. Update tutorial with permalinks
sed -i 's/DRAFT/Code Version: [Commit abc123](link)/' docs/tutorial/04-new-feature.md
```

### Day 10: Enhancement ready

``` bash
# 5. Enhance the feature
vim sim_new_feature.js  # Improve implementation

# 6. Commit enhancement
git commit -m "feat: enhance new feature with optimization (Stage B)"
# Note commit: def456

# 7. Add Stage B to same tutorial file
echo "\n## Stage B: Enhanced Implementation\n> Code Version: [Commit def456]..." >> docs/tutorial/04-new-feature.md
```

This workflow ensures you never lose track of your development process and can always trace back to specific implementations!