import * as THREE from 'three';
import { CONFIG } from './config.js';

export class Showroom {
  constructor(scene) {
    this.scene = scene;
    this.doors = { left: null, right: null };
    this.doorsOpen = false;
    this.doorAnimation = 0;
    this.createShowroom();
  }
  
  createShowroom() {
    // Polished concrete floor
    const floorGeometry = new THREE.CircleGeometry(CONFIG.showroom.size, 64);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x303030,
      metalness: 0.3,
      roughness: 0.4
    });
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = CONFIG.showroom.floorLevel;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    // Accent circle under truck
    const accentGeometry = new THREE.RingGeometry(6, 8, 64);
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x505050,
      metalness: 0.5,
      roughness: 0.3,
      emissive: 0x202020,
      emissiveIntensity: 0.3
    });
    
    const accentRing = new THREE.Mesh(accentGeometry, accentMaterial);
    accentRing.rotation.x = -Math.PI / 2;
    accentRing.position.y = CONFIG.showroom.floorLevel + 0.01;
    this.scene.add(accentRing);
    
    // Glass walls - minimalist perimeter
    this.createGlassWalls();
    
    // Steel accent pillars
    this.createPillars();
    
    // Display screens
    this.createDisplays();
    
    // Environmental grid floor extension
    this.createGridFloor();
  }
  
  createGlassWalls() {
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      metalness: 0,
      roughness: 0.1,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
      envMapIntensity: 1
    });
    
    const doorGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x88ccff,
      metalness: 0,
      roughness: 0.1,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
      envMapIntensity: 1
    });
    
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x606060,
      metalness: 0.8,
      roughness: 0.2
    });
    
    const wallHeight = 8;
    const wallGeometry = new THREE.PlaneGeometry(40, wallHeight);
    
    // Back wall
    const backWall = new THREE.Mesh(wallGeometry, glassMaterial);
    backWall.position.set(0, wallHeight / 2, -25);
    this.scene.add(backWall);
    
    // Side walls
    const leftWall = new THREE.Mesh(wallGeometry, glassMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-25, wallHeight / 2, 0);
    this.scene.add(leftWall);
    
    const rightWall = new THREE.Mesh(wallGeometry, glassMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(25, wallHeight / 2, 0);
    this.scene.add(rightWall);
    
    // Front entrance with sliding doors
    this.createDoors(doorGlassMaterial, frameMaterial, wallHeight);
  }
  
  createDoors(glassMaterial, frameMaterial, wallHeight) {
    const doorWidth = 8;
    const doorGeometry = new THREE.PlaneGeometry(doorWidth, wallHeight);
    
    // Left door
    this.doors.left = new THREE.Group();
    const leftDoorGlass = new THREE.Mesh(doorGeometry, glassMaterial);
    this.doors.left.add(leftDoorGlass);
    
    // Left door frame
    const frameGeometry = new THREE.BoxGeometry(0.2, wallHeight, 0.2);
    const leftFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    leftFrame.position.x = doorWidth / 2;
    this.doors.left.add(leftFrame);
    
    this.doors.left.position.set(-doorWidth / 2, wallHeight / 2, 25);
    this.scene.add(this.doors.left);
    
    // Right door
    this.doors.right = new THREE.Group();
    const rightDoorGlass = new THREE.Mesh(doorGeometry, glassMaterial);
    this.doors.right.add(rightDoorGlass);
    
    const rightFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    rightFrame.position.x = -doorWidth / 2;
    this.doors.right.add(rightFrame);
    
    this.doors.right.position.set(doorWidth / 2, wallHeight / 2, 25);
    this.scene.add(this.doors.right);
    
    // Side walls next to doors
    const sideWallGeometry = new THREE.PlaneGeometry(8, wallHeight);
    const leftSideWall = new THREE.Mesh(sideWallGeometry, glassMaterial);
    leftSideWall.position.set(-16, wallHeight / 2, 25);
    this.scene.add(leftSideWall);
    
    const rightSideWall = new THREE.Mesh(sideWallGeometry, glassMaterial);
    rightSideWall.position.set(16, wallHeight / 2, 25);
    this.scene.add(rightSideWall);
  }
  
  openDoors() {
    this.doorsOpen = true;
  }
  
  closeDoors() {
    this.doorsOpen = false;
  }
  
  update(deltaTime) {
    // Animate doors
    const doorSpeed = 2;
    const maxDoorOffset = 8;
    
    if (this.doorsOpen && this.doorAnimation < 1) {
      this.doorAnimation = Math.min(1, this.doorAnimation + deltaTime * doorSpeed);
    } else if (!this.doorsOpen && this.doorAnimation > 0) {
      this.doorAnimation = Math.max(0, this.doorAnimation - deltaTime * doorSpeed);
    }
    
    // Ease in-out
    const eased = this.doorAnimation < 0.5
      ? 2 * this.doorAnimation * this.doorAnimation
      : 1 - Math.pow(-2 * this.doorAnimation + 2, 2) / 2;
    
    if (this.doors.left && this.doors.right) {
      this.doors.left.position.x = -8 / 2 - eased * maxDoorOffset;
      this.doors.right.position.x = 8 / 2 + eased * maxDoorOffset;
    }
  }
  
  createPillars() {
    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      metalness: 0.8,
      roughness: 0.2
    });
    
    const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 16);
    
    const positions = [
      { x: -20, z: -20 },
      { x: 20, z: -20 },
      { x: -20, z: 20 },
      { x: 20, z: 20 }
    ];
    
    positions.forEach(pos => {
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(pos.x, 4, pos.z);
      pillar.castShadow = true;
      this.scene.add(pillar);
      
      // Top cap
      const capGeometry = new THREE.CylinderGeometry(0.5, 0.3, 0.2, 16);
      const cap = new THREE.Mesh(capGeometry, pillarMaterial);
      cap.position.set(pos.x, 8.1, pos.z);
      this.scene.add(cap);
    });
  }
  
  createDisplays() {
    const screenMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000
    });
    
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      transparent: true,
      opacity: 0.6
    });
    
    const screenGeometry = new THREE.PlaneGeometry(4, 2.5);
    const frameGeometry = new THREE.PlaneGeometry(4.2, 2.7);
    
    // Left display
    const leftFrame = new THREE.Mesh(frameGeometry, glowMaterial);
    leftFrame.position.set(-18, 3, -24.9);
    this.scene.add(leftFrame);
    
    const leftScreen = new THREE.Mesh(screenGeometry, screenMaterial);
    leftScreen.position.set(-18, 3, -24.8);
    this.scene.add(leftScreen);
    
    // Right display
    const rightFrame = new THREE.Mesh(frameGeometry, glowMaterial);
    rightFrame.position.set(18, 3, -24.9);
    this.scene.add(rightFrame);
    
    const rightScreen = new THREE.Mesh(screenGeometry, screenMaterial);
    rightScreen.position.set(18, 3, -24.8);
    this.scene.add(rightScreen);
    
    // Add Tesla logo glow (simple T shape)
    this.createTeslaLogo(-18, 3, -24.7);
    this.createTeslaLogo(18, 3, -24.7);
  }
  
  createTeslaLogo(x, y, z) {
    const logoMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    
    // Simplified T shape
    const verticalGeometry = new THREE.PlaneGeometry(0.2, 1.2);
    const vertical = new THREE.Mesh(verticalGeometry, logoMaterial);
    vertical.position.set(x, y, z);
    this.scene.add(vertical);
    
    const horizontalGeometry = new THREE.PlaneGeometry(0.8, 0.2);
    const horizontal = new THREE.Mesh(horizontalGeometry, logoMaterial);
    horizontal.position.set(x, y + 0.5, z);
    this.scene.add(horizontal);
  }
  
  createGridFloor() {
    // Subtle grid lines extending beyond main floor
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x404040,
      transparent: true,
      opacity: 0.3
    });
    
    const gridSize = 100;
    const divisions = 50;
    
    const gridHelper = new THREE.GridHelper(gridSize, divisions, 0x404040, 0x303030);
    gridHelper.position.y = CONFIG.showroom.floorLevel + 0.02;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.2;
    this.scene.add(gridHelper);
  }
}
