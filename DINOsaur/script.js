const dino = document.querySelector('.dino');
const gameContainer = document.querySelector('.game-container');

let isJumping = false;
let isGameOver = false;
let isPaused = false;
let position = 20; // Initial ground position
const groundPosition = 20;
let velocity = 0;
const gravity = 1.0; // Increased from 0.6 for less floatiness
const jumpPower = 15; // Increased from 12 to compensate for higher gravity

// --- Audio System ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
let isMuted = false;

function playSound(type) {
  if (isMuted) return;
  if (audioCtx.state === 'suspended') audioCtx.resume();
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  const now = audioCtx.currentTime;
  
  if (type === 'jump') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'crash') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.start(now);
    osc.stop(now + 0.3);
  } else if (type === 'score') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(1200, now + 0.05);
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  }
}

function jump() {
  if (isJumping || isGameOver) return;
  
  isJumping = true;
  velocity = jumpPower;
  
  playSound('jump');
  createDust();
  
  requestAnimationFrame(applyPhysics);
}

function applyPhysics() {
  if (isGameOver) return;
  if (isPaused) {
    requestAnimationFrame(applyPhysics);
    return;
  }

  // Apply velocity to position
  position += velocity;
  
  // Calculate dynamic gravity for a less floaty, more responsive jump
  let currentGravity = gravity;
  
  // Slight deceleration (hang time) at the peak of the jump
  if (velocity > -3 && velocity < 3) {
    currentGravity = gravity * 0.6;
  } else if (velocity < 0) {
    // Fall faster to remove floatiness
    currentGravity = gravity * 1.2;
  }
  
  // Apply gravity to velocity
  velocity -= currentGravity;

  // Ground collision detection
  if (position <= groundPosition) {
    position = groundPosition;
    velocity = 0;
    isJumping = false;
    dino.style.bottom = position + 'px';
    return; // End animation loop
  }

  // Update DOM
  dino.style.bottom = position + 'px';
  
  // Request next frame
  requestAnimationFrame(applyPhysics);
}

// Mobile touch controls
document.addEventListener('touchstart', (event) => {
  if (!isGameStarted) {
    startGame();
    jump();
    return;
  }

  if (isGameOver) {
    restartGame();
    return;
  }

  jump();
});

document.addEventListener('keydown', (event) => {
  if (!isGameStarted) {
    startGame();
    if (event.code !== 'Space') return;
  }

  if (event.code === 'Space') {
    event.preventDefault();
    jump();
  }
  if (event.code === 'KeyR' || event.key.toLowerCase() === 'r') {
    restartGame();
  }
});

// --- Environment & Obstacles ---
function createDust() {
  const numParticles = 5;
  for (let i = 0; i < numParticles; i++) {
    const dust = document.createElement('div');
    dust.classList.add('dust');
    
    // Position near the dino's feet (dino left is 50px, width is ~44px)
    const startX = 50 + Math.random() * 30 + 5; 
    dust.style.left = startX + 'px';
    
    // Randomize movement direction using CSS variables
    const dx = (Math.random() - 0.5) * 40 + 'px'; // -20px to 20px horizontal
    const dy = (Math.random() * -20 - 5) + 'px'; // -5px to -25px vertical (upwards)
    
    dust.style.setProperty('--dx', dx);
    dust.style.setProperty('--dy', dy);
    
    gameContainer.appendChild(dust);
    
    // Cleanup after animation completes (400ms)
    setTimeout(() => {
      if (dust.parentNode) {
        dust.remove();
      }
    }, 400);
  }
}

function createImpactDust(x, y) {
  const numParticles = 15;
  for (let i = 0; i < numParticles; i++) {
    const dust = document.createElement('div');
    dust.classList.add('dust');
    
    dust.style.left = x + 'px';
    dust.style.bottom = y + 'px';
    
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 60 + 20;
    const dx = Math.cos(angle) * velocity + 'px';
    const dy = Math.sin(angle) * velocity + 'px';
    
    dust.style.setProperty('--dx', dx);
    dust.style.setProperty('--dy', dy);
    
    gameContainer.appendChild(dust);
    
    setTimeout(() => {
      if (dust.parentNode) {
        dust.remove();
      }
    }, 400);
  }
}

let cactus;
let cactusPosition = 600;
let gameSpeed = 5;
let isCactusActive = false;

let bird;
let birdPosition = 800;
let isBirdActive = false;

