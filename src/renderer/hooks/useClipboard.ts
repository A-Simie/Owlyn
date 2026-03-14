import { useState, useCallback } from "react";

export function useClipboard(timeout = 2000) {
  const [hasCopied, setHasCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      if (window.owlyn?.clipboard) {
        await window.owlyn.clipboard.writeText(text);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), timeout);
      return true;
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
      return false;
    }
  }, [timeout]);

  return { copy, hasCopied };
}
