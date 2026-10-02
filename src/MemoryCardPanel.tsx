import { useEffect, useState } from 'react'
import { deleteCard, downloadCard, getCard, importCard, type CardRecord } from './memcard'

type Props = {
  game: string
  // Bumped by App whenever the player reports a save, to refresh the timestamp.
  savedAt: number | null
  // Tell the running player to reload the card after an import/delete.
  onCardReplaced: () => void
}

const timeAgo = (t: number) => {
  const s = Math.round((Date.now() - t) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  return new Date(t).toLocaleString()
}

export function MemoryCardPanel({ game, savedAt, onCardReplaced }: Props) {
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
    if (card && !confirm('Replace the current memory card with this file? Export it first if you want a backup.')) return
    try {
      setCard(await importCard(game, file))
      setError(null)
      onCardReplaced()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const onDelete = async () => {
    if (!confirm('Delete this memory card? All saved progress for this game in this browser will be lost.')) return
    await deleteCard(game)
    setCard(null)
    onCardReplaced()
  }

  return (
    <section className="card">
      <div>
        <strong>Memory card</strong>{' '}
        {card === undefined ? (
          <span className="muted">checking…</span>
        ) : card ? (
          <span className="ok">saved {timeAgo(card.updated)}</span>
        ) : (
          <span className="muted">empty</span>
        )}
        <p className="hint">
          Saves the game makes to its memory card are stored in this browser automatically, and
          shared by every graphics preset. Export a backup, or to move your progress to another
          device or address (e.g. localhost vs. your network IP): each keeps its own saves.
        </p>
        {error && <p className="error">{error}</p>}
      </div>
      <div className="card-actions">
        <button className="secondary" disabled={!card} onClick={() => card && downloadCard(game, card)}>
          Export .srm
        </button>
        <label className="button-like secondary-like">
          Import…
          <input type="file" accept=".srm,.mcr,.mcd,.mc,.mem,.bin" onChange={onImport} hidden />
        </label>
        <button className="secondary danger" disabled={!card} onClick={onDelete}>
          Delete
        </button>
      </div>
    </section>
  )
}
