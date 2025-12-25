/**
 * Mobile Controls - Handles all mobile-specific input and UI
 * Works by simulating keyboard/mouse events to integrate with existing desktop controls
 */

/**
 * Utility functions for mobile detection and UI management
 */
const MobileUtils = {
  isMobile() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },

  createMobileUI() {
    // Create container for all mobile controls
    const container = document.createElement('div');
    container.id = 'mobile-game-controls';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      font-family: Arial, sans-serif;
    `;

    // Virtual Joystick
    const joystickContainer = document.createElement('div');
    joystickContainer.id = 'virtual-joystick';
    joystickContainer.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 20px;
      width: 120px;
      height: 120px;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      pointer-events: auto;
      touch-action: none;
    `;

    const joystickKnob = document.createElement('div');
    joystickKnob.id = 'virtual-joystick-knob';
    joystickKnob.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      transition: all 0.1s ease;
    `;

    joystickContainer.appendChild(joystickKnob);

    // Jump Button
    const jumpButton = document.createElement('div');
    jumpButton.id = 'jump-button';
    jumpButton.style.cssText = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      width: 80px;
      height: 80px;
      background: rgba(255, 255, 255, 0.2);
      border: 2px solid rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: bold;
      pointer-events: auto;
      touch-action: none;
      user-select: none;
    `;
    jumpButton.textContent = 'JUMP';

    container.appendChild(joystickContainer);
    container.appendChild(jumpButton);

    return { container, joystickContainer, joystickKnob, jumpButton };
  },

  removeMobileUI() {
    const existing = document.getElementById('mobile-game-controls');
    if (existing) {
      existing.remove();
    }
  }
};

/**
 * VirtualJoystick - Handles virtual joystick input for mobile
 */
class VirtualJoystick {
  constructor(container, knob, onInputChange) {
    this.container = container;
    this.knob = knob;
    this.onInputChange = onInputChange;
    this.isActive = false;
    this.center = { x: 60, y: 60 }; // Center of joystick
    this.maxDistance = 40; // Maximum distance from center
    this.currentPos = { x: 0, y: 0 }; // Current position (-1 to 1)
    this.pointerType = null;
    this.moveListenersAttached = false;
    
    this.onTouchStart = (e) => this.handleStart(e, 'touch');
    this.onMouseStart = (e) => this.handleStart(e, 'mouse');
    this.onTouchMove = (e) => this.handleMove(e);
    this.onMouseMove = (e) => this.handleMove(e);
    this.onTouchEnd = (e) => this.handleEnd(e);
    this.onMouseEnd = (e) => this.handleEnd(e);
    
    this.setupEvents();
  }

  setupEvents() {
    // Touch events
    this.container.addEventListener('touchstart', this.onTouchStart, { passive: false });

    // Mouse events for testing on desktop
    this.container.addEventListener('mousedown', this.onMouseStart);
  }

  handleStart(e, pointerType) {
    e.preventDefault();
    this.isActive = true;
    this.pointerType = pointerType;
    this.container.style.background = 'rgba(255, 255, 255, 0.3)';
    this.attachMoveEndListeners(pointerType);
    this.handleMove(e);
  }

  handleMove(e) {
    if (!this.isActive) return;
    e.preventDefault();

    const touch = e.touches ? e.touches[0] : e;
    const rect = this.container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance <= this.maxDistance) {
      this.knob.style.transform = `translate(${deltaX - 20}px, ${deltaY - 20}px)`;
      this.currentPos.x = deltaX / this.maxDistance;
      this.currentPos.y = deltaY / this.maxDistance;
    } else {
      const angle = Math.atan2(deltaY, deltaX);
      const limitedX = Math.cos(angle) * this.maxDistance;
      const limitedY = Math.sin(angle) * this.maxDistance;
      
      this.knob.style.transform = `translate(${limitedX - 20}px, ${limitedY - 20}px)`;
      this.currentPos.x = limitedX / this.maxDistance;
      this.currentPos.y = limitedY / this.maxDistance;
    }

    // Notify of input change
    this.onInputChange({
      x: this.currentPos.x,
      y: -this.currentPos.y // Invert Y for game coordinates
    });
  }

  handleEnd(e) {
    e.preventDefault();
    this.isActive = false;
    this.knob.style.transform = 'translate(-20px, -20px)';
    this.currentPos = { x: 0, y: 0 };
    this.container.style.background = 'rgba(255, 255, 255, 0.2)';
    this.detachMoveEndListeners();
    this.pointerType = null;
    
    // Notify of input change
    this.onInputChange({ x: 0, y: 0 });
  }

  attachMoveEndListeners(pointerType) {
    if (this.moveListenersAttached) return;
    this.moveListenersAttached = true;

    if (pointerType === 'touch') {
      document.addEventListener('touchmove', this.onTouchMove, { passive: false });
      document.addEventListener('touchend', this.onTouchEnd, { passive: false });
      document.addEventListener('touchcancel', this.onTouchEnd, { passive: false });
    } else {
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('mouseup', this.onMouseEnd);
    }
  }

  detachMoveEndListeners() {
    if (!this.moveListenersAttached) return;
    this.moveListenersAttached = false;

    document.removeEventListener('touchmove', this.onTouchMove, { passive: false });
    document.removeEventListener('touchend', this.onTouchEnd, { passive: false });
    document.removeEventListener('touchcancel', this.onTouchEnd, { passive: false });
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseEnd);
  }

  reset() {
    this.isActive = false;
    this.knob.style.transform = 'translate(-20px, -20px)';
    this.currentPos = { x: 0, y: 0 };
    this.container.style.background = 'rgba(255, 255, 255, 0.2)';
    this.onInputChange({ x: 0, y: 0 });
  }

  destroy() {
    this.detachMoveEndListeners();
    this.container.removeEventListener('touchstart', this.onTouchStart, { passive: false });
    this.container.removeEventListener('mousedown', this.onMouseStart);
  }
}

