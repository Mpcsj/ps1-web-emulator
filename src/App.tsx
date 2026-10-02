import { useEffect, useRef, useState } from 'react'
import './App.css'
import { BiosPanel } from './BiosPanel'
import { ControllerStatus } from './ControllerStatus'
import { GraphicsPanel } from './GraphicsPanel'
import { MemoryCardPanel } from './MemoryCardPanel'
import { BIOS_NAME, getBios, type BiosInfo } from './bios'
import { gameIdFor } from './memcard'
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
type Source = { url: string; name: string; game: string }

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
  const [source, setSource] = useState<Source | null>(null)
  const [graphics, setGraphics] = useState<Graphics>(loadGraphics)
  // Graphics the running emulator was booted with; changing them needs a restart.
  const [applied, setApplied] = useState<Graphics>(graphics)
  const [status, setStatus] = useState('Choose a game source to start.')
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
      if (e.data?.type === 'ejs-ready') setStatus('Emulator loaded, booting disc…')
      if (e.data?.type === 'ejs-start') { setStatus('Running.'); setRunning(true) }
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
      setStatus('Saving memory card…')
      await flushPlayer(frame)
    }
    setStatus('Downloading emulator core and disc image…')
    setRunning(false)
    setApplied(graphics)
    setSource(src)
  }

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current)
    blobUrl.current = URL.createObjectURL(file)
    boot({ url: blobUrl.current, name: file.name.replace(/\.[^.]+$/, ''), game: gameIdFor(file.name) })
  }

  const stop = async () => {
    setStatus('Saving memory card…')
    await flushPlayer(frame)
    setSource(null)
    setRunning(false)
    setStatus('Choose a game source to start.')
  }

  const playerSrc = source
    ? `/player.html?${new URLSearchParams({
        rom: source.url,
        name: source.name,
        game: source.game,
        core: applied.core,
        opts: JSON.stringify(toCoreOptions(applied)),
        ...(isEnhancedCore(applied) ? { bios: BIOS_NAME } : {}),
      })}`
    : null

  const dirty = source !== null && JSON.stringify(graphics) !== JSON.stringify(applied)
  const widescreen = isEnhancedCore(applied) && applied.widescreen

  return (
    <main className="app">
      <header>
        <h1>PS1 Web Player</h1>
        <p className="status">
          {status}
          {running && fps !== null && <span className="fps"> · {fps} fps</span>}
        </p>
        <ControllerStatus />
      </header>

      {playerSrc ? (
        <div className={widescreen ? 'screen wide' : 'screen'}>
          <iframe
            key={playerSrc}
            ref={setFrame}
            src={playerSrc}
            title="PS1 emulator"
            allow="fullscreen; gamepad; autoplay"
          />
        </div>
      ) : (
        <div className="picker">
          {hasBundledRom && (
            <button onClick={() => boot({ url: BUNDLED_ROM, name: BUNDLED_NAME, game: gameIdFor(BUNDLED_ROM) })}>
              Play bundled disc
            </button>
          )}
          <label className="file">
            {hasBundledRom ? 'Or load' : 'Load'} your own disc image (.bin / .chd / .pbp)
            <input type="file" accept=".bin,.iso,.chd,.pbp,.cue" onChange={onPickFile} />
          </label>
        </div>
      )}

      {source && (
        <div className="actions">
          {dirty && (
            <button className="apply" onClick={() => boot(source)}>
              Apply &amp; restart game
            </button>
          )}
          <button className="secondary" onClick={stop}>Stop</button>
          {dirty && <span className="note">Memory card saves are kept. Progress since your last in-game save is lost, so use Save State in the emulator bar if needed.</span>}
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

export default App
