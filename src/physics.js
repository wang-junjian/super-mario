// 物理引擎模块

/**
 * 碰撞检测
 * @param {Object} rect - 矩形对象 {x, y, width, height}
 * @param {Array} objects - 要检测的对象数组
 * @param {Boolean} checkSolid - 是否只检测solid对象
 * @returns {Object|null} 碰撞到的对象或null
 */
export function checkCollision(rect, objects, checkSolid = true) {
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
export function applyGravity(object, gravity, terminalVelocity) {
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
export function applyFriction(object, friction) {
    object.velocityX *= friction;
}
