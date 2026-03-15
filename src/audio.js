// 音频系统模块
import { soundEnabled } from './constants.js';

export {
    initAudio,
    playSound,
    playJumpSound,
    playCoinSound,
    playStompSound,
    playPowerupSound,
    playHurtSound,
    playGameOverSound,
    playLevelCompleteSound
};

let audioCtx = null;

// 初始化音频系统
export function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// 音频合成器 - 统一处理所有音效生成
export function playSound(options) {
    if (!audioCtx || !soundEnabled) return;

    const {
        frequency = 440,
        duration = 0.2,
        type = 'sine',
        gain = 0.3,
        frequencyEnvelope = null,
        gainEnvelope = null
    } = options;

    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // 设置基础频率和波形类型
        oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
        oscillator.type = type;

        // 设置音量包络
        if (gainEnvelope) {
            gainNode.gain.setValueAtTime(gainEnvelope.initial, audioCtx.currentTime);
            gainEnvelope.points.forEach(point => {
                gainNode.gain.exponentialRampToValueAtTime(point.gain, audioCtx.currentTime + point.time);
            });
        } else {
            gainNode.gain.setValueAtTime(gain, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        }

        // 设置频率包络
        if (frequencyEnvelope) {
            frequencyEnvelope.points.forEach(point => {
                oscillator.frequency.setValueAtTime(point.frequency, audioCtx.currentTime + point.time);
            });
        }

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration);

        // 确保资源释放
        setTimeout(() => {
            oscillator.disconnect();
            gainNode.disconnect();
        }, (duration + 0.1) * 1000);
    } catch (error) {
        console.error('播放音效失败:', error);
    }
}

// 播放跳跃音效
export function playJumpSound() {
    playSound({
        frequency: 600,
        duration: 0.15,
        type: 'square',
        gain: 0.2,
        frequencyEnvelope: {
            points: [
                { time: 0.15, frequency: 800 }
            ]
        }
    });
}

// 播放收集金币音效
export function playCoinSound() {
    playSound({
        frequency: 988,
        duration: 0.3,
        type: 'sine',
        gain: 0.2,
        frequencyEnvelope: {
            points: [
                { time: 0.1, frequency: 1319 },
                { time: 0.2, frequency: 1568 },
                { time: 0.3, frequency: 1976 }
            ]
        }
    });
}

// 播放踩踏敌人音效
export function playStompSound() {
    playSound({
        frequency: 200,
        duration: 0.1,
        type: 'sawtooth',
        gain: 0.3
    });
}

// 播放吃蘑菇音效
export function playPowerupSound() {
    playSound({
        frequency: 523,
        duration: 0.5,
        type: 'sine',
        gain: 0.3,
        frequencyEnvelope: {
            points: [
                { time: 0.1, frequency: 659 },
                { time: 0.2, frequency: 784 },
                { time: 0.3, frequency: 1047 },
                { time: 0.4, frequency: 1319 }
            ]
        }
    });
}

// 播放受伤音效
export function playHurtSound() {
    playSound({
        frequency: 400,
        duration: 0.3,
        type: 'sawtooth',
        gain: 0.3,
        frequencyEnvelope: {
            points: [
                { time: 0.3, frequency: 150 }
            ]
        }
    });
}

// 播放游戏结束音效
export function playGameOverSound() {
    playSound({
        frequency: 300,
        duration: 1,
        type: 'sawtooth',
        gain: 0.4,
        frequencyEnvelope: {
            points: [
                { time: 0.5, frequency: 200 },
                { time: 1, frequency: 100 }
            ]
        }
    });
}

// 播放关卡完成音效
export function playLevelCompleteSound() {
    playSound({
        frequency: 523,
        duration: 1.2,
        type: 'sine',
        gain: 0.3,
        frequencyEnvelope: {
            points: [
                { time: 0.2, frequency: 659 },
                { time: 0.4, frequency: 784 },
                { time: 0.6, frequency: 1047 },
                { time: 0.8, frequency: 1319 },
                { time: 1, frequency: 1568 },
                { time: 1.2, frequency: 2093 }
            ]
        }
    });
}
