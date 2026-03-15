// 超级马力欧 - 游戏主逻辑（单文件版，无模块依赖）
let canvas, ctx;

// 仅在浏览器环境下初始化canvas
if (typeof document !== 'undefined') {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas ? canvas.getContext('2d') : null;
}

// ==============================
// 常量配置
// ==============================
const TILE_SIZE = 32;
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 600;

// 马力欧状态
const MARIO_STATES = {
    SMALL: 'small',
    BIG: 'big',
    FIRE: 'fire'
};

// 道具类型
const POWERUP_TYPES = {
    MUSHROOM: 'mushroom',
    FIRE_FLOWER: 'fire_flower',
    STAR: 'star',
    ONE_UP: 'one_up'
};

// 敌人类型
const ENEMY_TYPES = {
    GOOMBA: 'goomba',
    KOOPA: 'koopa'
};

// 砖块类型
const TILE_TYPES = {
    EMPTY: 0,
    GROUND: 1,
    BRICK: 2,
    QUESTION: 3,
    PIPE: 4,
    COIN: 5
};

// 游戏默认配置
const GAME_CONFIG = {
    // 玩家配置
    player: {
        speed: 2.5,
        jumpForce: 12,
        sprintMultiplier: 1.5,
        initialLives: 3,
        invincibleTime: 2000
    },
    // 物理配置
    physics: {
        gravity: 0.5,
        friction: 0.8,
        terminalVelocity: 16
    },
    // 音效配置
    sound: {
        enabled: true,
        volume: 0.5
    },
    // 游戏配置
    game: {
        coinValue: 200,
        enemyKillValue: 100,
        powerupValue: 1000,
        levelCompleteBonus: 5000,
        levelWidth: 2000
    }
};

// 全局状态
let soundEnabled = GAME_CONFIG.sound.enabled;

function setSoundEnabled(value) {
    soundEnabled = value;
}

// ==============================
// 音频系统
// ==============================
let audioCtx = null;

// 初始化音频系统
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// 音频合成器 - 统一处理所有音效生成
function playSound(options) {
    if (!audioCtx || !soundEnabled) return;

    const {
        frequency = 440,
        duration = 0.2,
        type = 'sine',
        gain = 0.3,
        frequencyEnvelope = null,
        gainEnvelope = null
    } = options;

    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // 设置基础频率和波形类型
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        oscillator.type = type;

        // 设置音量包络
        if (gainEnvelope) {
            gainNode.gain.setValueAtTime(gainEnvelope.initial, audioCtx.currentTime);
            gainEnvelope.points.forEach(point => {
                gainNode.gain.exponentialRampToValueAtTime(point.gain, audioCtx.currentTime + point.time);
            });
        } else {
            gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        }

        // 设置频率包络
        if (frequencyEnvelope) {
            frequencyEnvelope.points.forEach(point => {
                oscillator.frequency.setValueAtTime(point.frequency, audioCtx.currentTime + point.time);
            });
        }

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration);

        // 确保资源释放
        setTimeout(() => {
            oscillator.disconnect();
            gainNode.disconnect();
        }, (duration + 0.1) * 1000);
    } catch (error) {
        console.error('播放音效失败:', error);
    }
}

// 播放跳跃音效
function playJumpSound() {
    playSound({
        frequency: 600,
        duration: 0.15,
        type: 'square',
        gain: 0.2,
        frequencyEnvelope: {
            points: [
                { time: 0.15, frequency: 800 }
            ]
        }
    });
}

// 播放收集金币音效
function playCoinSound() {
    playSound({
        frequency: 988,
        duration: 0.3,
        type: 'sine',
        gain: 0.2,
        frequencyEnvelope: {
            points: [
                { time: 0.1, frequency: 1319 },
                { time: 0.2, frequency: 1568 },
                { time: 0.3, frequency: 1976 }
            ]
        }
    });
}

// 播放踩踏敌人音效
function playStompSound() {
    playSound({
        frequency: 200,
        duration: 0.1,
        type: 'sawtooth',
        gain: 0.3
    });
}

// 播放吃蘑菇音效
function playPowerupSound() {
    playSound({
        frequency: 523,
        duration: 0.5,
        type: 'sine',
        gain: 0.3,
        frequencyEnvelope: {
            points: [
                { time: 0.1, frequency: 659 },
                { time: 0.2, frequency: 784 },
                { time: 0.3, frequency: 1047 },
                { time: 0.4, frequency: 1319 }
            ]
        }
    });
}

// 播放受伤音效
function playHurtSound() {
    playSound({
        frequency: 400,
        duration: 0.3,
        type: 'sawtooth',
        gain: 0.3,
        frequencyEnvelope: {
            points: [
                { time: 0.3, frequency: 150 }
            ]
        }
    });
}

// 播放游戏结束音效
function playGameOverSound() {
    playSound({
        frequency: 300,
        duration: 1,
        type: 'sawtooth',
        gain: 0.4,
        frequencyEnvelope: {
            points: [
                { time: 0.5, frequency: 200 },
                { time: 1, frequency: 100 }
            ]
        }
    });
}

// 播放关卡完成音效
function playLevelCompleteSound() {
    playSound({
        frequency: 523,
        duration: 1.2,
        type: 'sine',
        gain: 0.3,
        frequencyEnvelope: {
            points: [
                { time: 0.2, frequency: 659 },
                { time: 0.4, frequency: 784 },
                { time: 0.6, frequency: 1047 },
                { time: 0.8, frequency: 1319 },
                { time: 1, frequency: 1568 },
                { time: 1.2, frequency: 2093 }
            ]
        }
    });
}

// ==============================
// 物理引擎
// ==============================
/**
 * 碰撞检测
 * @param {Object} rect - 矩形对象 {x, y, width, height}
 * @param {Array} objects - 要检测的对象数组
 * @param {Boolean} checkSolid - 是否只检测solid对象
 * @returns {Object|null} 碰撞到的对象或null
 */
function checkCollision(rect, objects, checkSolid = true) {
    for (const obj of objects) {
        if ((!checkSolid || obj.solid) &&
            rect.x < obj.x + obj.width &&
            rect.x + rect.width > obj.x &&
            rect.y < obj.y + obj.height &&
            rect.y + rect.height > obj.y) {
            return obj;
        }
    }
    return null;
}

/**
 * 应用重力到物体
 * @param {Object} object - 要应用重力的物体
 * @param {Number} gravity - 重力值
 * @param {Number} terminalVelocity - 最大下落速度
 */
