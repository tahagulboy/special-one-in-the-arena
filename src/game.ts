import * as THREE from 'three';
import { DRACOLoader } from 'three/examples/jsm/Addons.js';
import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

export async function game(){
    const loader = new GLTFLoader();
    let mixer: THREE.AnimationMixer;  // Animasyon karıştırıcısı
    const clock: THREE.Clock = new THREE.Clock();  // Animasyon zamanlayıcı
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath( 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/' );
    loader.setDRACOLoader( dracoLoader );

    // Sahne ve Kamera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Işıklar ve zemin
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    scene.add(light);

    // Renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Zıplama ile ilgili değişkenler
    let isJumping = false;
    let velocityY = 0; // Zıplama hızı
    const gravity = -0.005; // Yerçekimi kuvvetini azalt
    const jumpStrength = 0.15; // Zıplama kuvvetini biraz düşür

    // Başlangıçtaki mermi sayısı
    let bullets = 10; // Başlangıç mermi sayısı
    const maxBullets = 20; // Maksimum mermi sınırı

    // Mermi göstergesi
    const bulletElement = document.createElement('div');
    bulletElement.style.position = 'absolute';
    bulletElement.style.top = '40px';
    bulletElement.style.right = '10px';
    bulletElement.style.color = 'white';
    bulletElement.style.fontSize = '24px';
    bulletElement.innerHTML = "Bullets: " + bullets;
    document.body.appendChild(bulletElement);

    // Mermi sayısını güncelleme fonksiyonu
    function updateBullets(amount: number) {
        bullets += amount;
        if (bullets > maxBullets) bullets = maxBullets; // Maksimum sınırı aşmasın
        bulletElement.innerHTML = "Bullets: " + bullets;
    }

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

    let cube = new THREE.Object3D();
    
    loader.load(
        '/character.glb',
        function ( gltf: GLTF ) {
            cube = gltf.scene; 
            cube.position.y = 0.5; // Blok zeminin üstünde olsun
            cube.scale.set(0.01, 0.01, 0.01); // Modelin ölçeğini ayarla (x, y, z)
            scene.add(cube);    
        },
        undefined, 
        function (error) {
            console.error('An error happened during loading', error); // Handle errors
        });

    loader.load('walking.glb', (gltf) => {
        const clips = gltf.animations;        
        mixer = new THREE.AnimationMixer(cube);
        const clip = THREE.AnimationClip.findByName(clips, 'mixamo.com'); // 'dance' animasyonu
        let walkAction = mixer.clipAction(clip);
        walkAction.play();
    }, undefined, (error) => {
        console.error('An error happened', error);
    });
    // Rastgele yuvarlak bloklar oluşturma
    const spheres: THREE.Mesh[] = [];
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
        KeyD: false,
        KeyQ: false, // Atılma tuşu
        Space: false // Zıplama tuşu
    };

    // Klavye tuşuna basıldığında
    window.addEventListener('keydown', function(event) {
        if (event.code in keys) {
            keys[event.code as keyof typeof keys] = true;
        }
        if (event.code === 'Space' && !isJumping) {
            isJumping = true;
            velocityY = jumpStrength;
        }
        if (event.code === 'KeyQ') {
            dash(); // q tuşuna basıldığında atılma fonksiyonunu çağır
        }
    });

    // Klavye tuşu bırakıldığında
    window.addEventListener('keyup', function(event) {
        if (event.code in keys) {
            keys[event.code as keyof typeof keys] = false;
            // walk.stop();
        }
    });

    // Ayak izi eklemek için fonksiyon
    function addFootprint(position: THREE.Vector3) {
        const footprintGeometry = new THREE.PlaneGeometry(1, 1);
        const footprintMaterial = new THREE.MeshBasicMaterial({ color: 0xff1493, side: THREE.DoubleSide });
        const footprint = new THREE.Mesh(footprintGeometry, footprintMaterial);
        footprint.rotation.x = Math.PI / 2;
        footprint.position.set(position.x, 0.01, position.z);
        scene.add(footprint);

        setTimeout(() => {
            scene.remove(footprint);
        }, 750);
    }

    // Yanıp sönme efekti için renk değiştirici
    //let flashing = false; //Yanıp sönme işleminin zaten yapılıp yapılmadığını kontrol eden bir bayrak

    function flashCubeColor() {
        // if (flashing) return; // Eğer zaten yanıp sönme yapılıyorsa, başka bir yanıp sönme başlatma
        // flashing = true; // Yanıp sönme işlemini başlat

        // const originalColor = cube.material.color.clone(); // Orijinal rengi sakla
        // const flashColor = 0xffd700; // Yanıp sönme rengi
        // let isFlashing = true;

        // // Yanıp sönme efekti
        // const flashInterval = setInterval(() => {
        //     cube.material.color.set(isFlashing ? flashColor : originalColor); // Rengi değiştir
        //     isFlashing = !isFlashing;
        // }, 200); // Her 200 ms'de bir değişim

        // setTimeout(() => {
        //     clearInterval(flashInterval); // Yanıp sönmeyi durdur
        //     cube.material.color.set(originalColor); // Orijinal rengi geri yükle
        //     flashing = false; // Yanıp sönme işlemi bitti
        // }, 2000); // 2 saniyelik süre
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

    const mapBoundary = 50; // Set your desired boundary limits

    // Animasyon döngüsü
    function animate() {
        requestAnimationFrame(animate);

        if (mixer) {
            let delta = clock.getDelta();
            mixer.update(delta);
        }

        // Hareket mantığı
        let movingForward = keys.ArrowUp || keys.KeyW;
        let movingBackward = keys.ArrowDown || keys.KeyS;
        let movingLeft = keys.ArrowLeft || keys.KeyA;
        let movingRight = keys.ArrowRight || keys.KeyD;

        // İleri + sağ hareketi
        if (movingForward && movingRight) {
            cube.rotation.y = -Math.PI / 4;
            cube.position.x = Math.max(-mapBoundary, Math.min(mapBoundary, cube.position.x - moveSpeed / Math.sqrt(2))); // Limit X
            cube.position.z = Math.max(-mapBoundary, Math.min(mapBoundary, cube.position.z + moveSpeed / Math.sqrt(2))); // Limit Z
            addFootprint(cube.position);
        } else if (movingForward && movingLeft) {
            cube.rotation.y = +Math.PI / 4;
            cube.position.x = Math.max(-mapBoundary, Math.min(mapBoundary, cube.position.x + moveSpeed / Math.sqrt(2))); // Limit X
            cube.position.z = Math.max(-mapBoundary, Math.min(mapBoundary, cube.position.z + moveSpeed / Math.sqrt(2))); // Limit Z
            addFootprint(cube.position);
        } else if (movingBackward && movingRight) {
            cube.rotation.y = -3 * Math.PI / 4;
            cube.position.x = Math.max(-mapBoundary, Math.min(mapBoundary, cube.position.x - moveSpeed / Math.sqrt(2))); // Limit X
            cube.position.z = Math.max(-mapBoundary, Math.min(mapBoundary, cube.position.z - moveSpeed / Math.sqrt(2))); // Limit Z
            addFootprint(cube.position);
        } else if (movingBackward && movingLeft) {
            cube.rotation.y = 3 * Math.PI / 4;
            cube.position.x = Math.max(-mapBoundary, Math.min(mapBoundary, cube.position.x + moveSpeed / Math.sqrt(2))); // Limit X
            cube.position.z = Math.max(-mapBoundary, Math.min(mapBoundary, cube.position.z - moveSpeed / Math.sqrt(2))); // Limit Z
            addFootprint(cube.position);
        } else if (movingForward) {
            cube.rotation.y = 0;
            cube.position.z = Math.max(-mapBoundary, Math.min(mapBoundary, cube.position.z + moveSpeed)); // Limit Z
            addFootprint(cube.position);
        } else if (movingBackward) {
            cube.rotation.y = Math.PI;
            cube.position.z = Math.max(-mapBoundary, Math.min(mapBoundary, cube.position.z - moveSpeed)); // Limit Z
            addFootprint(cube.position);
        } else if (movingRight) {
            cube.rotation.y = - Math.PI / 2;
            cube.position.x = Math.max(-mapBoundary, Math.min(mapBoundary, cube.position.x - moveSpeed)); // Limit X
            addFootprint(cube.position);
        } else if (movingLeft) {
            cube.rotation.y = Math.PI / 2;
            cube.position.x = Math.max(-mapBoundary, Math.min(mapBoundary, cube.position.x + moveSpeed)); // Limit X
            addFootprint(cube.position);
        }

        if (isJumping) {
            velocityY += gravity; // Yerçekimi etkisi
            cube.position.y += velocityY; // Karakteri yükselt

            // Karakter zemine düştü mü kontrol et
            if (cube.position.y <= 0.5) {
                cube.position.y = 0.5; // Zemin seviyesine geri döndür
                isJumping = false; // Zıplama işlemi sona erdi
                velocityY = 0; // Hız sıfırlanmalı
            }
        }
        
        checkCollision(); // Çarpışmayı kontrol et

        // Kamera bloğu takip etsin
        camera.position.x = cube.position.x - 5;
        camera.position.y = cube.position.y + 5;
        camera.position.z = cube.position.z - 10;
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

    // Ateşleme sırasında mermi kontrolü ekle
    window.addEventListener('click', function() {
        if (bullets > 0) {
            // Sadece mermi varsa ateş et
            bullets--;
            updateBullets(0); // Mermi sayısını güncelle

            const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
            const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
            const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

            sphere.position.set(cube.position.x, cube.position.y, cube.position.z);

            const direction = new THREE.Vector3();
            cube.getWorldDirection(direction);
            direction.y = 0;
            direction.normalize();

            const speed = 0.5;
            sphere.userData.velocity = direction.multiplyScalar(speed);

            scene.add(sphere);

            function updateSphere() {
                sphere.position.add(sphere.userData.velocity);

                if (sphere.position.length() > 100) {
                    scene.remove(sphere);
                } else {
                    enemies.forEach((enemy, index) => {
                        if (sphere.position.distanceTo(enemy.position) < 1) {
                            enemy.userData.health -= 20;
                            console.log("Hit! Current Enemy Health:", enemy.userData.health); // Hata ayıklama
                            scene.remove(sphere);

                            if (enemy.userData.health <= 0) {
                                scene.remove(enemy);
                                updateBullets(5); // 5 mermi ekle
                                enemies.splice(index, 1);
                            }
                            return;
                        }
                    });

                    requestAnimationFrame(updateSphere);
                }
            }
            updateSphere();
        } else {
            console.log("No bullets left!"); // Mermi bittiğinde bildirim
        }
    });

    // Can göstergesi
    let health = 100; // Başlangıç canı
    const healthElement = document.createElement('div');
    healthElement.style.position = 'absolute';
    healthElement.style.top = '10px';
    healthElement.style.right = '10px';
    healthElement.style.color = 'white';
    healthElement.style.fontSize = '24px';
    healthElement.innerHTML = "Health: " + health;
    document.body.appendChild(healthElement);

    function updateHealth(amount: number) {
        health += amount;
        healthElement.innerHTML = "Health: " + health;

        // Can 0'dan az olamaz
        if (health <= 0) {
            console.log("Game Over");
            showGameOverMenu(); // Oyun bittiğinde menüyü göster
        }
    }

    function restartGame() {
        // Düşmanları ve topları kaldır
        enemies.forEach(enemy => scene.remove(enemy));
        enemies.length = 0; // Düşman dizisini temizle

        // Tüm topları kaldır
        const spheres = scene.children.filter(child => child instanceof THREE.Mesh && child.geometry.type === "SphereGeometry");
        spheres.forEach(sphere => scene.remove(sphere));

        // Canı sıfırlama
        health = 100; // Başlangıç canına geri döndür
        bullets = 10;
        score = 0;
        healthElement.innerHTML = "Health: " + health;
        bulletElement.innerHTML = "Bullets: " + bullets;
        scoreElement.innerHTML = "Score: " + score;

        // Oyun nesnelerini yeniden oluşturmak için gerekli kodlar buraya eklenebilir
        // Örneğin: createEnemy() veya diğer başlangıç fonksiyonları
    }

    const enemies: any[] = [];

    // Düşman oluşturma fonksiyonu
    function createEnemy() {
        const enemyGeometry = new THREE.BoxGeometry(1, 1, 1);
        const enemyMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
        enemy.position.set(Math.random() * 50 - 25, 0.5, Math.random() * 50 - 25);
        enemy.userData.health = 50; // Düşmanın canı
        enemy.userData.isJumping = false; // Düşmanın zıplama durumu
        enemy.userData.velocityY = 0; // Zıplama hızı
        scene.add(enemy);
        enemies.push(enemy);
        
        moveEnemy(enemy); // Düşmanı rastgele hareket ettir
        startEnemyJump(enemy);
    }

    function startEnemyJump(enemy: THREE.Mesh) {
        // Her düşmanın rastgele bir süre sonra zıplaması için bir interval ayarlayalım
        setInterval(() => {
            if (!enemy.userData.isJumping) {
                enemy.userData.isJumping = true;
                enemy.userData.velocityY = 0.15; // Düşmanın zıplama kuvveti
            }
        }, Math.random() * 5000 + 2000); // 2-7 saniye arasında rastgele bir zıplama süresi
    }

    function updateEnemyJump(enemy: THREE.Mesh) {
        if (enemy.userData.isJumping) {
            enemy.userData.velocityY += gravity; // Yerçekimi etkisi
            enemy.position.y += enemy.userData.velocityY; // Düşmanı yükselt veya alçalt

            // Düşman zemine düştü mü kontrol et
            if (enemy.position.y <= 0.5) {
                enemy.position.y = 0.5; // Zemin seviyesine geri döndür
                enemy.userData.isJumping = false; // Zıplama işlemi sona erdi
                enemy.userData.velocityY = 0; // Hızı sıfırla
            }
        }
    }

    // Düşmanları rastgele hareket ettirmek için
    function moveEnemy(enemy: THREE.Mesh) {
        const moveSpeed = 0.02; // Düşmanın hareket hızı

        // Rastgele bir yön belirle
        const randomDirection = new THREE.Vector3(
            Math.random() - 0.5, // X yönü
            0, // Y yönü sabit
            Math.random() - 0.5  // Z yönü
        ).normalize(); // Yönü normalize et

        // Düşmanın hareket etmesi için sürekli güncelle
        function updateEnemy() {
            enemy.position.add(randomDirection.clone().multiplyScalar(moveSpeed));

            // Düşman sahnenin sınırlarını aşmamalı
            enemy.position.x = Math.max(-50, Math.min(50, enemy.position.x));
            enemy.position.z = Math.max(-50, Math.min(50, enemy.position.z));

            // Düşmanın zıplama durumunu kontrol et
            updateEnemyJump(enemy);

            requestAnimationFrame(updateEnemy); // Devam et
        }

        updateEnemy(); // Düşmanın hareketini başlat
    }

    // Düşmanları düzenli aralıklarla oluşturmak için interval ayarlama
    setInterval(createEnemy, 5000); // Her 5 saniyede bir düşman oluştur

    function createEnemySphere(enemy: THREE.Mesh) {
        const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

        sphere.position.set(enemy.position.x, enemy.position.y, enemy.position.z);

        // Topun fırlatma yönü
        const direction = new THREE.Vector3();
        direction.subVectors(cube.position, enemy.position); // Düşmandan karaktere
        direction.y = 0; // Dikey hareketi sıfırla
        direction.normalize();

        const speed = 0.5;
        sphere.userData.velocity = direction.multiplyScalar(speed);

        scene.add(sphere);

        function updateSphere() {
            sphere.position.add(sphere.userData.velocity);
            
            // Eğer top sahneden çıkarsa
            if (sphere.position.length() > 100) {
                scene.remove(sphere);
                return;
            }

            // Topun karakterle çarpışmasını kontrol et
            const distance = sphere.position.distanceTo(cube.position);
            if (distance < 1) {
                updateHealth(-10); // Canı azalt
                scene.remove(sphere); // Topu kaldır
                console.log("Hit! Current Health:", health); // Hata ayıklama
                return;
            }

            requestAnimationFrame(updateSphere); // Devam et
        }
        updateSphere();
    }

    function enemyAttack() {
        enemies.forEach(enemy => {
            createEnemySphere(enemy); // Her düşman için top oluştur
        });
    }

    // Düşmanların top fırlatmasını her 2 saniyede bir sağlamak için
    setInterval(enemyAttack, 2000);

    // Game Over menüsü oluşturma
    const gameOverMenu = document.createElement('div');
    gameOverMenu.style.position = 'absolute';
    gameOverMenu.style.top = '50%';
    gameOverMenu.style.left = '50%';
    gameOverMenu.style.transform = 'translate(-50%, -50%)';
    gameOverMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    gameOverMenu.style.padding = '20px';
    gameOverMenu.style.color = 'white';
    gameOverMenu.style.fontSize = '24px';
    gameOverMenu.style.textAlign = 'center';
    gameOverMenu.style.display = 'none'; // Başlangıçta gizli
    document.body.appendChild(gameOverMenu);

    // Oyun bitti mesajı
    const gameOverMessage = document.createElement('div');
    gameOverMessage.innerHTML = 'Öldün!';
    gameOverMenu.appendChild(gameOverMessage);

    // Skor göstergesi
    const scoreMessage = document.createElement('div');
    scoreMessage.style.marginTop = '20px';
    gameOverMenu.appendChild(scoreMessage);

    // Tekrar Oyna butonu
    const restartButton = document.createElement('button');
    restartButton.innerHTML = 'Tekrar Oyna';
    restartButton.style.fontSize = '24px';
    restartButton.style.marginTop = '10px';
    gameOverMenu.appendChild(restartButton);

    function showGameOverMenu() {
        gameOverMenu.style.display = 'block'; // Menü görünür yap
        scoreMessage.innerHTML = 'Toplam Skor: ' + score; // Skoru güncelle
    }

    restartButton.addEventListener('click', () => {
        gameOverMenu.style.display = 'none'; // Menüyü gizle
        restartGame(); // Oyunu yeniden başlat
    });

    function dash() {
        //const dashDistance = 3; // Atılma mesafesi
        const dashSpeed = 0.5; // Atılma hızı

        // Karakterin şu anki yönünü belirleyelim
        const direction = new THREE.Vector3();
        cube.getWorldDirection(direction);
        direction.y = 0; // Yüksekliği sıfırla, sadece yatay düzlemde ilerle
        direction.normalize();

        // Karakteri belirtilen mesafede ileri taşı
        //const dashPosition = direction.multiplyScalar(dashDistance);
        const dashInterval = setInterval(() => {
            cube.position.addScaledVector(direction, dashSpeed);
        }, 16); // Her 16 ms'de bir güncelle (60 FPS)

        // Belirli bir süre sonra atılmayı durdur
        setTimeout(() => {
            clearInterval(dashInterval);
        }, 200); // 200 ms süresince atılma gerçekleşsin
    }
}