import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { DEMO_MODE } from "../data/mockData";
import { useAuth } from "./auth-context";
import { getListingsByIds } from "./listings";
import {
  getSavedListingIds,
  saveItem as persistSave,
  unsaveItem as persistUnsave,
} from "./saved";
import { type ListingItem } from "./types";

type SavedContextValue = {
  savedIds: string[];
  savedItems: ListingItem[];
  isSaved: (id: string) => boolean;
  toggleSave: (item: ListingItem) => void;
  setSaved: (item: ListingItem, saved: boolean) => void;
  refresh: () => Promise<void>;
};

const SavedContext = createContext<SavedContextValue | undefined>(undefined);

export function SavedProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const itemMapRef = useRef<Map<string, ListingItem>>(new Map());
  const [mapVersion, setMapVersion] = useState(0);

  const bumpMap = () => setMapVersion((v) => v + 1);

  const refresh = useCallback(async () => {
    if (!user || DEMO_MODE) return;
    try {
      const ids = await getSavedListingIds(user.id);
      setSavedIds(ids);
      const missing = ids.filter((id) => !itemMapRef.current.has(id));
      if (missing.length > 0) {
        const hydrated = await getListingsByIds(missing);
        hydrated.forEach((item) => itemMapRef.current.set(item.id, item));
        bumpMap();
      }
    } catch {
      // Swallow: keep whatever we already have cached.
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSavedIds([]);
      itemMapRef.current = new Map();
      bumpMap();
      return;
    }
    if (DEMO_MODE) return;
    refresh();
  }, [user, refresh]);

  const setSaved = useCallback(
    (item: ListingItem, saved: boolean) => {
      itemMapRef.current.set(item.id, item);
      bumpMap();
      setSavedIds((prev) => {
        const has = prev.includes(item.id);
        if (saved && !has) return [...prev, item.id];
        if (!saved && has) return prev.filter((i) => i !== item.id);
        return prev;
      });

      if (!user || DEMO_MODE) return;

      const op = saved
        ? persistSave(user.id, item.id)
        : persistUnsave(user.id, item.id);
      op.catch(() => {
        setSavedIds((prev) => {
          const has = prev.includes(item.id);
          if (saved && has) return prev.filter((i) => i !== item.id);
          if (!saved && !has) return [...prev, item.id];
          return prev;
        });
      });
    },
    [user]
  );

  const toggleSave = useCallback(
    (item: ListingItem) => {
      const currentlySaved = savedIds.includes(item.id);
      setSaved(item, !currentlySaved);
    },
    [savedIds, setSaved]
  );

  const isSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds]
  );

  const savedItems = useMemo(() => {
    void mapVersion;
    const map = itemMapRef.current;
    return savedIds
      .map((id) => map.get(id))
      .filter((item): item is ListingItem => Boolean(item));
  }, [savedIds, mapVersion]);

  const value = useMemo<SavedContextValue>(
    () => ({
      savedIds,
      savedItems,
      isSaved,
      toggleSave,
      setSaved,
      refresh,
    }),
    [savedIds, savedItems, isSaved, toggleSave, setSaved, refresh]
  );

  return (
    <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
  );
}

export function useSaved(): SavedContextValue {
  const ctx = useContext(SavedContext);
  if (!ctx) {
    throw new Error("useSaved must be used within a SavedProvider");
  }
  return ctx;
}
