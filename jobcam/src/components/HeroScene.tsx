import { HERO_DEMO_PHASES } from '../lib/heroDemo'
import { Pause, Play } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'

type Connection = EventTarget & { saveData?: boolean }
const connection = () => (navigator as Navigator & { connection?: Connection }).connection
const onlineStatus = () => navigator.onLine
const narrowViewport = () => window.matchMedia('(max-width: 600px)').matches
function subscribeViewport(changed: () => void) {
  const query = window.matchMedia('(max-width: 600px)')
  query.addEventListener('change', changed)
  return () => query.removeEventListener('change', changed)
}
const motionAllowed = () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !connection()?.saveData
function subscribeMotion(changed: () => void) {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  const network = connection()
  query.addEventListener('change', changed)
  network?.addEventListener('change', changed)
  window.addEventListener('online', changed)
  window.addEventListener('offline', changed)
  return () => { query.removeEventListener('change', changed); network?.removeEventListener('change', changed); window.removeEventListener('online', changed); window.removeEventListener('offline', changed) }
}
const media = (name: string) => `${import.meta.env.BASE_URL}beta/${name}`

/** Real field footage and a fictional project recorded in the actual app. */
export default function HeroScene({ children }: { children: ReactNode }) {
  const autoAllowed = useSyncExternalStore(subscribeMotion, motionAllowed, () => false)
  const online = useSyncExternalStore(subscribeMotion, onlineStatus, () => true)
  const narrow = useSyncExternalStore(subscribeViewport, narrowViewport, () => false)
  const fieldFile = narrow ? 'hero-field-mobile.mp4' : 'hero-field.mp4'
  const [manualPlayback, setManualPlayback] = useState<boolean | null>(null)
  const [playing, setPlaying] = useState(false)
  const [chapter, setChapter] = useState(0)
  const section = useRef<HTMLElement>(null)
  const field = useRef<HTMLVideoElement>(null)
  const app = useRef<HTMLVideoElement>(null)
  const shouldPlay = online && (manualPlayback ?? autoAllowed)
  const shouldLoad = online && (autoAllowed || manualPlayback !== null)

  useEffect(() => {
    const videos = [field.current, app.current].filter((video): video is HTMLVideoElement => !!video)
    let visible = true
    const sync = () => {
      for (const video of videos) {
        if (shouldPlay && shouldLoad && visible && !document.hidden) {
          video.muted = true
          video.playbackRate = video === field.current ? 0.8 : 1
          void video.play().catch(() => { /* Poster and manual play remain available. */ })
        } else video.pause()
      }
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
    if (section.current) observer.observe(section.current)
    document.addEventListener('visibilitychange', sync)
    sync()
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); videos.forEach((video) => video.pause()) }
  }, [shouldLoad, shouldPlay, fieldFile])

  const syncPlaying = () => setPlaying([field.current, app.current].some((video) => !!video && !video.paused && !video.ended && !video.error))

  const syncChapter = () => {
    const time = app.current?.currentTime ?? 0
    let index = 0
    HERO_DEMO_PHASES.forEach((phase, i) => { if (time >= phase.at) index = i })
    setChapter(index)
  }

  const toggle = () => {
    const start = !playing
    setManualPlayback(start)
    // Start directly from the gesture for Safari and other strict autoplay policies.
    for (const [video, name] of [[field.current, fieldFile], [app.current, 'hero-app.mp4']] as const) {
      if (!video) continue
      if (!start) { video.pause(); continue }
      if (!video.getAttribute('src')) video.src = media(name)
      if (video.error) video.load()
      video.muted = true
      video.playbackRate = video === field.current ? 0.8 : 1
      void video.play().catch(() => { /* Retain the still poster if playback is unavailable. */ })
    }
  }

  return <section ref={section} className="beta-hero beta-video-hero" aria-labelledby="beta-title">
    <picture><source media="(max-width: 600px)" srcSet={media('hero-field-mobile-poster.jpg')} /><img className="beta-hero-image" src={media('hero-field-poster.jpg')} alt="First-person view of a contractor assessing a landscaped courtyard" width="960" height="540" fetchPriority="high" /></picture>
    <video ref={field} className="beta-hero-video" src={shouldLoad ? media(fieldFile) : undefined} poster={media(narrow ? 'hero-field-mobile-poster.jpg' : 'hero-field-poster.jpg')} autoPlay={shouldPlay} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} onPlaying={syncPlaying} onPause={syncPlaying} onError={syncPlaying} />
    <div className="beta-container beta-hero-inner">{children}
      <figure className="beta-phone-demo" aria-label="Ironvale Outdoor Co., a fictional company, demonstrated in the real Estimate Cam app">
        <div className="beta-phone-frame"><span className="beta-phone-speaker" aria-hidden="true" /><video ref={app} src={shouldLoad ? media('hero-app.mp4') : undefined} poster={media('hero-app-poster.png')} autoPlay={shouldPlay} muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} onPlaying={syncPlaying} onPause={syncPlaying} onError={syncPlaying} onTimeUpdate={syncChapter} /></div>
        <figcaption>{HERO_DEMO_PHASES[chapter].title}<span>{HERO_DEMO_PHASES[chapter].detail}</span><small>Ironvale Outdoor Co. · Fictional demo</small></figcaption>
      </figure>
    </div>
    <div className="beta-hero-media-controls"><button type="button" onClick={toggle} disabled={!online} aria-label={!online ? 'Video available online' : playing ? 'Pause hero video' : 'Play hero video'}>{playing ? <Pause size={15} /> : <Play size={15} />}<span>{!online ? 'Video available online' : playing ? 'Pause video' : 'Play video'}</span></button><p>Real app demonstration · Sample scope, quantities and prices</p></div>
  </section>
}
