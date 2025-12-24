import * as THREE from 'three';
import { CONFIG } from './config.js';

/**
 * Respawn System - Handles vehicle respawn when flipped or out of bounds
 */
export class RespawnSystem {
  constructor(vehicle, scene) {
    this.vehicle = vehicle;
    this.scene = scene;
    this.isRespawning = false;
    this.respawnFadeOverlay = null;
    
    // Create fade overlay for respawn effect
    this.createFadeOverlay();
    
    console.log('🔄 Respawn system initialized');
  }
  
  createFadeOverlay() {
    // Create a DOM overlay for fade effect
    this.respawnFadeOverlay = document.createElement('div');
    this.respawnFadeOverlay.style.position = 'fixed';
    this.respawnFadeOverlay.style.top = '0';
    this.respawnFadeOverlay.style.left = '0';
    this.respawnFadeOverlay.style.width = '100vw';
    this.respawnFadeOverlay.style.height = '100vh';
    this.respawnFadeOverlay.style.backgroundColor = 'black';
    this.respawnFadeOverlay.style.opacity = '0';
    this.respawnFadeOverlay.style.pointerEvents = 'none';
    this.respawnFadeOverlay.style.transition = 'opacity 0.3s ease';
    this.respawnFadeOverlay.style.zIndex = '9999';
    document.body.appendChild(this.respawnFadeOverlay);
  }
  
  isFlipped() {
    // Check if vehicle is upside down (Y-up axis pointing down)
    const up = new THREE.Vector3(0, 1, 0);
    const vehicleUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.vehicle.group.quaternion);
    const dot = up.dot(vehicleUp);
    
    // If dot product < 0, vehicle is upside down
    return dot < -0.1;
  }
  
  isOutOfBounds() {
    const pos = this.vehicle.getPosition();
    
    // Check if vehicle fell through the world
    if (pos.y < -10) return true;
    
    // Check if vehicle is outside corridor bounds
    if (pos.z < -100 || pos.z > 1600) return true;
    if (pos.x < -300 || pos.x > 300) return true;
    
    return false;
  }
  
  isStuck() {
    // Check if vehicle hasn't moved much in the last few seconds
    // This could be expanded with velocity tracking
    return false; // Placeholder for now
  }
  
  findNearestSpawnPoint(currentPos) {
    let nearest = CONFIG.spawnPoints[0];
    let minDist = Infinity;
    
    for (const spawn of CONFIG.spawnPoints) {
      const dist = Math.sqrt(
        Math.pow(currentPos.x - spawn.x, 2) +
        Math.pow(currentPos.z - spawn.z, 2)
      );
      
      if (dist < minDist) {
        minDist = dist;
        nearest = spawn;
      }
    }
    
    return nearest;
  }
  
  async respawn(forced = false) {
    if (this.isRespawning) return;
    
    this.isRespawning = true;
    
    // Find nearest spawn point
    const currentPos = this.vehicle.getPosition();
    const spawnPoint = this.findNearestSpawnPoint(currentPos);
    
    // Fade out
    this.respawnFadeOverlay.style.opacity = '1';
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Reset vehicle position and physics
    this.vehicle.group.position.set(spawnPoint.x, spawnPoint.y, spawnPoint.z);
    this.vehicle.group.rotation.set(0, 0, 0);
    this.vehicle.rotation = 0;
    this.vehicle.speed = 0;
    this.vehicle.velocity.set(0, 0, 0);
    
    // Reset any angular momentum if it exists
    if (this.vehicle.angularVelocity) {
      this.vehicle.angularVelocity.set(0, 0, 0);
    }
    
    console.log(`🔄 Respawned at ${spawnPoint.name}`);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Fade in
    this.respawnFadeOverlay.style.opacity = '0';
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    this.isRespawning = false;
  }
  
  checkAndRespawn() {
    // Don't check while already respawning
    if (this.isRespawning) return;
    
    // Auto-respawn if flipped or out of bounds
    if (this.isFlipped() || this.isOutOfBounds()) {
      console.log('⚠️ Auto-respawn triggered');
      this.respawn(false);
    }
  }
  
  manualRespawn() {
    console.log('🔄 Manual respawn requested');
    this.respawn(true);
  }
  
  destroy() {
    if (this.respawnFadeOverlay && this.respawnFadeOverlay.parentNode) {
      this.respawnFadeOverlay.parentNode.removeChild(this.respawnFadeOverlay);
    }
  }
}
