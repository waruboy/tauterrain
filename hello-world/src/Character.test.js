import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockGroupAdd;

vi.mock('three', () => ({
  BoxGeometry: vi.fn(function() {}),
  MeshBasicMaterial: vi.fn(function() {}),
  Mesh: vi.fn(function(geometry, material) {
    return { geometry, material, position: { y: 0, set: vi.fn() }, rotation: { x: 0, z: 0 } };
  }),
  Group: vi.fn(function() {
    mockGroupAdd = vi.fn();
    return { add: mockGroupAdd, position: { x: 0, y: 0, z: 0 }, rotation: { y: 0 } };
  }),
}));

const { Character } = await import('./Character.js');

describe('Character', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes a Three.js object via .object', () => {
    const character = new Character();
    expect(character.object).toBeDefined();
  });

  it('adds 6 parts to the group (body, head, 2 arms, cap crown, cap brim)', () => {
    new Character();
    expect(mockGroupAdd).toHaveBeenCalledTimes(6);
  });

  it('moves forward on w scaled by delta', () => {
    const character = new Character();
    const before = character.position.z;
    character.update(0.016, { w: true });
    expect(character.position.z).toBeGreaterThan(before);
  });

  it('moves backward on s scaled by delta', () => {
    const character = new Character();
    const before = character.position.z;
    character.update(0.016, { s: true });
    expect(character.position.z).toBeLessThan(before);
  });

  it('turns left on a scaled by delta', () => {
    const character = new Character();
    const before = character.rotationY;
    character.update(0.016, { a: true });
    expect(character.rotationY).toBeGreaterThan(before);
  });

  it('turns right on d scaled by delta', () => {
    const character = new Character();
    const before = character.rotationY;
    character.update(0.016, { d: true });
    expect(character.rotationY).toBeLessThan(before);
  });

  it('does not move when no keys are pressed', () => {
    const character = new Character();
    const before = { x: character.position.x, z: character.position.z, y: character.rotationY };
    character.update(0.016, {});
    expect(character.position.x).toBe(before.x);
    expect(character.position.z).toBe(before.z);
    expect(character.rotationY).toBe(before.y);
  });
});
