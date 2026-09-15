import { useMemo, useState } from 'react'
import { filters, specimens, type Format } from '../data/catalogue.ts'
import { Sleeve } from './Sleeve.tsx'

type FilterId = 'all' | Format

export function Catalogue() {
  const [filter, setFilter] = useState<FilterId>('all')
  const shown = useMemo(
    () => specimens.filter((s) => filter === 'all' || s.format === filter),
    [filter],
  )

  return (
    <section className="section catalogue-home" id="catalogue">
      <div className="wrap">
        <div className="section-head">
          <div>
            <span className="kicker">Catalogue</span>
            <h1>Series one, six specimens of the mean.</h1>
          </div>
          <span className="meta">Numbered SG-011 to SG-016 · still, prose, grit, drift</span>
        </div>

        <div className="filters" role="group" aria-label="Filter the catalogue by class">
          {filters.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
          <span className="count meta">
            Showing {shown.length} of {specimens.length}
          </span>
        </div>

        <div className="grid">
          {specimens.map((s) => (
            <figure key={s.id} className="record" hidden={filter !== 'all' && s.format !== filter}>
              {s.featured ? (
                <a href="/about#featured" aria-label={`${s.cat}, ${s.title}, read the study`}>
                  <Sleeve id={s.id} />
                </a>
              ) : (
                <Sleeve id={s.id} />
              )}
              <figcaption>
                <span className="cat">{s.cat}</span>
                <span className="fmt">{s.formatLabel}</span>
                <span className="title">{s.title}</span>
                <span className="artist">{s.author}</span>
                <span className="phase">{s.phase}</span>
                <span className="status">{s.status}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
