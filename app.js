/**
 * TILT LABYRINTH - Interactive 3D Maze Game
 * A physics-based maze game with sequential tilt controls
 */

// ==========================================
// GLOBAL STATE
// ==========================================
const STATE = {
    scene: null,
    camera: null,
    renderer: null,
    maze: null,
    ball: null,

    // Camera orbit
    cameraAngle: Math.PI / 4,
    cameraRadius: 18,
    cameraHeight: 7,

    // Input state
    isDragging: false,
    lastMouseX: 0,

    // Game sequence
    currentStep: 0,  // 0-3 for the four steps, 4 = complete
    isAnimating: false,

    // Ball physics
    ballPosition: { x: 0, y: 0, z: 0 },
    ballVelocity: { x: 0, y: 0, z: 0 },
    ballRadius: 0.18,  // 18mm

    // Maze state
    mazeY: 3,
    mazeDropped: false,

    // Walls for collision
    walls: [],

    // Animation
    animationQueue: [],
    clock: new THREE.Clock(),

    // Audio
    audioContext: null,
    oscillator: null
};

// ==========================================
// INITIALIZATION
// ==========================================
function init() {
    createScene();
    createLighting();
    createMaze();
    createBall();
    setupCamera();
    setupControls();
    initAudio();

    animate();
}

function createScene() {
    // Scene
    STATE.scene = new THREE.Scene();
    STATE.scene.background = new THREE.Color(0xb8b8b8);
    STATE.scene.fog = new THREE.Fog(0xb8b8b8, 15, 40);

    // Renderer
    STATE.renderer = new THREE.WebGLRenderer({ antialias: true });
    STATE.renderer.setSize(window.innerWidth, window.innerHeight);
    STATE.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    STATE.renderer.shadowMap.enabled = true;
    STATE.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.getElementById('container').appendChild(STATE.renderer.domElement);

    // Camera
    STATE.camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        100
    );
}

function createLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    STATE.scene.add(ambient);

    // Main directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(8, 15, 6);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -12;
    dirLight.shadow.camera.right = 12;
    dirLight.shadow.camera.top = 12;
    dirLight.shadow.camera.bottom = -12;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    STATE.scene.add(dirLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    STATE.scene.add(fillLight);

    // Hemisphere light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 0.4);
    STATE.scene.add(hemiLight);
}

function createMaze() {
    STATE.maze = new THREE.Group();
    STATE.maze.position.y = STATE.mazeY;

    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.6,
        metalness: 0.1,
        side: THREE.DoubleSide
    });

    const wallHeight = 0.5;
    const wallThickness = 0.2;

    // Define maze walls - creating a path with 6 walls
    // Path: Start -> Corner 1 -> Corner 2 -> Corner 3 -> Center
    const wallDefinitions = [
        // Outer boundary walls
        { x: 0, z: -4, w: 8, d: wallThickness, label: 'back' },      // Back wall
        { x: -4, z: 0, w: wallThickness, d: 8, label: 'left' },      // Left wall
        { x: 4, z: 0, w: wallThickness, d: 8, label: 'right' },      // Right wall
        { x: 0, z: 4, w: 8, d: wallThickness, label: 'front' },      // Front wall

        // Inner walls creating the path
        { x: 0, z: -1.5, w: 5, d: wallThickness, label: 'inner1' },  // Inner horizontal wall
        { x: 1.5, z: 1, w: wallThickness, d: 4, label: 'inner2' },   // Inner vertical wall
    ];

    STATE.walls = [];

    wallDefinitions.forEach((def, index) => {
        const geometry = new THREE.BoxGeometry(def.w, wallHeight, def.d);
        const mesh = new THREE.Mesh(geometry, wallMaterial);
        mesh.position.set(def.x, 0, def.z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        STATE.maze.add(mesh);

        // Store wall bounds for collision detection
        STATE.walls.push({
            minX: def.x - def.w / 2,
            maxX: def.x + def.w / 2,
            minZ: def.z - def.d / 2,
            maxZ: def.z + def.d / 2,
            minY: STATE.mazeY - wallHeight / 2,
            maxY: STATE.mazeY + wallHeight / 2
        });
    });

    // Create center platform (circular)
    const platformGeometry = new THREE.CylinderGeometry(0.9, 0.9, 0.15, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        roughness: 0.4,
        metalness: 0.2
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, -wallHeight / 2 + 0.075, 0);
    platform.castShadow = true;
    platform.receiveShadow = true;
    STATE.maze.add(platform);

    // Add platform to collision walls
    STATE.walls.push({
        minX: -0.9,
        maxX: 0.9,
        minZ: -0.9,
        maxZ: 0.9,
        minY: STATE.mazeY - wallHeight / 2,
        maxY: STATE.mazeY - wallHeight / 2 + 0.15,
        isPlatform: true
    });

    STATE.scene.add(STATE.maze);
}

