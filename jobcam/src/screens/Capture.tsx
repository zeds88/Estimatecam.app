import { Camera as CamIcon, ImagePlus, Square, SwitchCamera, Video } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TagPicker } from '../components/ui'
import { addMedia } from '../lib/capture'
import { warmPosition } from '../lib/image'
import { fmtDuration } from '../lib/video'
import { listProjects } from '../lib/db'
import { useLoad } from '../lib/hooks'

export default function Capture() {
  const [params] = useSearchParams()
  const [projects] = useLoad(() => listProjects().then((l) => l.filter((p) => p.status === 'active')), [])
  const [projectId, setProjectId] = useState(params.get('project') ?? '')
  const [tags, setTags] = useState<string[]>([])
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [mode, setMode] = useState<'photo' | 'video'>('photo')
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const recorder = useRef<MediaRecorder | null>(null)
  const [count, setCount] = useState(0)
  const [status, setStatus] = useState('')
  const [camError, setCamError] = useState('')
  const [camReady, setCamReady] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => { if (projects?.length) warmPosition() }, [projects])

  useEffect(() => {
    if (!projectId && projects?.length) setProjectId(projects[0].id)
  }, [projects, projectId])

  useEffect(() => {
    let cancelled = false
    let acquired: MediaStream | null = null
    setCamReady(false)
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
    if (video.current) video.current.srcObject = null
    setCamError('')
    if (!projects?.length) return
    const startCam = async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setCamError('Live camera is unavailable. Use the upload button below to add photos or videos.'); return }
      const video_ = { facingMode: facing, width: { ideal: mode === 'video' ? 1920 : 3840 }, height: { ideal: mode === 'video' ? 1080 : 2160 } }
      try {
        try {
          acquired = await navigator.mediaDevices.getUserMedia({ video: video_, audio: mode === 'video' })
        } catch (e) {
          if (mode !== 'video' || cancelled) throw e
          // microphone denied/unavailable: still record, just silently
          acquired = await navigator.mediaDevices.getUserMedia({ video: video_, audio: false })
        }
        if (cancelled) { acquired.getTracks().forEach((t) => t.stop()); return }
        stream.current = acquired
        if (video.current) video.current.srcObject = acquired
      } catch {
        if (!cancelled) setCamError('Camera access is unavailable. Allow camera access in your browser, or use the upload button below.')
      }
    }
    void startCam()
    return () => {
      cancelled = true
      acquired?.getTracks().forEach((t) => t.stop())
      if (stream.current === acquired) stream.current = null
    }
  }, [facing, mode, projects])

  const saveBlob = async (b: Blob) => {
    if (!projectId) { setStatus('Choose an active project first.'); return }
    try { await addMedia(projectId, b, { tags }) } catch (e) { setStatus((e as Error).message); return }
    setCount((c) => c + 1)
    setStatus('Saved ✓')
    setTimeout(() => setStatus(''), 1200)
  }

  const toggleRecord = () => {
    if (recorder.current) { recorder.current.stop(); return }
    if (!camReady || !stream.current?.active) return
    const mime = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m))
    const chunks: Blob[] = []
    const rec = new MediaRecorder(stream.current, mime ? { mimeType: mime } : undefined)
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    rec.onstop = async () => {
      recorder.current = null
      setRecording(false)
      await saveBlob(new Blob(chunks, { type: rec.mimeType || 'video/webm' }))
    }
    recorder.current = rec
    rec.start(1000)
    setElapsed(0)
    setRecording(true)
  }

  useEffect(() => {
    if (!recording) return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [recording])
  useEffect(() => () => { if (recorder.current?.state === 'recording') recorder.current.stop() }, [])

  const shoot = async () => {
    const v = video.current
    if (!v || !v.videoWidth) return
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    c.getContext('2d')!.drawImage(v, 0, 0)
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', 0.92))
    if (blob) await saveBlob(blob)
  }

  return (
    <div className="space-y-4">
      <header><h1 className="page-heading">Capture</h1><p className="page-description">Choose a project, then take a photo, record a video, or upload files.</p></header>
      {projects && projects.length === 0 ? (
        <div className="card space-y-3">
          <h2 className="section-heading">Start with a project</h2>
          <p className="section-copy">Create an active project from Projects, then return to Capture to add photos and videos.</p>
          <Link className="btn btn-primary" to="/projects">Go to Projects</Link>
        </div>
      ) : (
        <label className="block"><span className="label">1. Choose a project</span>
          <select className="input" value={projectId} disabled={recording || !projects} onChange={(e) => setProjectId(e.target.value)} aria-label="Project">
            {!projects && <option value="">Loading projects…</option>}
            {projects?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      )}

      {!!projects?.length && <>
      <div className="space-y-2">
      <p className="label">2. Capture or upload</p>
      <div className="flex gap-2" role="group" aria-label="Capture mode">
        {(['photo', 'video'] as const).map((m) => (
          <button key={m} className={`chip !px-4 !py-2 capitalize ${mode === m ? 'chip-on' : ''}`} disabled={recording} aria-pressed={mode === m} onClick={() => setMode(m)}>{m}</button>
        ))}
      </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-black">
        <video ref={video} autoPlay playsInline muted onLoadedData={() => setCamReady(!!stream.current?.active)} className="aspect-[3/4] w-full object-cover sm:aspect-video" />
        {camError && <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-white">{camError}</p>}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-around bg-gradient-to-t from-black/70 p-4">
          <label className="btn cursor-pointer !rounded-full !p-3" aria-label="Pick files"><ImagePlus size={22} />
            <input ref={file} type="file" accept="image/*,video/*,.heic,.heif,.mov,.mp4,.m4v,.webm" multiple className="sr-only" aria-label="Pick photos or videos" disabled={recording || !projectId} onChange={async (e) => {
              const files = Array.from(e.target.files ?? [])
              e.target.value = ''
              for (const f of files) await saveBlob(f)
            }} />
          </label>
          {mode === 'photo' ? (
            <button className="grid place-items-center rounded-full border-4 border-white bg-white/20 active:scale-90 disabled:opacity-40" style={{ width: 72, height: 72 }} disabled={!camReady || !projectId} onClick={shoot} aria-label="Take photo">
              <CamIcon className="text-white" />
            </button>
          ) : (
            <button className="grid place-items-center rounded-full border-4 border-white bg-red-600/80 active:scale-90 disabled:opacity-40" style={{ width: 72, height: 72 }} disabled={!recording && (!camReady || !projectId)} onClick={toggleRecord} aria-label={recording ? 'Stop recording' : 'Start recording'}>
              {recording ? <Square className="text-white" fill="white" /> : <Video className="text-white" />}
            </button>
          )}
          <button className="btn !rounded-full !p-3" disabled={recording} onClick={() => setFacing((f) => (f === 'environment' ? 'user' : 'environment'))} aria-label="Switch camera"><SwitchCamera size={22} /></button>
        </div>
        {recording && <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> REC {fmtDuration(elapsed)}</span>}
        {(count > 0 || status) && <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white">{status || `${count} saved`}{status && count ? ` · ${count}` : ''}</span>}
      </div>

      <div>
        <span className="label">Tags for your next photos or videos</span>
        <TagPicker value={tags} onChange={setTags} />
      </div>
      <p className="section-copy">Photos and videos save to this device. Location is added when permission is available. To review your media, open the project from Projects.</p>
      </>}
    </div>
  )
}
