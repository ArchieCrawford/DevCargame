import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CONFIG } from './config.js';

export class CameraController {
  constructor(camera, renderer, cybertruck) {
    this.camera = camera;
    this.cybertruck = cybertruck;
    this.mode = 'showroom'; // 'showroom' or 'drive'
    
    // Showroom mode - orbit controls
    this.orbitControls = new OrbitControls(camera, renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.minDistance = 8;
    this.orbitControls.maxDistance = 30;
    this.orbitControls.maxPolarAngle = Math.PI / 2;
    this.orbitControls.target.set(0, 2, 0);
    
    // Initial showroom camera position
    this.camera.position.set(12, 6, 12);
    
    // Drive mode camera offset
    this.cameraOffset = new THREE.Vector3(0, CONFIG.camera.drive.height, -CONFIG.camera.drive.distance);
    this.currentCameraPos = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();
    
    // Mouse control for drive mode
    this.mouseX = 0;
    this.setupMouseControl(renderer.domElement);
  }
  
  setupMouseControl(domElement) {
    domElement.addEventListener('mousemove', (e) => {
      this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    });
  }
  
  switchToShowroom() {
    this.mode = 'showroom';
    this.orbitControls.enabled = true;
    
    // Smoothly transition camera back
    const targetPos = new THREE.Vector3(12, 6, 12);
    this.animateCamera(targetPos, new THREE.Vector3(0, 2, 0));
  }
  
  switchToDrive() {
    this.mode = 'drive';
    this.orbitControls.enabled = false;
    
    // Initialize drive camera position
    const truckPos = this.cybertruck.getPosition();
    const truckRot = this.cybertruck.getRotation();
    
    const offset = this.cameraOffset.clone();
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), truckRot);
    
    this.currentCameraPos.copy(truckPos).add(offset);
    this.currentLookAt.copy(truckPos);
    this.currentLookAt.y += 2;
    
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentLookAt);
  }
  
  animateCamera(targetPos, targetLookAt) {
    const startPos = this.camera.position.clone();
    const startLookAt = this.orbitControls.target.clone();
    
    let progress = 0;
    const duration = 1000; // ms
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      progress = Math.min(elapsed / duration, 1);
      
      // Ease in-out
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      this.camera.position.lerpVectors(startPos, targetPos, eased);
      this.orbitControls.target.lerpVectors(startLookAt, targetLookAt, eased);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  update() {
    if (this.mode === 'showroom') {
      this.orbitControls.update();
    } else if (this.mode === 'drive') {
      this.updateDriveCamera();
    }
  }
  
  updateDriveCamera() {
    const truckPos = this.cybertruck.getPosition();
    const truckRot = this.cybertruck.getRotation();
    
    // Calculate target camera position behind the truck
    const offset = this.cameraOffset.clone();
    
    // Add mouse-based horizontal offset for looking around
    const mouseOffset = this.mouseX * 3;
    offset.x += mouseOffset;
    
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), truckRot);
    
    const targetCameraPos = new THREE.Vector3()
      .copy(truckPos)
      .add(offset);
    
    // Smooth follow
    this.currentCameraPos.lerp(targetCameraPos, CONFIG.camera.drive.followSpeed);
    
    // Look at point slightly ahead of truck
    const lookAheadDistance = 5;
    const targetLookAt = new THREE.Vector3(
      truckPos.x + Math.sin(truckRot) * lookAheadDistance,
      truckPos.y + 2,
      truckPos.z + Math.cos(truckRot) * lookAheadDistance
    );
    
    this.currentLookAt.lerp(targetLookAt, CONFIG.camera.drive.followSpeed);
    
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentLookAt);
  }
}