function applyGravity(object, gravity, terminalVelocity) {
    object.velocityY += gravity;
    if (object.velocityY > terminalVelocity) {
        object.velocityY = terminalVelocity;
    }
}

/**
 * 应用摩擦力到物体
 * @param {Object} object - 要应用摩擦力的物体
 * @param {Number} friction - 摩擦力系数
 */
function applyFriction(object, friction) {
    object.velocityX *= friction;
}

// ==============================
// 输入处理
// ==============================
// 输入状态
const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    sprint: false,
    fire: false
};

// 初始化事件监听
function initInputHandlers({ onJump, onFire, onTogglePause, onToggleSound }) {
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        // 如果游戏没运行，只有回车键能开始游戏
        if (!window.gameState || !window.gameState.running) {
            if (e.key === 'Enter') {
                window.startGame && window.startGame();
            }
            return;
        }

        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                keys.right = true;
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
            case ' ':
                if (!keys.up) {
                    keys.up = true;
                    if (onJump) onJump();
                }
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                keys.down = true;
                break;
            case 'Shift':
                keys.sprint = true;
                break;
            case 'j':
            case 'J':
                keys.fire = true;
                if (onFire) onFire();
                break;
            case 'p':
            case 'P':
                if (onTogglePause) onTogglePause();
                break;
            case 'm':
            case 'M':
                if (onToggleSound) onToggleSound();
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                keys.right = false;
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
            case ' ':
                keys.up = false;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                keys.down = false;
                break;
            case 'Shift':
                keys.sprint = false;
                break;
            case 'j':
            case 'J':
                keys.fire = false;
                break;
        }
    });
}

// 重置所有按键状态
function resetKeys() {
    keys.left = false;
    keys.right = false;
    keys.up = false;
    keys.down = false;
    keys.sprint = false;
    keys.fire = false;
}

// ==============================
// 关卡生成
// ==============================
/**
 * 生成关卡
 * @param {Number} level - 当前关卡数
 * @returns {Object} 关卡数据 {tiles, enemies}
 */
function generateLevel(level) {
    const tiles = [];
    const enemies = [];

    const levelWidth = 2000 / TILE_SIZE;
    const groundHeight = CANVAS_HEIGHT / TILE_SIZE - 3;

    // 难度参数 - 平滑递增
    const difficultyParams = {
        1: {
            gapChance: 0,        // 第一关完全没有沟壑
            platformChance: 0.03, // 少量平台
            enemyChance: 0.02,    // 少量敌人
            pipeChance: 0,        // 没有管道
            stairChance: 0,       // 没有楼梯
            maxEnemySpeed: 1,     // 敌人慢速
            maxGapWidth: 0        // 没有沟壑
        },
        2: {
            gapChance: 0.03,
            platformChance: 0.05,
            enemyChance: 0.03,
            pipeChance: 0.01,
            stairChance: 0.01,
            maxEnemySpeed: 1.1,
            maxGapWidth: 1        // 最多1格宽沟壑
        },
        3: {
            gapChance: 0.05,
            platformChance: 0.07,
            enemyChance: 0.04,
            pipeChance: 0.02,
            stairChance: 0.02,
            maxEnemySpeed: 1.2,
            maxGapWidth: 1
        },
        4: {
            gapChance: 0.07,
            platformChance: 0.08,
            enemyChance: 0.045,
            pipeChance: 0.025,
            stairChance: 0.03,
            maxEnemySpeed: 1.3,
            maxGapWidth: 2        // 最多2格宽沟壑
        },
        5: {
            gapChance: 0.08,
            platformChance: 0.09,
            enemyChance: 0.05,
            pipeChance: 0.03,
            stairChance: 0.035,
            maxEnemySpeed: 1.4,
            maxGapWidth: 2
        }
    };

    // 获取当前关卡难度参数
    const params = difficultyParams[Math.min(level, 5)] || difficultyParams[5];

    // 先生成全地面，确保没有死路
    for (let x = 0; x < levelWidth; x++) {
        // 前15格和最后20格100%有地面，确保起点和终点安全
        if (x < 15 || x > levelWidth - 20) {
            tiles.push({
                x: x * TILE_SIZE,
                y: groundHeight * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                type: TILE_TYPES.GROUND,
                solid: true
            });
        } else {
            // 随机生成沟壑，但确保不会太宽
            if (Math.random() > params.gapChance) {
                tiles.push({
                    x: x * TILE_SIZE,
                    y: groundHeight * TILE_SIZE,
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    type: TILE_TYPES.GROUND,
                    solid: true
                });
            }
        }
    }

    // 修复过宽的沟壑，确保所有沟壑都能跳过
    let gapLength = 0;
    for (let x = 15; x < levelWidth - 20; x++) {
        const hasGround = tiles.some(t => t.x === x * TILE_SIZE && t.y === groundHeight * TILE_SIZE);
        if (!hasGround) {
            gapLength++;
            if (gapLength > params.maxGapWidth) {
                // 超过最大宽度，补上地面
                tiles.push({
                    x: x * TILE_SIZE,
                    y: groundHeight * TILE_SIZE,
                    width: TILE_SIZE,
                    height: TILE_SIZE,
                    type: TILE_TYPES.GROUND,
                    solid: true
                });
                gapLength = 0;
            }
        } else {
            gapLength = 0;
        }
    }

    // 生成低平台（高度1-2格，容易跳）
    for (let x = 15; x < levelWidth - 20; x += 10) {
        if (Math.random() < params.platformChance) {
            const platformLength = 3 + Math.floor(Math.random() * 4);
            const platformHeight = 1 + Math.floor(Math.random() * 2); // 最多2格高
            for (let i = 0; i < platformLength && x + i < levelWidth - 20; i++) {
                // 确保平台下方有地面，不会浮空
                const belowHasGround = tiles.some(t => t.x === (x + i) * TILE_SIZE && t.y === groundHeight * TILE_SIZE);
                if (belowHasGround) {
                    tiles.push({
                        x: (x + i) * TILE_SIZE,
                        y: (groundHeight - platformHeight) * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE,
                        type: TILE_TYPES.BRICK,
                        solid: true
                    });
                }
            }
        }
    }

    // 生成矮楼梯（最多3格高）
    for (let x = 30; x < levelWidth - 30; x += 50) {
        if (Math.random() < params.stairChance) {
            const stairHeight = Math.min(3, 2 + Math.floor(level / 3));
            for (let h = 0; h < stairHeight; h++) {
                for (let w = 0; w <= h; w++) {
                    tiles.push({
                        x: (x + w) * TILE_SIZE,
                        y: (groundHeight - 1 - h) * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE,
                        type: TILE_TYPES.BRICK,
                        solid: true
                    });
                }
            }
        }
    }

    // 生成问号箱，位置合理容易够到
    for (let x = 10; x < levelWidth - 15; x += 8) {
        if (Math.random() < 0.2) {
            const height = 2 + Math.floor(Math.random() * 2); // 高度2-3格，容易顶到
            tiles.push({
                x: x * TILE_SIZE,
                y: (groundHeight - height) * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                type: Math.random() < 0.4 ? TILE_TYPES.QUESTION : TILE_TYPES.BRICK,
                solid: true,
                used: false,
                contains: Math.random() < 0.7 ? 'coin' : 'mushroom' // 更多金币和蘑菇
            });

            // 第三关开始才生成火焰花
            if (level >= 3 && Math.random() < 0.3) {
                tiles[tiles.length - 1].contains = 'flower';
            }
        }
    }

    // 生成管道（矮管道，容易跳过）
    for (let x = 25; x < levelWidth - 25; x += 40) {
        if (Math.random() < params.pipeChance) {
            const pipeHeight = Math.min(2, 1 + Math.floor(level / 3)); // 最多2格高
            for (let h = 0; h < pipeHeight; h++) {
                tiles.push({
                    x: x * TILE_SIZE,
                    y: (groundHeight - 1 - h) * TILE_SIZE,
                    width: TILE_SIZE * 2,
                    height: TILE_SIZE,
                    type: TILE_TYPES.PIPE,
                    solid: true
                });
            }
            x++; // 管道占两格宽
        }
    }

    // 生成敌人 - 数量随关卡增加
    const enemyCount = 3 + level * 2;
    for (let i = 0; i < enemyCount; i++) {
        const x = 20 + Math.floor(Math.random() * (levelWidth - 50));
        // 确保敌人在地面上
        const hasGround = tiles.some(t => t.x === x * TILE_SIZE && t.y === groundHeight * TILE_SIZE);
        if (hasGround) {
            const direction = Math.random() < 0.5 ? -1 : 1;
            enemies.push({
                x: x * TILE_SIZE,
                y: (groundHeight - 1) * TILE_SIZE,
                width: 16,
                height: 16,
                type: level < 3 ? ENEMY_TYPES.GOOMBA : (Math.random() < 0.7 ? ENEMY_TYPES.GOOMBA : ENEMY_TYPES.KOOPA),
                velocityX: direction * params.maxEnemySpeed,
                velocityY: 0,
                isAlive: true,
                isStomped: false,
                stompTime: 0,
                direction: direction
            });
        }
    }

    // 生成金币串，低空排列容易吃到
    for (let x = 20; x < levelWidth - 20; x += 30) {
        const coinCount = 3 + Math.floor(Math.random() * 4);
        const coinHeight = groundHeight - 2; // 离地2格，跳起来就能吃到

        for (let i = 0; i < coinCount; i++) {
            tiles.push({
                x: (x + i) * TILE_SIZE,
                y: coinHeight * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                type: TILE_TYPES.QUESTION,
                solid: true,
                used: false,
                contains: 'coin'
            });
        }
    }

    // 终点前的平整地面
    const castleStartX = levelWidth - 20;
    for (let x = castleStartX; x < levelWidth - 10; x++) {
        if (!tiles.find(t => t.x === x * TILE_SIZE && t.y === groundHeight * TILE_SIZE)) {
            tiles.push({
                x: x * TILE_SIZE,
                y: groundHeight * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                type: TILE_TYPES.GROUND,
                solid: true
            });
        }
    }

    // 生成终点旗杆
    tiles.push({
        x: (levelWidth - 12) * TILE_SIZE,
        y: (groundHeight - 8) * TILE_SIZE,
        width: 8,
        height: 8 * TILE_SIZE,
        type: TILE_TYPES.EMPTY,
        solid: false,
        isFlag: true
    });

    return { tiles, enemies };
}

