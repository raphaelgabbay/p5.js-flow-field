class FlowField {
  constructor() {
    this.noiseScale = config.noiseScale;
    this.forceStrength = config.forceStrength;
    this.time = 0;
    this.timeIncrement = config.timeIncrement;
    this.noiseSpeed = config.noiseSpeed;
    
    // Separate parameters for size noise
    this.sizeNoiseScale = sizeNoise.noiseScale;
    this.sizeTime = 0;
    this.sizeTimeIncrement = sizeNoise.timeIncrement;
    this.sizeTimeOffset = sizeNoise.timeOffset;
  }

  getForceAt(x, y) {
    // Sample Perlin noise at position and time
    // Use absolute value of noiseScale for sampling, but preserve sign for pattern inversion
    const absScale = Math.abs(this.noiseScale);
    const sign = this.noiseScale >= 0 ? 1 : -1;
    const angle = noise(
      x * absScale * sign,
      y * absScale * sign,
      this.time
    ) * TWO_PI;
    
    // Create force vector from angle
    const force = p5.Vector.fromAngle(angle);
    force.mult(this.forceStrength);
    
    return force;
  }

  getForceAndSizeModifierAt(x, y) {
    // Get force from movement noise (3D: x, y, time)
    // Use absolute value of noiseScale for sampling, but preserve sign for pattern inversion
    const absScale = Math.abs(this.noiseScale);
    const sign = this.noiseScale >= 0 ? 1 : -1;
    const noiseX = x * absScale * sign;
    const noiseY = y * absScale * sign;
    const noiseZ = this.time;
    
    // Get angle from movement noise
    const angle = noise(noiseX, noiseY, noiseZ) * TWO_PI;
    
    // Get size modifier from separate size noise (using different scale and time)
    const absSizeScale = Math.abs(this.sizeNoiseScale);
    const sizeSign = this.sizeNoiseScale >= 0 ? 1 : -1;
    const sizeNoiseX = x * absSizeScale * sizeSign;
    const sizeNoiseY = y * absSizeScale * sizeSign;
    const sizeNoiseZ = this.sizeTime + this.sizeTimeOffset;
    
    // Get size modifier from size noise (normalized to 0-1 range)
    const sizeModifier = noise(sizeNoiseX, sizeNoiseY, sizeNoiseZ);
    
    // Create force vector from angle
    const force = p5.Vector.fromAngle(angle);
    force.mult(this.forceStrength);
    
    return { force: force, sizeModifier: sizeModifier };
  }

  update() {
    // Evolve time for movement noise animation (multiplied by noise speed)
    this.time += this.timeIncrement * this.noiseSpeed;
    
    // Evolve time for size noise animation (separate timeline)
    this.sizeTime += this.sizeTimeIncrement;
  }
}
