import type { SpecimenId } from '../data/catalogue.ts'

type SleeveProps = {
  id: SpecimenId | 'sg-014-back'
  className?: string
}

export function Sleeve({ id, className = 'sleeve' }: SleeveProps) {
  switch (id) {
    case 'sg-011':
      return <Sleeve011 className={className} />
    case 'sg-012':
      return <Sleeve012 className={className} />
    case 'sg-013':
      return <Sleeve013 className={className} />
    case 'sg-014':
      return <Sleeve014 className={className} />
    case 'sg-015':
      return <Sleeve015 className={className} />
    case 'sg-016':
      return <Sleeve016 className={className} />
    case 'sg-014-back':
      return <Sleeve014Back className={className} />
  }
}

export function Disc({ className = 'disc' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 400" aria-hidden="true">
      <circle cx="200" cy="200" r="198" fill="#1c1b18" />
      <g fill="none" stroke="#2c2b27" strokeWidth="1">
        <circle cx="200" cy="200" r="188" />
        <circle cx="200" cy="200" r="176" />
        <circle cx="200" cy="200" r="164" />
        <circle cx="200" cy="200" r="152" />
        <circle cx="200" cy="200" r="140" />
        <circle cx="200" cy="200" r="128" />
        <circle cx="200" cy="200" r="116" />
        <circle cx="200" cy="200" r="104" />
        <circle cx="200" cy="200" r="92" />
      </g>
      <g fill="none" stroke="#3a3934" strokeWidth="2">
        <circle cx="200" cy="200" r="170" />
        <circle cx="200" cy="200" r="134" />
        <circle cx="200" cy="200" r="98" />
      </g>
      <circle cx="200" cy="200" r="68" fill="#f3f0ea" />
      <circle cx="200" cy="200" r="68" fill="none" stroke="#141412" strokeWidth="1.5" />
      <circle cx="200" cy="200" r="4" fill="#141412" />
      <text
        x="200"
        y="166"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="9"
        fill="#141412"
      >
        slopgang
      </text>
      <text
        x="200"
        y="182"
        textAnchor="middle"
        fontFamily="Archivo, sans-serif"
        fontSize="11"
        fontWeight="700"
        fill="#141412"
      >
        The mask
      </text>
      <text
        x="200"
        y="228"
        textAnchor="middle"
        fontFamily="Archivo, sans-serif"
        fontSize="9"
        fill="#141412"
      >
        counter-slop
      </text>
      <text
        x="200"
        y="243"
        textAnchor="middle"
        fontFamily="JetBrains Mono, monospace"
        fontSize="8"
        fill="#6b6862"
      >
        SG-014 · plate · mean
      </text>
    </svg>
  )
}

function Sleeve011({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      role="img"
      aria-label="Sleeve of SG-011, Poreless: a large black circle cropped by the top right corner on white, the portrait mean as a hole in the paper"
    >
      <rect width="400" height="400" fill="#fbfaf7" />
      <circle cx="305" cy="105" r="160" fill="#141412" />
      <text x="32" y="46" className="sv-mono" fill="#141412">
        SG-011
      </text>
      <text x="32" y="292" className="sv-cond" fontSize="24" fill="#141412">
        the portrait mean
      </text>
      <text x="30" y="350" className="sv-bold" fontSize="46" fill="#141412">
        Poreless
      </text>
      <text x="368" y="368" textAnchor="end" className="sv-mono" fill="#6b6862">
        slopgang · visual
      </text>
    </svg>
  )
}

