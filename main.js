import * as THREE from 'three';
import { Cybertruck } from './Cybertruck.js';
import { JeffersonAve } from './JeffersonAve.js';
import { CityBlockSystem } from './CityBlockSystem.js';
import { NavigationSystem } from './NavigationSystem.js';
import { CameraController } from './CameraController.js';
import { CameraIntro } from './CameraIntro.js';
import { TrafficSystem } from './TrafficSystem.js';
import { RespawnSystem } from './RespawnSystem.js';
import { VehicleCustomization } from './VehicleCustomization.js';
import { GarageScene } from './GarageScene.js';
import { InputManager } from './InputManager.js';
import { Minimap } from './Minimap.js';
import { MobileDrivingControls } from './MobileDrivingControls.js';
import { SoundManager } from './SoundManager.js';
import { SoundToggleButton } from './SoundToggleButton.js';
import { CONFIG } from './config.js';

class CybertruckExperience {
  constructor() {
    this.clock = new THREE.Clock();
    this.currentScene = 'garage'; // Start in garage
    this.isInDriveMode = false;
    this.introComplete = false;
    this.selectedVehicleProfile = 'cybertruck';
    
    // Credit earning system
    this.distanceTraveled = 0;
    this.lastPosition = null;
    this.creditsPerMile = 50; // Earn $50 per mile driven
    this._keyHandler = null;
    
    this.init();
  }
  
  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.world = new THREE.Group();
    this.scene.add(this.world);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);
    
    // Sound manager
    this.soundManager = new SoundManager();
    
    // Event listeners
    window.addEventListener('resize', () => this.onWindowResize());
    
    // Always start at garage for vehicle selection
    // Remove the skip garage flag to ensure we always start fresh
    localStorage.removeItem('skipGarage');
    this.selectedVehicleProfile = localStorage.getItem('selectedVehicle') || 'cybertruck';
    
    // Always start with garage scene
    this.initGarageScene();
    
    // Start animation loop
    this.animate();
  }
  
  clearWorld() {
    if (this.world) {
      this.world.clear();
    }
  }
  
  initGarageScene() {
    this.currentScene = 'garage';
    this.isInDriveMode = false;
    this.scene.background = new THREE.Color(0x1a1a1a);
    this.scene.fog = null;
    this.clearWorld();
    this.destroyKeyboardShortcuts();
    
    // Create garage
    this.garage = new GarageScene(this.world, this.camera);
    this.garage.show();
    this.garage.onStartDriving = (vehicleProfile) => {
      this.selectedVehicleProfile = vehicleProfile;
      localStorage.setItem('selectedVehicle', vehicleProfile); // Save vehicle selection
      this.transitionToCityScene();
    };
    
    console.log('🏢 Garage scene initialized');
  }
  
  initCityScene({ fromGarage = false } = {}) {
    this.currentScene = 'city';
    this.isInDriveMode = true;
    this.introComplete = false;
    this.clearWorld();
    
    // Clear garage if it exists
    if (this.garage) {
      this.garage.hide();
      this.garage.destroy();
      this.garage = null;
    }
    
    // Setup city scene
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 100, 400);
    
    // Lighting
    this.setupLighting();
    
    // Choose map type (can be set by user preference)
    const useModularCity = localStorage.getItem('useModularCity') === 'true';
    
    if (useModularCity) {
      // Use modular city block system
      this.cityBlockSystem = new CityBlockSystem(this.world);
      this.jeffersonAve = null; // No Jefferson Ave in modular mode
      
      // Spawn in city center
      this.spawnPosition = { x: 0, y: 0.4, z: 0 };
    } else {
      // Use Jefferson Ave corridor
      this.jeffersonAve = new JeffersonAve(this.world);
      this.cityBlockSystem = null;
      
      // Spawn at Starbucks parking
      this.spawnPosition = { x: -50, y: 0.4, z: 830 };
    }
    
    // Create Cybertruck with selected profile
    this.cybertruck = new Cybertruck(this.world, this.selectedVehicleProfile);
    const spawn = this.spawnPosition;
    let spawnY = spawn.y;
    if (this.cybertruck.profile.type === 'air') {
      const lift = this.cybertruck.profile.spawnLift ?? 6;
      const minAltitude = this.cybertruck.profile.minAltitude ?? spawn.y;
      spawnY = Math.max(spawn.y + lift, minAltitude);
    }
    this.cybertruck.group.position.set(spawn.x, spawnY, spawn.z);
    this.cybertruck.group.rotation.y = 0;
    this.cybertruck.rotation = 0;
    this.lastPosition = null;
    
    // Camera intro
    const introTarget = new THREE.Vector3(this.spawnPosition.x, 2, this.spawnPosition.z);
    this.cameraIntro = new CameraIntro(this.camera, introTarget);
    
    // Camera controller
    this.cameraController = new CameraController(
      this.camera,
      this.renderer,
      this.cybertruck
    );
    
    if (this.cybertruck.profile.camera) {
      const { distance, height } = this.cybertruck.profile.camera;
      if (Number.isFinite(distance) && Number.isFinite(height)) {
        this.cameraController.cameraOffset.set(0, height, -distance);
      }
    }
    
    // Input manager
    this.inputManager = new InputManager();
    
    // Add keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    // Navigation system (only for Jefferson Ave)
    if (this.jeffersonAve) {
      this.navigation = new NavigationSystem(this.world, this.jeffersonAve.getLandmarks());
    } else {
      this.navigation = null;
    }
    
    // Traffic system
    this.trafficSystem = new TrafficSystem(this.world);
    
    // Pedestrian system - lazy load
    this.pedestrianSystem = null;
    this.initPedestrianSystem();
    
    // Respawn system
    this.respawnSystem = new RespawnSystem(this.cybertruck, this.world);
    
    // Vehicle customization system
    this.customization = new VehicleCustomization(this.cybertruck, this.world);
    
    // Character system - lazy load
    this.characterSystem = null;
    this.initCharacterSystem();
    
    // Mobile driving controls
    this.mobileDrivingControls = new MobileDrivingControls(this.inputManager);
    this.mobileDrivingControls.show(); // Show by default when in vehicle
    
    // Sound toggle button
    this.soundToggleButton = new SoundToggleButton(this.soundManager);
    
    // Minimap
    this.minimap = new Minimap('minimapCanvas', this.cybertruck);
    
    // UI
    this.setupUI();
    
    // Only add click-to-skip intro if coming from fresh start (not garage transition)
    if (!fromGarage) {
      const skipIntroHint = document.getElementById('skipIntro');
      
      window.addEventListener('click', () => {
        if (this.cameraIntro && this.cameraIntro.isActive()) {
          this.cameraIntro.skip();
          this.cameraController.switchToDrive();
          if (skipIntroHint) {
            skipIntroHint.classList.add('hidden');
          }
          console.log('⏭️ Intro skipped - drive mode active');
        }
      }, { once: true });
      
      // Start aerial intro
      this.cameraIntro.start();
    }
    
    console.log('🏙️ City scene initialized');
  }
  
  transitionToCityScene() {
    console.log('🔄 Transitioning to city scene...');
    
    // Clear garage scene
    if (this.garage) {
      this.garage.destroy();
      this.garage = null;
    }
    
    // Initialize city scene with drive mode enabled
    this.initCityScene({ fromGarage: true });
    
    // Skip intro and enable controls immediately
    if (this.cameraIntro) {
      this.cameraIntro.skip();
      this.introComplete = true;
    }
    if (this.cameraController) {
      this.cameraController.switchToDrive();
    }
    if (this.inputManager) {
      this.inputManager.setDriveMode(true);
    }
    
    // Start engine sound
    if (this.soundManager) {
      this.soundManager.startEngine();
    }
    
    // Hide skip intro hint
    const skipIntroHint = document.getElementById('skipIntro');
    if (skipIntroHint) {
      skipIntroHint.classList.add('hidden');
    }
    
    console.log('🚗 Drive mode active - ready to drive!');
  }
  
  async initPedestrianSystem() {
    try {
      const { PedestrianSystem } = await import('./PedestrianSystem.js');
      this.pedestrianSystem = new PedestrianSystem(this.world);
      console.log('✅ Pedestrian system loaded');
    } catch (error) {
      console.warn('⚠️ Could not load pedestrian system:', error);
    }
  }
  
  async initCharacterSystem() {
    try {
      const { CharacterSystem } = await import('./CharacterSystem.js');
      this.characterSystem = new CharacterSystem(
        this.world, 
        this.cybertruck, 
        this.camera, 
        this.mobileDrivingControls,
        this.soundManager,
        this.inputManager
      );
      console.log('✅ Character system loaded');
    } catch (error) {
      console.warn('⚠️ Could not load character system:', error);
    }
  }
  
  setupKeyboardShortcuts() {
    if (this._keyHandler) return;
    
    this._keyHandler = (e) => {
      // Only process these in city scene
      if (this.currentScene !== 'city') return;
      
      // R - Manual respawn
      if (e.key === 'r' || e.key === 'R') {
        this.respawnSystem.manualRespawn();
      }
      
      // E - Toggle character mode (exit/enter car)
      if (e.key === 'e' || e.key === 'E') {
        if (this.characterSystem) {
          this.characterSystem.toggleMode();

          const inVehicle = this.characterSystem.isInVehicle;
          if (this.inputManager) {
            this.inputManager.setDriveMode(inVehicle);
          }
          this.isInDriveMode = inVehicle;
          if (this.mobileDrivingControls) {
            if (inVehicle) this.mobileDrivingControls.show();
            else this.mobileDrivingControls.hide();
          }
        }
      }
      
      // 1, 2, 3 - Switch vehicle profiles
      if (e.key === '1') {
        this.cybertruck.setVehicleProfile('cybertruck');
        this.showNotification('Vehicle: Cybertruck');
      }
      if (e.key === '2') {
        this.cybertruck.setVehicleProfile('sportsCar');
        this.showNotification('Vehicle: Sports Car');
      }
      if (e.key === '3') {
        this.cybertruck.setVehicleProfile('suv');
        this.showNotification('Vehicle: SUV');
      }
      
      // G - Return to garage
      if (e.key === 'g' || e.key === 'G') {
        localStorage.removeItem('skipGarage');
        location.reload();
      }
      
      // M - Toggle map type (Jefferson Ave vs Modular City)
      if (e.key === 'm' || e.key === 'M') {
        const current = localStorage.getItem('useModularCity') === 'true';
        localStorage.setItem('useModularCity', (!current).toString());
        this.showNotification(`Map: ${!current ? 'Modular City' : 'Jefferson Ave'}`);
        setTimeout(() => location.reload(), 2000);
      }
      
      // N - Toggle sound mute
      if (e.key === 'n' || e.key === 'N') {
        if (this.soundManager) {
          const enabled = this.soundManager.toggleMute();
          this.showNotification(`Sound: ${enabled ? 'ON' : 'OFF'}`);
        }
      }
      
      // H - Horn
      if (e.key === 'h' || e.key === 'H') {
        if (this.soundManager) {
          this.soundManager.playHorn();
        }
      }
    };
    
    window.addEventListener('keydown', this._keyHandler);
  }
  
  destroyKeyboardShortcuts() {
    if (!this._keyHandler) return;
    window.removeEventListener('keydown', this._keyHandler);
    this._keyHandler = null;
  }
  
  showNotification(message) {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 200px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 255, 136, 0.95);
      color: #000;
      padding: 15px 30px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      z-index: 10000;
      pointer-events: none;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.3s ease';
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 2000);
  }
  
  setupLighting() {
    // Ambient light - bright daylight
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.world.add(ambientLight);
    
    // Main directional light - sun
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(100, 150, 100);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 300;
    mainLight.shadow.camera.left = -150;
    mainLight.shadow.camera.right = 150;
    mainLight.shadow.camera.top = 150;
    mainLight.shadow.camera.bottom = -150;
    this.world.add(mainLight);
    
    // Hemisphere light for natural sky/ground gradient
    const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x4a4a4a, 0.6);
    this.world.add(hemiLight);
  }
  
  setupUI() {
    const controlsHint = document.getElementById('controlsHint');
    const speedometer = document.getElementById('speedometer');
    const powerBar = document.getElementById('powerBar');
    const minimapContainer = document.getElementById('minimapContainer');
    const navigationPanel = document.getElementById('navigationPanel');
    const streetName = document.getElementById('streetName');
    
    this.speedometer = speedometer;
    this.powerBar = powerBar;
    this.minimapContainer = minimapContainer;
    this.navigationPanel = navigationPanel;
    this.streetName = streetName;
    this.speedValue = document.getElementById('speedValue');
    this.gearValue = document.getElementById('gearValue');
    this.powerFill = document.getElementById('powerFill');
    
    // Show UI elements immediately (already in drive mode)
    controlsHint.classList.add('visible');
    speedometer.classList.add('visible');
    powerBar.classList.add('visible');
    minimapContainer.classList.add('visible');
    navigationPanel.classList.add('visible');
    streetName.classList.add('visible');
    
    // Enable drive mode immediately
    this.inputManager.setDriveMode(true);
    this.updateControlsHint();
    
    // Navigation buttons (only for Jefferson Ave)
    if (this.navigation) {
      document.getElementById('navWalmart').addEventListener('click', () => {
        this.navigation.setDestination('walmart');
        this.setActiveNavButton('navWalmart');
      });
      
      document.getElementById('navStarbucks').addEventListener('click', () => {
        this.navigation.setDestination('starbucks');
        this.setActiveNavButton('navStarbucks');
      });
      
      document.getElementById('navClear').addEventListener('click', () => {
        this.navigation.clearWaypoint();
        this.clearActiveNavButton();
      });
    }
  }
  
  updateControlsHint() {
    const controlsHint = document.getElementById('controlsHint');
    if (!controlsHint || !this.cybertruck) return;
    
    const baseHint = 'E Exit Car • C Customize • H Horn • N Mute • R Respawn • 1/2/3 Switch Car • M Toggle Map • G Garage';
    
    if (this.cybertruck.profile.type === 'air') {
      controlsHint.textContent = `WASD/Arrows Fly • Space Up • Shift Down • ${baseHint}`;
      return;
    }
    
    const hydraulicsHint = this.cybertruck.profile.hydraulics ? ' • L Hydraulics' : '';
    controlsHint.textContent = `WASD/Arrows Drive • Space/Shift Brake${hydraulicsHint} • ${baseHint}`;
  }
  
  setActiveNavButton(buttonId) {
    // Clear all active states
    document.querySelectorAll('.nav-button').forEach(btn => {
      btn.classList.remove('active');
    });
    // Set active state
    document.getElementById(buttonId).classList.add('active');
  }
  
  clearActiveNavButton() {
    document.querySelectorAll('.nav-button').forEach(btn => {
      btn.classList.remove('active');
    });
  }
  
  updateStreetName() {
    if (this.jeffersonAve) {
      const currentStreet = this.jeffersonAve.getCurrentStreet(this.cybertruck.getPosition().z);
      this.streetName.textContent = currentStreet;
    } else {
      // Show coordinates in modular city
      const pos = this.cybertruck.getPosition();
      this.streetName.textContent = `Block (${Math.floor(pos.x / 200)}, ${Math.floor(pos.z / 200)})`;
    }
  }
  
  updateSpeedometer() {
    // Convert speed to MPH (speed is in units/second, scale appropriately)
    const mph = Math.abs(this.cybertruck.speed * 2.5);
    this.speedValue.textContent = Math.round(mph);
    
    // Update gear indicator
    const input = this.inputManager.getInput();
    let gear = 'P';
    let gearClass = 'park';
    
    if (Math.abs(this.cybertruck.speed) < 0.5) {
      if (input.backward) {
        gear = 'R';
        gearClass = 'reverse';
      } else if (input.forward) {
        gear = 'D';
        gearClass = 'drive';
      }
    } else if (this.cybertruck.speed > 0.5) {
      gear = 'D';
      gearClass = 'drive';
    } else if (this.cybertruck.speed < -0.5) {
      gear = 'R';
      gearClass = 'reverse';
    }
    
    this.gearValue.textContent = gear;
    this.gearValue.className = `gear-value ${gearClass}`;
    
    // Update power bar (based on acceleration input)
    let powerPercent = 0;
    if (input.forward) {
      powerPercent = Math.min(100, (Math.abs(this.cybertruck.speed) / CONFIG.drive.maxSpeed) * 100);
    } else if (input.backward) {
      powerPercent = Math.min(50, (Math.abs(this.cybertruck.speed) / (CONFIG.drive.maxSpeed * 0.5)) * 50);
    }
    
    this.powerFill.style.width = powerPercent + '%';
  }
  
  trackDistance() {
    const currentPos = this.cybertruck.getPosition();
    
    if (!this.lastPosition) {
      this.lastPosition = currentPos.clone();
      return;
    }
    
    const distance = currentPos.distanceTo(this.lastPosition);
    
    if (distance < 0.01 || Math.abs(this.cybertruck.speed) < 0.1) {
      this.lastPosition.copy(currentPos);
      return;
    }
    
    this.distanceTraveled += distance;
    
    // Award credits every mile (assume 200 units = 1 mile)
    const milesThreshold = 200;
    if (this.distanceTraveled >= milesThreshold) {
      const miles = Math.floor(this.distanceTraveled / milesThreshold);
      const creditsEarned = miles * this.creditsPerMile;
      
      if (this.customization) {
        this.customization.addCredits(creditsEarned);
      }
      
      this.distanceTraveled = this.distanceTraveled % milesThreshold;
    }
    
    this.lastPosition.copy(currentPos);
  }
  
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    // Garage scene
    if (this.currentScene === 'garage' && this.garage) {
      this.garage.update(deltaTime);
      this.renderer.render(this.scene, this.camera);
      return;
    }
    
    // City scene - handle camera intro
    if (this.cameraIntro && this.cameraIntro.isActive()) {
      const introComplete = this.cameraIntro.update();
      
      if (introComplete && !this.introComplete) {
        this.introComplete = true;
        // After intro, switch to drive camera
        this.cameraController.switchToDrive();
        // Hide skip intro hint
        const skipIntroHint = document.getElementById('skipIntro');
        if (skipIntroHint) {
          skipIntroHint.classList.add('hidden');
        }
        console.log('🎬 Intro complete - drive mode active');
      }
      
      // During intro, don't update other systems
      this.renderer.render(this.scene, this.camera);
      return;
    }
    
    // Update traffic system (always running in city)
    if (this.trafficSystem) {
      this.trafficSystem.update(deltaTime, this.cybertruck.getPosition());
    }
    
    // Update pedestrian system (if loaded)
    if (this.pedestrianSystem) {
      this.pedestrianSystem.update(deltaTime, this.cybertruck.getPosition());
    }
    
    // Update city blocks if using modular system
    if (this.cityBlockSystem) {
      this.cityBlockSystem.update(this.cybertruck.getPosition());
    }

    const inVehicle = !this.characterSystem || this.characterSystem.isInVehicle;

    // Keep drive mode in sync with whether the player is in the vehicle
    if (this.inputManager && this.inputManager.isDriveMode !== inVehicle) {
      this.inputManager.setDriveMode(inVehicle);
    }
    this.isInDriveMode = inVehicle;

    // Ensure only the correct mobile control system is active
    if (this.mobileDrivingControls) {
      if (inVehicle) {
        this.mobileDrivingControls.show();
        this.mobileDrivingControls.update();
      } else {
        this.mobileDrivingControls.hide();
      }
    }
    
    // Get truck input (adapter that converts keys to truck format)
    const truckInput = this.inputManager.getTruckInput();
    const isAirVehicle = this.cybertruck.profile.type === 'air';
    const collisionObjects = isAirVehicle
      ? []
      : (this.jeffersonAve
        ? this.jeffersonAve.getCollisionObjects()
        : (this.cityBlockSystem?.getCollisionObjects?.() ?? []));

    // Update character system (always; it decides what to do based on mode)
    if (this.characterSystem) {
      this.characterSystem.update(deltaTime, this.inputManager);
    }
    
    // Update cybertruck (ONLY when in drive mode AND in vehicle)
    if (inVehicle) {
      // Store previous speed for collision detection
      const prevSpeed = this.cybertruck.speed;
      
      this.cybertruck.update(deltaTime, truckInput, collisionObjects);
      
      // Update engine sound based on speed and acceleration
      if (this.soundManager) {
        const input = this.inputManager.getInput();
        const isAccelerating = input.forward && this.cybertruck.speed >= 0;
        this.soundManager.updateEngine(
          this.cybertruck.speed,
          CONFIG.drive.maxSpeed,
          isAccelerating
        );
        
        // Play brake sound if braking hard
        if (input.brake) {
          const brakeIntensity = Math.abs(this.cybertruck.speed) / CONFIG.drive.maxSpeed;
          if (brakeIntensity > 0.3) {
            // Throttle brake sound (don't play every frame)
            if (!this.lastBrakeSound || Date.now() - this.lastBrakeSound > 500) {
              this.soundManager.playBrake(brakeIntensity);
              this.lastBrakeSound = Date.now();
            }
          }
        }
      }
      
      // Check traffic collision
      if (!isAirVehicle) {
        const hitVehicle = this.trafficSystem.checkCollision(this.cybertruck.getPosition());
        if (hitVehicle) {
          // Play collision sound
          if (this.soundManager) {
            const collisionIntensity = Math.abs(prevSpeed) / CONFIG.drive.maxSpeed;
            this.soundManager.playCollision(collisionIntensity);
          }
          
          // Bounce back on collision
          this.cybertruck.speed *= 0.3;
          console.log('💥 Traffic collision!');
        }
      }
      
      // Check respawn conditions (auto-respawn if flipped/out of bounds)
      this.respawnSystem.checkAndRespawn();
      
      // Update navigation (only if Jefferson Ave)
      if (this.navigation) {
        this.navigation.update();
        this.navigation.checkArrival(this.cybertruck.getPosition());
      }
      
      // Track distance for credit earning
      this.trackDistance();
      
      // Update UI
      this.updateSpeedometer();
      if (this.jeffersonAve) {
        this.updateStreetName();
      }
      this.minimap.draw();
    }
    
    // Update camera (only for vehicle, character handles its own camera)
    if (!this.characterSystem || this.characterSystem.isInVehicle) {
      this.cameraController.update();
    }
    
    // Render
    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the experience
new CybertruckExperience();
