// Decorative low-poly night scene behind the page, after docs/assets/ps1-web-player-banner.png:
// a moon, faceted mountains, monoliths, a floating pyramid and a scrolling grid floor.
// Each mountain is two triangles (lit and shaded face) to get the flat-shaded PS1 look.
const MOUNTAINS: [number, number, number, number][] = [
  // [left x, peak x, right x, peak y] on a 1600×420 canvas whose base is y=420
  [-120, 120, 420, 150],
  [260, 520, 760, 250],
  [620, 860, 1080, 300],
  [960, 1230, 1500, 190],
  [1300, 1520, 1760, 120],
]

export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="moon" />
      <svg className="mountains" viewBox="0 0 1600 420" preserveAspectRatio="xMidYMax slice">
        {/* monoliths */}
        <polygon points="300,60 380,40 380,420 300,420" className="face-lit" />
        <polygon points="380,40 420,60 420,420 380,420" className="face-dark" />
        <polygon points="1360,30 1440,10 1440,420 1360,420" className="face-lit" />
        <polygon points="1440,10 1480,30 1480,420 1440,420" className="face-dark" />
        {MOUNTAINS.map(([l, p, r, y]) => (
          <g key={l}>
            <polygon points={`${l},420 ${p},${y} ${p + 30},420`} className="face-lit" />
            <polygon points={`${p},${y} ${r},420 ${p + 30},420`} className="face-dark" />
          </g>
        ))}
        {/* floating pyramid */}
        <g className="float">
          <polygon points="760,90 830,60 800,150" className="face-lit" />
          <polygon points="830,60 880,92 800,150" className="face-dark" />
        </g>
      </svg>
      <div className="floor" />
      <div className="scanlines" />
    </div>
  )
}
