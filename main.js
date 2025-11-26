// ======================
// Global Variables
// ======================
let scene, camera, renderer;
let maze, ball;
let physicsWorld;
let ballBody, mazeBody;
let clock = new THREE.Clock();

// Camera orbit controls
let cameraAngle = 0;
let cameraDistance = 15;
let cameraHeight = 8;
let isDragging = false;
let previousMouseX = 0;

// Tilt sequence state
let currentStep = 0; // 0: waiting for left, 1: waiting for right, 2: waiting for forward, 3: waiting for backward, 4: sequence complete
let isAnimating = false;
let sequenceComplete = false;

// Maze dimensions
const mazeSize = 6;
const wallHeight = 0.5;
const wallThickness = 0.2;
const mazeInitialY = 2;
let currentMazeY = mazeInitialY;

// Ball properties
const ballRadius = 0.18; // 18mm diameter = 0.18 units radius
let ballStartPos = { x: -2.5, y: mazeInitialY + wallHeight + ballRadius + 0.1, z: -2.5 };

// Tilt physics
let tiltX = 0;
let tiltZ = 0;
const maxTilt = 0.08;

// Animation states
let ballPath = [];
let ballPathIndex = 0;
let isFollowingPath = false;
let orbitAnimation = null;

// Audio context
let audioContext;
let rollingSound = null;

// ======================
// Initialization
// ======================
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd4d4d4);
    scene.fog = new THREE.Fog(0xd4d4d4, 10, 50);

    // Setup camera
    camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    updateCameraPosition();

    // Setup renderer
    const container = document.getElementById('canvas-container');
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Setup physics world
    physicsWorld = new CANNON.World();
    physicsWorld.gravity.set(0, -9.82, 0);
    physicsWorld.defaultContactMaterial.friction = 0.3;
    physicsWorld.defaultContactMaterial.restitution = 0.2;

    // Setup lights
    setupLights();

    // Create maze
    createMaze();

    // Create ball
    createBall();

    // Setup event listeners
    setupEventListeners();

    // Initialize audio
    initAudio();

    // Start animation loop
    animate();
}

// ======================
// Scene Setup
// ======================
function setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    scene.add(directionalLight);

    // Hemisphere light for soft fill
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    scene.add(hemiLight);
}

function createMaze() {
    maze = new THREE.Group();
    maze.position.y = currentMazeY;

    // Wall material
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.1
    });

    // Create maze structure with 6 walls
    // This creates a path that leads to a circular center
    const walls = [
        // Outer boundaries
        { x: -3, z: 0, width: 6, depth: wallThickness, height: wallHeight }, // Left wall
        { x: 3, z: 0, width: 6, depth: wallThickness, height: wallHeight },  // Right wall
        { x: 0, z: -3, width: wallThickness, depth: 6, height: wallHeight }, // Back wall
        { x: 0, z: 3, width: wallThickness, depth: 6, height: wallHeight },  // Front wall

        // Inner walls creating the path
        { x: -1, z: -1, width: 3, depth: wallThickness, height: wallHeight }, // Inner wall 1
        { x: 1, z: 1, width: wallThickness, depth: 3, height: wallHeight },   // Inner wall 2
    ];

    walls.forEach(wallData => {
        const geometry = new THREE.BoxGeometry(wallData.width, wallData.height, wallData.depth);
        const wall = new THREE.Mesh(geometry, wallMaterial);
        wall.position.set(wallData.x, 0, wallData.z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        maze.add(wall);

        // Create physics body for wall
        const shape = new CANNON.Box(new CANNON.Vec3(
            wallData.width / 2,
            wallData.height / 2,
            wallData.depth / 2
        ));
        const body = new CANNON.Body({
            mass: 0, // Static
            shape: shape,
            position: new CANNON.Vec3(wallData.x, currentMazeY, wallData.z)
        });
        physicsWorld.addBody(body);
    });

    // Create center platform (circular)
    const platformGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0xcccccc,
        roughness: 0.5,
        metalness: 0.3
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, -wallHeight / 2 + 0.05, 0);
    platform.castShadow = true;
    platform.receiveShadow = true;
    maze.add(platform);

    // Physics for platform
    const platformShape = new CANNON.Cylinder(0.8, 0.8, 0.1, 32);
    const platformBody = new CANNON.Body({
        mass: 0,
        shape: platformShape,
        position: new CANNON.Vec3(0, currentMazeY - wallHeight / 2 + 0.05, 0)
    });
    physicsWorld.addBody(platformBody);

    scene.add(maze);
}

