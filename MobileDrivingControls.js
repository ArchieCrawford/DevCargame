/**
 * Mobile Driving Controls - Touch-friendly vehicle controls
 */
export class MobileDrivingControls {
  constructor(inputManager) {
    this.inputManager = inputManager;
    this.isActive = false;

    // Track which keys we injected so we can safely clear them
    this.injectedKeys = new Set();
    this.keyboardDown = new Set();

    // Best-effort tracking of real keyboard state to avoid clearing physical keys
    this.onWindowKeyDown = (e) => {
      if (!e || !e.code) return;
      this.keyboardDown.add(e.code);
    };
    this.onWindowKeyUp = (e) => {
      if (!e || !e.code) return;
      this.keyboardDown.delete(e.code);
    };
    window.addEventListener('keydown', this.onWindowKeyDown, false);
    window.addEventListener('keyup', this.onWindowKeyUp, false);
    
    // Touch state
    this.touches = {
      steering: { active: false, startX: 0, currentX: 0 },
      gas: { active: false },
      brake: { active: false }
    };
    
    this.createControls();
    
    // Start hidden (show when entering vehicle)
    this.hide();
    
    console.log('📱 Mobile driving controls created');
  }

  setInjectedKey(code, isDown) {
    if (!this.inputManager || !this.inputManager.keys) return;
    if (!code) return;

    if (isDown) {
      this.inputManager.keys[code] = true;
      this.injectedKeys.add(code);
      return;
    }

    // Only clear if we were the one who set it and it's not physically held
    if (this.injectedKeys.has(code) && !this.keyboardDown.has(code)) {
      this.inputManager.keys[code] = false;
    }
    this.injectedKeys.delete(code);
  }

  resetInjectedKeys() {
    // Clear only what we injected (and only if keyboard isn't holding it)
    for (const code of Array.from(this.injectedKeys)) {
      this.setInjectedKey(code, false);
    }
  }
  