// ==============================
// 渲染系统
// ==============================
// 预生成背景元素（防止闪烁）
const backgroundElements = {
    mountains: [],
    clouds: []
};

// 初始化背景元素
function initBackgroundElements(canvasHeight) {
    backgroundElements.mountains = [];
    backgroundElements.clouds = [];

    // 生成远山
    for (let i = 0; i < 10; i++) {
        backgroundElements.mountains.push({
            x: i * 300 + Math.sin(i) * 50,
            y: canvasHeight - 180,
            width: 200,
            height: 120 + Math.sin(i * 2) * 30
        });
    }

    // 生成云朵
    for (let i = 0; i < 25; i++) {
        backgroundElements.clouds.push({
            x: i * 200 + Math.sin(i) * 30,
            y: 60 + Math.sin(i * 1.5) * 40,
            size: 35 + Math.random() * 25
        });
    }
}

// 渲染游戏画面
function renderGame(gameState, mario, gameSpecialState, tiles, enemies, powerups, fireballs, particles) {
    const { cameraX } = gameState;
    const CANVAS_WIDTH = canvas.width;
    const CANVAS_HEIGHT = canvas.height;

    // 清空画布
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 保存上下文状态
    ctx.save();

    // 应用相机偏移
    ctx.translate(-cameraX, 0);

    // 渲染远景装饰
    renderBackground();

    // 渲染砖块
    renderTiles(tiles, cameraX, CANVAS_WIDTH);

    // 渲染道具
    renderPowerups(powerups, cameraX, CANVAS_WIDTH);

    // 渲染敌人
    renderEnemies(enemies, cameraX, CANVAS_WIDTH);

    // 渲染火球
    renderFireballs(fireballs, cameraX, CANVAS_WIDTH);

    // 渲染粒子
    renderParticles(particles, cameraX, CANVAS_WIDTH);

    // 渲染马里奥
    renderMario(mario, gameSpecialState);

    // 恢复上下文状态
    ctx.restore();
}