function initCactus() {
  // Create the single cactus element dynamically (since it was removed from HTML earlier)
  cactus = document.createElement('div');
  cactus.classList.add('cactus');
  
  // Assign a random variant
  const variants = ['cactus-variant-1', 'cactus-variant-2', 'cactus-variant-3'];
  cactus.classList.add(variants[Math.floor(Math.random() * variants.length)]);
  
  cactus.innerHTML = `
    <div class="cactus-main"></div>
    <div class="cactus-branch-left"></div>
    <div class="cactus-branch-left-up"></div>
    <div class="cactus-branch-right"></div>
    <div class="cactus-branch-right-up"></div>
  `;
  cactus.style.left = cactusPosition + 'px';
  gameContainer.appendChild(cactus);
  
  resetCactus();
  requestAnimationFrame(moveCactus);
}

function resetCactus() {
  isCactusActive = false;
  cactus.style.display = 'none';
  cactusPosition = 600; // Reset back to right
  
  // Randomize variant for visual diversity on each spawn
  cactus.classList.remove('cactus-variant-1', 'cactus-variant-2', 'cactus-variant-3');
  const variants = ['cactus-variant-1', 'cactus-variant-2', 'cactus-variant-3'];
  cactus.classList.add(variants[Math.floor(Math.random() * variants.length)]);
  
  // Randomize spawn timing, decreasing as gameSpeed and score increases to maintain challenge
  let baseRandomTime = Math.random() * 1500 + 500;
  // Add an extra score-based multiplier to make spawn rates increase more noticeably
  let scoreMultiplier = Math.max(0.4, 1 - (score / 3000));
  let randomTime = Math.max(350, baseRandomTime * (baseSpeed / gameSpeed) * scoreMultiplier);
  
  setTimeout(() => {
    if (isGameOver) return;
    
    // Vary the animation speed slightly for each new cactus
    cactus.style.animationDuration = (Math.random() * 1.5 + 1.5) + 's';
    
    cactus.style.display = 'block';
    isCactusActive = true;
  }, randomTime);
}

function checkCollision() {
  if (!cactus || !isCactusActive) return false;
  
  // Detect overlap between dino and cactus using bounding boxes
  const dinoRect = dino.getBoundingClientRect();
  const cactusRect = cactus.getBoundingClientRect();
  
  // Shrink hitboxes slightly for a more forgiving and fair game
  const paddingX = 8;
  const paddingY = 8;
  
  return (
    dinoRect.right - paddingX > cactusRect.left + paddingX &&
    dinoRect.left + paddingX < cactusRect.right - paddingX &&
    dinoRect.bottom - paddingY > cactusRect.top + paddingY &&
    dinoRect.top + paddingY < cactusRect.bottom - paddingY
  );
}

function moveCactus() {
  if (isGameOver) return;

  if (isCactusActive && !isPaused) {
    // Move cactus from right to left
    cactusPosition -= gameSpeed;
    cactus.style.left = cactusPosition + 'px';
    
    // Collision detection using getBoundingClientRect
    if (checkCollision()) {
      createImpactDust(90, position + 20);
      gameOver();
      return;
    }
    
    // When cactus goes off screen (left side), reset it back to right
    if (cactusPosition < -40) {
      resetCactus();
    }
  }
  
  requestAnimationFrame(moveCactus);
}

function initBird() {
  bird = document.createElement('div');
  bird.classList.add('bird');
  bird.innerHTML = `
    <div class="bird-head"></div>
    <div class="bird-beak"></div>
    <div class="bird-eye"></div>
    <div class="bird-body-main"></div>
    <div class="bird-tail"></div>
    <div class="bird-wing"></div>
  `;
  bird.style.left = birdPosition + 'px';
  gameContainer.appendChild(bird);
  
  resetBird();
  requestAnimationFrame(moveBird);
}

