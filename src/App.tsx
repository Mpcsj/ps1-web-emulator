import { useEffect, useRef, useState } from 'react'
import './App.css'
import { Backdrop } from './Backdrop'
import { BiosPanel } from './BiosPanel'
import { ControllerStatus } from './ControllerStatus'
import { GraphicsPanel } from './GraphicsPanel'
import { MemoryCardPanel } from './MemoryCardPanel'
import { BIOS_NAME, getBios, type BiosInfo } from './bios'
import { gameIdFor } from './memcard'
import { EJS_LANGUAGE, useI18n, type Lang, type Strings } from './i18n'
import { isEnhancedCore, loadGraphics, saveGraphics, toCoreOptions, type Graphics } from './graphics'

// Optional local disc (public/roms/ is git-ignored; see README). The storage keys derived
// from it (memory card, EmulatorJS save name) predate the rename, so keep it as is.
const BUNDLED_ROM = '/roms/sheep-raider.bin'
const BUNDLED_NAME = 'Sheep Raider'

// Vite answers missing files with index.html, so check the type, not just the status.
function useBundledRom() {
  const [present, setPresent] = useState(false)
  useEffect(() => {
    fetch(BUNDLED_ROM, { method: 'HEAD' })
      .then((r) => setPresent(r.ok && !r.headers.get('content-type')?.includes('text/html')))
      .catch(() => setPresent(false))
  }, [])
  return present
}

// game: stable id for the memory card (file name without extension).
// lang: EmulatorJS menu language, fixed at boot so switching it doesn't restart the game.
type Source = { url: string; name: string; game: string; lang?: Lang }

type Status = 'statusIdle' | 'statusLoaded' | 'statusRunning' | 'statusSaving' | 'statusDownloading'

type EmulatorWindow = Window & {
  EJS_emulator?: { gameManager?: { getFrameNum(): number } }
}

function useFps(frame: HTMLIFrameElement | null, running: boolean) {
  const [fps, setFps] = useState<number | null>(null)
  useEffect(() => {
    if (!frame || !running) return
    let last: number | null = null
    const id = setInterval(() => {
      const n = (frame.contentWindow as EmulatorWindow | null)?.EJS_emulator?.gameManager?.getFrameNum()
      if (n === undefined) return
      if (last !== null) setFps(n - last)
      last = n
    }, 1000)
    return () => { clearInterval(id); setFps(null) }
  }, [frame, running])
  return fps
}

// Ask the player to write the memory card to IndexedDB before it's torn down.
function flushPlayer(frame: HTMLIFrameElement | null): Promise<void> {
  const win = frame?.contentWindow
  if (!win) return Promise.resolve()
  const id = Math.random()
  return new Promise((resolve) => {
    const done = () => { window.removeEventListener('message', onMessage); clearTimeout(timer); resolve() }
    const onMessage = (e: MessageEvent) => {
      if (e.origin === location.origin && e.data?.type === 'flushed' && e.data.id === id) done()
    }
    const timer = setTimeout(done, 3000)
    window.addEventListener('message', onMessage)
    win.postMessage({ type: 'flush', id }, location.origin)
  })
}

