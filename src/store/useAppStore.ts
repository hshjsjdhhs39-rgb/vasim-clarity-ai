import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { GeneratedAsset } from '../types/genai';
import type { GestureType } from '../types/gesture';

type AppState = {
  colors: string[];
  colorIndex: number;
  prompt: string;
  lowPowerMode: boolean;
  statusMessage: string;
  gesture: GestureType;
  assets: GeneratedAsset[];
};

type AppActions = {
  setPrompt: (value: string) => void;
  nextColor: () => void;
  setStatus: (message: string) => void;
  setGesture: (gesture: GestureType) => void;
  addAsset: (asset: GeneratedAsset) => void;
  clearAssets: () => void;
  setLowPowerMode: (value: boolean) => void;
  resetStatus: () => void;
};

const palette = ['#f97316', '#22d3ee', '#a855f7', '#facc15', '#34d399', '#f43f5e'];

export const useAppStore = create<AppState & AppActions>()(
  devtools((set) => ({
    colors: palette,
    colorIndex: 0,
    prompt: '',
    lowPowerMode: false,
    statusMessage: '',
    gesture: 'idle',
    assets: [],
    setPrompt: (value) => set({ prompt: value }),
    nextColor: () =>
      set((state) => ({
        colorIndex: (state.colorIndex + 1) % state.colors.length
      })),
    setStatus: (message) => set({ statusMessage: message }),
    setGesture: (gesture) => set({ gesture }),
    addAsset: (asset) =>
      set((state) => ({
        assets: [asset, ...state.assets].slice(0, 8)
      })),
    clearAssets: () => set({ assets: [] }),
    setLowPowerMode: (value) => set({ lowPowerMode: value }),
    resetStatus: () => set({ statusMessage: '' })
  }))
);

export const selectCurrentColor = (state: AppState) => state.colors[state.colorIndex];
