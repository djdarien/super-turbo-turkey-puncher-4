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
    let punchSound = new Audio('punch.mp3'); // punching sound 
    let welcomeMessage = new Audio('welcome_message.mp3'); // Path to the welcome message
    let bgMusic = new Audio('background_music.mp3'); // Path to the background music
    bgMusic.loop = true; // Ensure the music loops continuously

    // Play welcome message once the document is fully loaded and interacted with
    document.addEventListener('click', () => {
        welcomeMessage.play();
    }, { once: true });

    let turkeys = [];
    let score = 0;
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
      spawnTurkey();
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
                spawnTurkey();
            }
        });
    }

    canvas.addEventListener('mousemove', function(event) {
        let rect = canvas.getBoundingClientRect();
        fist.x = event.clientX - rect.left - fist.width / 2;
        fist.y = event.clientY - rect.top - fist.height / 2;
    });

    canvas.addEventListener('click', function() {
        punchTurkey();
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

    window.exitToMainMenu = function() {
        promptHighScore();
        bgMusic.pause();  // Pause the background music
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('main-menu').style.display = 'block';
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

        // Draw the fist following the mouse
        ctx.drawImage(fistImg, fist.x, fist.y, fist.width, fist.height);

        // Display the score
        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText('Score: ' + score, 10, 30);

        requestAnimationFrame(render);
    }

    // Listen to Enter key for quick exit/high-score
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            returnToMainMenu();
        }
    });
});