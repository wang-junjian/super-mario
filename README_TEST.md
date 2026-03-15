# 超级马力欧 - 单元测试说明

## 📦 安装依赖

```bash
npm install
```

## 🧪 运行测试

### 运行所有测试
```bash
npm test
```

### 监听模式（文件变化自动重测）
```bash
npm run test:watch
```

### 查看测试覆盖率
```bash
npm run test:coverage
```

## 📋 测试用例覆盖

### 1. 碰撞检测测试 (`collision.test.js`)
- ✅ 完全重叠碰撞检测
- ✅ 部分重叠碰撞检测
- ✅ 无碰撞情况检测
- ✅ solid属性碰撞规则
- ✅ 非solid物体碰撞检测
- ✅ 边缘接触边界测试

### 2. 物理引擎测试 (`physics.test.js`)
- ✅ 重力应用逻辑
- ✅ 跳跃速度计算
- ✅ 终端速度限制
- ✅ 摩擦力计算
- ✅ 移动加速逻辑

### 3. 玩家状态测试 (`player.test.js`)
- ✅ 初始状态验证
- ✅ 吃蘑菇变大逻辑
- ✅ 火焰花能力获得
- ✅ 受伤状态变化逻辑
- ✅ 无敌状态时效测试

## 🔧 扩展测试

如果需要添加更多测试，可以在 `tests/` 目录下创建新的 `.test.js` 文件：

- `level.test.js` - 关卡生成测试
- `enemy.test.js` - 敌人AI测试
- `powerup.test.js` - 道具效果测试
- `game.test.js` - 游戏流程测试

## ⚙️ 测试环境

- **测试框架**: Jest 29.x
- **浏览器模拟**: jsdom
- **覆盖范围**: 核心逻辑覆盖率 > 80%
