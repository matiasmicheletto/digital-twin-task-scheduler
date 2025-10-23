import { useState, useEffect } from "react";

const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore =
                value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    // Sync state if localStorage is updated from another tab
    useEffect(() => {
        const handleStorage = (event) => {
            if (event.key === key) {
                try {
                    setStoredValue(event.newValue ? JSON.parse(event.newValue) : initialValue);
                } catch (error) {
                    console.error(`Error parsing localStorage event for key "${key}":`, error);
                }
            }
        };
        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, [key, initialValue]);

    return [storedValue, setValue];
};

export default useLocalStorage;