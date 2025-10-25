/** @format */

const gameBoard = document.getElementById("gameBoard");
const context = gameBoard.getContext("2d");
const scoreText = document.getElementById("scoreVal");
const finalScoreText = document.getElementById("finalScoreVal");

// Popups and Controls
const startPopup = document.getElementById("start-popup");
const gameoverPopup = document.getElementById("gameover-popup");
const confirmPopup = document.getElementById("confirm-popup");
const confirmMessage = document.getElementById("confirm-message");

// Buttons
const startButton = document.getElementById("start-button");
const newGameButtonGameOver = document.getElementById("newgame-button");
const quitButtonGameOver = document.getElementById("quit-button");
const pauseButton = document.getElementById("pause-button");
const newGameSidebarButton = document.getElementById("new-game-button");
const quitAppButton = document.getElementById("quit-app-button");
const confirmYesButton = document.getElementById("confirm-yes-button");
const confirmNoButton = document.getElementById("confirm-no-button");

const WIDTH = gameBoard.width;
const HEIGHT = gameBoard.height;
const UNIT = 25;
const INITIAL_SNAKE = [
  { x: UNIT * 3, y: 0 },
  { x: UNIT * 2, y: 0 },
  { x: UNIT, y: 0 },
  { x: 0, y: 0 },
];

let foodX;
let foodY;
let xVel = UNIT;
let yVel = 0;
let score = 0;
let active = false;
let paused = false;
let gameLoopId;
let snake = [...INITIAL_SNAKE];
let pendingAction = null;

// --- Event Listeners ---
window.addEventListener("keydown", keyPress);

startButton.addEventListener("click", () => {
  startPopup.classList.remove("popup-active");
  startPopup.classList.add("popup-hidden");
  active = true;
  nextTick();
});

pauseButton.addEventListener("click", () => handlePause());
newGameSidebarButton.addEventListener("click", () =>
  showConfirmation("NEW_GAME")
);
quitAppButton.addEventListener("click", () => showConfirmation("QUIT_APP"));

newGameButtonGameOver.addEventListener("click", () => initGame(true));
quitButtonGameOver.addEventListener("click", () =>
  showConfirmation("QUIT_GAME_OVER")
);

confirmYesButton.addEventListener("click", handleConfirmationYes);
confirmNoButton.addEventListener("click", handleConfirmationNo);

// --- Game Initialization ---

function initGame(resetScore = false) {
  clearTimeout(gameLoopId);
  active = false;
  paused = false;

  snake = [...INITIAL_SNAKE];
  xVel = UNIT;
  yVel = 0;

  if (resetScore) {
    score = 0;
    scoreText.textContent = score;
  }

  gameoverPopup.classList.remove("popup-active");
  gameoverPopup.classList.add("popup-hidden");
  confirmPopup.classList.remove("popup-active");
  confirmPopup.classList.add("popup-hidden");

  if (!resetScore) {
    startPopup.classList.add("popup-active");
    startPopup.classList.remove("popup-hidden");
  } else {
    startPopup.classList.remove("popup-active");
    startPopup.classList.add("popup-hidden");
  }

  if (resetScore) {
    active = true;
    startGame();
    nextTick();
  } else {
    startGame();
  }
}

function startGame() {
  clearBoard();
  createFood();
  displayFood();
  drawSnake();
}

// --- Core Game Functions ---

function clearBoard() {
  context.fillStyle = "#E6D8B6";
  context.fillRect(0, 0, WIDTH, HEIGHT);
}

function isFoodOnSnake(x, y) {
  return snake.some((part) => part.x === x && part.y === y);
}

function createFood() {
  let newFoodX, newFoodY;
  do {
    newFoodX = Math.floor((Math.random() * WIDTH) / UNIT) * UNIT;
    newFoodY = Math.floor((Math.random() * HEIGHT) / UNIT) * UNIT;
  } while (isFoodOnSnake(newFoodX, newFoodY));

  foodX = newFoodX;
  foodY = newFoodY;
}

function displayFood() {
  context.fillStyle = "red";
  context.beginPath();
  context.arc(foodX + UNIT / 2, foodY + UNIT / 2, UNIT / 2 - 3, 0, 2 * Math.PI);
  context.fill();

  context.fillStyle = "brown";
  context.fillRect(foodX + UNIT / 2 - 2, foodY, 4, 5);
}

