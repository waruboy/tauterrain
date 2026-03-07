import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSceneAdd = vi.fn();
const mockSetSize = vi.fn();
const mockRender = vi.fn();
const mockUpdateProjectionMatrix = vi.fn();
const mockLookAt = vi.fn();
const mockDispose = vi.fn();

let mockCanvas;
let lastCamera;

vi.mock('three', () => {
  mockCanvas = document.createElement('canvas');
  const vec3 = () => ({ x: 0, y: 0, z: 0, set: vi.fn(), copy: vi.fn(), lerp: vi.fn() });
  return {
    Scene: vi.fn(function() {
      return { add: mockSceneAdd, remove: vi.fn(), background: null, fog: null };
    }),
    PerspectiveCamera: vi.fn(function() {
      lastCamera = {
        position: { ...vec3(), lerp: vi.fn() },
        aspect: 1,
        updateProjectionMatrix: mockUpdateProjectionMatrix,
        lookAt: mockLookAt,
      };
      return lastCamera;
    }),
    WebGLRenderer: vi.fn(function() {
      return { setSize: mockSetSize, domElement: mockCanvas, render: mockRender, dispose: mockDispose };
    }),
    Timer: vi.fn(function() {
      return { connect: vi.fn(), update: vi.fn(), getDelta: vi.fn(() => 0.016) };
    }),
    Vector3: vi.fn(function() { return vec3(); }),
    Color: vi.fn(function() { return {}; }),
    FogExp2: vi.fn(function() { return {}; }),
    AmbientLight: vi.fn(function() { return {}; }),
    DirectionalLight: vi.fn(function() {
      return { position: { copy: vi.fn() } };
    }),
    Group: vi.fn(function() {
      return { add: vi.fn(), position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 } };
    }),
    BoxGeometry: vi.fn(function() { return { dispose: vi.fn() }; }),
    MeshBasicMaterial: vi.fn(function() { return {}; }),
    MeshStandardMaterial: vi.fn(function() { return {}; }),
    Mesh: vi.fn(function() {
      return { position: { y: 0, set: vi.fn() }, rotation: { x: 0, z: 0 }, geometry: { dispose: vi.fn() } };
    }),
    PlaneGeometry: vi.fn(function() { return { dispose: vi.fn() }; }),
  };
});

vi.mock('./ChunkManager.js', () => ({
  ChunkManager: vi.fn(function() {
    return { update: vi.fn(), reset: vi.fn() };
  }),
}));

vi.mock('./CameraController.js', () => ({
  CameraController: vi.fn(function() { return { update: vi.fn() }; }),
}));

vi.mock('./InputHandler.js', () => ({
  InputHandler: vi.fn(function() { return { keys: {}, dispose: vi.fn() }; }),
}));

vi.mock('./Character.js', () => ({
  Character: vi.fn(function() {
    return {
      object: {},
      update: vi.fn(),
      position: { x: 0, y: 0, z: 0 },
      rotationY: 0,
      speedMultiplier: 1,
    };
  }),
}));

vi.mock('./CharacterController.js', () => ({
  CharacterController: vi.fn(function() {
    return { update: vi.fn(), applyKnockback: vi.fn() };
  }),
  terrainSpeedMultiplier: vi.fn(() => 1.0),
}));

vi.mock('./NetworkManager.js', () => ({
  NetworkManager: vi.fn(function() {
    return { on: vi.fn(function() { return this; }), sendJoin: vi.fn(), queueUpdate: vi.fn(), dispose: vi.fn() };
  }),
}));

vi.mock('./PlayerManager.js', () => ({
  PlayerManager: vi.fn(function() {
    return { update: vi.fn(), applyWorldState: vi.fn(), applyUpdates: vi.fn(), add: vi.fn(), remove: vi.fn(), dispose: vi.fn() };
  }),
}));

vi.mock('./JoinScreen.js', () => ({
  JoinScreen: vi.fn(function() { return { dismiss: vi.fn(), showError: vi.fn() }; }),
}));

vi.mock('./terrain-noise.js', () => ({
  initTerrain: vi.fn(),
  terrainHeight: vi.fn(() => 0),
}));

vi.mock('./SpeedBoostManager.js', () => ({
  SpeedBoostManager: vi.fn(function() {
    return { update: vi.fn(() => false), reset: vi.fn(), dispose: vi.fn() };
  }),
}));

vi.mock('./GoalManager.js', () => ({
  GoalManager: vi.fn(function() {
    return { position: null, spawn: vi.fn(), reached: vi.fn(), update: vi.fn(), dispose: vi.fn() };
  }),
}));

vi.mock('./HudManager.js', () => ({
  HudManager: vi.fn(function() {
    return { updateSpeed: vi.fn(), updateCompass: vi.fn(), updateFps: vi.fn(), updateScores: vi.fn(), dispose: vi.fn() };
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

  it('cleans up on dispose()', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => {});
    const app = new App();
    app.dispose();
    expect(mockDispose).toHaveBeenCalled();
  });
});
