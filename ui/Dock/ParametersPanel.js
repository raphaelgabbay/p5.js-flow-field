/**
 * ParametersPanel Component - Floating panel for tool parameters
 * Uses lit-html for rendering, dynamically generates controls from tool.params
 */

class ParametersPanel {
  constructor(toolManager) {
    this.toolManager = toolManager;
    this.container = null;
    this.activeTool = null;
    this.visible = false;
  }

  /**
   * Initialize the panel in the DOM
   */
  init() {
    // Create container
    this.container = document.createElement('div');
    this.container.id = 'parameters-panel';
    document.body.appendChild(this.container);

    // Mark UI interactions so p5 doesn't treat them as canvas presses
    // (p5 mousePressed can still fire when interacting with DOM overlays on mobile)
    window.__uiInteractionActive = false;
    const activate = (e) => {
      window.__uiInteractionActive = true;
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    };
    const deactivate = () => {
      window.__uiInteractionActive = false;
    };
    this.container.addEventListener('pointerdown', activate, true);
    this.container.addEventListener('mousedown', activate, true);
    this.container.addEventListener('touchstart', activate, { capture: true, passive: true });
    document.addEventListener('pointerup', deactivate, true);
    document.addEventListener('mouseup', deactivate, true);
    document.addEventListener('touchend', deactivate, true);
    document.addEventListener('touchcancel', deactivate, true);
    
    // Start hidden
    this.visible = false;
    this.container.style.display = 'none';
    
    // Initial render
    this.update();
  }

  /**
   * Show the panel
   */
  show() {
    this.visible = true;
    this.render();
  }

  /**
   * Hide the panel
   */
  hide() {
    this.visible = false;
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  /**
   * Toggle panel visibility
   */
  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Update panel to reflect active tool
   */
  update() {
    if (!this.container) return;
    
    const activeTool = this.toolManager.getActive();
    
    // Only update if tool changed
    if (activeTool === this.activeTool) {
      return;
    }
    
    this.activeTool = activeTool;
    // Show panel when tool changes
    if (activeTool) {
      this.visible = true;
    }
    this.render();
  }

  /**
   * Handle parameter change
   */
  handleParamChange(tool, paramName, value) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParametersPanel.js:46',message:'handleParamChange called',data:{paramName:paramName,value:value,willRender:false},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    tool.setParam(paramName, value);
    // Don't re-render here - it breaks slider dragging by recreating the element
    // The value display is updated inline in the event handlers
  }

  /**
   * Render the parameters panel using lit-html
   */
  render() {
    if (!this.container) return;
    
    // Hide panel if not visible
    if (!this.visible) {
      this.container.style.display = 'none';
      return;
    }
    
    const activeTool = this.toolManager.getActive();
    
    // Don't show panel if no tool is active or tool has no parameters
    if (!activeTool || !activeTool.params || Object.keys(activeTool.params).length === 0) {
      this.container.innerHTML = '';
      this.container.style.display = 'none';
      return;
    }
    
    // Show the container
    this.container.style.display = 'block';
    
    // Use lit-html if available, otherwise fallback to vanilla DOM
    if (typeof html !== 'undefined' && typeof render !== 'undefined') {
      this.renderLitHtml(activeTool);
    } else {
      this.renderVanilla(activeTool);
    }
  }