function drawSnake() {
  context.strokeStyle = "#212121";

  snake.forEach((snakePart, index) => {
    context.fillStyle = index === 0 ? "#7CFC00" : "#32CD32";

    context.fillRect(snakePart.x, snakePart.y, UNIT, UNIT);
    context.strokeRect(snakePart.x, snakePart.y, UNIT, UNIT);

    if (index === 0) {
      drawSnakeHead(snakePart.x, snakePart.y, xVel, yVel);
    }
  });
}

function drawSnakeHead(x, y, velX, velY) {
  const halfUnit = UNIT / 2;
  const thirdUnit = UNIT / 3;

  context.fillStyle = "white";
  context.beginPath();

  let eyeOffsetX1, eyeOffsetX2, eyeOffsetY1, eyeOffsetY2;
  let pupilOffsetX, pupilOffsetY;

  if (velY === -UNIT) {
    // UP
    eyeOffsetX1 = halfUnit - 5;
    eyeOffsetX2 = halfUnit + 5;
    eyeOffsetY1 = thirdUnit;
    eyeOffsetY2 = thirdUnit;
    pupilOffsetX = 0;
    pupilOffsetY = -2;
  } else if (velY === UNIT) {
    // DOWN
    eyeOffsetX1 = halfUnit - 5;
    eyeOffsetX2 = halfUnit + 5;
    eyeOffsetY1 = UNIT - thirdUnit;
    eyeOffsetY2 = UNIT - thirdUnit;
    pupilOffsetX = 0;
    pupilOffsetY = 2;
  } else if (velX === -UNIT) {
    // LEFT
    eyeOffsetX1 = thirdUnit;
    eyeOffsetX2 = thirdUnit;
    eyeOffsetY1 = halfUnit - 5;
    eyeOffsetY2 = halfUnit + 5;
    pupilOffsetX = -2;
    pupilOffsetY = 0;
  } else {
    // RIGHT (velX === UNIT)
    eyeOffsetX1 = UNIT - thirdUnit;
    eyeOffsetX2 = UNIT - thirdUnit;
    eyeOffsetY1 = halfUnit - 5;
    eyeOffsetY2 = halfUnit + 5;
    pupilOffsetX = 2;
    pupilOffsetY = 0;
  }

  context.arc(x + eyeOffsetX1, y + eyeOffsetY1, 4, 0, 2 * Math.PI);
  context.arc(x + eyeOffsetX2, y + eyeOffsetY2, 4, 0, 2 * Math.PI);
  context.fill();

  context.fillStyle = "black";
  context.beginPath();
  context.arc(
    x + eyeOffsetX1 + pupilOffsetX,
    y + eyeOffsetY1 + pupilOffsetY,
    2,
    0,
    2 * Math.PI
  );
  context.arc(
    x + eyeOffsetX2 + pupilOffsetX,
    y + eyeOffsetY2 + pupilOffsetY,
    2,
    0,
    2 * Math.PI
  );
  context.fill();

  context.fillStyle = "red";
  if (velX === UNIT) {
    // Right
    context.fillRect(x + UNIT - 2, y + halfUnit - 1, 4, 2);
  } else if (velX === -UNIT) {
    // Left
    context.fillRect(x - 2, y + halfUnit - 1, 4, 2);
  } else if (velY === UNIT) {
    // Down
    context.fillRect(x + halfUnit - 1, y + UNIT - 2, 2, 4);
  } else if (velY === -UNIT) {
    // Up
    context.fillRect(x + halfUnit - 1, y - 2, 2, 4);
  }
}

function moveSnake() {
  let newHeadX = snake[0].x + xVel;
  let newHeadY = snake[0].y + yVel;

  if (newHeadX < 0) {
    newHeadX = WIDTH - UNIT;
  } else if (newHeadX >= WIDTH) {
    newHeadX = 0;
  }
  if (newHeadY < 0) {
    newHeadY = HEIGHT - UNIT;
  } else if (newHeadY >= HEIGHT) {
    newHeadY = 0;
  }

  const head = { x: newHeadX, y: newHeadY };
  snake.unshift(head);

  if (snake[0].x === foodX && snake[0].y === foodY) {
    score += 1;
    scoreText.textContent = score;
    createFood();
  } else {
    snake.pop();
  }
}

