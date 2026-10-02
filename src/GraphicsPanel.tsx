import { PRESETS, SHADERS, isEnhancedCore, presetOf, type Graphics } from './graphics'

type Props = {
  value: Graphics
  onChange: (g: Graphics) => void
}

export function GraphicsPanel({ value, onChange }: Props) {
  const set = <K extends keyof Graphics>(k: K, v: Graphics[K]) => onChange({ ...value, [k]: v })
  const enhanced = isEnhancedCore(value)
  const active = presetOf(value)

  return (
    <section className="gfx">
      <div className="presets">
        {Object.entries(PRESETS).map(([key, p]) => (
          <button
            key={key}
            className={active === key ? 'preset active' : 'preset'}
            onClick={() => onChange(p.graphics)}
            title={p.hint}
          >
            <strong>{p.label}</strong>
            <span>{p.hint}</span>
          </button>
        ))}
      </div>

      <details open={active === 'custom'}>
        <summary>Advanced{active === 'custom' ? ' (custom)' : ''}</summary>
        <div className="grid">
          <label>
            Emulator core
            <select value={value.core} onChange={(e) => set('core', e.target.value as Graphics['core'])}>
              <option value="pcsx_rearmed">PCSX-ReARMed (fast, native resolution)</option>
              <option value="mednafen_psx_hw">Beetle PSX (upscaling, heavier)</option>
            </select>
          </label>

          <label>
            Internal resolution
            <select disabled={!enhanced} value={value.resolution} onChange={(e) => set('resolution', e.target.value as Graphics['resolution'])}>
              <option value="1x(native)">1× native (320×240)</option>
              <option value="2x">2× (640×480)</option>
              <option value="4x">4× (1280×960)</option>
            </select>
          </label>

          <label>
            Post-process shader
            <select value={value.shader} onChange={(e) => set('shader', e.target.value)}>
              {Object.entries(SHADERS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </label>

          <label className="check">
            <input type="checkbox" checked={value.noDither} onChange={(e) => set('noDither', e.target.checked)} />
            Disable dithering (cleaner gradients)
          </label>

          <label className="check">
            <input type="checkbox" disabled={!enhanced} checked={value.widescreen} onChange={(e) => set('widescreen', e.target.checked)} />
            Widescreen hack (16:9, may glitch at edges)
          </label>
        </div>
      </details>
    </section>
  )
}
