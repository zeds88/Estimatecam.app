import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CaptureResult } from 'posthog-js'

const sdk = vi.hoisted(() => ({ init: vi.fn(), capture: vi.fn(), reset: vi.fn(), opt_in_capturing: vi.fn(), opt_out_capturing: vi.fn() }))
vi.mock('posthog-js', () => ({ default: sdk }))

beforeEach(() => {
  vi.resetModules()
  vi.clearAllMocks()
  const data = new Map<string, string>()
  vi.stubGlobal('localStorage', { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) })
  vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', 'phc_test')
  vi.stubEnv('VITE_POSTHOG_HOST', 'https://us.i.posthog.com')
  vi.stubEnv('VITE_POSTHOG_ENVIRONMENT', 'development')
})
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })

describe('opt-in analytics privacy boundary', () => {
  it('does not initialize the SDK or capture anything without consent', async () => {
    const a = await import('./analytics')
    a.captureAnalytics('jobcam_project_created')
    a.trackScreen('/p/private-project')
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(a.analyticsEnabled()).toBe(false)
    expect(sdk.init).not.toHaveBeenCalled()
    expect(sdk.capture).not.toHaveBeenCalled()
  })

  it('fails closed when configuration is absent or insecure', async () => {
    const a = await import('./analytics')
    vi.stubEnv('VITE_POSTHOG_HOST', 'http://untrusted.test')
    expect(a.analyticsConfigured()).toBe(false)
    a.setAnalyticsConsent(true)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(sdk.init).not.toHaveBeenCalled()
    vi.stubEnv('VITE_POSTHOG_HOST', 'https://us.i.posthog.com')
    vi.stubEnv('VITE_POSTHOG_PROJECT_TOKEN', '')
    expect(a.analyticsConfigured()).toBe(false)
  })

  it('disables automatic capture and initializes only once after consent', async () => {
    const a = await import('./analytics')
    a.setAnalyticsConsent(true)
    a.captureAnalytics('jobcam_project_created', { source: 'form' })
    await vi.waitFor(() => expect(sdk.capture).toHaveBeenCalledWith('jobcam_project_created', { source: 'form' }))
    expect(sdk.init).toHaveBeenCalledTimes(1)
    expect(sdk.init.mock.calls[0][1]).toMatchObject({ autocapture: false, capture_pageview: false, capture_pageleave: false, disable_session_recording: true, capture_exceptions: false, capture_performance: false, advanced_disable_feature_flags: true, person_profiles: 'never', ip: false })
  })

  it('strips sensitive business data and SDK URL/person fields before transmission', async () => {
    const a = await import('./analytics')
    a.setAnalyticsConsent(true)
    const event: CaptureResult = { uuid: 'event-id', event: 'jobcam_media_added', $set: { email: 'private@example.test' }, $set_once: { address: 'private' }, properties: { distinct_id: 'random-id', token: 'phc_test', media_type: 'photo', email: 'private@example.test', projectId: 'private-id', caption: 'private note', apiKey: 'secret', lat: 32.7, $current_url: 'https://app.test/#/p/private?key=secret', $referrer: 'https://private.test', $initial_current_url: 'secret' } }
    const safe = a.filterAnalyticsEvent(event)!
    expect(safe.properties).toEqual({ app: 'jobcam', build: __BUILD__, environment: 'development', $geoip_disable: true, $process_person_profile: false, distinct_id: 'random-id', token: 'phc_test', media_type: 'photo' })
    expect(safe.$set).toBeUndefined()
    expect(safe.$set_once).toBeUndefined()
    expect(JSON.stringify(safe)).not.toMatch(/private|secret|caption|apiKey/)
  })

  it('rejects automatic events and unbounded values, even on allowed keys', async () => {
    const a = await import('./analytics')
    a.setAnalyticsConsent(true)
    const event = (name: string, properties = {}): CaptureResult => ({ uuid: 'id', event: name, properties })
    expect(a.filterAnalyticsEvent(event('$autocapture'))).toBeNull()
    expect(a.filterAnalyticsEvent(event('arbitrary'))).toBeNull()
    expect(a.filterAnalyticsEvent(event('jobcam_screen_viewed', { screen: '/p/private-id' }))?.properties.screen).toBeUndefined()
    expect(a.filterAnalyticsEvent(event('jobcam_media_added', { media_type: 'private-file.jpg' }))?.properties.media_type).toBeUndefined()
  })

  it('normalizes project routes and avoids duplicate StrictMode screen events', async () => {
    const a = await import('./analytics')
    a.setAnalyticsConsent(true)
    a.trackScreen('/p/private-project')
    a.trackScreen('/p/private-project')
    await vi.waitFor(() => expect(sdk.capture).toHaveBeenCalledWith('jobcam_screen_viewed', { screen: 'project' }))
    expect(sdk.capture.mock.calls.filter(([name]) => name === 'jobcam_screen_viewed')).toHaveLength(1)
    expect(a.screenForPath('/anything-private')).toBe('other')
    expect(a.screenForPath('/projects')).toBe('projects')
  })

  it('does not send queued actions when consent is revoked during lazy loading', async () => {
    const a = await import('./analytics')
    a.setAnalyticsConsent(true)
    a.captureAnalytics('jobcam_project_created')
    a.setAnalyticsConsent(false)
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(sdk.capture).not.toHaveBeenCalled()
    expect(a.filterAnalyticsEvent({ uuid: 'id', event: 'jobcam_app_opened', properties: {} })).toBeNull()
  })

  it('clears the anonymous identity on opt-out and can opt back in', async () => {
    const a = await import('./analytics')
    a.setAnalyticsConsent(true)
    await vi.waitFor(() => expect(sdk.capture).toHaveBeenCalled())
    a.setAnalyticsConsent(false)
    expect(sdk.reset).toHaveBeenCalledOnce()
    expect(sdk.opt_out_capturing).toHaveBeenCalledOnce()
    sdk.capture.mockClear()
    a.captureAnalytics('jobcam_backup_exported')
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(sdk.capture).not.toHaveBeenCalled()
    a.setAnalyticsConsent(true)
    await vi.waitFor(() => expect(sdk.capture).toHaveBeenCalledWith('jobcam_app_opened', {}))
  })

  it('keeps analytics off if storage is unavailable', async () => {
    const a = await import('./analytics')
    vi.stubGlobal('localStorage', { getItem: () => { throw Error('blocked') }, setItem: () => { throw Error('blocked') } })
    expect(a.analyticsEnabled()).toBe(false)
    expect(a.setAnalyticsConsent(true)).toBe(false)
    expect(a.analyticsEnabled()).toBe(false)
    expect(sdk.init).not.toHaveBeenCalled()
  })

  it('does not let SDK failures escape into project actions', async () => {
    const a = await import('./analytics')
    sdk.init.mockImplementationOnce(() => { throw Error('blocked') })
    expect(() => a.setAnalyticsConsent(true)).not.toThrow()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(sdk.capture).not.toHaveBeenCalled()
  })
})
