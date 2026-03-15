import { jest } from '@jest/globals';

// 模拟Canvas API
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillStyle: '',
  fillRect: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  fill: jest.fn(),
  arc: jest.fn(),
  font: '',
  textAlign: '',
  fillText: jest.fn(),
  createRadialGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  }))
}));

// 模拟AudioContext
window.AudioContext = jest.fn(() => ({
  createOscillator: jest.fn(() => ({
    frequency: { setValueAtTime: jest.fn() },
    type: '',
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    disconnect: jest.fn()
  })),
  createGain: jest.fn(() => ({
    gain: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
    connect: jest.fn(),
    disconnect: jest.fn()
  })),
  currentTime: 0
}));

// 模拟localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(),
    removeItem: jest.fn()
  }
});

// 全局模拟游戏常量和状态
globalThis.TILE_SIZE = 32;
globalThis.CANVAS_WIDTH = 1024;
globalThis.CANVAS_HEIGHT = 600;
