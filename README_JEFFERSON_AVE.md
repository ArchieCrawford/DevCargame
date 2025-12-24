# Jefferson Ave Corridor - Newport News, VA
## Interactive 3D Driving Experience

### Overview
A drivable 3D recreation of Jefferson Ave in Newport News, VA, stretching ~4-5 miles from the I-64 Kiln Creek exit south to the Walmart area. Built with Three.js for performance and modularity.

---

## 🎮 Features

### Cinematic Intro
- **Aerial establishing shot** - Camera starts high above the corridor
- **Smooth zoom** - 4-second cinematic descent to showroom
- **Skip option** - Click anywhere to skip intro
- **Ease-in-out animation** - Professional camera movement

### AI Traffic System
- **15 autonomous vehicles** - Cars driving on Jefferson Ave
- **4-lane traffic** - Northbound and southbound lanes
- **Smart following** - Vehicles maintain safe distance
- **Speed variation** - 15-30 MPH with random speeds
- **Lane discipline** - Cars stay in their lanes
- **Collision detection** - Player can hit traffic (with bounce-back)
- **Dynamic spawning** - New cars spawn every 3 seconds
- **Auto-despawn** - Vehicles removed when off-screen
- **Realistic behavior** - Braking, acceleration, wheel rotation

### Landmarks
- **Walmart Supercenter** (z: 1200) - Large big-box store with massive parking lot
- **Starbucks Coffee** (z: 800) - Strip mall location with plaza parking
- **City Center Shops** (z: 400) - Shopping center with Target, Best Buy, Kohl's
- **Gas Stations** - Canopy style with convenience stores
- **Fast Food Row** - McDonald's, Wendy's, Chick-fil-A

### Road System
- **Main arterial**: Jefferson Ave (4 lanes + center turn lane)
- **Cross streets**: Kiln Creek Pkwy, Warwick Blvd, City Center Blvd, Walmart Way
- **Traffic lights** at major intersections (always green)
- **Lane markings**: Yellow center lines, white dashed lane dividers
- **Sidewalks**: Both sides with raised curbs

### Navigation
- **Waypoint system**: Set destination to Walmart or Starbucks
- **Visual markers**: Green beacon shows your destination
- **Street name display**: Shows current location on Jefferson Ave
- **Minimap**: Top-down view with compass and landmark icons
- **Arrival detection**: Automatic waypoint clearing when reached

### Environment
- **Street infrastructure**: Streetlights every 40 units, power poles every 60 units
- **Vegetation**: Trees along corridor with trunks and foliage
- **Parking lots**: Striped spaces at all major locations
- **Signage**: Branded store signs with emissive materials
- **Fog system**: Extended visibility (100-400 units) for performance

---

## 📁 File Structure

```
/
├── index.html                  # HTML structure and UI styling
├── main.js                     # Main application loop and coordination
├── config.js                   # Configuration constants
│
├── Cybertruck.js              # Vehicle physics and 3D model loading
├── InputManager.js            # Keyboard input handling and mapping
├── CameraController.js        # Showroom and driving camera modes
│
├── Showroom.js                # Starting showroom with sliding doors
├── JeffersonAve.js           # ⭐ Main corridor scene builder
├── NavigationSystem.js        # Waypoint and destination management
├── TrafficSystem.js          # ⭐ AI traffic vehicles
├── CameraIntro.js            # ⭐ Cinematic aerial intro
├── Minimap.js                 # 2D minimap canvas rendering
│
└── README_JEFFERSON_AVE.md    # This file
```

---

## 🏗️ Architecture

### CameraIntro.js - Cinematic Opener
**Purpose**: Creates an aerial establishing shot that zooms down to the showroom

**Key Features**:
- **4-second animation** with ease-in-out cubic curve
- **Starts high** (0, 200, -100) looking at corridor
- **Ends at orbit** (12, 6, 12) looking at Cybertruck
- **Skippable** with click event
- **Smooth interpolation** of position and look-at target

**Usage**:
```javascript
const intro = new CameraIntro(camera, targetPos);
intro.start();

// In animation loop
if (intro.isActive()) {
  const complete = intro.update();
  if (complete) {
    // Enable controls
  }
}

// Skip manually
intro.skip();
```

### TrafficSystem.js - AI Vehicles
**Purpose**: Manages autonomous vehicles driving on Jefferson Ave

