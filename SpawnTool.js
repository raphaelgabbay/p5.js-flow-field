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
  }

  onMousePressed(world, mouse) {
    if (mouse.button === LEFT) {
      this.spawnParticles(world, mouse.x, mouse.y);
    }
  }

  onMouseDragged(world, mouse) {
    if (mouse.button === LEFT) {
      this.spawnParticles(world, mouse.x, mouse.y);
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

