/**
 * Slider Controls for Cholera Simulation
 * 
 * This file handles all interactive slider controls for the simulation parameters:
 * - Vaccination coverage (0-100%)
 * - Exploration parameter ρ (0.0-1.0)
 * - Return decay parameter γ (0.0-1.0)
 * 
 * Features:
 * - Real-time parameter updates
 * - Automatic simulation restart after idle period
 * - Debounced restart to prevent excessive reloading
 */

(function() {
    'use strict';

    // Configuration constants
    const RESTART_DELAY = 1500; // Milliseconds to wait after last slider change before restarting
    
    // Restart management
    let restartTimer = null;
    
    /**
     * Debounced restart function - restarts simulation after idle period
     */
    function scheduleRestart() {
        // Clear any existing restart timer
        if (restartTimer) {
            clearTimeout(restartTimer);
        }
        
        // Schedule new restart after delay
        restartTimer = setTimeout(() => {
            console.log('Auto-restarting simulation after parameter changes...');
            
            // Check if the reset function is available and call it
            if (window.resetSimulation && typeof window.resetSimulation === 'function') {
                window.resetSimulation();
            } else if (window.sim_depr_mobility_hydration_logic && 
                       window.sim_depr_mobility_hydration_logic.reset) {
                window.sim_depr_mobility_hydration_logic.reset();
            } else {
                console.warn('No reset function available for auto-restart');
            }
            
            restartTimer = null;
        }, RESTART_DELAY);
    }

    /**
     * Update vaccination coverage and schedule restart
     * @param {number} percentage - Vaccination coverage percentage (0-100)
     */
    function updateVaccinationWithRestart(percentage) {
        // Update the parameter
        if (window.sim_depr_mobility_hydration_logic && 
            window.sim_depr_mobility_hydration_logic.updateVaccinationCoverage) {
            window.sim_depr_mobility_hydration_logic.updateVaccinationCoverage(percentage);
        }
        
        // Schedule restart
        scheduleRestart();
    }

    /**
     * Update exploration parameter and schedule restart
     * @param {number} rho - Exploration parameter (0.0-1.0)
     */
    function updateExplorationWithRestart(rho) {
        // Update the parameter
        if (window.sim_depr_mobility_hydration_logic && 
            window.sim_depr_mobility_hydration_logic.updateExplorationParameter) {
            window.sim_depr_mobility_hydration_logic.updateExplorationParameter(rho);
        }
        
        // Schedule restart
        scheduleRestart();
    }

    /**
     * Update return decay parameter and schedule restart
     * @param {number} gamma - Return decay parameter (0.0-1.0)
     */
    function updateReturnDecayWithRestart(gamma) {
        // Update the parameter
        if (window.sim_depr_mobility_hydration_logic && 
            window.sim_depr_mobility_hydration_logic.updateReturnDecayParameter) {
            window.sim_depr_mobility_hydration_logic.updateReturnDecayParameter(gamma);
        }
        
        // Schedule restart
        scheduleRestart();
    }

    /**
     * Initialize all slider event handlers
     */
    function initializeSliders() {
        // Vaccination Coverage Slider
        const vaccinationSlider = document.getElementById('vaccinationSlider');
        const vaccinationValue = document.getElementById('vaccinationValue');
        
        if (vaccinationSlider && vaccinationValue) {
            vaccinationSlider.addEventListener('input', function() {
                const value = parseInt(this.value);
                vaccinationValue.textContent = value;
                updateVaccinationWithRestart(value);
            });
        } else {
            console.warn('Vaccination slider elements not found');
        }

        // Exploration Parameter (Rho) Slider
        const rhoSlider = document.getElementById('rhoSlider');
        const rhoValue = document.getElementById('rhoValue');
        
        if (rhoSlider && rhoValue) {
            rhoSlider.addEventListener('input', function() {
                const value = parseFloat(this.value);
                rhoValue.textContent = value.toFixed(2);
                updateExplorationWithRestart(value);
            });
        } else {
            console.warn('Rho slider elements not found');
        }

        // Return Decay Parameter (Gamma) Slider
        const gammaSlider = document.getElementById('gammaSlider');
        const gammaValue = document.getElementById('gammaValue');
        
        if (gammaSlider && gammaValue) {
            gammaSlider.addEventListener('input', function() {
                const value = parseFloat(this.value);
                gammaValue.textContent = value.toFixed(2);
                updateReturnDecayWithRestart(value);
            });
        } else {
            console.warn('Gamma slider elements not found');
        }

        console.log('Slider controls initialized with auto-restart functionality');
    }

    // Initialize sliders when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSliders);
    } else {
        // DOM already loaded
        initializeSliders();
    }

    // Expose functions globally for debugging/external access
    window.sliderControls = {
        scheduleRestart,
        updateVaccinationWithRestart,
        updateExplorationWithRestart,
        updateReturnDecayWithRestart,
        RESTART_DELAY
    };

})();