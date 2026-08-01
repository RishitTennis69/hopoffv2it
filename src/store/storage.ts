import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';

const serverStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

// Shared JSON storage for all persisted zustand stores.
// Expo Router's web server render has no window, so persistence must be inert there.
export const persistStorage = createJSONStorage(() =>
  typeof window === 'undefined' ? serverStorage : AsyncStorage,
);