function createBall() {
    // Ball geometry with metallic material
    const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a90e2,
        roughness: 0.2,
        metalness: 0.8,
        envMapIntensity: 1
    });

    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(ballStartPos.x, ballStartPos.y, ballStartPos.z);
    ball.castShadow = true;
    scene.add(ball);

    // Physics body for ball
    const ballShape = new CANNON.Sphere(ballRadius);
    ballBody = new CANNON.Body({
        mass: 0.05, // 50 grams
        shape: ballShape,
        position: new CANNON.Vec3(ballStartPos.x, ballStartPos.y, ballStartPos.z),
        linearDamping: 0.3,
        angularDamping: 0.3
    });
    physicsWorld.addBody(ballBody);
}

// ======================
// Camera Controls
// ======================
function updateCameraPosition() {
    const x = Math.sin(cameraAngle) * cameraDistance;
    const z = Math.cos(cameraAngle) * cameraDistance;
    camera.position.set(x, cameraHeight, z);
    camera.lookAt(0, currentMazeY, 0);
}

function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', onWindowResize);

    // Mouse controls for camera orbit
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mouseleave', onMouseUp);

    // Touch controls for mobile
    renderer.domElement.addEventListener('touchstart', onTouchStart);
    renderer.domElement.addEventListener('touchmove', onTouchMove);
    renderer.domElement.addEventListener('touchend', onTouchEnd);

    // Keyboard controls for tilt
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Hide instructions after first interaction
    const hideInstructions = () => {
        setTimeout(() => {
            document.getElementById('instructions').classList.add('hidden');
        }, 3000);
    };

    window.addEventListener('keydown', hideInstructions, { once: true });
    renderer.domElement.addEventListener('mousedown', hideInstructions, { once: true });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseDown(event) {
    isDragging = true;
    previousMouseX = event.clientX;
}

function onMouseMove(event) {
    if (isDragging) {
        const deltaX = event.clientX - previousMouseX;
        cameraAngle -= deltaX * 0.01;
        previousMouseX = event.clientX;
        updateCameraPosition();
    }
}

function onMouseUp() {
    isDragging = false;
}

function onTouchStart(event) {
    if (event.touches.length === 1) {
        isDragging = true;
        previousMouseX = event.touches[0].clientX;
    }
}

function onTouchMove(event) {
    if (isDragging && event.touches.length === 1) {
        const deltaX = event.touches[0].clientX - previousMouseX;
        cameraAngle -= deltaX * 0.01;
        previousMouseX = event.touches[0].clientX;
        updateCameraPosition();
        event.preventDefault();
    }
}

function onTouchEnd() {
    isDragging = false;
}

// ======================
// Tilt Controls & Sequence
// ======================
let keysPressed = {};

function onKeyDown(event) {
    keysPressed[event.key] = true;

    if (sequenceComplete || isAnimating) return;

    // Step 0: Left arrow
    if (currentStep === 0 && event.key === 'ArrowLeft') {
        executeStep0();
    }
    // Step 1: Right arrow
    else if (currentStep === 1 && event.key === 'ArrowRight') {
        executeStep1();
    }
    // Step 2: Up arrow (forward)
    else if (currentStep === 2 && event.key === 'ArrowUp') {
        executeStep2();
    }
    // Step 3: Down arrow (backward)
    else if (currentStep === 3 && event.key === 'ArrowDown') {
        executeStep3();
    }
}

function onKeyUp(event) {
    keysPressed[event.key] = false;
}

