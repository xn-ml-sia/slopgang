/** The fold’s right-hand panel: the mean as a diagram, not a photograph. */
export function CentroidDiagram() {
  const rings: [number, number][] = [
    [72, 46],
    [128, 82],
    [186, 120],
    [248, 160],
    [312, 202],
  ]

  // Deterministic scatter: denser toward the centroid, sparse in the tails.
  const mass: [number, number][] = [
    [-18, -8],
    [22, 12],
    [-8, 24],
    [14, -22],
    [-28, 6],
    [6, 4],
    [32, -10],
    [-12, -18],
    [40, 28],
    [-36, -26],
    [8, 36],
    [-22, 32],
    [86, -48],
    [-94, 38],
    [70, 62],
    [-62, -70],
    [118, 8],
    [-110, -14],
  ]

  return (
    <svg
      className="diagram"
      viewBox="0 0 640 760"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Diagram of a statistical centroid: concentric hairline orbits, a cluster of ivory points, and one brass mark at the mean."
    >
      <rect width="640" height="760" fill="var(--ink)" />

      <g fill="none" stroke="var(--ivory-soft)" strokeWidth="1" opacity="0.55">
        {rings.map(([rx, ry]) => (
          <ellipse key={rx} cx="320" cy="392" rx={rx} ry={ry} />
        ))}
        <line x1="320" y1="96" x2="320" y2="688" />
        <line x1="48" y1="392" x2="592" y2="392" />
        <path d="M56 392 C 140 392 188 168 320 168 S 500 392 584 392" />
      </g>

      {mass.map(([x, y], i) => (
        <circle key={i} cx={320 + x} cy={392 + y} r={i < 8 ? 3.2 : 2.4} fill="var(--ivory)" />
      ))}

      <circle cx="320" cy="392" r="4.5" fill="var(--brass)" />

      <g fill="var(--ivory-soft)" fontFamily="var(--mono)" fontSize="11" letterSpacing="2">
        <text x="336" y="128">
          RARE
        </text>
        <text x="352" y="398">
          MEAN
        </text>
      </g>
    </svg>
  )
}