// 渲染背景
function renderBackground() {
    // 绘制远山
    ctx.fillStyle = '#90EE90';
    for (const mountain of backgroundElements.mountains) {
        ctx.beginPath();
        ctx.moveTo(mountain.x, mountain.y);
        ctx.lineTo(mountain.x + mountain.width / 2, mountain.y - mountain.height);
        ctx.lineTo(mountain.x + mountain.width, mountain.y);
        ctx.closePath();
        ctx.fill();
    }

    // 绘制云朵（静态，不会闪烁）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (const cloud of backgroundElements.clouds) {
        const x = cloud.x;
        const y = cloud.y;
        const size = cloud.size;

        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y + size * 0.2, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 渲染砖块
function renderTiles(tiles, cameraX, canvasWidth) {
    for (const tile of tiles) {
        // 跳过屏幕外的砖块
        if (tile.x + tile.width < cameraX || tile.x > cameraX + canvasWidth) {
            continue;
        }

        switch(tile.type) {
            case TILE_TYPES.GROUND:
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
                // 绘制草皮
                ctx.fillStyle = '#228B22';
                ctx.fillRect(tile.x, tile.y, tile.width, 4);
                break;
            case TILE_TYPES.BRICK:
                ctx.fillStyle = '#CD853F';
                ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
                // 绘制砖块纹理
                ctx.fillStyle = '#A0522D';
                for (let i = 0; i < tile.height / 8; i++) {
                    for (let j = 0; j < tile.width / 16; j++) {
                        ctx.fillRect(tile.x + j * 16 + (i % 2 === 0 ? 0 : 8), tile.y + i * 8, 8, 4);
                    }
                }
                break;
            case TILE_TYPES.QUESTION:
                ctx.fillStyle = tile.used ? '#808080' : '#FFD700';
                ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
                if (!tile.used) {
                    ctx.fillStyle = '#FFA500';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('?', tile.x + tile.width / 2, tile.y + tile.height / 2 + 6);
                }
                break;
            case TILE_TYPES.PIPE:
                ctx.fillStyle = '#228B22';
                ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
                // 管道阴影
                ctx.fillStyle = '#32CD32';
                ctx.fillRect(tile.x + 2, tile.y + 2, tile.width - 4, tile.height - 4);
                break;
        }

        // 绘制旗杆
        if (tile.isFlag) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
            // 旗帜
            ctx.fillStyle = '#FF0000';
            ctx.beginPath();
            ctx.moveTo(tile.x + tile.width, tile.y);
            ctx.lineTo(tile.x + tile.width + 20, tile.y + 15);
            ctx.lineTo(tile.x + tile.width, tile.y + 30);
            ctx.fill();
        }
    }
}

// 渲染马里奥
function renderMario(mario, gameSpecialState) {
    // 闪烁效果（无敌时）
    if (mario.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
        return;
    }

    // 颜色
    let shirtColor = mario.starPower ?
        `hsl(${Date.now() / 10 % 360}, 100%, 50%)` :
        (mario.state === MARIO_STATES.FIRE ? '#FF0000' : '#FF0000');
    let pantsColor = mario.state === MARIO_STATES.FIRE ? '#FFFFFF' : '#0000FF';
    let hatColor = mario.starPower ?
        `hsl(${Date.now() / 10 % 360 + 180}, 100%, 50%)` :
        '#FF0000';

    // 绘制马里奥
    let height = mario.isCrouching ? mario.height * 0.7 : mario.height;
    let yOffset = mario.isCrouching ? mario.height * 0.3 : 0;

    // 爬旗杆特殊姿势
    if (gameSpecialState.climbingFlag) {
        height = mario.height;
        yOffset = 0;
        // 让马里奥面朝玩家
        mario.direction = 1;
    }

    // 身体
    ctx.fillStyle = shirtColor;
    ctx.fillRect(mario.x, mario.y + yOffset + height * 0.3, mario.width, height * 0.4);

    // 头部
    ctx.fillStyle = '#FFDBAC'; // 肤色
    ctx.fillRect(mario.x + mario.width * 0.2, mario.y + yOffset, mario.width * 0.6, height * 0.3);

    // 帽子
    ctx.fillStyle = hatColor;
    ctx.fillRect(mario.x, mario.y + yOffset, mario.width, height * 0.15);

    // 裤子
    ctx.fillStyle = pantsColor;
    ctx.fillRect(mario.x, mario.y + yOffset + height * 0.7, mario.width, height * 0.3);

    // 鞋子
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(mario.x, mario.y + yOffset + height * 0.9, mario.width, height * 0.1);

    // 眼睛方向
    ctx.fillStyle = 'white';
    const eyeX = mario.direction > 0 ? mario.x + mario.width * 0.6 : mario.x + mario.width * 0.2;
    ctx.fillRect(eyeX, mario.y + yOffset + height * 0.1, 3, 3);

    // 胡子
    ctx.fillStyle = 'black';
    ctx.fillRect(mario.x + mario.width * 0.3, mario.y + yOffset + height * 0.22, mario.width * 0.4, 2);
}

// 渲染敌人
function renderEnemies(enemies, cameraX, canvasWidth) {
    for (const enemy of enemies) {
        // 跳过屏幕外的敌人
        if (enemy.x + enemy.width < cameraX || enemy.x > cameraX + canvasWidth) {
            continue;
        }

        if (!enemy.isAlive) {
            // 被踩扁的敌人
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(enemy.x, enemy.y + enemy.height * 0.7, enemy.width, enemy.height * 0.3);
            continue;
        }

        switch(enemy.type) {
            case ENEMY_TYPES.GOOMBA:
                // 蘑菇怪
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                // 眼睛
                ctx.fillStyle = 'white';
                ctx.fillRect(enemy.x + 3, enemy.y + 4, 3, 3);
                ctx.fillRect(enemy.x + enemy.width - 6, enemy.y + 4, 3, 3);
                // 眉毛
                ctx.fillStyle = 'black';
                ctx.fillRect(enemy.x + 3, enemy.y + 2, 3, 1);
                ctx.fillRect(enemy.x + enemy.width - 6, enemy.y + 2, 3, 1);
                break;
            case ENEMY_TYPES.KOOPA:
                // 乌龟
                ctx.fillStyle = '#008000';
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                // 龟壳
                ctx.fillStyle = '#006400';
                ctx.fillRect(enemy.x + 2, enemy.y + 2, enemy.width - 4, enemy.height - 4);
                break;
        }
    }
}

