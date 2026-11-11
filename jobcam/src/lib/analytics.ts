import type { CaptureResult, PostHog } from 'posthog-js'

// Analytics never reads IndexedDB. Consent is local to this installation and is not backed up.
const CONSENT_KEY = `jobcam:analytics:v1:${import.meta.env.BASE_URL}`
export const ANALYTICS_CHANGED = 'jobcam:analytics'
const EVENTS = ['jobcam_app_opened', 'jobcam_screen_viewed', 'jobcam_project_created', 'jobcam_media_added', 'jobcam_report_generated', 'jobcam_backup_exported', 'jobcam_walk_saved'] as const
export type AnalyticsEvent = (typeof EVENTS)[number]
export type Screen = 'projects' | 'project' | 'capture' | 'walk' | 'settings' | 'other'
type Properties = { screen?: Screen; media_type?: 'photo' | 'video'; action?: 'open' | 'download'; source?: 'form' | 'walk' }
let client: PostHog | undefined
let loading: Promise<PostHog | undefined> | undefined
let memoryOptOut = false
let lastScreen: Screen | undefined

export function analyticsConfigured(): boolean {
  return !!import.meta.env.VITE_POSTHOG_PROJECT_TOKEN && /^https:\/\/[^\s]+$/.test(import.meta.env.VITE_POSTHOG_HOST ?? '')
}

export function analyticsEnabled(): boolean {
  if (memoryOptOut) return false
  try { return localStorage.getItem(CONSENT_KEY) === 'yes' } catch { return false }
}

export function screenForPath(path: string): Screen {
  if (path === '/') return 'projects'
  if (/^\/p\/[^/]+\/?$/.test(path)) return 'project'
  if (path === '/capture' || path === '/walk' || path === '/settings') return path.slice(1) as Screen
  return 'other'
}

// Rebuild the payload rather than blacklisting sensitive field names. SDK-added URLs,
// referrers, query strings, user properties, form values and project IDs are discarded too.
export function filterAnalyticsEvent(event: CaptureResult | null): CaptureResult | null {
  if (!event || !analyticsEnabled() || !EVENTS.includes(event.event as AnalyticsEvent)) return null
  const input = event.properties
  const properties: Record<string, unknown> = {
    app: 'jobcam', build: __BUILD__,
    environment: import.meta.env.VITE_POSTHOG_ENVIRONMENT === 'production' ? 'production' : 'development',
    $geoip_disable: true, $process_person_profile: false,
  }
  for (const key of ['token', 'distinct_id', '$device_id', '$session_id', '$window_id', '$lib', '$lib_version']) {
    if (typeof input[key] === 'string') properties[key] = input[key]
  }
  if (event.event === 'jobcam_screen_viewed' && ['projects', 'project', 'capture', 'walk', 'settings', 'other'].includes(input.screen)) properties.screen = input.screen
  if (event.event === 'jobcam_media_added' && ['photo', 'video'].includes(input.media_type)) properties.media_type = input.media_type
  if (event.event === 'jobcam_report_generated' && ['open', 'download'].includes(input.action)) properties.action = input.action
  if (event.event === 'jobcam_project_created' && ['form', 'walk'].includes(input.source)) properties.source = input.source
  return { uuid: event.uuid, event: event.event, timestamp: event.timestamp, properties }
}

async function getClient(): Promise<PostHog | undefined> {
  if (!analyticsEnabled() || !analyticsConfigured()) return
  if (client) return client
  loading ??= import('posthog-js').then(({ default: posthog }) => {
    if (!analyticsEnabled()) return
    posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN, {
      api_host: import.meta.env.VITE_POSTHOG_HOST,
      defaults: '2026-08-30',
      // Browser tests use development events; production retains the SDK's bot filter.
      opt_out_useragent_filter: import.meta.env.VITE_POSTHOG_ENVIRONMENT === 'development',
      autocapture: false, capture_pageview: false, capture_pageleave: false,
      rageclick: false, capture_dead_clicks: false, capture_heatmaps: false,
      capture_exceptions: false, capture_performance: false,
      disable_session_recording: true, enable_recording_console_log: false,
      disable_surveys: true, disable_external_dependency_loading: true,
      advanced_disable_feature_flags: true, person_profiles: 'never',
      persistence: 'localStorage', persistence_name: `jobcam_${import.meta.env.BASE_URL.replace(/\W/g, '_')}`,
      cross_subdomain_cookie: false, ip: false,
      before_send: filterAnalyticsEvent,
    })
    posthog.opt_in_capturing()
    client = posthog
    return client
  }).catch(() => undefined).finally(() => { loading = undefined })
  return loading
}

/** Best effort only: a blocked analytics request must never prevent saving a job. */
export function captureAnalytics(event: AnalyticsEvent, properties: Properties = {}): void {
  if (!analyticsEnabled()) return
  void getClient().then((sdk) => {
    if (analyticsEnabled()) sdk?.capture(event, properties)
  }).catch(() => {})
}

export function trackScreen(path: string): void {
  if (!analyticsEnabled() || !analyticsConfigured()) return
  const screen = screenForPath(path)
  if (lastScreen === screen) return
  lastScreen = screen
  captureAnalytics('jobcam_screen_viewed', { screen })
}

/** Returns false when browser storage could not persist the preference. */
export function setAnalyticsConsent(enabled: boolean): boolean {
  let saved = true
  try { localStorage.setItem(CONSENT_KEY, enabled ? 'yes' : 'no'); memoryOptOut = false } catch { memoryOptOut = true; saved = false }
  lastScreen = undefined
  if (!enabled || !saved) {
    try { client?.reset(); client?.opt_out_capturing() } catch { /* keep the app usable */ }
  } else {
    try { client?.opt_in_capturing() } catch { /* best effort */ }
    captureAnalytics('jobcam_app_opened')
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(ANALYTICS_CHANGED))
  return saved
}
