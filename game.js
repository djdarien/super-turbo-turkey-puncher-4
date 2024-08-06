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

    // Play welcome message once the document is fully loaded and interacted with
    document.addEventListener('click', () => {
        welcomeMessage.play();
    }, { once: true });

    let turkeys = [];
    let score = 0;
    let comboCount = 0;
    let comboTimer;
    let currentLevel = 1;
    const comboDuration = 3000; // Combo duration in milliseconds

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
            height: 64
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
            }
        });
    }

    function updateCombo() {
        comboCount++;
        clearTimeout(comboTimer);
        comboTimer = setTimeout(() => comboCount = 0, comboDuration);
        score += comboCount * 10; // Increase the score based on the combo count
    }

    function handlePowerUp(powerUp) {
        powerupPickupSound.play(); // Play pickup sound here
        if (powerUp.type === 'extraPoints') {
            score += 500;
        } else if (powerUp.type === 'slowTime') {
            // Implement slow time logic (not implemented in this code)
        } else if (powerUp.type === 'fastTime') {
            // Implement fast time logic (not implemented in this code)
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the background
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);

        // Draw the turkeys
        turkeys.forEach(turkey => {
            ctx.drawImage(turkeyImg, turkey.x, turkey.y, turkey.width, turkey.height);
        });

        // Draw power-ups
        powerUps.forEach(powerUp => {
            ctx.drawImage(powerUpImages[powerUp.type], powerUp.x, powerUp.y, powerUp.width, powerUp.height);
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