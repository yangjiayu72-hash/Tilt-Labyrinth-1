# Tilt Labyrinth

An interactive 3D labyrinth game where you guide a metal ball through a floating maze using tilt controls.

![Tilt Labyrinth](https://img.shields.io/badge/Three.js-r152-blue) ![Cannon.js](https://img.shields.io/badge/Cannon--ES-0.20.0-green)

## Features

- **3D Floating Maze**: A maze structure suspended in mid-air with no floor or ceiling
- **Physics-Based Ball**: Realistic metal ball with gravity and collision physics
- **Orbital Camera**: Mouse/touch-controlled camera that orbits around the maze
- **Sequential Tilt Controls**: Four-step sequence of tilt movements to guide the ball
- **Dynamic Animations**: Maze drop, ball launch, and orbital animations upon completion
- **Rolling Sound Effects**: Audio feedback during ball movement
- **Responsive Design**: Works on desktop and mobile devices

## How to Play

### Controls

- **Arrow Keys**: Tilt the maze (← → ↑ ↓)
- **Mouse Drag**: Orbit the camera around the maze
- **Touch Drag** (mobile): Orbit the camera

### Sequence

Follow this exact sequence to complete the maze:

1. **Press ←** (Left): Ball rolls through one 90-degree corner at low speed
2. **Press →** (Right): Ball rolls through two corners at medium speed with sound
3. **Press ↑** (Forward): Ball moves toward the center platform
4. **Press ↓** (Backward): Ball reaches the center and triggers the finale

### Finale Event

When the ball reaches the center:
- The maze drops slightly (8% of its height)
- The ball launches upward (12% of maze height)
- The ball orbits around the outside of the maze twice
- The ball returns to rest at the exact center

## Installation

### Option 1: Open Directly
Simply open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge).

### Option 2: Local Server
For better performance and to avoid CORS issues:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

## Technologies

- **Three.js** (r152): 3D graphics rendering
- **Cannon-ES** (0.20.0): Physics simulation
- **Web Audio API**: Sound effects
- **Vanilla JavaScript**: No framework dependencies

## Project Structure

```
Tilt-Labyrinth-1/
├── index.html          # Main HTML file with scene container
├── main.js             # Three.js application logic
└── README.md           # This file
```

## Technical Details

### Scene Setup
- **Background**: Neutral gray (#d4d4d4)
- **Camera**: Bird's-eye view at 25-degree tilt angle
- **Camera Distance**: 15 units from maze center
- **Camera Height**: 8 units above maze

### Maze Structure
- **Dimensions**: 6x6 units
- **Wall Height**: 0.5 units
- **Wall Thickness**: 0.2 units
- **Walls**: 6 walls forming paths with a circular center platform
- **Position**: Floating at Y = 2 units

### Ball Properties
- **Radius**: 0.18 units (18mm diameter)
- **Mass**: 0.05 kg (50 grams)
- **Material**: Metallic blue with high reflectivity
- **Starting Position**: Maze entrance (-2.5, Y, -2.5)

### Physics
- **Gravity**: -9.82 m/s²
- **Friction**: 0.3
- **Restitution**: 0.2 (slight bounciness)
- **Damping**: Linear and angular damping at 0.3

### Animations
- **Maze Drop**: 0.2 seconds with ease-out easing
- **Ball Launch**: 0.3 seconds with parabolic motion
- **Ball Orbit**: 4 seconds for 2 complete loops
- **Ball Return**: 1 second with ease-in-out

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

Requires WebGL support and JavaScript enabled.

## License

MIT License - Feel free to use and modify for your own projects.

## Credits

Created with Three.js and Cannon-ES physics engine.
