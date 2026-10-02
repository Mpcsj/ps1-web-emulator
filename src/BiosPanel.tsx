import { useState } from 'react'
import { removeBios, saveBios, type BiosInfo } from './bios'

type Props = {
  bios: BiosInfo | null
  onChange: (b: BiosInfo | null) => void
  active: boolean // the selected core uses the BIOS
}

export function BiosPanel({ bios, onChange, active }: Props) {
  const [error, setError] = useState<string | null>(null)

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      onChange(await saveBios(file))
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <section className={active ? 'bios' : 'bios inactive'}>
      <div>
        <strong>PS1 BIOS</strong>{' '}
        {bios ? (
          <span className="ok">installed ({bios.original})</span>
        ) : (
          <span className="ok">using bundled OpenBIOS</span>
        )}
        <p className="hint">
          Beetle PSX needs a BIOS. It uses the bundled open-source{' '}
          <a href="/bios/OPENBIOS-LICENSE.txt" target="_blank">OpenBIOS</a> (MIT, PCSX-Redux) by default.
          For best compatibility, load a dump from your own console, ideally the US{' '}
          <code>SCPH-5501</code> (512 KB). It stays in this browser only.
        </p>
        {error && <p className="error">{error}</p>}
      </div>
      <div className="bios-actions">
        <label className="button-like">
          {bios ? 'Replace…' : 'Choose BIOS file…'}
          <input type="file" accept=".bin,.rom" onChange={onPick} hidden />
        </label>
        {bios && (
          <button className="secondary" onClick={async () => { await removeBios(); onChange(null) }}>
            Remove
          </button>
        )}
      </div>
    </section>
  )
}
