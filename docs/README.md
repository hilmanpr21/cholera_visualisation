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
├── slider-controls.js     # Interactive parameter controls with auto-restart
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
| `sim_depr_mobility_hydration_logic.js` | Enhanced d-EPR with vaccination | Vaccination logic, parameter control |
| `sim_waterbody_to_contaminated_waterbody.js` | Water contamination model | Environmental transmission |

## Architecture

### Agent-Based Model Components
- **Agents**: Represent individuals with health states (S-E-I-R)
- **Vaccination**: 20% coverage with 69% efficacy for infection prevention
- **Environment**: Canvas-based world with water bodies
- **Movement**: Various mobility models (random, origin-destination, d-EPR)
- **Transmission**: Contact-based and environmental routes
- **Interactive Controls**: Real-time parameter adjustment with automatic restart

### Visualization Pipeline
1. **Data Model**: Agent states and positions
2. **Rendering**: Canvas 2D context drawing with vaccination indicators
3. **Animation**: RequestAnimationFrame loop
4. **UI Updates**: Real-time statistics and parameter controls
5. **Auto-Restart**: Debounced simulation restart after parameter changes

## Development Guide
See [tutorial/](tutorial/) for step-by-step building instructions.

## API Reference
See [api/](api/) for detailed function documentation.
