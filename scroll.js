const scroller = scrollama();

// Keep track of the current script tag
let currentScriptTag = null;

// Load simulation script based on data-sim
function loadSimulation(simName) {
  const scriptSrc = `${simName}.js`;

  // Remove previous simulation script
  if (currentScriptTag) {
    currentScriptTag.remove();
    currentScriptTag = null;
  }

  // Clear previous simulation content
  document.getElementById('simCanvas').innerHTML = '';
  document.getElementById('logState').innerHTML = '';
  document.getElementById('chartCanvas').innerHTML = '';

  // Create new script tag
  const newScript = document.createElement('script');
  newScript.src = scriptSrc;
  newScript.onload = () => {
    console.log(`Loaded ${scriptSrc}`);
  };

  document.body.appendChild(newScript);
  currentScriptTag = newScript;
}

// Setup scrollama
scroller
  .setup({
    step: '.step',
    offset: 0.5,
  })
  .onStepEnter(response => {
    const simName = response.element.getAttribute('data-sim');
    loadSimulation(simName);
  });
