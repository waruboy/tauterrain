import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUpdateProjectionMatrix = vi.fn();
const mockSetSize = vi.fn();
const mockRender = vi.fn();
const mockAdd = vi.fn();
const mockControlsUpdate = vi.fn();
const mockListenToKeyEvents = vi.fn();

let mockCanvas;
let lastCamera;
let createdMeshes;

vi.mock('three', () => {
  mockCanvas = document.createElement('canvas');
  createdMeshes = [];
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
    PlaneGeometry: vi.fn(function() {}),
    MeshBasicMaterial: vi.fn(function() {}),
    CanvasTexture: vi.fn(function() { return { wrapS: 0, wrapT: 0, repeat: { set: vi.fn() } }; }),
    Mesh: vi.fn(function(geometry, material) {
      const mesh = { geometry, material, position: { y: 0 }, rotation: { x: 0 } };
      createdMeshes.push(mesh);
      return mesh;
    }),
    RepeatWrapping: 1000,
  };
});

vi.mock('three/addons/controls/OrbitControls.js', () => ({
  OrbitControls: vi.fn(function() {
    return { update: mockControlsUpdate, listenToKeyEvents: mockListenToKeyEvents };
  }),
}));

HTMLCanvasElement.prototype.getContext = () => ({ fillStyle: '', fillRect: vi.fn() });

const { App } = await import('./main.js');

describe('App', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    createdMeshes = [];
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

  it('adds both cube and ground to the scene', () => {
    new App();
    expect(mockAdd).toHaveBeenCalledTimes(2);
  });

  it('positions the cube at y = 1', () => {
    new App();
    const cube = createdMeshes[0];
    expect(cube.position.y).toBe(1);
  });

  it('places the ground at y = 0 rotated flat', () => {
    new App();
    const ground = createdMeshes[1];
    expect(ground.position.y).toBe(0);
    expect(ground.rotation.x).toBeCloseTo(-Math.PI / 2);
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
