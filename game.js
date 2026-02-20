document.addEventListener('DOMContentLoaded', (event) => {
    let canvas = document.getElementById('gameCanvas');
    let ctx = canvas.getContext('2d');

    canvas.width = 800;
    canvas.height = 600;

    // Assets
    let turkeyImg = new Image();
    turkeyImg.src = 'turkey.png'; // Path to the turkey image

    let fistImg = new Image();
    fistImg.src = 'fist.png'; // Path to the fist image

    let bgImg = new Image();
    bgImg.src = 'background.png'; // Path to the background image

    let gobbleSound = new Audio('gobble.mp3'); // Path to the gobble sound
    let punchSound = new Audio('punch.mp3'); // Path to the punch sound 
    let welcomeMessage = new Audio('welcome_message.mp3'); // Path to the welcome message
    let bgMusic = new Audio('background_music.mp3'); // Path to the background music
    bgMusic.loop = true; // Ensure the music loops continuously

    // Power-Up Images
    let powerUpImages = {
        extraPoints: new Image(),
        slowTime: new Image(),
        fastTime: new Image()
    };
    powerUpImages.extraPoints.src = 'extrapoints.png'; // Image for extra points
    powerUpImages.slowTime.src = 'slowtime.png'; // Image for slow time
    powerUpImages.fastTime.src = 'fasttime.png'; // Image for fast time

    // Sound Effects for Power-Ups
    let powerupSpawnSound = new Audio('powerup_spawn.mp3'); // Sound played when a power-up spawns
    let powerupPickupSound = new Audio('powerup_pickup.mp3'); // Sound played when a power-up is collected
    let comboEndSound = new Audio('combo_end.mp3'); // Sound played when combo ends

    // Play welcome message once the document is fully loaded and interacted with
    document.addEventListener('click', () => {
        welcomeMessage.play();
    }, { once: true });

    let turkeys = [];
    let score = 0;
    let comboCount = 0;
    let comboTimer;
    let comboStartTime;
    let currentLevel = 1;
    const comboDuration = 3000; // Combo duration in milliseconds
    let gameSpeed = 1; // New variable for game speed
    let speedEffectTimer; // Timer for speed effects
    let screenShake = 0;

    const powerUpTypes = Object.keys(powerUpImages);
    const powerUps = [];

    let highScores = JSON.parse(localStorage.getItem('highScores')) || [];

    // Keep track of the fist position
    let fist = {
        x: 0,
        y: 0,
        width: 50,
        height: 50
    };

    // Add control buttons to the game canvas
    const controlButtons = document.createElement('div');
    controlButtons.id = 'control-buttons';
    controlButtons.innerHTML = `
        <button onclick="pauseGame()">Pause</button>
        <button onclick="returnToMainMenu()">Main Menu</button>
    `;
    document.body.appendChild(controlButtons);

    // Helper to prompt user for high score submission
    function promptHighScore() {
        if (confirm("Are you done stuffing the turkey?")) {
            saveHighScore(score);
        }
    }

    // Update high score list display
    function updateHighScoreList() {
        document.getElementById('high-score-list').innerHTML = highScores.map(score => `<li>${score}</li>`).join('');
    }
    updateHighScoreList();

    window.startGame = function() {
      document.getElementById('main-menu').style.display = 'none';
      document.getElementById('high-score').style.display = 'none';
      canvas.style.display = 'block';
      turkeys = [];
      score = 0;
      comboCount = 0;
      currentLevel = 1;
      spawnTurkey();
      spawnPowerUp();
      bgMusic.play();
      render();
    };

    function spawnTurkey() {
        gobbleSound.play();
        let turkey = {
            x: Math.random() * (canvas.width - 64),
            y: Math.random() * (canvas.height - 64),
            width: 64,
            height: 64,
            dx: (Math.random() - 0.5) * 2,
            dy: (Math.random() - 0.5) * 2,
            scale: 1
        };
        turkeys.push(turkey);
    }

    function spawnPowerUp() {
        setTimeout(() => {
            let powerUp = {
                type: powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)],
                x: Math.random() * (canvas.width - 32),
                y: Math.random() * (canvas.height - 32),
                width: 32,
                height: 32
            };
            powerUps.push(powerUp);
            powerupSpawnSound.play(); // Play spawn sound here
            // Recursively spawn another power-up
            spawnPowerUp();
        }, Math.random() * 10000 + 5000); // Spawn a power-up every 5 - 15 seconds
    }

    function punchTurkey() {
        turkeys.forEach((turkey, index) => {
            if (
                fist.x < turkey.x + turkey.width &&
                fist.x + fist.width > turkey.x &&
                fist.y < turkey.y + turkey.height &&
                fist.y + fist.height > turkey.y
            ) {
                turkeys.splice(index, 1);
                punchSound.play();
                score += 100;
                updateCombo();
                spawnTurkey();
                screenShake = 10;
            }
        });
    }

    function updateCombo() {
        comboCount++;
        comboStartTime = Date.now();
        clearTimeout(comboTimer);
        comboTimer = setTimeout(() => {
            comboCount = 0;
            comboEndSound.play();
        }, comboDuration);
        score += comboCount * 10; // Increase the score based on the combo count
    }

    function handlePowerUp(powerUp) {
        powerupPickupSound.play(); // Play pickup sound here
        if (powerUp.type === 'extraPoints') {
            score += 500;
        } else if (powerUp.type === 'slowTime') {
            gameSpeed = 0.5;
            clearTimeout(speedEffectTimer);
            speedEffectTimer = setTimeout(() => gameSpeed = 1, 5000);
        } else if (powerUp.type === 'fastTime') {
            gameSpeed = 1.5;
            clearTimeout(speedEffectTimer);
            speedEffectTimer = setTimeout(() => gameSpeed = 1, 5000);
        }
    }

    canvas.addEventListener('mousemove', function(event) {
        let rect = canvas.getBoundingClientRect();
        fist.x = event.clientX - rect.left - fist.width / 2;
        fist.y = event.clientY - rect.top - fist.height / 2;
    });

    canvas.addEventListener('click', function() {
        punchTurkey();
        powerUps.forEach((powerUp, index) => {
            if (
                fist.x < powerUp.x + powerUp.width &&
                fist.x + fist.width > powerUp.x &&
                fist.y < powerUp.y + powerUp.height &&
                fist.y + fist.height > powerUp.y
            ) {
                powerUps.splice(index, 1);
                handlePowerUp(powerUp);
            }
        });
    });

    // Pause and Resume functionality
    window.pauseGame = function() {
        canvas.style.display = 'none';
        document.getElementById('pause-menu').style.display = 'flex';
        bgMusic.pause();
    };

    window.resumeGame = function() {
        document.getElementById('pause-menu').style.display = 'none';
        canvas.style.display = 'block';
        bgMusic.play();
        render();
    };

    window.returnToMainMenu = function() {
        promptHighScore();
        bgMusic.pause();  // Pause the background music
        canvas.style.display = 'none';
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('main-menu').style.display = 'block';
    };

    window.showHighScores = function() {
        promptHighScore();
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('high-score').style.display = 'flex';
    };

    function saveHighScore(score) {
      highScores.push(score);
      highScores.sort((a, b) => b - a);
      highScores = highScores.slice(0, 5);
      localStorage.setItem('highScores', JSON.stringify(highScores));
      updateHighScoreList();
    }

