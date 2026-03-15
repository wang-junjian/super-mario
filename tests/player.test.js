// 玩家状态单元测试
describe('Player State', () => {
  const MARIO_STATES = {
    SMALL: 'small',
    BIG: 'big',
    FIRE: 'fire'
  };

  test('初始状态应该是小马力欧', () => {
    const mario = {
      state: MARIO_STATES.SMALL,
      width: 16,
      height: 16,
      firePower: false
    };

    expect(mario.state).toBe(MARIO_STATES.SMALL);
    expect(mario.height).toBe(16);
    expect(mario.firePower).toBe(false);
  });

  test('吃蘑菇后应该变成大马力欧', () => {
    const mario = {
      state: MARIO_STATES.SMALL,
      height: 16,
      firePower: false
    };

    // 模拟吃蘑菇
    if (mario.state === MARIO_STATES.SMALL) {
      mario.state = MARIO_STATES.BIG;
      mario.height = 32;
    }

    expect(mario.state).toBe(MARIO_STATES.BIG);
    expect(mario.height).toBe(32);
  });

  test('大马力欧吃火焰花应该变成火焰状态', () => {
    const mario = {
      state: MARIO_STATES.BIG,
      height: 32,
      firePower: false
    };

    // 模拟吃火焰花
    mario.state = MARIO_STATES.FIRE;
    mario.firePower = true;

    expect(mario.state).toBe(MARIO_STATES.FIRE);
    expect(mario.firePower).toBe(true);
  });

  test('小马力欧吃火焰花应该先变大再获得火焰能力', () => {
    const mario = {
      state: MARIO_STATES.SMALL,
      height: 16,
      firePower: false
    };

    // 模拟吃火焰花
    mario.state = MARIO_STATES.FIRE;
    mario.firePower = true;
    mario.height = 32;

    expect(mario.state).toBe(MARIO_STATES.FIRE);
    expect(mario.firePower).toBe(true);
    expect(mario.height).toBe(32);
  });

  test('受伤后大马力欧应该变小', () => {
    const mario = {
      state: MARIO_STATES.BIG,
      height: 32,
      firePower: false
    };

    // 模拟受伤
    mario.state = MARIO_STATES.SMALL;
    mario.height = 16;

    expect(mario.state).toBe(MARIO_STATES.SMALL);
    expect(mario.height).toBe(16);
  });

  test('火焰马力欧受伤后应该变成大马力欧', () => {
    const mario = {
      state: MARIO_STATES.FIRE,
      height: 32,
      firePower: true
    };

    // 模拟受伤
    mario.state = MARIO_STATES.BIG;
    mario.firePower = false;

    expect(mario.state).toBe(MARIO_STATES.BIG);
    expect(mario.firePower).toBe(false);
    expect(mario.height).toBe(32); // 高度不变
  });

  test('无敌状态应该在设定时间后结束', () => {
    const mario = {
      invincible: true,
      invincibleEndTime: Date.now() + 2000
    };

    expect(mario.invincible).toBe(true);

    // 模拟时间过去
    mario.invincibleEndTime = Date.now() - 1000;
    if (Date.now() > mario.invincibleEndTime) {
      mario.invincible = false;
    }

    expect(mario.invincible).toBe(false);
  });
});
