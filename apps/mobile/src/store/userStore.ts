import { create } from 'zustand';
import type { User } from '@asaase/shared';

interface UserState {
  user: User | null;
  status: 'loading' | 'ready' | 'error';
  errorMessage: string | null;
  
  // Actions
  setUser: (user: User) => void;
  setStatus: (status: 'loading' | 'ready' | 'error', errorMessage?: string) => void;
  incrementXp: (amount: number) => void;
  updateStreak: (newStreak: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  status: 'loading',
  errorMessage: null,

  setUser: (user) => set({ user, status: 'ready', errorMessage: null }),
  
  setStatus: (status, errorMessage = null) => set({ status, errorMessage }),
  
  incrementXp: (amount) => set((state) => ({
    user: state.user ? { ...state.user, xp: state.user.xp + amount } : null
  })),
  
  updateStreak: (newStreak) => set((state) => ({
    user: state.user ? { ...state.user, streak: newStreak } : null
  }))
}));
