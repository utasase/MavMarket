import { useSyncExternalStore } from "react";

/**
 * In-memory store for listings that have been "purchased" in the demo
 * checkout flow. Demo mode has no backend to flip a listing's `status`
 * to `sold`, so we track the purchased IDs here and filter them out
 * of every listing surface (Home grid, Discover swipe deck, Saved list)
 * to keep the UX consistent with a real marketplace.
 */
const purchasedIds = new Set<string>();
let snapshot: readonly string[] = Object.freeze([]);
const listeners = new Set<() => void>();

function refreshSnapshot(): void {
  snapshot = Object.freeze(Array.from(purchasedIds));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): readonly string[] {
  return snapshot;
}

export function markListingPurchased(id: string | null | undefined): void {
  if (!id) return;
  if (purchasedIds.has(id)) return;
  purchasedIds.add(id);
  refreshSnapshot();
}

export function isListingPurchasedDemo(id: string): boolean {
  return purchasedIds.has(id);
}

export function getPurchasedListingIds(): readonly string[] {
  return snapshot;
}

export function clearPurchasedListings(): void {
  if (purchasedIds.size === 0) return;
  purchasedIds.clear();
  refreshSnapshot();
}

/**
 * React hook — returns a stable, frozen array of purchased listing IDs
 * that re-renders subscribers whenever a listing is marked as purchased.
 */
export function useDemoPurchasedIds(): readonly string[] {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