  /**
   * Render using lit-html
   */
  renderLitHtml(activeTool) {
    const params = activeTool.params;
    const paramEntries = Object.entries(params);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParametersPanel.js:77',message:'renderLitHtml called',data:{toolId:activeTool.id,paramCount:paramEntries.length,hasHtml:typeof html !== 'undefined',hasRender:typeof render !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    const panelTemplate = html`
      <div class="panel-container">
        <div class="panel-header">
          <span class="panel-title">${activeTool.label}</span>
        </div>
        <div class="panel-content">
          ${paramEntries.map(([paramName, paramDef]) => html`
            <div class="param-control">
              <label class="param-label" for="param-${activeTool.id}-${paramName}">
                ${paramDef.label || paramName}
              </label>
              <div class="param-input-group">
                <input
                  type="range"
                  id="param-${activeTool.id}-${paramName}"
                  class="param-slider"
                  min="${paramDef.min}"
                  max="${paramDef.max}"
                  step="${paramDef.step || (paramDef.max - paramDef.min) / 100}"
                  .value="${paramDef.value}"
                  @mousedown=${(e) => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParametersPanel.js:101',message:'slider mousedown',data:{paramName:paramName,targetId:e.target.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                    // #endregion
                    e.stopPropagation();
                  }}
                  @mousemove=${(e) => {
                    // #region agent log
                    if (e.buttons === 1) {
                      fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParametersPanel.js:108',message:'slider mousemove during drag',data:{paramName:paramName,buttons:e.buttons},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                    }
                    // #endregion
                    if (e.buttons === 1) {
                      e.stopPropagation();
                    }
                  }}
                  @mouseup=${(e) => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParametersPanel.js:117',message:'slider mouseup',data:{paramName:paramName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                    // #endregion
                    e.stopPropagation();
                  }}
                  @input=${(e) => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParametersPanel.js:123',message:'slider input event',data:{paramName:paramName,value:parseFloat(e.target.value),eventType:e.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                    // #endregion
                    const value = parseFloat(e.target.value);
                    paramDef.value = value;
                    this.handleParamChange(activeTool, paramName, value);
                    // Update number display
                    const numberDisplay = e.target.nextElementSibling;
                    if (numberDisplay) {
                      numberDisplay.textContent = value.toFixed(2);
                    }
                  }}
                  @change=${(e) => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParametersPanel.js:135',message:'slider change event',data:{paramName:paramName,value:parseFloat(e.target.value)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                    // #endregion
                  }}
                />
                <span class="param-value">${paramDef.value.toFixed(2)}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
    
    render(panelTemplate, this.container);
  }

  /**
   * Vanilla DOM rendering fallback
   */
  renderVanilla(activeTool) {
    this.container.innerHTML = '';
    
    const panelContainer = document.createElement('div');
    panelContainer.className = 'panel-container';
    
    // Header
    const header = document.createElement('div');
    header.className = 'panel-header';
    const title = document.createElement('span');
    title.className = 'panel-title';
    title.textContent = activeTool.label;
    header.appendChild(title);
    panelContainer.appendChild(header);
    
    // Content
    const content = document.createElement('div');
    content.className = 'panel-content';
    
    const params = activeTool.params;
    Object.entries(params).forEach(([paramName, paramDef]) => {
      const control = document.createElement('div');
      control.className = 'param-control';
      
      const label = document.createElement('label');
      label.className = 'param-label';
      label.setAttribute('for', `param-${activeTool.id}-${paramName}`);
      label.textContent = paramDef.label || paramName;
      control.appendChild(label);
      
      const inputGroup = document.createElement('div');
      inputGroup.className = 'param-input-group';
      
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.id = `param-${activeTool.id}-${paramName}`;
      slider.className = 'param-slider';
      slider.min = paramDef.min;
      slider.max = paramDef.max;
      slider.step = paramDef.step || (paramDef.max - paramDef.min) / 100;
      slider.value = paramDef.value;
      
      const valueDisplay = document.createElement('span');
      valueDisplay.className = 'param-value';
      valueDisplay.textContent = paramDef.value.toFixed(2);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParametersPanel.js:172',message:'vanilla slider created',data:{paramName:paramName,hasListeners:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      slider.addEventListener('mousedown', (e) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParametersPanel.js:177',message:'vanilla slider mousedown',data:{paramName:paramName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        e.stopPropagation();
      });
      
      slider.addEventListener('mousemove', (e) => {
        // #region agent log
        if (e.buttons === 1) {
          fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParametersPanel.js:185',message:'vanilla slider mousemove during drag',data:{paramName:paramName,buttons:e.buttons},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        }
        // #endregion
        if (e.buttons === 1) {
          e.stopPropagation();
        }
      });
      
      slider.addEventListener('mouseup', (e) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParametersPanel.js:194',message:'vanilla slider mouseup',data:{paramName:paramName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        e.stopPropagation();
      });
      
      slider.addEventListener('input', (e) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ParametersPanel.js:200',message:'vanilla slider input event',data:{paramName:paramName,value:parseFloat(e.target.value),eventType:e.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        const value = parseFloat(e.target.value);
        paramDef.value = value;
        this.handleParamChange(activeTool, paramName, value);
        valueDisplay.textContent = value.toFixed(2);
      });
      
      inputGroup.appendChild(slider);
      inputGroup.appendChild(valueDisplay);
      control.appendChild(inputGroup);
      content.appendChild(control);
    });
    
    panelContainer.appendChild(content);
    this.container.appendChild(panelContainer);
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
  module.exports = ParametersPanel;
}