function createBall() {
    const ballGeometry = new THREE.SphereGeometry(STATE.ballRadius, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({
        color: 0x2196F3,
        roughness: 0.15,
        metalness: 0.85,
        envMapIntensity: 1
    });

    STATE.ball = new THREE.Mesh(ballGeometry, ballMaterial);
    STATE.ball.castShadow = true;

    // Starting position - maze entrance (top-left area)
    STATE.ballPosition = {
        x: -3.2,
        y: STATE.mazeY + STATE.ballRadius + 0.05,
        z: -3.2
    };

    STATE.ball.position.set(
        STATE.ballPosition.x,
        STATE.ballPosition.y,
        STATE.ballPosition.z
    );

    STATE.scene.add(STATE.ball);
}

function setupCamera() {
    updateCameraPosition();
}

function updateCameraPosition() {
    const angle = STATE.cameraAngle;
    const radius = STATE.cameraRadius;
    const height = STATE.cameraHeight;

    STATE.camera.position.x = Math.cos(angle) * radius;
    STATE.camera.position.y = height;
    STATE.camera.position.z = Math.sin(angle) * radius;

    STATE.camera.lookAt(0, STATE.mazeY, 0);
}

// ==========================================
// CONTROLS
// ==========================================
function setupControls() {
    // Mouse/touch for camera orbit
    STATE.renderer.domElement.addEventListener('mousedown', onPointerDown);
    STATE.renderer.domElement.addEventListener('mousemove', onPointerMove);
    STATE.renderer.domElement.addEventListener('mouseup', onPointerUp);

    STATE.renderer.domElement.addEventListener('touchstart', onTouchStart);
    STATE.renderer.domElement.addEventListener('touchmove', onTouchMove);
    STATE.renderer.domElement.addEventListener('touchend', onTouchEnd);

    // Keyboard for tilt sequence
    window.addEventListener('keydown', onKeyDown);

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

function onPointerDown(event) {
    STATE.isDragging = true;
    STATE.lastMouseX = event.clientX;
}

function onPointerMove(event) {
    if (!STATE.isDragging) return;

    const deltaX = event.clientX - STATE.lastMouseX;
    STATE.cameraAngle -= deltaX * 0.005;
    STATE.lastMouseX = event.clientX;

    updateCameraPosition();
}

function onPointerUp() {
    STATE.isDragging = false;
}

function onTouchStart(event) {
    if (event.touches.length === 1) {
        STATE.isDragging = true;
        STATE.lastMouseX = event.touches[0].clientX;
    }
}

function onTouchMove(event) {
    if (!STATE.isDragging || event.touches.length !== 1) return;

    const deltaX = event.touches[0].clientX - STATE.lastMouseX;
    STATE.cameraAngle -= deltaX * 0.005;
    STATE.lastMouseX = event.touches[0].clientX;

    updateCameraPosition();
    event.preventDefault();
}

function onTouchEnd() {
    STATE.isDragging = false;
}

function onKeyDown(event) {
    if (STATE.isAnimating || STATE.currentStep >= 4) return;

    const key = event.key;

    // Step 0: Left arrow
    if (STATE.currentStep === 0 && key === 'ArrowLeft') {
        executeStepOne();
    }
    // Step 1: Right arrow
    else if (STATE.currentStep === 1 && key === 'ArrowRight') {
        executeStepTwo();
    }
    // Step 2: Up arrow (forward)
    else if (STATE.currentStep === 2 && key === 'ArrowUp') {
        executeStepThree();
    }
    // Step 3: Down arrow (backward)
    else if (STATE.currentStep === 3 && key === 'ArrowDown') {
        executeStepFour();
    }
}

function onWindowResize() {
    STATE.camera.aspect = window.innerWidth / window.innerHeight;
    STATE.camera.updateProjectionMatrix();
    STATE.renderer.setSize(window.innerWidth, window.innerHeight);
}

// ==========================================
// GAME SEQUENCE - FOUR STEPS
// ==========================================

// STEP 1: Tilt left - ball rolls through one 90-degree corner at low speed
function executeStepOne() {
    console.log('Step 1: Tilt Left');
    STATE.isAnimating = true;

    const waypoints = [
        { x: -3.2, z: -3.2 },  // Start
        { x: -3.2, z: -0.5 },  // Move down
        { x: -2.5, z: 0.5 }    // Turn right
    ];

    const speed = 0.8;  // Low speed
    followPath(waypoints, speed, () => {
        STATE.isAnimating = false;
        STATE.currentStep = 1;
    });
}

// STEP 2: Tilt right - ball rolls through two corners with medium speed + sound
function executeStepTwo() {
    console.log('Step 2: Tilt Right');
    STATE.isAnimating = true;

    playRollingSound(1.5);

    const waypoints = [
        { x: -2.5, z: 0.5 },   // Current position
        { x: 0.5, z: 0.5 },    // Move right
        { x: 0.5, z: -0.5 },   // Turn up (corner 1)
        { x: -0.5, z: -0.5 },  // Move left
        { x: -0.5, z: 1.5 }    // Turn down (corner 2)
    ];

    const speed = 1.5;  // Medium speed
    followPath(waypoints, speed, () => {
        STATE.isAnimating = false;
        STATE.currentStep = 2;
    });
}

// STEP 3: Tilt forward - ball moves toward center platform edge
function executeStepThree() {
    console.log('Step 3: Tilt Forward');
    STATE.isAnimating = true;

    const waypoints = [
        { x: -0.5, z: 1.5 },   // Current position
        { x: -0.5, z: 0.2 },   // Move toward center
        { x: -0.7, z: 0.0 }    // Edge of center platform
    ];

    const speed = 1.0;
    followPath(waypoints, speed, () => {
        STATE.isAnimating = false;
        STATE.currentStep = 3;
    });
}

// STEP 4: Tilt backward - ball reaches center and triggers feedback
function executeStepFour() {
    console.log('Step 4: Tilt Backward');
    STATE.isAnimating = true;

    const waypoints = [
        { x: -0.7, z: 0.0 },   // Current position
        { x: 0.0, z: 0.0 }     // Exact center
    ];

    const speed = 0.7;
    followPath(waypoints, speed, () => {
        STATE.isAnimating = false;
        STATE.currentStep = 4;
        // Trigger feedback event
        setTimeout(() => triggerFeedbackEvent(), 200);
    });
}

// ==========================================
// BALL MOVEMENT
// ==========================================
function followPath(waypoints, speed, onComplete) {
    let currentWaypoint = 0;
    const targetY = STATE.mazeY + STATE.ballRadius + 0.05;

    function moveToNext() {
        if (currentWaypoint >= waypoints.length) {
            STATE.ballVelocity.x = 0;
            STATE.ballVelocity.z = 0;
            if (onComplete) onComplete();
            return;
        }

        const target = waypoints[currentWaypoint];
        const dx = target.x - STATE.ballPosition.x;
        const dz = target.z - STATE.ballPosition.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 0.1) {
            currentWaypoint++;
            moveToNext();
            return;
        }

        const dirX = dx / distance;
        const dirZ = dz / distance;

        STATE.ballVelocity.x = dirX * speed * 0.016;
        STATE.ballVelocity.z = dirZ * speed * 0.016;

        requestAnimationFrame(moveToNext);
    }

    moveToNext();
}

// ==========================================
// FEEDBACK EVENT
// ==========================================
function triggerFeedbackEvent() {
    console.log('=== FEEDBACK EVENT ===');

    // Stop ball
    STATE.ballVelocity.x = 0;
    STATE.ballVelocity.y = 0;
    STATE.ballVelocity.z = 0;

    // Animation sequence
    animateMazeDrop(() => {
        animateBallLaunch(() => {
            animateBallOrbit(() => {
                animateBallReturn();
            });
        });
    });
}

function animateMazeDrop(callback) {
    console.log('Maze dropping...');

    const startY = STATE.mazeY;
    const dropDistance = 0.5 * 0.08;  // 8% of wall height
    const targetY = startY - dropDistance;
    const duration = 200;  // 0.2 seconds
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        STATE.mazeY = startY + (targetY - startY) * eased;
        STATE.maze.position.y = STATE.mazeY;

        // Update ball Y position to stay on platform
        STATE.ballPosition.y = STATE.mazeY + STATE.ballRadius + 0.05;
        STATE.ball.position.y = STATE.ballPosition.y;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            STATE.mazeDropped = true;
            if (callback) callback();
        }
    }

    animate();
}

