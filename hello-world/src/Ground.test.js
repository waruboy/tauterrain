import { describe, it, expect, vi, beforeEach } from 'vitest';

let createdMeshes;

vi.mock('three', () => {
  createdMeshes = [];
  return {
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

HTMLCanvasElement.prototype.getContext = () => ({ fillStyle: '', fillRect: vi.fn() });

const { Ground } = await import('./Ground.js');

describe('Ground', () => {
  beforeEach(() => {
    createdMeshes = [];
    vi.clearAllMocks();
  });

  it('exposes a Three.js object via .object', () => {
    const ground = new Ground();
    expect(ground.object).toBeDefined();
  });

  it('lays flat at y = 0', () => {
    const ground = new Ground();
    expect(ground.object.position.y).toBe(0);
    expect(ground.object.rotation.x).toBeCloseTo(-Math.PI / 2);
  });
});
