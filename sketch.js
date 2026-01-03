// Configuration object (controllable via lil-gui)
const config = {
  particleCount: 1000,
  maxParticles: 5000,
  maxSpeed: 2,
  noiseScale: 0.01,
  forceStrength: 0.1,
  timeIncrement: 0.01,
  particlesPerFrame: 5,
  currentParticleCount: 0 // Display only - updated in draw()
};

// Graphics configuration object
const graphics = {
  particleSize: 1
};

let world;
let gui;
let particleCountController;

function setup() {
  // Create fullscreen canvas
  createCanvas(windowWidth, windowHeight);
  
  // Initialize world
  world = new World();
  
  // Minimal styling
  stroke(255);
  
  // Setup lil-gui
  gui = new lil.GUI();
  const initialParticlesController = gui.add(config, 'particleCount', 0, 10000).name('Initial Particles');
  initialParticlesController.onFinishChange(() => {
    // Recreate world when Initial Particles slider is released
    world = new World();
    updateParticleCount();
  });
  const maxParticlesController = gui.add(config, 'maxParticles', 100, 20000).name('Max Particles');
  maxParticlesController.onFinishChange(() => {
    // Trim particles if current count exceeds new max
    if (world && world.particles.length > config.maxParticles) {
      const excess = world.particles.length - config.maxParticles;
      world.particles.splice(0, excess);
      updateParticleCount();
    }
  });
  gui.add(config, 'maxSpeed', 0.1, 10).name('Max Speed');
  gui.add(config, 'noiseScale', 0.001, 0.1).name('Noise Scale');
  gui.add(config, 'forceStrength', 0.01, 1).name('Force Strength');
  gui.add(config, 'timeIncrement', 0.001, 0.1).name('Time Increment');
  gui.add(config, 'particlesPerFrame', 1, 50).name('Particles Per Frame');
  
  // Add read-only particle count display
  particleCountController = gui.add(config, 'currentParticleCount')
    .name('Current Particles')
    .listen(); // Auto-update every frame
  particleCountController.domElement.querySelector('input').disabled = true;
  
  // Initialize particle count
  updateParticleCount();
  
  // Graphics folder
  const graphicsFolder = gui.addFolder('Graphics');
  graphicsFolder.add(graphics, 'particleSize', 0.5, 10).name('Particle Size');
  
  // Update flow field when relevant parameters change
  gui.onChange(() => {
    if (world && world.flowField) {
      world.flowField.noiseScale = config.noiseScale;
      world.flowField.forceStrength = config.forceStrength;
      world.flowField.timeIncrement = config.timeIncrement;
    }
  });
}

// Helper function to update particle count display
function updateParticleCount() {
  if (world) {
    config.currentParticleCount = world.particles.length;
    if (particleCountController) {
      particleCountController.updateDisplay();
    }
  }
}

function draw() {
  background(0,20);
  
  // Generate particles at mouse position when left mouse button is held
  if (mouseIsPressed && mouseButton === LEFT) {
    for (let i = 0; i < config.particlesPerFrame; i++) {
      world.addParticle(mouseX, mouseY);
    }
  }
  
  // Update current particle count for display
  updateParticleCount();
  
  // Update and render world
  world.update();
  world.render();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
