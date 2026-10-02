import { useState } from 'react'
import { WrongSizeError } from './db'
import { useI18n } from './i18n'
import { removeBios, saveBios, type BiosInfo } from './bios'

type Props = {
  bios: BiosInfo | null
  onChange: (b: BiosInfo | null) => void
  active: boolean // the selected core uses the BIOS
}

export function BiosPanel({ bios, onChange, active }: Props) {
  const { t } = useI18n()
  const [error, setError] = useState<string | null>(null)

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      onChange(await saveBios(file))
      setError(null)
    } catch (err) {
      setError(err instanceof WrongSizeError ? t.biosWrongSize(err.file, err.size) : (err as Error).message)
    }
  }

  return (
    <section className={active ? 'bios' : 'bios inactive'}>
      <div>
        <strong>{t.biosTitle}</strong>{' '}
        {bios ? (
          <span className="ok">{t.biosInstalled(bios.original)}</span>
        ) : (
          <span className="ok">{t.biosBundled}</span>
        )}
        <p className="hint">
          {t.biosHint[0]}
          <a href="/bios/OPENBIOS-LICENSE.txt" target="_blank">OpenBIOS</a>
          {t.biosHint[1]}
          <code>SCPH-5501</code>
          {t.biosHint[2]}
        </p>
        {error && <p className="error">{error}</p>}
      </div>
      <div className="bios-actions">
        <label className="button-like">
          {bios ? t.biosReplace : t.biosChoose}
          <input type="file" accept=".bin,.rom" onChange={onPick} hidden />
        </label>
        {bios && (
          <button className="secondary" onClick={async () => { await removeBios(); onChange(null) }}>
            {t.biosRemove}
          </button>
        )}
      </div>
    </section>
  )
}