function resetBird() {
  isBirdActive = false;
  if (bird) bird.style.display = 'none';
  birdPosition = 800;
  
  // Decrease spawn time as gameSpeed and score increases
  let baseRandomTime = Math.random() * 3000 + 1500;
  let scoreMultiplier = Math.max(0.5, 1 - (score / 3000));
  let randomTime = Math.max(800, baseRandomTime * (baseSpeed / gameSpeed) * scoreMultiplier);
  
  setTimeout(() => {
    if (isGameOver) return;
    
    // Only spawn bird if score > 300 and cactus is far enough away
    if (score > 300 && (!isCactusActive || cactusPosition < 400 || cactusPosition > 800)) {
      const heights = [20, 45, 75]; // low, mid, high
      bird.style.bottom = heights[Math.floor(Math.random() * heights.length)] + 'px';
      
      const wing = bird.querySelector('.bird-wing');
      if (wing) wing.style.animationDuration = (Math.random() * 0.2 + 0.3) + 's';
      
      bird.style.display = 'block';
      isBirdActive = true;
    } else {
      resetBird(); // Try again later
    }
  }, randomTime);
}

function checkBirdCollision() {
  if (!bird || !isBirdActive) return false;
  
  const dinoRect = dino.getBoundingClientRect();
  const birdRect = bird.getBoundingClientRect();
  
  const paddingX = 8;
  const paddingY = 8;
  
  return (
    dinoRect.right - paddingX > birdRect.left + paddingX &&
    dinoRect.left + paddingX < birdRect.right - paddingX &&
    dinoRect.bottom - paddingY > birdRect.top + paddingY &&
    dinoRect.top + paddingY < birdRect.bottom - paddingY
  );
}

function moveBird() {
  if (isGameOver) return;

  if (isBirdActive && !isPaused) {
    // Birds fly slightly faster than the ground speed
    birdPosition -= (gameSpeed * 1.15);
    bird.style.left = birdPosition + 'px';
    
    if (checkBirdCollision()) {
      createImpactDust(90, position + 24);
      gameOver();
      return;
    }
    
    if (birdPosition < -50) {
      resetBird();
    }
  }
  
  requestAnimationFrame(moveBird);
}

function gameOver() {
  isGameOver = true;
  playSound('crash');
  
  // Pause CSS animations
  dino.style.animationPlayState = 'paused';
  const leftLeg = document.querySelector('.left-leg');
  const rightLeg = document.querySelector('.right-leg');
  const tail1 = document.querySelector('.dino-tail-1');
  const tail2 = document.querySelector('.dino-tail-2');
  if (leftLeg) leftLeg.style.animationPlayState = 'paused';
  if (rightLeg) rightLeg.style.animationPlayState = 'paused';
  if (tail1) tail1.style.animationPlayState = 'paused';
  if (tail2) tail2.style.animationPlayState = 'paused';
  document.querySelector('.ground').style.animationPlayState = 'paused';
  const groundNoise = document.querySelector('.ground-noise');
  if (groundNoise) groundNoise.style.animationPlayState = 'paused';
  document.querySelectorAll('.cloud').forEach(c => c.style.animationPlayState = 'paused');
  if (cactus) cactus.style.animationPlayState = 'paused';
  if (bird) {
    const wing = bird.querySelector('.bird-wing');
    if (wing) wing.style.animationPlayState = 'paused';
  }
  
  const restartBtn = document.querySelector('.restart-btn');
  if (restartBtn) restartBtn.style.display = 'block';
  
  const gameOverText = document.getElementById('game-over-text');
  if (gameOverText) gameOverText.style.display = 'block';
  
  gameContainer.classList.add('game-over-anim');

  // Update high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('dinoHighScore', highScore);
    highScoreElement.innerText = `HI ${Math.floor(highScore).toString().padStart(5, '0')}`;
  }
}

// --- Score & Difficulty ---
const scoreElement = document.querySelector('.score');
const highScoreElement = document.querySelector('.high-score');
let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
const baseSpeed = 5;
let lastScoreMilestone = 0;

// Initialize high score display
highScoreElement.innerText = `HI ${Math.floor(highScore).toString().padStart(5, '0')}`;

function updateScoreAndDifficulty() {
  if (isGameOver) return;

  if (!isPaused) {
    // Increase score over time
    score += 0.1;
    
    // Format score to 5 digits
    scoreElement.innerText = Math.floor(score).toString().padStart(5, '0');

    // Play score sound every 100 points
    const currentScoreFloor = Math.floor(score);
    if (currentScoreFloor > 0 && currentScoreFloor % 100 === 0 && currentScoreFloor !== lastScoreMilestone) {
      lastScoreMilestone = currentScoreFloor;
      playSound('score');
    }

    // Gradually increase game speed as score increases (smooth progression, capped at max speed)
    // Increased scaling factor for a more noticeable progressive difficulty
    gameSpeed = Math.min(baseSpeed + (score * 0.012), 18);
  }

  requestAnimationFrame(updateScoreAndDifficulty);
}

