

// Parameters
const roadWidth = 2;
const roadLength = 30;
const segments = 100;

// Create the quadratic Bezier curve
const curvePoints = {
    p0: { x: -10, y: 0, z: 0 },
    p1: { x: 0, y: 15, z: 0 }, // Control point
    p2: { x: 10, y: 0, z: 0 }
};

const createCurve = () => {
    return new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(curvePoints.p0.x, curvePoints.p0.y, curvePoints.p0.z),
        new THREE.Vector3(curvePoints.p1.x, curvePoints.p1.y, curvePoints.p1.z),
        new THREE.Vector3(curvePoints.p2.x, curvePoints.p2.y, curvePoints.p2.z)
    );
};

// Function to create the road geometry
let roadGeometry, roadMesh, curveLine, handleLines;

const createRoad = () => {
    if (roadMesh) {
        scene.remove(roadMesh);
        roadGeometry.dispose();
    }

    const curve = createCurve();
    roadGeometry = new THREE.PlaneGeometry(roadWidth, roadLength, 1, segments);


    const positions = roadGeometry.attributes.position.array;
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const point = curve.getPoint(t);
        const tangent = curve.getTangent(t).normalize();

        const angle = Math.atan2(tangent.x, tangent.z);
        const sinAngle = Math.sin(angle);
        const cosAngle = Math.cos(angle);

        const halfWidth = roadWidth / 2;
        const index = i * 3 * 2;

        positions[index] = point.x + halfWidth * cosAngle;
        positions[index + 1] = point.y;
        positions[index + 2] = point.z - halfWidth * sinAngle;

        positions[index + 3] = point.x - halfWidth * cosAngle;
        positions[index + 4] = point.y;
        positions[index + 5] = point.z + halfWidth * sinAngle;
    }

    roadGeometry.attributes.position.needsUpdate = true;
    roadGeometry.computeVertexNormals();

    const roadMaterial = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide });
    roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
    scene.add(roadMesh);
    // roadMesh.rotateX(-Math.PI / 2);
    // roadMesh.rotateZ(Math.PI );
    // Create and update the curve line
    if (curveLine) {
        scene.remove(curveLine);
    }
    const curvePointsArray = curve.getPoints(segments);
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePointsArray);
    const curveMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    curveLine = new THREE.Line(curveGeometry, curveMaterial);
    scene.add(curveLine);

    // Create and update handle lines
    if (handleLines) {
        handleLines.forEach(line => scene.remove(line));
    }
    handleLines = [];
    const handlePoints1 = [new THREE.Vector3(curvePoints.p0.x, curvePoints.p0.y, curvePoints.p0.z), new THREE.Vector3(curvePoints.p1.x, curvePoints.p1.y, curvePoints.p1.z)];
    const handlePoints2 = [new THREE.Vector3(curvePoints.p1.x, curvePoints.p1.y, curvePoints.p1.z), new THREE.Vector3(curvePoints.p2.x, curvePoints.p2.y, curvePoints.p2.z)];
    const handleGeometry1 = new THREE.BufferGeometry().setFromPoints(handlePoints1);
    const handleGeometry2 = new THREE.BufferGeometry().setFromPoints(handlePoints2);
    const handleMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    handleLines.push(new THREE.Line(handleGeometry1, handleMaterial));
    handleLines.push(new THREE.Line(handleGeometry2, handleMaterial));
    handleLines.forEach(line => scene.add(line));
};

// Initial road creation
createRoad();

// Create sprite materials for control points
const createSpriteMaterial = (color) => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.beginPath();
    context.arc(32, 32, 30, 0, 2 * Math.PI);
    context.fillStyle = color;
    context.fill();
    const texture = new THREE.CanvasTexture(canvas);
    return new THREE.SpriteMaterial({ map: texture });
};

// Create sprites for control points
const sprites = {};
['p0', 'p1', 'p2'].forEach(point => {
    const sprite = new THREE.Sprite(createSpriteMaterial('red'));
    scene.add(sprite);
    sprites[point] = sprite;
});

// Update sprite positions
const updateSprites = () => {
    sprites.p0.position.set(curvePoints.p0.x, curvePoints.p0.y, curvePoints.p0.z);
    sprites.p1.position.set(curvePoints.p1.x, curvePoints.p1.y, curvePoints.p1.z);
    sprites.p2.position.set(curvePoints.p2.x, curvePoints.p2.y, curvePoints.p2.z);
};

updateSprites();

// Set the camera position
camera.position.set(0, 10, 20);
controls.update();

// Add Tweakpane for controlling the Bezier curve handles
const folder0 = pane.addFolder({ title: 'Point 0' });
folder0.addInput(curvePoints.p0, 'x', { min: -20, max: 20 });
folder0.addInput(curvePoints.p0, 'y', { min: -20, max: 20 });
folder0.addInput(curvePoints.p0, 'z', { min: -20, max: 20 });

const folder1 = pane.addFolder({ title: 'Point 1' });
folder1.addInput(curvePoints.p1, 'x', { min: -20, max: 20 });
folder1.addInput(curvePoints.p1, 'y', { min: -20, max: 20 });
folder1.addInput(curvePoints.p1, 'z', { min: -20, max: 20 });

const folder2 = pane.addFolder({ title: 'Point 2' });
folder2.addInput(curvePoints.p2, 'x', { min: -20, max: 20 });
folder2.addInput(curvePoints.p2, 'y', { min: -20, max: 20 });
folder2.addInput(curvePoints.p2, 'z', { min: -20, max: 20 });

// Update road, curve, handle lines, and sprites on control change
pane.on('change', () => {
    createRoad();
    updateSprites();
});

// Raycasting for dragging sprites
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedSprite = null;

const onMouseMove = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (selectedSprite) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(p);
        if (intersects.length > 0) {
            const intersect = intersects[0];
            selectedSprite.position.copy(intersect.point);
            const pointName = Object.keys(sprites).find(key => sprites[key] === selectedSprite);
            curvePoints[pointName].x = intersect.point.x;
            curvePoints[pointName].y = intersect.point.y;
            curvePoints[pointName].z = intersect.point.z;
            createRoad();
        }
    }
};

const onMouseDown = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(Object.values(sprites));
    if (intersects.length > 0) {
        selectedSprite = intersects[0].object;
        controls.enabled = false
    }
};

const onMouseUp = () => {
    selectedSprite = null;
    controls.enabled = true
};

window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mouseup', onMouseUp);

// Create an invisible plane to restrict the dragging to a certain area
const planeGeometry = new THREE.PlaneGeometry(2000, 2000, 8, 8);
const planeMaterial = new THREE.MeshBasicMaterial({ visible: false });
const p = new THREE.Mesh(planeGeometry, planeMaterial);
scene.add(p);
curvePoints.p1.x =  3;


function animateBezierHandles()
{

  const time = Date.now() * 0.003;

   // Wave parameters
   const waveAmplitude1 = 7;
   const waveFrequency1 = 1;

   curvePoints.p1.y = Math.sin(time * waveFrequency1) * waveAmplitude1; // Flapping effect for one wing

   // Lerp p2 to chase p1
   const lerpFactor = 0.1; // Speed of chasing, lower value means slower chase
   curvePoints.p2.y += (curvePoints.p1.y - curvePoints.p2.y) * lerpFactor;

    createRoad();
    updateSprites();
}
