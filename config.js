// Game configuration and constants
export const CONFIG = {
  // Cybertruck dimensions (based on real specs scaled down)
  truck: {
    width: 2.4,
    height: 1.9,
    length: 5.8,
    wheelRadius: 0.4,
    wheelWidth: 0.3,
    wheelOffset: 2.4
  },
  
  // Vehicle profiles (different handling characteristics)
  vehicles: {
    cybertruck: {
      name: 'Cybertruck',
      acceleration: 1.2,
      maxSpeed: 50,
      turnSpeed: 0.025,
      friction: 0.96,
      brakeFriction: 0.85,
      weight: 'heavy',
      modelUrl: 'https://rosebud.ai/assets/cybertruck-meshy-final.glb?JhtX',
      scale: 0.8
    },
    tesla: {
      name: 'Tesla Model',
      acceleration: 1.5,
      maxSpeed: 62,
      turnSpeed: 0.030,
      friction: 0.95,
      brakeFriction: 0.82,
      weight: 'medium',
      modelUrl: 'https://rosebud.ai/assets/tesla.glb?om5j',
      scale: 1.0
    },
    remotecar: {
      name: 'RC Racer',
      acceleration: 2.0,
      maxSpeed: 56,
      turnSpeed: 0.040,
      friction: 0.93,
      brakeFriction: 0.78,
      weight: 'light',
      modelUrl: 'https://rosebud.ai/assets/remotecar.glb?IBr3',
      scale: 1.2
    },
    lowrider: {
      name: 'Lowrider',
      acceleration: 1.0,
      maxSpeed: 45,
      turnSpeed: 0.022,
      friction: 0.95,
      brakeFriction: 0.82,
      weight: 'medium',
      modelUrl: './assets/LowRider.glb',
      scale: 0.9,
      hydraulics: true,
      hydraulicsAmplitude: 0.35,
      hydraulicsSpeed: 8
    },
    helicopter: {
      name: 'Helicopter',
      type: 'air',
      acceleration: 1.4,
      maxSpeed: 70,
      turnSpeed: 0.04,
      friction: 0.98,
      brakeFriction: 0.9,
      weight: 'air',
      modelUrl: './assets/Helacopter.glb',
      scale: 1.6,
      spawnLift: 8,
      liftSpeed: 12,
      verticalFriction: 0.9,
      maxAltitude: 200,
      minAltitude: 1.5,
      camera: { distance: 20, height: 8 }
    }
  },
  
  // Default driving physics (backwards compatibility)
  drive: {
    acceleration: 1.2,
    maxSpeed: 50,
    turnSpeed: 0.025,
    friction: 0.96,
    brakeFriction: 0.85
  },
  
  // Camera settings
  camera: {
    showroom: {
      distance: 15,
      height: 5,
      rotationSpeed: 0.0005
    },
    drive: {
      distance: 12,
      height: 4,
      followSpeed: 0.1
    }
  },
  
  // Showroom
  showroom: {
    size: 60,
    floorLevel: 0
  },
  
  // Spawn points for respawn system
  spawnPoints: [
    { name: 'Starbucks Parking', x: -50, y: 0.4, z: 830 },
    { name: 'Walmart Entrance', x: -80, y: 0.4, z: 1200 },
    { name: 'Gas Station', x: 120, y: 0.4, z: 600 },
    { name: 'City Center', x: -150, y: 0.4, z: 400 }
  ],
  
  // Lap checkpoints
  lapCheckpoints: [
    { id: 1, x: -50, z: 830, radius: 30 },   // Starbucks (Start/Finish)
    { id: 2, x: -150, z: 400, radius: 30 },  // City Center
    { id: 3, x: 120, z: 600, radius: 30 },   // Gas Station
    { id: 4, x: -80, z: 1200, radius: 30 }   // Walmart
  ]
};