function restartGame() {
  if (!isGameOver) return;
  
  // Reset state variables
  isGameOver = false;
  isPaused = false;
  score = 0;
  lastScoreMilestone = 0;
  gameSpeed = baseSpeed;
  position = groundPosition;
  velocity = 0;
  isJumping = false;
  
  // Reset Dino DOM
  dino.style.bottom = position + 'px';
  
  // Resume CSS animations
  dino.style.animationPlayState = 'running';
  const leftLeg = document.querySelector('.left-leg');
  const rightLeg = document.querySelector('.right-leg');
  const tail1 = document.querySelector('.dino-tail-1');
  const tail2 = document.querySelector('.dino-tail-2');
  if (leftLeg) leftLeg.style.animationPlayState = 'running';
  if (rightLeg) rightLeg.style.animationPlayState = 'running';
  if (tail1) tail1.style.animationPlayState = 'running';
  if (tail2) tail2.style.animationPlayState = 'running';
  document.querySelector('.ground').style.animationPlayState = 'running';
  const groundNoise = document.querySelector('.ground-noise');
  if (groundNoise) groundNoise.style.animationPlayState = 'running';
  document.querySelectorAll('.cloud').forEach(c => c.style.animationPlayState = 'running');
  if (cactus) cactus.style.animationPlayState = 'running';
  if (bird) {
    const wing = bird.querySelector('.bird-wing');
    if (wing) wing.style.animationPlayState = 'running';
  }
  
  const restartBtn = document.querySelector('.restart-btn');
  if (restartBtn) restartBtn.style.display = 'none';
  
  const gameOverText = document.getElementById('game-over-text');
  if (gameOverText) gameOverText.style.display = 'none';
  
  gameContainer.classList.remove('game-over-anim');
  
  const pauseBtn = document.querySelector('.pause-btn');
  if (pauseBtn) pauseBtn.innerText = 'PAUSE';
  
  // Reset Cactus
  resetCactus();
  
  // Reset Bird
  if (bird) resetBird();
  
  // Restart loops
  requestAnimationFrame(moveCactus);
  if (bird) requestAnimationFrame(moveBird);
  requestAnimationFrame(updateScoreAndDifficulty);
}

// --- Start Screen & Initialization ---
let isGameStarted = false;

const startScreen = document.createElement('div');
startScreen.classList.add('start-screen');
startScreen.innerText = 'Press Any Key to Start';
gameContainer.appendChild(startScreen);

const tutorialOverlay = document.createElement('div');
tutorialOverlay.classList.add('tutorial-overlay');
tutorialOverlay.innerHTML = `
  <p><strong>Controls:</strong></p>
  <ul>
    <li><strong>Jump:</strong> Spacebar / Tap</li>
    <li><strong>Restart:</strong> 'R' / Restart Button</li>
    <li><strong>Pause:</strong> Pause Button</li>
    <li><strong>Dark Mode:</strong> Toggle Button</li>
    <li><strong>Mute:</strong> Toggle Button</li>
    <li><strong>Reset HI:</strong> Reset HI Button</li>
    <li><strong>Exit:</strong> Opens Exit Menu</li>
    <li><em>(Mobile) Drag JUMP button to move it</em></li>
  </ul>
`;
gameContainer.appendChild(tutorialOverlay);

const exitOverlay = document.createElement('div');
exitOverlay.classList.add('exit-overlay');
exitOverlay.innerHTML = `
  <h2>YOU HAVE EXITED</h2>
  <div class="exit-buttons">
    <button class="pixel-btn exit-action-btn" id="back-to-game-btn">BACK TO GAME</button>
    <button class="pixel-btn exit-action-btn" id="exit-forever-btn">EXIT FOREVER</button>
  </div>
`;
gameContainer.appendChild(exitOverlay);

let wasPausedByExit = false;

const backToGameBtn = exitOverlay.querySelector('#back-to-game-btn');
const exitForeverBtn = exitOverlay.querySelector('#exit-forever-btn');

const resumeFromExit = (e) => {
  e.stopPropagation();
  exitOverlay.style.display = 'none';
  if (wasPausedByExit) {
    togglePause();
    wasPausedByExit = false;
  }
};