function Sleeve012({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      role="img"
      aria-label="Sleeve of SG-012, The nuance loop: fine vertical stripes on the left half, the title stacked on the right"
    >
      <defs>
        <pattern id="stripes-sg-012" width="12" height="12" patternUnits="userSpaceOnUse">
          <rect width="5" height="12" fill="#141412" />
        </pattern>
      </defs>
      <rect width="400" height="400" fill="#e6e2da" />
      <rect x="0" y="0" width="184" height="400" fill="url(#stripes-sg-012)" />
      <text x="208" y="46" className="sv-mono" fill="#141412">
        SG-012
      </text>
      <text x="208" y="176" className="sv-bold" fontSize="40" fill="#141412">
        The
      </text>
      <text x="208" y="216" className="sv-light" fontSize="40" fill="#141412">
        nuance
      </text>
      <text x="208" y="256" className="sv-bold" fontSize="40" fill="#141412">
        loop
      </text>
      <text x="208" y="320" className="sv-cond" fontSize="22" fill="#141412">
        the helpful assistant
      </text>
      <text x="208" y="368" className="sv-mono" fill="#6b6862">
        textual slop, 2024
      </text>
    </svg>
  )
}

function Sleeve013({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      role="img"
      aria-label="Sleeve of SG-013, Sixteen hedges: sixteen black bars of uneven length stacked on white"
    >
      <rect width="400" height="400" fill="#fbfaf7" />
      <g fill="#141412">
        <rect x="32" y="70" width="336" height="7" />
        <rect x="32" y="84" width="210" height="7" />
        <rect x="32" y="98" width="300" height="7" />
        <rect x="32" y="112" width="150" height="7" />
        <rect x="32" y="126" width="336" height="7" />
        <rect x="32" y="140" width="260" height="7" />
        <rect x="32" y="154" width="120" height="7" />
        <rect x="32" y="168" width="320" height="7" />
        <rect x="32" y="182" width="190" height="7" />
        <rect x="32" y="196" width="336" height="7" />
        <rect x="32" y="210" width="90" height="7" />
        <rect x="32" y="224" width="280" height="7" />
        <rect x="32" y="238" width="230" height="7" />
        <rect x="32" y="252" width="336" height="7" />
        <rect x="32" y="266" width="170" height="7" />
        <rect x="32" y="280" width="310" height="7" />
      </g>
      <text x="32" y="46" className="sv-mono" fill="#141412">
        SG-013
      </text>
      <text x="368" y="46" textAnchor="end" className="sv-mono" fill="#6b6862">
        slopgang · textual
      </text>
      <text x="32" y="326" className="sv-cond" fontSize="22" fill="#141412">
        the refusal to take a stance
      </text>
      <text
        x="30"
        y="372"
        className="sv-wide"
        fontSize="44"
        fill="#141412"
        textLength="338"
        lengthAdjust="spacingAndGlyphs"
      >
        Sixteen hedges
      </text>
    </svg>
  )
}

function Sleeve014({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      role="img"
      aria-label="Sleeve of SG-014, The mask: seven white rules of uneven length on black, scanlines as costume, the title set wide along the foot"
    >
      <rect width="400" height="400" fill="#141412" />
      <g stroke="#f3f0ea" strokeWidth="2.5" strokeLinecap="square">
        <line x1="32" y1="84" x2="368" y2="84" />
        <line x1="32" y1="108" x2="296" y2="108" />
        <line x1="32" y1="132" x2="344" y2="132" />
        <line x1="32" y1="156" x2="214" y2="156" />
        <line x1="32" y1="180" x2="368" y2="180" />
        <line x1="32" y1="204" x2="258" y2="204" />
        <line x1="32" y1="228" x2="320" y2="228" />
      </g>
      <text x="32" y="46" className="sv-mono" fill="#f3f0ea">
        SG-014
      </text>
      <text x="368" y="46" textAnchor="end" className="sv-mono" fill="#f3f0ea">
        slopgang · counter
      </text>
      <text x="32" y="300" className="sv-cond" fontSize="28" fill="#f3f0ea">
        analog grit as alibi
      </text>
      <text
        x="30"
        y="360"
        className="sv-wide"
        fontSize="52"
        fill="#f3f0ea"
        textLength="338"
        lengthAdjust="spacingAndGlyphs"
      >
        The mask
      </text>
    </svg>
  )
}

