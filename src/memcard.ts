// Memory card persistence, independent of EmulatorJS's own save handling.
//
// EmulatorJS keeps .srm files per core (/data/saves/<Core>/<game>.srm) and only flushes
// them every 5 minutes or on beforeunload, so progress was lost on Stop / preset
// switches. Instead, public/player.html keeps one canonical card per game in IndexedDB
// (key `card:<game>`): it loads it into whichever core is running at start and writes it
// back whenever the card changes. The format is the raw 128 KB PS1 card libretro cores
// use for slot 1 (same as .mcr/.mcd in DuckStation, ePSXe, etc.).
import { idbDelete, idbGet, idbPut, WrongSizeError } from './db'

export const CARD_SIZE = 128 * 1024

export type CardRecord = { data: Uint8Array; updated: number }

export const cardKey = (game: string) => `card:${game}`

// Save name EmulatorJS derives from the ROM URL / file name; player.html uses the same.
export const gameIdFor = (romName: string) =>
  romName.split('/').pop()!.replace(/\.[^.]+$/, '')

export const getCard = (game: string) => idbGet<CardRecord>(cardKey(game))

export async function importCard(game: string, file: File): Promise<CardRecord> {
  const data = new Uint8Array(await file.arrayBuffer())
  if (data.length !== CARD_SIZE) {
    throw new WrongSizeError(file.name, data.length, 'a PS1 memory card is exactly 128 KB')
  }
  const rec = { data, updated: Date.now() }
  await idbPut(cardKey(game), rec)
  return rec
}

export const deleteCard = (game: string) => idbDelete(cardKey(game))

export function downloadCard(game: string, rec: CardRecord) {
  const url = URL.createObjectURL(new Blob([rec.data as BlobPart], { type: 'application/octet-stream' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${game}.srm`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
