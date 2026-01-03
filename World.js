class World {
  constructor() {
    this.particles = [];
    this.flowField = new FlowField();
    
    // Initialize particles
    for (let i = 0; i < config.particleCount; i++) {
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

  addParticle(x, y) {
    // Add new particle at specified position
    this.particles.push(new Particle(x, y));
    
    // Remove oldest particles if we exceed maxParticles
    // Oldest particles are at the beginning of the array
    if (this.particles.length > config.maxParticles) {
      const excess = this.particles.length - config.maxParticles;
      this.particles.splice(0, excess);
    }
  }
  
  getParticleCount() {
    return this.particles.length;
  }

  render() {
    // Draw all particles
    for (let particle of this.particles) {
      particle.show();
    }
  }
}
