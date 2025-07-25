// Get canvas elements
const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const chartCanvas = document.getElementById('chartCanvas');
const chartCtx = chartCanvas.getContext('2d');

// Get CSS variables
const style = getComputedStyle(document.documentElement);
const susceptibleColor = style.getPropertyValue('--susceptible-color');
const exposedColor = style.getPropertyValue('--exposed-color');
const infectedColor = style.getPropertyValue('--infected-color');
const recoveredColor = style.getPropertyValue('--recovered-color');