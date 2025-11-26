# Tilt Labyrinth

An interactive 3D maze game where you guide a metallic ball through a floating labyrinth using sequential tilt controls.

## Overview

Tilt Labyrinth is a physics-based puzzle game that requires precise sequential input to navigate a ball through a suspended maze structure. The game features smooth animations, realistic ball physics, and a spectacular finale sequence when completed.

## Features

### Scene & Visuals
- **Floating Maze**: Suspended 3D maze structure with 6 vertical walls
- **No Floor/Ceiling**: Complete visibility through the maze structure
- **Metallic Ball**: 18mm diameter ball with reflective metal appearance
- **Bird's-Eye Camera**: Fixed 25° tilt angle for optimal viewing
- **Atmospheric Rendering**: Fog effects and professional lighting setup

### Controls
- **Camera Orbit**: Drag mouse or swipe to rotate camera around the maze
  - Camera maintains fixed height and distance
  - Smooth orbital rotation only
- **Tilt Sequence**: Four arrow key inputs in strict order
  - **Step 1**: `←` Left Arrow - Roll through one corner (low speed)
  - **Step 2**: `→` Right Arrow - Roll through two corners (medium speed + sound)
  - **Step 3**: `↑` Up Arrow - Move to center platform edge
  - **Step 4**: `↓` Down Arrow - Reach exact center and trigger finale

### Finale Event
When the ball reaches the center:
1. **Maze Drop**: Entire structure drops 8% of height (0.2s ease-out)
2. **Ball Launch**: Ball launches upward 12% of maze height (parabolic motion)
3. **Orbital Flight**: Ball circles outside maze for 2 complete loops (4 seconds)
4. **Return**: Ball smoothly returns to exact center and stops

## How to Play

### Quick Start
1. Open `index.html` in a modern web browser
2. Use mouse/touch to explore the scene by orbiting the camera
3. Follow the four-step tilt sequence using arrow keys
4. Watch the finale animation

### Detailed Instructions

**Step 1 - Tilt Left** (`←`)
- Ball begins at maze entrance (top-left)
- Rolls through first 90-degree corner
- Low speed movement
- Wait for ball to stop before next input

**Step 2 - Tilt Right** (`→`)
- Ball navigates through two corners
- Medium speed with rolling sound effect
- Longer path segment
- Wait for ball to complete movement

**Step 3 - Tilt Forward** (`↑`)
- Ball approaches center platform
- Moves to edge of circular center
- Prepares for final movement

**Step 4 - Tilt Backward** (`↓`)
- Ball reaches exact center point
- Stops precisely at center
- Automatically triggers finale sequence

### Important Notes
- Inputs must be in exact sequence (left → right → forward → backward)
- Wait for current animation to complete before next input
- Wrong input order will be ignored
- Camera can be orbited anytime during gameplay
- No text or UI elements during gameplay

## Technical Details

### Technologies
- **Three.js r152**: 3D graphics rendering engine
- **Vanilla JavaScript**: No dependencies beyond Three.js
- **Web Audio API**: Procedural sound generation
- **Custom Physics**: Lightweight physics simulation

### Performance
- Optimized rendering pipeline
- Shadow mapping for realistic depth
- Anti-aliasing enabled
- Responsive design for all screen sizes
- 60 FPS target frame rate

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Requires WebGL 2.0 support

### Architecture
```
index.html          # Minimal HTML structure
app.js              # Complete application
  ├─ Scene Setup    # Three.js initialization
  ├─ Maze Creation  # Procedural maze geometry
  ├─ Ball Physics   # Custom physics simulation
  ├─ Input System   # Sequential control handler
  ├─ Animation      # Step animations & finale
  └─ Audio          # Web Audio sound generation
```

## Installation & Setup

### Option 1: Direct Browser
Simply open `index.html` in any modern browser.

### Option 2: Local Server (Recommended)
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve

# PHP
php -S localhost:8000
```

Navigate to `http://localhost:8000`

### Option 3: Live Server
Use VS Code Live Server extension or similar tool.

## Project Structure

```
Tilt-Labyrinth-1/
├── index.html      # Entry point
├── app.js          # Main application
└── README.md       # Documentation
```

## Physics & Game Mechanics

### Ball Properties
- **Diameter**: 18mm (0.18 units radius)
- **Material**: Metallic with high reflectivity
- **Start Position**: Maze entrance at (-3.2, Y, -3.2)
- **Movement**: Velocity-based with smooth interpolation

### Maze Specifications
- **Size**: 8x8 units
- **Wall Height**: 0.5 units
- **Wall Thickness**: 0.2 units
- **Elevation**: 3 units above origin
- **Walls**: 6 total (4 outer boundary + 2 inner path)
- **Center Platform**: 0.9 unit radius circle

### Animation Timing
- **Step 1**: ~2 seconds
- **Step 2**: ~3 seconds (with sound)
- **Step 3**: ~2 seconds
- **Step 4**: ~1.5 seconds
- **Finale Total**: ~5.7 seconds
  - Maze drop: 0.2s
  - Ball launch: 0.5s
  - Orbit: 4.0s
  - Return: 1.0s

### Camera Settings
- **FOV**: 50 degrees
- **Distance**: 18 units from center
- **Height**: 7 units above maze
- **Rotation**: Free horizontal orbit
- **Look Target**: Maze center

## Design Philosophy

### Minimalism
- No UI elements during gameplay
- No score or timer
- Pure spatial interaction
- Focus on motion and physics

### Sequential Gameplay
- Strict input order enforces puzzle solving
- Each step reveals next part of path
- Progressive disclosure of maze layout
- Satisfying completion reward

### Visual Clarity
- High contrast walls (white on gray)
- Clear ball visibility (blue metallic)
- No visual clutter
- Fog provides depth perception

## Troubleshooting

### Ball not moving
- Ensure correct arrow key for current step
- Wait for previous animation to complete
- Check browser console for step indicators

### Camera not orbiting
- Click and drag on canvas
- Ensure mouse is over the 3D view
- Try touch drag on mobile devices

### No sound
- Browser may block audio initially
- Interact with page first (click/key press)
- Check browser audio permissions
- Sound only plays on step 2

### Performance issues
- Close other browser tabs
- Update graphics drivers
- Try different browser
- Reduce browser zoom level

## Development

### Modifying Maze Layout
Edit `wallDefinitions` array in `createMaze()` function:
```javascript
{ x: 0, z: -4, w: 8, d: 0.2, label: 'wall_name' }
```

### Adjusting Ball Speed
Modify speed parameters in step functions:
```javascript
const speed = 0.8;  // Lower = slower
```

### Changing Animation Timing
Update duration values in animation functions:
```javascript
const duration = 200;  // milliseconds
```

### Custom Camera Position
Adjust camera properties in STATE:
```javascript
cameraRadius: 18,   // Distance from center
cameraHeight: 7,    // Height above maze
```

## Credits

**Created by**: Claude (Anthropic)
**Graphics Engine**: Three.js
**Physics**: Custom implementation
**Sound**: Web Audio API

## License

MIT License - Free to use and modify for personal and commercial projects.

---

Enjoy navigating the Tilt Labyrinth! 🎮
