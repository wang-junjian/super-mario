// 关卡生成模块
import { TILE_SIZE, CANVAS_HEIGHT, TILE_TYPES, ENEMY_TYPES } from './constants.js';

/**
 * 生成关卡
 * @param {Number} level - 当前关卡数
 * @returns {Object} 关卡数据 {tiles, enemies}
 */
export function generateLevel(level) {
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

export { generateLevel };
