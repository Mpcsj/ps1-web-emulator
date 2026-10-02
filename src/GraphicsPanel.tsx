import { useI18n } from './i18n'
import { PRESETS, SHADERS, isEnhancedCore, presetOf, type Graphics } from './graphics'

type Props = {
  value: Graphics
  onChange: (g: Graphics) => void
}

export function GraphicsPanel({ value, onChange }: Props) {
  const { t } = useI18n()
  const set = <K extends keyof Graphics>(k: K, v: Graphics[K]) => onChange({ ...value, [k]: v })
  const enhanced = isEnhancedCore(value)
  const active = presetOf(value)

  return (
    <section className="gfx">
      <h2>{t.graphics}</h2>
      <div className="presets">
        {Object.entries(PRESETS).map(([key, p]) => {
          const [label, hint] = t.presets[key] ?? [p.label, p.hint]
          return (
          <button
            key={key}
            className={active === key ? 'preset active' : 'preset'}
            onClick={() => onChange(p.graphics)}
            title={hint}
          >
            <strong>{label}</strong>
            <span>{hint}</span>
          </button>
          )
        })}
      </div>

      <details open={active === 'custom'}>
        <summary>{t.advanced}{active === 'custom' ? ` (${t.custom})` : ''}</summary>
        <div className="grid">
          <label>
            {t.core}
            <select value={value.core} onChange={(e) => set('core', e.target.value as Graphics['core'])}>
              <option value="pcsx_rearmed">{t.corePcsx}</option>
              <option value="mednafen_psx_hw">{t.coreBeetle}</option>
            </select>
          </label>

          <label>
            {t.resolution}
            <select disabled={!enhanced} value={value.resolution} onChange={(e) => set('resolution', e.target.value as Graphics['resolution'])}>
              <option value="1x(native)">{t.res1x}</option>
              <option value="2x">2× (640×480)</option>
              <option value="4x">4× (1280×960)</option>
            </select>
          </label>

          <label>
            {t.shader}
            <select value={value.shader} onChange={(e) => set('shader', e.target.value)}>
              {Object.entries(SHADERS).map(([k, label]) => (
                <option key={k} value={k}>{t.shaders[k] ?? label}</option>
              ))}
            </select>
          </label>

          <label className="check">
            <input type="checkbox" checked={value.noDither} onChange={(e) => set('noDither', e.target.checked)} />
            {t.noDither}
          </label>

          <label className="check">
            <input type="checkbox" disabled={!enhanced} checked={value.widescreen} onChange={(e) => set('widescreen', e.target.checked)} />
            {t.widescreen}
          </label>
        </div>
      </details>
    </section>
  )
}
