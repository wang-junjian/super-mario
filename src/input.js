// 输入处理模块

// 输入状态
export const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    sprint: false,
    fire: false
};

// 初始化事件监听
export function initInputHandlers({ onJump, onFire, onTogglePause, onToggleSound }) {
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        // 如果游戏没运行，只有回车键能开始游戏
        if (!window.gameState || !window.gameState.running) {
            if (e.key === 'Enter') {
                window.startGame && window.startGame();
            }
            return;
        }

        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                keys.left = true;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                keys.right = true;
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
            case ' ':
                if (!keys.up) {
                    keys.up = true;
                    if (onJump) onJump();
                }
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                keys.down = true;
                break;
            case 'Shift':
                keys.sprint = true;
                break;
            case 'j':
            case 'J':
                keys.fire = true;
                if (onFire) onFire();
                break;
            case 'p':
            case 'P':
                if (onTogglePause) onTogglePause();
                break;
            case 'm':
            case 'M':
                if (onToggleSound) onToggleSound();
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch(e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                keys.left = false;
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                keys.right = false;
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
            case ' ':
                keys.up = false;
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                keys.down = false;
                break;
            case 'Shift':
                keys.sprint = false;
                break;
            case 'j':
            case 'J':
                keys.fire = false;
                break;
        }
    });
}

// 重置所有按键状态
export function resetKeys() {
    keys.left = false;
    keys.right = false;
    keys.up = false;
    keys.down = false;
    keys.sprint = false;
    keys.fire = false;
}

export { keys, initInputHandlers };
