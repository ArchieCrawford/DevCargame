import * as THREE from 'three';

/**
 * AI Traffic System - Vehicles driving autonomously on Jefferson Ave
 */
export class TrafficSystem {
  constructor(scene) {
    this.scene = scene;
    this.vehicles = [];
    this.vehiclePool = [];
    
    // Traffic configuration
    this.config = {
      maxVehicles: 15,
      spawnInterval: 3000, // 3 seconds between spawns
      minSpeed: 15,
      maxSpeed: 30,
      lanes: [
        { x: -10, direction: 1 },  // Right lane, northbound
        { x: -6, direction: 1 },   // Left lane, northbound
        { x: 6, direction: -1 },   // Left lane, southbound
        { x: 10, direction: -1 }   // Right lane, southbound
      ]
    };
    
    this.lastSpawnTime = 0;
    
    // Create vehicle materials
    this.createMaterials();
    
    // Start spawning
    console.log('🚗 Traffic system initialized');
  }
  
  createMaterials() {
    // Various car colors
    this.carColors = [
      0xff0000, // Red
      0x0000ff, // Blue
      0x000000, // Black
      0xffffff, // White
      0x808080, // Gray
      0xffff00, // Yellow
      0x00ff00, // Green
      0x800080, // Purple
      0xffa500, // Orange
      0xc0c0c0  // Silver
    ];
  }
  
  createVehicle(lane, startZ, color) {
    // Create simple car geometry (box with wheels)
    const carGroup = new THREE.Group();
    
    // Car body
    const bodyGeometry = new THREE.BoxGeometry(1.8, 1.2, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.7,
      roughness: 0.3
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.8;
    body.castShadow = true;
    carGroup.add(body);
    
    // Cabin (top part)
    const cabinGeometry = new THREE.BoxGeometry(1.6, 0.8, 2.5);
    const cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
    cabin.position.set(0, 1.6, -0.3);
    cabin.castShadow = true;
    carGroup.add(cabin);
    
    // Windows (dark glass)
    const glassGeometry = new THREE.BoxGeometry(1.5, 0.7, 2.3);
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      transparent: true,
      opacity: 0.6,
      metalness: 0.9,
      roughness: 0.1
    });
    const glass = new THREE.Mesh(glassGeometry, glassMaterial);
    glass.position.set(0, 1.65, -0.3);
    carGroup.add(glass);
    