**Key Features**:
- **Vehicle pool management**: Spawn/despawn system
- **Lane-based movement**: 4 lanes (2 northbound, 2 southbound)
- **Following behavior**: Vehicles detect and follow cars ahead
- **Speed adjustment**: Slows down when too close to vehicle ahead
- **Collision detection**: Checks distance to player
- **Realistic details**: Rotating wheels, headlights, taillights

**Vehicle Structure**:
```javascript
{
  mesh: THREE.Group,        // 3D model
  wheels: [THREE.Mesh],     // Wheel references
  lane: { x, direction },   // Lane data
  speed: Number,            // Current speed
  targetSpeed: Number,      // Desired speed
  position: Number,         // Z position
  following: Vehicle|null   // Vehicle ahead
}
```

**Configuration**:
```javascript
config: {
  maxVehicles: 15,
  spawnInterval: 3000,  // ms
  minSpeed: 15,
  maxSpeed: 30,
  lanes: [
    { x: -10, direction: 1 },   // Northbound right
    { x: -6, direction: 1 },    // Northbound left
    { x: 6, direction: -1 },    // Southbound left
    { x: 10, direction: -1 }    // Southbound right
  ]
}
```

### JeffersonAve.js - Core Scene Builder
**Purpose**: Creates the entire drivable corridor

**Key Methods**:
- `createMainRoad()` - Jefferson Ave with lanes and markings
- `createWalmartComplex()` - Walmart building + parking
- `createStarbucksPlaza()` - Strip mall with Starbucks
- `createShoppingCenter()` - Multi-store retail complex
- `createIntersection(name, x, z)` - Traffic light intersections
- `createParkingLot(x, z, width, depth)` - Striped parking areas
- `createSign(text, x, y, z, color)` - Emissive store signs
- `addStreetInfrastructure()` - Lights, poles, vegetation
- `getCurrentStreet(z)` - Returns street name based on position

**Data Structures**:
```javascript
this.landmarks = [
  {
    name: 'Walmart Supercenter',
    type: 'walmart',
    position: { x, z },
    icon: '🛒'
  },
  // ...
];

this.collisionObjects = [
  { x, z, radius },
  // ...
];

this.intersections = [
  { name: 'Kiln Creek Pkwy', position: { x, z } },
  // ...
];
```

### NavigationSystem.js - Waypoint Management
- **setDestination(landmarkName)**: Finds and activates waypoint
- **createWaypointMarker(position)**: Spawns green beacon
- **getDistanceToWaypoint(playerPos)**: Returns distance and direction
- **checkArrival(playerPos, threshold)**: Auto-clears on arrival
- **update()**: Animates beacon (pulse, rotation, bob)

### Minimap.js - 2D Navigation
- Renders Jefferson Ave as vertical road
- Shows landmarks with colored icons
- Compass directions (N/S/E/W)
- Truck indicator always centered
- Dynamic scale based on speed/zoom

---

## 🎨 Materials System

**Cached materials** for performance (no redundant allocations):
```javascript
this.materials = {
  road: MeshStandardMaterial,          // Dark asphalt
  roadLine: MeshBasicMaterial,         // Yellow/white
  sidewalk: MeshStandardMaterial,      // Light gray
  building: MeshStandardMaterial,      // Generic gray
  walmart: MeshStandardMaterial,       // #1a4f9a (blue)
  starbucks: MeshStandardMaterial,     // #00754a (green)
  parking: MeshStandardMaterial        // Dark gray
};
```

---

## ⚡ Performance Optimizations

### Implemented
1. **Material Caching**: Single material instances reused across meshes
2. **Fog System**: Extended fog (100-400 units) culls distant objects
3. **Low-Poly Models**: Simple geometry for buildings/props
4. **Minimal Lights**: Only 6 lights total (ambient, directional, hemisphere, 2 accents, 2 headlights)
5. **LOD-Ready Structure**: Organized for future LOD implementation
6. **Collision Simplification**: Radius-based collision (not mesh-based)

### Ready for Instancing
Repeatable elements prepared for InstancedMesh:
- Street lights (`createStreetLight`)
- Power poles (`createPowerPole`)
- Trees (`createSimpleTree`)
- Parking space lines

