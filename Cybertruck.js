import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CONFIG } from './config.js';

export class Cybertruck {
  constructor(scene, vehicleProfile = 'cybertruck') {
    this.scene = scene;
    this.group = new THREE.Group();
    
    // Load vehicle profile
    this.profile = CONFIG.vehicles[vehicleProfile] || CONFIG.vehicles.cybertruck;
    console.log(`🚗 Loading vehicle profile: ${this.profile.name}`);
    
    // Physics properties
    this.velocity = new THREE.Vector3();
    this.speed = 0;
    this.rotation = Math.PI; // Face forward (toward +Z)
    
    this.model = null;
    this.wheels = [];
    this.headlights = [];
    this.isLoaded = false;
    
    // Create a simple placeholder first so truck exists immediately
    this.createPlaceholder();
    
    this.loadModel();
    scene.add(this.group);
  }
  
  setVehicleProfile(profileName) {
    const newProfile = CONFIG.vehicles[profileName];
    if (newProfile) {
      this.profile = newProfile;
      console.log(`🚗 Switched to vehicle profile: ${this.profile.name}`);
    }
  }
  
  createPlaceholder() {
    // Temporary placeholder until model loads
    const placeholderMaterial = new THREE.MeshStandardMaterial({
      color: 0xc0c0c0,
      metalness: 0.9,
      roughness: 0.2
    });
    
    const placeholderGeometry = new THREE.BoxGeometry(2.4, 1.5, 5);
    this.placeholder = new THREE.Mesh(placeholderGeometry, placeholderMaterial);
    this.placeholder.position.y = 0.75;
    this.placeholder.castShadow = true;
    this.group.add(this.placeholder);
  }
  
  loadModel() {
    const loader = new GLTFLoader();
    const modelUrl = this.profile.modelUrl || 'https://rosebud.ai/assets/cybertruck-meshy-final.glb?ZlnI';
    
    loader.load(
      modelUrl,
      (gltf) => {
        this.model = gltf.scene;
        
        // Apply materials and setup
        this.model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Enhance materials
            if (child.material) {
              child.material.metalness = Math.max(child.material.metalness || 0, 0.7);
              child.material.roughness = Math.min(child.material.roughness || 1, 0.3);
            }
          }
        });
        
        // Scale and position the model appropriately
        const box = new THREE.Box3().setFromObject(this.model);
        const size = box.getSize(new THREE.Vector3());
        const baseScale = 2.5 / size.length(); // Normalize to reasonable size
        const finalScale = baseScale * (this.profile.scale || 1.0);
        this.model.scale.setScalar(finalScale);
        
        // Center the model
        const center = box.getCenter(new THREE.Vector3());
        this.model.position.set(-center.x * finalScale, -box.min.y * finalScale, -center.z * finalScale);
        
        // Remove placeholder
        if (this.placeholder) {
          this.group.remove(this.placeholder);
          this.placeholder = null;
        }
        
        this.group.add(this.model);
        
        // Add headlights
        this.addHeadlights();
        
