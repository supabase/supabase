'use client'

import { useState } from 'react'
import ExampleLayout from '../example-layout'
import capsuleJs from './fps/jsm/Capsule.js'
import statsJs from './fps/jsm/stats.module.js'
import octreeJs from './fps/jsm/Octree.js'
import octreeHelperJs from './fps/jsm/OctreeHelper.js'
import gltfLoaderJs from './fps/jsm/GLTFLoader.js'
import lilGuiJs from './fps/jsm/lil-gui.module.min.js'
import bufferGeometryUtilsJs from './fps/jsm/BufferGeometryUtils.js'

export default function FPSExample() {
  const [instanceId] = useState(() => Math.random().toString(36).substring(2, 9))

  // Fix JS modules by removing backticks wrapper
  const fixedCapsuleJs = capsuleJs.replace('export default `', '').replace('`', '')
  const fixedStatsJs = statsJs.replace('export default `', '').replace('`', '')
  const fixedOctreeJs = octreeJs.replace('export default `', '').replace('`', '')
  const fixedOctreeHelperJs = octreeHelperJs
    .replace('export default `', '')
    .replace('`', '')
    .replace('export { OctreeHelper }', 'export { OctreeHelper };')
  const fixedGltfLoaderJs = gltfLoaderJs.replace('export default `', '').replace('`', '')
  const fixedLilGuiJs = lilGuiJs.replace('export default `', '').replace('`', '')
  const fixedBufferGeometryUtilsJs = bufferGeometryUtilsJs
    .replace('export default `', '')
    .replace('`', '')

  const indexJsCode = `
import * as THREE from 'three';

import Stats from './jsm/stats.module.js';
import { GLTFLoader } from './jsm/GLTFLoader.js';
import { Octree } from './jsm/Octree.js';
import { OctreeHelper } from './jsm/OctreeHelper.js';
import { Capsule } from './jsm/Capsule.js';
import { GUI } from './jsm/lil-gui.module.min.js';

const clock = new THREE.Clock();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x88ccee);
scene.fog = new THREE.Fog(0x88ccee, 0, 50);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';

const fillLight1 = new THREE.HemisphereLight(0x8dc1de, 0x00668d, 1.5);
fillLight1.position.set(2, 1, 1);
scene.add(fillLight1);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
directionalLight.position.set(-5, 25, -1);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = -30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = -30;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = -0.00006;
scene.add(directionalLight);

const container = document.getElementById('container');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

const stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';
container.appendChild(stats.domElement);

const GRAVITY = 30;
const NUM_SPHERES = 20; // Reduced for better performance in the sandbox
const SPHERE_RADIUS = 0.2;
const STEPS_PER_FRAME = 5;

const sphereGeometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 5);
const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xdede8d });

const spheres = [];
let sphereIdx = 0;

for (let i = 0; i < NUM_SPHERES; i++) {
  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  scene.add(sphere);

  spheres.push({
    mesh: sphere,
    collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), SPHERE_RADIUS),
    velocity: new THREE.Vector3()
  });
}

const worldOctree = new Octree();

const playerCollider = new Capsule(new THREE.Vector3(0, 0.35, 0), new THREE.Vector3(0, 1, 0), 0.35);

const playerVelocity = new THREE.Vector3();
const playerDirection = new THREE.Vector3();

let playerOnFloor = false;
let mouseTime = 0;

const keyStates = {};

const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

document.addEventListener('keydown', (event) => {
  keyStates[event.code] = true;
});

document.addEventListener('keyup', (event) => {
  keyStates[event.code] = false;
});

container.addEventListener('mousedown', () => {
  document.body.requestPointerLock();
  mouseTime = performance.now();
});

document.addEventListener('mouseup', () => {
  if (document.pointerLockElement !== null) throwBall();
});

document.body.addEventListener('mousemove', (event) => {
  if (document.pointerLockElement === document.body) {
    camera.rotation.y -= event.movementX / 500;
    camera.rotation.x -= event.movementY / 500;
  }
});

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function throwBall() {
  const sphere = spheres[sphereIdx];

  camera.getWorldDirection(playerDirection);

  sphere.collider.center.copy(playerCollider.end).addScaledVector(playerDirection, playerCollider.radius * 1.5);

  // throw the ball with more force if we hold the button longer, and if we move forward
  const impulse = 15 + 30 * (1 - Math.exp((mouseTime - performance.now()) * 0.001));

  sphere.velocity.copy(playerDirection).multiplyScalar(impulse);
  sphere.velocity.addScaledVector(playerVelocity, 2);

  sphereIdx = (sphereIdx + 1) % spheres.length;
}

function playerCollisions() {
  const result = worldOctree.capsuleIntersect(playerCollider);

  playerOnFloor = false;

  if (result) {
    playerOnFloor = result.normal.y > 0;

    if (!playerOnFloor) {
      playerVelocity.addScaledVector(result.normal, -result.normal.dot(playerVelocity));
    }

    if (result.depth >= 1e-10) {
      playerCollider.translate(result.normal.multiplyScalar(result.depth));
    }
  }
}

function updatePlayer(deltaTime) {
  let damping = Math.exp(-4 * deltaTime) - 1;

  if (!playerOnFloor) {
    playerVelocity.y -= GRAVITY * deltaTime;

    // small air resistance
    damping *= 0.1;
  }

  playerVelocity.addScaledVector(playerVelocity, damping);

  const deltaPosition = playerVelocity.clone().multiplyScalar(deltaTime);
  playerCollider.translate(deltaPosition);

  playerCollisions();

  camera.position.copy(playerCollider.end);
}

function playerSphereCollision(sphere) {
  const center = vector1.addVectors(playerCollider.start, playerCollider.end).multiplyScalar(0.5);

  const sphere_center = sphere.collider.center;

  const r = playerCollider.radius + sphere.collider.radius;
  const r2 = r * r;

  // approximation: player = 3 spheres
  for (const point of [playerCollider.start, playerCollider.end, center]) {
    const d2 = point.distanceToSquared(sphere_center);

    if (d2 < r2) {
      const normal = vector1.subVectors(point, sphere_center).normalize();
      const v1 = vector2.copy(normal).multiplyScalar(normal.dot(playerVelocity));
      const v2 = vector3.copy(normal).multiplyScalar(normal.dot(sphere.velocity));

      playerVelocity.add(v2).sub(v1);
      sphere.velocity.add(v1).sub(v2);

      const d = (r - Math.sqrt(d2)) / 2;
      sphere_center.addScaledVector(normal, -d);
    }
  }
}

function spheresCollisions() {
  for (let i = 0, length = spheres.length; i < length; i++) {
    const s1 = spheres[i];

    for (let j = i + 1; j < length; j++) {
      const s2 = spheres[j];

      const d2 = s1.collider.center.distanceToSquared(s2.collider.center);
      const r = s1.collider.radius + s2.collider.radius;
      const r2 = r * r;

      if (d2 < r2) {
        const normal = vector1.subVectors(s1.collider.center, s2.collider.center).normalize();
        const v1 = vector2.copy(normal).multiplyScalar(normal.dot(s1.velocity));
        const v2 = vector3.copy(normal).multiplyScalar(normal.dot(s2.velocity));

        s1.velocity.add(v2).sub(v1);
        s2.velocity.add(v1).sub(v2);

        const d = (r - Math.sqrt(d2)) / 2;

        s1.collider.center.addScaledVector(normal, d);
        s2.collider.center.addScaledVector(normal, -d);
      }
    }
  }
}

function updateSpheres(deltaTime) {
  spheres.forEach(sphere => {
    sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);

    const result = worldOctree.sphereIntersect(sphere.collider);

    if (result) {
      sphere.velocity.addScaledVector(result.normal, -result.normal.dot(sphere.velocity) * 1.5);
      sphere.collider.center.add(result.normal.multiplyScalar(result.depth));
    } else {
      sphere.velocity.y -= GRAVITY * deltaTime;
    }

    const damping = Math.exp(-1.5 * deltaTime) - 1;
    sphere.velocity.addScaledVector(sphere.velocity, damping);

    playerSphereCollision(sphere);
  });

  spheresCollisions();

  for (const sphere of spheres) {
    sphere.mesh.position.copy(sphere.collider.center);
  }
}

function getForwardVector() {
  camera.getWorldDirection(playerDirection);
  playerDirection.y = 0;
  playerDirection.normalize();

  return playerDirection;
}

function getSideVector() {
  camera.getWorldDirection(playerDirection);
  playerDirection.y = 0;
  playerDirection.normalize();
  playerDirection.cross(camera.up);

  return playerDirection;
}

function controls(deltaTime) {
  // gives a bit of air control
  const speedDelta = deltaTime * (playerOnFloor ? 25 : 8);

  if (keyStates['KeyW']) {
    playerVelocity.add(getForwardVector().multiplyScalar(speedDelta));
  }

  if (keyStates['KeyS']) {
    playerVelocity.add(getForwardVector().multiplyScalar(-speedDelta));
  }

  if (keyStates['KeyA']) {
    playerVelocity.add(getSideVector().multiplyScalar(-speedDelta));
  }

  if (keyStates['KeyD']) {
    playerVelocity.add(getSideVector().multiplyScalar(speedDelta));
  }

  if (playerOnFloor) {
    if (keyStates['Space']) {
      playerVelocity.y = 15;
    }
  }
}

// Create a simple world with walls instead of loading a GLTF
function createWorld() {
  // Ground plane
  const groundGeometry = new THREE.PlaneGeometry(100, 100);
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x999999,
    roughness: 0.8,
    metalness: 0.2
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Create walls
  const wallGeometry = new THREE.BoxGeometry(10, 3, 1);
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x887766 });
  
  // Front wall
  const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
  frontWall.position.set(0, 1.5, -5);
  frontWall.receiveShadow = true;
  frontWall.castShadow = true;
  scene.add(frontWall);
  
  // Back wall
  const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.set(0, 1.5, 5);
  backWall.receiveShadow = true;
  backWall.castShadow = true;
  scene.add(backWall);
  
  // Left wall
  const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-5, 1.5, 0);
  leftWall.receiveShadow = true;
  leftWall.castShadow = true;
  scene.add(leftWall);
  
  // Right wall
  const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
  rightWall.rotation.y = Math.PI / 2;
  rightWall.position.set(5, 1.5, 0);
  rightWall.receiveShadow = true;
  rightWall.castShadow = true;
  scene.add(rightWall);
  
  // Center box
  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const boxMaterial = new THREE.MeshStandardMaterial({ color: 0xff4444 });
  const centerBox = new THREE.Mesh(boxGeometry, boxMaterial);
  centerBox.position.set(0, 0.5, 0);
  centerBox.castShadow = true;
  centerBox.receiveShadow = true;
  scene.add(centerBox);

  // Add objects to octree
  worldOctree.fromGraphNode(ground);
  worldOctree.fromGraphNode(frontWall);
  worldOctree.fromGraphNode(backWall);
  worldOctree.fromGraphNode(leftWall);
  worldOctree.fromGraphNode(rightWall);
  worldOctree.fromGraphNode(centerBox);

  // Create octree helper
  const helper = new OctreeHelper(worldOctree);
  helper.visible = false;
  scene.add(helper);

  // GUI for showing/hiding the octree
  const gui = new GUI({ width: 200 });
  gui.add({ debug: false }, 'debug')
    .onChange(function (value) {
      helper.visible = value;
    });
}

function teleportPlayerIfOob() {
  if (camera.position.y <= -25) {
    playerCollider.start.set(0, 0.35, 0);
    playerCollider.end.set(0, 1, 0);
    playerCollider.radius = 0.35;
    camera.position.copy(playerCollider.end);
    camera.rotation.set(0, 0, 0);
  }
}

// Create the world right away instead of loading a GLTF
createWorld();

// Position player at a good starting point
playerCollider.start.set(0, 0.35, 0);
playerCollider.end.set(0, 1, 0);
camera.position.copy(playerCollider.end);
camera.lookAt(0, 1, -5); // Look at the front wall

function animate() {
  const deltaTime = Math.min(0.05, clock.getDelta()) / STEPS_PER_FRAME;

  // we look for collisions in substeps to mitigate the risk of
  // an object traversing another too quickly for detection.
  for (let i = 0; i < STEPS_PER_FRAME; i++) {
    controls(deltaTime);
    updatePlayer(deltaTime);
    updateSpheres(deltaTime);
    teleportPlayerIfOob();
  }

  renderer.render(scene, camera);
  stats.update();
  
  requestAnimationFrame(animate);
}

// Start animation instead of using renderer.setAnimationLoop
animate();
`

  const indexHtmlCode = `<!DOCTYPE html>
<html>
  <head>
    <title>Three.js - Octree Collisions</title>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div id="info">
      Octree threejs demo - basic collisions with static triangle mesh<br />
      MOUSE to look around and to throw balls<br/>
      WASD to move and SPACE to jump
    </div>
    <div id="container"></div>
    <script src="index.js" type="module"></script>
  </body>
</html>`

  const cssCode = `body {
  margin: 0;
  background-color: #000;
  color: #fff;
  font-family: Monospace;
  font-size: 13px;
  line-height: 24px;
  overscroll-behavior: none;
}

a {
  color: #ff0;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

button {
  cursor: pointer;
  text-transform: uppercase;
}

#info {
  position: absolute;
  top: 0px;
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  text-align: center;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  user-select: none;
  pointer-events: none;
  z-index: 1; /* TODO Solve this in HTML */
}

a, button, input, select {
  pointer-events: auto;
}

canvas {
  position: fixed;
  top: 0;
  left: 0;
}

#container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}`

  const fpsFiles = {
    '/index.js': indexJsCode,
    '/index.html': indexHtmlCode,
    '/styles.css': cssCode,
    '/jsm/Capsule.js': fixedCapsuleJs,
    '/jsm/stats.module.js': fixedStatsJs,
    '/jsm/Octree.js': fixedOctreeJs,
    '/jsm/OctreeHelper.js': fixedOctreeHelperJs,
    '/jsm/GLTFLoader.js': fixedGltfLoaderJs,
    '/jsm/lil-gui.module.min.js': fixedLilGuiJs,
    '/jsm/BufferGeometryUtils.js': fixedBufferGeometryUtilsJs,
  }

  return (
    <ExampleLayout
      appJsCode={indexJsCode}
      files={fpsFiles}
      dependencies={{
        three: '^0.155.0',
      }}
      title="Three.js - Octree Collisions"
      description="A first-person example using Three.js with physics-based movement, collision detection, and object interaction. Features include WASD movement, space to jump, and mouse to look and shoot balls."
      template="vanilla"
    />
  )
}
