// 渲染模块
import { MARIO_STATES, TILE_TYPES, ENEMY_TYPES, POWERUP_TYPES } from './constants.js';

let ctx;
let canvas;

// 预生成背景元素（防止闪烁）
const backgroundElements = {
    mountains: [],
    clouds: []
};

// 初始化渲染器
export function initRenderer(canvasElement) {
    canvas = canvasElement;
    ctx = canvas.getContext('2d');
    initBackgroundElements(canvas.height);
    return ctx;
}

// 初始化背景元素
export function initBackgroundElements(canvasHeight) {
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
export function renderGame(gameState, mario, gameSpecialState, tiles, enemies, powerups, fireballs, particles) {
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
