import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          return parsed !== null && parsed !== undefined ? parsed : initialValue;
        }
      }
      return initialValue;
    } catch (error) {
      console.error(`Error al leer clave "${key}" de localStorage:`, error);
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key);
        }
      } catch (e) {
        console.error(e);
      }
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = typeof value === 'function' ? (value as (val: T) => T)(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}
