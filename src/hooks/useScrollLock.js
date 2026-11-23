import { useEffect } from "react";
import { getLenis } from "../utils/scroll";

let locks = 0; // supports overlapping locks (menu + modal)

export function useScrollLock(active = true) {
  useEffect(() => {
    if (!active) return undefined;
    locks += 1;
    if (locks === 1) {
      document.documentElement.style.overflow = "hidden";
      getLenis()?.stop();
    }
    return () => {
      locks -= 1;
      if (locks === 0) {
        document.documentElement.style.overflow = "";
        getLenis()?.start();
      }
    };
  }, [active]);
}
