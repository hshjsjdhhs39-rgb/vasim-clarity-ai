import type { GestureEvent, GestureType } from '../types/gesture';

export type Landmark = {
  x: number;
  y: number;
  z?: number;
};

const INDEX_TIP = 8;
const MIDDLE_TIP = 12;
const RING_TIP = 16;
const PINKY_TIP = 20;
const THUMB_TIP = 4;
const WRIST = 0;

const DISTANCE_THRESHOLD = 0.12;

const distance = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));

const isFingerExtended = (tip: Landmark, pip: Landmark, wrist: Landmark) => {
  const tipToWrist = distance(tip, wrist);
  const pipToWrist = distance(pip, wrist);
  return tipToWrist > pipToWrist;
};

const mean = (values: number[]) => values.reduce((acc, value) => acc + value, 0) / values.length;

export const detectGesture = (landmarks: Landmark[]): GestureEvent => {
  if (landmarks.length < 21) {
    return { type: 'idle', confidence: 0 };
  }

  const wrist = landmarks[WRIST];

  const fingersExtended = {
    thumb: isFingerExtended(landmarks[THUMB_TIP], landmarks[2], wrist),
    index: isFingerExtended(landmarks[INDEX_TIP], landmarks[6], wrist),
    middle: isFingerExtended(landmarks[MIDDLE_TIP], landmarks[10], wrist),
    ring: isFingerExtended(landmarks[RING_TIP], landmarks[14], wrist),
    pinky: isFingerExtended(landmarks[PINKY_TIP], landmarks[18], wrist)
  };

  const extendedCount = Object.values(fingersExtended).filter(Boolean).length;

  if (extendedCount === 0) {
    return { type: 'fist', confidence: 0.9 };
  }

  if (extendedCount === 5) {
    return { type: 'open-palm', confidence: 0.9 };
  }

  if (fingersExtended.thumb && !fingersExtended.index && !fingersExtended.middle && !fingersExtended.ring && !fingersExtended.pinky) {
    const verticality = landmarks[THUMB_TIP].y < wrist.y ? 1 : 0.5;
    return { type: 'thumbs-up', confidence: 0.8 * verticality };
  }

  if (fingersExtended.index && !fingersExtended.middle && !fingersExtended.ring && !fingersExtended.pinky) {
    const spread = mean([
      distance(landmarks[INDEX_TIP], landmarks[MIDDLE_TIP]),
      distance(landmarks[INDEX_TIP], landmarks[RING_TIP])
    ]);
    const confidence = Math.min(1, Math.max(0, 1 - spread / DISTANCE_THRESHOLD));
    return { type: 'point', confidence: 0.7 + confidence * 0.3 };
  }

  return { type: 'idle', confidence: 0.2 };
};

export const mapGestureToAction = (gesture: GestureType) => {
  switch (gesture) {
    case 'point':
      return 'draw';
    case 'open-palm':
      return 'color';
    case 'fist':
      return 'clear';
    case 'thumbs-up':
      return 'generate';
    default:
      return 'idle';
  }
};
