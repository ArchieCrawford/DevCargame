import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Character System - Player character that can exit vehicle and walk around
 */
export class CharacterSystem {
  constructor(scene, vehicle, camera, mobileDrivingControls = null, soundManager = null) {
    this.scene = scene;
    this.vehicle = vehicle;
    this.camera = camera;
    this.mobileDrivingControls = mobileDrivingControls; // Reference to driving controls
    this.soundManager = soundManager; // Reference to sound manager
    this.isInVehicle = true;
    this.character = null;
    this.mixer = null;
    this.animations = {};
    this.currentAnimation = null;
    
    // Character properties
    this.position = new THREE.Vector3();
    this.rotation = 0;
    this.speed = 0;
    this.walkSpeed = 5;
    this.runSpeed = 12;
    this.isRunning = false;
    
    // Load character model
    this.loadCharacter();
    
    // Create UI buttons
    this.createUI();
    this.createMobileControls();
    
    console.log('🚶 Character system initialized');
  }
  
  loadCharacter() {
    const loader = new GLTFLoader();
    loader.load(
      'https://rosebud.ai/assets/base_basic_pbr(1).glb?NHNm',
      (gltf) => {
        this.character = gltf.scene;
        
        // Setup animations
        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.character);
          
          gltf.animations.forEach((clip) => {
            this.animations[clip.name] = this.mixer.clipAction(clip);
          });
          
          console.log('✅ Character animations loaded:', Object.keys(this.animations));
        }
        
        // Setup materials
        this.character.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // Scale and position
        const box = new THREE.Box3().setFromObject(this.character);
        const size = box.getSize(new THREE.Vector3());
        const scale = 1.8 / size.y; // Scale to ~1.8m tall
        this.character.scale.setScalar(scale);
        
        // Hide initially (in vehicle)
        this.character.visible = false;
        this.scene.add(this.character);
        
        // Start with idle animation
        this.playAnimation('idle');
        
        console.log('✅ Character model loaded');
      },
      undefined,
      (error) => {
        console.error('Error loading character:', error);
      }
    );
  }
  
  createUI() {
    // Exit/Enter car button
    const exitButton = document.createElement('button');
    exitButton.id = 'exitCarButton';
    exitButton.style.cssText = `
      position: fixed;
      bottom: 160px;
      right: 40px;
      padding: 12px 24px;
      background: rgba(0, 255, 136, 0.9);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      color: #000;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      z-index: 1000;
      transition: all 0.2s;
      letter-spacing: 1px;
    `;
    exitButton.textContent = '🚪 EXIT (E)';
    exitButton.addEventListener('click', () => this.toggleMode());
    document.body.appendChild(exitButton);
    this.exitButton = exitButton;
    
    // Mobile-specific styling
    if (window.innerWidth <= 768) {
      exitButton.style.bottom = '20px';
      exitButton.style.right = '20px';
      exitButton.style.padding = '10px 18px';
      exitButton.style.fontSize = '12px';
    }
    
    // Character action buttons (hidden by default)
    const actionContainer = document.createElement('div');
    actionContainer.id = 'characterActions';
    const isMobile = window.innerWidth <= 768;
    actionContainer.style.cssText = `
      position: fixed;
      bottom: ${isMobile ? '80px' : '220px'};
      right: ${isMobile ? '20px' : '40px'};
      display: none;
      flex-direction: column;
      gap: 8px;
      z-index: 1000;
    `;
    
    const buttonStyle = `
      padding: ${isMobile ? '8px 16px' : '12px 24px'};
      background: rgba(255, 255, 255, 0.15);
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 8px;
      color: white;
      font-size: ${isMobile ? '11px' : '14px'};
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      letter-spacing: 0.5px;
    `;
    
    // Dance button
    const danceButton = document.createElement('button');
    danceButton.style.cssText = buttonStyle;
    danceButton.textContent = isMobile ? '💃' : '💃 DANCE (Q)';
    danceButton.addEventListener('click', () => this.dance());
    actionContainer.appendChild(danceButton);
    
    // Run toggle
    const runButton = document.createElement('button');
    runButton.id = 'runButton';
    runButton.style.cssText = buttonStyle;
    runButton.textContent = isMobile ? '🏃 RUN' : '🏃 HOLD TO RUN (SHIFT)';
    runButton.addEventListener('mousedown', () => this.startRun());
    runButton.addEventListener('mouseup', () => this.stopRun());
    runButton.addEventListener('touchstart', (e) => { e.preventDefault(); this.startRun(); });
    runButton.addEventListener('touchend', (e) => { e.preventDefault(); this.stopRun(); });
    actionContainer.appendChild(runButton);
    
    document.body.appendChild(actionContainer);
    this.actionContainer = actionContainer;
  }
  
  createMobileControls() {
    // Virtual joystick for mobile
    const isMobile = window.innerWidth <= 768;
    const joystickSize = isMobile ? 100 : 120;
    const knobSize = isMobile ? 40 : 50;
    
    const joystickContainer = document.createElement('div');
    joystickContainer.id = 'joystickContainer';
    joystickContainer.style.cssText = `
      position: fixed;
      bottom: ${isMobile ? '20px' : '40px'};
      left: ${isMobile ? '20px' : '40px'};
      width: ${joystickSize}px;
      height: ${joystickSize}px;
      background: rgba(255, 255, 255, 0.08);
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: none;
      z-index: 999;
    `;
    
    const joystickKnob = document.createElement('div');
    joystickKnob.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: ${knobSize}px;
      height: ${knobSize}px;
      background: rgba(0, 255, 136, 0.6);
      border-radius: 50%;
      touch-action: none;
    `;
    
    joystickContainer.appendChild(joystickKnob);
    document.body.appendChild(joystickContainer);
    
    this.joystick = {
      container: joystickContainer,
      knob: joystickKnob,
      active: false,
      startX: 0,
      startY: 0,
      deltaX: 0,
      deltaY: 0
    };
    
    // Touch events for joystick
    joystickContainer.addEventListener('touchstart', (e) => this.onJoystickStart(e));
    joystickContainer.addEventListener('touchmove', (e) => this.onJoystickMove(e));
    joystickContainer.addEventListener('touchend', (e) => this.onJoystickEnd(e));
    
    console.log('📱 Mobile controls created');
  }
  
  onJoystickStart(e) {
    e.preventDefault();
    this.joystick.active = true;
    const touch = e.touches[0];
    const rect = this.joystick.container.getBoundingClientRect();
    this.joystick.startX = rect.left + rect.width / 2;
    this.joystick.startY = rect.top + rect.height / 2;
  }
  
  onJoystickMove(e) {
    if (!this.joystick.active) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.joystick.startX;
    const deltaY = touch.clientY - this.joystick.startY;
    
    // Clamp to circle
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = 35;
    
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      this.joystick.deltaX = Math.cos(angle) * maxDistance;
      this.joystick.deltaY = Math.sin(angle) * maxDistance;
    } else {
      this.joystick.deltaX = deltaX;
      this.joystick.deltaY = deltaY;
    }
    
    // Update knob position
    this.joystick.knob.style.transform = `translate(calc(-50% + ${this.joystick.deltaX}px), calc(-50% + ${this.joystick.deltaY}px))`;
  }
  
  onJoystickEnd(e) {
    e.preventDefault();
    this.joystick.active = false;
    this.joystick.deltaX = 0;
    this.joystick.deltaY = 0;
    this.joystick.knob.style.transform = 'translate(-50%, -50%)';
  }
  
  toggleMode() {
    if (!this.character) {
      console.warn('Character not loaded yet');
      return;
    }
    
    this.isInVehicle = !this.isInVehicle;
    
    if (this.isInVehicle) {
      // Enter vehicle
      this.character.visible = false;
      this.vehicle.group.visible = true;
      this.exitButton.textContent = '🚪 EXIT CAR (E)';
      this.actionContainer.style.display = 'none';
      this.joystick.container.style.display = 'none';
      
      // Show mobile driving controls
      if (this.mobileDrivingControls) {
        this.mobileDrivingControls.show();
      }
      
      // Start engine
      if (this.soundManager) {
        this.soundManager.startEngine();
      }
      
      console.log('🚗 Entered vehicle');
    } else {
      // Exit vehicle
      const vehiclePos = this.vehicle.getPosition();
      this.position.copy(vehiclePos);
      this.position.x += 3; // Exit to the side
      this.rotation = this.vehicle.rotation;
      
      this.character.visible = true;
      this.character.position.copy(this.position);
      this.character.rotation.y = this.rotation;
      
      // Hide vehicle (or keep visible, your choice)
      // this.vehicle.group.visible = false;
      
      this.exitButton.textContent = '🚗 ENTER CAR (E)';
      this.actionContainer.style.display = 'flex';
      this.joystick.container.style.display = 'block';
      
      // Hide mobile driving controls
      if (this.mobileDrivingControls) {
        this.mobileDrivingControls.hide();
      }
      
      // Stop engine
      if (this.soundManager) {
        this.soundManager.stopEngine();
      }
      
      // Start with walk animation instead of idle to avoid T-pose
      this.playAnimation('walk');
      console.log('🚶 Exited vehicle');
    }
  }
  
  playAnimation(animName) {
    if (!this.mixer || !this.animations[animName]) {
      // Fallback to common animation names
      const fallbacks = {
        'idle': ['Idle', 'idle', 'T-Pose', 'TPose'],
        'walk': ['Walk', 'walk', 'Walking', 'walking'],
        'run': ['Run', 'run', 'Running', 'running'],
        'dance': ['Dance', 'dance', 'Dancing', 'dancing']
      };
      
      if (fallbacks[animName]) {
        for (const fallback of fallbacks[animName]) {
          if (this.animations[fallback]) {
            animName = fallback;
            break;
          }
        }
      }
    }
    
    if (this.currentAnimation === animName) return;
    
    // Stop previous animation
    if (this.currentAnimation && this.animations[this.currentAnimation]) {
      this.animations[this.currentAnimation].fadeOut(0.2);
    }
    
    // Play new animation
    if (this.animations[animName]) {
      this.animations[animName].reset().fadeIn(0.2).play();
      this.currentAnimation = animName;
    } else {
      console.warn(`Animation "${animName}" not found. Available:`, Object.keys(this.animations));
    }
  }
  
  dance() {
    if (this.isInVehicle) return;
    this.playAnimation('dance');
    console.log('💃 Dancing!');
  }
  
  startRun() {
    this.isRunning = true;
    if (this.runButton) {
      this.runButton.style.background = 'rgba(0, 255, 136, 0.4)';
    }
  }
  
  stopRun() {
    this.isRunning = false;
    if (this.runButton) {
      this.runButton.style.background = 'rgba(255, 255, 255, 0.15)';
    }
  }
  
  update(deltaTime, inputManager) {
    // Update animations
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }
    
    // Only update character movement when not in vehicle
    if (this.isInVehicle || !this.character) return;
    
    // Get input (keyboard or joystick)
    let moveX = 0;
    let moveZ = 0;
    
    // Keyboard input
    const keys = inputManager.keys;
    if (keys['KeyW'] || keys['ArrowUp']) moveZ = 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveZ = -1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveX = -1;
    if (keys['KeyD'] || keys['ArrowRight']) moveX = 1;
    
    // Check for run (Shift key) - only set to false if no shift pressed and not holding mobile button
    const shiftPressed = keys['ShiftLeft'] || keys['ShiftRight'];
    if (shiftPressed) {
      this.isRunning = true;
    } else if (!this.joystick.active && !shiftPressed) {
      // Don't override mobile run button state
      if (!this.runButton || !this.runButton.matches(':active')) {
        this.isRunning = false;
      }
    }
    
    // Mobile joystick input
    if (this.joystick.active) {
      moveX = this.joystick.deltaX / 35; // Normalize
      moveZ = -this.joystick.deltaY / 35; // Invert Y
    }
    
    // Dance input
    if (keys['KeyQ']) {
      this.dance();
      return; // Don't move while dancing
    }
    
    // Calculate movement
    const isMoving = Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1;
    
    if (isMoving) {
      // Determine speed
      const currentSpeed = this.isRunning ? this.runSpeed : this.walkSpeed;
      
      // Calculate direction
      const angle = Math.atan2(moveX, moveZ);
      this.rotation = angle;
      
      // Move character
      const moveSpeed = currentSpeed * deltaTime;
      this.position.x += Math.sin(angle) * moveSpeed;
      this.position.z += Math.cos(angle) * moveSpeed;
      
      // Update character transform
      this.character.position.copy(this.position);
      this.character.rotation.y = this.rotation;
      
      // Play appropriate animation
      if (this.isRunning) {
        this.playAnimation('run');
      } else {
        this.playAnimation('walk');
      }
      
      // Update camera to follow character
      this.updateCharacterCamera();
    } else {
      // Idle
      if (this.currentAnimation !== 'dance') {
        this.playAnimation('idle');
      }
    }
    
    // Check if near vehicle to enter
    if (!this.isInVehicle && this.character) {
      const vehiclePos = this.vehicle.getPosition();
      const distance = this.position.distanceTo(vehiclePos);
      
      if (distance < 5) {
        this.exitButton.style.background = 'rgba(0, 255, 136, 1.0)';
        this.exitButton.style.transform = 'scale(1.05)';
      } else {
        this.exitButton.style.background = 'rgba(0, 255, 136, 0.9)';
        this.exitButton.style.transform = 'scale(1.0)';
      }
    }
  }
  
  updateCharacterCamera() {
    // Third-person camera following character
    const distance = 8;
    const height = 3;
    
    const cameraX = this.position.x - Math.sin(this.rotation) * distance;
    const cameraZ = this.position.z - Math.cos(this.rotation) * distance;
    
    // Smoothly interpolate camera
    const targetPos = new THREE.Vector3(cameraX, this.position.y + height, cameraZ);
    this.camera.position.lerp(targetPos, 0.1);
    
    // Look at character
    const lookTarget = new THREE.Vector3(
      this.position.x,
      this.position.y + 1.5,
      this.position.z
    );
    this.camera.lookAt(lookTarget);
  }
  
  destroy() {
    if (this.exitButton && this.exitButton.parentNode) {
      this.exitButton.parentNode.removeChild(this.exitButton);
    }
    if (this.actionContainer && this.actionContainer.parentNode) {
      this.actionContainer.parentNode.removeChild(this.actionContainer);
    }
    if (this.joystick.container && this.joystick.container.parentNode) {
      this.joystick.container.parentNode.removeChild(this.joystick.container);
    }
  }
}
