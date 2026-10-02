import { useEffect, useState } from 'react'
import { useI18n } from './i18n'

// Browsers hide gamepads from a page until a button is pressed while it's focused,
// so a paired controller looks "missing" until then. Show that state explicitly.
function connectedPads(): string[] {
  return [...navigator.getGamepads()].filter((p): p is Gamepad => p !== null).map((p) => p.id)
}

function shortName(id: string) {
  // Chrome: "DUALSHOCK 4 Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)"
  return id.replace(/\s*\(.*\)\s*$/, '') || id
}

export function ControllerStatus() {
  const { t } = useI18n()
  const [pads, setPads] = useState<string[]>(connectedPads)
  // Reported by public/player.html while a game runs.
  const [player1, setPlayer1] = useState<string | null | undefined>(undefined)
  const [lastInput, setLastInput] = useState<string | null>(null)

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== location.origin) return
      if (e.data?.type === 'pad-status') setPlayer1(e.data.player1)
      if (e.data?.type === 'pad-input') setLastInput(e.data.label)
      if (e.data?.type === 'ejs-ready') { setPlayer1(undefined); setLastInput(null) }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    const update = () => setPads(connectedPads())
    window.addEventListener('gamepadconnected', update)
    window.addEventListener('gamepaddisconnected', update)
    // Safari doesn't always fire the events; poll as a fallback.
    const id = setInterval(update, 1000)
    return () => {
      window.removeEventListener('gamepadconnected', update)
      window.removeEventListener('gamepaddisconnected', update)
      clearInterval(id)
    }
  }, [])

  return pads.length ? (
    <p className="pad ok">
      🎮 {pads.map(shortName).join(', ')}
      {player1 === null && <span className="danger"> · {t.padUnassigned}</span>}
      {player1 && <span> · {t.padPlayer1}</span>}
      {lastInput && <span className="muted"> · {t.padLastInput}: {lastInput}</span>}
    </p>
  ) : (
    <p className="pad muted">🎮 {t.padNone}</p>
  )
}