// 渲染道具
function renderPowerups(powerups, cameraX, canvasWidth) {
    for (const powerup of powerups) {
        // 跳过屏幕外的道具
        if (powerup.x + powerup.width < cameraX || powerup.x > cameraX + canvasWidth) {
            continue;
        }

        switch(powerup.type) {
            case POWERUP_TYPES.MUSHROOM:
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
                // 斑点
                ctx.fillStyle = 'white';
                ctx.fillRect(powerup.x + 2, powerup.y + 2, 3, 3);
                ctx.fillRect(powerup.x + powerup.width - 5, powerup.y + 2, 3, 3);
                ctx.fillRect(powerup.x + 5, powerup.y + 6, 3, 3);
                break;
            case POWERUP_TYPES.FIRE_FLOWER:
                ctx.fillStyle = '#FFA500';
                ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
                // 花瓣
                ctx.fillStyle = '#FFFF00';
                ctx.fillRect(powerup.x + 2, powerup.y, 3, 3);
                ctx.fillRect(powerup.x + powerup.width - 5, powerup.y, 3, 3);
                ctx.fillRect(powerup.x, powerup.y + 5, 3, 3);
                ctx.fillRect(powerup.x + powerup.width - 3, powerup.y + 5, 3, 3);
                break;
            case POWERUP_TYPES.STAR:
                ctx.fillStyle = '#FFFF00';
                // 五角星
                ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                    const x = powerup.x + powerup.width / 2 + Math.cos(angle) * powerup.width / 2;
                    const y = powerup.y + powerup.height / 2 + Math.sin(angle) * powerup.height / 2;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                break;
            case POWERUP_TYPES.ONE_UP:
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height);
                // 斑点
                ctx.fillStyle = 'white';
                ctx.fillRect(powerup.x + 2, powerup.y + 2, 3, 3);
                ctx.fillRect(powerup.x + powerup.width - 5, powerup.y + 2, 3, 3);
                break;
        }
    }
}