/**
 * MobileControls - Handles mobile player movement controls only
 */
class MobileControls {
  constructor(inputManager) {
    this.inputManager = inputManager;
    this.isMobile = MobileUtils.isMobile();
    this.isVisible = false;

    this.injectedKeys = new Set();
    this.keyboardDown = new Set();

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
    
    // Only initialize on mobile devices and for player controllers
    if (!this.isMobile) {
      return;
    }

    this.mobileUI = null;
    this.virtualJoystick = null;
    this.currentInput = { x: 0, y: 0 };
    this.jumpHandlers = null;

    this.setupPlayerControls();
  }

  get keys() {
    return this.inputManager && this.inputManager.keys ? this.inputManager.keys : null;
  }

  isDriveMode() {
    return !!(this.inputManager && this.inputManager.isDriveMode);
  }

  setInjectedKey(code, isDown) {
    const keys = this.keys;
    if (!keys) return;

    if (isDown) {
      keys[code] = true;
      this.injectedKeys.add(code);
      return;
    }

    if (this.injectedKeys.has(code) && !this.keyboardDown.has(code)) {
      keys[code] = false;
    }
    this.injectedKeys.delete(code);
  }

  resetInjectedKeys() {
    for (const code of Array.from(this.injectedKeys)) {
      this.setInjectedKey(code, false);
    }
  }

  clearAllKeys() {
    const keys = this.keys;
    if (!keys) return;

    const codes = [
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Space'
    ];

    codes.forEach((code) => {
      if (!this.keyboardDown.has(code)) {
        keys[code] = false;
      }
      this.injectedKeys.delete(code);
    });
  }

  setupPlayerControls() {
    // Create mobile UI
    this.mobileUI = MobileUtils.createMobileUI();
    document.body.appendChild(this.mobileUI.container);

    // Setup virtual joystick
    this.virtualJoystick = new VirtualJoystick(
      this.mobileUI.joystickContainer,
      this.mobileUI.joystickKnob,
      (input) => this.handleJoystickInput(input)
    );

    // Setup jump button
    this.setupJumpButton();
    this.show();
  }

  setupJumpButton() {
    const handleJumpStart = (e) => {
      e.preventDefault();
      if (!this.isVisible) return;
      if (this.isDriveMode()) return;
      this.setInjectedKey('Space', true);
      this.mobileUI.jumpButton.style.background = 'rgba(255, 255, 255, 0.4)';
    };

    const handleJumpEnd = (e) => {
      e.preventDefault();
      if (!this.isVisible) return;
      this.setInjectedKey('Space', false);
      this.mobileUI.jumpButton.style.background = 'rgba(255, 255, 255, 0.2)';
    };

    this.mobileUI.jumpButton.addEventListener('touchstart', handleJumpStart, { passive: false });
    this.mobileUI.jumpButton.addEventListener('touchend', handleJumpEnd, { passive: false });
    this.mobileUI.jumpButton.addEventListener('mousedown', handleJumpStart);
    this.mobileUI.jumpButton.addEventListener('mouseup', handleJumpEnd);
    this.jumpHandlers = { handleJumpStart, handleJumpEnd };
  }

  handleJoystickInput(input) {
    if (!this.isVisible) return;
    this.currentInput = input;

    if (this.isDriveMode()) {
      this.resetInjectedKeys();
      return;
    }
    
    // Set keys based on joystick input (with deadzone)
    const deadzone = 0.1;

    this.setInjectedKey('KeyW', false);
    this.setInjectedKey('KeyS', false);
    this.setInjectedKey('KeyA', false);
    this.setInjectedKey('KeyD', false);
    
    if (Math.abs(input.y) > deadzone) {
      if (input.y > 0) {
        this.setInjectedKey('KeyW', true);
      } else {
        this.setInjectedKey('KeyS', true);
      }
    }
    
    if (Math.abs(input.x) > deadzone) {
      if (input.x > 0) {
        this.setInjectedKey('KeyD', true);
      } else {
        this.setInjectedKey('KeyA', true);
      }
    }
  }

  show() {
    if (!this.isMobile || !this.mobileUI) return;
    this.isVisible = true;
    this.mobileUI.container.style.display = 'block';
  }

  hide() {
    if (!this.isMobile || !this.mobileUI) return;
    this.isVisible = false;
    this.mobileUI.container.style.display = 'none';
    this.resetInjectedKeys();
    this.clearAllKeys();
    if (this.virtualJoystick) {
      this.virtualJoystick.reset();
    }
  }

  destroy() {
    if (!this.isMobile) return;
    
    // Remove the mobile UI
    MobileUtils.removeMobileUI();

    if (this.virtualJoystick) {
      this.virtualJoystick.destroy();
    }

    if (this.jumpHandlers && this.mobileUI && this.mobileUI.jumpButton) {
      const { handleJumpStart, handleJumpEnd } = this.jumpHandlers;
      this.mobileUI.jumpButton.removeEventListener('touchstart', handleJumpStart, { passive: false });
      this.mobileUI.jumpButton.removeEventListener('touchend', handleJumpEnd, { passive: false });
      this.mobileUI.jumpButton.removeEventListener('mousedown', handleJumpStart);
      this.mobileUI.jumpButton.removeEventListener('mouseup', handleJumpEnd);
    }

    this.resetInjectedKeys();
    this.clearAllKeys();
    window.removeEventListener('keydown', this.onWindowKeyDown, false);
    window.removeEventListener('keyup', this.onWindowKeyUp, false);
  }
}

export { MobileControls };
