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
      // Get force and size modifier from 4D flow field at particle position
      const result = this.flowField.getForceAndSizeModifierAt(
        particle.position.x,
        particle.position.y
      );
      
      // Apply force to particle
      particle.applyForce(result.force);
      
      // Update size modifier from 4D noise
      particle.sizeModifier = result.sizeModifier;
      
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
  
  /**
   * Generic method for tools to apply forces to particles.
   * @param {p5.Vector} position - The position from which to apply forces
   * @param {Function} forceFunction - Function that calculates force for each particle
   *                                   Signature: (particle, position) => p5.Vector
   */
  applyForceToParticles(position, forceFunction) {
    for (let particle of this.particles) {
      const force = forceFunction(particle, position);
      if (force && (force.x !== 0 || force.y !== 0)) {
        particle.applyForce(force);
      }
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