**To implement instancing**:
```javascript
// Example for street lights
const lightGeometry = new THREE.CylinderGeometry(0.15, 0.15, 10, 8);
const lightMaterial = this.materials.building;
const lightCount = 75; // 40-unit spacing × 1500 units / 40

const instancedLights = new THREE.InstancedMesh(
  lightGeometry,
  lightMaterial,
  lightCount
);

for (let i = 0; i < lightCount; i++) {
  const matrix = new THREE.Matrix4();
  const x = i % 2 === 0 ? -20 : 20;
  const z = Math.floor(i / 2) * 40;
  matrix.setPosition(x, 5, z);
  instancedLights.setMatrixAt(i, matrix);
}

this.scene.add(instancedLights);
```

---

## 🔧 How to Extend the Corridor

### Adding New Landmarks
1. Open `JeffersonAve.js`
2. Create a new method following the pattern:
```javascript
createYourLandmark(x, z) {
  // Building geometry
  const building = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color: 0xYOURCOLOR })
  );
  building.position.set(x, height / 2, z);
  building.castShadow = true;
  this.scene.add(building);
  
  // Sign
  this.createSign('YOUR NAME', x, height + 2, z - depth / 2, 0xCOLOR);
  
  // Parking lot
  this.createParkingLot(x, z + 30, 50, 30);
  
  // Collision
  this.collisionObjects.push({ x, z, radius: 30 });
  
  // Register landmark
  this.landmarks.push({
    name: 'Your Landmark',
    type: 'yourtype',
    position: { x, z },
    icon: '🏢'
  });
}
```

3. Call it in `buildCorridor()`:
```javascript
this.createYourLandmark(100, 1000);
```

4. Add to minimap in `Minimap.js`:
```javascript
this.landmarks = [
  // ... existing landmarks
  { name: 'Your Landmark', x: 100, z: 1000, color: '#YOURCOLOR', icon: '🏢' }
];
```

### Extending the Road
1. In `createMainRoad()`, increase `roadLength`:
```javascript
const roadLength = 2000; // Was 1500
```

2. Update fog distance in `main.js`:
```javascript
this.scene.fog = new THREE.Fog(0x87CEEB, 100, 500); // Increased from 400
```

3. Adjust landmark positions proportionally

### Adding New Cross Streets
```javascript
this.createIntersection('New Street Name', 0, 1400);
```

### Adding Building Variety
Create modular building functions:
```javascript
createOfficeBuilding(x, z, floors) {
  const floorHeight = 3;
  const height = floors * floorHeight;
  // ... implementation
}

createWarehouse(x, z, width, depth) {
  // ... implementation
}
```

### Customizing Traffic

**Adjust traffic density**:
```javascript
// In TrafficSystem.js config
maxVehicles: 25,        // More cars (was 15)
spawnInterval: 2000,    // Spawn faster (was 3000ms)
```

**Change traffic speed**:
```javascript
minSpeed: 20,           // Faster minimum (was 15)
maxSpeed: 40,           // Faster maximum (was 30)
```

**Add more lanes**:
```javascript
lanes: [
  // ... existing lanes
  { x: -2, direction: 1 },   // Center lane northbound
  { x: 2, direction: -1 }    // Center lane southbound
]
```

**Different vehicle types**:
```javascript
// Add to createVehicle()
const vehicleTypes = [
  { width: 1.8, length: 4, color: 0xff0000 },    // Car
  { width: 2.2, length: 6, color: 0x0000ff },    // SUV
  { width: 2.5, length: 8, color: 0xffff00 }     // Truck
];

const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
// Use type.width, type.length, type.color
```

**Traffic light integration** (future):
```javascript
class TrafficLight {
  constructor(intersection) {
    this.state = 'green'; // green, yellow, red
    this.timer = 0;
  }
  
  update(deltaTime) {
    this.timer += deltaTime;
    if (this.timer > this.duration) {
      this.changeState();
    }
  }
  
  shouldStop(vehiclePosition) {
    return this.state === 'red' && /* vehicle near intersection */;
  }
}
```

---

## 🎯 Collision System

**Simple radius-based**:
```javascript
this.collisionObjects.push({
  x: buildingX,
  z: buildingZ,
  radius: 30 // Meters
});
```

In `Cybertruck.update()`:
```javascript
for (const obj of collisionObjects) {
  const dx = newX - obj.x;
  const dz = newZ - obj.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  
  if (distance < truckRadius + obj.radius) {
    canMove = false;
    this.speed *= 0.5; // Bounce back
    break;
  }
}
```

**Benefits**:
- Fast (no raycasting)
- Works for 90% of cases
- Easy to debug

