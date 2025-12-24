import * as THREE from 'three';

/**
 * Modular City Block System - Expandable grid-based city generation
 * Allows dynamic loading/unloading of city blocks for scalable maps
 */
export class CityBlockSystem {
  constructor(scene) {
    this.scene = scene;
    this.blocks = new Map(); // Store active blocks by key "x,z"
    this.blockSize = 200; // Each block is 200x200 units
    this.loadDistance = 2; // Load blocks within 2 block radius
    this.unloadDistance = 3; // Unload blocks beyond 3 block radius
    this.collisionObjects = [];
    
    // Material cache for performance
    this.materials = this.createMaterials();
    
    // Block templates
    this.blockTemplates = this.createBlockTemplates();
    
    console.log('🏙️ Modular city block system initialized');
  }
  
  createMaterials() {
    return {
      road: new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.9,
        metalness: 0.1
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
      buildingDark: new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.8,
        metalness: 0.3
      }),
      buildingLight: new THREE.MeshStandardMaterial({
        color: 0x6a6a6a,
        roughness: 0.6,
        metalness: 0.2
      }),
      grass: new THREE.MeshStandardMaterial({
        color: 0x3a5a3a,
        roughness: 1.0
      }),
      parking: new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        roughness: 0.8
      })
    };
  }
  
  createBlockTemplates() {
    return {
      // Residential block with houses
      residential: (x, z) => this.createResidentialBlock(x, z),
      
      // Commercial block with shops
      commercial: (x, z) => this.createCommercialBlock(x, z),
      
      // Downtown with tall buildings
      downtown: (x, z) => this.createDowntownBlock(x, z),
      
      // Park/green space
      park: (x, z) => this.createParkBlock(x, z),
      
      // Parking lot
      parking: (x, z) => this.createParkingBlock(x, z),
      
      // Industrial area
      industrial: (x, z) => this.createIndustrialBlock(x, z)
    };
  }
  
  getBlockKey(blockX, blockZ) {
    return `${blockX},${blockZ}`;
  }
  
  worldToBlockCoords(worldX, worldZ) {
    return {
      x: Math.floor(worldX / this.blockSize),
      z: Math.floor(worldZ / this.blockSize)
    };
  }
  
  blockToWorldCoords(blockX, blockZ) {
    return {
      x: blockX * this.blockSize,
      z: blockZ * this.blockSize
    };
  }
  
  // Determine block type based on position (can be customized with a map)
  getBlockType(blockX, blockZ) {
    const distFromCenter = Math.sqrt(blockX * blockX + blockZ * blockZ);
    
    // Downtown in center (dense skyscrapers)
    if (distFromCenter < 3) return 'downtown';
    
    // Commercial ring (shops and offices)
    if (distFromCenter < 6) return 'commercial';
    
    // Mixed residential, industrial, sparse parks
    const rand = (blockX * 73 + blockZ * 31) % 100;
    if (rand < 10) return 'park';
    if (rand < 25) return 'parking';
    if (rand < 50) return 'industrial';
    
    return 'residential';
  }
  
  createBlock(blockX, blockZ) {
    const key = this.getBlockKey(blockX, blockZ);
    
    // Don't recreate if exists
    if (this.blocks.has(key)) return;
    
    const blockType = this.getBlockType(blockX, blockZ);
    const template = this.blockTemplates[blockType];
    
    if (template) {
      const blockGroup = template(blockX, blockZ);
      
      // Add ground plane for the block
      const worldPos = this.blockToWorldCoords(blockX, blockZ);
      const groundGeometry = new THREE.PlaneGeometry(this.blockSize, this.blockSize);
      const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.95
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(worldPos.x, -0.01, worldPos.z);
      ground.receiveShadow = true;
      blockGroup.add(ground);
      
      const collisionObjects = this.collectCollisionObjects(blockGroup);
      this.scene.add(blockGroup);
      this.blocks.set(key, { group: blockGroup, type: blockType, collisions: collisionObjects });
      this.collisionObjects.push(...collisionObjects);
      
      console.log(`✅ Created ${blockType} block at (${blockX}, ${blockZ})`);
    }
  }
  
  removeBlock(blockX, blockZ) {
    const key = this.getBlockKey(blockX, blockZ);
    const block = this.blocks.get(key);
    
    if (block) {
      this.scene.remove(block.group);
      if (block.collisions && block.collisions.length) {
        this.collisionObjects = this.collisionObjects.filter(
          (obj) => !block.collisions.includes(obj)
        );
      }
      
      // Dispose of geometries and materials
      block.group.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        // Don't dispose materials as they're shared
      });
      
      this.blocks.delete(key);
      console.log(`🗑️ Removed block at (${blockX}, ${blockZ})`);
    }
  }
  
  update(playerPosition) {
    const playerBlock = this.worldToBlockCoords(playerPosition.x, playerPosition.z);
    
    // Load blocks around player
    for (let x = playerBlock.x - this.loadDistance; x <= playerBlock.x + this.loadDistance; x++) {
      for (let z = playerBlock.z - this.loadDistance; z <= playerBlock.z + this.loadDistance; z++) {
        this.createBlock(x, z);
      }
    }
    
    // Unload distant blocks
    const blocksToRemove = [];
    this.blocks.forEach((block, key) => {
      const [blockX, blockZ] = key.split(',').map(Number);
      const distance = Math.max(
        Math.abs(blockX - playerBlock.x),
        Math.abs(blockZ - playerBlock.z)
      );
      
      if (distance > this.unloadDistance) {
        blocksToRemove.push({ x: blockX, z: blockZ });
      }
    });
    
    blocksToRemove.forEach(({ x, z }) => this.removeBlock(x, z));
  }
  
  collectCollisionObjects(blockGroup) {
    const collisions = [];
    const position = new THREE.Vector3();
    
    blockGroup.updateMatrixWorld(true);
    blockGroup.traverse((child) => {
      if (!child.userData || !child.userData.collisionRadius) return;
      child.getWorldPosition(position);
      collisions.push({
        x: position.x,
        z: position.z,
        radius: child.userData.collisionRadius
      });
    });
    
    return collisions;
  }
  
  getCollisionObjects() {
    return this.collisionObjects;
  }
  
  // Block creation methods
  createResidentialBlock(blockX, blockZ) {
    const group = new THREE.Group();
    const worldPos = this.blockToWorldCoords(blockX, blockZ);
    group.position.set(worldPos.x, 0, worldPos.z);
    
    // Road grid (cross pattern)
    this.addRoadCross(group);
    
    // Fill all quadrants with houses (8-12 houses per block)
    const houseGrid = [
      [-60, -60], [-30, -60], [30, -60], [60, -60],
      [-60, -30], [-30, -30], [30, -30], [60, -30],
      [-60, 30], [-30, 30], [30, 30], [60, 30],
      [-60, 60], [-30, 60], [30, 60], [60, 60]
    ];
    
    houseGrid.forEach(([x, z]) => {
      if (Math.random() > 0.3) { // 70% chance to place house
        const house = this.createHouse(x, z);
        group.add(house);
      }
    });
    
    // Fewer trees (only 4-6)
    for (let i = 0; i < 5; i++) {
      const tree = this.createTree(
        (Math.random() - 0.5) * 140,
        (Math.random() - 0.5) * 140
      );
      group.add(tree);
    }
    
    return group;
  }
  
  createCommercialBlock(blockX, blockZ) {
    const group = new THREE.Group();
    const worldPos = this.blockToWorldCoords(blockX, blockZ);
    group.position.set(worldPos.x, 0, worldPos.z);
    
    // Road grid
    this.addRoadCross(group);
    
    // Fill with shops and offices (8-10 buildings per block)
    const buildingGrid = [
      [-70, -70], [-35, -70], [35, -70], [70, -70],
      [-70, -35], [-35, -35], [35, -35], [70, -35],
      [-70, 35], [-35, 35], [35, 35], [70, 35],
      [-70, 70], [-35, 70], [35, 70], [70, 70]
    ];
    
    buildingGrid.forEach(([x, z]) => {
      if (Math.random() > 0.2) { // 80% chance
        const shop = this.createShop(x, z);
        group.add(shop);
      }
    });
    
    return group;
  }
  
  createDowntownBlock(blockX, blockZ) {
    const group = new THREE.Group();
    const worldPos = this.blockToWorldCoords(blockX, blockZ);
    group.position.set(worldPos.x, 0, worldPos.z);
    
    // Road grid
    this.addRoadCross(group);
    
    // Dense skyscrapers (8-12 tall buildings)
    const buildingGrid = [
      [-70, -70, 50], [-35, -70, 45], [35, -70, 42], [70, -70, 48],
      [-70, -35, 38], [-35, -35, 55], [35, -35, 40], [70, -35, 46],
      [-70, 35, 44], [-35, 35, 38], [35, 35, 52], [70, 35, 41],
      [-70, 70, 47], [-35, 70, 43], [35, 70, 39], [70, 70, 50]
    ];
    
    buildingGrid.forEach(([x, z, height]) => {
      if (Math.random() > 0.15) { // 85% chance
        const building = this.createSkyscraper(x, z, height);
        group.add(building);
      }
    });
    
    return group;
  }
  
  createParkBlock(blockX, blockZ) {
    const group = new THREE.Group();
    const worldPos = this.blockToWorldCoords(blockX, blockZ);
    group.position.set(worldPos.x, 0, worldPos.z);
    
    // Road border
    this.addRoadBorder(group);
    
    // Grass field
    const grassGeometry = new THREE.PlaneGeometry(160, 160);
    const grass = new THREE.Mesh(grassGeometry, this.materials.grass);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = 0.02;
    grass.receiveShadow = true;
    group.add(grass);
    
    // Many trees
    for (let i = 0; i < 15; i++) {
      const tree = this.createTree(
        (Math.random() - 0.5) * 140,
        (Math.random() - 0.5) * 140
      );
      group.add(tree);
    }
    
    return group;
  }
  
  createParkingBlock(blockX, blockZ) {
    const group = new THREE.Group();
    const worldPos = this.blockToWorldCoords(blockX, blockZ);
    group.position.set(worldPos.x, 0, worldPos.z);
    
    // Road border
    this.addRoadBorder(group);
    
    // Parking lot
    const lotGeometry = new THREE.PlaneGeometry(160, 160);
    const lot = new THREE.Mesh(lotGeometry, this.materials.parking);
    lot.rotation.x = -Math.PI / 2;
    lot.position.y = 0.02;
    lot.receiveShadow = true;
    group.add(lot);
    
    // Parking lines
    this.addParkingLines(group, 160, 160);
    
    return group;
  }
  
  createIndustrialBlock(blockX, blockZ) {
    const group = new THREE.Group();
    const worldPos = this.blockToWorldCoords(blockX, blockZ);
    group.position.set(worldPos.x, 0, worldPos.z);
    
    // Road grid
    this.addRoadCross(group);
    
    // Fill with warehouses (6-8 large buildings)
    const warehouseGrid = [
      [-65, -65], [0, -65], [65, -65],
      [-65, 0], [0, 0], [65, 0],
      [-65, 65], [0, 65], [65, 65]
    ];
    
    warehouseGrid.forEach(([x, z]) => {
      if (Math.random() > 0.25) { // 75% chance
        const warehouse = this.createWarehouse(x, z);
        group.add(warehouse);
      }
    });
    
    return group;
  }
  
  // Building creation helpers
  createHouse(x, z) {
    const house = new THREE.Group();
    house.position.set(x, 0, z);
    
    const baseGeometry = new THREE.BoxGeometry(15, 8, 15);
    const base = new THREE.Mesh(baseGeometry, this.materials.building);
    base.position.y = 4;
    base.castShadow = true;
    base.userData.collisionRadius = Math.max(
      baseGeometry.parameters.width,
      baseGeometry.parameters.depth
    ) * 0.55;
    house.add(base);
    
    // Roof
    const roofGeometry = new THREE.ConeGeometry(12, 5, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.8 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 10.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);
    
    return house;
  }
  
  createShop(x, z) {
    const shop = new THREE.Group();
    shop.position.set(x, 0, z);
    
    const geometry = new THREE.BoxGeometry(25, 12, 20);
    const building = new THREE.Mesh(geometry, this.materials.buildingLight);
    building.position.y = 6;
    building.castShadow = true;
    building.userData.collisionRadius = Math.max(
      geometry.parameters.width,
      geometry.parameters.depth
    ) * 0.55;
    shop.add(building);
    
    return shop;
  }
  
  createSkyscraper(x, z, height) {
    const building = new THREE.Group();
    building.position.set(x, 0, z);
    
    const geometry = new THREE.BoxGeometry(30, height, 30);
    const tower = new THREE.Mesh(geometry, this.materials.buildingDark);
    tower.position.y = height / 2;
    tower.castShadow = true;
    tower.userData.collisionRadius = Math.max(
      geometry.parameters.width,
      geometry.parameters.depth
    ) * 0.55;
    building.add(tower);
    
    return building;
  }
  
  createWarehouse(x, z) {
    const warehouse = new THREE.Group();
    warehouse.position.set(x, 0, z);
    
    const geometry = new THREE.BoxGeometry(35, 10, 25);
    const building = new THREE.Mesh(geometry, this.materials.buildingDark);
    building.position.y = 5;
    building.castShadow = true;
    building.userData.collisionRadius = Math.max(
      geometry.parameters.width,
      geometry.parameters.depth
    ) * 0.55;
    warehouse.add(building);
    
    return warehouse;
  }
  
  createTree(x, z) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 4);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 1 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 2;
    trunk.castShadow = true;
    tree.add(trunk);
    
    // Foliage
    const foliageGeometry = new THREE.SphereGeometry(2.5, 8, 8);
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016, roughness: 0.9 });
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
    foliage.position.y = 5;
    foliage.castShadow = true;
    tree.add(foliage);
    
    return tree;
  }
  
  // Road helpers
  addRoadCross(group) {
    // Horizontal road
    const roadH = new THREE.Mesh(
      new THREE.PlaneGeometry(this.blockSize, 20),
      this.materials.road
    );
    roadH.rotation.x = -Math.PI / 2;
    roadH.position.y = 0.01;
    roadH.receiveShadow = true;
    group.add(roadH);
    
    // Vertical road
    const roadV = new THREE.Mesh(
      new THREE.PlaneGeometry(20, this.blockSize),
      this.materials.road
    );
    roadV.rotation.x = -Math.PI / 2;
    roadV.position.y = 0.01;
    roadV.receiveShadow = true;
    group.add(roadV);
    
    // Sidewalks
    this.addSidewalks(group);
  }
  
  addRoadBorder(group) {
    const positions = [
      [0, -90], [0, 90], [-90, 0], [90, 0]
    ];
    
    positions.forEach(([x, z], index) => {
      const isHorizontal = index < 2;
      const road = new THREE.Mesh(
        new THREE.PlaneGeometry(isHorizontal ? this.blockSize : 20, isHorizontal ? 20 : this.blockSize),
        this.materials.road
      );
      road.rotation.x = -Math.PI / 2;
      road.position.set(x, 0.01, z);
      road.receiveShadow = true;
      group.add(road);
    });
  }
  
  addSidewalks(group) {
    const walkWidth = 3;
    const positions = [
      [-10 - walkWidth / 2, 0], [10 + walkWidth / 2, 0], 
      [0, -10 - walkWidth / 2], [0, 10 + walkWidth / 2]
    ];
    
    positions.forEach(([x, z], index) => {
      const isHorizontal = index < 2;
      const sidewalk = new THREE.Mesh(
        new THREE.PlaneGeometry(isHorizontal ? this.blockSize : walkWidth, isHorizontal ? walkWidth : this.blockSize),
        this.materials.sidewalk
      );
      sidewalk.rotation.x = -Math.PI / 2;
      sidewalk.position.set(x, 0.02, z);
      sidewalk.receiveShadow = true;
      group.add(sidewalk);
    });
  }
  
  addParkingLines(group, width, depth) {
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    
    // Horizontal lines
    for (let z = -depth / 2 + 10; z < depth / 2; z += 10) {
      for (let x = -width / 2 + 10; x < width / 2; x += 15) {
        const line = new THREE.Mesh(
          new THREE.PlaneGeometry(10, 0.2),
          lineMaterial
        );
        line.rotation.x = -Math.PI / 2;
        line.position.set(x, 0.03, z);
        group.add(line);
      }
    }
  }
  
  destroy() {
    this.blocks.forEach((block, key) => {
      const [x, z] = key.split(',').map(Number);
      this.removeBlock(x, z);
    });
  }
}
