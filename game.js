// 超级马力欧 - 游戏主入口
import {
    MARIO_STATES, POWERUP_TYPES, GAME_CONFIG,
    soundEnabled, setSoundEnabled, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE
} from './src/constants.js';
import {
    initAudio, playJumpSound, playCoinSound, playStompSound,
    playPowerupSound, playHurtSound, playGameOverSound, playLevelCompleteSound
} from './src/audio.js';
import { checkCollision, applyGravity, applyFriction } from './src/physics.js';
import { initInputHandlers, keys, resetKeys } from './src/input.js';
import { generateLevel } from './src/level.js';
import { initRenderer, renderGame } from './src/render.js';
import { updateUI, updateLivesDisplay, showGameOverScreen, hideGameOverScreen, saveHighScore } from './src/ui.js';

// 仅在浏览器环境下初始化canvas
let canvas, ctx;
if (typeof document !== 'undefined') {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas ? initRenderer(canvas) : null;
}

// 游戏状态
export let gameState = {
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
export let mario = {
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
export let gameSpecialState = {
    climbingFlag: false,
    flagX: 0,
    flagTopY: 0,
    flagBottomY: 0,
    climbStartTime: 0,
    climbDuration: 1000 // 更快的爬杆速度
};

// 游戏对象
export let tiles = [];
export let enemies = [];
export let powerups = [];
export let fireballs = [];
export let particles = [];

// 关键函数暴露到全局，确保事件可以访问
if (typeof window !== 'undefined') {
    window.startGame = startGame;
    window.gameState = gameState;
}

// 初始化游戏
export function initGame() {
    try {
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
export function startGame() {
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
export function resetMario() {
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
export function updateMarioSize() {
    if (mario.state === MARIO_STATES.SMALL) {
        mario.height = 16;
    } else {
        mario.height = 32;
    }
}

// 跳跃处理
export function handleJump() {
    if (!gameState.running || gameState.paused) return;
    if (mario.isOnGround) {
        mario.velocityY = -GAME_CONFIG.player.jumpForce;
        mario.isOnGround = false;
        mario.isJumping = true;
        playJumpSound();
    }
}

// 火球发射处理
export function handleFire() {
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
export function updatePlayer(deltaTime) {
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
export function hitBlock(block) {
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
export function updateEnemies(deltaTime) {
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
export function updatePowerups(deltaTime) {
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
export function collectPowerup(powerup) {
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
export function updateFireballs(deltaTime) {
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
export function updateParticles(deltaTime) {
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
export function hurtMario() {
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
export function loseLife() {
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
export function gameOver() {
    gameState.running = false;

    // 更新最高分
    saveHighScore(gameState.score);

    // 显示游戏结束界面
    showGameOverScreen(gameState.score, gameState.level);

    playGameOverSound();
}

// 完成关卡
export function completeLevel() {
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
export function addScore(points) {
    gameState.score += points;
    updateUI(gameState);
}

// 游戏循环
export function gameLoop() {
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
export function togglePause() {
    if (!gameState.running) return;

    gameState.paused = !gameState.paused;

    if (gameState.paused) {
        gameState.gamePausedTime = Date.now();
    } else {
        gameState.totalPausedDuration += Date.now() - gameState.gamePausedTime;
    }
}

// 切换音效
export function toggleSound() {
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
    if (document.readyState === 'loading') {
        // DOM还在加载，等待事件
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // DOM已经加载完成，直接执行
        initialize();
    }
}

// 导出函数用于单元测试
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkCollision
    };
}
