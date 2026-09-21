import { SiteFooter } from '../components/SiteFooter.tsx'
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
              That catalogue number is not in Series one. The mean moves; the index has not caught it yet.
            </p>
            <a className="btn btn-solid" href="/">
              ← Back to the feed
            </a>
          </div>
        </main>
        <SiteFooter compact />
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
              <a className="specimen-back link-arrow" href="/">
                ← Back to the feed
              </a>
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
                {record.author ? (
                  <div>
                    <dt>Logged by</dt>
                    <dd>{record.author}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          </div>

          <div className="wrap specimen-essay-wrap">
            <section className="specimen-essay" id="essay" aria-labelledby="essay-heading">
              <span className="kicker">Why this is slop</span>
              <h2 id="essay-heading">A note from the mean.</h2>
              {paragraphs.length > 0 ? (
                paragraphs.map((p, i) => <p key={i}>{p}</p>)
              ) : (
                <p>Essay forthcoming. The plate is logged; the sleeve note is still on the bench.</p>
              )}
              <div className="specimen-actions">
                <a className="btn btn-solid" href="/">
                  ← Back to the feed
                </a>
                <a className="link-arrow" href={record.url} target="_blank" rel="noreferrer">
                  Source plate →
                </a>
                <a className="link-arrow" href="/about">
                  Read the manifesto →
                </a>
              </div>
            </section>
          </div>
        </article>
      </main>
      <SiteFooter compact />
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
