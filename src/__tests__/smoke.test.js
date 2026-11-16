import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('loads test environment', () => {
    expect(1 + 1).toBe(2);
  });
});