    // Wheels (simple cylinders)
    const wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.8
    });
    
    const wheelPositions = [
      { x: -0.8, z: 1.2 },  // Front left
      { x: 0.8, z: 1.2 },   // Front right
      { x: -0.8, z: -1.2 }, // Rear left
      { x: 0.8, z: -1.2 }   // Rear right
    ];
    
    const wheels = [];
    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos.x, 0.35, pos.z);
      wheel.castShadow = true;
      carGroup.add(wheel);
      wheels.push(wheel);
    });
    
    // Headlights
    const headlightGeometry = new THREE.CircleGeometry(0.15, 8);
    const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    
    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-0.5, 0.7, 2.01);
    carGroup.add(leftHeadlight);
    
    const rightHeadlight = leftHeadlight.clone();
    rightHeadlight.position.x = 0.5;
    carGroup.add(rightHeadlight);
    
    // Taillights
    const taillightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const leftTaillight = new THREE.Mesh(headlightGeometry, taillightMaterial);
    leftTaillight.position.set(-0.5, 0.7, -2.01);
    leftTaillight.rotation.y = Math.PI;
    carGroup.add(leftTaillight);
    
    const rightTaillight = leftTaillight.clone();
    rightTaillight.position.x = 0.5;
    carGroup.add(rightTaillight);
    
    // Position the car
    carGroup.position.set(lane.x, 0, startZ);
    
    // Rotate based on direction
    if (lane.direction < 0) {
      carGroup.rotation.y = Math.PI;
    }
    
    this.scene.add(carGroup);
    
    // Create vehicle data
    const vehicle = {
      mesh: carGroup,
      wheels: wheels,
      lane: lane,
      speed: this.config.minSpeed + Math.random() * (this.config.maxSpeed - this.config.minSpeed),
      targetSpeed: this.config.minSpeed + Math.random() * (this.config.maxSpeed - this.config.minSpeed),
      position: startZ,
      color: color,
      brakingDistance: 15,
      following: null // Vehicle ahead
    };
    
    return vehicle;
  }
  
  spawnVehicle() {
    if (this.vehicles.length >= this.config.maxVehicles) return;
    
    // Choose random lane
    const lane = this.config.lanes[Math.floor(Math.random() * this.config.lanes.length)];
    
    // Determine spawn position based on direction
    const startZ = lane.direction > 0 ? -100 : 1600; // Off-screen spawn
    
    // Choose random color
    const color = this.carColors[Math.floor(Math.random() * this.carColors.length)];
    
    // Check if spawn position is clear
    const isClear = !this.vehicles.some(v => {
      if (v.lane !== lane) return false;
      const distance = Math.abs(v.position - startZ);
      return distance < 30; // Minimum spawn distance
    });
    
    if (!isClear) return;
    
    // Create vehicle
    const vehicle = this.createVehicle(lane, startZ, color);
    this.vehicles.push(vehicle);
    
    console.log('🚙 Vehicle spawned in lane', lane.x, '| Total:', this.vehicles.length);
  }
  
  update(deltaTime, playerPosition) {
    const currentTime = Date.now();
    
    // Spawn new vehicles periodically
    if (currentTime - this.lastSpawnTime > this.config.spawnInterval) {
      this.spawnVehicle();
      this.lastSpawnTime = currentTime;
    }
    
    // Update each vehicle
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const vehicle = this.vehicles[i];
      
      // Find vehicle ahead in same lane
      vehicle.following = this.findVehicleAhead(vehicle);
      
      // Adjust speed based on vehicle ahead
      if (vehicle.following) {
        const distance = Math.abs(vehicle.following.position - vehicle.position);
        
        if (distance < vehicle.brakingDistance) {
          // Slow down to match speed of vehicle ahead
          vehicle.targetSpeed = Math.min(vehicle.following.speed * 0.8, vehicle.speed);
        } else {
          // Resume normal speed
          vehicle.targetSpeed = this.config.minSpeed + Math.random() * (this.config.maxSpeed - this.config.minSpeed);
        }
      }
      
      // Smooth speed transitions
      const speedDiff = vehicle.targetSpeed - vehicle.speed;
      vehicle.speed += speedDiff * deltaTime * 2;
      
      // Move vehicle
      vehicle.position += vehicle.lane.direction * vehicle.speed * deltaTime;
      vehicle.mesh.position.z = vehicle.position;
      
      // Rotate wheels
      const wheelRotation = vehicle.speed * deltaTime * 0.5;
      vehicle.wheels.forEach(wheel => {
        wheel.rotation.x += wheelRotation * vehicle.lane.direction;
      });
      
      // Remove vehicles that are too far off-screen
      const isOutOfBounds = (vehicle.lane.direction > 0 && vehicle.position > 1700) ||
                           (vehicle.lane.direction < 0 && vehicle.position < -200);
      
      if (isOutOfBounds) {
        this.scene.remove(vehicle.mesh);
        this.vehicles.splice(i, 1);
        console.log('🚗 Vehicle despawned | Total:', this.vehicles.length);
      }
    }
  }
  
  findVehicleAhead(vehicle) {
    let closest = null;
    let closestDistance = Infinity;
    
    for (const other of this.vehicles) {
      if (other === vehicle) continue;
      if (other.lane !== vehicle.lane) continue;
      
      // Check if other vehicle is ahead
      const isAhead = vehicle.lane.direction > 0 
        ? other.position > vehicle.position
        : other.position < vehicle.position;
      
      if (!isAhead) continue;
      
      const distance = Math.abs(other.position - vehicle.position);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = other;
      }
    }
    
    return closest;
  }
  
  // Check collision with player
  checkCollision(playerPosition, playerRadius = 3) {
    for (const vehicle of this.vehicles) {
      const dx = playerPosition.x - vehicle.mesh.position.x;
      const dz = playerPosition.z - vehicle.mesh.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);
      
      if (distance < playerRadius + 2) { // Vehicle radius ~2
        return vehicle;
      }
    }
    
    return null;
  }
  
  // Get all vehicles for potential collision system
  getVehicles() {
    return this.vehicles;
  }
  
  // Clear all traffic (useful for reset)
  clear() {
    this.vehicles.forEach(vehicle => {
      this.scene.remove(vehicle.mesh);
    });
    this.vehicles = [];
    console.log('🚦 Traffic cleared');
  }
}