// Step 0: Tilt left - ball rolls through one 90-degree corner at low speed
function executeStep0() {
    if (isAnimating) return;
    isAnimating = true;

    console.log('Step 0: Tilt left');

    // Define path: entrance to first corner
    ballPath = [
        { x: -2.5, z: -2.5 },
        { x: -2.5, z: -1.0 },
        { x: -1.5, z: -1.0 }
    ];

    ballPathIndex = 0;
    isFollowingPath = true;

    const speed = 0.02; // Low speed
    moveBallAlongPath(speed, () => {
        isAnimating = false;
        currentStep = 1;
        isFollowingPath = false;
    });
}

// Step 1: Tilt right - ball rolls through two corners with medium speed + sound
function executeStep1() {
    if (isAnimating) return;
    isAnimating = true;

    console.log('Step 1: Tilt right');

    // Play rolling sound
    playRollingSound();

    // Define path: through two corners
    ballPath = [
        { x: -1.5, z: -1.0 },
        { x: 0.5, z: -1.0 },
        { x: 0.5, z: 0.5 },
        { x: -0.5, z: 0.5 }
    ];

    ballPathIndex = 0;
    isFollowingPath = true;

    const speed = 0.04; // Medium speed
    moveBallAlongPath(speed, () => {
        stopRollingSound();
        isAnimating = false;
        currentStep = 2;
        isFollowingPath = false;
    });
}

// Step 2: Tilt forward - ball moves to center platform edge
function executeStep2() {
    if (isAnimating) return;
    isAnimating = true;

    console.log('Step 2: Tilt forward');

    // Define path: to center platform edge
    ballPath = [
        { x: -0.5, z: 0.5 },
        { x: -0.5, z: 0.0 },
        { x: -0.7, z: 0.0 }
    ];

    ballPathIndex = 0;
    isFollowingPath = true;

    const speed = 0.03;
    moveBallAlongPath(speed, () => {
        isAnimating = false;
        currentStep = 3;
        isFollowingPath = false;
    });
}

// Step 3: Tilt backward - ball reaches center and triggers feedback
function executeStep3() {
    if (isAnimating) return;
    isAnimating = true;

    console.log('Step 3: Tilt backward');

    // Define path: to exact center
    ballPath = [
        { x: -0.7, z: 0.0 },
        { x: 0.0, z: 0.0 }
    ];

    ballPathIndex = 0;
    isFollowingPath = true;

    const speed = 0.02;
    moveBallAlongPath(speed, () => {
        isAnimating = false;
        isFollowingPath = false;
        // Trigger feedback event
        triggerFeedbackEvent();
    });
}

function moveBallAlongPath(speed, onComplete) {
    const interval = setInterval(() => {
        if (ballPathIndex >= ballPath.length - 1) {
            clearInterval(interval);
            if (onComplete) onComplete();
            return;
        }

        const current = ballPath[ballPathIndex];
        const next = ballPath[ballPathIndex + 1];

        const currentPos = ballBody.position;
        const dx = next.x - currentPos.x;
        const dz = next.z - currentPos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < 0.1) {
            ballPathIndex++;
        } else {
            const dirX = dx / distance;
            const dirZ = dz / distance;

            ballBody.velocity.x = dirX * speed * 60;
            ballBody.velocity.z = dirZ * speed * 60;
        }
    }, 16);
}

// ======================
// Feedback Event
// ======================
function triggerFeedbackEvent() {
    console.log('Triggering feedback event');
    sequenceComplete = true;

    // Stop ball movement
    ballBody.velocity.set(0, 0, 0);
    ballBody.angularVelocity.set(0, 0, 0);

    // Animate maze dropping down 8% of its height
    const mazeDropDistance = wallHeight * 0.08;
    const mazeDropDuration = 200; // 0.2 seconds
    const mazeStartY = currentMazeY;
    const mazeTargetY = currentMazeY - mazeDropDistance;
    const mazeStartTime = Date.now();

    // Animate ball launching upward 12% of maze height
    const ballLaunchHeight = wallHeight * 0.12;

    const mazeDropInterval = setInterval(() => {
        const elapsed = Date.now() - mazeStartTime;
        const progress = Math.min(elapsed / mazeDropDuration, 1);

        // Easing function (ease out)
        const eased = 1 - Math.pow(1 - progress, 3);

        currentMazeY = mazeStartY + (mazeTargetY - mazeStartY) * eased;
        maze.position.y = currentMazeY;

        if (progress >= 1) {
            clearInterval(mazeDropInterval);
            // Start ball launch after maze drops
            launchBall(ballLaunchHeight);
        }
    }, 16);
}

