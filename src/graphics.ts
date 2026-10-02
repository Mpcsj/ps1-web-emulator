// Graphics settings -> EmulatorJS core + core options.
//
// Beetle PSX HW (mednafen_psx_hw) is run with its *software* renderer: its
// hardware GL/Vulkan renderers crash on start in the EmulatorJS build (tested
// 2026-09 with both a real-format BIOS and OpenBIOS). The software renderer still
// upscales, but texture filtering, 32bpp and PGXP are hardware-only, so smoothing
// is done with EmulatorJS post-process shaders instead (GPU, works with any core).

export type Core = 'pcsx_rearmed' | 'mednafen_psx_hw'

export type Graphics = {
  core: Core
  resolution: '1x(native)' | '2x' | '4x'
  noDither: boolean
  widescreen: boolean // hack, may show glitches at screen edges
  shader: string // EmulatorJS post-process shader, 'disabled' for none
}

export const SHADERS: Record<string, string> = {
  disabled: 'None',
  sabr: 'SABR (smooth edges)',
  '2xScaleHQ.glslp': '2xScaleHQ',
  '4xScaleHQ.glslp': '4xScaleHQ',
  bicubic: 'Bicubic (soft)',
  'crt-easymode.glslp': 'CRT (easymode)',
  'crt-geom.glslp': 'CRT (curved)',
  'crt-lottes': 'CRT (Lottes)',
  'crt-zfast': 'CRT (zfast, cheap)',
}

export const PRESETS: Record<string, { label: string; hint: string; graphics: Graphics }> = {
  original: {
    label: 'Original',
    hint: 'Native 320×240, as on a real PS1',
    graphics: { core: 'pcsx_rearmed', resolution: '1x(native)', noDither: false, widescreen: false, shader: 'disabled' },
  },
  smooth: {
    label: 'Smooth',
    hint: 'Native speed, no dithering, SABR edge smoothing',
    graphics: { core: 'pcsx_rearmed', resolution: '1x(native)', noDither: true, widescreen: false, shader: 'sabr' },
  },
  enhanced: {
    label: 'Enhanced',
    hint: '2× internal resolution (Beetle), no dithering',
    graphics: { core: 'mednafen_psx_hw', resolution: '2x', noDither: true, widescreen: false, shader: 'disabled' },
  },
  ultra: {
    label: 'Ultra',
    hint: '4× internal resolution — CPU heavy, check the fps',
    graphics: { core: 'mednafen_psx_hw', resolution: '4x', noDither: true, widescreen: false, shader: 'disabled' },
  },
  crt: {
    label: 'Retro CRT',
    hint: 'Native image through a CRT shader',
    graphics: { core: 'pcsx_rearmed', resolution: '1x(native)', noDither: false, widescreen: false, shader: 'crt-easymode.glslp' },
  },
}

export const DEFAULT_GRAPHICS = PRESETS.smooth.graphics

export const isEnhancedCore = (g: Graphics) => g.core === 'mednafen_psx_hw'

export function toCoreOptions(g: Graphics): Record<string, string> {
  const opts: Record<string, string> = { shader: g.shader }
  if (!isEnhancedCore(g)) {
    return { ...opts, pcsx_rearmed_dithering: g.noDither ? 'disabled' : 'enabled' }
  }
  return {
    ...opts,
    beetle_psx_hw_renderer: 'software',
    beetle_psx_hw_internal_resolution: g.resolution,
    beetle_psx_hw_dither_mode: g.noDither ? 'disabled' : '1x(native)',
    beetle_psx_hw_widescreen_hack: g.widescreen ? 'enabled' : 'disabled',
  }
}

export const presetOf = (g: Graphics) =>
  Object.keys(PRESETS).find((k) => JSON.stringify(PRESETS[k].graphics) === JSON.stringify(g)) ?? 'custom'

// v2: settings shape changed when the hardware renderer options were dropped.
const STORAGE_KEY = 'sheep-raider:graphics:v2'

export function loadGraphics(): Graphics {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_GRAPHICS, ...JSON.parse(raw) }
  } catch { /* storage unavailable */ }
  return DEFAULT_GRAPHICS
}

export function saveGraphics(g: Graphics) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(g)) } catch { /* ignore */ }
}
