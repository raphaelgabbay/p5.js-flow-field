/**
 * Dock Component - macOS-inspired tool selector
 * Uses lit-html for rendering, fully decoupled from simulation logic
 */

class Dock {
  constructor(toolManager) {
    this.toolManager = toolManager;
    this.container = null;
    this.visible = true;
    this.activeToolId = null;
    
    // Bind methods
    this.handleToolClick = this.handleToolClick.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.update = this.update.bind(this);
    
    // Setup keyboard listeners
    this.setupKeyboardListeners();
  }

  /**
   * Initialize the dock in the DOM
   */
  init() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'tool-dock';
    document.body.appendChild(this.container);
    
    // Initial render
    this.render();
    
    // Start update loop to sync with ToolManager
    this.update();
  }

  /**
   * Setup keyboard event listeners
   */
  setupKeyboardListeners() {
    document.addEventListener('keydown', (e) => {
      // Don't interfere if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Handle Escape key to hide parameters panel
      if (e.key === 'Escape') {
        if (window.parametersPanel) {
          window.parametersPanel.hide();
        }
        return;
      }
      
      this.handleKeyPress(e);
    });
  }

  /**
   * Handle keyboard shortcuts
   */
  handleKeyPress(e) {
    // Toggle dock visibility with 'H'
    if (e.key.toLowerCase() === 'h') {
      this.toggleVisibility();
      return;
    }
    
    // Number keys 1-9 select tools
    const keyNum = parseInt(e.key);
    if (keyNum >= 1 && keyNum <= 9) {
      const tools = this.toolManager.getAllTools();
      const toolIndex = keyNum - 1;
      if (toolIndex < tools.length) {
        const toolId = tools[toolIndex].id;
        const currentActiveId = this.toolManager.getActiveId();
        
        // If pressing the same tool, toggle the parameters panel
        if (toolId === currentActiveId) {
          if (window.parametersPanel) {
            window.parametersPanel.toggle();
          }
        } else {
          // Switch to new tool and show panel
          this.toolManager.setActive(toolId);
          this.update();
          if (window.parametersPanel) {
            window.parametersPanel.show();
          }
        }
      }
    }
  }

  /**
   * Handle tool icon click
   */
  handleToolClick(toolId) {
    const currentActiveId = this.toolManager.getActiveId();
    
    // If clicking the same tool, toggle the parameters panel
    if (toolId === currentActiveId) {
      // Toggle parameters panel visibility
      if (window.parametersPanel) {
        window.parametersPanel.toggle();
      }
      return;
    }
    
    // Otherwise, switch to the new tool
    this.toolManager.setActive(toolId);
    this.update();
    
    // Show parameters panel for new tool
    if (window.parametersPanel) {
      window.parametersPanel.show();
    }
  }

  /**
   * Toggle dock visibility
   */
  toggleVisibility() {
    this.visible = !this.visible;
    this.render();
  }

  /**
   * Update dock state (sync with ToolManager)
   */
  update() {
    const currentActiveId = this.toolManager.getActiveId();
    if (currentActiveId !== this.activeToolId) {
      this.activeToolId = currentActiveId;
      this.render();
    }
  }

  /**
   * Toggle GUI visibility
   */
  toggleGUI() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dock.js:143',message:'toggleGUI called',data:{hasWindowGUI:typeof window.particleEngineGUI !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const gui = window.particleEngineGUI;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dock.js:145',message:'gui variable after assignment',data:{guiExists:gui !== null && gui !== undefined,guiType:typeof gui,hasDomElement:gui && gui.domElement !== null && gui.domElement !== undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (gui && gui.domElement) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dock.js:147',message:'before toggle display',data:{currentDisplay:gui.domElement.style.display,computedDisplay:window.getComputedStyle(gui.domElement).display},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const isHidden = gui.domElement.style.display === 'none';
      gui.domElement.style.display = isHidden ? 'block' : 'none';
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dock.js:149',message:'after toggle display',data:{newDisplay:gui.domElement.style.display,computedDisplay:window.getComputedStyle(gui.domElement).display,isHidden:isHidden},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dock.js:151',message:'gui or domElement is null/undefined',data:{guiExists:gui !== null && gui !== undefined,domElementExists:gui && gui.domElement !== null && gui.domElement !== undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
    }
  }

  /**
   * Render the dock using lit-html
   */
  render() {
    if (!this.container) return;
    
    const tools = this.toolManager.getAllTools();
    const activeId = this.toolManager.getActiveId();
    
    // Apply visibility class to container
    if (this.visible) {
      this.container.classList.remove('hidden');
    } else {
      this.container.classList.add('hidden');
    }
    
    // Use lit-html if available, otherwise fallback to vanilla DOM
    if (typeof html !== 'undefined' && typeof render !== 'undefined') {
      const dockTemplate = html`
        <div class="dock-container">
          ${tools.map((tool, index) => html`
            <button
              class="dock-item ${tool.id === activeId ? 'active' : ''}"
              @click=${() => this.handleToolClick(tool.id)}
              title="${tool.label} (${index + 1})"
              data-tool-id="${tool.id}"
            >
              <i data-feather="${tool.icon}"></i>
            </button>
          `)}
          <button
            class="dock-item dock-settings"
            @click=${() => {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dock.js:183',message:'settings button click event fired (lit-html)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
              // #endregion
              this.toggleGUI();
            }}
            title="Settings"
          >
            <i data-feather="settings"></i>
          </button>
        </div>
      `;
      
      render(dockTemplate, this.container);
    } else {
      // Fallback to vanilla DOM manipulation
      this.renderVanilla(tools, activeId);
    }
    
    // Replace Feather icons after render
    if (typeof feather !== 'undefined') {
      feather.replace();
    }
  }

  /**
   * Vanilla DOM rendering fallback
   */
  renderVanilla(tools, activeId) {
    this.container.innerHTML = '';
    
    const dockContainer = document.createElement('div');
    dockContainer.className = 'dock-container';
    
    tools.forEach((tool, index) => {
      const button = document.createElement('button');
      button.className = `dock-item ${tool.id === activeId ? 'active' : ''}`;
      button.title = `${tool.label} (${index + 1})`;
      button.setAttribute('data-tool-id', tool.id);
      button.addEventListener('click', () => this.handleToolClick(tool.id));
      
      const icon = document.createElement('i');
      icon.setAttribute('data-feather', tool.icon);
      button.appendChild(icon);
      
      dockContainer.appendChild(button);
    });
    
    // Add settings button
    const settingsButton = document.createElement('button');
    settingsButton.className = 'dock-item dock-settings';
    settingsButton.title = 'Settings';
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dock.js:230',message:'attaching click handler to settings button',data:{buttonExists:settingsButton !== null,thisBound:this !== null && this !== undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    settingsButton.addEventListener('click', () => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dock.js:232',message:'settings button click event fired',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      this.toggleGUI();
    });
    
    const settingsIcon = document.createElement('i');
    settingsIcon.setAttribute('data-feather', 'settings');
    settingsButton.appendChild(settingsIcon);
    
    dockContainer.appendChild(settingsButton);
    this.container.appendChild(dockContainer);
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}

// Export for global use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dock;
}

