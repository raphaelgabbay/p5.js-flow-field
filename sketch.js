// Configuration object (controllable via lil-gui)
const config = {
  particleCount: 1000,
  maxParticles: 5000,
  maxSpeed: 2,
  noiseScale: 0.01,
  forceStrength: 0.1,
  timeIncrement: 0.01,
  noiseSpeed: 1, // Multiplier for noise evolution speed (can be negative to reverse)
  particlesPerFrame: 5,
  currentParticleCount: 0 // Display only - updated in draw()
};

// Graphics configuration object
const graphics = {
  particleSize: 1,
  sizeModifierStrength: 0.5
};

// Size noise configuration (separate from movement noise)
const sizeNoise = {
  noiseScale: 0.01,
  timeIncrement: 0.01,
  timeOffset: 0 // Can be negative for offsetting backwards in time
};

// Settings configuration
const settings = {
  guiOpacity: 0.8
};

let world;
let gui;
let particleCountController;
let presetsFolder;
let presetLoadController;
let presetNameInput = { name: 'Preset 1' };
let toolManager;
let uiManager;
let canvasElement = null;
let usePointerRouter = false;
let pointerIsDown = false;
let activePointerId = null;

function getCanvasCoordsFromPointerEvent(e) {
  if (!canvasElement || !e) {
    return { x: mouseX, y: mouseY };
  }
  const rect = canvasElement.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (width / rect.width);
  const y = (e.clientY - rect.top) * (height / rect.height);
  return { x: x, y: y };
}

function isEventFromUI(e) {
  const t = e && e.target ? e.target : null;
  if (!t) return false;
  const tag = (t.tagName || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'BUTTON' || tag === 'TEXTAREA' || tag === 'SELECT' || tag === 'OPTION' || tag === 'LABEL') {
    return true;
  }
  // Walk up DOM tree to see if inside UI containers
  let el = t;
  while (el) {
    if (el.id === 'tool-dock' || el.id === 'parameters-panel') return true;
    // lil-gui root uses class "lil-gui"
    if (el.classList && el.classList.contains('lil-gui')) return true;
    el = el.parentElement;
  }
  return false;
}

function isEventOnCanvas(e) {
  if (!canvasElement) return true;
  const t = e && e.target ? e.target : null;
  if (!t) return true;
  return t === canvasElement;
}