function App() {
  const { lang, setLang, t } = useI18n()
  const [source, setSource] = useState<Source | null>(null)
  const [graphics, setGraphics] = useState<Graphics>(loadGraphics)
  // Graphics the running emulator was booted with; changing them needs a restart.
  const [applied, setApplied] = useState<Graphics>(graphics)
  const [status, setStatus] = useState<Status>('statusIdle')
  const [running, setRunning] = useState(false)
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null)
  const [bios, setBios] = useState<BiosInfo | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const blobUrl = useRef<string | null>(null)
  const fps = useFps(frame, running)
  const hasBundledRom = useBundledRom()

  useEffect(() => saveGraphics(graphics), [graphics])
  useEffect(() => { getBios().then(setBios) }, [])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin) return
      if (e.data?.type === 'ejs-ready') setStatus('statusLoaded')
      if (e.data?.type === 'ejs-start') { setStatus('statusRunning'); setRunning(true) }
      if (e.data?.type === 'card-saved') setSavedAt(e.data.updated)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => () => {
    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current)
  }, [])

  const boot = async (src: Source) => {
    if (source) {
      setStatus('statusSaving')
      await flushPlayer(frame)
    }
    setStatus('statusDownloading')
    setRunning(false)
    setApplied(graphics)
    setSource({ ...src, lang })
  }

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current)
    blobUrl.current = URL.createObjectURL(file)
    boot({ url: blobUrl.current, name: file.name.replace(/\.[^.]+$/, ''), game: gameIdFor(file.name) })
  }

  const stop = async () => {
    setStatus('statusSaving')
    await flushPlayer(frame)
    setSource(null)
    setRunning(false)
    setStatus('statusIdle')
  }

  const playerSrc = source
    ? `/player.html?${new URLSearchParams({
        rom: source.url,
        name: source.name,
        game: source.game,
        core: applied.core,
        lang: EJS_LANGUAGE[source.lang ?? lang],
        opts: JSON.stringify(toCoreOptions(applied)),
        ...(isEnhancedCore(applied) ? { bios: BIOS_NAME } : {}),
      })}`
    : null

  const dirty = source !== null && JSON.stringify(graphics) !== JSON.stringify(applied)
  const widescreen = isEnhancedCore(applied) && applied.widescreen

  return (
    <main className="app">
      <Backdrop />
      <header className="hero">
        <h1 className="title">
          <span>PS1</span>
          <span>Web Player</span>
        </h1>
        <p className="tagline">{t.tagline}</p>
        <LangSwitch lang={lang} onChange={setLang} t={t} />
        <div className="hud">
          <p className="status">
            <span className={running ? 'led on' : 'led'} />
            {t[status]}
            {running && fps !== null && <span className="fps"> · {fps} fps</span>}
          </p>
          <ControllerStatus />
        </div>
      </header>

      {playerSrc ? (
        <div className={widescreen ? 'screen wide' : 'screen'}>
          <iframe
            key={playerSrc}
            ref={setFrame}
            src={playerSrc}
            title={t.emulatorTitle}
            allow="fullscreen; gamepad; autoplay"
          />
        </div>
      ) : (
        <div className="picker">
          <div className="disc" aria-hidden="true" />
          <div className="picker-body">
            <p className="picker-label">{t.insertDisc}</p>
            {hasBundledRom && (
              <button className="btn primary" onClick={() => boot({ url: BUNDLED_ROM, name: BUNDLED_NAME, game: gameIdFor(BUNDLED_ROM) })}>
                <span aria-hidden="true" className="glyph cross">✕</span> {t.playBundled}
              </button>
            )}
            <label className={hasBundledRom ? 'btn' : 'btn primary'}>
              <span aria-hidden="true" className="glyph circle">○</span> {hasBundledRom ? t.loadAnother : t.loadDisc}
              <input type="file" accept=".bin,.iso,.chd,.pbp,.cue" onChange={onPickFile} hidden />
            </label>
            <p className="picker-hint">{t.discHint}</p>
          </div>
        </div>
      )}

      {source && (
        <div className="actions">
          {dirty && (
            <button className="btn primary" onClick={() => boot(source)}>
              {t.applyRestart}
            </button>
          )}
          <button className="btn" onClick={stop}><span aria-hidden="true" className="glyph square">□</span> {t.stop}</button>
          {dirty && <span className="note">{t.restartNote}</span>}
        </div>
      )}

      <MemoryCardPanel
        game={source?.game ?? gameIdFor(BUNDLED_ROM)}
        savedAt={savedAt}
        onCardReplaced={() => frame?.contentWindow?.postMessage({ type: 'card-load' }, location.origin)}
      />
      <GraphicsPanel value={graphics} onChange={setGraphics} />
      <BiosPanel bios={bios} onChange={setBios} active={isEnhancedCore(graphics)} />
    </main>
  )
}

function LangSwitch({ lang, onChange, t }: { lang: Lang; onChange: (l: Lang) => void; t: Strings }) {
  return (
    <div className="lang" role="group" aria-label={t.language}>
      {(['en', 'pt'] as const).map((l) => (
        <button key={l} lang={l === 'pt' ? 'pt-BR' : 'en'} aria-pressed={lang === l} onClick={() => onChange(l)}>
          {l === 'pt' ? 'PT' : 'EN'}
        </button>
      ))}
    </div>
  )
}

export default App
