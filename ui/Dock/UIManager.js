/**
 * UIManager - Coordinates Dock and ParametersPanel
 * Provides a single entry point for UI initialization
 */

class UIManager {
  constructor(toolManager) {
    this.toolManager = toolManager;
    this.dock = null;
    this.parametersPanel = null;
    this.updateInterval = null;
  }

  /**
   * Initialize all UI components
   */
  init() {
    // Initialize Dock
    this.dock = new Dock(this.toolManager);
    this.dock.init();

    // Initialize Parameters Panel
    this.parametersPanel = new ParametersPanel(this.toolManager);
    this.parametersPanel.init();
    
    // Expose parameters panel globally for Dock access
    window.parametersPanel = this.parametersPanel;

    // Start update loop to keep UI in sync
    this.startUpdateLoop();
  }

  /**
   * Start the update loop to sync UI with ToolManager state
   */
  startUpdateLoop() {
    // Update at ~30fps to keep UI responsive without being too heavy
    this.updateInterval = setInterval(() => {
      if (this.dock) {
        this.dock.update();
      }
      if (this.parametersPanel) {
        this.parametersPanel.update();
      }
    }, 33); // ~30fps
  }

  /**
   * Stop the update loop
   */
  stopUpdateLoop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Cleanup all UI components
   */
  destroy() {
    this.stopUpdateLoop();
    
    if (this.dock) {
      this.dock.destroy();
      this.dock = null;
    }
    
    if (this.parametersPanel) {
      this.parametersPanel.destroy();
      this.parametersPanel = null;
    }
  }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
}