function render() {
        if (screenShake > 0) {
            ctx.save();
            ctx.translate(Math.random() * screenShake - screenShake / 2, Math.random() * screenShake - screenShake / 2);
            screenShake--;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the background
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

        // Update and draw the turkeys
        turkeys.forEach(turkey => {
            turkey.x += turkey.dx * gameSpeed;
            turkey.y += turkey.dy * gameSpeed;

            if (turkey.x <= 0 || turkey.x + turkey.width >= canvas.width) {
                turkey.dx = -turkey.dx;
            }
            if (turkey.y <= 0 || turkey.y + turkey.height >= canvas.height) {
                turkey.dy = -turkey.dy;
            }

            ctx.drawImage(turkeyImg, turkey.x, turkey.y, turkey.width, turkey.height);
        });

        // Draw power-ups
        powerUps.forEach(powerUp => {
            const pulse = Math.sin(Date.now() * 0.005) * 0.1 + 1;
            const size = powerUp.width * pulse;
            ctx.drawImage(powerUpImages[powerUp.type], powerUp.x, powerUp.y, size, size);
        });

        // Draw the fist following the mouse
        ctx.drawImage(fistImg, fist.x, fist.y, fist.width, fist.height);

        // Display the score and level
        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Score: ' + score, 10, 30);
        ctx.fillText('Level: ' + currentLevel, 10, 60);

        // Display the combo counter
        if (comboCount > 1) {
            ctx.fillText('Combo: ' + comboCount, 10, 90);
            // Draw combo timer bar
            const barWidth = 200;
            const barHeight = 10;
            const timeLeft = (comboDuration - (Date.now() - comboStartTime)) / comboDuration;
            ctx.fillStyle = 'red';
            ctx.fillRect(10, 100, barWidth * timeLeft, barHeight);
            ctx.strokeStyle = 'white';
            ctx.strokeRect(10, 100, barWidth, barHeight);
        }

        // Display the current speed effect
        if (gameSpeed !== 1) {
            ctx.fillStyle = 'yellow';
            ctx.fillText(gameSpeed > 1 ? 'FAST TIME' : 'SLOW TIME', 10, 120);
        }

        if (screenShake > 0) {
            ctx.restore();
        }

        requestAnimationFrame(render);
    }

    // Listen to Enter key for quick exit/high-score
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            returnToMainMenu();
        }
    });
});