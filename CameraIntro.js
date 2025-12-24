import * as THREE from 'three';

/**
 * Cinematic aerial intro that zooms from sky down to showroom
 */
export class CameraIntro {
  constructor(camera, targetPosition = new THREE.Vector3(0, 2, 0)) {
    this.camera = camera;
    this.targetPosition = targetPosition;
    this.isPlaying = false;
    this.progress = 0;
    this.duration = 4000; // 4 seconds
    this.startTime = 0;
    
    // Animation keyframes - start high above target
    this.startPos = new THREE.Vector3(
      targetPosition.x, 
      200, 
      targetPosition.z - 100
    ); // High aerial view
    this.startLookAt = new THREE.Vector3(
      targetPosition.x, 
      0, 
      targetPosition.z + 300
    ); // Looking at corridor
    
    // End behind and above the vehicle
    this.endPos = new THREE.Vector3(
      targetPosition.x + 12, 
      targetPosition.y + 4, 
      targetPosition.z - 12
    ); // Behind truck
    this.endLookAt = targetPosition.clone(); // Looking at truck
    
    this.currentLookAt = new THREE.Vector3();
  }
  
  start() {
    this.isPlaying = true;
    this.progress = 0;
    this.startTime = Date.now();
    
    // Set initial camera position (aerial)
    this.camera.position.copy(this.startPos);
    this.camera.lookAt(this.startLookAt);
    
    console.log('🎬 Starting aerial intro...');
  }
  
  update() {
    if (!this.isPlaying) return false;
    
    const elapsed = Date.now() - this.startTime;
    this.progress = Math.min(elapsed / this.duration, 1);
    
    // Ease-in-out curve for smooth motion
    const eased = this.easeInOutCubic(this.progress);
    
    // Interpolate camera position
    this.camera.position.lerpVectors(this.startPos, this.endPos, eased);
    
    // Interpolate look-at target
    this.currentLookAt.lerpVectors(this.startLookAt, this.endLookAt, eased);
    this.camera.lookAt(this.currentLookAt);
    
    // Check if complete
    if (this.progress >= 1) {
      this.isPlaying = false;
      console.log('✅ Aerial intro complete');
      return true; // Signal completion
    }
    
    return false; // Still playing
  }
  
  easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  skip() {
    if (!this.isPlaying) return;
    
    this.progress = 1;
    this.isPlaying = false;
    this.camera.position.copy(this.endPos);
    this.camera.lookAt(this.endLookAt);
    
    console.log('⏭️ Intro skipped');
  }
  
  isActive() {
    return this.isPlaying;
  }
}
