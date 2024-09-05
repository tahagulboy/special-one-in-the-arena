import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';

// Sahne ve Kamera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Puan göstergesi
let score = 0;
const scoreElement = document.createElement('div');
scoreElement.style.position = 'absolute';
scoreElement.style.top = '10px';
scoreElement.style.left = '10px';
scoreElement.style.color = 'white';
scoreElement.style.fontSize = '24px';
scoreElement.innerHTML = "Score: " + score;
document.body.appendChild(scoreElement);

// Zemin oluşturma
const geometry = new THREE.PlaneGeometry(100, 100);
const material = new THREE.MeshBasicMaterial({ color: 0x228B22, side: THREE.DoubleSide });
const plane = new THREE.Mesh(geometry, material);
plane.rotation.x = Math.PI / 2; // Zemin yatay olsun
scene.add(plane);

// Blok oluşturma
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const cube = new THREE.Mesh(boxGeometry, boxMaterial);
cube.position.y = 0.5; // Blok zeminin üstünde olsun
scene.add(cube);

// Rastgele yuvarlak bloklar oluşturma
const spheres = [];
// Rastgele toplar oluşturma
function createRandomSphere() {
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff4500 });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(Math.random() * 50 - 25, 0.5, Math.random() * 50 - 25);
    scene.add(sphere);
    spheres.push(sphere);
}

// Topları düzenli aralıklarla oluşturmak için interval ayarlama
const sphereCreationInterval = 3000; // 3000 ms = 3 saniye
setInterval(createRandomSphere, sphereCreationInterval);

// Kamera pozisyonu başlangıçta ayarla
camera.position.set(0, 5, 10);
camera.lookAt(cube.position);

// Hareket hızını belirle
const moveSpeed = 0.1;

// Klavye tuşlarını takip et
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    KeyW: false,
    KeyS: false,
    KeyA: false,
    KeyD: false
};

// Klavye tuşuna basıldığında
window.addEventListener('keydown', function(event) {
    if (event.code in keys) {
        keys[event.code] = true;
    }
});

// Klavye tuşu bırakıldığında
window.addEventListener('keyup', function(event) {
    if (event.code in keys) {
        keys[event.code] = false;
    }
});

// Ayak izi eklemek için fonksiyon
function addFootprint(position) {
    const footprintGeometry = new THREE.PlaneGeometry(1, 1);
    const footprintMaterial = new THREE.MeshBasicMaterial({ color: 0xff1493, side: THREE.DoubleSide });
    const footprint = new THREE.Mesh(footprintGeometry, footprintMaterial);
    footprint.rotation.x = Math.PI / 2;
    footprint.position.set(position.x, 0.01, position.z);
    scene.add(footprint);

    setTimeout(() => {
        scene.remove(footprint);
    }, 2000);
}

// Yanıp sönme efekti için renk değiştirici
let flashing = false; // Yanıp sönme işleminin zaten yapılıp yapılmadığını kontrol eden bir bayrak

function flashCubeColor() {
    if (flashing) return; // Eğer zaten yanıp sönme yapılıyorsa, başka bir yanıp sönme başlatma
    flashing = true; // Yanıp sönme işlemini başlat

    const originalColor = cube.material.color.clone(); // Orijinal rengi sakla
    const flashColor = 0xffd700; // Yanıp sönme rengi
    let isFlashing = true;

    // Yanıp sönme efekti
    const flashInterval = setInterval(() => {
        cube.material.color.set(isFlashing ? flashColor : originalColor); // Rengi değiştir
        isFlashing = !isFlashing;
    }, 200); // Her 200 ms'de bir değişim

    setTimeout(() => {
        clearInterval(flashInterval); // Yanıp sönmeyi durdur
        cube.material.color.set(originalColor); // Orijinal rengi geri yükle
        flashing = false; // Yanıp sönme işlemi bitti
    }, 2000); // 2 saniyelik süre
}

// Çarpışma kontrol fonksiyonu
function checkCollision() {
    for (let i = 0; i < spheres.length; i++) {
        const sphere = spheres[i];
        const distance = cube.position.distanceTo(sphere.position);
        if (distance < 1) {
            scene.remove(sphere); // Küreyi sahneden kaldır
            spheres.splice(i, 1); // Küreyi arrayden kaldır
            i--; // Küre array boyutu değiştiği için index ayarlaması
            score += 100; // Puanı arttır
            scoreElement.innerHTML = "Score: " + score; // Puanı güncelle
            flashCubeColor(); // Renk değiştir ve yanıp sönmeyi başlat
        }
    }
}

// Animasyon döngüsü
function animate() {
    requestAnimationFrame(animate);

    // Hareket mantığı
    let movingForward = keys.ArrowUp || keys.KeyW;
    let movingBackward = keys.ArrowDown || keys.KeyS;
    let movingLeft = keys.ArrowLeft || keys.KeyA;
    let movingRight = keys.ArrowRight || keys.KeyD;

    // İleri + sağ hareketi
    if (movingForward && movingRight) {
        cube.rotation.y = -Math.PI / 4;
        cube.position.x += moveSpeed / Math.sqrt(2);
        cube.position.z -= moveSpeed / Math.sqrt(2);
        addFootprint(cube.position);
    } else if (movingForward && movingLeft) {
        cube.rotation.y = Math.PI / 4;
        cube.position.x -= moveSpeed / Math.sqrt(2);
        cube.position.z -= moveSpeed / Math.sqrt(2);
        addFootprint(cube.position);
    } else if (movingBackward && movingRight) {
        cube.rotation.y = -3 * Math.PI / 4;
        cube.position.x += moveSpeed / Math.sqrt(2);
        cube.position.z += moveSpeed / Math.sqrt(2);
        addFootprint(cube.position);
    } else if (movingBackward && movingLeft) {
        cube.rotation.y = 3 * Math.PI / 4;
        cube.position.x -= moveSpeed / Math.sqrt(2);
        cube.position.z += moveSpeed / Math.sqrt(2);
        addFootprint(cube.position);
    } else if (movingForward) {
        cube.rotation.y = 0;
        cube.position.z -= moveSpeed;
        addFootprint(cube.position);
    } else if (movingBackward) {
        cube.rotation.y = Math.PI;
        cube.position.z += moveSpeed;
        addFootprint(cube.position);
    } else if (movingRight) {
        cube.rotation.y = -Math.PI / 2;
        cube.position.x += moveSpeed;
        addFootprint(cube.position);
    } else if (movingLeft) {
        cube.rotation.y = Math.PI / 2;
        cube.position.x -= moveSpeed;
        addFootprint(cube.position);
    }

    checkCollision(); // Çarpışmayı kontrol et

    // Kamera bloğu takip etsin
    camera.position.x = cube.position.x + 5;
    camera.position.y = cube.position.y + 5;
    camera.position.z = cube.position.z + 10;
    camera.lookAt(cube.position);

    renderer.render(scene, camera);
}

animate();

// Ekran boyutu değiştiğinde, boyutları güncelle
window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});