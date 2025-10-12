import { describe, expect, it } from 'vitest';
import { detectGesture } from '../../src/services/gestures';

const createHand = (overrides: Partial<Record<number, { x: number; y: number; z?: number }>>) => {
  const landmarks = Array.from({ length: 21 }, (_, index) => ({ x: 0.5, y: 0.5, z: 0 }));
  Object.entries(overrides).forEach(([key, value]) => {
    landmarks[Number(key)] = { ...landmarks[Number(key)], ...value };
  });
  return landmarks;
};

describe('detectGesture', () => {
  it('detects open palm when all fingers extended', () => {
    const landmarks = createHand({
      8: { y: 0.1 },
      12: { y: 0.1 },
      16: { y: 0.1 },
      20: { y: 0.1 },
      4: { y: 0.1 }
    });
    const result = detectGesture(landmarks);
    expect(result.type).toBe('open-palm');
  });

  it('detects fist when no fingers extended', () => {
    const landmarks = createHand({
      8: { y: 0.6 },
      12: { y: 0.6 },
      16: { y: 0.6 },
      20: { y: 0.6 },
      4: { y: 0.6 }
    });
    const result = detectGesture(landmarks);
    expect(result.type).toBe('fist');
  });

  it('detects point when only index finger extended', () => {
    const landmarks = createHand({
      8: { y: 0.2 },
      12: { y: 0.6 },
      16: { y: 0.6 },
      20: { y: 0.6 },
      4: { y: 0.6 }
    });
    const result = detectGesture(landmarks);
    expect(result.type).toBe('point');
  });
});
