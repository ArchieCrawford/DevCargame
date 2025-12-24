import * as THREE from 'three';

export class City {
  constructor(scene) {
    this.scene = scene;
    this.collisionObjects = [];
    this.createCity();
  }
  
  createCity() {
    // Ground - large city floor
    const groundGeometry = new THREE.PlaneGeometry(500, 500);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.1
    });
    
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);
    
    // Roads
    this.createRoads();
    
    // Buildings
    this.createBuildings();
    
    // Street lights
    this.createStreetLights();
    
    // Traffic lights
    this.createTrafficLights();
    
    // City props
    this.createCityProps();
  }
  
  createRoads() {
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.8,
      metalness: 0.1
    });
    
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00
    });
    
    // Main road (north-south) - exits showroom
    const mainRoadGeometry = new THREE.PlaneGeometry(20, 300);
    const mainRoad = new THREE.Mesh(mainRoadGeometry, roadMaterial);
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.y = 0.01;
    mainRoad.position.z = 100; // Extends forward from showroom
    mainRoad.receiveShadow = true;
    this.scene.add(mainRoad);
    
    // Road lines on main road
    for (let i = -120; i < 320; i += 8) {
      const lineGeometry = new THREE.PlaneGeometry(0.3, 4);
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.02, i);
      this.scene.add(line);
    }
    
    // Cross street 1 (east-west)
    const crossRoad1Geometry = new THREE.PlaneGeometry(150, 20);
    const crossRoad1 = new THREE.Mesh(crossRoad1Geometry, roadMaterial);
    crossRoad1.rotation.x = -Math.PI / 2;
    crossRoad1.position.set(0, 0.01, 80);
    crossRoad1.receiveShadow = true;
    this.scene.add(crossRoad1);
    
    // Cross street 2
    const crossRoad2 = crossRoad1.clone();
    crossRoad2.position.z = 160;
    this.scene.add(crossRoad2);
    
    // Sidewalks
    this.createSidewalks();
  }
  
  createSidewalks() {
    const sidewalkMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.9,
      metalness: 0.0
    });
    
    // Left sidewalk along main road
    const sidewalkGeometry = new THREE.BoxGeometry(4, 0.2, 300);
    const leftSidewalk = new THREE.Mesh(sidewalkGeometry, sidewalkMaterial);
    leftSidewalk.position.set(-12, 0.1, 100);
    leftSidewalk.receiveShadow = true;
    this.scene.add(leftSidewalk);
    
    // Add collision
    this.collisionObjects.push({ x: -12, z: 100, radius: 2 });
    
    // Right sidewalk
    const rightSidewalk = leftSidewalk.clone();
    rightSidewalk.position.x = 12;
    this.scene.add(rightSidewalk);
    
    this.collisionObjects.push({ x: 12, z: 100, radius: 2 });
  }
  
  createBuildings() {
    const buildingMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.7, metalness: 0.3 }),
      new THREE.MeshStandardMaterial({ color: 0x505050, roughness: 0.6, metalness: 0.4 }),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8, metalness: 0.2 })
    ];
    
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      metalness: 0.1,
      roughness: 0.1,
      transparent: true,
      opacity: 0.4
    });
    
    // Building configurations: { x, z, width, depth, height }
    const buildings = [
      // Left side of main road
      { x: -40, z: 40, width: 30, depth: 25, height: 25 },
      { x: -40, z: 100, width: 30, depth: 35, height: 35 },
      { x: -45, z: 170, width: 35, depth: 30, height: 20 },
      { x: -40, z: 230, width: 25, depth: 25, height: 30 },
      
      // Right side of main road
      { x: 40, z: 40, width: 30, depth: 25, height: 30 },
      { x: 40, z: 100, width: 35, depth: 30, height: 25 },
      { x: 45, z: 170, width: 30, depth: 35, height: 40 },
      { x: 40, z: 230, width: 30, depth: 25, height: 28 }
    ];
    
    buildings.forEach((config, index) => {
      const material = buildingMaterials[index % buildingMaterials.length];
      
      // Main building body
      const geometry = new THREE.BoxGeometry(config.width, config.height, config.depth);
      const building = new THREE.Mesh(geometry, material);
      building.position.set(config.x, config.height / 2, config.z);
      building.castShadow = true;
      building.receiveShadow = true;
      this.scene.add(building);
      
      // Add windows
      const windowRows = Math.floor(config.height / 3);
      const windowCols = Math.floor(config.width / 3);
      
      for (let row = 0; row < windowRows; row++) {
        for (let col = 0; col < windowCols; col++) {
          const windowGeometry = new THREE.PlaneGeometry(1.5, 2);
          const window = new THREE.Mesh(windowGeometry, glassMaterial);
          window.position.set(
            config.x - config.width / 2 + 0.1 + col * 3,
            3 + row * 3,
            config.z + config.depth / 2 + 0.1
          );
          this.scene.add(window);
        }
      }
      
      // Add collision
      this.collisionObjects.push({
        x: config.x,
        z: config.z,
        radius: Math.max(config.width, config.depth) / 2 + 2
      });
    });
  }
  
  createStreetLights() {
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.7,
      roughness: 0.3
    });
    
    const lightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffaa
    });
    
    // Reduced street lights - only key positions
    const lightPositions = [
      { x: -15, z: 40 },
      { x: 15, z: 40 },
      { x: -15, z: 120 },
      { x: 15, z: 120 },
      { x: -15, z: 200 },
      { x: 15, z: 200 }
    ];
    
    lightPositions.forEach(pos => {
      this.createStreetLight(pos.x, pos.z, poleMaterial, lightMaterial);
    });
  }
  
  createStreetLight(x, z, poleMaterial, lightMaterial) {
    // Pole
    const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, 4, z);
    pole.castShadow = false; // Disable shadow to save performance
    this.scene.add(pole);
    
    // Light fixture (emissive mesh instead of point light)
    const fixtureGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const fixture = new THREE.Mesh(fixtureGeometry, lightMaterial);
    fixture.position.set(x, 8, z);
    this.scene.add(fixture);
    
    // No individual point lights - will use ambient/directional instead
  }
  
  createTrafficLights() {
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      metalness: 0.7,
      roughness: 0.3
    });
    
    // Traffic light at intersection 1
    this.createTrafficLightPole(-10, 80, poleMaterial);
    this.createTrafficLightPole(10, 80, poleMaterial);
    
    // Traffic light at intersection 2
    this.createTrafficLightPole(-10, 160, poleMaterial);
    this.createTrafficLightPole(10, 160, poleMaterial);
  }
  
  createTrafficLightPole(x, z, poleMaterial) {
    // Pole
    const poleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 5, 8);
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(x, 2.5, z);
    this.scene.add(pole);
    
    // Light box
    const boxGeometry = new THREE.BoxGeometry(0.4, 1.2, 0.3);
    const box = new THREE.Mesh(boxGeometry, poleMaterial);
    box.position.set(x, 5.5, z);
    this.scene.add(box);
    
    // Lights (red, yellow, green)
    const greenMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const lightGeometry = new THREE.CircleGeometry(0.15, 16);
    
    const greenLight = new THREE.Mesh(lightGeometry, greenMaterial);
    greenLight.position.set(x, 5.1, z + 0.16);
    this.scene.add(greenLight);
  }
  
  createCityProps() {
    // Add some urban props - benches, trash cans, etc.
    const propMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a4a4a,
      roughness: 0.8,
      metalness: 0.2
    });
    
    // Benches along sidewalks
    for (let z = 30; z < 200; z += 40) {
      // Left bench
      const benchGeometry = new THREE.BoxGeometry(2, 0.5, 0.8);
      const bench = new THREE.Mesh(benchGeometry, propMaterial);
      bench.position.set(-14, 0.4, z);
      bench.castShadow = true;
      this.scene.add(bench);
      
      // Right bench
      const bench2 = bench.clone();
      bench2.position.x = 14;
      this.scene.add(bench2);
    }
  }
  
  getCollisionObjects() {
    return this.collisionObjects;
  }
}
