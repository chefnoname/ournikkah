import { useFavouritesStore } from '@/store/favourites';
import type { Item } from '@/types';
import { useCallback } from 'react';

export function useFavourites() {
  const favourites = useFavouritesStore((s) => s.favourites);
  const addFavourite = useFavouritesStore((s) => s.addFavourite);
  const removeFavourite = useFavouritesStore((s) => s.removeFavourite);
  const isFavourite = useFavouritesStore((s) => s.isFavourite);

  const toggleFavourite = useCallback(
    (item: Item) => {
      if (isFavourite(item.id)) {
        removeFavourite(item.id);
      } else {
        addFavourite(item);
      }
    },
    [isFavourite, addFavourite, removeFavourite],
  );

  return { favourites, toggleFavourite, isFavourite };
}
