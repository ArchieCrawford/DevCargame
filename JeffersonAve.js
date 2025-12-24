import * as THREE from 'three';

/**
 * Jefferson Ave Corridor - Newport News, VA
 * Inspired by the stretch from I-64 Kiln Creek exit to Walmart area
 * ~4-5 miles of drivable road with landmarks
 */
export class JeffersonAve {
  constructor(scene) {
    this.scene = scene;
    this.collisionObjects = [];
    this.landmarks = [];
    this.intersections = [];
    this.streetLights = [];
    
    // Materials cache for performance
    this.materials = this.createMaterials();
    
    // Instanced meshes for performance
    this.instancedMeshes = {};
    
    this.buildCorridor();
  }
  
  createMaterials() {
    return {
      road: new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.9,
        metalness: 0.1
      }),
      roadLine: new THREE.MeshBasicMaterial({
        color: 0xffff00
      }),
      sidewalk: new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.9
      }),
      building: new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.7,
        metalness: 0.2
      }),
      walmart: new THREE.MeshStandardMaterial({
        color: 0x1a4f9a, // Walmart blue
        roughness: 0.6
      }),
      starbucks: new THREE.MeshStandardMaterial({
        color: 0x00754a, // Starbucks green
        roughness: 0.7
      }),
      parking: new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        roughness: 0.8
      })
    };
  }
  
  buildCorridor() {
    // Main Jefferson Ave (north to south, ~5 miles)
    this.createMainRoad();
    
    // Landmarks (south to north)
    this.createWalmartComplex(0, 1200); // ~2.5 miles south
    this.createStarbucksPlaza(0, 800);  // ~1.7 miles south
    this.createShoppingCenter(-150, 400); // ~0.8 miles south
    this.createGasStation(120, 600);
    this.createFastFoodRow(-100, 200);
    
    // Intersections with cross streets
    this.createIntersection('Kiln Creek Pkwy', 0, 50);
    this.createIntersection('Warwick Blvd', 0, 400);
    this.createIntersection('City Center Blvd', 0, 800);
    this.createIntersection('Walmart Way', 0, 1200);
    
    // Environmental details
    this.addStreetInfrastructure();
    this.addVegetation();
    
    console.log('🏙️ Jefferson Ave corridor built with', this.landmarks.length, 'landmarks');
  }
  
  createMainRoad() {
    const roadWidth = 35; // 4 lanes + center turn lane
    const roadLength = 1500; // ~3 miles
    const centerZ = roadLength / 2;
    
    // Main road surface
    const roadGeometry = new THREE.PlaneGeometry(roadWidth, roadLength, 1, 100);
    const road = new THREE.Mesh(roadGeometry, this.materials.road);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01;
    road.position.z = centerZ;
    road.receiveShadow = true;
    this.scene.add(road);
    
    // Lane markings (dotted lines)
    this.createLaneMarkings(roadWidth, roadLength, centerZ);
    
    // Sidewalks on both sides
    this.createSidewalks(roadWidth, roadLength, centerZ);
  }
  
  createLaneMarkings(roadWidth, roadLength, centerZ) {
    const lineWidth = 0.15;
    const dashLength = 3;
    const gapLength = 6;
    
    // Center double yellow lines
    for (let z = 0; z < roadLength; z += dashLength + gapLength) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(lineWidth * 2, dashLength),
        new THREE.MeshBasicMaterial({ color: 0xffff00 })
      );
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.02, z + centerZ - roadLength / 2);
      this.scene.add(line);
    }
    
    // Lane dividers (white dashed)
    const lanePositions = [-8, 8]; // Left and right of center
    lanePositions.forEach(xPos => {
      for (let z = 0; z < roadLength; z += dashLength + gapLength) {
        const line = new THREE.Mesh(
          new THREE.PlaneGeometry(lineWidth, dashLength),
          new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })
        );
        line.rotation.x = -Math.PI / 2;
        line.position.set(xPos, 0.02, z + centerZ - roadLength / 2);
        this.scene.add(line);
      }
    });
  }
  
  createSidewalks(roadWidth, roadLength, centerZ) {
    const sidewalkWidth = 3;
    const sidewalkHeight = 0.15;
    
    // Left sidewalk
    const leftSidewalk = new THREE.Mesh(
      new THREE.BoxGeometry(sidewalkWidth, sidewalkHeight, roadLength),
      this.materials.sidewalk
    );
    leftSidewalk.position.set(-roadWidth / 2 - sidewalkWidth / 2, sidewalkHeight / 2, centerZ);
    leftSidewalk.receiveShadow = true;
    this.scene.add(leftSidewalk);
    
    // Right sidewalk
    const rightSidewalk = leftSidewalk.clone();
    rightSidewalk.position.x = roadWidth / 2 + sidewalkWidth / 2;
    this.scene.add(rightSidewalk);
    
    // Collision for sidewalks
    this.collisionObjects.push(
      { x: -roadWidth / 2 - sidewalkWidth / 2, z: centerZ, radius: sidewalkWidth },
      { x: roadWidth / 2 + sidewalkWidth / 2, z: centerZ, radius: sidewalkWidth }
    );
  }
  
  createWalmartComplex(x, z) {
    // Massive Walmart building (typical dimensions)
    const walmartWidth = 80;
    const walmartDepth = 60;
    const walmartHeight = 12;
    
    const walmart = new THREE.Mesh(
      new THREE.BoxGeometry(walmartWidth, walmartHeight, walmartDepth),
      this.materials.walmart
    );
    walmart.position.set(x + 60, walmartHeight / 2, z);
    walmart.castShadow = true;
    walmart.receiveShadow = true;
    this.scene.add(walmart);
    
    // Walmart sign text (simple geometry)
    this.createSign('WALMART', x + 60, walmartHeight + 3, z - walmartDepth / 2 - 2, 0x0071ce);
    
    // Large parking lot
    this.createParkingLot(x + 60, z + 40, 120, 80);
    
    // Garden center annex
    const gardenCenter = new THREE.Mesh(
      new THREE.BoxGeometry(20, 8, 30),
      this.materials.walmart
    );
    gardenCenter.position.set(x + 110, 4, z);
    gardenCenter.castShadow = true;
    this.scene.add(gardenCenter);
    
    // Collision
    this.collisionObjects.push({ x: x + 60, z: z, radius: 50 });
    
    // Register landmark
    this.landmarks.push({
      name: 'Walmart Supercenter',
      type: 'walmart',
      position: { x: x + 60, z: z },
      icon: '🛒'
    });
  }
  
  createStarbucksPlaza(x, z) {
    // Strip mall with Starbucks
    const plazaWidth = 60;
    const plazaDepth = 25;
    const plazaHeight = 8;
    
    const plaza = new THREE.Mesh(
      new THREE.BoxGeometry(plazaWidth, plazaHeight, plazaDepth),
      this.materials.building
    );
    plaza.position.set(x - 50, plazaHeight / 2, z);
    plaza.castShadow = true;
    plaza.receiveShadow = true;
    this.scene.add(plaza);
    
    // Starbucks section (corner unit)
    const starbucks = new THREE.Mesh(
      new THREE.BoxGeometry(12, plazaHeight + 1, plazaDepth),
      this.materials.starbucks
    );
    starbucks.position.set(x - 50 - plazaWidth / 2 + 6, plazaHeight / 2, z);
    starbucks.castShadow = true;
    this.scene.add(starbucks);
    
    // Starbucks sign
    this.createSign('STARBUCKS', x - 50 - plazaWidth / 2 + 6, plazaHeight + 2, z - plazaDepth / 2 - 1, 0x00754a);
    
    // Plaza parking lot
    this.createParkingLot(x - 50, z + 35, 70, 40);
    
    // Collision
    this.collisionObjects.push({ x: x - 50, z: z, radius: 35 });
    
    // Register landmark
    this.landmarks.push({
      name: 'Starbucks Coffee',
      type: 'starbucks',
      position: { x: x - 50, z: z },
      icon: '☕'
    });
  }
  
  createShoppingCenter(x, z) {
    // Generic shopping center
    const width = 50;
    const depth = 20;
    const height = 9;
    
    const building = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      this.materials.building
    );
    building.position.set(x, height / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    this.scene.add(building);
    
    // Colorful storefronts
    const stores = [
      { name: 'TARGET', color: 0xcc0000, offset: -15 },
      { name: 'BEST BUY', color: 0x0046be, offset: 0 },
      { name: 'KOHLS', color: 0x6b4e3d, offset: 15 }
    ];
    
    stores.forEach(store => {
      const storefront = new THREE.Mesh(
        new THREE.BoxGeometry(12, height, depth + 0.5),
        new THREE.MeshStandardMaterial({ color: store.color, roughness: 0.6 })
      );
      storefront.position.set(x + store.offset, height / 2, z);
      storefront.castShadow = true;
      this.scene.add(storefront);
      
      this.createSign(store.name, x + store.offset, height + 1.5, z - depth / 2 - 1, store.color);
    });
    
    // Parking lot
    this.createParkingLot(x, z + 30, 70, 35);
    
    // Collision
    this.collisionObjects.push({ x: x, z: z, radius: 30 });
    
    this.landmarks.push({
      name: 'City Center Shops',
      type: 'shopping',
      position: { x: x, z: z },
      icon: '🏬'
    });
  }
  
  createGasStation(x, z) {
    // Gas station canopy
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.5, 15),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.5 })
    );
    canopy.position.set(x, 5, z);
    canopy.castShadow = true;
    this.scene.add(canopy);
    
    // Support pillars
    for (let i = -1; i <= 1; i += 2) {
      for (let j = -1; j <= 1; j += 2) {
        const pillar = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4, 0.4, 5, 8),
          new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.7 })
        );
        pillar.position.set(x + i * 8, 2.5, z + j * 6);
        this.scene.add(pillar);
      }
    }
    
    // Convenience store
    const store = new THREE.Mesh(
      new THREE.BoxGeometry(12, 6, 10),
      this.materials.building
    );
    store.position.set(x + 15, 3, z);
    store.castShadow = true;
    this.scene.add(store);
    
    this.createSign('GAS', x, 6, z - 8, 0xff0000);
    
    this.collisionObjects.push({ x: x, z: z, radius: 15 });
  }
  
  createFastFoodRow(x, z) {
    // Typical fast food restaurants along the corridor
    const restaurants = [
      { name: 'MCDONALDS', color: 0xffc72c, xOff: -30 },
      { name: 'WENDYS', color: 0xe1251b, xOff: 0 },
      { name: 'CHICK-FIL-A', color: 0xe51837, xOff: 30 }
    ];
    
    restaurants.forEach(rest => {
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(15, 7, 12),
        new THREE.MeshStandardMaterial({ color: rest.color, roughness: 0.6 })
      );
      building.position.set(x + rest.xOff, 3.5, z);
      building.castShadow = true;
      this.scene.add(building);
      
      this.createSign(rest.name, x + rest.xOff, 8, z - 7, rest.color);
      this.createParkingLot(x + rest.xOff, z + 20, 25, 20);
      
      this.collisionObjects.push({ x: x + rest.xOff, z: z, radius: 12 });
    });
  }
  
  createParkingLot(x, z, width, depth) {
    const lot = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      this.materials.parking
    );
    lot.rotation.x = -Math.PI / 2;
    lot.position.set(x, 0.005, z);
    lot.receiveShadow = true;
    this.scene.add(lot);
    
    // Parking space lines (white)
    const spaceWidth = 2.5;
    const numSpaces = Math.floor(width / spaceWidth);
    
    for (let i = 0; i <= numSpaces; i++) {
      const line = new THREE.Mesh(
        new THREE.PlaneGeometry(0.1, depth * 0.8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
      );
      line.rotation.x = -Math.PI / 2;
      line.position.set(x - width / 2 + i * spaceWidth, 0.01, z);
      this.scene.add(line);
    }
  }
  
  createIntersection(streetName, x, z) {
    // Traffic light at intersection
    this.createTrafficLight(x - 15, z, -Math.PI / 2);
    this.createTrafficLight(x + 15, z, Math.PI / 2);
    
    // Cross street
    const crossStreet = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 25),
      this.materials.road
    );
    crossStreet.rotation.x = -Math.PI / 2;
    crossStreet.position.set(x, 0.01, z);
    crossStreet.receiveShadow = true;
    this.scene.add(crossStreet);
    
    // Street name sign
    this.createStreetSign(streetName, x - 20, z + 20);
    
    this.intersections.push({
      name: streetName,
      position: { x, z }
    });
  }
  
  createTrafficLight(x, z, rotation) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7 })
    );
    pole.position.set(x, 3, z);
    this.scene.add(pole);
    
    // Light housing
    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 1.5, 0.3),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
    );
    housing.position.set(x, 6.5, z);
    housing.rotation.y = rotation;
    this.scene.add(housing);
    
    // Green light (always green for now)
    const light = new THREE.Mesh(
      new THREE.CircleGeometry(0.15, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    light.position.set(x, 6.2, z + (rotation === 0 ? -0.16 : 0.16));
    light.rotation.y = rotation;
    this.scene.add(light);
  }
  
  createSign(text, x, y, z, color) {
    // Simple text-style sign (using basic geometry)
    const signBoard = new THREE.Mesh(
      new THREE.BoxGeometry(text.length * 0.8, 1.5, 0.2),
      new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.3 })
    );
    signBoard.position.set(x, y, z);
    this.scene.add(signBoard);
    
    // Add a point light for night visibility
    const signLight = new THREE.PointLight(color, 0.3, 10);
    signLight.position.set(x, y, z);
    this.scene.add(signLight);
  }
  
  createStreetSign(text, x, z) {
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.5, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.5 })
    );
    sign.position.set(x, 3, z);
    this.scene.add(sign);
    
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 3, 8),
      new THREE.MeshStandardMaterial({ color: 0x666666 })
    );
    pole.position.set(x, 1.5, z);
    this.scene.add(pole);
  }
  
  addStreetInfrastructure() {
    // Streetlights along Jefferson Ave
    const lightSpacing = 40;
    for (let z = 0; z < 1500; z += lightSpacing) {
      this.createStreetLight(-20, z);
      this.createStreetLight(20, z);
    }
    
    // Power poles
    for (let z = 0; z < 1500; z += 60) {
      this.createPowerPole(25, z);
    }
  }
  
  createStreetLight(x, z) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.6 })
    );
    pole.position.set(x, 5, z);
    this.scene.add(pole);
    
    // Light fixture
    const fixture = new THREE.Mesh(
      new THREE.SphereGeometry(0.4, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffaa })
    );
    fixture.position.set(x, 10, z);
    this.scene.add(fixture);
  }
  
  createPowerPole(x, z) {
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.25, 12, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 })
    );
    pole.position.set(x, 6, z);
    this.scene.add(pole);
  }
  
  addVegetation() {
    // Trees along the corridor (simple representations)
    const treePositions = [];
    for (let z = 0; z < 1500; z += 25) {
      if (Math.random() > 0.3) { // Random spacing
        treePositions.push({ x: -25, z });
        treePositions.push({ x: 30, z });
      }
    }
    
    treePositions.forEach(pos => {
      this.createSimpleTree(pos.x, pos.z);
    });
  }
  
  createSimpleTree(x, z) {
    // Trunk
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.4, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.9 })
    );
    trunk.position.set(x, 2, z);
    trunk.castShadow = true;
    this.scene.add(trunk);
    
    // Foliage (simple sphere)
    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x2a5a1a, roughness: 0.8 })
    );
    foliage.position.set(x, 5, z);
    foliage.castShadow = true;
    this.scene.add(foliage);
  }
  
  getCollisionObjects() {
    return this.collisionObjects;
  }
  
  getLandmarks() {
    return this.landmarks;
  }
  
  getIntersections() {
    return this.intersections;
  }
  
  getCurrentStreet(z) {
    // Determine which street segment the player is on
    if (z < 200) return 'Jefferson Ave (Kiln Creek)';
    if (z < 600) return 'Jefferson Ave';
    if (z < 900) return 'Jefferson Ave (City Center)';
    if (z < 1400) return 'Jefferson Ave (Walmart Area)';
    return 'Jefferson Ave';
  }
}