function launchBall(launchHeight) {
    console.log('Launching ball');

    const ballStartY = ballBody.position.y;
    const ballTargetY = ballStartY + launchHeight;
    const launchDuration = 300;
    const launchStartTime = Date.now();

    const launchInterval = setInterval(() => {
        const elapsed = Date.now() - launchStartTime;
        const progress = Math.min(elapsed / launchDuration, 1);

        // Parabolic motion
        const height = ballStartY + launchHeight * (1 - Math.pow(2 * progress - 1, 2));
        ballBody.position.y = height;

        if (progress >= 1) {
            clearInterval(launchInterval);
            // Start orbit animation
            startOrbitAnimation();
        }
    }, 16);
}

function startOrbitAnimation() {
    console.log('Starting orbit animation');

    const orbitRadius = 4; // Outside of maze
    const orbitHeight = currentMazeY + wallHeight + ballRadius;
    const orbitDuration = 4000; // 4 seconds for 2 loops
    const orbitStartTime = Date.now();

    orbitAnimation = setInterval(() => {
        const elapsed = Date.now() - orbitStartTime;
        const progress = elapsed / orbitDuration;

        if (progress >= 1) {
            clearInterval(orbitAnimation);
            orbitAnimation = null;
            // Return ball to center
            returnBallToCenter();
            return;
        }

        // Two full loops: progress * 2 * 2π
        const angle = progress * 4 * Math.PI;
        const x = Math.cos(angle) * orbitRadius;
        const z = Math.sin(angle) * orbitRadius;

        ballBody.position.set(x, orbitHeight, z);
        ballBody.velocity.set(0, 0, 0);
        ballBody.angularVelocity.set(0, 0, 0);
    }, 16);
}

function returnBallToCenter() {
    console.log('Returning ball to center');

    const returnDuration = 1000;
    const returnStartTime = Date.now();
    const startPos = { x: ballBody.position.x, y: ballBody.position.y, z: ballBody.position.z };
    const targetPos = { x: 0, y: currentMazeY + ballRadius, z: 0 };

    const returnInterval = setInterval(() => {
        const elapsed = Date.now() - returnStartTime;
        const progress = Math.min(elapsed / returnDuration, 1);

        // Ease in-out
        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const x = startPos.x + (targetPos.x - startPos.x) * eased;
        const y = startPos.y + (targetPos.y - startPos.y) * eased;
        const z = startPos.z + (targetPos.z - startPos.z) * eased;

        ballBody.position.set(x, y, z);
        ballBody.velocity.set(0, 0, 0);
        ballBody.angularVelocity.set(0, 0, 0);

        if (progress >= 1) {
            clearInterval(returnInterval);
            console.log('Ball returned to center. Sequence complete.');
        }
    }, 16);
}

// ======================
// Audio
// ======================
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('Web Audio API not supported');
    }
}

function playRollingSound() {
    if (!audioContext) return;

    // Create a simple rolling sound using oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(100, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 1);

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1);

    rollingSound = oscillator;
}

function stopRollingSound() {
    if (rollingSound) {
        try {
            rollingSound.stop();
        } catch (e) {
            // Already stopped
        }
        rollingSound = null;
    }
}

// ======================
// Animation Loop
// ======================
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.1);

    // Update physics
    physicsWorld.step(1 / 60, deltaTime, 3);

    // Sync ball with physics
    ball.position.copy(ballBody.position);
    ball.quaternion.copy(ballBody.quaternion);

    // Render scene
    renderer.render(scene, camera);
}

// ======================
// Start Application
// ======================
window.addEventListener('DOMContentLoaded', init);
