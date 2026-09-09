/**
 * Vinta School OS — Theme Store
 * Dark/light mode management with localStorage persistence
 */

import { create } from 'zustand'
import { THEME_KEY } from '../lib/constants'

type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
  initTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light'
    set({ theme: newTheme })
    applyTheme(newTheme)
    saveTheme(newTheme)
  },

  setTheme: (theme: Theme) => {
    set({ theme })
    applyTheme(theme)
    saveTheme(theme)
  },

  initTheme: () => {
    const saved = loadTheme()
    set({ theme: saved })
    applyTheme(saved)
  },
}))

// ============================================
// Helpers
// ============================================

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)

  // Also apply to body for gradient backgrounds
  if (theme === 'dark') {
    document.body.classList.add('dark')
    document.body.classList.remove('light')
  } else {
    document.body.classList.add('light')
    document.body.classList.remove('dark')
  }
}

function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Ignore
  }
}

function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'dark' || saved === 'light') {
      return saved
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  } catch {
    // Ignore
  }
  return 'light'
}
