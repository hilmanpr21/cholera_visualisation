# Cholera Simulation Documentation

## Overview
This project visualizes cholera spread through agent-based modeling using JavaScript and HTML5 Canvas.

## Quick Start
1. Clone the repository
2. Open `index.html` in a web browser
3. Scroll through the interactive tutorial

## Project Structure
```
├── index.html              # Main interactive page with scrollytelling
├── style.css              # Global styles and theme variables
├── scroll.js              # Scrollytelling logic using Scrollama
├── shared.js              # Shared constants and utilities
├── sim_*.js               # Individual simulation modules
└── docs/                  # Documentation (this folder)
```

## Simulation Modules

| File | Description | Key Features |
|------|-------------|--------------|
| `sim_seir_1_agent.js` | Single agent SEIR model | Basic disease progression |
| `sim_200_agents.js` | Random movement simulation | Multi-agent dynamics |
| `sim_depr_mobility.js` | d-EPR mobility model | Realistic human movement patterns |
| `sim_waterbody_to_contaminated_waterbody.js` | Water contamination model | Environmental transmission |

## Architecture

### Agent-Based Model Components
- **Agents**: Represent individuals with health states (S-E-I-R)
- **Environment**: Canvas-based world with water bodies
- **Movement**: Various mobility models (random, origin-destination, d-EPR)
- **Transmission**: Contact-based and environmental routes

### Visualization Pipeline
1. **Data Model**: Agent states and positions
2. **Rendering**: Canvas 2D context drawing
3. **Animation**: RequestAnimationFrame loop
4. **UI Updates**: Real-time statistics display

## Development Guide
See [tutorial/](tutorial/) for step-by-step building instructions.

## API Reference
See [api/](api/) for detailed function documentation.
