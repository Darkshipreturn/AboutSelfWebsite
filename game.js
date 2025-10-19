document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Selection ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const finalScoreElement = document.getElementById('finalScore');
    const scoreForm = document.getElementById('scoreForm');
    const playerNameInput = document.getElementById('playerNameInput');
    const playAgainButton = document.getElementById('playAgainButton');
    const personalBestScoreElement = document.getElementById('personalBestScore');
    const playerNameDisplayElement = document.getElementById('playerNameDisplay');
    const editNameButton = document.getElementById('editNameButton');
    const leaderboardList = document.getElementById('leaderboardList');
    const noScoresMessage = document.getElementById('noScoresMessage');
    const personalBestDisplay = document.getElementById('personalBestDisplay');
    const editNameForm = document.getElementById('editNameForm');
    const editPlayerNameInput = document.getElementById('editPlayerNameInput');
    const cancelEditButton = document.getElementById('cancelEditButton');
    const gameContainer = document.getElementById('game-container');
    const fullscreenButton = document.getElementById('fullscreenButton');

    // --- Firebase & Game Constants ---
    // Make sure firebase is initialized in your HTML file before this script runs
    const db = firebase.firestore();
    const leaderboardCollection = db.collection('leaderboard');
    const TILE_COUNT = 20;
    const MAX_LEADERBOARD_ENTRIES = 10;
    let tileSize;

    // --- Game State Variables ---
    let snake, food, direction, score, isGameOver, changingDirection, gameInterval;

    // --- Canvas Resize Function ---
    function resizeCanvas() {
        const size = gameContainer.getBoundingClientRect().width;
        canvas.width = size;
        canvas.height = size;
        tileSize = canvas.width / TILE_COUNT;
    }

    // --- Core Game Loop & Logic ---
    function startGame() {
        snake = [{ x: 10, y: 10 }];
        direction = 'right';
        score = 0;
        isGameOver = false;
        changingDirection = false;
        scoreElement.textContent = score;
        gameOverScreen.classList.add('hidden');
        if (gameInterval) clearInterval(gameInterval);
        generateFood();
        gameInterval = setInterval(updateGame, 100);
    }

    function updateGame() {
        if (isGameOver) return;
        changingDirection = false;
        clearCanvas();
        drawFood();
        moveSnake();
        drawSnake();
        checkCollision();
    }

    function gameOver() {
        isGameOver = true;
        clearInterval(gameInterval);
        finalScoreElement.textContent = score;
        const savedName = localStorage.getItem('snakePlayerName');
        if (savedName) {
            updateScores(savedName, score); // Update score in Firestore
            scoreForm.classList.add('hidden');
            playAgainButton.classList.remove('hidden');
        } else {
            scoreForm.classList.remove('hidden');
            playAgainButton.classList.add('hidden');
            playerNameInput.focus();
        }
        gameOverScreen.classList.remove('hidden');
    }

    // --- Drawing functions (use dynamic `tileSize`) ---
    function clearCanvas() {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawSnake() {
        const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary-color').trim();
        ctx.fillStyle = primaryColor;
        snake.forEach(part => {
            ctx.fillRect(part.x * tileSize, part.y * tileSize, tileSize, tileSize);
        });
    }

    function drawFood() {
        ctx.fillStyle = '#f87171';
        ctx.fillRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize);
    }

    function moveSnake() {
        const head = { x: snake[0].x, y: snake[0].y };
        switch (direction) {
            case 'up': head.y -= 1; break;
            case 'down': head.y += 1; break;
            case 'left': head.x -= 1; break;
            case 'right': head.x += 1; break;
        }
        snake.unshift(head);
        if (head.x === food.x && head.y === food.y) {
            score++;
            scoreElement.textContent = score;
            generateFood();
        } else {
            snake.pop();
        }
    }

    // --- Logic using `TILE_COUNT` ---
    function generateFood() {
        food = {
            x: Math.floor(Math.random() * TILE_COUNT),
            y: Math.floor(Math.random() * TILE_COUNT)
        };
        if (snake.some(part => part.x === food.x && part.y === food.y)) {
            generateFood();
        }
    }

    function checkCollision() {
        const head = snake[0];
        if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT || snake.slice(1).some(part => part.x === head.x && part.y === head.y)) {
            gameOver();
        }
    }

    function handleKeyPress(event) {
        const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
        if (arrowKeys.includes(event.key)) event.preventDefault();
        if (changingDirection || isGameOver) return;
        const keyPressed = event.key;
        const goingUp = direction === 'up', goingDown = direction === 'down', goingLeft = direction === 'left', goingRight = direction === 'right';
        if (keyPressed === 'ArrowUp' && !goingDown) { direction = 'up'; changingDirection = true; }
        if (keyPressed === 'ArrowDown' && !goingUp) { direction = 'down'; changingDirection = true; }
        if (keyPressed === 'ArrowLeft' && !goingRight) { direction = 'left'; changingDirection = true; }
        if (keyPressed === 'ArrowRight' && !goingLeft) { direction = 'right'; changingDirection = true; }
    }

    // --- NEW: Live Score Management with Firebase ---

    // This is the core "live" function. It listens for any changes in the leaderboard.
    function listenForScoreUpdates() {
        leaderboardCollection.orderBy('score', 'desc').limit(MAX_LEADERBOARD_ENTRIES)
            .onSnapshot((snapshot) => {
                const highScores = snapshot.docs.map(doc => doc.data());
                
                // Update the leaderboard UI whenever new data arrives
                leaderboardList.innerHTML = '';
                noScoresMessage.classList.toggle('hidden', highScores.length > 0);
                
                highScores.forEach(score => {
                    const li = document.createElement('li');
                    li.innerHTML = `<span class="leaderboard-name">${score.name}</span><span class="leaderboard-score">${score.score}</span>`;
                    leaderboardList.appendChild(li);
                });

                // Also update the personal best display from the live data
                updatePersonalBest(highScores);
            }, (error) => {
                console.error("Error listening for score updates: ", error);
            });
    }

    // Helper to update the "Personal Best" section from the latest leaderboard data
    function updatePersonalBest(highScores) {
        const savedName = localStorage.getItem('snakePlayerName'); // Name is still stored locally
        
        if (savedName) {
            playerNameDisplayElement.textContent = savedName;
            editNameButton.classList.remove('hidden');
            const playerEntry = highScores.find(entry => entry.name === savedName);
            personalBestScoreElement.textContent = playerEntry ? playerEntry.score : 0;
        } else {
            playerNameDisplayElement.textContent = 'Guest';
            personalBestScoreElement.textContent = '0';
            editNameButton.classList.add('hidden');
        }
        personalBestDisplay.classList.remove('hidden');
        editNameForm.classList.add('hidden');
    }

    // Writes a new score to the Firestore database
    async function updateScores(playerName, currentScore) {
        try {
            const querySnapshot = await leaderboardCollection.where('name', '==', playerName).limit(1).get();

            if (!querySnapshot.empty) { // If player exists
                const playerDoc = querySnapshot.docs[0];
                if (currentScore > playerDoc.data().score) {
                    await playerDoc.ref.update({ score: currentScore }); // Update only if score is higher
                }
            } else { // If new player
                await leaderboardCollection.add({
                    name: playerName,
                    score: currentScore,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error("Error updating scores: ", error);
        }
    }
    
    // --- Event Handlers ---
    async function handleNameSubmit(event) {
        event.preventDefault();
        const playerName = playerNameInput.value.trim();
        if (!playerName) return;
        localStorage.setItem('snakePlayerName', playerName);
        await updateScores(playerName, score); // Now async
        startGame();
    }

    function handleEditNameClick() {
        const currentName = localStorage.getItem('snakePlayerName');
        if (!currentName) return;
        editPlayerNameInput.value = currentName;
        personalBestDisplay.classList.add('hidden');
        editNameForm.classList.remove('hidden');
    }
    
    async function handleSaveName(event) {
        event.preventDefault();
        const oldName = localStorage.getItem('snakePlayerName');
        const newName = editPlayerNameInput.value.trim();

        if (newName && newName !== oldName) {
            localStorage.setItem('snakePlayerName', newName);
            
            // Find the old name in Firestore and update it to the new one
            const querySnapshot = await leaderboardCollection.where('name', '==', oldName).limit(1).get();
            if (!querySnapshot.empty) {
                const playerDoc = querySnapshot.docs[0];
                await playerDoc.ref.update({ name: newName });
            }
        }
        // The live listener will automatically update the display
        personalBestDisplay.classList.remove('hidden');
        editNameForm.classList.add('hidden');
    }

    function handleCancelEdit() {
        personalBestDisplay.classList.remove('hidden');
        editNameForm.classList.add('hidden');
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            gameContainer.requestFullscreen().catch(err => {
                alert(`Error: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // --- Initial Setup ---
    function init() {
        // Event Listeners
        document.addEventListener('keydown', handleKeyPress);
        scoreForm.addEventListener('submit', handleNameSubmit);
        playAgainButton.addEventListener('click', startGame);
        editNameButton.addEventListener('click', handleEditNameClick);
        editNameForm.addEventListener('submit', handleSaveName);
        cancelEditButton.addEventListener('click', handleCancelEdit);
        fullscreenButton.addEventListener('click', toggleFullscreen);
        
        // Resize Listeners
        window.addEventListener('resize', resizeCanvas);
        document.addEventListener('fullscreenchange', () => {
            const icon = fullscreenButton.querySelector('i');
            icon.classList.toggle('fa-expand', !document.fullscreenElement);
            icon.classList.toggle('fa-compress', !!document.fullscreenElement);
            setTimeout(resizeCanvas, 100);
        });

        // First-time setup
        resizeCanvas();
        listenForScoreUpdates(); // CRITICAL: Start listening for live leaderboard updates
        startGame();
    }

    init();
});
