export type GestureType =
  | 'idle'
  | 'point'
  | 'open-palm'
  | 'fist'
  | 'thumbs-up';

export type GestureEvent = {
  type: GestureType;
  confidence: number;
};

export type HandTrackingConfig = {
  maxHands: number;
  runningMode: 'VIDEO' | 'IMAGE';
  minConfidence: number;
  smoothFactor: number;
};
