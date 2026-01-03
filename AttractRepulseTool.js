/**
 * AttractRepulseTool - Attracts or repulses particles based on mouse position.
 * Left mouse button attracts, right mouse button repulses.
 */
class AttractRepulseTool extends Tool {
  constructor() {
    super('attract', 'Attract/Repulse', 'move');
    
    // Define tool parameters
    this.params = {
      strength: {
        value: 5,
        min: 0.1,
        max: 20,
        label: 'Strength'
      },
      radius: {
        value: 200,
        min: 10,
        max: 500,
        label: 'Radius'
      }
    };

    // Track mouse state for rendering
    this.mouseX = 0;
    this.mouseY = 0;
    this.mousePressed = false;
    this.mouseButton = null;
  }

  onMousePressed(world, mouse) {
    this.mouseX = mouse.x;
    this.mouseY = mouse.y;
    this.mousePressed = true;
    this.mouseButton = mouse.button;
    this.applyForce(world, mouse.x, mouse.y, mouse.button === LEFT);
  }

  onMouseDragged(world, mouse) {
    this.mouseX = mouse.x;
    this.mouseY = mouse.y;
    this.applyForce(world, mouse.x, mouse.y, mouse.button === LEFT);
  }

  onMouseReleased(world, mouse) {
    this.mousePressed = false;
    this.mouseButton = null;
  }

  /**
   * Apply attract or repulse force to particles.
   * @param {World} world - The particle world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {boolean} isAttract - True for attract, false for repulse
   */
  applyForce(world, x, y, isAttract) {
    const radius = this.getParam('radius');
    const strength = this.getParam('strength');
    const maxForce = strength * 2; // Cap maximum force to prevent explosion

    // Use World's generic force application method
    world.applyForceToParticles(
      createVector(x, y),
      (particle, position) => {
        const distance = p5.Vector.dist(position, particle.position);
        
        // Only apply force within radius and avoid division by zero
        if (distance >= radius || distance < 0.1) {
          return createVector(0, 0);
        }

        // Calculate force direction (normalized)
        const force = p5.Vector.sub(position, particle.position);
        force.normalize();

        // Apply smooth distance-based falloff (linear falloff)
        const distanceFactor = 1 - (distance / radius);
        
        // Calculate force magnitude with capping
        let forceMagnitude = strength * distanceFactor;
        forceMagnitude = Math.min(forceMagnitude, maxForce);
        
        // Reverse direction for repulse
        if (!isAttract) {
          force.mult(-1);
        }
        
        force.mult(forceMagnitude);
        
        // Safety check for NaN or invalid values
        if (isNaN(force.x) || isNaN(force.y) || !isFinite(force.x) || !isFinite(force.y)) {
          return createVector(0, 0);
        }
        
        return force;
      }
    );
  }

  /**
   * Render visual indicator for the tool.
   */
  render() {
    if (this.mousePressed) {
      push();
      noFill();
      strokeWeight(2);
      
      const radius = this.getParam('radius');
      const alpha = this.mouseButton === LEFT ? 100 : 200;
      stroke(100, 150, 255, alpha);
      
      circle(this.mouseX, this.mouseY, radius * 2);
      pop();
    }
  }
}

