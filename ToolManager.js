/**
 * ToolManager handles tool registration, switching, and event forwarding.
 * Manages GUI integration for tool parameters.
 */
class ToolManager {
  constructor() {
    this.tools = new Map(); // id -> Tool instance
    this.activeToolId = null;
    this.activeTool = null;
    this.paramControllers = new Map(); // toolId -> Map of paramName -> controller
  }

  /**
   * Register a tool with the manager.
   * @param {Tool} tool - Tool instance to register
   */
  register(tool) {
    if (!tool.id || !tool.label || !tool.icon) {
      console.error('Tool must have id, label, and icon properties');
      return;
    }
    this.tools.set(tool.id, tool);
  }

  /**
   * Set the active tool by ID.
   * @param {string} toolId - ID of tool to activate
   */
  setActive(toolId) {
    if (!this.tools.has(toolId)) {
      console.error(`Tool "${toolId}" not found`);
      return;
    }

    // Deselect current tool
    if (this.activeTool) {
      this.activeTool.onDeselect();
    }

    // Select new tool
    this.activeToolId = toolId;
    this.activeTool = this.tools.get(toolId);
    this.activeTool.onSelect();

    // Update GUI
    this.updateGUIParameters();
  }

  /**
   * Get the currently active tool.
   * @returns {Tool|null} Active tool or null
   */
  getActive() {
    return this.activeTool;
  }

  /**
   * Get active tool ID.
   * @returns {string|null} Active tool ID or null
   */
  getActiveId() {
    return this.activeToolId;
  }

  /**
   * Get all registered tools.
   * @returns {Array<Tool>} Array of all registered tools
   */
  getAllTools() {
    return Array.from(this.tools.values());
  }

  /**
   * Update active tool (called every frame).
   * @param {World} world - The particle world instance
   */
  update(world) {
    if (this.activeTool) {
      this.activeTool.update(world);
    }
  }

  /**
   * Handle mouse press event.
   * @param {World} world - The particle world instance
   * @param {Object} mouse - Mouse state {x, y, button}
   */
  handleMousePressed(world, mouse) {
    if (this.activeTool) {
      this.activeTool.onMousePressed(world, mouse);
    }
  }

  /**
   * Handle mouse drag event.
   * @param {World} world - The particle world instance
   * @param {Object} mouse - Mouse state {x, y, button}
   */
  handleMouseDragged(world, mouse) {
    if (this.activeTool) {
      this.activeTool.onMouseDragged(world, mouse);
    }
  }

  /**
   * Handle mouse release event.
   * @param {World} world - The particle world instance
   * @param {Object} mouse - Mouse state {x, y, button}
   */
  handleMouseReleased(world, mouse) {
    if (this.activeTool) {
      this.activeTool.onMouseReleased(world, mouse);
    }
  }

  /**
   * Handle key press event.
   * @param {string|number} key - The pressed key
   */
  handleKeyPressed(key) {
    if (this.activeTool) {
      this.activeTool.onKeyPressed(key);
    }
  }

  /**
   * Render active tool visual indicators.
   */
  render() {
    if (this.activeTool) {
      this.activeTool.render();
    }
  }

  /**
   * Setup GUI integration for tool parameters.
   * @param {lil.GUI} gui - The lil-gui instance
   */
  setupGUI(gui) {
    // Create Tool Parameters folder directly on the GUI
    this.paramFolder = gui.addFolder('Tool Parameters');
    // Keep Tool Parameters folder open by default (don't call close())
    this.updateGUIParameters();
  }

  /**
   * Update GUI parameters to show/hide based on active tool.
   */
  updateGUIParameters() {
    if (!this.paramFolder) return;

    // Remove all existing controllers from the folder
    // First, remove controllers we've stored
    this.paramControllers.forEach((toolControllers) => {
      toolControllers.forEach((controller) => {
        if (controller && typeof controller.remove === 'function') {
          controller.remove();
        }
      });
    });
    
    // Clear all stored controllers
    this.paramControllers.clear();
    
    // Also remove any remaining controllers directly from the folder
    // Use controllersRecursive() to get all controllers in the folder
    if (this.paramFolder && typeof this.paramFolder.controllersRecursive === 'function') {
      const controllers = this.paramFolder.controllersRecursive();
      controllers.forEach(controller => {
        if (controller && typeof controller.remove === 'function') {
          controller.remove();
        }
      });
    }

    // Add controllers for active tool
    if (this.activeTool && this.activeTool.params) {
      const toolControllers = new Map();
      const paramObj = {};

      Object.keys(this.activeTool.params).forEach(paramName => {
        const paramDef = this.activeTool.params[paramName];
        paramObj[paramName] = paramDef.value;

        const controller = this.paramFolder.add(paramObj, paramName, paramDef.min, paramDef.max)
          .name(paramDef.label || paramName)
          .onChange((value) => {
            this.activeTool.setParam(paramName, value);
          });

        toolControllers.set(paramName, controller);
      });

      this.paramControllers.set(this.activeToolId, toolControllers);
    }
  }
}

