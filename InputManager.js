export class InputManager {
  constructor() {
    // Raw key states (matches what Cybertruck expects)
    this.keys = {};
    
    this.isDriveMode = false;
    
    this.setupEventListeners();
    
    console.log('✅ InputManager initialized');
  }
  
  setupEventListeners() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e), false);
    window.addEventListener('keyup', (e) => this.onKeyUp(e), false);
    
    // Prevent default scrolling on arrow keys
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    }, false);
  }
  
  onKeyDown(e) {
    // Store raw key state
    this.keys[e.code] = true;
    
    // Debug log when in drive mode
    if (this.isDriveMode) {
      console.log('🎮 Key DOWN:', e.code, '| Keys:', this.keys);
    }
  }
  
  onKeyUp(e) {
    // Clear key state
    this.keys[e.code] = false;
  }
  
  // Convert raw keys to truck input format
  getTruckInput() {
    const input = {
      isDriveMode: this.isDriveMode,
      forward: !!(this.keys['KeyW'] || this.keys['ArrowUp']),
      backward: !!(this.keys['KeyS'] || this.keys['ArrowDown']),
      left: !!(this.keys['KeyA'] || this.keys['ArrowLeft']),
      right: !!(this.keys['KeyD'] || this.keys['ArrowRight']),
      brake: !!(this.keys['Space'] || this.keys['ShiftLeft'] || this.keys['ShiftRight']),
      ascend: !!this.keys['Space'],
      descend: !!(this.keys['ShiftLeft'] || this.keys['ShiftRight']),
      hydraulics: !!this.keys['KeyL']
    };
    
    // Debug log when any input is active
    if (this.isDriveMode && (input.forward || input.backward || input.left || input.right)) {
      console.log('🚗 Truck Input:', input);
    }
    
    return input;
  }
  
  // Legacy getInput for compatibility
  getInput() {
    return this.getTruckInput();
  }
  
  setDriveMode(isDrive) {
    this.isDriveMode = isDrive;
    console.log('🔄 Drive mode:', isDrive ? '✅ ENABLED' : '❌ DISABLED');
    
    if (isDrive) {
      console.log('💡 Controls: W/↑=Forward, S/↓=Reverse, A/←=Left, D/→=Right, SPACE=Brake');
    }
  }
}
