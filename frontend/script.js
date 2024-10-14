
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const resumeButton = document.getElementById('resumeButton');
const exitButton = document.getElementById('exitButton');
const gameCanvas = document.getElementById('gameCanvas');
const startScreen = document.getElementById('startScreen');
const controls = document.getElementById('controls');
const resumeButtonModal = document.getElementById('resumeButtonModal');
const exitButtonModal = document.getElementById('exitButtonModal');

// Set canvas size
gameCanvas.width = window.innerWidth;
gameCanvas.height = window.innerHeight;

// Juego inicializado y variables
let gameStarted = false;

// Game variables
let score = 0;
let coins = 0;
let timeLeft = 60;
let gameOver = false;
let countdownStarted = false; // Flag to check if countdown has started
let isPaused = false;
let animationFrameId; 
let lastUpdateTime = 0;


// Player variables
const pouImg = new Image();
pouImg.src = 'assets/images/pou.png';
let pouX = canvas.width / 2 -25; // Centered Pou
let pouY = canvas.height - 180;
let pouJumpHeight = 20;
let isJumping = false;
let spacePressedDuration = 0;
let isSpacePressed = false; 
let maxSpacePressDuration = 2;
let lastPlatformX = pouX;
const COIN_PROBABILITY = 0.4;


// Platform variables
const platformImg = new Image();
platformImg.src = 'assets/images/platform.png';
let platforms = [];
let platformWidth = 100;
let platformHeight = 40;
let platformSpeed = 2;
let platformGap = 150;

// Coin variables
const coinImg = new Image();
coinImg.src = 'assets/images/coin2.png';
let coinsArray = [];
let coinWidth = 20;
let coinHeight = 20;

// Sounds
const jumpSound = new Audio('assets/sounds/jump.mp3');
const coinSound = new Audio('assets/sounds/coin.mp3');
const splashSound = new Audio('assets/sounds/splash.mp3')

// Initialize platforms
function createPlatforms2() {
    platforms = [];
    let lastPlatformY = canvas.height - platformHeight;
    for (let i = 0; i < 5; i++) {
        let platformX = Math.random() * (canvas.width - platformWidth);
        platforms.push({ x: platformX, y: lastPlatformY - (i * (platformHeight + platformGap)) });
    }
}

// Initialize platforms with variable gap
function createPlatformsA() {
    platforms = [];
    let platformY = canvas.height - platformHeight - 100; // Set a fixed Y position (e.g. 100px from the bottom)
    let lastPlatformX = Math.random() * (canvas.width - platformWidth);

    platforms.push({ x: 0, y: platformY });

    for (let i = 1; i < 5; i++) {
        let platformGap = Math.random() * 200 + 100; // Random gap between platforms (100-300 px)
        let platformX = lastPlatformX + platformWidth + platformGap; // Platforms separated by platformWidth + random gap
        platforms.push({ x: platformX, y: platformY });
        lastPlatformX = platformX; // Update the last platform position
    }
}
function createPlatforms() {
    platforms = [];
    let platformY = canvas.height - platformHeight - 100; // Set a fixed Y position (e.g. 100px from the bottom)
    
    // Set first platform directly under Pou
    let firstPlatformX = pouX + 25 - platformWidth / 2; // Center first platform under Pou
    platforms.push({ x: firstPlatformX, y: platformY });
    
    let lastPlatformX = firstPlatformX;

    for (let i = 1; i < 5; i++) {
        let platformGap = (i % 2 === 0) ? 50 : 150; // No gap for every second platform, otherwise set a gap
        let platformX = lastPlatformX + platformWidth + platformGap; // Position based on last platform and gap
        platforms.push({ x: platformX, y: platformY });
        lastPlatformX = platformX; // Update last platform position
    }
}

// Initialize coins
function createCoins() {
    coinsArray = [];
    for (let i = 0; i < platforms.length; i++) {
        let platform = platforms[i];
        
        // Decide aleatoriamente si la plataforma tendrá una moneda
        if (Math.random() < COIN_PROBABILITY) {
            let coinX = platform.x + platformWidth / 2 - coinWidth / 2; // Center the coin on the platform
            let coinY = platform.y - coinHeight - 30; // Place the coin just above the platform
            coinsArray.push({ x: coinX, y: coinY });
        }
    }
}

// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw platforms
    for (const platform of platforms) {
        ctx.drawImage(platformImg, platform.x, platform.y, platformWidth, platformHeight);
    }

    
    // Draw Pou
    ctx.drawImage(pouImg, pouX, pouY, 70, 70);
    
    
    
    // Draw coins
    for (const coin of coinsArray) {
        ctx.drawImage(coinImg, coin.x, coin.y, coinWidth, coinHeight);
    }

    // Draw timer rectangle
    ctx.fillStyle = 'red';
    const timerWidth = (canvas.width * (timeLeft / 60)); // Calculate width based on remaining time
    ctx.fillRect(10, 10, timerWidth, 20); // Draw the timer rectangle

    ctx.font = '24px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(`Score: ${score}`, 10, 60);
    ctx.fillText(`Coins: ${coins}`, 10, 100);
    ctx.fillText(`Time Left: ${Math.floor(timeLeft)}`, 10, 130);
}

// Update game state
function update(timestamp) {
    if (isPaused) {
        // No actualizar el estado del juego ni el temporizador cuando está pausado
        return;
    }
    if (!lastUpdateTime) {
        lastUpdateTime = timestamp;
    }

    const deltaTime = (timestamp - lastUpdateTime) / 1000; // Delta en segundos
    lastUpdateTime = timestamp;

    if (!gameOver) {

        if (isJumping && !countdownStarted) {
            countdownStarted = true; // Start the countdown
        }
        // Handle jumping mechanics
        if (isJumping) {

            if (isSpacePressed) {
                spacePressedDuration += deltaTime;//spacePressedDuration += 0.15; // Incrementa el tiempo de presionado de space
                platformSpeed = Math.min(30, spacePressedDuration * 30);//2 + spacePressedDuration; // Aumenta la velocidad de las plataformas
            } else {
                spacePressedDuration = 0; // Reiniciar la duración cuando se deja de presionar
                platformSpeed = 2; // Restablece la velocidad de las plataformas cuando no está presionado
            }

            pouY -= pouJumpHeight;
            pouJumpHeight -= 1; // Gravity effect


            if (pouJumpHeight <= -20) { // Falling speed limit
                pouJumpHeight = -20;
            }

            
            platforms.forEach(platform => {
                platform.x -= platformSpeed; // Mueve las plataformas hacia la izquierda
                if (platform.x < -platformWidth) { // Reposiciona la plataforma fuera de la pantalla
                    //platform.x = canvas.width + Math.random() * 200 + 100; // Nueva posición aleatoria
                    let lastVisiblePlatform = platforms.reduce((last, current) => current.x > last.x ? current : last);
        
                    // Coloca la nueva plataforma una distancia entre 1 y 2 veces el ancho de la última plataforma visible
                    let newPlatformGap = Math.random() * platformWidth + platformWidth; 
                    platform.x = lastVisiblePlatform.x + newPlatformGap; 

                    score += 10; 
                }
            });

            coinsArray.forEach(coin => {
                coin.x -= platformSpeed;
                if (coin.x < -coinWidth) {
                    let platform = platforms[coinsArray.indexOf(coin)];
                    coin.x = platform.x + platformWidth / 2 - coinWidth / 2;
                }
            });

            coinsArray.forEach((coin, index) => {
                if (pouY + 50 >= coin.y && pouY + 50 <= coin.y + coinHeight && pouX + 50 > coin.x && pouX < coin.x + coinWidth) {
                    coins += 1; // Incrementar la cantidad de monedas
                    score += 20; 
                    coinSound.play(); // Reproducir sonido de moneda
                    coinsArray.splice(index, 1); // Eliminar la moneda recolectada
                }
            });


            if (pouY + 50 >= canvas.height) { // If falls below canvas, game over
                isJumping = false;
                pouY = canvas.height - 100; // Reset to ground level
                gameOver = true;
            }
        }

        

        // Check for collisions with platforms (landing on a platform)
        let landed = false;
        platforms.forEach(platform => {
            if (pouY + 50 >= platform.y && pouY + 50 <= platform.y + 10 && pouX + 50 > platform.x && pouX < platform.x + platformWidth) {
                pouY = platform.y - 50; // Reset to top of platform
                isJumping = false;
                pouJumpHeight = 20; // Reset jump height
                landed = true;
                //jumpSound.play();

                if (platform.x < lastPlatformX) {
                    score += 5; // Incrementa el score al avanzar a una nueva plataforma
                    lastPlatformX = platform.x; // Actualiza la última plataforma superada
                }
            }
        });

        // If no platform was landed on and player is falling
        if (!landed && !isJumping && pouY < canvas.height) {
            pouY += 10; // Gravity pulling down if not jumping and not on a platform
        }

        // Check if the player fell into water (below all platforms)
        if (pouY > canvas.height) {
            gameOver = true; // End the game
            splashSound.play();

        }

        // Update time left
        /*
        if (countdownStarted) {
            timeLeft -= 1 / 60;
            if (timeLeft <= 0) {
                gameOver = true;
            }
        }
        */
        // Actualizar tiempo restante
        if (countdownStarted) {
            timeLeft -= deltaTime;
            if (timeLeft <= 0) {
                gameOver = true;
                timeLeft = 0;
            }
        }
        // Draw everything
        draw();

        // Request animation frame
        requestAnimationFrame(update);
    } else {
        ctx.font = '48px Arial';
        ctx.fillStyle = 'red';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2 - 100, canvas.height / 2 + 50);
    }
}

