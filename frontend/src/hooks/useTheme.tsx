import { useState, useEffect } from 'react';

export function useTheme() {
  // Empezamos con 'light' por defecto para evitar inconsistencias en el primer render
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Sincronizamos con localStorage y el sistema solo al montar
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = (saved === 'dark' || saved === 'light') ? saved : systemTheme;
    
    setTheme(initialTheme);
  }, []);

  // Aplicamos los cambios al DOM cada vez que cambie el tema
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return { theme, toggleTheme };
}
