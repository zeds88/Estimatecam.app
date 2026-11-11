import { useState } from 'react'
import { analyticsConfigured, analyticsEnabled, setAnalyticsConsent } from '../lib/analytics'

export default function AnalyticsSettings() {
  const [enabled, setEnabled] = useState(analyticsEnabled)
  const [error, setError] = useState('')
  const configured = analyticsConfigured()
  return (
    <section className="card space-y-3" aria-labelledby="analytics-heading">
      <h2 id="analytics-heading" className="font-bold">Privacy &amp; usage analytics</h2>
      <p className="text-sm text-slate-500">Job content stays on this device. You can optionally help improve JobCam by sharing which screens and features you use with PostHog. Off by default.</p>
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input type="checkbox" className="h-5 w-5" checked={enabled} disabled={!configured} onChange={(e) => {
          const saved = setAnalyticsConsent(e.target.checked)
          setEnabled(analyticsEnabled())
          setError(saved ? '' : 'This browser could not save your preference. Analytics remains off.')
        }} />
        Share optional usage analytics
      </label>
      <p className="text-xs text-slate-500">Sends feature event names and a random browser identifier. Never sends job names, customer details, addresses, GPS, photos, videos, notes, transcripts, prices or API keys. No session recordings. You can turn this off here at any time; previously sent events are not deleted.</p>
      {!configured && <p className="text-xs text-slate-500">Usage analytics is unavailable in this installation.</p>}
      {error && <p role="status" className="text-sm text-red-600">{error}</p>}
    </section>
  )
}