function nextTick() {
  if (active && !paused) {
    gameLoopId = setTimeout(() => {
      clearBoard();
      displayFood();
      moveSnake();
      drawSnake();
      checkGameOver();
      nextTick();
    }, 150);
  } else if (!active) {
    clearTimeout(gameLoopId);
    finalScoreText.textContent = score;
    gameoverPopup.classList.add("popup-active");
    gameoverPopup.classList.remove("popup-hidden");
  }
}

function checkGameOver() {
  for (let i = 1; i < snake.length; i += 1) {
    if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
      active = false;
      break;
    }
  }
}

// --- Confirmation/Quit Logic ---

function showConfirmation(action) {
  if (action === "NEW_GAME") {
    confirmMessage.textContent =
      "Are you sure you want to start a new game? Current progress will be lost.";
    confirmYesButton.textContent = "Yes, New Game";
    confirmNoButton.textContent = "Resume";
    pendingAction = "NEW_GAME";
  } else if (action === "QUIT_APP") {
    confirmMessage.textContent =
      "Do you want to quit and return to the start screen, or resume playing?";
    confirmYesButton.textContent = "Quit to Start Screen";
    confirmNoButton.textContent = "Resume";
    pendingAction = "QUIT_APP";
  } else if (action === "QUIT_GAME_OVER") {
    confirmMessage.textContent =
      "Are you sure you want to quit the application entirely?";
    confirmYesButton.textContent = "Yes, Quit App";
    confirmNoButton.textContent = "Cancel";
    pendingAction = "QUIT_GAME_OVER";
    gameoverPopup.classList.remove("popup-active");
  }

  if (active && !paused && action !== "QUIT_GAME_OVER") {
    paused = true;
    clearTimeout(gameLoopId);
  }

  confirmPopup.classList.add("popup-active");
  confirmPopup.classList.remove("popup-hidden");
}

function handleConfirmationYes() {
  confirmPopup.classList.remove("popup-active");
  confirmPopup.classList.add("popup-hidden");

  if (pendingAction === "NEW_GAME") {
    initGame(true);
  } else if (pendingAction === "QUIT_APP") {
    initGame(false);
  } else if (pendingAction === "QUIT_GAME_OVER") {
    handleQuit();
  }
  pendingAction = null;
}

function handleConfirmationNo() {
  confirmPopup.classList.remove("popup-active");
  confirmPopup.classList.add("popup-hidden");

  if (pendingAction === "NEW_GAME" || pendingAction === "QUIT_APP") {
    paused = false;
    nextTick();
  } else if (pendingAction === "QUIT_GAME_OVER") {
    gameoverPopup.classList.add("popup-active");
    gameoverPopup.classList.remove("popup-hidden");
  }
  pendingAction = null;
}

// --- Control Handlers ---

function handlePause() {
  if (active) {
    paused = !paused;
    pauseButton.textContent = paused ? "Resume" : "Pause";
    if (!paused) {
      nextTick();
    } else {
      clearTimeout(gameLoopId);
      context.font = "bold 50px 'Playfair Display'";
      context.fillStyle = "white";
      context.textAlign = "center";
      context.fillText("PAUSED", WIDTH / 2, HEIGHT / 2);
    }
  }
}

function handleQuit() {
  alert("Thanks for playing! Application closed.");
}

function keyPress(event) {
  const LEFT = 37;
  const UP = 38;
  const RIGHT = 39;
  const DOWN = 40;

  if (event.keyCode === 32) {
    handlePause();
  }

  if (active && !paused && !confirmPopup.classList.contains("popup-active")) {
    switch (true) {
      case event.keyCode === LEFT && xVel !== UNIT:
        xVel = -UNIT;
        yVel = 0;
        break;
      case event.keyCode === RIGHT && xVel !== -UNIT:
        xVel = UNIT;
        yVel = 0;
        break;
      case event.keyCode === UP && yVel !== UNIT:
        xVel = 0;
        yVel = -UNIT;
        break;
      case event.keyCode === DOWN && yVel !== -UNIT:
        xVel = 0;
        yVel = UNIT;
        break;
    }
  }
}

// Initial setup
initGame();