// Preset management
const PresetManager = {
  getStorageKey: () => 'p5_particle_engine_presets',
  
  getAllPresets: () => {
    try {
      const stored = localStorage.getItem(PresetManager.getStorageKey());
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error loading presets:', e);
      return {};
    }
  },
  
  savePreset: (name) => {
    const presets = PresetManager.getAllPresets();
    
    // Save tool parameters from ToolManager
    const toolParams = {};
    if (toolManager) {
      const activeTool = toolManager.getActive();
      if (activeTool && activeTool.params) {
        Object.keys(activeTool.params).forEach(paramName => {
          toolParams[paramName] = activeTool.getParam(paramName);
        });
      }
      toolParams.currentTool = toolManager.getActiveId();
    }
    
    presets[name] = {
      config: { ...config },
      graphics: { ...graphics },
      sizeNoise: { ...sizeNoise },
      settings: { ...settings },
      tools: toolParams,
      timestamp: new Date().toISOString()
    };
    // Remove currentParticleCount from saved config
    delete presets[name].config.currentParticleCount;
    
    try {
      localStorage.setItem(PresetManager.getStorageKey(), JSON.stringify(presets));
      PresetManager.updatePresetList();
      return true;
    } catch (e) {
      console.error('Error saving preset:', e);
      return false;
    }
  },
  
  loadPreset: (name) => {
    const presets = PresetManager.getAllPresets();
    if (presets[name]) {
      const preset = presets[name];
      
      // Load config (excluding currentParticleCount)
      Object.keys(preset.config).forEach(key => {
        if (key !== 'currentParticleCount' && config.hasOwnProperty(key)) {
          config[key] = preset.config[key];
        }
      });
      
      // Load graphics
      Object.keys(preset.graphics).forEach(key => {
        if (graphics.hasOwnProperty(key)) {
          graphics[key] = preset.graphics[key];
        }
      });
      
      // Load sizeNoise
      Object.keys(preset.sizeNoise).forEach(key => {
        if (sizeNoise.hasOwnProperty(key)) {
          sizeNoise[key] = preset.sizeNoise[key];
        }
      });
      
      // Load settings (if present)
      if (preset.settings) {
        Object.keys(preset.settings).forEach(key => {
          if (settings.hasOwnProperty(key)) {
            settings[key] = preset.settings[key];
          }
        });
        // Apply GUI opacity
        if (gui && gui.domElement) {
          gui.domElement.style.opacity = settings.guiOpacity;
        }
      }
      
      // Load tools (if present)
      if (preset.tools && toolManager) {
        // Set active tool
        if (preset.tools.currentTool) {
          toolManager.setActive(preset.tools.currentTool);
        }
        
        // Load tool parameters
        const activeTool = toolManager.getActive();
        if (activeTool && activeTool.params) {
          Object.keys(preset.tools).forEach(key => {
            if (key !== 'currentTool' && activeTool.params[key]) {
              activeTool.setParam(key, preset.tools[key]);
              // Update GUI controller if it exists
              const controllers = toolManager.paramControllers.get(activeTool.id);
              if (controllers && controllers.has(key)) {
                controllers.get(key).setValue(preset.tools[key]);
              }
            }
          });
        }
      }
      
      // Update all GUI controllers
      gui.controllersRecursive().forEach(controller => {
        if (controller.property && controller.object) {
          controller.updateDisplay();
        }
      });
      
      // Update flow field
      if (world && world.flowField) {
        world.flowField.noiseScale = config.noiseScale;
        world.flowField.forceStrength = config.forceStrength;
        world.flowField.timeIncrement = config.timeIncrement;
        world.flowField.noiseSpeed = config.noiseSpeed;
        world.flowField.sizeNoiseScale = sizeNoise.noiseScale;
        world.flowField.sizeTimeIncrement = sizeNoise.timeIncrement;
        world.flowField.sizeTimeOffset = sizeNoise.timeOffset;
      }
      
      // Recreate world if particle count changed
      if (preset.config.particleCount !== undefined) {
        world = new World();
        updateParticleCount();
      }
      
      return true;
    }
    return false;
  },
  
  deletePreset: (name) => {
    const presets = PresetManager.getAllPresets();
    delete presets[name];
    try {
      localStorage.setItem(PresetManager.getStorageKey(), JSON.stringify(presets));
      PresetManager.updatePresetList();
      return true;
    } catch (e) {
      console.error('Error deleting preset:', e);
      return false;
    }
  },
  
  getPresetNames: () => {
    return Object.keys(PresetManager.getAllPresets());
  },
  
  updatePresetList: () => {
    if (presetLoadController) {
      const names = PresetManager.getPresetNames();
      const options = names.length > 0 ? names : ['No presets saved'];
      presetLoadController.options(options);
      if (names.length > 0) {
        presetLoadController.setValue(names[0]);
      }
    }
  },
  
  exportAsJSON: () => {
    const presets = PresetManager.getAllPresets();
    const dataStr = JSON.stringify(presets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `particle-engine-presets-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
  
  importFromJSON: (jsonData) => {
    try {
      let importedPresets = {};
      
      // Check if it's a single preset or a collection
      if (jsonData.config && jsonData.graphics) {
        // Single preset format - need to generate a name
        const timestamp = new Date().toISOString();
        const presetName = jsonData.name || `Imported-${timestamp.split('T')[0]}`;
        importedPresets[presetName] = jsonData;
      } else {
        // Collection format - object with preset names as keys
        importedPresets = jsonData;
      }
      
      // Merge with existing presets (imported presets will overwrite if names match)
      const existingPresets = PresetManager.getAllPresets();
      const mergedPresets = { ...existingPresets, ...importedPresets };
      
      // Save merged presets
      localStorage.setItem(PresetManager.getStorageKey(), JSON.stringify(mergedPresets));
      PresetManager.updatePresetList();
      
      const count = Object.keys(importedPresets).length;
      console.log(`Successfully imported ${count} preset(s)`);
      return { success: true, count: count };
    } catch (e) {
      console.error('Error importing presets:', e);
      alert('Error importing presets: ' + e.message);
      return { success: false, error: e.message };
    }
  },
  
  handleFileImport: (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        const result = PresetManager.importFromJSON(jsonData);
        if (result.success) {
          alert(`Successfully imported ${result.count} preset(s)!`);
        }
      } catch (e) {
        alert('Error parsing JSON file: ' + e.message);
      }
    };
    reader.onerror = () => {
      alert('Error reading file');
    };
    reader.readAsText(file);
  },
  
  loadPresetsFromFile: async () => {
    try {
      const response = await fetch('presets.json');
      if (!response.ok) {
        // File doesn't exist or can't be read - this is fine, just return
        console.log('presets.json not found - skipping auto-load');
        return { success: false, error: 'File not found' };
      }
      const jsonData = await response.json();
      const result = PresetManager.importFromJSON(jsonData);
      if (result.success) {
        console.log(`Auto-loaded ${result.count} preset(s) from presets.json`);
      }
      return result;
    } catch (e) {
      // Silently fail if file doesn't exist or can't be loaded
      console.log('Could not load presets.json:', e.message);
      return { success: false, error: e.message };
    }
  }
};

async function setup() {
  // Create fullscreen canvas
  const canvas = createCanvas(windowWidth, windowHeight);
  canvasElement = canvas && canvas.elt ? canvas.elt : null;
  if (canvasElement) {
    // Prefer pointer events router when available (more reliable on mobile overlays)
    usePointerRouter = typeof window !== 'undefined' && typeof window.PointerEvent !== 'undefined';

    // Prevent long-press callout/selection/gestures on mobile
    canvasElement.style.userSelect = 'none';
    canvasElement.style.webkitUserSelect = 'none';
    canvasElement.style.webkitTouchCallout = 'none';
    canvasElement.style.webkitUserDrag = 'none';
    canvasElement.style.touchAction = 'none';

    canvasElement.addEventListener('contextmenu', (e) => e.preventDefault());
    canvasElement.addEventListener('selectstart', (e) => e.preventDefault());
    canvasElement.addEventListener('dragstart', (e) => e.preventDefault());

    // Hide parameters panel when tapping on the canvas (not when using sliders)
    const hideParams = (e) => {
      if (window.__uiInteractionActive) return;
      if (e && isEventFromUI(e)) return;
      if (window.parametersPanel) window.parametersPanel.hide();
    };

    // Route pointer input directly to the ToolManager (avoid p5 DOM overlay quirks on mobile)
    if (usePointerRouter) {
      const onPointerDown = (e) => {
        if (window.__uiInteractionActive) return;
        hideParams(e);
        pointerIsDown = true;
        activePointerId = e.pointerId;
        try {
          canvasElement.setPointerCapture(e.pointerId);
        } catch (err) {
          // Ignore (some browsers may throw)
        }
        const pos = getCanvasCoordsFromPointerEvent(e);
        if (toolManager) {
          toolManager.handleMousePressed(world, { x: pos.x, y: pos.y, button: LEFT });
        }
        e.preventDefault();
      };
      const onPointerMove = (e) => {
        if (!pointerIsDown) return;
        if (activePointerId !== null && e.pointerId !== activePointerId) return;
        const pos = getCanvasCoordsFromPointerEvent(e);
        if (toolManager) {
          toolManager.handleMouseDragged(world, { x: pos.x, y: pos.y, button: LEFT });
        }
        e.preventDefault();
      };
      const onPointerUp = (e) => {
        if (!pointerIsDown) return;
        if (activePointerId !== null && e.pointerId !== activePointerId) return;
        pointerIsDown = false;
        activePointerId = null;
        const pos = getCanvasCoordsFromPointerEvent(e);
        if (toolManager) {
          toolManager.handleMouseReleased(world, { x: pos.x, y: pos.y, button: LEFT });
        }
        e.preventDefault();
      };

      canvasElement.addEventListener('pointerdown', onPointerDown, { passive: false });
      canvasElement.addEventListener('pointermove', onPointerMove, { passive: false });
      canvasElement.addEventListener('pointerup', onPointerUp, { passive: false });
      canvasElement.addEventListener('pointercancel', onPointerUp, { passive: false });
    } else {
      canvasElement.addEventListener('pointerdown', hideParams, true);
      canvasElement.addEventListener('mousedown', hideParams, true);
      canvasElement.addEventListener('touchstart', hideParams, { capture: true, passive: true });
    }

    // Prevent scroll/zoom gestures starting on the canvas
    canvasElement.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    canvasElement.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    canvasElement.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
  }
  
  // Set background color to black
  background(0);
  
  // Initialize world
  world = new World();
  
  // Minimal styling
  stroke(255);
  
  // Load presets from presets.json if it exists
  await PresetManager.loadPresetsFromFile();
  
  // Setup lil-gui
  gui = new lil.GUI();
  // Store reference to GUI for Dock toggle (set early so it's always available)
  window.particleEngineGUI = gui;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sketch.js:318',message:'GUI stored in window.particleEngineGUI (early)',data:{guiExists:gui !== null && gui !== undefined,hasDomElement:gui && gui.domElement !== null && gui.domElement !== undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const initialParticlesController = gui.add(config, 'particleCount', 0, 10000).name('Initial Particles');
  initialParticlesController.onFinishChange(() => {
    // Recreate world when Initial Particles slider is released
    world = new World();
    updateParticleCount();
  });
  const maxParticlesController = gui.add(config, 'maxParticles', 100, 20000).name('Max Particles');
  maxParticlesController.onFinishChange(() => {
    // Trim particles if current count exceeds new max
    if (world && world.particles.length > config.maxParticles) {
      const excess = world.particles.length - config.maxParticles;
      world.particles.splice(0, excess);
      updateParticleCount();
    }
  });
  gui.add(config, 'maxSpeed', 0.1, 15).name('Max Speed');
  gui.add(config, 'noiseScale', -0.1, 1).name('Noise Scale');
  gui.add(config, 'forceStrength', -1, 100).name('Force Strength');
  gui.add(config, 'timeIncrement', -0.1, 0.1).name('Time Increment');
  gui.add(config, 'noiseSpeed', -5, 5).name('Noise Speed');
  gui.add(config, 'particlesPerFrame', 1, 50).name('Particles Per Frame');
  
  // Add read-only particle count display
  particleCountController = gui.add(config, 'currentParticleCount')
    .name('Current Particles')
    .listen(); // Auto-update every frame
  particleCountController.domElement.querySelector('input').disabled = true;
  
  // Initialize particle count
  updateParticleCount();
  
  // Graphics folder (closed by default)
  const graphicsFolder = gui.addFolder('Graphics');
  graphicsFolder.close(); // Close by default
  graphicsFolder.add(graphics, 'particleSize', 0.5, 30).name('Particle Size');
  graphicsFolder.add(graphics, 'sizeModifierStrength', 1, 100).name('Size Modifier Strength');
  graphicsFolder.add({ capture: () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    saveCanvas(`particle-engine-${timestamp}`, 'png');
  }}, 'capture').name('Capture Frame');
  
  // Size Noise folder (closed by default)
  const sizeNoiseFolder = gui.addFolder('Size Noise');
  sizeNoiseFolder.close(); // Close by default
  sizeNoiseFolder.add(sizeNoise, 'noiseScale', 0, 5).name('Noise Scale');
  sizeNoiseFolder.add(sizeNoise, 'timeIncrement', -0.1, 10).name('Time Increment');
  sizeNoiseFolder.add(sizeNoise, 'timeOffset', -10, 10).name('Time Offset');
  
  // Initialize ToolManager
  toolManager = new ToolManager();
  
  // Register tools
  toolManager.register(new SpawnTool());
  toolManager.register(new AttractRepulseTool());
  
  // Set default active tool
  toolManager.setActive('spawn');
  
  // Initialize Dock UI
  uiManager = new UIManager(toolManager);
  uiManager.init();
  
  // Setup GUI for tools (creates Tool Parameters folder directly)
  toolManager.setupGUI(gui);
  
  // Settings folder (closed by default)
  const settingsFolder = gui.addFolder('Settings');
  settingsFolder.close(); // Close by default
  settingsFolder.add(settings, 'guiOpacity', 0.1, 1).name('GUI Opacity')
    .onChange((value) => {
      if (gui && gui.domElement) {
        gui.domElement.style.opacity = value;
      }
    });
  // Apply initial opacity
  if (gui && gui.domElement) {
    gui.domElement.style.opacity = settings.guiOpacity;
  }
  
  // Presets folder (closed by default)
  presetsFolder = gui.addFolder('Presets');
  presetsFolder.close(); // Close by default
  presetsFolder.add(presetNameInput, 'name').name('Preset Name');
  presetsFolder.add({ save: () => {
    const name = presetNameInput.name || 'Unnamed Preset';
    if (PresetManager.savePreset(name)) {
      console.log(`Preset "${name}" saved`);
    }
  }}, 'save').name('Save Preset');
  
  const presetNames = PresetManager.getPresetNames();
  const presetOptions = presetNames.length > 0 ? presetNames : ['No presets saved'];
  presetLoadController = presetsFolder.add({ preset: presetOptions[0] }, 'preset', presetOptions)
    .name('Load Preset')
    .onChange((value) => {
      if (value !== 'No presets saved') {
        PresetManager.loadPreset(value);
      }
    });
  
  presetsFolder.add({ deleteCurrent: () => {
    const currentPreset = presetLoadController.getValue();
    if (currentPreset && currentPreset !== 'No presets saved') {
      if (confirm(`Delete preset "${currentPreset}"?`)) {
        PresetManager.deletePreset(currentPreset);
      }
    }
  }}, 'deleteCurrent').name('Delete Current');
  
  presetsFolder.add({ exportJSON: () => PresetManager.exportAsJSON() }, 'exportJSON').name('Download All Presets');
  
  // File input for importing presets
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      PresetManager.handleFileImport(e.target.files[0]);
      // Reset input so same file can be selected again
      fileInput.value = '';
    }
  });
  document.body.appendChild(fileInput);
  
  presetsFolder.add({ importJSON: () => {
    fileInput.click();
  }}, 'importJSON').name('Import Presets (JSON)');
  
  // Initialize preset list
  PresetManager.updatePresetList();

  // Always default to the Spawn/Add tool on page load
  // (some GUI init flows can change active tool indirectly)
  if (toolManager) {
    toolManager.setActive('spawn');
  }
  
  // Hide GUI by default
  if (gui && gui.domElement) {
    gui.domElement.style.display = 'none';
  }
  
  // Update flow field when relevant parameters change
  gui.onChange(() => {
    if (world && world.flowField) {
      world.flowField.noiseScale = config.noiseScale;
      world.flowField.forceStrength = config.forceStrength;
      world.flowField.timeIncrement = config.timeIncrement;
      world.flowField.noiseSpeed = config.noiseSpeed;
      // Update size noise parameters
      world.flowField.sizeNoiseScale = sizeNoise.noiseScale;
      world.flowField.sizeTimeIncrement = sizeNoise.timeIncrement;
      world.flowField.sizeTimeOffset = sizeNoise.timeOffset;
    }
  });
}

// Helper function to update particle count display
function updateParticleCount() {
  if (world) {
    config.currentParticleCount = world.particles.length;
    if (particleCountController) {
      particleCountController.updateDisplay();
    }
  }
}

function draw() {
  background(0,20);
  
  // Update current particle count for display
  updateParticleCount();
  
  // Update and render world
  world.update();
  world.render();
  
  // Update and render active tool
  if (toolManager) {
    toolManager.update(world);
    toolManager.render();
  }
}

function mousePressed() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sketch.js:495',message:'p5 mousePressed called',data:{mouseX:mouseX,mouseY:mouseY,button:mouseButton},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  if (usePointerRouter) return;
  // If the press started on UI overlays (sliders/buttons), ignore it
  if (window.__uiInteractionActive) return;
  
  if (toolManager) {
    toolManager.handleMousePressed(world, {
      x: mouseX,
      y: mouseY,
      button: mouseButton
    });
  }
}

function mouseDragged() {
  if (usePointerRouter) return;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sketch.js:505',message:'p5 mouseDragged called',data:{mouseX:mouseX,mouseY:mouseY,button:mouseButton},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  if (window.__uiInteractionActive) return;
  if (toolManager) {
    toolManager.handleMouseDragged(world, {
      x: mouseX,
      y: mouseY,
      button: mouseButton
    });
  }
}

function mouseReleased() {
  if (usePointerRouter) return;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/527a21af-eea1-4d95-9dc3-a47f1486fd47',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'sketch.js:515',message:'p5 mouseReleased called',data:{mouseX:mouseX,mouseY:mouseY,button:mouseButton},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  if (window.__uiInteractionActive) return;
  if (toolManager) {
    toolManager.handleMouseReleased(world, {
      x: mouseX,
      y: mouseY,
      button: mouseButton
    });
  }
}

// Explicit touch forwarding so tools work on first touch (mobile)
function touchStarted() {
  if (usePointerRouter) return false;
  if (window.__uiInteractionActive) return false;
  if (toolManager) {
    const t = typeof touches !== 'undefined' && touches && touches.length > 0 ? touches[0] : null;
    const x = t && typeof t.x === 'number' ? t.x : mouseX;
    const y = t && typeof t.y === 'number' ? t.y : mouseY;
    toolManager.handleMousePressed(world, {
      x: x,
      y: y,
      button: LEFT
    });
  }
  return false;
}

function touchMoved() {
  if (usePointerRouter) return false;
  if (window.__uiInteractionActive) return false;
  if (toolManager) {
    const t = typeof touches !== 'undefined' && touches && touches.length > 0 ? touches[0] : null;
    const x = t && typeof t.x === 'number' ? t.x : mouseX;
    const y = t && typeof t.y === 'number' ? t.y : mouseY;
    toolManager.handleMouseDragged(world, {
      x: x,
      y: y,
      button: LEFT
    });
  }
  return false;
}

function touchEnded() {
  if (usePointerRouter) return false;
  if (window.__uiInteractionActive) return false;
  if (toolManager) {
    const t = typeof touches !== 'undefined' && touches && touches.length > 0 ? touches[0] : null;
    const x = t && typeof t.x === 'number' ? t.x : mouseX;
    const y = t && typeof t.y === 'number' ? t.y : mouseY;
    toolManager.handleMouseReleased(world, {
      x: x,
      y: y,
      button: LEFT
    });
  }
  return false;
}

function keyPressed() {
  if (toolManager) {
    toolManager.handleKeyPressed(key);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
