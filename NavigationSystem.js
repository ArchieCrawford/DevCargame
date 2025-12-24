import * as THREE from 'three';

export class NavigationSystem {
  constructor(scene, landmarks) {
    this.scene = scene;
    this.landmarks = landmarks;
    this.activeWaypoint = null;
    this.waypointMarker = null;
    this.waypointArrow = null;
  }
  
  setDestination(landmarkName) {
    // Find landmark
    const landmark = this.landmarks.find(l => 
      l.name.toLowerCase().includes(landmarkName.toLowerCase())
    );
    
    if (!landmark) {
      console.warn('Landmark not found:', landmarkName);
      return false;
    }
    
    this.activeWaypoint = landmark;
    this.createWaypointMarker(landmark.position);
    
    console.log('📍 Navigation set to:', landmark.name, 'at', landmark.position);
    return true;
  }
  
  createWaypointMarker(position) {
    // Remove old marker if exists
    this.clearWaypoint();
    
    // Create a tall beacon that's visible from distance
    const beaconGeometry = new THREE.CylinderGeometry(0.5, 1, 15, 16);
    const beaconMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.6
    });
    
    this.waypointMarker = new THREE.Mesh(beaconGeometry, beaconMaterial);
    this.waypointMarker.position.set(position.x, 7.5, position.z);
    this.scene.add(this.waypointMarker);
    
    // Glowing sphere at top
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    sphere.position.set(position.x, 15, position.z);
    this.scene.add(sphere);
    this.waypointArrow = sphere; // Store reference
    
    // Add point light
    const light = new THREE.PointLight(0x00ff00, 2, 50);
    light.position.set(position.x, 15, position.z);
    this.scene.add(light);
  }
  
  clearWaypoint() {
    if (this.waypointMarker) {
      this.scene.remove(this.waypointMarker);
      this.waypointMarker = null;
    }
    if (this.waypointArrow) {
      this.scene.remove(this.waypointArrow);
      this.waypointArrow = null;
    }
    this.activeWaypoint = null;
  }
  
  getActiveWaypoint() {
    return this.activeWaypoint;
  }
  
  getDistanceToWaypoint(playerPos) {
    if (!this.activeWaypoint) return null;
    
    const dx = playerPos.x - this.activeWaypoint.position.x;
    const dz = playerPos.z - this.activeWaypoint.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    return {
      distance: distance,
      distanceMiles: (distance / 100).toFixed(2), // Rough conversion to miles
      direction: Math.atan2(dx, dz)
    };
  }
  
  checkArrival(playerPos, threshold = 20) {
    if (!this.activeWaypoint) return false;
    
    const info = this.getDistanceToWaypoint(playerPos);
    if (info.distance < threshold) {
      console.log('✅ Arrived at:', this.activeWaypoint.name);
      this.clearWaypoint();
      return true;
    }
    
    return false;
  }
  
  update() {
    // Animate waypoint marker (pulse/rotate)
    if (this.waypointMarker) {
      this.waypointMarker.rotation.y += 0.02;
      
      // Pulse effect
      const scale = 1 + Math.sin(Date.now() * 0.003) * 0.1;
      this.waypointMarker.scale.set(scale, 1, scale);
    }
    
    if (this.waypointArrow) {
      this.waypointArrow.rotation.y += 0.03;
      
      // Bob up and down
      const bob = Math.sin(Date.now() * 0.002) * 0.5;
      this.waypointArrow.position.y = 15 + bob;
    }
  }
}
