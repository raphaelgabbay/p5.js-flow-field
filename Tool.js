/**
 * Base Tool class defining the interface for all tools.
 * Tools are modular, self-contained components that interact with the particle world.
 */
class Tool {
  constructor(id, label, icon) {
    this.id = id;
    this.label = label;
    this.icon = icon;
    this.params = {};
    this.active = false;
  }

  /**
   * Called when this tool becomes active.
   * Override to perform initialization or setup.
   */
  onSelect() {
    this.active = true;
  }

  /**
   * Called when this tool is deactivated.
   * Override to perform cleanup.
   */
  onDeselect() {
    this.active = false;
  }

  /**
   * Handle mouse press event.
   * @param {World} world - The particle world instance
   * @param {Object} mouse - Mouse state {x, y, button}
   */
  onMousePressed(world, mouse) {
    // Override in subclasses
  }

  /**
   * Handle mouse drag event.
   * @param {World} world - The particle world instance
   * @param {Object} mouse - Mouse state {x, y, button}
   */
  onMouseDragged(world, mouse) {
    // Override in subclasses
  }

  /**
   * Handle mouse release event.
   * @param {World} world - The particle world instance
   * @param {Object} mouse - Mouse state {x, y, button}
   */
  onMouseReleased(world, mouse) {
    // Override in subclasses
  }

  /**
   * Handle key press event (optional).
   * @param {string|number} key - The pressed key
   */
  onKeyPressed(key) {
    // Override in subclasses
  }

  /**
   * Update method called every frame when tool is active.
   * @param {World} world - The particle world instance
   */
  update(world) {
    // Override in subclasses
  }

  /**
   * Render method for tool visual indicators.
   * Called every frame when tool is active.
   */
  render() {
    // Override in subclasses
  }

  /**
   * Get parameter value by name.
   * @param {string} name - Parameter name
   * @returns {*} Parameter value
   */
  getParam(name) {
    if (this.params[name]) {
      return this.params[name].value;
    }
    return undefined;
  }

  /**
   * Set parameter value by name.
   * @param {string} name - Parameter name
   * @param {*} value - Parameter value
   */
  setParam(name, value) {
    if (this.params[name]) {
      this.params[name].value = value;
    }
  }
}

