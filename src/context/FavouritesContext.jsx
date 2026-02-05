import React, { createContext, useCallback, useMemo, useState } from 'react';

export const FavouritesContext = createContext({});

function normalizeFavourite(raw) {
  if (!raw) return null;

  const id = raw.favouriteId || raw.id;
  if (!id) return null;

  return {
    id: String(id),
    menuItemId: raw.menuItemId ?? raw.itemId ?? null,
    restaurantId: raw.restaurantId ?? null,
    restaurantName: raw.restaurantName ?? raw.restaurant?.name ?? 'Restaurant',
    name: raw.name ?? 'Item',
    image: raw.image ?? null,
    description: raw.description ?? '',
    price: raw.price ?? raw.basePrice ?? 0,
    basePrice: raw.basePrice ?? raw.price ?? 0,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

export const FavouritesProvider = ({ children }) => {
  const [favourites, setFavourites] = useState([]);

  const isFavourite = useCallback(
    id => {
      const key = String(id ?? '');
      if (!key) return false;
      return favourites.some(f => f.id === key);
    },
    [favourites],
  );

  const addFavourite = useCallback(raw => {
    const fav = normalizeFavourite(raw);
    if (!fav) return;

    setFavourites(prev => {
      const exists = prev.some(x => x.id === fav.id);
      if (exists) return prev;
      return [fav, ...prev];
    });
  }, []);

  const removeFavourite = useCallback(id => {
    const key = String(id ?? '');
    setFavourites(prev => prev.filter(f => f.id !== key));
  }, []);

  const toggleFavourite = useCallback(raw => {
    const fav = normalizeFavourite(raw);
    if (!fav) return { added: false };

    let added = false;
    setFavourites(prev => {
      const exists = prev.some(x => x.id === fav.id);
      if (exists) {
        added = false;
        return prev.filter(x => x.id !== fav.id);
      }
      added = true;
      return [fav, ...prev];
    });

    return { added };
  }, []);

  const favouritesCount = useMemo(() => favourites.length, [favourites]);

  const value = useMemo(
    () => ({
      favourites,
      favouritesCount,
      isFavourite,
      addFavourite,
      removeFavourite,
      toggleFavourite,
    }),
    [
      favourites,
      favouritesCount,
      isFavourite,
      addFavourite,
      removeFavourite,
      toggleFavourite,
    ],
  );

  return (
    <FavouritesContext.Provider value={value}>
      {children}
    </FavouritesContext.Provider>
  );
};

export default FavouritesContext;
