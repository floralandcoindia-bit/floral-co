import { useSyncExternalStore } from "react";

let loaded = false;
const listeners = new Set();

export const markLoaded = () => {
  loaded = true;
  listeners.forEach((l) => l());
};
export const useLoaded = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => loaded,
    () => true
  );
