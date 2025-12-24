# DevCargame Runbook

Last updated: 2025-12-24

## Run locally

### Option A: VS Code Live Server (recommended)
- Install extension “Live Server”
- Right-click index.html → “Open with Live Server”

### Option B: Python
- From the repo root:
  - `python -m http.server 8000`
  - Open: http://localhost:8000/

### Option C: Node
- From the repo root:
  - `npx http-server -p 8000`
  - Open: http://localhost:8000/

Notes:
- Don’t open index.html via `file://` if you see missing assets/audio; use a local server.

## Deploy on Netlify (static)

This project has no build step; it’s served directly from the repo root.

Netlify settings:
- Branch to deploy: `devcar`
- Base directory: (blank) or `.`
- Build command: (blank)
- Publish directory: `.`
- Functions directory: (blank)

## Controls (in-game)

Driving:
- W/A/S/D or Arrow keys: accelerate/steer
- Space (and/or Shift): brake

Gameplay:
- E: exit/enter vehicle (character mode)
- Q: dance (character mode)
- Shift: run (character mode)
- R: respawn
- C: vehicle customization
- 1/2/3: switch vehicle profiles
- M: toggle map mode (Jefferson Ave ↔ Modular City)
- G: return to garage (reload)

## Troubleshooting

- Black screen / nothing loads:
  - Confirm you’re using a local server (Live Server / http.server / http-server).
- No movement:
  - Verify the browser console shows no errors.
  - If you’re in character mode, press E to re-enter the vehicle.
- Mobile input feels “stuck”:
  - Reload the page; touch controls are reset on hide.

## What each “page” / module does

Entry/UI:
- index.html: main page and UI layout; loads JS modules (ESM) and Three.js via import map.
- main.js: orchestrates scenes, the main animation loop, and wires systems together.

Scenes / world:
- GarageScene.js: garage/showroom selection flow.
- Showroom.js: showroom presentation and visuals.
- City.js: simple fixed city layout (roads/buildings/props) + collision circles.
- JeffersonAve.js: detailed corridor map mode + collision circles.
- CityBlockSystem.js: procedural modular city blocks + collision circles.

Player / vehicle:
- Cybertruck.js: vehicle physics/movement + collision checks.
- VehicleCustomization.js: customization UI + upgrades + saved state.
- RespawnSystem.js: flip/out-of-bounds recovery.

Camera:
- CameraController.js: follow/drive camera logic.
- CameraIntro.js: aerial intro/skip logic.

Input & mobile:
- InputManager.js: keyboard state + truck input adapter.
- MobileDrivingControls.js: touch driving overlay (steering/gas/brake) for mobile.

AI / systems:
- TrafficSystem.js: AI traffic vehicles and collisions.
- PedestrianSystem.js: pedestrian spawning and movement.
- CharacterSystem.js: exit-vehicle character controller, animations, and joystick.
- NavigationSystem.js: waypoint/destination navigation.

UI / feedback:
- Minimap.js: minimap drawing.
- LapTimer.js: lap timing/persistence.
- SoundManager.js: engine/brake/collision/horn audio.
- SoundToggleButton.js: mute toggle UI.

Config/assets:
- config.js: vehicle profiles and tuning constants.
- assets/: local GLB models.
- export-metadata.json: export metadata.
- rosie/: rosie control helpers (see rosie/README.md).

## Project inventory
- Directory tree snapshot: see DIR_TREE.md

## Local change log (ignored)
- Put personal notes and scratch logs under change-log/ (ignored by git).
