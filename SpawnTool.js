/**
 * SpawnTool - Spawns particles at mouse position when mouse is pressed/dragged.
 */
class SpawnTool extends Tool {
  constructor() {
    super('spawn', 'Spawn Particles', 'plus');
    
    // Define tool parameters
    this.params = {
      particlesPerFrame: {
        value: 5,
        min: 1,
        max: 50,
        label: 'Particles Per Frame'
      }
    };

    // Track press state so "press and hold" works without dragging (mobile-friendly)
    this.isSpawning = false;
    this.lastX = 0;
    this.lastY = 0;
  }

  onMousePressed(world, mouse) {
    if (mouse.button === LEFT) {
      this.isSpawning = true;
      this.lastX = mouse.x;
      this.lastY = mouse.y;
      this.spawnParticles(world, mouse.x, mouse.y);
    }
  }

  onMouseDragged(world, mouse) {
    if (mouse.button === LEFT) {
      this.lastX = mouse.x;
      this.lastY = mouse.y;
      this.spawnParticles(world, mouse.x, mouse.y);
    }
  }

  onMouseReleased(world, mouse) {
    this.isSpawning = false;
  }

  update(world) {
    // While pressed, keep spawning even if finger/mouse doesn't move
    if (this.isSpawning) {
      this.spawnParticles(world, this.lastX, this.lastY);
    }
  }

  /**
   * Spawn particles at the specified position.
   * @param {World} world - The particle world instance
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  spawnParticles(world, x, y) {
    const count = this.getParam('particlesPerFrame');
    for (let i = 0; i < count; i++) {
      world.addParticle(x, y);
    }
  }
}

