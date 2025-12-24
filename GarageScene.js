import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Garage Scene - Car selection showroom before entering the city
 */
export class GarageScene {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.selectedCarIndex = 0;
    
    // Real vehicle assets from the project
    this.cars = [
      {
        id: 'cybertruck',
        name: 'Cybertruck',
        description: 'Heavy electric pickup with excellent acceleration',
        stats: { topSpeed: 125, accel: 8, handling: 6 },
        modelUrl: 'https://rosebud.ai/assets/cybertruck-meshy-final.glb?JhtX',
        scale: 0.8
      },
      {
        id: 'tesla',
        name: 'Tesla Model',
        description: 'Sleek sedan with high-tech features',
        stats: { topSpeed: 155, accel: 9, handling: 8 },
        modelUrl: 'https://rosebud.ai/assets/tesla.glb?om5j',
        scale: 1.0
      },
      {
        id: 'remotecar',
        name: 'RC Racer',
        description: 'Compact and ultra-nimble racing machine',
        stats: { topSpeed: 140, accel: 10, handling: 10 },
        modelUrl: 'https://rosebud.ai/assets/remotecar.glb?IBr3',
        scale: 1.2
      }
    ];
    
    this.loader = new GLTFLoader();
    
    this.carModels = [];
    this.turntable = null;
    this.isActive = false;
    
