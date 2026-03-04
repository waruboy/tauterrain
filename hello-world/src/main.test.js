import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUpdateProjectionMatrix = vi.fn();
const mockSetSize = vi.fn();
const mockRender = vi.fn();
const mockAdd = vi.fn();
const mockLookAt = vi.fn();
const mockPositionSet = vi.fn();

let mockCanvas;
let lastCamera;
let createdMeshes;
let mockGroupAdd;

vi.mock('three', () => {
  mockCanvas = document.createElement('canvas');
  createdMeshes = [];
  return {
    Scene: vi.fn(function() { return { add: mockAdd }; }),
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
    BoxGeometry: vi.fn(function() {}),
    PlaneGeometry: vi.fn(function() {}),
    MeshBasicMaterial: vi.fn(function() {}),
    CanvasTexture: vi.fn(function() { return { wrapS: 0, wrapT: 0, repeat: { set: vi.fn() } }; }),
    Mesh: vi.fn(function(geometry, material) {
      const mesh = { geometry, material, position: { y: 0, set: vi.fn() }, rotation: { x: 0, z: 0 } };
      createdMeshes.push(mesh);
      return mesh;
    }),
    Group: vi.fn(function() {
      mockGroupAdd = vi.fn();
      return { add: mockGroupAdd, position: { y: 0 } };
    }),
    RepeatWrapping: 1000,
  };
});

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

  it('positions camera above and in front of the ground', () => {
    new App();
    expect(mockPositionSet).toHaveBeenCalledWith(0, 8, 5);
  });

  it('points camera at the origin', () => {
    new App();
    expect(mockLookAt).toHaveBeenCalledWith(0, 0, 0);
  });

  it('adds the ground and character to the scene', () => {
    new App();
    expect(mockAdd).toHaveBeenCalledTimes(2);
  });

  it('adds body, head, arms, and cap to the character group', () => {
    new App();
    expect(mockGroupAdd).toHaveBeenCalledTimes(6);
  });

  it('positions cap brim extending forward from head', () => {
    new App();
    const capBrim = createdMeshes[6];
    expect(capBrim.position.set).toHaveBeenCalledWith(0, 2.25, 0.575);
  });

  it('positions body bottom at y = 0 and head on top of body', () => {
    new App();
    const body = createdMeshes[1];
    const head = createdMeshes[2];
    expect(body.position.y).toBe(0.75);
    expect(head.position.y).toBe(1.875);
  });

  it('places right arm raised and left arm straight', () => {
    new App();
    const rightArm = createdMeshes[3];
    const leftArm  = createdMeshes[4];
    expect(rightArm.rotation.z).toBeCloseTo(-Math.PI / 4);
    expect(leftArm.rotation.z).toBe(0);
  });

  it('places the ground at y = 0 rotated flat', () => {
    new App();
    const ground = createdMeshes[0];
    expect(ground.position.y).toBe(0);
    expect(ground.rotation.x).toBeCloseTo(-Math.PI / 2);
  });

  it('renders each frame', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => {});
    const app = new App();
    app.animate();
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