  createControls() {
    const isMobile = window.innerWidth <= 768;
    
    // Main container
    const container = document.createElement('div');
    container.id = 'mobileDrivingControls';
    container.style.cssText = `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 500;
    `;
    
    // Steering wheel/slider (bottom center)
    const steeringContainer = document.createElement('div');
    steeringContainer.id = 'steeringContainer';
    steeringContainer.style.cssText = `
      position: absolute;
      bottom: ${isMobile ? '20px' : '40px'};
      left: 50%;
      transform: translateX(-50%);
      width: ${isMobile ? '200px' : '250px'};
      height: ${isMobile ? '60px' : '70px'};
      background: rgba(255, 255, 255, 0.08);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 35px;
      pointer-events: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    `;
    
    // Steering indicator
    const steeringIndicator = document.createElement('div');
    steeringIndicator.id = 'steeringIndicator';
    steeringIndicator.style.cssText = `
      position: absolute;
      width: ${isMobile ? '50px' : '60px'};
      height: ${isMobile ? '50px' : '60px'};
      background: linear-gradient(135deg, #00ff88, #00ccff);
      border-radius: 50%;
      transition: left 0.1s ease;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${isMobile ? '20px' : '24px'};
      box-shadow: 0 4px 15px rgba(0, 255, 136, 0.4);
    `;
    steeringIndicator.innerHTML = '🎮';
    
    // Steering labels
    const leftLabel = document.createElement('div');
    leftLabel.style.cssText = `
      position: absolute;
      left: 15px;
      color: rgba(255, 255, 255, 0.5);
      font-size: ${isMobile ? '18px' : '20px'};
      pointer-events: none;
    `;
    leftLabel.innerHTML = '←';
    
    const rightLabel = document.createElement('div');
    rightLabel.style.cssText = `
      position: absolute;
      right: 15px;
      color: rgba(255, 255, 255, 0.5);
      font-size: ${isMobile ? '18px' : '20px'};
      pointer-events: none;
    `;
    rightLabel.innerHTML = '→';
    
    steeringContainer.appendChild(leftLabel);
    steeringContainer.appendChild(rightLabel);
    steeringContainer.appendChild(steeringIndicator);
    
    // Gas pedal (bottom right)
    const gasButton = document.createElement('button');
    gasButton.id = 'gasPedal';
    gasButton.style.cssText = `
      position: absolute;
      bottom: ${isMobile ? '100px' : '120px'};
      right: ${isMobile ? '20px' : '40px'};
      width: ${isMobile ? '70px' : '80px'};
      height: ${isMobile ? '70px' : '80px'};
      background: rgba(0, 255, 136, 0.3);
      border: 3px solid rgba(0, 255, 136, 0.6);
      border-radius: 50%;
      color: white;
      font-size: ${isMobile ? '28px' : '32px'};
      font-weight: 700;
      cursor: pointer;
      pointer-events: auto;
      transition: all 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
    `;
    gasButton.innerHTML = '⬆️';
    
    // Brake pedal (bottom right, below gas)
    const brakeButton = document.createElement('button');
    brakeButton.id = 'brakePedal';
    brakeButton.style.cssText = `
      position: absolute;
      bottom: ${isMobile ? '20px' : '30px'};
      right: ${isMobile ? '20px' : '40px'};
      width: ${isMobile ? '70px' : '80px'};
      height: ${isMobile ? '70px' : '80px'};
      background: rgba(255, 107, 107, 0.3);
      border: 3px solid rgba(255, 107, 107, 0.6);
      border-radius: 50%;
      color: white;
      font-size: ${isMobile ? '28px' : '32px'};
      font-weight: 700;
      cursor: pointer;
      pointer-events: auto;
      transition: all 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(255, 107, 107, 0.3);
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
    `;
    brakeButton.innerHTML = '⬇️';
    
    // Steering left button (left side)
    const leftButton = document.createElement('button');
    leftButton.id = 'steerLeftButton';
    leftButton.style.cssText = `
      position: absolute;
      bottom: ${isMobile ? '60px' : '75px'};
      left: ${isMobile ? '20px' : '40px'};
      width: ${isMobile ? '70px' : '80px'};
      height: ${isMobile ? '70px' : '80px'};
      background: rgba(0, 204, 255, 0.3);
      border: 3px solid rgba(0, 204, 255, 0.6);
      border-radius: 50%;
      color: white;
      font-size: ${isMobile ? '32px' : '36px'};
      font-weight: 700;
      cursor: pointer;
      pointer-events: auto;
      transition: all 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0, 204, 255, 0.3);
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
    `;
    leftButton.innerHTML = '←';
    
    // Steering right button (left side, next to left button)
    const rightButton = document.createElement('button');
    rightButton.id = 'steerRightButton';
    rightButton.style.cssText = `
      position: absolute;
      bottom: ${isMobile ? '60px' : '75px'};
      left: ${isMobile ? '100px' : '130px'};
      width: ${isMobile ? '70px' : '80px'};
      height: ${isMobile ? '70px' : '80px'};
      background: rgba(0, 204, 255, 0.3);
      border: 3px solid rgba(0, 204, 255, 0.6);
      border-radius: 50%;
      color: white;
      font-size: ${isMobile ? '32px' : '36px'};
      font-weight: 700;
      cursor: pointer;
      pointer-events: auto;
      transition: all 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 20px rgba(0, 204, 255, 0.3);
      user-select: none;
      -webkit-user-select: none;
      -webkit-tap-highlight-color: transparent;
    `;
    rightButton.innerHTML = '→';
    
    // Add controls hint
    const hint = document.createElement('div');
    hint.style.cssText = `
      position: absolute;
      top: ${isMobile ? '60px' : '80px'};
      left: 50%;
      transform: translateX(-50%);
      color: rgba(255, 255, 255, 0.6);
      font-size: ${isMobile ? '11px' : '13px'};
      text-align: center;
      background: rgba(0, 0, 0, 0.5);
      padding: 6px 12px;
      border-radius: 12px;
      pointer-events: none;
    `;
    hint.textContent = 'Touch controls: ⬆️ Gas • ⬇️ Brake • ←→ Steer';
    
    // Append all elements
    container.appendChild(steeringContainer);
    container.appendChild(gasButton);
    container.appendChild(brakeButton);
    container.appendChild(leftButton);
    container.appendChild(rightButton);
    container.appendChild(hint);
    document.body.appendChild(container);
    
    // Store references
    this.container = container;
    this.steeringContainer = steeringContainer;
    this.steeringIndicator = steeringIndicator;
    this.gasButton = gasButton;
    this.brakeButton = brakeButton;
    this.leftButton = leftButton;
    this.rightButton = rightButton;
    
    // Setup event listeners
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Gas button
    this.gasButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touches.gas.active = true;
      this.gasButton.style.background = 'rgba(0, 255, 136, 0.6)';
      this.gasButton.style.transform = 'scale(0.95)';
    });
    
    this.gasButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touches.gas.active = false;
      this.gasButton.style.background = 'rgba(0, 255, 136, 0.3)';
      this.gasButton.style.transform = 'scale(1)';
      this.setInjectedKey('ArrowUp', false);
    });
    
    // Also support mouse for testing
    this.gasButton.addEventListener('mousedown', (e) => {
      this.touches.gas.active = true;
      this.gasButton.style.background = 'rgba(0, 255, 136, 0.6)';
      this.gasButton.style.transform = 'scale(0.95)';
    });
    
    this.gasButton.addEventListener('mouseup', (e) => {
      this.touches.gas.active = false;
      this.gasButton.style.background = 'rgba(0, 255, 136, 0.3)';
      this.gasButton.style.transform = 'scale(1)';
      this.setInjectedKey('ArrowUp', false);
    });
    
    // Brake button
    this.brakeButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touches.brake.active = true;
      this.brakeButton.style.background = 'rgba(255, 107, 107, 0.6)';
      this.brakeButton.style.transform = 'scale(0.95)';
    });
    
    this.brakeButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touches.brake.active = false;
      this.brakeButton.style.background = 'rgba(255, 107, 107, 0.3)';
      this.brakeButton.style.transform = 'scale(1)';
      this.setInjectedKey('ArrowDown', false);
    });
    
    this.brakeButton.addEventListener('mousedown', (e) => {
      this.touches.brake.active = true;
      this.brakeButton.style.background = 'rgba(255, 107, 107, 0.6)';
      this.brakeButton.style.transform = 'scale(0.95)';
    });
    
    this.brakeButton.addEventListener('mouseup', (e) => {
      this.touches.brake.active = false;
      this.brakeButton.style.background = 'rgba(255, 107, 107, 0.3)';
      this.brakeButton.style.transform = 'scale(1)';
      this.setInjectedKey('ArrowDown', false);
    });
    
    // Left steering button
    this.leftButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touches.steering.active = true;
      this.touches.steering.currentX = -1; // Full left
      this.leftButton.style.background = 'rgba(0, 204, 255, 0.6)';
      this.leftButton.style.transform = 'scale(0.95)';
      this.updateSteeringIndicator();
    });
    
    this.leftButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touches.steering.active = false;
      this.touches.steering.currentX = 0;
      this.leftButton.style.background = 'rgba(0, 204, 255, 0.3)';
      this.leftButton.style.transform = 'scale(1)';
      this.updateSteeringIndicator();
      this.setInjectedKey('ArrowLeft', false);
    });
    
    this.leftButton.addEventListener('mousedown', (e) => {
      this.touches.steering.active = true;
      this.touches.steering.currentX = -1;
      this.leftButton.style.background = 'rgba(0, 204, 255, 0.6)';
      this.leftButton.style.transform = 'scale(0.95)';
      this.updateSteeringIndicator();
    });
    
    this.leftButton.addEventListener('mouseup', (e) => {
      this.touches.steering.active = false;
      this.touches.steering.currentX = 0;
      this.leftButton.style.background = 'rgba(0, 204, 255, 0.3)';
      this.leftButton.style.transform = 'scale(1)';
      this.updateSteeringIndicator();
      this.setInjectedKey('ArrowLeft', false);
    });
    
    // Right steering button
    this.rightButton.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.touches.steering.active = true;
      this.touches.steering.currentX = 1; // Full right
      this.rightButton.style.background = 'rgba(0, 204, 255, 0.6)';
      this.rightButton.style.transform = 'scale(0.95)';
      this.updateSteeringIndicator();
    });
    
    this.rightButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touches.steering.active = false;
      this.touches.steering.currentX = 0;
      this.rightButton.style.background = 'rgba(0, 204, 255, 0.3)';
      this.rightButton.style.transform = 'scale(1)';
      this.updateSteeringIndicator();
      this.setInjectedKey('ArrowRight', false);
    });
    
    this.rightButton.addEventListener('mousedown', (e) => {
      this.touches.steering.active = true;
      this.touches.steering.currentX = 1;
      this.rightButton.style.background = 'rgba(0, 204, 255, 0.6)';
      this.rightButton.style.transform = 'scale(0.95)';
      this.updateSteeringIndicator();
    });
    
    this.rightButton.addEventListener('mouseup', (e) => {
      this.touches.steering.active = false;
      this.touches.steering.currentX = 0;
      this.rightButton.style.background = 'rgba(0, 204, 255, 0.3)';
      this.rightButton.style.transform = 'scale(1)';
      this.updateSteeringIndicator();
      this.setInjectedKey('ArrowRight', false);
    });
    
    // Steering slider (drag)
    this.steeringContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.steeringContainer.getBoundingClientRect();
      this.touches.steering.active = true;
      this.touches.steering.startX = rect.left + rect.width / 2;
      this.updateSteering(touch.clientX);
    });
    
    this.steeringContainer.addEventListener('touchmove', (e) => {
      if (!this.touches.steering.active) return;
      e.preventDefault();
      const touch = e.touches[0];
      this.updateSteering(touch.clientX);
    });
    
    this.steeringContainer.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.touches.steering.active = false;
      this.touches.steering.currentX = 0;
      this.updateSteeringIndicator();

      this.setInjectedKey('ArrowLeft', false);
      this.setInjectedKey('ArrowRight', false);
    });
  }
  
  updateSteering(clientX) {
    const rect = this.steeringContainer.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const maxDistance = rect.width / 2 - 30; // Leave some margin
    
    const deltaX = clientX - centerX;
    const clampedDelta = Math.max(-maxDistance, Math.min(maxDistance, deltaX));
    
    // Normalize to -1 to 1
    this.touches.steering.currentX = clampedDelta / maxDistance;
    
    this.updateSteeringIndicator();
  }
  
  updateSteeringIndicator() {
    const rect = this.steeringContainer.getBoundingClientRect();
    const maxOffset = rect.width / 2 - 30;
    const offset = this.touches.steering.currentX * maxOffset;
    
    // Center is 50%, add offset
    const leftPercent = 50 + (offset / rect.width * 100);
    this.steeringIndicator.style.left = leftPercent + '%';
    
    // Rotate indicator for visual feedback
    const rotation = this.touches.steering.currentX * 30; // Max 30 degrees
    this.steeringIndicator.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
  }
  
  update() {
    if (!this.isActive) return;
    
    // Update input manager with touch state
    if (this.touches.gas.active) {
      this.setInjectedKey('ArrowUp', true);
    } else {
      this.setInjectedKey('ArrowUp', false);
    }
    
    if (this.touches.brake.active) {
      this.setInjectedKey('ArrowDown', true);
    } else {
      this.setInjectedKey('ArrowDown', false);
    }
    
    // Steering
    if (Math.abs(this.touches.steering.currentX) > 0.1) {
      if (this.touches.steering.currentX < 0) {
        this.setInjectedKey('ArrowLeft', true);
        this.setInjectedKey('ArrowRight', false);
      } else {
        this.setInjectedKey('ArrowRight', true);
        this.setInjectedKey('ArrowLeft', false);
      }
    } else {
      this.setInjectedKey('ArrowLeft', false);
      this.setInjectedKey('ArrowRight', false);
    }
  }
  
  show() {
    this.isActive = true;
    this.container.style.display = 'block';
  }
  
  hide() {
    this.isActive = false;
    this.container.style.display = 'none';
    
    // Reset all touch states
    this.touches.gas.active = false;
    this.touches.brake.active = false;
    this.touches.steering.active = false;
    this.touches.steering.currentX = 0;
    this.resetInjectedKeys();
    this.updateSteeringIndicator();
  }
  
  destroy() {
    this.hide();

    window.removeEventListener('keydown', this.onWindowKeyDown, false);
    window.removeEventListener('keyup', this.onWindowKeyUp, false);

    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
