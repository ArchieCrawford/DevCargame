# 🚗 GTA-Style Driving Sandbox

A complete 3D driving experience built with Three.js, featuring multiple vehicles, two map systems, and full gameplay features.

## 🎮 Features

### ✅ Vehicle System
- **3 Real Vehicle Models** loaded from assets:
  - **Cybertruck** - Heavy electric pickup (125 MPH, balanced handling)
  - **Tesla Model** - Sleek sedan (155 MPH, high-tech agility)
  - **RC Racer** - Compact racing machine (140 MPH, ultra-nimble)
- **Garage Selection Screen** - Pick your vehicle with stats display
- **Hot-swap vehicles** during gameplay (Press 1/2/3)
- **Unique handling profiles** per vehicle (acceleration, top speed, turn speed, friction)

### 🏙️ Map Systems

**Jefferson Ave Corridor Mode** (Default):
- Detailed 3-mile corridor with landmarks
- Walmart, Starbucks, City Center, Gas Stations
- AI traffic (15 vehicles) with lane discipline
- Pedestrians walking on sidewalks
- Navigation waypoints to destinations

**Modular City Mode** (Press M to toggle):
- **Infinite expandable city** with procedural block generation
- **6 block types**: Residential, Commercial, Downtown, Park, Parking, Industrial
- **Dynamic loading/unloading** - loads blocks as you drive, unloads distant ones
- Performance-optimized for large-scale exploration
- Block coordinate display

### 🎯 Gameplay Features

**Respawn System** (Press R):
- Auto-respawns when flipped or out of bounds
- Smooth fade transition
- Spawns at nearest checkpoint

**Vehicle Customization** (Press C):
- **12 Paint Colors**: Silver (free), Red, Blue, Green, Yellow, Orange, Purple, Pink, Black, White, Gold, Chrome
- **4 Performance Upgrades**:
  - Engine (4 stages): +30-100% acceleration
  - Turbo (4 stages): +5-15 MPH top speed
  - Handling (4 stages): +50-150% turn speed
  - Brakes (3 stages): +5-10% brake power
- **Credit System**: Earn $50 per mile driven
- **Persistent Storage**: All purchases saved to localStorage

**Character System** (Press E):
- Exit/enter any vehicle
- Walk, run, and dance animations
- Third-person camera follows character
- Mobile joystick controls

**Pedestrian AI**:
- 25 animated pedestrians walking on sidewalks
- Realistic walking animations (leg/arm swing, body bob)
- Dynamic spawning based on player position

**Traffic System**:
- 15 AI vehicles with varied colors
- 4-lane traffic with smart following behavior
- Collision detection with bounce-back

### 🎨 Polish

- **Garage showroom** with rotating turntable
- **Speedometer** with gear indicator (P/D/R)
- **Minimap** with compass and landmarks
- **Street name display** / Block coordinates
- **Cinematic intro** with skip option
- **Power bar** showing acceleration

## 🎮 Controls

### Driving
- **WASD** or **Arrow Keys** - Accelerate, brake, steer
- **SPACE** - Hand brake
- **Mouse** - Look around

### Features
- **R** - Manual respawn
- **C** - Open customization menu
- **E** - Exit/enter vehicle
- **Q** - Dance (character mode)
- **Shift** - Run (character mode)
- **1/2/3** - Switch vehicle profile
- **M** - Toggle map mode (Jefferson Ave ↔ Modular City)
- **G** - Return to garage

### Garage
- **Arrow Keys** or **Buttons** - Browse vehicles
- **Enter** or **Click** - Select and drive

## 📁 Project Structure

```
/
├── main.js                    # Main game orchestration & scene flow
├── Cybertruck.js              # Vehicle controller with profile support
├── GarageScene.js             # Car selection showroom
├── JeffersonAve.js            # Detailed corridor map
├── CityBlockSystem.js         # Modular expandable city generator
├── TrafficSystem.js           # AI vehicle management
├── PedestrianSystem.js        # Pedestrian spawning & animation
├── NavigationSystem.js        # Waypoint markers
├── RespawnSystem.js           # Flip/OOB recovery
├── LapTimer.js                # Lap timing with localStorage
├── CameraController.js        # Third-person follow camera
├── CameraIntro.js             # Aerial intro sequence
├── InputManager.js            # Keyboard input handling
├── Minimap.js                 # 2D canvas minimap
├── config.js                  # Vehicle profiles & game config
└── index.html                 # UI & styling
```

## 🚀 Technical Highlights

### Performance Optimizations
- **Material caching** - Single instances reused
- **Simple collision** - Radius-based (not raycasting)
- **Dynamic block loading** - Modular city only loads visible blocks
- **Traffic limits** - Max 15 vehicles with 3s spawn intervals
- **Fog culling** - 100-400 unit range
- **Minimal lights** - 3 main lights + 2 headlights
- **Lazy-loaded pedestrians** - Async module loading

### Asset Pipeline
- **Real GLB models** loaded from asset library
- **Profile-driven** - Vehicle config includes model URL + scale
- **Fallback placeholders** - Graceful degradation if models fail
- **Instanced geometry** - Shared meshes for repeated props

### State Management
- **localStorage persistence**:
  - Selected vehicle
  - Best lap time
  - Map preference (Jefferson Ave vs Modular City)
  - Skip garage preference
- **Scene transitions** - Smooth garage → city flow

## 🔧 How to Extend

### Adding a New Vehicle