**For more precision**, add mesh-based raycasting:
```javascript
const raycaster = new THREE.Raycaster();
raycaster.set(truckPosition, direction);
const intersects = raycaster.intersectObjects(buildingMeshes);
```

---

## 🎨 Branding Guidelines

**Store Colors** (from real brands):
- Walmart: `#0071ce` (blue), `#ffc220` (yellow)
- Starbucks: `#00754a` (green)
- Target: `#cc0000` (red)
- Best Buy: `#0046be` (blue)
- McDonald's: `#ffc72c` (yellow/gold)
- Wendy's: `#e1251b` (red)
- Chick-fil-A: `#e51837` (red)

**Sign Placement**:
- Mounted 1-2 units above building height
- Positioned at front (z - depth/2)
- Emissive intensity: 0.3 for night visibility
- Add point light for glow effect

---

## 🚗 Driving Controls

**Keyboard**:
- W / ↑ : Accelerate forward
- S / ↓ : Reverse
- A / ← : Turn left
- D / → : Turn right
- SPACE / SHIFT : Brake

**Physics** (in `config.js`):
```javascript
drive: {
  acceleration: 1.2,
  maxSpeed: 50,
  turnSpeed: 0.025,
  friction: 0.96,
  brakeFriction: 0.85
}
```

---

## 📊 Coordinate System

**Origin** (0, 0, 0): Showroom center
**Z-axis**: North (+) to South (-)
- 0-200: Kiln Creek area
- 200-600: Mid-Jefferson
- 600-900: City Center area
- 900-1500: Walmart area

**X-axis**: West (-) to East (+)
- -35 to -17: Left sidewalk/buildings
- -17 to +17: Main road
- +17 to +35: Right sidewalk/buildings

**Y-axis**: Ground to sky
- 0: Ground level
- 0-15: Buildings
- 15+: Air/sky

---

## 🔮 Future Enhancements

### Streaming/Chunking
Split corridor into zones:
```javascript
const zones = [
  { name: 'Kiln Creek', zStart: 0, zEnd: 300 },
  { name: 'Mid-Jefferson', zStart: 300, zEnd: 700 },
  { name: 'City Center', zStart: 700, zEnd: 1100 },
  { name: 'Walmart Area', zStart: 1100, zEnd: 1500 }
];

// Load/unload based on player position
if (playerZ > zone.zStart - 200 && playerZ < zone.zEnd + 200) {
  loadZone(zone);
} else {
  unloadZone(zone);
}
```

### Traffic System
```javascript
class Vehicle {
  constructor(lane, startZ) {
    this.position = { x: lane, z: startZ };
    this.speed = 20 + Math.random() * 10;
  }
  
  update(deltaTime) {
    this.position.z += this.speed * deltaTime;
    // Wrap around or despawn
  }
}
```

### Weather/Time of Day
```javascript
class TimeOfDay {
  constructor(scene) {
    this.hour = 12;
    this.updateLighting();
  }
  
  update(deltaTime) {
    this.hour += deltaTime / 60; // 1 hour per minute
    this.updateLighting();
  }
  
  updateLighting() {
    const sunAngle = (this.hour - 6) / 12 * Math.PI;
    this.directionalLight.position.setFromSphericalCoords(
      100, Math.PI / 2 - sunAngle, 0
    );
    
    const skyColor = this.getSkyColor(this.hour);
    this.scene.background = new THREE.Color(skyColor);
  }
}
```

---

## 📝 Notes

- All positions in world units (1 unit ≈ 1 meter)
- Corridor is ~1500 units (~3 miles at 1:2 scale)
- Collision radius typically matches visual size + buffer
- Emissive materials for signs ensure night visibility
- Fog extends to 400 units for performance balance

---

## 🐛 Troubleshooting

**Truck won't move?**
- Check console for input logs
- Verify `isDriveMode: true` in input
- Ensure collision objects aren't blocking spawn

**Performance issues?**
- Reduce shadow-casting objects
- Increase fog start/end values
- Implement instancing for repeated props
- Lower material quality (roughness/metalness)

**Landmarks not showing?**
- Verify position is within corridor bounds (z: 0-1500)
- Check material color isn't fog-color (0x87CEEB)
- Ensure building has castShadow=true
- Add collision object for proper placement

---

## 📄 License
This is a demonstration project inspired by real-world locations. Store brands and names are used for demonstration purposes only.

---

Built with ❤️ using Three.js