const executeExitForever = (e) => {
  e.stopPropagation();
  window.close();
  window.location.href = 'about:blank';
};

backToGameBtn.addEventListener('click', resumeFromExit);
backToGameBtn.addEventListener('touchstart', resumeFromExit);

exitForeverBtn.addEventListener('click', executeExitForever);
exitForeverBtn.addEventListener('touchstart', executeExitForever);

// Pause initial animations
dino.style.animationPlayState = 'paused';
const initialLeftLeg = document.querySelector('.left-leg');
const initialRightLeg = document.querySelector('.right-leg');
const initialTail1 = document.querySelector('.dino-tail-1');
const initialTail2 = document.querySelector('.dino-tail-2');
if (initialLeftLeg) initialLeftLeg.style.animationPlayState = 'paused';
if (initialRightLeg) initialRightLeg.style.animationPlayState = 'paused';
if (initialTail1) initialTail1.style.animationPlayState = 'paused';
if (initialTail2) initialTail2.style.animationPlayState = 'paused';
document.querySelector('.ground').style.animationPlayState = 'paused';
const initialGroundNoise = document.querySelector('.ground-noise');
if (initialGroundNoise) initialGroundNoise.style.animationPlayState = 'paused';
document.querySelectorAll('.cloud').forEach(c => c.style.animationPlayState = 'paused');

function startGame() {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  isGameStarted = true;
  startScreen.style.display = 'none';
  tutorialOverlay.style.display = 'none';
  
  // Resume animations
  dino.style.animationPlayState = 'running';
  if (initialLeftLeg) initialLeftLeg.style.animationPlayState = 'running';
  if (initialRightLeg) initialRightLeg.style.animationPlayState = 'running';
  if (initialTail1) initialTail1.style.animationPlayState = 'running';
  if (initialTail2) initialTail2.style.animationPlayState = 'running';
  document.querySelector('.ground').style.animationPlayState = 'running';
  const groundNoise = document.querySelector('.ground-noise');
  if (groundNoise) groundNoise.style.animationPlayState = 'running';
  document.querySelectorAll('.cloud').forEach(c => c.style.animationPlayState = 'running');
  
  // Start obstacle system and game loops
  initCactus();
  initBird();
  requestAnimationFrame(updateScoreAndDifficulty);
}

// --- Background & Details ---
function initEnvironment() {
  // Add ground noise (pebbles/dirt)
  const groundNoise = document.createElement('div');
  groundNoise.classList.add('ground-noise');
  gameContainer.appendChild(groundNoise);

  // Add clouds for parallax effect
  for (let i = 0; i < 3; i++) {
    const cloud = document.createElement('div');
    cloud.classList.add('cloud');
    cloud.style.top = (Math.random() * 60 + 20) + 'px';
    // Slow, random durations for parallax
    cloud.style.animationDuration = (Math.random() * 15 + 20) + 's';
    // Negative delay so they are already on screen when game loads
    cloud.style.animationDelay = (Math.random() * -20) + 's';
    gameContainer.appendChild(cloud);
}
}
initEnvironment();
initButtons();

