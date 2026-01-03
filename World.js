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
  
  applyAttractRepulse(x, y, isAttract) {
    // Apply attract or repulse force to particles within radius
    const mousePos = createVector(x, y);
    const radius = tools.attractRadius;
    const strength = tools.attractStrength;
    
    for (let particle of this.particles) {
      const distance = p5.Vector.dist(mousePos, particle.position);
      
      if (distance < radius && distance > 0) {
        // Calculate force direction
        const force = p5.Vector.sub(mousePos, particle.position);
        force.normalize();
        
        // Apply strength based on distance (stronger when closer)
        const distanceFactor = 1 - (distance / radius);
        const forceMagnitude = strength * distanceFactor;
        
        // Reverse direction for repulse
        if (!isAttract) {
          force.mult(-1);
        }
        
        force.mult(forceMagnitude);
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