        this.isLoaded = true;
        console.log(`${this.profile.name} model loaded successfully!`);
      },
      (progress) => {
        if (progress.total > 0) {
          console.log(`Loading ${this.profile.name}:`, (progress.loaded / progress.total * 100).toFixed(0) + '%');
        }
      },
      (error) => {
        console.error(`Error loading ${this.profile.name} model:`, error);
        console.log('Using placeholder geometry');
        this.isLoaded = true; // Allow movement with placeholder
      }
    );
  }
  
  addHeadlights() {
    // Add spot lights for headlights (reduced intensity and no shadows to save performance)
    const leftLight = new THREE.SpotLight(0xffffee, 1.5, 40, Math.PI / 8, 0.5);
    leftLight.position.set(1, 0.8, 2.5);
    leftLight.target.position.set(1, 0, 10);
    leftLight.castShadow = false; // Disable shadows for headlights
    this.group.add(leftLight);
    this.group.add(leftLight.target);
    this.headlights.push(leftLight);
    
    const rightLight = new THREE.SpotLight(0xffffee, 1.5, 40, Math.PI / 8, 0.5);
    rightLight.position.set(-1, 0.8, 2.5);
    rightLight.target.position.set(-1, 0, 10);
    rightLight.castShadow = false; // Disable shadows for headlights
    this.group.add(rightLight);
    this.group.add(rightLight.target);
    this.headlights.push(rightLight);
    
    // Add emissive headlight meshes for visual effect
    const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    const headlightGeometry = new THREE.CircleGeometry(0.15, 8);
    
    const leftHeadlightMesh = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlightMesh.position.set(1, 0.8, 2.5);
    leftHeadlightMesh.rotation.y = Math.PI;
    this.group.add(leftHeadlightMesh);
    
    const rightHeadlightMesh = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlightMesh.position.set(-1, 0.8, 2.5);
    rightHeadlightMesh.rotation.y = Math.PI;
    this.group.add(rightHeadlightMesh);
  }
  
  createFallbackTruck() {
    // Note: Placeholder is already created in constructor
    // Just enable headlights
    this.addHeadlights();
    this.isLoaded = true;
  }
  
  update(deltaTime, input, collisionObjects = []) {
    // Guard: Only update if in drive mode
    if (!input || !input.isDriveMode) {
      return;
    }
    
    // Use vehicle profile for physics
    const { acceleration, maxSpeed, turnSpeed, friction, brakeFriction } = this.profile;
    
    // Debug: Log input when receiving commands
    if (input.forward || input.backward || input.left || input.right) {
      console.log('🚗 Cybertruck.update() received input:', {
        forward: input.forward,
        backward: input.backward,
        left: input.left,
        right: input.right,
        brake: input.brake,
        currentSpeed: this.speed.toFixed(2)
      });
    }
    
    // Acceleration/Braking
    if (input.forward) {
      this.speed += acceleration * deltaTime;
      console.log('⚡ Accelerating! Speed:', this.speed.toFixed(2));
    } else if (input.backward) {
      this.speed -= acceleration * deltaTime * 0.6;
      console.log('⏪ Reversing! Speed:', this.speed.toFixed(2));
    } else {
      // Natural friction
      this.speed *= friction;
    }
    
    // Brake (Space or Shift)
    if (input.brake) {
      this.speed *= brakeFriction;
      console.log('🛑 Braking! Speed:', this.speed.toFixed(2));
    }
    
    // Clamp speed
    this.speed = Math.max(-maxSpeed * 0.5, Math.min(maxSpeed, this.speed));
    
    // Turning (only when moving)
    if (Math.abs(this.speed) > 0.1) {
      if (input.left) {
        this.rotation += turnSpeed * Math.abs(this.speed) / maxSpeed;
      }
      if (input.right) {
        this.rotation -= turnSpeed * Math.abs(this.speed) / maxSpeed;
      }
    }
    
    // Calculate new position
    const moveX = Math.sin(this.rotation) * this.speed * deltaTime;
    const moveZ = Math.cos(this.rotation) * this.speed * deltaTime;
    
    const newX = this.group.position.x + moveX;
    const newZ = this.group.position.z + moveZ;
    
    // Simple collision detection
    let canMove = true;
    const truckRadius = 3; // Collision radius

    for (const obj of collisionObjects) {
      // Support both circle-collision objects ({x,z,radius}) and THREE objects
      let cx;
      let cz;
      let cr;

      if (obj && typeof obj.x === 'number' && typeof obj.z === 'number' && typeof obj.radius === 'number') {
        cx = obj.x;
        cz = obj.z;
        cr = obj.radius;
      } else if (obj && obj.position && typeof obj.position.x === 'number' && typeof obj.position.z === 'number') {
        cx = obj.position.x;
        cz = obj.position.z;
        cr = (obj.userData && (obj.userData.collisionRadius ?? obj.userData.radius)) ?? 0;
      } else {
        continue;
      }

      // Ignore invalid radii
      if (!Number.isFinite(cr) || cr <= 0) continue;

      const dx = newX - cx;
      const dz = newZ - cz;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < truckRadius + cr) {
        canMove = false;
        this.speed *= 0.5; // Slow down on collision
        break;
      }
    }
    
    // Update position if no collision
    if (canMove) {
      this.group.position.x = newX;
      this.group.position.z = newZ;
    }
    
    this.group.rotation.y = this.rotation;
    
    // Update headlight targets to point forward
    this.headlights.forEach((light) => {
      const forward = new THREE.Vector3(
        Math.sin(this.rotation) * 10,
        0,
        Math.cos(this.rotation) * 10
      );
      light.target.position.copy(this.group.position).add(forward);
    });
    
    // Small amount of friction to eventually stop
    if (Math.abs(this.speed) < 0.05) {
      this.speed = 0;
    }
  }
  
  getPosition() {
    return this.group.position;
  }
  
  getRotation() {
    return this.rotation;
  }
}
