'use client'

// Tailwind's `dark:` classes look for a `dark` class on <html> (see globals.css).
// This keeps that class in sync with the phone's light/dark setting, on every page.
import { useEffect } from 'react'

export function ThemeSync() {
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      document.documentElement.classList.toggle('dark', query.matches)
      document.documentElement.classList.toggle('light', !query.matches)
    }
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [])
  return null
}