// --- UI Buttons ---
function initButtons() {
  const controlsContainer = document.querySelector('.controls');

  // Jump Button
  const jumpBtn = document.createElement('button');
  jumpBtn.classList.add('pixel-btn', 'jump-btn');
  jumpBtn.innerText = 'JUMP';
  controlsContainer.appendChild(jumpBtn);

  let isDragging = false;
  let startX, startY, initialLeft, initialTop;

  jumpBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isDragging = false;
    
    const rect = jumpBtn.getBoundingClientRect();
    if (jumpBtn.style.position !== 'fixed') {
      jumpBtn.style.position = 'fixed';
      jumpBtn.style.left = rect.left + 'px';
      jumpBtn.style.top = rect.top + 'px';
      jumpBtn.style.margin = '0';
      jumpBtn.style.zIndex = '1000';
    }
    
    initialLeft = parseFloat(jumpBtn.style.left);
    initialTop = parseFloat(jumpBtn.style.top);
  }, { passive: false });

  jumpBtn.addEventListener('touchmove', (e) => {
    e.stopPropagation();
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - startX;
    const dy = touch.clientY - startY;
    
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      isDragging = true;
    }
    
    if (isDragging) {
      jumpBtn.style.left = (initialLeft + dx) + 'px';
      jumpBtn.style.top = (initialTop + dy) + 'px';
    }
  }, { passive: false });

  jumpBtn.addEventListener('touchend', (e) => {
    e.stopPropagation();
    if (!isDragging) {
      if (!isGameStarted) startGame();
      jump();
    }
    isDragging = false;
  });

  jumpBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!isDragging) {
      if (!isGameStarted) startGame();
      jump();
    }
  });

  // Pause Button
  const pauseBtn = document.createElement('button');
  pauseBtn.classList.add('pixel-btn', 'pause-btn');
  pauseBtn.innerText = 'PAUSE';
  controlsContainer.appendChild(pauseBtn);

  pauseBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent triggering jump
    togglePause();
  });
  
  // Prevent touchstart from bubbling up to document and triggering jump
  pauseBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation();
  });

  // Dark Mode Button
  const darkModeBtn = document.createElement('button');
  darkModeBtn.classList.add('pixel-btn', 'dark-mode-btn');
  darkModeBtn.innerText = 'DARK MODE';
  controlsContainer.appendChild(darkModeBtn);

  darkModeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    document.body.classList.toggle('dark-mode');
  });
  
  darkModeBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    document.body.classList.toggle('dark-mode');
  });

  // Mute Button
  const muteBtn = document.createElement('button');
  muteBtn.classList.add('pixel-btn', 'mute-btn');
  muteBtn.innerText = 'MUTE';
  controlsContainer.appendChild(muteBtn);

  muteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isMuted = !isMuted;
    muteBtn.innerText = isMuted ? 'UNMUTE' : 'MUTE';
  });
  
  muteBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    isMuted = !isMuted;
    muteBtn.innerText = isMuted ? 'UNMUTE' : 'MUTE';
  });

  // Reset High Score Button
  const resetHiBtn = document.createElement('button');
  resetHiBtn.classList.add('pixel-btn', 'reset-hi-btn');
  resetHiBtn.innerText = 'RESET HI';
  controlsContainer.appendChild(resetHiBtn);

  const resetHighScore = () => {
    localStorage.removeItem('dinoHighScore');
    highScore = 0;
    const highScoreElement = document.querySelector('.high-score');
    if (highScoreElement) {
      highScoreElement.innerText = `HI 00000`;
    }
  };

  resetHiBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetHighScore();
  });

  resetHiBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    resetHighScore();
  });

  // Exit Button
  const exitBtn = document.createElement('button');
  exitBtn.classList.add('pixel-btn', 'exit-btn');
  exitBtn.innerText = 'EXIT';
  controlsContainer.appendChild(exitBtn);

  const exitGame = () => {
    exitOverlay.style.display = 'flex';
    if (!isPaused && isGameStarted && !isGameOver) {
      togglePause();
      wasPausedByExit = true;
    }
  };

  exitBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exitGame();
  });

  exitBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation();
    exitGame();
  });

  // Restart Button (Now in HTML)
  const restartBtn = document.querySelector('.restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      restartGame();
    });
    
    restartBtn.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      restartGame();
    });
  }
}

function togglePause() {
  if (isGameOver || !isGameStarted) return;
  isPaused = !isPaused;
  
  const playState = isPaused ? 'paused' : 'running';
  
  dino.style.animationPlayState = playState;
  const leftLeg = document.querySelector('.left-leg');
  const rightLeg = document.querySelector('.right-leg');
  const tail1 = document.querySelector('.dino-tail-1');
  const tail2 = document.querySelector('.dino-tail-2');
  if (leftLeg) leftLeg.style.animationPlayState = playState;
  if (rightLeg) rightLeg.style.animationPlayState = playState;
  if (tail1) tail1.style.animationPlayState = playState;
  if (tail2) tail2.style.animationPlayState = playState;
  document.querySelector('.ground').style.animationPlayState = playState;
  const groundNoise = document.querySelector('.ground-noise');
  if (groundNoise) groundNoise.style.animationPlayState = playState;
  document.querySelectorAll('.cloud').forEach(c => c.style.animationPlayState = playState);
  if (cactus) cactus.style.animationPlayState = playState;
  if (bird) {
    const wing = bird.querySelector('.bird-wing');
    if (wing) wing.style.animationPlayState = playState;
  }
  
  const pauseBtn = document.querySelector('.pause-btn');
  if (pauseBtn) pauseBtn.innerText = isPaused ? 'RESUME' : 'PAUSE';
}