// 渲染火球
function renderFireballs(fireballs, cameraX, canvasWidth) {
    for (const fireball of fireballs) {
        // 跳过屏幕外的火球
        if (fireball.x + fireball.width < cameraX || fireball.x > cameraX + canvasWidth) {
            continue;
        }

        // 火球渐变
        const gradient = ctx.createRadialGradient(
            fireball.x + fireball.width / 2, fireball.y + fireball.height / 2, 0,
            fireball.x + fireball.width / 2, fireball.y + fireball.height / 2, fireball.width / 2
        );
        gradient.addColorStop(0, '#FFFF00');
        gradient.addColorStop(0.5, '#FFA500');
        gradient.addColorStop(1, '#FF0000');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(fireball.x + fireball.width / 2, fireball.y + fireball.height / 2, fireball.width / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 渲染粒子
function renderParticles(particles, cameraX, canvasWidth) {
    for (const particle of particles) {
        // 跳过屏幕外的粒子
        if (particle.x < cameraX || particle.x > cameraX + canvasWidth) {
            continue;
        }

        switch(particle.type) {
            case 'coin':
                ctx.fillStyle = '#FFD700';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('🪙', particle.x, particle.y);
                break;
            case 'debris':
                ctx.fillStyle = '#CD853F';
                ctx.fillRect(particle.x, particle.y, 4, 4);
                break;
        }
    }
}

// ==============================
// UI交互
// ==============================
/**
 * 更新UI显示
 * @param {Object} gameState - 游戏状态
 */
function updateUI(gameState) {
    // 侧边栏已隐藏，暂不更新
}

/**
 * 更新生命值显示
 * @param {Number} lives - 当前生命值
 */
function updateLivesDisplay(lives) {
    // 侧边栏已隐藏，暂不更新
}

/**
 * 显示游戏结束界面
 * @param {Number} score - 最终分数
 * @param {Number} level - 最终关卡
 */
function showGameOverScreen(score, level) {
    document.getElementById('finalScore').textContent = `最终分数: ${score}`;
    document.getElementById('finalLevel').textContent = `关卡: ${level}`;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

/**
 * 隐藏游戏结束界面
 */
function hideGameOverScreen() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.add('hidden');
}

/**
 * 保存最高分
 * @param {Number} score - 当前分数
 * @returns {Number} 新的最高分
 */
function saveHighScore(score) {
    const currentHighScore = parseInt(localStorage.getItem('marioHighScore') || '0');
    if (score > currentHighScore) {
        localStorage.setItem('marioHighScore', score.toString());
        return score;
    }
    return currentHighScore;
}

/**
 * 加载最高分
 * @returns {Number} 历史最高分
 */
function loadHighScore() {
    const savedHighScore = localStorage.getItem('marioHighScore');
    return savedHighScore ? parseInt(savedHighScore) : 0;
}

// ==============================
// 游戏主逻辑
// ==============================

// 游戏状态
let gameState = {
    running: false,
    paused: false,
    score: 0,
    level: 1,
    world: '1-1',
    lives: 3,
    coins: 0,
    cameraX: 0,
    gameStartTime: 0,
    gamePausedTime: 0,
    totalPausedDuration: 0,
    levelComplete: false
};

// 玩家状态
let mario = {
    x: 100,
    y: 200,
    width: 16,
    height: 16,
    velocityX: 0,
    velocityY: 0,
    isOnGround: false,
    isJumping: false,
    isSprinting: false,
    isCrouching: false,
    direction: 1, // 1 = 右, -1 = 左
    state: MARIO_STATES.SMALL,
    invincible: false,
    invincibleEndTime: 0,
    starPower: false,
    starPowerEndTime: 0,
    firePower: false,
    lastFireTime: 0,
    fireCooldown: 300
};

// 游戏特殊状态
let gameSpecialState = {
    climbingFlag: false,
    flagX: 0,
    flagTopY: 0,
    flagBottomY: 0,
    climbStartTime: 0,
    climbDuration: 1000 // 更快的爬杆速度
};

// 游戏对象
let tiles = [];
let enemies = [];
let powerups = [];
let fireballs = [];
let particles = [];

// 初始化游戏
function initGame() {
    try {
        // 初始化渲染器
        if (canvas) {
            initBackgroundElements(canvas.height);
        }

        // 初始化事件监听
        initInputHandlers({
            onJump: handleJump,
            onFire: handleFire,
            onTogglePause: togglePause,
            onToggleSound: toggleSound
        });

        // 生成第一关
        const levelData = generateLevel(gameState.level);
        tiles = levelData.tiles;
        enemies = levelData.enemies;

        console.log('游戏初始化完成');
    } catch (error) {
        console.error('初始化失败:', error);
    }
}

// 开始游戏
function startGame() {
    initAudio();

    gameState.running = true;
    gameState.paused = false;
    gameState.score = 0;
    gameState.level = 1;
    gameState.world = '1-1';
    gameState.lives = GAME_CONFIG.player.initialLives;
    gameState.coins = 0;
    gameState.cameraX = 0;
    gameState.gameStartTime = Date.now();
    gameState.totalPausedDuration = 0;
    gameState.levelComplete = false;

    // 重置马里奥
    resetMario();

    // 生成关卡
    const levelData = generateLevel(gameState.level);
    tiles = levelData.tiles;
    enemies = levelData.enemies;

    // 清空其他对象
    powerups = [];
    fireballs = [];
    particles = [];
    gameSpecialState.climbingFlag = false;

    // 隐藏开始/结束界面
    hideGameOverScreen();

    // 更新UI
    updateUI(gameState);
    updateLivesDisplay(gameState.lives);

    // 启动游戏循环
    gameLoop();
}

// 重置马里奥
function resetMario() {
    mario.x = 100;
    mario.y = 200; // 调高初始位置，确保在屏幕内
    mario.velocityX = 0;
    mario.velocityY = 0;
    mario.isOnGround = false;
    mario.isJumping = false;
    mario.isSprinting = false;
    mario.isCrouching = false;
    mario.direction = 1;
    mario.state = MARIO_STATES.SMALL;
    mario.invincible = false;
    mario.invincibleEndTime = 0;
    mario.starPower = false;
    mario.starPowerEndTime = 0;
    mario.firePower = false;

    // 重置所有特殊状态
    gameSpecialState.climbingFlag = false;
    gameSpecialState.flagX = 0;
    gameSpecialState.climbStartTime = 0;

    // 重置按键状态
    resetKeys();

    // 更新马里奥尺寸
    updateMarioSize();
}

// 更新马里奥尺寸
function updateMarioSize() {
    if (mario.state === MARIO_STATES.SMALL) {
        mario.height = 16;
    } else {
        mario.height = 32;
    }
}

// 跳跃处理
function handleJump() {
    if (!gameState.running || gameState.paused) return;
    if (mario.isOnGround) {
        mario.velocityY = -GAME_CONFIG.player.jumpForce;
        mario.isOnGround = false;
        mario.isJumping = true;
        playJumpSound();
    }
}

// 火球发射处理
function handleFire() {
    if (!gameState.running || gameState.paused || !mario.firePower) return;

    const now = Date.now();
    if (now - mario.lastFireTime < mario.fireCooldown) return;

    mario.lastFireTime = now;

    fireballs.push({
        x: mario.x + (mario.direction > 0 ? mario.width : 0),
        y: mario.y + mario.height / 2,
        width: 8,
        height: 8,
        velocityX: mario.direction * 6,
        velocityY: 0,
        bounces: 0,
        maxBounces: 3
    });

    playSound({
        frequency: 800,
        duration: 0.1,
        type: 'square',
        gain: 0.2
    });
}

// 更新玩家
function updatePlayer(deltaTime) {
    // 处理爬旗杆状态
    if (gameSpecialState.climbingFlag) {
        const elapsed = Date.now() - gameSpecialState.climbStartTime;
        if (elapsed < gameSpecialState.climbDuration) {
            // 沿着旗杆向上爬
            const progress = elapsed / gameSpecialState.climbDuration;
            mario.y = gameSpecialState.flagBottomY - progress * (gameSpecialState.flagBottomY - gameSpecialState.flagTopY);
            mario.x = gameSpecialState.flagX - mario.width / 2;
            mario.velocityX = 0;
            mario.velocityY = 0;
            mario.isOnGround = false;
            mario.isJumping = false;
            return;
        } else {
            // 爬完旗杆，保持在顶部不动，直到切换关卡
            mario.y = gameSpecialState.flagTopY;
            mario.x = gameSpecialState.flagX - mario.width / 2;
            mario.velocityX = 0;
            mario.velocityY = 0;
            mario.isOnGround = true; // 防止掉下来
            if (!gameState.levelComplete) {
                completeLevel();
            }
            return;
        }
    }

    // 处理无敌状态
    if (mario.invincible && Date.now() > mario.invincibleEndTime) {
        mario.invincible = false;
    }

    // 处理星星状态
    if (mario.starPower && Date.now() > mario.starPowerEndTime) {
        mario.starPower = false;
    }

    // 水平移动
    let moveSpeed = GAME_CONFIG.player.speed;
    if (keys.sprint && mario.isOnGround) {
        moveSpeed *= GAME_CONFIG.player.sprintMultiplier;
    }

    if (keys.left) {
        mario.velocityX = Math.max(mario.velocityX - 0.2, -moveSpeed);
        mario.direction = -1;
    } else if (keys.right) {
        mario.velocityX = Math.min(mario.velocityX + 0.2, moveSpeed);
        mario.direction = 1;
    } else {
        applyFriction(mario, GAME_CONFIG.physics.friction);
    }

    // 下蹲
    mario.isCrouching = keys.down && mario.isOnGround && mario.state !== MARIO_STATES.SMALL;

    // 应用重力
    applyGravity(mario, GAME_CONFIG.physics.gravity, GAME_CONFIG.physics.terminalVelocity);

    // 更新位置
    let newX = mario.x + mario.velocityX;
    let newY = mario.y + mario.velocityY;

    // 碰撞检测 - 水平方向
    mario.isOnGround = false;

    // 检查水平碰撞
    const horizontalCollision = checkCollision(
        { x: newX, y: mario.y, width: mario.width, height: mario.height },
        tiles
    );

    if (horizontalCollision) {
        if (mario.velocityX > 0) {
            newX = horizontalCollision.x - mario.width;
        } else {
            newX = horizontalCollision.x + horizontalCollision.width;
        }
        mario.velocityX = 0;
    }

    // 检查垂直碰撞
    const verticalCollision = checkCollision(
        { x: mario.x, y: newY, width: mario.width, height: mario.height },
        tiles
    );

    if (verticalCollision) {
        if (mario.velocityY > 0) {
            newY = verticalCollision.y - mario.height;
            mario.isOnGround = true;
            mario.isJumping = false;
        } else {
            newY = verticalCollision.y + verticalCollision.height;

            // 头顶撞砖块
            if (verticalCollision.type === 2 || verticalCollision.type === 3) {
                hitBlock(verticalCollision);
            }
        }
        mario.velocityY = 0;
    }

    // 边界检查
    if (newX < 0) newX = 0;
    if (newX + mario.width > GAME_CONFIG.game.levelWidth) {
        newX = GAME_CONFIG.game.levelWidth - mario.width;
        completeLevel();
    }

    // 检查是否碰到旗杆
    const flagCollision = checkCollision(
        { x: newX, y: mario.y, width: mario.width, height: mario.height },
        tiles.filter(tile => tile.isFlag),
        false
    );
    if (flagCollision && !gameState.levelComplete && !gameSpecialState.climbingFlag) {
        // 触发爬旗杆动画
        gameSpecialState.climbingFlag = true;
        gameSpecialState.flagX = flagCollision.x + flagCollision.width / 2;
        gameSpecialState.flagTopY = flagCollision.y;
        gameSpecialState.flagBottomY = flagCollision.y + flagCollision.height - mario.height;
        gameSpecialState.climbStartTime = Date.now();
        // 播放爬旗杆音效
        playSound({
            frequency: 523,
            duration: 0.6,
            type: 'sine',
            gain: 0.3,
            frequencyEnvelope: {
                points: [
                    { time: 0.2, frequency: 659 },
                    { time: 0.4, frequency: 784 },
                    { time: 0.6, frequency: 1047 }
                ]
            }
        });
        return;
    }

    // 更新位置
    mario.x = newX;
    mario.y = newY;

    // 检查是否掉出屏幕
    if (mario.y > CANVAS_HEIGHT) {
        loseLife();
    }

    // 更新相机跟随
    const targetCameraX = mario.x - CANVAS_WIDTH / 2;
    if (targetCameraX > gameState.cameraX) {
        gameState.cameraX = targetCameraX;
    }
    if (gameState.cameraX < 0) gameState.cameraX = 0;
}

// 撞击方块
function hitBlock(block) {
    if (block.type === 3 && !block.used) { // QUESTION类型
        block.used = true;
        playCoinSound();
        addScore(GAME_CONFIG.game.coinValue);
        gameState.coins++;

        // 生成道具
        if (block.contains !== 'coin') {
            powerups.push({
                x: block.x,
                y: block.y - TILE_SIZE,
                width: 16,
                height: 16,
                type: block.contains === 'mushroom' ? POWERUP_TYPES.MUSHROOM :
                      block.contains === 'flower' ? POWERUP_TYPES.FIRE_FLOWER : POWERUP_TYPES.ONE_UP,
                velocityY: -2,
                velocityX: mario.x < block.x ? 1 : -1
            });
        }

        // 生成金币粒子
        particles.push({
            x: block.x + TILE_SIZE / 2,
            y: block.y - 10,
            type: 'coin',
            velocityY: -6,
            lifetime: 30
        });
    } else if (block.type === 2 && mario.state !== MARIO_STATES.SMALL) { // BRICK类型
        // 大马里奥可以破坏砖块
        const index = tiles.indexOf(block);
        if (index > -1) {
            tiles.splice(index, 1);
            playSound({
                frequency: 200,
                duration: 0.1,
                type: 'square',
                gain: 0.2
            });

            // 生成碎片粒子
            for (let i = 0; i < 4; i++) {
                particles.push({
                    x: block.x + Math.random() * TILE_SIZE,
                    y: block.y + Math.random() * TILE_SIZE,
                    type: 'debris',
                    velocityX: (Math.random() - 0.5) * 6,
                    velocityY: -3 - Math.random() * 3,
                    lifetime: 30
                });
            }
        }
    }
}

// 更新敌人
function updateEnemies(deltaTime) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];

        if (!enemy.isAlive) {
            if (Date.now() - enemy.stompTime > 1000) {
                enemies.splice(i, 1);
            }
            continue;
        }

        // 应用重力
        applyGravity(enemy, GAME_CONFIG.physics.gravity, GAME_CONFIG.physics.terminalVelocity);

        // 更新位置
        let newX = enemy.x + enemy.velocityX;
        let newY = enemy.y + enemy.velocityY;

        // 碰撞检测
        const collision = checkCollision(
            { x: newX, y: enemy.y, width: enemy.width, height: enemy.height },
            tiles
        );

        if (collision) {
            enemy.velocityX *= -1;
            enemy.direction *= -1;
        } else {
            enemy.x = newX;
        }

        // 垂直碰撞
        const verticalCollision = checkCollision(
            { x: enemy.x, y: newY, width: enemy.width, height: enemy.height },
            tiles
        );

        if (verticalCollision) {
            enemy.y = verticalCollision.y - enemy.height;
            enemy.velocityY = 0;
        } else {
            enemy.y = newY;
        }

        // 检查与马里奥碰撞
        if (!mario.invincible && checkCollision(mario, [enemy], false)) {
            // 检查是否是踩踏（马里奥在敌人上方且向下移动）
            if (mario.velocityY > 0 && mario.y + mario.height < enemy.y + enemy.height / 2) {
                // 踩踏敌人
                enemy.isAlive = false;
                enemy.isStomped = true;
                enemy.stompTime = Date.now();
                mario.velocityY = -8; // 小跳
                addScore(GAME_CONFIG.game.enemyKillValue);
                playStompSound();
            } else if (mario.starPower) {
                // 无敌状态消灭敌人
                enemy.isAlive = false;
                addScore(GAME_CONFIG.game.enemyKillValue);
                playStompSound();
            } else {
                // 受伤
                hurtMario();
            }
        }
    }
}

