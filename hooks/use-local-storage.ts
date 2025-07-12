import { useState, useEffect, useCallback } from 'react';

// Hook to use local storage like a state hook
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, boolean] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      // If error also return initialValue
      console.log(error);
    } finally {
      setInitialized(true);
    }
  }, [key]);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue, initialized];
} 