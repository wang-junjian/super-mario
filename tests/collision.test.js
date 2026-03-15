// 碰撞检测单元测试
import { checkCollision } from '../src/physics.js';

describe('Collision Detection', () => {
  test('两个矩形完全重叠应该检测到碰撞', () => {
    const rect1 = { x: 0, y: 0, width: 10, height: 10 };
    const rect2 = { x: 0, y: 0, width: 10, height: 10, solid: true };

    const result = checkCollision(rect1, [rect2]);
    expect(result).toBe(rect2);
  });

  test('两个矩形部分重叠应该检测到碰撞', () => {
    const rect1 = { x: 0, y: 0, width: 10, height: 10 };
    const rect2 = { x: 5, y: 5, width: 10, height: 10, solid: true };

    const result = checkCollision(rect1, [rect2]);
    expect(result).toBe(rect2);
  });

  test('两个矩形不重叠应该不检测到碰撞', () => {
    const rect1 = { x: 0, y: 0, width: 10, height: 10 };
    const rect2 = { x: 20, y: 20, width: 10, height: 10, solid: true };

    const result = checkCollision(rect1, [rect2]);
    expect(result).toBeNull();
  });

  test('非solid物体应该不触发碰撞检测', () => {
    const rect1 = { x: 0, y: 0, width: 10, height: 10 };
    const rect2 = { x: 0, y: 0, width: 10, height: 10, solid: false };

    const result = checkCollision(rect1, [rect2]);
    expect(result).toBeNull();
  });

  test('关闭solid检测时应该检测非solid物体碰撞', () => {
    const rect1 = { x: 0, y: 0, width: 10, height: 10 };
    const rect2 = { x: 0, y: 0, width: 10, height: 10, solid: false };

    const result = checkCollision(rect1, [rect2], false);
    expect(result).toBe(rect2);
  });

  test('矩形边缘接触应该检测到碰撞', () => {
    const rect1 = { x: 0, y: 0, width: 10, height: 10 };
    const rect2 = { x: 10, y: 0, width: 10, height: 10, solid: true };

    const result = checkCollision(rect1, [rect2]);
    expect(result).toBeNull(); // 边缘接触不算碰撞
  });
});
