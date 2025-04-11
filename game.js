// 游戏常量
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = Math.min(window.innerWidth / COLS / 1.5, window.innerHeight / ROWS / 1.5);
const COLORS = [
    '#00ffff', '#0000ff', '#ffa500', '#ffff00', '#00ff00', '#800080', '#ff0000'
];

// 方块形状定义
const SHAPES = [
    [[1, 1, 1, 1]],                    // I - 青色
    [[1, 1, 1], [0, 1, 0]],           // T - 蓝色
    [[1, 1, 1], [1, 0, 0]],           // L - 橙色
    [[1, 1, 1], [0, 0, 1]],           // J - 黄色
    [[1, 1], [1, 1]],                 // O - 绿色
    [[1, 1, 0], [0, 1, 1]],           // Z - 紫色
    [[0, 1, 1], [1, 1, 0]]            // S - 红色
];

// 游戏状态
let canvas;
let ctx;
let gameBoard;
let score = 0;
let currentPiece;
let currentX;
let currentY;
let gameLoop;
let dropInterval = 1000;
let isGameOver = false;

// 初始化游戏
function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 设置画布大小
    canvas.width = COLS * BLOCK_SIZE;
    canvas.height = ROWS * BLOCK_SIZE;
    
    // 初始化游戏板
    gameBoard = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    
    // 初始化触摸事件
    initTouchControls();
    
    // 开始游戏
    newGame();
}

// 初始化触摸控制
function initTouchControls() {
    const leftBtn = document.getElementById('leftBtn');
    const rightBtn = document.getElementById('rightBtn');
    const rotateBtn = document.getElementById('rotateBtn');
    const dropBtn = document.getElementById('dropBtn');
    
    // 移动控制
    leftBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (isValid(-1, 0)) currentX--;
        draw();
    });
    
    rightBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (isValid(1, 0)) currentX++;
        draw();
    });
    
    // 旋转控制
    rotateBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        rotate();
        draw();
    });
    
    // 快速下落
    dropBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        dropDown();
    });

    // 防止页面滚动
    document.addEventListener('touchmove', (e) => {
        if (e.target.classList.contains('control-btn')) {
            e.preventDefault();
        }
    }, { passive: false });
}

// 开始新游戏
function newGame() {
    resetBoard();
    newPiece();
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(drop, dropInterval);
    isGameOver = false;
}

// 重置游戏板
function resetBoard() {
    score = 0;
    document.getElementById('score').textContent = score;
    gameBoard = Array(ROWS).fill().map(() => Array(COLS).fill(0));
}

// 创建新方块
function newPiece() {
    const randomIndex = Math.floor(Math.random() * SHAPES.length);
    currentPiece = SHAPES[randomIndex];
    currentX = Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2);
    currentY = 0;
    
    if (!isValid(0, 0)) {
        isGameOver = true;
        clearInterval(gameLoop);
        alert('游戏结束！得分：' + score);
        newGame();
    }
}

// 检查移动是否有效
function isValid(offsetX, offsetY, newPiece = currentPiece) {
    for (let y = 0; y < newPiece.length; y++) {
        for (let x = 0; x < newPiece[y].length; x++) {
            if (!newPiece[y][x]) continue;
            
            const newX = currentX + x + offsetX;
            const newY = currentY + y + offsetY;
            
            if (newX < 0 || newX >= COLS || newY >= ROWS) return false;
            if (newY < 0) continue;
            if (gameBoard[newY][newX]) return false;
        }
    }
    return true;
}

// 方块下落
function drop() {
    if (!isGameOver) {
        if (isValid(0, 1)) {
            currentY++;
        } else {
            freeze();
            clearLines();
            newPiece();
        }
        draw();
    }
}

// 快速下落
function dropDown() {
    while(isValid(0, 1)) {
        currentY++;
    }
    freeze();
    clearLines();
    newPiece();
    draw();
}

// 冻结方块
function freeze() {
    for (let y = 0; y < currentPiece.length; y++) {
        for (let x = 0; x < currentPiece[y].length; x++) {
            if (currentPiece[y][x]) {
                gameBoard[currentY + y][currentX + x] = currentPiece[y][x];
            }
        }
    }
}

// 清除完整的行
function clearLines() {
    let linesCleared = 0;
    
    for (let y = ROWS - 1; y >= 0; y--) {
        if (gameBoard[y].every(cell => cell)) {
            gameBoard.splice(y, 1);
            gameBoard.unshift(Array(COLS).fill(0));
            linesCleared++;
            y++;
        }
    }
    
    if (linesCleared > 0) {
        score += linesCleared * 100;
        document.getElementById('score').textContent = score;
        // 加快游戏速度
        dropInterval = Math.max(100, 1000 - Math.floor(score / 500) * 100);
        if (gameLoop) {
            clearInterval(gameLoop);
            gameLoop = setInterval(drop, dropInterval);
        }
    }
}

// 旋转方块
function rotate() {
    const newPiece = currentPiece[0].map((_, i) =>
        currentPiece.map(row => row[i]).reverse()
    );
    
    if (isValid(0, 0, newPiece)) {
        currentPiece = newPiece;
    }
}

// 绘制游戏
function draw() {
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制游戏板
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (gameBoard[y][x]) {
                drawBlock(x, y);
            }
        }
    }
    
    // 绘制当前方块
    if (currentPiece) {
        for (let y = 0; y < currentPiece.length; y++) {
            for (let x = 0; x < currentPiece[y].length; x++) {
                if (currentPiece[y][x]) {
                    drawBlock(currentX + x, currentY + y);
                }
            }
        }
    }
}

// 绘制单个方块
function drawBlock(x, y) {
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    ctx.fillStyle = COLORS[colorIndex];
    ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
}

// 启动游戏
document.addEventListener('DOMContentLoaded', init);  
