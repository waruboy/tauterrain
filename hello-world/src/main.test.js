import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUpdateProjectionMatrix = vi.fn();
const mockSetSize = vi.fn();
const mockRender = vi.fn();
const mockAdd = vi.fn();
const mockControlsUpdate = vi.fn();
const mockListenToKeyEvents = vi.fn();

let mockCanvas;
let lastCamera;

vi.mock('three', () => {
  mockCanvas = document.createElement('canvas');
  return {
    Scene: vi.fn(function() { return { add: mockAdd }; }),
    PerspectiveCamera: vi.fn(function() {
      lastCamera = {
        position: { set: vi.fn(), z: 0 },
        aspect: 1,
        updateProjectionMatrix: mockUpdateProjectionMatrix,
      };
      return lastCamera;
    }),
    WebGLRenderer: vi.fn(function() {
      return { setSize: mockSetSize, domElement: mockCanvas, render: mockRender };
    }),
    BoxGeometry: vi.fn(function() {}),
    MeshBasicMaterial: vi.fn(function() {}),
    Mesh: vi.fn(function(geometry, material) { return { geometry, material }; }),
  };
});

vi.mock('three/addons/controls/OrbitControls.js', () => ({
  OrbitControls: vi.fn(function() {
    return { update: mockControlsUpdate, listenToKeyEvents: mockListenToKeyEvents };
  }),
}));

const { App } = await import('./main.js');

describe('App', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  it('appends the renderer canvas to document.body', () => {
    new App();
    expect(document.body.contains(mockCanvas)).toBe(true);
  });

  it('sets initial camera z position to 5', () => {
    new App();
    expect(lastCamera.position.z).toBe(5);
  });

  it('registers arrow key listeners on OrbitControls', () => {
    new App();
    expect(mockListenToKeyEvents).toHaveBeenCalledWith(window);
  });

  it('adds the cube to the scene', () => {
    new App();
    expect(mockAdd).toHaveBeenCalledTimes(1);
  });

  it('calls controls.update() and renderer.render() each frame', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => {});
    const app = new App();
    app.animate();
    expect(mockControlsUpdate).toHaveBeenCalledTimes(1);
    expect(mockRender).toHaveBeenCalledTimes(1);
  });

  it('updates camera aspect and renderer size on window resize', () => {
    new App();
    Object.defineProperty(window, 'innerWidth',  { value: 1280, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 720,  configurable: true });
    window.dispatchEvent(new Event('resize'));
    expect(lastCamera.aspect).toBe(1280 / 720);
    expect(mockUpdateProjectionMatrix).toHaveBeenCalled();
    expect(mockSetSize).toHaveBeenLastCalledWith(1280, 720);
  });
});
