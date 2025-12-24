import * as THREE from 'three';

/**
 * Pedestrian System for Jefferson Ave
 * Manages pedestrians walking on sidewalks
 */
export class PedestrianSystem {
  constructor(scene) {
    this.scene = scene;
    this.pedestrians = [];
    this.maxPedestrians = 25; // Total pedestrians in scene
    this.spawnInterval = 4000; // Spawn new pedestrian every 4 seconds
    this.lastSpawnTime = 0;
    
    // Sidewalk paths configuration (both sides of Jefferson Ave)
    this.sidewalkPaths = [
      { side: 'west', x: -22, direction: 1 },  // West sidewalk, walking north
      { side: 'west', x: -22, direction: -1 }, // West sidewalk, walking south
      { side: 'east', x: 22, direction: 1 },   // East sidewalk, walking north
      { side: 'east', x: 22, direction: -1 }   // East sidewalk, walking south
    ];
    
    // Materials for variety
    this.materials = this.createMaterials();
    
    // Spawn initial pedestrians
    this.spawnInitialPedestrians();
    
    console.log('🚶 Pedestrian system initialized');
  }
  
  createMaterials() {
    // Create a variety of shirt/jacket colors for pedestrians
    const colors = [
      0x1a5fb4, // Blue
      0x26a269, // Green
      0xe01b24, // Red
      0xf6d32d, // Yellow
      0x9141ac, // Purple
      0xff7800, // Orange
      0x3d3846, // Dark gray
      0xc0bfbc, // Light gray
      0x865e3c, // Brown
      0x2ec27e  // Teal
    ];
    
    return colors.map(color => new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.1
    }));
  }
  
  createPedestrianModel() {
    const pedestrianGroup = new THREE.Group();
    
    // Select random color
    const material = this.materials[Math.floor(Math.random() * this.materials.length)];
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xfdbcb4,
      roughness: 0.9
    });
    const pantsMaterial = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0x2a2a3a : 0x4a4a5a,
      roughness: 0.8
    });
    
    // Body (torso)
    const torsoGeometry = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
    const torso = new THREE.Mesh(torsoGeometry, material);
    torso.position.y = 1.2;
    torso.castShadow = true;
    pedestrianGroup.add(torso);
    
    // Head
    const headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.y = 1.9;
    head.castShadow = true;
    pedestrianGroup.add(head);
    
    // Legs (simplified as two capsules)
    const legGeometry = new THREE.CapsuleGeometry(0.12, 0.6, 4, 8);
    
    const leftLeg = new THREE.Mesh(legGeometry, pantsMaterial);
    leftLeg.position.set(-0.15, 0.5, 0);
    leftLeg.castShadow = true;
    pedestrianGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, pantsMaterial);
    rightLeg.position.set(0.15, 0.5, 0);
    rightLeg.castShadow = true;
    pedestrianGroup.add(rightLeg);
    
    // Arms (simplified)
    const armGeometry = new THREE.CapsuleGeometry(0.08, 0.5, 4, 8);
    
    const leftArm = new THREE.Mesh(armGeometry, material);
    leftArm.position.set(-0.4, 1.2, 0);
    leftArm.rotation.z = 0.3;
    leftArm.castShadow = true;
    pedestrianGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, material);
    rightArm.position.set(0.4, 1.2, 0);
    rightArm.rotation.z = -0.3;
    rightArm.castShadow = true;
    pedestrianGroup.add(rightArm);
    
    // Store references for animation
    pedestrianGroup.userData = {
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      animationPhase: Math.random() * Math.PI * 2 // Random starting phase
    };
    
    return pedestrianGroup;
  }
  
  spawnPedestrian(zPosition = null) {
    if (this.pedestrians.length >= this.maxPedestrians) {
      return null;
    }
    
    // Select random path
    const path = this.sidewalkPaths[Math.floor(Math.random() * this.sidewalkPaths.length)];
    
    // Random spawn position along corridor (if not specified)
    const spawnZ = zPosition !== null ? zPosition : Math.random() * 1500;
    
    // Create pedestrian model
    const model = this.createPedestrianModel();
    model.position.set(path.x, 0, spawnZ);
    
    // Face walking direction
    if (path.direction === 1) {
      model.rotation.y = 0; // Walking north
    } else {
      model.rotation.y = Math.PI; // Walking south
    }
    
    this.scene.add(model);
    
    // Random walking speed (slower than traffic)
    const speed = 1.5 + Math.random() * 1.0; // 1.5-2.5 units/sec (~3-5 MPH walking)
    
    const pedestrian = {
      model,
      path,
      speed,
      direction: path.direction,
      active: true
    };
    
    this.pedestrians.push(pedestrian);
    return pedestrian;
  }
  
  spawnInitialPedestrians() {
    // Distribute pedestrians along the corridor
    const segmentCount = 8;
    const segmentLength = 1500 / segmentCount;
    
    for (let i = 0; i < segmentCount; i++) {
      const segmentCenter = i * segmentLength + segmentLength / 2;
      // 2-4 pedestrians per segment
      const count = 2 + Math.floor(Math.random() * 3);
      
      for (let j = 0; j < count; j++) {
        const z = segmentCenter + (Math.random() - 0.5) * segmentLength * 0.8;
        this.spawnPedestrian(z);
      }
    }
  }
  
  animatePedestrian(pedestrian, deltaTime) {
    const { model, speed } = pedestrian;
    const userData = model.userData;
    
    // Update animation phase based on speed
    userData.animationPhase += speed * deltaTime * 3;
    
    // Animate legs (walking cycle)
    const legSwing = Math.sin(userData.animationPhase) * 0.4;
    userData.leftLeg.rotation.x = legSwing;
    userData.rightLeg.rotation.x = -legSwing;
    
    // Animate arms (opposite to legs)
    const armSwing = Math.sin(userData.animationPhase) * 0.3;
    userData.leftArm.rotation.x = -armSwing;
    userData.rightArm.rotation.x = armSwing;
    
    // Subtle body bob
    const bob = Math.abs(Math.sin(userData.animationPhase * 2)) * 0.05;
    model.position.y = bob;
  }
  
  update(deltaTime, playerPosition) {
    const currentTime = Date.now();
    
    // Update existing pedestrians
    for (let i = this.pedestrians.length - 1; i >= 0; i--) {
      const pedestrian = this.pedestrians[i];
      const { model, speed, direction } = pedestrian;
      
      // Move pedestrian along path
      model.position.z += speed * direction * deltaTime;
      
      // Animate walking
      this.animatePedestrian(pedestrian, deltaTime);
      
      // Remove if too far from player or out of corridor bounds
      const distanceFromPlayer = Math.abs(model.position.z - playerPosition.z);
      const outOfBounds = model.position.z < -50 || model.position.z > 1550;
      
      if (distanceFromPlayer > 300 || outOfBounds) {
        this.scene.remove(model);
        this.pedestrians.splice(i, 1);
      }
    }
    
    // Spawn new pedestrians periodically
    if (currentTime - this.lastSpawnTime > this.spawnInterval) {
      // Spawn near player position (within visible range)
      const spawnAhead = playerPosition.z + 100 + Math.random() * 100;
      const spawnBehind = playerPosition.z - 100 - Math.random() * 100;
      
      // Spawn one ahead and one behind randomly
      if (Math.random() > 0.5 && spawnAhead < 1500) {
        this.spawnPedestrian(spawnAhead);
      } else if (spawnBehind > 0) {
        this.spawnPedestrian(spawnBehind);
      }
      
      this.lastSpawnTime = currentTime;
    }
  }
  
  getPedestrians() {
    return this.pedestrians;
  }
  
  destroy() {
    this.pedestrians.forEach(pedestrian => {
      this.scene.remove(pedestrian.model);
    });
    this.pedestrians = [];
  }
}