// 更新道具
function updatePowerups(deltaTime) {
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];

        // 应用重力
        applyGravity(powerup, GAME_CONFIG.physics.gravity, GAME_CONFIG.physics.terminalVelocity);

        // 更新位置
        powerup.x += powerup.velocityX;
        powerup.y += powerup.velocityY;

        // 碰撞检测
        const collision = checkCollision(powerup, tiles);
        if (collision) {
            if (powerup.velocityY > 0) {
                powerup.y = collision.y - powerup.height;
                powerup.velocityY = 0;
            } else {
                powerup.y = collision.y + collision.height;
                powerup.velocityY = 0;
            }
        }

        // 检查水平碰撞
        const horizontalCollision = checkCollision(
            { x: powerup.x + powerup.velocityX, y: powerup.y, width: powerup.width, height: powerup.height },
            tiles
        );

        if (horizontalCollision) {
            powerup.velocityX *= -1;
        }

        // 检查被马里奥收集
        if (checkCollision(mario, [powerup], false)) {
            collectPowerup(powerup);
            powerups.splice(i, 1);
        }
    }
}

// 收集道具
function collectPowerup(powerup) {
    playPowerupSound();
    addScore(GAME_CONFIG.game.powerupValue);

    switch(powerup.type) {
        case POWERUP_TYPES.MUSHROOM:
            if (mario.state === MARIO_STATES.SMALL) {
                mario.state = MARIO_STATES.BIG;
                updateMarioSize();
                mario.y -= TILE_SIZE / 2; // 变大时向上偏移
            }
            break;
        case POWERUP_TYPES.FIRE_FLOWER:
            mario.state = MARIO_STATES.FIRE;
            mario.firePower = true;
            updateMarioSize();
            break;
        case POWERUP_TYPES.STAR:
            mario.starPower = true;
            mario.starPowerEndTime = Date.now() + 10000; // 10秒无敌
            break;
        case POWERUP_TYPES.ONE_UP:
            gameState.lives++;
            updateLivesDisplay(gameState.lives);
            break;
    }
}