document.addEventListener('click', () => {
    jumpSound.load(); // Cargar el sonido de salto
    coinSound.load(); // Cargar el sonido de moneda
    splashSound.load(); // Cargar el sonido de splash
});

// Initialize game
function startGame() {
    createPlatforms();
    createCoins();
    //update();
    countdownStarted = true;
    lastUpdateTime = 0;
    animationFrameId = requestAnimationFrame(update);
}


// Start the game
startButton.addEventListener('click', () => {
    startScreen.style.display = 'none';  // Ocultar la pantalla de inicio
    gameScreen.style.display = 'block'; 
    startGame();
});



// Evento del botón "Pausar"
pauseButton.addEventListener('click', () => {
    isPaused = true;  // Pausa el juego
    pauseModal.style.display = 'flex';  // Muestra la ventana modal
    cancelAnimationFrame(animationFrameId);
});



// Evento del botón "Reanudar" en la ventana modal
resumeButtonModal.addEventListener('click', () => {
    isPaused = false;                          // Reanudar el juego
    pauseModal.style.display = 'none';         // Ocultar la ventana modal de pausa
    lastUpdateTime = performance.now();         // Actualizar el tiempo de referencia
    animationFrameId = requestAnimationFrame(update); // Reanudar la animación
});

// Handle user input
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        pouX -= 10; // Move left    } else if (e.key === 'ArrowRight') {
        pouX += 10; // Move right
    } else if (e.key === ' ' || e.key === 'ArrowUp') {
        if (!isJumping) {
            isJumping = true; // Start jump
            isSpacePressed = true;
            //jumpSound.play();
            spacePressedDuration = 0;

        }
    }
});


document.addEventListener('keyup', (e) => {
    if (e.key === ' ' || e.key === 'ArrowUp') {
        isSpacePressed = false; // Dejar de presionar space
    }
});

//startGame();

// Evento del botón "Salir"
exitButton.addEventListener('click', () => {
    resetGame();  // Restablece los valores del juego
    pauseModal.style.display = 'none';
    gameScreen.style.display = 'none';  // Oculta la pantalla del juego
    startScreen.style.display = 'block';  // Muestra la pantalla de inicio
});


exitButtonModal.addEventListener('click', () => {
    resetGame();  // Restablece el juego
    pauseModal.style.display = 'none';  // Oculta la ventana modal
    gameScreen.style.display = 'none';  // Oculta la pantalla del juego
    startScreen.style.display = 'block';  // Muestra la pantalla de inicio
});

function resetGame() {
    // Restablecer las variables del juego a sus valores iniciales
    gameStarted = false;
    score = 0;
    coins = 0;
    timeLeft = 60;
    gameOver = false;
    countdownStarted = false;
    isPaused = false;
    
    // Restablecer la posición de Pou
    pouX = canvas.width / 2 - 25; 
    pouY = canvas.height - 180;
    pouJumpHeight = 20;
    isJumping = false;

    // Reiniciar las plataformas y monedas
    createPlatforms();
    createCoins();

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Detener cualquier animación
    pauseModal.style.display = 'none';
    //cancelAnimationFrame(update); // Cancelar la solicitud de animación para detener el juego
}