function Sleeve015({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      role="img"
      aria-label="Sleeve of SG-015, Delve / tapestry: a field of grey dots on black with the title in white"
    >
      <defs>
        <pattern id="dots-sg-015" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="9" cy="9" r="4.2" fill="#6b6862" />
        </pattern>
      </defs>
      <rect width="400" height="400" fill="#141412" />
      <rect x="216" y="0" width="184" height="400" fill="url(#dots-sg-015)" />
      <text x="32" y="46" className="sv-mono" fill="#f3f0ea">
        SG-015
      </text>
      <text x="32" y="188" className="sv-bold" fontSize="34" fill="#f3f0ea">
        Delve /
      </text>
      <text x="32" y="224" className="sv-bold" fontSize="34" fill="#f3f0ea">
        tapestry
      </text>
      <text x="32" y="270" className="sv-cond" fontSize="22" fill="#f3f0ea">
        lexical attractors
      </text>
      <text x="32" y="368" className="sv-mono" fill="#f3f0ea">
        slopgang · lexicon · 2024
      </text>
    </svg>
  )
}

function Sleeve016({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      role="img"
      aria-label="Sleeve of SG-016, The mean moves: the square split by a diagonal into white and black, the title split across the two halves"
    >
      <rect width="400" height="400" fill="#fbfaf7" />
      <polygon points="0,400 400,0 400,400" fill="#141412" />
      <text x="32" y="46" className="sv-mono" fill="#141412">
        SG-016
      </text>
      <text x="32" y="80" className="sv-cond" fontSize="22" fill="#141412">
        movement of the centroid
      </text>
      <text x="32" y="176" className="sv-bold" fontSize="54" fill="#141412">
        The mean
      </text>
      <text x="368" y="330" textAnchor="end" className="sv-bold" fontSize="54" fill="#fbfaf7">
        moves
      </text>
      <text x="368" y="368" textAnchor="end" className="sv-mono" fill="#f3f0ea">
        slopgang · drift · 2026
      </text>
    </svg>
  )
}

function Sleeve014Back({ className }: { className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      role="img"
      aria-label="Reverse sleeve of SG-014 with the costume listed as side one and the loop listed as side two"
    >
      <rect width="400" height="400" fill="#fbfaf7" />
      <text x="32" y="46" className="sv-mono" fill="#141412">
        SG-014
      </text>
      <text x="368" y="46" textAnchor="end" className="sv-mono" fill="#6b6862">
        slopgang · counter
      </text>
      <text x="32" y="92" className="sv-bold" fontSize="30" fill="#141412">
        The mask
      </text>
      <text x="32" y="116" className="sv-cond" fontSize="18" fill="#141412">
        analog grit as alibi
      </text>

      <text x="32" y="156" className="sv-mono" fill="#6b6862">
        Side one · costume
      </text>
      <line x1="32" y1="164" x2="368" y2="164" stroke="#141412" strokeWidth="1" />
      <BackRow y={184} ruleY={191} left="Scanline" right="vhs" />
      <BackRow y={210} ruleY={217} left="Gate weave" right="8mm" />
      <BackRow y={236} ruleY={243} left="Film grain" right="35mm" />
      <BackRow y={262} ruleY={269} left="Chromatic aberration" right="rgb" />

      <text x="32" y="298" className="sv-mono" fill="#6b6862">
        Side two · absorbed
      </text>
      <line x1="32" y1="306" x2="368" y2="306" stroke="#141412" strokeWidth="1" />
      <BackRow y={326} ruleY={333} left="VHS as alibi" right="loop" />
      <BackRow y={352} ruleY={359} left="Artificial grit" right="mean" />
      <text x="32" y="378" fontSize="13" fill="#141412">
        The costume already in the weights
      </text>
      <text x="368" y="378" textAnchor="end" className="sv-mono" fill="#141412">
        data
      </text>
    </svg>
  )
}

function BackRow({ y, ruleY, left, right }: { y: number; ruleY: number; left: string; right: string }) {
  return (
    <>
      <text x="32" y={y} fontSize="13" fill="#141412">
        {left}
      </text>
      <text x="368" y={y} textAnchor="end" className="sv-mono" fill="#141412">
        {right}
      </text>
      <line x1="32" y1={ruleY} x2="368" y2={ruleY} stroke="#cfcac0" strokeWidth="1" />
    </>
  )
}