// 更新火球
function updateFireballs(deltaTime) {
    for (let i = fireballs.length - 1; i >= 0; i--) {
        const fireball = fireballs[i];

        // 应用重力
        fireball.velocityY += GAME_CONFIG.physics.gravity * 0.5;

        // 更新位置
        fireball.x += fireball.velocityX;
        fireball.y += fireball.velocityY;

        // 碰撞检测
        const collision = checkCollision(fireball, tiles);
        if (collision) {
            if (fireball.velocityY > 0) {
                // 碰到地面弹跳
                fireball.y = collision.y - fireball.height;
                fireball.velocityY = -4;
                fireball.bounces++;

                if (fireball.bounces >= fireball.maxBounces) {
                    fireballs.splice(i, 1);
                    continue;
                }
            } else {
                // 碰到其他物体爆炸
                fireballs.splice(i, 1);
                continue;
            }
        }

        // 检查是否击中敌人
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (enemy.isAlive && checkCollision(fireball, [enemy], false)) {
                enemy.isAlive = false;
                addScore(GAME_CONFIG.game.enemyKillValue);
                playStompSound();
                fireballs.splice(i, 1);
                break;
            }
        }

        // 超出屏幕移除
        if (fireball.x < gameState.cameraX || fireball.x > gameState.cameraX + CANVAS_WIDTH || fireball.y > CANVAS_HEIGHT) {
            fireballs.splice(i, 1);
        }
    }
}

// 更新粒子
function updateParticles(deltaTime) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];

        particle.x += particle.velocityX || 0;
        particle.y += particle.velocityY;
        particle.velocityY += GAME_CONFIG.physics.gravity * 0.5;
        particle.lifetime--;

        if (particle.lifetime <= 0) {
            particles.splice(i, 1);
        }
    }
}

// 马里奥受伤
function hurtMario() {
    if (mario.invincible) return;

    playHurtSound();

    if (mario.state === MARIO_STATES.SMALL) {
        loseLife();
    } else {
        // 变小
        mario.state = MARIO_STATES.SMALL;
        mario.firePower = false;
        updateMarioSize();
        mario.invincible = true;
        mario.invincibleEndTime = Date.now() + GAME_CONFIG.player.invincibleTime;
    }
}

// 失去生命
function loseLife() {
    gameState.lives--;
    updateLivesDisplay(gameState.lives);

    if (gameState.lives <= 0) {
        gameOver();
    } else {
        // 重置马里奥位置
        mario.x = Math.max(100, gameState.cameraX + 50);
        mario.y = 200;
        mario.velocityX = 0;
        mario.velocityY = 0;
        mario.state = MARIO_STATES.SMALL;
        mario.firePower = false;
        updateMarioSize();
        mario.invincible = true;
        mario.invincibleEndTime = Date.now() + GAME_CONFIG.player.invincibleTime;
    }
}

// 游戏结束
function gameOver() {
    gameState.running = false;

    // 更新最高分
    saveHighScore(gameState.score);

    // 显示游戏结束界面
    showGameOverScreen(gameState.score, gameState.level);

    playGameOverSound();
}

// 完成关卡
function completeLevel() {
    if (gameState.levelComplete) return;

    gameState.levelComplete = true;
    addScore(GAME_CONFIG.game.levelCompleteBonus);

    playLevelCompleteSound();

    // 延迟进入下一关
    setTimeout(() => {
        gameState.level++;
        gameState.world = `1-${gameState.level}`;
        gameState.cameraX = 0;
        gameSpecialState.climbingFlag = false; // 重置爬杆状态
        const levelData = generateLevel(gameState.level);
        tiles = levelData.tiles;
        enemies = levelData.enemies;
        powerups = [];
        fireballs = [];
        particles = [];
        resetMario();
        gameState.levelComplete = false;
    }, 3000);
}

// 增加分数
function addScore(points) {
    gameState.score += points;
    updateUI(gameState);
}

// 游戏循环
function gameLoop() {
    if (!gameState.running) return;
    if (gameState.paused) {
        requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = 16; // ~60fps

    // 更新游戏逻辑
    updatePlayer(deltaTime);
    updateEnemies(deltaTime);
    updatePowerups(deltaTime);
    updateFireballs(deltaTime);
    updateParticles(deltaTime);

    // 渲染
    renderGame(gameState, mario, gameSpecialState, tiles, enemies, powerups, fireballs, particles);

    // 更新UI
    updateUI(gameState);

    requestAnimationFrame(gameLoop);
}

// 暂停/继续游戏
function togglePause() {
    if (!gameState.running) return;

    gameState.paused = !gameState.paused;

    if (gameState.paused) {
        gameState.gamePausedTime = Date.now();
    } else {
        gameState.totalPausedDuration += Date.now() - gameState.gamePausedTime;
    }
}

// 切换音效
function toggleSound() {
    setSoundEnabled(!soundEnabled);
}

// 初始化函数
function initialize() {
    try {
        // 绑定按钮事件
        const startBtn = document.getElementById('startBtn');
        const restartBtn = document.getElementById('restartBtn');

        if (startBtn) {
            startBtn.addEventListener('click', startGame);
            console.log('开始游戏按钮绑定成功');
        }
        if (restartBtn) {
            restartBtn.addEventListener('click', startGame);
        }

        // 初始化游戏
        initGame();
        console.log('游戏初始化完成，准备就绪');
    } catch (error) {
        console.error('初始化错误:', error);
    }
}

// 页面加载完成后执行初始化
if (typeof window !== 'undefined') {
    // 暴露全局函数
    window.startGame = startGame;
    window.gameState = gameState;

    if (document.readyState === 'loading') {
        // DOM还在加载，等待事件
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // DOM已经加载完成，直接执行
        initialize();
    }
}
