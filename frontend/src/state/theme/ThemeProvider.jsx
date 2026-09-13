import { useEffect, useState } from 'react'
import { ThemeContext } from './ThemeContext.js'

function getInitialMode() {
  const saved = localStorage.getItem('tripguard-theme')
  return saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'dark'
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(getInitialMode)

  useEffect(() => {
    localStorage.setItem('tripguard-theme', mode)
    const resolved = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : mode
    document.documentElement.dataset.theme = resolved
  }, [mode])

  return <ThemeContext.Provider value={{ mode, setMode }}>{children}</ThemeContext.Provider>
}

