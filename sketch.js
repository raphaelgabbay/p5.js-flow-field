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

// Tool configuration
const tools = {
  currentTool: 'spawn', // 'spawn', 'attract'
  attractStrength: 5,
  attractRadius: 200
};

let world;
let gui;
let particleCountController;
let presetsFolder;
let presetLoadController;
let presetNameInput = { name: 'Preset 1' };
let toolSelectorController;

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
    presets[name] = {
      config: { ...config },
      graphics: { ...graphics },
      sizeNoise: { ...sizeNoise },
      settings: { ...settings },
      tools: { ...tools },
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
      if (preset.tools) {
        Object.keys(preset.tools).forEach(key => {
          if (tools.hasOwnProperty(key)) {
            tools[key] = preset.tools[key];
          }
        });
        // Update tool selector UI if it exists
        if (typeof window.updateToolSelectorUI === 'function') {
          window.updateToolSelectorUI();
        }
        if (toolSelectorController) {
          toolSelectorController.setValue(tools.currentTool);
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
  createCanvas(windowWidth, windowHeight);
  
  // Initialize world
  world = new World();
  
  // Minimal styling
  stroke(255);
  
  // Load presets from presets.json if it exists
  await PresetManager.loadPresetsFromFile();
  
  // Setup lil-gui
  gui = new lil.GUI();
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
  gui.add(config, 'noiseScale', -0.1, 20).name('Noise Scale');
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
  
  // Graphics folder
  const graphicsFolder = gui.addFolder('Graphics');
  graphicsFolder.add(graphics, 'particleSize', 0.5, 300).name('Particle Size');
  graphicsFolder.add(graphics, 'sizeModifierStrength', 1, 100).name('Size Modifier Strength');
  graphicsFolder.add({ capture: () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    saveCanvas(`particle-engine-${timestamp}`, 'png');
  }}, 'capture').name('Capture Frame');
  
  // Size Noise folder (separate from movement noise)
  const sizeNoiseFolder = gui.addFolder('Size Noise');
  sizeNoiseFolder.add(sizeNoise, 'noiseScale', 0, 5).name('Noise Scale');
  sizeNoiseFolder.add(sizeNoise, 'timeIncrement', -0.1, 10).name('Time Increment');
  sizeNoiseFolder.add(sizeNoise, 'timeOffset', -10, 10).name('Time Offset');
  
  // Tools folder
  const toolsFolder = gui.addFolder('Tools');
  
  // Create tool selector with icons
  const toolOptions = {
    'spawn': 'Spawn Particles',
    'attract': 'Attract/Repulse'
  };
  
  toolSelectorController = toolsFolder.add(tools, 'currentTool', Object.keys(toolOptions))
    .name('Tool')
    .onChange((value) => {
      updateToolSelectorUI();
    });
  
  // Add custom HTML for tool icons
  const toolSelectorElement = toolSelectorController.domElement;
  const toolSelectorContainer = document.createElement('div');
  toolSelectorContainer.style.display = 'flex';
  toolSelectorContainer.style.gap = '8px';
  toolSelectorContainer.style.marginTop = '8px';
  toolSelectorContainer.style.flexWrap = 'wrap';
  
  Object.keys(toolOptions).forEach(toolKey => {
    const toolButton = document.createElement('button');
    toolButton.style.cssText = `
      padding: 8px 12px;
      border: 2px solid #333;
      background: ${tools.currentTool === toolKey ? '#4a9eff' : '#222'};
      color: white;
      cursor: pointer;
      border-radius: 4px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    `;
    
    // Add icon (using Unicode symbols)
    const icon = document.createElement('span');
    icon.textContent = toolKey === 'spawn' ? '✨' : '🧲';
    icon.style.fontSize = '16px';
    
    const label = document.createElement('span');
    label.textContent = toolOptions[toolKey];
    
    toolButton.appendChild(icon);
    toolButton.appendChild(label);
    
    toolButton.addEventListener('click', () => {
      tools.currentTool = toolKey;
      toolSelectorController.setValue(toolKey);
      updateToolSelectorUI();
    });
    
    toolButton.dataset.tool = toolKey;
    toolSelectorContainer.appendChild(toolButton);
  });
  
  toolSelectorElement.appendChild(toolSelectorContainer);
  
  // Function to update tool selector UI
  window.updateToolSelectorUI = function() {
    const buttons = toolSelectorContainer.querySelectorAll('button');
    buttons.forEach(btn => {
      if (btn.dataset.tool === tools.currentTool) {
        btn.style.background = '#4a9eff';
        btn.style.borderColor = '#6bb0ff';
      } else {
        btn.style.background = '#222';
        btn.style.borderColor = '#333';
      }
    });
  };
  
  // Attract tool settings
  toolsFolder.add(tools, 'attractStrength', 0.1, 20).name('Attract Strength');
  toolsFolder.add(tools, 'attractRadius', 10, 500).name('Attract Radius');
  
  // Settings folder
  const settingsFolder = gui.addFolder('Settings');
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
  
  // Handle tool interactions
  if (tools.currentTool === 'spawn') {
    // Generate particles at mouse position when left mouse button is held
    if (mouseIsPressed && mouseButton === LEFT) {
      for (let i = 0; i < config.particlesPerFrame; i++) {
        world.addParticle(mouseX, mouseY);
      }
    }
  } else if (tools.currentTool === 'attract') {
    // Attract/repulse particles when mouse is pressed
    if (mouseIsPressed) {
      world.applyAttractRepulse(mouseX, mouseY, mouseButton === LEFT);
    }
  }
  
  // Update current particle count for display
  updateParticleCount();
  
  // Update and render world
  world.update();
  world.render();
  
  // Draw tool indicator
  if (tools.currentTool === 'attract' && mouseIsPressed) {
    push();
    noFill();
    stroke(255, 100);
    strokeWeight(2);
    const alpha = mouseButton === LEFT ? 100 : 200;
    stroke(100, 150, 255, alpha);
    circle(mouseX, mouseY, tools.attractRadius * 2);
    pop();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
