import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSceneAdd = vi.fn();
const mockSetSize = vi.fn();
const mockRender = vi.fn();
const mockUpdateProjectionMatrix = vi.fn();
const mockLookAt = vi.fn();
const mockPositionSet = vi.fn();

let mockCanvas;
let lastCamera;

vi.mock('three', () => {
  mockCanvas = document.createElement('canvas');
  return {
    Scene: vi.fn(function() { return { add: mockSceneAdd }; }),
    PerspectiveCamera: vi.fn(function() {
      lastCamera = {
        position: { set: mockPositionSet },
        aspect: 1,
        updateProjectionMatrix: mockUpdateProjectionMatrix,
        lookAt: mockLookAt,
      };
      return lastCamera;
    }),
    WebGLRenderer: vi.fn(function() {
      return { setSize: mockSetSize, domElement: mockCanvas, render: mockRender };
    }),
    Timer: vi.fn(function() {
      return { connect: vi.fn(), update: vi.fn(), getDelta: vi.fn(() => 0.016) };
    }),
  };
});

vi.mock('./Ground.js', () => ({
  Ground: vi.fn(function() { return { object: {} }; }),
}));

vi.mock('./Character.js', () => ({
  Character: vi.fn(function() {
    return { object: {}, update: vi.fn(), position: { x: 0, z: 0 }, rotationY: 0 };
  }),
}));

const { App } = await import('./App.js');

describe('App', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('appends the renderer canvas to document.body', () => {
    new App();
    expect(document.body.contains(mockCanvas)).toBe(true);
  });

  it('positions camera above and in front of the ground', () => {
    new App();
    expect(mockPositionSet).toHaveBeenCalledWith(0, 8, 5);
  });

  it('points camera at the origin', () => {
    new App();
    expect(mockLookAt).toHaveBeenCalledWith(0, 0, 0);
  });

  it('adds ground and character to the scene', () => {
    new App();
    expect(mockSceneAdd).toHaveBeenCalledTimes(2);
  });

  it('renders each frame in animate()', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => {});
    const app = new App();
    app.animate();
    expect(mockRender).toHaveBeenCalledTimes(1);
  });

  it('updates camera aspect and renderer size on resize', () => {
    new App();
    Object.defineProperty(window, 'innerWidth',  { value: 1280, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 720,  configurable: true });
    window.dispatchEvent(new Event('resize'));
    expect(lastCamera.aspect).toBe(1280 / 720);
    expect(mockUpdateProjectionMatrix).toHaveBeenCalled();
    expect(mockSetSize).toHaveBeenLastCalledWith(1280, 720);
  });
});
