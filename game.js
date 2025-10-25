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
    const pauseButton = document.getElementById('pauseButton');
    const pauseOverlay = document.getElementById('pauseOverlay');
    const countdownNumber = document.getElementById('countdownNumber');
    const countdownText = document.getElementById('countdownText');
    const mobileControls = document.getElementById('mobileControls');
    const highScoreMessage = document.getElementById('highScoreMessage');
    const highScoreIndicator = document.getElementById('highScoreIndicator');
    const currentHighScoreElement = document.getElementById('currentHighScore');
    const howToPlayButton = document.getElementById('howToPlayButton');
    const howToPlayModal = document.getElementById('howToPlayModal');
    const closeModalButton = document.getElementById('closeModalButton');
    const startGameButton = document.getElementById('startGameButton');

    // --- Firebase & Game Constants ---
    const db = firebase.firestore();
    const leaderboardCollection = db.collection('leaderboard');
    const TILE_COUNT = 20;
    const MAX_LEADERBOARD_ENTRIES = 10;
    const INITIAL_SPEED = 100;
    const MIN_SPEED = 50;
    const SPEED_INCREASE_INTERVAL = 5;
    let tileSize;
    let currentSpeed = INITIAL_SPEED;
    let personalBest = 0;

    // --- Game State Variables ---
    let snake, food, direction, score, isGameOver, changingDirection, gameInterval, isPaused;
    let touchStartX = 0, touchStartY = 0;
    let foodAnimationFrame = 0;

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
        isPaused = false;
        currentSpeed = INITIAL_SPEED;
        scoreElement.textContent = score;
        gameOverScreen.classList.add('hidden');
        pauseOverlay.classList.add('hidden');
        highScoreMessage.classList.add('hidden');
        
        // Reset countdown display
        countdownNumber.textContent = 'PAUSED';
        countdownText.textContent = 'Press Space to Resume';
        
        if (gameInterval) clearInterval(gameInterval);
        generateFood();
        gameInterval = setInterval(updateGame, currentSpeed);
        updateHighScoreDisplay();
    }

    function updateGame() {
        if (isGameOver || isPaused) return;
        changingDirection = false;
        foodAnimationFrame++;
        clearCanvas();
        drawFood();
        moveSnake();
        drawSnake();
        checkCollision();
    }

    function togglePause() {
        if (isGameOver) return;
        
        if (isPaused) {
            // Unpausing - show countdown
            showCountdown();
        } else {
            // Pausing
            isPaused = true;
            pauseOverlay.classList.remove('hidden');
            updatePauseButtonIcons(true);
        }
    }

    function showCountdown() {
        let count = 3;
        countdownText.textContent = 'Get Ready...';
        countdownNumber.textContent = count;
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownNumber.textContent = count;
            } else {
                clearInterval(countdownInterval);
                isPaused = false;
                pauseOverlay.classList.add('hidden');
                updatePauseButtonIcons(false);
                // Reset overlay text for next pause
                countdownNumber.textContent = 'PAUSED';
                countdownText.textContent = 'Press Space to Resume';
            }
        }, 1000);
    }

    function updatePauseButtonIcons(paused) {
        const pauseIcon = pauseButton.querySelector('i');
        if (pauseIcon) {
            pauseIcon.classList.toggle('fa-pause', !paused);
            pauseIcon.classList.toggle('fa-play', paused);
        }
        const mobilePauseBtn = document.querySelector('[data-direction="pause"] i');
        if (mobilePauseBtn) {
            mobilePauseBtn.classList.toggle('fa-pause', !paused);
            mobilePauseBtn.classList.toggle('fa-play', paused);
        }
    }

    function gameOver() {
        isGameOver = true;
        clearInterval(gameInterval);
        
        // Flash effect
        canvas.style.filter = 'brightness(0.5)';
        setTimeout(() => canvas.style.filter = 'brightness(1)', 200);
        
        finalScoreElement.textContent = score;
        
        // Check if new high score
        if (score > personalBest) {
            highScoreMessage.classList.remove('hidden');
        }
        
        const savedName = localStorage.getItem('snakePlayerName');
        if (savedName) {
            updateScores(savedName, score);
            scoreForm.classList.add('hidden');
            playAgainButton.classList.remove('hidden');
        } else {
            scoreForm.classList.remove('hidden');
            playAgainButton.classList.add('hidden');
            playerNameInput.focus();
        }
        gameOverScreen.classList.remove('hidden');
    }

    function updateHighScoreDisplay() {
        if (personalBest > 0) {
            highScoreIndicator.classList.remove('hidden');
            currentHighScoreElement.textContent = personalBest;
        }
    }

    function updateGameSpeed() {
        if (score > 0 && score % SPEED_INCREASE_INTERVAL === 0) {
            currentSpeed = Math.max(MIN_SPEED, INITIAL_SPEED - (score * 2));
            clearInterval(gameInterval);
            gameInterval = setInterval(updateGame, currentSpeed);
        }
    }

    // --- Drawing Functions ---
    function clearCanvas() {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw subtle grid
        ctx.strokeStyle = 'rgba(71, 85, 105, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= TILE_COUNT; i++) {
            ctx.beginPath();
            ctx.moveTo(i * tileSize, 0);
            ctx.lineTo(i * tileSize, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * tileSize);
            ctx.lineTo(canvas.width, i * tileSize);
            ctx.stroke();
        }
    }

    function drawSnake() {
        const primaryColor = getComputedStyle(document.body).getPropertyValue('--primary-color').trim();
        snake.forEach((part, index) => {
            // Gradient effect for snake
            const alpha = 1 - (index / snake.length) * 0.5;
            ctx.fillStyle = primaryColor + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.fillRect(part.x * tileSize + 1, part.y * tileSize + 1, tileSize - 2, tileSize - 2);
            
            // Head indicator
            if (index === 0) {
                ctx.fillStyle = 'white';
                const eyeSize = tileSize / 8;
                const eyeOffset = tileSize / 4;
                ctx.fillRect(part.x * tileSize + eyeOffset, part.y * tileSize + eyeOffset, eyeSize, eyeSize);
                ctx.fillRect(part.x * tileSize + tileSize - eyeOffset - eyeSize, part.y * tileSize + eyeOffset, eyeSize, eyeSize);
            }
        });
    }

    function drawFood() {
        // Pulsing animation
        const pulse = Math.sin(foodAnimationFrame * 0.1) * 0.15 + 0.85;
        const size = tileSize * pulse;
        const offset = (tileSize - size) / 2;
        
        ctx.fillStyle = '#f87171';
        ctx.shadowColor = '#f87171';
        ctx.shadowBlur = 10 * pulse;
        ctx.fillRect(food.x * tileSize + offset, food.y * tileSize + offset, size, size);
        ctx.shadowBlur = 0;
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
            
            // Food collection effect
            canvas.style.filter = 'brightness(1.2)';
            setTimeout(() => canvas.style.filter = 'brightness(1)', 100);
            
            generateFood();
            updateGameSpeed();
        } else {
            snake.pop();
        }
    }

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
        if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT || 
            snake.slice(1).some(part => part.x === head.x && part.y === head.y)) {
            gameOver();
        }
    }

    function handleKeyPress(event) {
        const arrowKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
        if (arrowKeys.includes(event.key)) event.preventDefault();
        
        if (event.key === ' ') {
            togglePause();
            return;
        }
        
        if (changingDirection || isGameOver || isPaused) return;
        const keyPressed = event.key;
        const goingUp = direction === 'up', goingDown = direction === 'down', 
              goingLeft = direction === 'left', goingRight = direction === 'right';
        if (keyPressed === 'ArrowUp' && !goingDown) { direction = 'up'; changingDirection = true; }
        if (keyPressed === 'ArrowDown' && !goingUp) { direction = 'down'; changingDirection = true; }
        if (keyPressed === 'ArrowLeft' && !goingRight) { direction = 'left'; changingDirection = true; }
        if (keyPressed === 'ArrowRight' && !goingLeft) { direction = 'right'; changingDirection = true; }
    }

    // --- Touch Controls ---
    function handleTouchStart(event) {
        const touch = event.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
    }

    function handleTouchEnd(event) {
        if (isGameOver || isPaused) return;
        const touch = event.changedTouches[0];
        const touchEndX = touch.clientX;
        const touchEndY = touch.clientY;
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 30 && direction !== 'left') direction = 'right';
            else if (dx < -30 && direction !== 'right') direction = 'left';
        } else {
            if (dy > 30 && direction !== 'up') direction = 'down';
            else if (dy < -30 && direction !== 'down') direction = 'up';
        }
    }

    function handleControlButton(event) {
        const dir = event.currentTarget.dataset.direction;
        if (dir === 'pause') {
            togglePause();
            return;
        }
        if (isGameOver || isPaused) return;
        if (dir === 'up' && direction !== 'down') direction = 'up';
        if (dir === 'down' && direction !== 'up') direction = 'down';
        if (dir === 'left' && direction !== 'right') direction = 'left';
        if (dir === 'right' && direction !== 'left') direction = 'right';
    }

    // --- Firebase Functions ---
    function listenForScoreUpdates() {
        leaderboardCollection.orderBy('score', 'desc').limit(MAX_LEADERBOARD_ENTRIES)
            .onSnapshot((snapshot) => {
                const highScores = snapshot.docs.map(doc => doc.data());
                leaderboardList.innerHTML = '';
                noScoresMessage.classList.toggle('hidden', highScores.length > 0);
                
                const savedName = localStorage.getItem('snakePlayerName');
                
                highScores.forEach((scoreData, index) => {
                    const li = document.createElement('li');
                    const isCurrentPlayer = savedName && scoreData.name === savedName;
                    
                    if (isCurrentPlayer) {
                        li.classList.add('current-player-score');
                    }
                    
                    li.innerHTML = `<span class="leaderboard-name">${scoreData.name}</span><span class="leaderboard-score">${scoreData.score}</span>`;
                    leaderboardList.appendChild(li);
                });
                
                updatePersonalBest(highScores);
            }, (error) => {
                console.error("Error listening for score updates: ", error);
            });
    }

    function updatePersonalBest(highScores) {
        const savedName = localStorage.getItem('snakePlayerName');
        
        if (savedName) {
            playerNameDisplayElement.textContent = savedName;
            editNameButton.classList.remove('hidden');
            const playerEntry = highScores.find(entry => entry.name === savedName);
            personalBest = playerEntry ? playerEntry.score : 0;
            personalBestScoreElement.textContent = personalBest;
        } else {
            playerNameDisplayElement.textContent = 'Guest';
            personalBestScoreElement.textContent = '0';
            personalBest = 0;
            editNameButton.classList.add('hidden');
        }
        personalBestDisplay.classList.remove('hidden');
        editNameForm.classList.add('hidden');
    }

    async function updateScores(playerName, currentScore) {
        try {
            const querySnapshot = await leaderboardCollection.where('name', '==', playerName).limit(1).get();

            if (!querySnapshot.empty) {
                const playerDoc = querySnapshot.docs[0];
                if (currentScore > playerDoc.data().score) {
                    await playerDoc.ref.update({ score: currentScore });
                }
            } else {
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
        await updateScores(playerName, score);
        startGame();
    }

    function handleEditNameClick() {
        const currentName = localStorage.getItem('snakePlayerName');
        if (!currentName) return;
        editPlayerNameInput.value = currentName;
        personalBestDisplay.classList.add('hidden');
        editNameForm.classList.remove('hidden');
        editPlayerNameInput.focus();
    }
    
    async function handleSaveName(event) {
        event.preventDefault();
        const oldName = localStorage.getItem('snakePlayerName');
        const newName = editPlayerNameInput.value.trim();

        if (newName && newName !== oldName) {
            localStorage.setItem('snakePlayerName', newName);
            
            const querySnapshot = await leaderboardCollection.where('name', '==', oldName).limit(1).get();
            if (!querySnapshot.empty) {
                const playerDoc = querySnapshot.docs[0];
                await playerDoc.ref.update({ name: newName });
            }
        }
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

    function showModal() {
        howToPlayModal.classList.remove('hidden');
    }

    function hideModal() {
        howToPlayModal.classList.add('hidden');
    }

    // --- Initial Setup ---
    function init() {
        // Event Listeners
        document.addEventListener('keydown', handleKeyPress);
        canvas.addEventListener('touchstart', handleTouchStart);
        canvas.addEventListener('touchend', handleTouchEnd);
        scoreForm.addEventListener('submit', handleNameSubmit);
        playAgainButton.addEventListener('click', startGame);
        editNameButton.addEventListener('click', handleEditNameClick);
        editNameForm.addEventListener('submit', handleSaveName);
        cancelEditButton.addEventListener('click', handleCancelEdit);
        fullscreenButton.addEventListener('click', toggleFullscreen);
        pauseButton.addEventListener('click', togglePause);
        howToPlayButton.addEventListener('click', showModal);
        closeModalButton.addEventListener('click', hideModal);
        startGameButton.addEventListener('click', hideModal);
        
        // Mobile control buttons
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', handleControlButton);
        });
        
        // Modal close on outside click
        howToPlayModal.addEventListener('click', (e) => {
            if (e.target === howToPlayModal) hideModal();
        });
        
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
        listenForScoreUpdates();
        startGame();
    }

    init();
});
