import { useState, useEffect } from 'react';

export const useDebounce = (value, delay = 400) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timer khi value thay đổi hoặc component unmount
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};