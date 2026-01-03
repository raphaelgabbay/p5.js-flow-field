class World {
  constructor() {
    this.particles = [];
    this.flowField = new FlowField();
    
    // Initialize particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = random(width);
      const y = random(height);
      this.particles.push(new Particle(x, y));
    }
  }

  update() {
    // Update flow field
    this.flowField.update();
    
    // Update all particles
    for (let particle of this.particles) {
      // Get force from flow field at particle position
      const force = this.flowField.getForceAt(
        particle.position.x,
        particle.position.y
      );
      
      // Apply force to particle
      particle.applyForce(force);
      
      // Update particle physics
      particle.update();
      
      // Handle edge wrapping
      particle.edges();
    }
  }

  render() {
    // Draw all particles
    for (let particle of this.particles) {
      particle.show();
    }
  }
}
