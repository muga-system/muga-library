"use client"

import { useEffect, useState } from "react"

export function ThemeInit() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Apply theme from localStorage or system preference on mount
    const stored = localStorage.getItem("theme")
    const theme = stored === "dark" || stored === "light" 
      ? stored 
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)
  }, [])

  if (!mounted) {
    return null
  }

  return null
}
