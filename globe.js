// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('globeCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.z = 400;

// Create a video element
const video = document.createElement('video');
video.src = 'Background.mp4';  // Replace with the path to your video file
console.log(video); // Check what `video` actually is
video.load();
video.play(1);
video.loop = true;  // Loop the video
video.muted = true; // Mute the video (if you don't want sound)

// Create a video texture from the video element
const videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBFormat;

// Create a large sphere to act as the background
const backgroundGeometry = new THREE.SphereGeometry(50, 128, 128);  // Large radius for background
const backgroundMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.BackSide });
const backgroundSphere = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
scene.add(backgroundSphere);

// Load the texture (use your own texture URL or local path)
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('texture2.jpg');  // Replace with the path to your texture image

// Create a basic globe
const globeGeometry = new THREE.SphereGeometry(5, 64, 64);
const globeMaterial = new THREE.MeshBasicMaterial({ map: texture }); // Globe color
const globe = new THREE.Mesh(globeGeometry, globeMaterial);
scene.add(globe);

// Controls for the globe
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;
controls.zoomSpeed = 0.5;
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.enablePan = false;
controls.minDistance = 7;
controls.maxDistance = 15;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;

// Lighting
var ambientLight = new THREE.AmbientLight(0xbbbbbb, 0.3);
scene.add(ambientLight);
scene.background = new THREE.Color(0x040d21);

// Fog setup
scene.fog = new THREE.Fog(0x535ef3, 400, 2000);

// Scroll event listener to move the camera based on scroll position
window.addEventListener('scroll', () => {
    // Calculate the scroll percentage (0 at the top, 1 at the bottom)
    const scrollPercentage = window.scrollY / (document.body.scrollHeight - window.innerHeight);

    // Update the camera's position based on scroll (adjust 800 to 400)
    camera.position.z = 800 - scrollPercentage * 400;  // Adjust these values as needed
    camera.lookAt(scene.position);  // Ensure the camera stays pointed at the globe
});

// Function to convert lat/lon to 3D coordinates on the sphere
function latLongToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
}

// Load and display countries from GeoJSON
d3.json('countries.geojson')
    .then((geoData) => {
        geoData.features.forEach(feature => {
            const countryGroup = new THREE.Group();
            feature.geometry.coordinates.forEach(polygon => {
                const points = [];
                polygon[0].forEach(([lon, lat]) => {
                    points.push(latLongToVector3(lat, lon, 5.01)); // Slightly above globe surface
                });

                const countryGeometry = new THREE.BufferGeometry().setFromPoints(points);
                const countryMaterial = new THREE.LineBasicMaterial({
                    color: 0x000000,
                    linewidth: 0,
                    transparent: true,
                    opacity: 0.5, // Make boundary lines semi-transparent
                });
                const countryLine = new THREE.Line(countryGeometry, countryMaterial);

                // Set country name using ADMIN property
                const countryName = feature.properties.ADMIN;
                if (countryName) {
                    countryLine.userData = { name: countryName };
                    console.log("Added country:", countryName); // Debugging country name added
                } else {
                    console.warn("Country name is undefined for feature:", feature);
                }

                countryGroup.add(countryLine);
            });

            scene.add(countryGroup);
        });
    })
    .catch(error => console.error("Error loading GeoJSON data:", error));

// Raycasting setup and pop-up functionality
const mouse = new THREE.Vector2();
let selectedCountry = null;
let permanentlySelectedCountry = null;

// Pop-up for displaying country name
const countryPopup = document.getElementById('countryPopup');
const countryNameSpan = document.getElementById('countryName');

function showCountryPopup(name, mouseX, mouseY) {
    countryNameSpan.textContent = name;
    countryPopup.style.display = 'block';
    countryPopup.style.left = mouseX + 'px';
    countryPopup.style.top = mouseY + 'px';
}

function hideCountryPopup() {
    countryPopup.style.display = 'none';
}

function onMouseClick(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    console.log("Mouse position:", mouse);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true).filter(intersection => {
        return intersection.object instanceof THREE.Line;
    });

    if (intersects.length > 0) {
        const nearestCountry = intersects[0].object;

        if (nearestCountry.userData && nearestCountry.userData.name) {
            const countryName = nearestCountry.userData.name;

            if (permanentlySelectedCountry) {
                permanentlySelectedCountry.material.color.set(0x000000);
            }

            permanentlySelectedCountry = nearestCountry;
            permanentlySelectedCountry.material.color.set(0x00ff00);

            showCountryPopup(countryName, e.clientX, e.clientY);
            countryPopup.dataset.selectedCountry = countryName;
        }
    } else {
        hideCountryPopup();
    }
}

countryPopup.addEventListener('click', () => {
    const selectedCountry = countryPopup.dataset.selectedCountry;
    if (selectedCountry) {
        fetchCountryDetails(selectedCountry);
    }
});
// Function to fetch country details from the Flask server
function fetchCountryDetails(countryName) {
    const payload = { country: countryName };
    console.log('Sending payload:', payload); // Debugging

    fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    })
        .then(response => {
            console.log('Server response:', response); // Debugging
            if (!response.ok) {
                throw new Error('Failed to fetch data from server.');
            }
            return response.json();
        })
        .then(data => {
            showDetailsPopup(data);
        })
        .catch(error => {
            console.error('Error fetching country details:', error);
            alert('Failed to fetch details. Please try again.');
        });
}

window.addEventListener('click', onMouseClick, false);

// Secondary popup for country details
const detailsPopup = document.createElement('div');
detailsPopup.id = 'detailsPopup';
document.body.appendChild(detailsPopup);

// Function to show the details popup
function showDetailsPopup(data) {
    console.log('Data to display in popup:', data);

    const { population_forecast, gdp_forecast } = data;

    detailsPopup.innerHTML = `
        <h3>Country Details</h3>
        <h4>Population Forecast:</h4>
        <ul>
            ${population_forecast.map(item => `<li>${item.Year}: ${item['Predicted Population']}</li>`).join('')}
        </ul>
        <h4>GDP Forecast:</h4>
        <ul>
            ${gdp_forecast.map(item => `<li>${item.Year}: ${item['Predicted GDP']}</li>`).join('')}
        </ul>
        <button id="closeDetailsPopup">Close</button>
    `;

    detailsPopup.style.display = 'block';
    detailsPopup.style.left = '50%';
    detailsPopup.style.top = '50%';
    detailsPopup.style.transform = 'translate(-50%, -50%)';

    document.getElementById('closeDetailsPopup').addEventListener('click', () => {
        detailsPopup.style.display = 'none';
    });
}

// Attach event listener to the window
window.addEventListener('click', onMouseClick, false);
// Render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
