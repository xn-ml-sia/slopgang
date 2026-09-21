import { SiteNav } from '../components/SiteNav.tsx'
import {
  catalogueLabel,
  shortTitle,
  type ArchiveRecord,
} from '../data/feed.ts'

type Props = {
  slug: string
  record?: ArchiveRecord
}

const FALLBACK_LOGGERS = [
  'Ada Ridge',
  'N. Vale',
  'Jules Orm',
  'Mira Chen',
  'Theo Ash',
  'Rin Calder',
  'Ivy Moss',
  'Seth Wren',
]

function loggedBy(record: ArchiveRecord): string {
  const named = record.author?.trim()
  if (named) return named
  let h = 0
  for (let i = 0; i < record.id.length; i++) h = (h * 31 + record.id.charCodeAt(i)) >>> 0
  return FALLBACK_LOGGERS[h % FALLBACK_LOGGERS.length]
}

export function Specimen({ slug, record }: Props) {
  if (!record) {
    return (
      <div className="feed specimen-page">
        <SiteNav current="specimen" />
        <main className="specimen-missing">
          <div className="wrap">
            <span className="kicker">Specimen</span>
            <h1>No plate for {slug}.</h1>
            <p className="lead">
              That catalogue number is not in the archive yet. The mean moves; the index has not caught it.
            </p>
          </div>
        </main>
      </div>
    )
  }

  const title = shortTitle(record.title)
  const cat = catalogueLabel(record.id)
  const date = formatDate(record.timestamp)
  const essay = record.essay?.trim() || record.body?.trim() || ''
  const paragraphs = essay
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <div className="feed specimen-page">
      <SiteNav current="specimen" />
      <main>
        <article className="specimen">
          <div className="wrap specimen-layout">
            <div className="specimen-plate">
              <MediaPlate item={record} title={title} />
            </div>
            <div className="specimen-copy">
              <span className="kicker">
                {cat} · {record.tags.join(' · ')}
              </span>
              <h1>{title}</h1>
              {record.caption ? <p className="specimen-deck">{record.caption}</p> : null}
              <dl className="specs specimen-specs">
                <div>
                  <dt>Logged</dt>
                  <dd>{date}</dd>
                </div>
                <div>
                  <dt>Catalogue</dt>
                  <dd>{cat}</dd>
                </div>
                <div>
                  <dt>Tags</dt>
                  <dd>{record.tags.join(', ')}</dd>
                </div>
                <div>
                  <dt>Logged by</dt>
                  <dd>{loggedBy(record)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="wrap specimen-essay-wrap">
            <section className="specimen-essay" id="essay" aria-label="Essay">
              {paragraphs.length > 0 ? (
                paragraphs.map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p>Essay forthcoming. The plate is logged; the sleeve note is still on the bench.</p>
              )}
            </section>
          </div>
        </article>
      </main>
    </div>
  )
}

function MediaPlate({ item, title }: { item: ArchiveRecord; title: string }) {
  if (item.media?.type === 'video' && item.media.url) {
    return (
      <figure className="specimen-media">
        <video
          src={item.media.url}
          poster={item.media.poster}
          width={item.media.width ?? 960}
          height={item.media.height ?? 540}
          controls
          playsInline
          preload="metadata"
          aria-label={item.media.alt ?? title}
        />
        {item.media.alt ? <figcaption className="meta">{item.media.alt}</figcaption> : null}
      </figure>
    )
  }

  if (item.media?.url) {
    return (
      <figure className="specimen-media">
        <img
          src={item.media.url}
          alt={item.media.alt ?? title}
          width={item.media.width ?? 960}
          height={item.media.height ?? 540}
          decoding="async"
        />
        {item.media.alt ? <figcaption className="meta">{item.media.alt}</figcaption> : null}
      </figure>
    )
  }

  if (item.palette && item.palette.length > 0) {
    return (
      <figure className="specimen-media specimen-swatch" aria-hidden="true">
        <div className="feed-swatch">
          {item.palette.map((color, i) => (
            <span key={`${item.id}-${color}-${i}`} style={{ background: color }} />
          ))}
        </div>
      </figure>
    )
  }

  return (
    <figure className="specimen-media specimen-text-plate">
      <p>{item.body ?? item.caption ?? title}</p>
    </figure>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
