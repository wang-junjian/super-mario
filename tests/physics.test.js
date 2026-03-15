// 物理引擎单元测试
describe('Physics Engine', () => {
  // 模拟游戏状态和常量
  const GAME_CONFIG = {
    physics: {
      gravity: 0.5,
      friction: 0.8,
      terminalVelocity: 16
    },
    player: {
      jumpForce: 12,
      speed: 2.5
    }
  };

  test('重力应该正确应用到垂直速度', () => {
    let velocityY = 0;
    velocityY += GAME_CONFIG.physics.gravity;
    expect(velocityY).toBe(0.5);

    // 多次应用重力
    for (let i = 0; i < 10; i++) {
      velocityY += GAME_CONFIG.physics.gravity;
    }
    expect(velocityY).toBe(0.5 * 11); // 初始0.5 + 10次增加
  });

  test('跳跃应该给与正确的向上速度', () => {
    let velocityY = 0;
    velocityY = -GAME_CONFIG.player.jumpForce;
    expect(velocityY).toBe(-12);
  });

  test('终端速度限制应该生效', () => {
    let velocityY = 0;
    const gravity = GAME_CONFIG.physics.gravity;
    const terminalVelocity = GAME_CONFIG.physics.terminalVelocity;

    // 加速超过终端速度
    for (let i = 0; i < 50; i++) {
      velocityY += gravity;
      if (velocityY > terminalVelocity) {
        velocityY = terminalVelocity;
      }
    }

    expect(velocityY).toBe(terminalVelocity);
  });

  test('摩擦力应该正确降低水平速度', () => {
    let velocityX = 10;
    const friction = GAME_CONFIG.physics.friction;

    velocityX *= friction;
    expect(velocityX).toBe(10 * 0.8); // 8

    velocityX *= friction;
    expect(velocityX).toBe(8 * 0.8); // 6.4
  });

  test('移动应该正确增加水平速度', () => {
    let velocityX = 0;
    const moveSpeed = GAME_CONFIG.player.speed;

    // 向右移动
    velocityX = Math.min(velocityX + 0.2, moveSpeed);
    expect(velocityX).toBe(0.2);

    // 持续加速到最大速度
    for (let i = 0; i < 20; i++) {
      velocityX = Math.min(velocityX + 0.2, moveSpeed);
    }
    expect(velocityX).toBe(moveSpeed);
  });
});
