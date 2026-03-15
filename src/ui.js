// UI交互模块

/**
 * 更新UI显示
 * @param {Object} gameState - 游戏状态
 */
export function updateUI(gameState) {
    // 侧边栏已隐藏，暂不更新
}

/**
 * 更新生命值显示
 * @param {Number} lives - 当前生命值
 */
export function updateLivesDisplay(lives) {
    // 侧边栏已隐藏，暂不更新
}

/**
 * 显示游戏结束界面
 * @param {Number} score - 最终分数
 * @param {Number} level - 最终关卡
 */
export function showGameOverScreen(score, level) {
    document.getElementById('finalScore').textContent = `最终分数: ${score}`;
    document.getElementById('finalLevel').textContent = `关卡: ${level}`;
    document.getElementById('gameOverScreen').classList.remove('hidden');
}

/**
 * 隐藏游戏结束界面
 */
export function hideGameOverScreen() {
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.add('hidden');
}

/**
 * 保存最高分
 * @param {Number} score - 当前分数
 * @returns {Number} 新的最高分
 */
export function saveHighScore(score) {
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
export function loadHighScore() {
    const savedHighScore = localStorage.getItem('marioHighScore');
    return savedHighScore ? parseInt(savedHighScore) : 0;
}
