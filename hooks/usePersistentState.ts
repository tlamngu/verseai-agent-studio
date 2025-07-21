import { useState, useEffect } from 'react';

/**
 * A custom hook that persists state to localStorage.
 * It's a drop-in replacement for useState that automatically saves the state
 * to the browser's local storage whenever it changes.
 * @param key The key to use for storing the value in localStorage.
 * @param initialValue The initial value to use if nothing is stored.
 * @returns A stateful value, and a function to update it.
 */
export function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(`Error setting localStorage key “${key}”:`, error);
        }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