function animateBallLaunch(callback) {
    console.log('Ball launching...');

    const baseY = STATE.mazeY + STATE.ballRadius + 0.05;
    const launchHeight = 0.5 * 0.12;  // 12% of maze height
    const duration = 500;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Parabolic trajectory
        const parabola = 4 * launchHeight * progress * (1 - progress);
        STATE.ballPosition.y = baseY + parabola;
        STATE.ball.position.y = STATE.ballPosition.y;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            if (callback) callback();
        }
    }

    animate();
}

function animateBallOrbit(callback) {
    console.log('Ball orbiting...');

    const orbitRadius = 5.5;  // Outside maze
    const orbitY = STATE.mazeY + STATE.ballRadius + 0.3;
    const duration = 4000;  // 4 seconds
    const loops = 2;  // 2 full loops
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Two complete circles
        const angle = progress * loops * Math.PI * 2;

        STATE.ballPosition.x = Math.cos(angle) * orbitRadius;
        STATE.ballPosition.z = Math.sin(angle) * orbitRadius;
        STATE.ballPosition.y = orbitY;

        STATE.ball.position.set(
            STATE.ballPosition.x,
            STATE.ballPosition.y,
            STATE.ballPosition.z
        );

        // Rotate ball
        STATE.ball.rotation.x += 0.1;
        STATE.ball.rotation.z += 0.05;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            if (callback) callback();
        }
    }

    animate();
}

