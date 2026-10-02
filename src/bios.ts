// User-supplied PS1 BIOS, kept in IndexedDB so it only has to be picked once.
// public/player.html reads the same record.
import { idbDelete, idbGet, idbPut } from './db'

const KEY = 'bios'

// Beetle PSX looks the BIOS up by region-specific filename; scph5501 is the US (NTSC-U) one.
export const BIOS_NAME = 'scph5501.bin'
export const BIOS_SIZE = 512 * 1024

export type BiosInfo = { name: string; size: number; original: string }

export async function getBios(): Promise<BiosInfo | null> {
  try {
    const rec = await idbGet<{ blob: Blob; original: string }>(KEY)
    return rec ? { name: BIOS_NAME, size: rec.blob.size, original: rec.original } : null
  } catch {
    return null
  }
}

export async function saveBios(file: File): Promise<BiosInfo> {
  if (file.size !== BIOS_SIZE) {
    throw new Error(`${file.name} is ${file.size} bytes; a PS1 BIOS is exactly 512 KB.`)
  }
  await idbPut(KEY, { blob: file, original: file.name })
  return { name: BIOS_NAME, size: file.size, original: file.name }
}

export async function removeBios() {
  await idbDelete(KEY)
}