    this.buildGarage();
    this.createUI();
  }
  
  buildGarage() {
    // Garage floor
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.6,
      metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    // Walls
    this.createWalls();
    
    // Garage lighting
    this.setupGarageLighting();
    
    // Turntable platform for car display
    this.createTurntable();
    
    // Create placeholder car models
    this.createCarModels();
    
    // Camera position for garage view
    this.camera.position.set(0, 3, 10);
    this.camera.lookAt(0, 1, 0);
  }
  
  createWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a3a3a,
      roughness: 0.8
    });
    
    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(100, 20, 1),
      wallMaterial
    );
    backWall.position.set(0, 10, -50);
    this.scene.add(backWall);
    
    // Side walls
    const leftWall = new THREE.Mesh(
      new THREE.BoxGeometry(1, 20, 100),
      wallMaterial
    );
    leftWall.position.set(-50, 10, 0);
    this.scene.add(leftWall);
    
    const rightWall = new THREE.Mesh(
      new THREE.BoxGeometry(1, 20, 100),
      wallMaterial
    );
    rightWall.position.set(50, 10, 0);
    this.scene.add(rightWall);
  }
  
  setupGarageLighting() {
    // Bright overhead lights for showroom feel
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(10, 15, 5);
    mainLight.castShadow = true;
    this.scene.add(mainLight);
    
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-10, 10, -5);
    this.scene.add(fillLight);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    // Spotlights on turntable
    const spotlight1 = new THREE.SpotLight(0xffffff, 1.5, 50, Math.PI / 6, 0.5);
    spotlight1.position.set(5, 10, 5);
    spotlight1.target.position.set(0, 0, 0);
    spotlight1.castShadow = false;
    this.scene.add(spotlight1);
    this.scene.add(spotlight1.target);
  }
  
  createTurntable() {
    const turntableGeometry = new THREE.CylinderGeometry(4, 4, 0.3, 32);
    const turntableMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.3,
      metalness: 0.7
    });
    this.turntable = new THREE.Mesh(turntableGeometry, turntableMaterial);
    this.turntable.position.y = 0.15;
    this.turntable.castShadow = true;
    this.turntable.receiveShadow = true;
    this.scene.add(this.turntable);
    
    // Add rim detail
    const rimGeometry = new THREE.TorusGeometry(4, 0.05, 16, 100);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00ff88,
      emissiveIntensity: 0.3
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.3;
    this.scene.add(rim);
  }
  
  createCarModels() {
    // Load real 3D models for each car
    this.cars.forEach((carData, index) => {
      const carGroup = new THREE.Group();
      carGroup.visible = index === 0; // Only show first car initially
      carGroup.position.y = 0.5;
      this.scene.add(carGroup);
      this.carModels.push(carGroup);
      
      // Load the actual GLB model
      this.loader.load(
        carData.modelUrl,
        (gltf) => {
          const model = gltf.scene;
          
          // Apply materials and setup
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Enhance materials
              if (child.material) {
                child.material.metalness = Math.max(child.material.metalness || 0, 0.6);
                child.material.roughness = Math.min(child.material.roughness || 1, 0.4);
              }
            }
          });
          
          // Scale and center the model
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          // Apply custom scale
          const scale = (carData.scale || 1.0) * (2.5 / size.length());
          model.scale.setScalar(scale);
          
          // Center the model
          model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
          
          carGroup.add(model);
          console.log(`✅ Loaded ${carData.name} model`);
        },
        (progress) => {
          if (progress.total > 0) {
            console.log(`Loading ${carData.name}: ${(progress.loaded / progress.total * 100).toFixed(0)}%`);
          }
        },
        (error) => {
          console.error(`Error loading ${carData.name}:`, error);
          // Add a simple placeholder on error
          this.createPlaceholderCar(carGroup);
        }
      );
    });
  }
  
  createPlaceholderCar(carGroup) {
    // Fallback placeholder if model fails to load
    const bodyGeometry = new THREE.BoxGeometry(2.4, 1.5, 5);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.75;
    body.castShadow = true;
    carGroup.add(body);
  }
  
  createUI() {
    const garageUI = document.createElement('div');
    garageUI.id = 'garageUI';
    garageUI.style.cssText = `
      position: fixed;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      z-index: 100;
    `;
    
    garageUI.innerHTML = `
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: white; font-size: 48px; font-weight: 700; letter-spacing: 4px; margin: 0;">SELECT YOUR RIDE</h1>
        <p style="color: rgba(255, 255, 255, 0.6); font-size: 16px; margin-top: 10px;">Choose a vehicle to explore Jefferson Ave</p>
      </div>
      
      <div id="carInfo" style="text-align: center; margin-bottom: 40px;">
        <h2 id="carName" style="color: #00ff88; font-size: 36px; font-weight: 700; margin: 0;">Cybertruck</h2>
        <p id="carDescription" style="color: rgba(255, 255, 255, 0.7); font-size: 14px; margin: 10px 0 20px 0;">Heavy electric pickup with excellent acceleration</p>
        
        <div style="display: flex; gap: 30px; justify-content: center;">
          <div>
            <div style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin-bottom: 5px;">TOP SPEED</div>
            <div id="statTopSpeed" style="color: white; font-size: 24px; font-weight: 700;">125 MPH</div>
          </div>
          <div>
            <div style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin-bottom: 5px;">ACCEL</div>
            <div id="statAccel" style="color: white; font-size: 24px; font-weight: 700;">8/10</div>
          </div>
          <div>
            <div style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin-bottom: 5px;">HANDLING</div>
            <div id="statHandling" style="color: white; font-size: 24px; font-weight: 700;">6/10</div>
          </div>
        </div>
      </div>
      
      <div style="display: flex; gap: 20px; margin-bottom: 30px;">
        <button id="prevCarBtn" style="
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.2s;
        ">← PREVIOUS</button>
        
        <button id="nextCarBtn" style="
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.2s;
        ">NEXT →</button>
      </div>
      
      <button id="driveBtn" style="
        padding: 20px 60px;
        background: linear-gradient(135deg, #00ff88, #00ccff);
        border: none;
        border-radius: 50px;
        color: #000;
        font-size: 24px;
        font-weight: 700;
        letter-spacing: 2px;
        cursor: pointer;
        pointer-events: auto;
        transition: all 0.3s;
        box-shadow: 0 10px 40px rgba(0, 255, 136, 0.4);
      ">ENTER DRIVE MODE</button>
      
      <div style="color: rgba(255, 255, 255, 0.5); font-size: 13px; margin-top: 20px;">
        Arrow keys to browse • Enter to select
      </div>
    `;
    
    document.body.appendChild(garageUI);
    this.garageUI = garageUI;
    
    // Button event listeners
    document.getElementById('prevCarBtn').addEventListener('click', () => this.previousCar());
    document.getElementById('nextCarBtn').addEventListener('click', () => this.nextCar());
    document.getElementById('driveBtn').addEventListener('click', () => this.startDriving());
    
    // Keyboard controls
    this.setupKeyboardControls();
  }
  
  setupKeyboardControls() {
    this.keyHandler = (e) => {
      if (!this.isActive) return;
      
      if (e.key === 'ArrowLeft') {
        this.previousCar();
      } else if (e.key === 'ArrowRight') {
        this.nextCar();
      } else if (e.key === 'Enter') {
        this.startDriving();
      }
    };
    
    window.addEventListener('keydown', this.keyHandler);
  }
  
  previousCar() {
    this.selectedCarIndex = (this.selectedCarIndex - 1 + this.cars.length) % this.cars.length;
    this.updateCarDisplay();
  }
  
  nextCar() {
    this.selectedCarIndex = (this.selectedCarIndex + 1) % this.cars.length;
    this.updateCarDisplay();
  }
  
  updateCarDisplay() {
    // Hide all cars
    this.carModels.forEach(model => model.visible = false);
    
    // Show selected car
    this.carModels[this.selectedCarIndex].visible = true;
    
    // Update UI
    const car = this.cars[this.selectedCarIndex];
    document.getElementById('carName').textContent = car.name;
    document.getElementById('carDescription').textContent = car.description;
    document.getElementById('statTopSpeed').textContent = `${car.stats.topSpeed} MPH`;
    document.getElementById('statAccel').textContent = `${car.stats.accel}/10`;
    document.getElementById('statHandling').textContent = `${car.stats.handling}/10`;
  }
  
  startDriving() {
    console.log(`🚗 Selected vehicle: ${this.cars[this.selectedCarIndex].name}`);
    
    // Save selection
    const selectedProfile = this.cars[this.selectedCarIndex].id;
    localStorage.setItem('selectedVehicle', selectedProfile);
    
    // Trigger callback to main game
    if (this.onStartDriving) {
      this.onStartDriving(selectedProfile);
    }
  }
  
  show() {
    this.isActive = true;
    this.garageUI.style.display = 'flex';
    this.updateCarDisplay();
  }
  
  hide() {
    this.isActive = false;
    this.garageUI.style.display = 'none';
  }
  
  update(deltaTime) {
    if (!this.isActive) return;
    
    // Rotate turntable slowly
    if (this.turntable) {
      this.turntable.rotation.y += deltaTime * 0.3;
    }
    
    // Rotate selected car
    const selectedCar = this.carModels[this.selectedCarIndex];
    if (selectedCar) {
      selectedCar.rotation.y += deltaTime * 0.5;
    }
  }
  
  destroy() {
    if (this.garageUI && this.garageUI.parentNode) {
      this.garageUI.parentNode.removeChild(this.garageUI);
    }
    window.removeEventListener('keydown', this.keyHandler);
  }
}
