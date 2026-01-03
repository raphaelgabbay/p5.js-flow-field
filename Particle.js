class Particle {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.sizeModifier = 1; // Default size modifier
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update() {
    // Euler integration
    this.velocity.add(this.acceleration);
    this.velocity.limit(config.maxSpeed);
    this.position.add(this.velocity);
    
    // Reset acceleration
    this.acceleration.mult(0);
  }

  edges() {
    // Wrap around screen edges
    if (this.position.x < 0) {
      this.position.x = width;
    } else if (this.position.x > width) {
      this.position.x = 0;
    }
    
    if (this.position.y < 0) {
      this.position.y = height;
    } else if (this.position.y > height) {
      this.position.y = 0;
    }
  }

  show() {
    // Minimal rendering: point with configurable size and noise-based modifier
    const baseSize = graphics.particleSize;
    const modifiedSize = baseSize * (1 + (this.sizeModifier - 0.5) * graphics.sizeModifierStrength);
    strokeWeight(modifiedSize);
    point(this.position.x, this.position.y);
  }
}
