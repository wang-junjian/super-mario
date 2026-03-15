// 游戏常量和配置
export const TILE_SIZE = 32;
export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 600;

// 马力欧状态
export const MARIO_STATES = {
    SMALL: 'small',
    BIG: 'big',
    FIRE: 'fire'
};

// 道具类型
export const POWERUP_TYPES = {
    MUSHROOM: 'mushroom',
    FIRE_FLOWER: 'fire_flower',
    STAR: 'star',
    ONE_UP: 'one_up'
};

// 敌人类型
export const ENEMY_TYPES = {
    GOOMBA: 'goomba',
    KOOPA: 'koopa'
};

// 砖块类型
export const TILE_TYPES = {
    EMPTY: 0,
    GROUND: 1,
    BRICK: 2,
    QUESTION: 3,
    PIPE: 4,
    COIN: 5
};

// 游戏默认配置
export const GAME_CONFIG = {
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
export let soundEnabled = GAME_CONFIG.sound.enabled;

export function setSoundEnabled(value) {
    soundEnabled = value;
}
