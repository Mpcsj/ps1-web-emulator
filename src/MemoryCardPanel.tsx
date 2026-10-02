import { useEffect, useState } from 'react'
import { WrongSizeError } from './db'
import { LOCALE, useI18n, type Lang, type Strings } from './i18n'
import { deleteCard, downloadCard, getCard, importCard, type CardRecord } from './memcard'

type Props = {
  game: string
  // Bumped by App whenever the player reports a save, to refresh the timestamp.
  savedAt: number | null
  // Tell the running player to reload the card after an import/delete.
  onCardReplaced: () => void
}

const timeAgo = (time: number, t: Strings, lang: Lang) => {
  const s = Math.round((Date.now() - time) / 1000)
  if (s < 60) return t.justNow
  if (s < 3600) return t.minAgo(Math.round(s / 60))
  return new Date(time).toLocaleString(LOCALE[lang])
}

export function MemoryCardPanel({ game, savedAt, onCardReplaced }: Props) {
  const { t, lang } = useI18n()
  // undefined = still reading IndexedDB
  const [card, setCard] = useState<CardRecord | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const [, tick] = useState(0)

  useEffect(() => {
    getCard(game).then((c) => setCard(c ?? null)).catch(() => setCard(null))
  }, [game, savedAt])

  // Keep the "x min ago" label fresh.
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 30000)
    return () => clearInterval(id)
  }, [])

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (card && !confirm(t.cardConfirmReplace)) return
    try {
      setCard(await importCard(game, file))
      setError(null)
      onCardReplaced()
    } catch (err) {
      setError(err instanceof WrongSizeError ? t.cardWrongSize(err.file, err.size) : (err as Error).message)
    }
  }

  const onDelete = async () => {
    if (!confirm(t.cardConfirmDelete)) return
    await deleteCard(game)
    setCard(null)
    onCardReplaced()
  }

  return (
    <section className="card">
      <div>
        <strong>{t.cardTitle}</strong>{' '}
        {card === undefined ? (
          <span className="muted">{t.cardChecking}</span>
        ) : card ? (
          <span className="ok">{t.cardSaved(timeAgo(card.updated, t, lang))}</span>
        ) : (
          <span className="muted">{t.cardEmpty}</span>
        )}
        <p className="hint">
          {t.cardHint}
        </p>
        {error && <p className="error">{error}</p>}
      </div>
      <div className="card-actions">
        <button className="secondary" disabled={!card} onClick={() => card && downloadCard(game, card)}>
          {t.cardExport}
        </button>
        <label className="button-like secondary-like">
          {t.cardImport}
          <input type="file" accept=".srm,.mcr,.mcd,.mc,.mem,.bin" onChange={onImport} hidden />
        </label>
        <button className="secondary danger" disabled={!card} onClick={onDelete}>
          {t.cardDelete}
        </button>
      </div>
    </section>
  )
}