1. **Upload model** to assets
2. **Add to config.js**:
```javascript
vehicles: {
  mycar: {
    name: 'My Car',
    acceleration: 1.5,
    maxSpeed: 60,
    turnSpeed: 0.030,
    friction: 0.95,
    brakeFriction: 0.82,
    weight: 'medium',
    modelUrl: 'https://rosebud.ai/assets/mycar.glb?XXXX',
    scale: 1.0
  }
}
```

3. **Add to GarageScene.js** cars array:
```javascript
{
  id: 'mycar',
  name: 'My Car',
  description: 'Description here',
  stats: { topSpeed: 150, accel: 8, handling: 7 },
  modelUrl: 'https://rosebud.ai/assets/mycar.glb?XXXX',
  scale: 1.0
}
```

### Adding a New City Block Type

In `CityBlockSystem.js`:

1. **Add template function**:
```javascript
createMyBlock(blockX, blockZ) {
  const group = new THREE.Group();
  const worldPos = this.blockToWorldCoords(blockX, blockZ);
  group.position.set(worldPos.x, 0, worldPos.z);
  
  // Add roads, buildings, props
  this.addRoadCross(group);
  // ... your custom content
  
  return group;
}
```

2. **Register in `createBlockTemplates()`**:
```javascript
myblock: (x, z) => this.createMyBlock(x, z)
```

3. **Update `getBlockType()` logic** to spawn your blocks

### Adding Missions/Collectibles

Create a new system file (e.g., `MissionSystem.js`):

```javascript
export class MissionSystem {
  constructor(scene, vehicle) {
    this.scene = scene;
    this.vehicle = vehicle;
    this.collectibles = [];
    this.spawnCollectibles();
  }
  
  spawnCollectibles() {
    // Add floating coins, checkpoints, etc.
  }
  
  update(deltaTime) {
    // Check proximity, award points
  }
}
```

Then integrate in `main.js`:
```javascript
this.missionSystem = new MissionSystem(this.scene, this.cybertruck);
```

## 📊 Config Reference

### Vehicle Profile Properties
- `name`: Display name
- `acceleration`: Acceleration rate (0.5-2.0)
- `maxSpeed`: Top speed in units/sec (30-80)
- `turnSpeed`: Steering sensitivity (0.015-0.045)
- `friction`: Movement friction (0.90-0.98, higher = slides less)
- `brakeFriction`: Brake strength (0.75-0.90, lower = stops faster)
- `weight`: 'light' | 'medium' | 'heavy' (visual only)
- `modelUrl`: Full asset URL
- `scale`: Model scale multiplier (0.5-1.5)

### City Block System
- `blockSize`: Size of each block (default 200)
- `loadDistance`: Blocks to load around player (default 2)
- `unloadDistance`: Distance to unload blocks (default 3)

### Spawn Points
Edit `CONFIG.spawnPoints` in config.js to add respawn locations

### Lap Checkpoints
Edit `CONFIG.lapCheckpoints` in config.js to modify race circuit

## 🎯 Roadmap / Future Enhancements

**Missions & Progression:**
- [ ] Collectible system (coins, stars)
- [ ] Time trial challenges
- [ ] Delivery missions
- [ ] Chase sequences

**Map Expansion:**
- [ ] Highway system connecting districts
- [ ] Tunnels and overpasses
- [ ] Stadium / airport zones
- [ ] Countryside expansion

**Vehicles:**
- [ ] Motorcycle support
- [ ] Damage system
- [ ] Customization (colors, upgrades)
- [ ] More vehicle types

**Polish:**
- [ ] Sound effects (engine, traffic, ambiance)
- [ ] Weather system (rain, fog)
- [ ] Day/night cycle
- [ ] Mobile touch controls
- [ ] Minimap zoom controls

**Performance:**
- [ ] Instanced meshes for repeated props
- [ ] LOD system for distant objects
- [ ] Web Workers for traffic AI

## 🏗️ Architecture Decisions

### Why Two Map Systems?

**Jefferson Ave** = Hand-crafted vertical slice
- Proves landmark system
- Great for missions/story
- Fixed content, easier to optimize

**Modular City** = Scalable open-world tech
- Infinite exploration
- Procedural variety
- Performance-friendly streaming

Both coexist to show different approaches to the same problem.

### Why Simple Collision?

Radius-based collision (not mesh raycasting) keeps performance high with many dynamic objects. For a GTA-style game, approximate collision is fine—players care more about driving feel than perfect physics.

### Why Lazy-load Pedestrians?

The pedestrian system is async-loaded to avoid blocking the main game initialization. If it fails (missing file, network error), the game still works perfectly.

## 🐛 Known Limitations

- Traffic lights always green (no state changes)
- No lane-changing for AI traffic
- Simple collision (not mesh-accurate)
- No vehicle-to-vehicle collision (only player-to-traffic)
- Pedestrians don't avoid player
- Fixed spawn points (no varied entry/exit)

## 📝 Credits

Built with:
- **Three.js** (0.160.0) - 3D rendering
- **GLTFLoader** - Model loading
- **Vanilla JS** - No framework overhead
- **ESM modules** - Zero build configuration

Vehicle assets from project asset library.

## 📄 License

This is a prototype/demo project. Vehicle models belong to their respective rights holders.

---

**Ready to drive?** Select your ride in the garage and hit the streets! 🚗💨

# DevCargame

## Docs

- Run instructions + module overview: [RUNBOOK.md](RUNBOOK.md)
- Directory tree snapshot: [DIR_TREE.md](DIR_TREE.md)
