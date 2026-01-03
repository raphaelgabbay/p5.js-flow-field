class FlowField {
  constructor() {
    this.noiseScale = config.noiseScale;
    this.forceStrength = config.forceStrength;
    this.time = 0;
    this.timeIncrement = config.timeIncrement;
  }

  getForceAt(x, y) {
    // Sample Perlin noise at position and time
    const angle = noise(
      x * this.noiseScale,
      y * this.noiseScale,
      this.time
    ) * TWO_PI;
    
    // Create force vector from angle
    const force = p5.Vector.fromAngle(angle);
    force.mult(this.forceStrength);
    
    return force;
  }

  update() {
    // Evolve time for animation
    this.time += this.timeIncrement;
  }
}
