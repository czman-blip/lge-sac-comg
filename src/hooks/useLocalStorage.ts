import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// Debounce delay for localStorage saves
const SAVE_DEBOUNCE_MS = 500;

// Maximum localStorage usage before warning (5MB)
const STORAGE_WARNING_THRESHOLD = 5 * 1024 * 1024;

/**
 * Calculate approximate localStorage usage
 */
export const getLocalStorageSize = (): number => {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += localStorage.getItem(key)?.length || 0;
    }
  }
  // Each character is 2 bytes in JS strings
  return total * 2;
};

/**
 * Safely save to localStorage with error handling
 */
export const safeLocalStorageSave = (key: string, data: unknown): boolean => {
  try {
    const serialized = JSON.stringify(data);
    
    // Check if this save would push us over the warning threshold
    const currentSize = getLocalStorageSize();
    const newDataSize = serialized.length * 2;
    
    if (currentSize + newDataSize > STORAGE_WARNING_THRESHOLD) {
      console.warn(`localStorage usage is high: ${Math.round((currentSize + newDataSize) / 1024)}KB`);
    }
    
    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'QuotaExceededError' || error.message.includes('quota')) {
        toast.error('Storage is full. Some images may not be saved. Please remove some images.');
        console.error('localStorage quota exceeded:', error);
      } else {
        console.error('Failed to save to localStorage:', error);
      }
    }
    return false;
  }
};

/**
 * Safely load from localStorage with error handling
 */
export const safeLocalStorageLoad = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    return JSON.parse(stored) as T;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return defaultValue;
  }
};

/**
 * Hook for debounced localStorage saving
 */
export const useDebouncedSave = <T>(
  key: string,
  data: T,
  dependencies: unknown[],
  delay: number = SAVE_DEBOUNCE_MS
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render to avoid unnecessary saves on mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new debounced save
    timeoutRef.current = setTimeout(() => {
      safeLocalStorageSave(key, data);
    }, delay);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, dependencies);
};

/**
 * Clear old/unused localStorage entries
 */
export const cleanupLocalStorage = (keysToKeep: string[]): void => {
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToKeep.includes(key)) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove ${key} from localStorage:`, e);
    }
  });
};
