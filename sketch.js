// Configuration constants
const PARTICLE_COUNT = 1000;
const MAX_SPEED = 2;
const NOISE_SCALE = 0.01;
const FORCE_STRENGTH = 0.1;
const TIME_INCREMENT = 0.01;

let world;

function setup() {
  // Create fullscreen canvas
  createCanvas(windowWidth, windowHeight);
  
  // Initialize world
  world = new World();
  
  // Minimal styling
  stroke(255);
  strokeWeight(1);
}

function draw() {
  background(0);
  
  // Update and render world
  world.update();
  world.render();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
