import { useState, useEffect } from 'react'
import { Capacitor } from '@capacitor/core'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(
    () => Capacitor.isNativePlatform() || window.innerWidth < 768
  )

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return isMobile
}
