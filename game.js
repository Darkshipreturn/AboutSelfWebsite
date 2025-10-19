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
    
    // --- MODIFICATION: Resolution-Independent Game Constants ---
    const TILE_COUNT = 20; // The game board is always 20x20 tiles
    const MAX_LEADERBOARD_ENTRIES = 10;
    let tileSize; // This will be calculated dynamically based on canvas size

    // --- Game State Variables ---
    let snake, food, direction, score, isGameOver, changingDirection, gameInterval;

    // --- NEW: Canvas Resize Function ---
    function resizeCanvas() {
        // Get the actual size the canvas is being displayed at
        const size = gameContainer.getBoundingClientRect().width;
        
        // Set the canvas drawing surface to a high resolution
        // This is the key to fixing pixelation
        canvas.width = size;
        canvas.height = size;

        // Recalculate the size of each tile
        tileSize = canvas.width / TILE_COUNT;
    }

    // --- Core Game Loop & Logic ---
    function startGame() { snake = [{ x: 10, y: 10 }]; direction = 'right'; score = 0; isGameOver = false; changingDirection = false; scoreElement.textContent = score; gameOverScreen.classList.add('hidden'); if (gameInterval) clearInterval(gameInterval); generateFood(); gameInterval = setInterval(updateGame, 100); }
    function updateGame() { if (isGameOver) return; changingDirection = false; clearCanvas(); drawFood(); moveSnake(); drawSnake(); checkCollision(); }
    function gameOver() { isGameOver = true; clearInterval(gameInterval); finalScoreElement.textContent = score; const savedName = localStorage.getItem('snakePlayerName'); if (savedName) { updateScores(savedName, score); scoreForm.classList.add('hidden'); playAgainButton.classList.remove('hidden'); } else { scoreForm.classList.remove('hidden'); playAgainButton.classList.add('hidden'); playerNameInput.focus(); } gameOverScreen.classList.remove('hidden'); }
    
    // --- MODIFIED: Drawing functions now use dynamic `tileSize` ---
    function clearCanvas() { ctx.fillStyle = 'rgba(15, 23, 42, 0.5)'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    function drawSnake() { const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary-color').trim(); ctx.fillStyle = primaryColor; snake.forEach(part => { ctx.fillRect(part.x * tileSize, part.y * tileSize, tileSize, tileSize); }); }
    function drawFood() { ctx.fillStyle = '#f87171'; ctx.fillRect(food.x * tileSize, food.y * tileSize, tileSize, tileSize); }
    function moveSnake() { const head = { x: snake[0].x, y: snake[0].y }; switch (direction) { case 'up': head.y -= 1; break; case 'down': head.y += 1; break; case 'left': head.x -= 1; break; case 'right': head.x += 1; break; } snake.unshift(head); if (head.x === food.x && head.y === food.y) { score++; scoreElement.textContent = score; generateFood(); } else { snake.pop(); } }
    
    // --- MODIFIED: Logic now uses `TILE_COUNT` ---
    function generateFood() { food = { x: Math.floor(Math.random() * TILE_COUNT), y: Math.floor(Math.random() * TILE_COUNT) }; if (snake.some(part => part.x === food.x && part.y === food.y)) { generateFood(); } }
    function checkCollision() { const head = snake[0]; if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT || snake.slice(1).some(part => part.x === head.x && part.y === head.y)) { gameOver(); } }
    
    function handleKeyPress(event) { const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']; if (arrowKeys.includes(event.key)) event.preventDefault(); if (changingDirection || isGameOver) return; const keyPressed = event.key; const goingUp = direction === 'up', goingDown = direction === 'down', goingLeft = direction === 'left', goingRight = direction === 'right'; if (keyPressed === 'ArrowUp' && !goingDown) { direction = 'up'; changingDirection = true; } if (keyPressed === 'ArrowDown' && !goingUp) { direction = 'down'; changingDirection = true; } if (keyPressed === 'ArrowLeft' && !goingRight) { direction = 'left'; changingDirection = true; } if (keyPressed === 'ArrowRight' && !goingLeft) { direction = 'right'; changingDirection = true; } }
    
    // --- Score Management (No changes needed here) ---
    function loadHighScores() { return JSON.parse(localStorage.getItem('snakeHighScores')) || []; }
    function saveHighScores(scores) { localStorage.setItem('snakeHighScores', JSON.stringify(scores)); }
    function displayScores() { const highScores = loadHighScores(); const savedName = localStorage.getItem('snakePlayerName'); leaderboardList.innerHTML = ''; noScoresMessage.classList.toggle('hidden', highScores.length > 0); highScores.forEach(score => { const li = document.createElement('li'); li.innerHTML = `<span class="leaderboard-name">${score.name}</span><span class="leaderboard-score">${score.score}</span>`; leaderboardList.appendChild(li); }); const playerEntry = highScores.find(entry => entry.name === savedName); personalBestScoreElement.textContent = playerEntry ? playerEntry.score : 0; if (savedName) { playerNameDisplayElement.textContent = savedName; editNameButton.classList.remove('hidden'); } else { playerNameDisplayElement.textContent = 'Guest'; editNameButton.classList.add('hidden'); } personalBestDisplay.classList.remove('hidden'); editNameForm.classList.add('hidden'); }
    function updateScores(playerName, currentScore) { let highScores = loadHighScores(); const playerIndex = highScores.findIndex(entry => entry.name === playerName); if (playerIndex > -1) { if (currentScore > highScores[playerIndex].score) highScores[playerIndex].score = currentScore; } else { highScores.push({ name: playerName, score: currentScore }); } highScores.sort((a, b) => b.score - a.score); saveHighScores(highScores.slice(0, MAX_LEADERBOARD_ENTRIES)); displayScores(); }
    
    // --- Event Handlers (No changes needed here) ---
    function handleNameSubmit(event) { event.preventDefault(); const playerName = playerNameInput.value.trim(); if (!playerName) return; localStorage.setItem('snakePlayerName', playerName); updateScores(playerName, score); startGame(); }
    function handleEditNameClick() { const currentName = localStorage.getItem('snakePlayerName'); if (!currentName) return; editPlayerNameInput.value = currentName; personalBestDisplay.classList.add('hidden'); editNameForm.classList.remove('hidden'); }
    function handleSaveName(event) { event.preventDefault(); const oldName = localStorage.getItem('snakePlayerName'); const newName = editPlayerNameInput.value.trim(); if (newName && newName !== oldName) { localStorage.setItem('snakePlayerName', newName); let highScores = loadHighScores(); const playerIndex = highScores.findIndex(entry => entry.name === oldName); if (playerIndex > -1) { highScores[playerIndex].name = newName; saveHighScores(highScores); } } displayScores(); }
    function handleCancelEdit() { personalBestDisplay.classList.remove('hidden'); editNameForm.classList.add('hidden'); }
    function toggleFullscreen() { if (!document.fullscreenElement) { gameContainer.requestFullscreen().catch(err => { alert(`Error: ${err.message}`); }); } else { document.exitFullscreen(); } }

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
        
        // --- NEW: Resize Listeners ---
        window.addEventListener('resize', resizeCanvas);
        document.addEventListener('fullscreenchange', () => {
            const icon = fullscreenButton.querySelector('i');
            icon.classList.toggle('fa-expand', !document.fullscreenElement);
            icon.classList.toggle('fa-compress', !!document.fullscreenElement);
            // We need a slight delay for the browser to report the new size
            setTimeout(resizeCanvas, 100);
        });

        // First-time setup
        resizeCanvas();
        displayScores();
        startGame();
    }

    init();
});
