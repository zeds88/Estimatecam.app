import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ANALYTICS_CHANGED, trackScreen } from '../lib/analytics'

export default function AnalyticsScreenTracker() {
  const { pathname } = useLocation()
  useEffect(() => {
    const track = () => trackScreen(pathname)
    track()
    window.addEventListener(ANALYTICS_CHANGED, track)
    return () => window.removeEventListener(ANALYTICS_CHANGED, track)
  }, [pathname])
  return null
}