function animateBallReturn(callback) {
    console.log('Ball returning to center...');

    const startX = STATE.ballPosition.x;
    const startY = STATE.ballPosition.y;
    const startZ = STATE.ballPosition.z;
    const targetX = 0;
    const targetY = STATE.mazeY + STATE.ballRadius + 0.05;
    const targetZ = 0;
    const duration = 1000;  // 1 second
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in-out
        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        STATE.ballPosition.x = startX + (targetX - startX) * eased;
        STATE.ballPosition.y = startY + (targetY - startY) * eased;
        STATE.ballPosition.z = startZ + (targetZ - startZ) * eased;

        STATE.ball.position.set(
            STATE.ballPosition.x,
            STATE.ballPosition.y,
            STATE.ballPosition.z
        );

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            console.log('=== SEQUENCE COMPLETE ===');
            STATE.ballVelocity.x = 0;
            STATE.ballVelocity.y = 0;
            STATE.ballVelocity.z = 0;
            if (callback) callback();
        }
    }

    animate();
}

// ==========================================
// AUDIO
// ==========================================
function initAudio() {
    try {
        STATE.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Audio not supported');
    }
}

function playRollingSound(duration = 1.0) {
    if (!STATE.audioContext) return;

    const oscillator = STATE.audioContext.createOscillator();
    const gainNode = STATE.audioContext.createGain();
    const filter = STATE.audioContext.createBiquadFilter();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(80, STATE.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(40, STATE.audioContext.currentTime + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, STATE.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0.08, STATE.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, STATE.audioContext.currentTime + duration);

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(STATE.audioContext.destination);

    oscillator.start();
    oscillator.stop(STATE.audioContext.currentTime + duration);

    STATE.oscillator = oscillator;
}

// ==========================================
// ANIMATION LOOP
// ==========================================
function animate() {
    requestAnimationFrame(animate);

    const delta = STATE.clock.getDelta();

    // Update ball position based on velocity
    if (!STATE.isAnimating || STATE.ballVelocity.x !== 0 || STATE.ballVelocity.z !== 0) {
        STATE.ballPosition.x += STATE.ballVelocity.x;
        STATE.ballPosition.z += STATE.ballVelocity.z;

        STATE.ball.position.set(
            STATE.ballPosition.x,
            STATE.ballPosition.y,
            STATE.ballPosition.z
        );

        // Rotate ball based on movement
        if (STATE.ballVelocity.x !== 0 || STATE.ballVelocity.z !== 0) {
            const speed = Math.sqrt(
                STATE.ballVelocity.x * STATE.ballVelocity.x +
                STATE.ballVelocity.z * STATE.ballVelocity.z
            );
            STATE.ball.rotation.x += speed * 0.5;
            STATE.ball.rotation.z += speed * 0.3;
        }
    }

    // Render
    STATE.renderer.render(STATE.scene, STATE.camera);
}

// ==========================================
// START
// ==========================================
window.addEventListener('DOMContentLoaded', init);
