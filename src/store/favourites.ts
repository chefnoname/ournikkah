import type { Item } from '@/types';
import { create } from 'zustand';

interface FavouritesState {
  favourites: Item[];
  addFavourite: (item: Item) => void;
  removeFavourite: (id: number) => void;
  isFavourite: (id: number) => boolean;
}

export const useFavouritesStore = create<FavouritesState>((set, get) => ({
  favourites: [],

  addFavourite: (item) =>
    set((state) => {
      if (state.favourites.some((f) => f.id === item.id)) return state;
      return { favourites: [...state.favourites, item] };
    }),

  removeFavourite: (id) =>
    set((state) => ({
      favourites: state.favourites.filter((f) => f.id !== id),
    })),

  isFavourite: (id) => get().favourites.some((f) => f.id === id),
}));
