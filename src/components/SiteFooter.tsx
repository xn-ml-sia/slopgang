export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <p className="big">We do not hunt outliers.</p>
          </div>
          <div>
            <span className="label">Find us</span>
            <p>
              slopgang
              <br />
              the archive
              <br />
              phase I · {year}
            </p>
          </div>
          <div>
            <span className="label">Write</span>
            <p>
              <a href="https://github.com/xn-ml-sia/slopgang" target="_blank" rel="noreferrer">
                github.com/xn-ml-sia/slopgang
              </a>
              <br />
              <span className="muted">Forensic notes, not a product.</span>
            </p>
          </div>
          <div>
            <span className="label">Colophon</span>
            <p>
              Archivo for the sleeves and the page.
              <br />
              JetBrains Mono for catalogue numbers.
              <br />
              <span className="muted">Sleeves drawn in vector, not scanned.</span>
            </p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {year} slopgang · specimens logged, not sold</span>
          <span>Archive · Slop Index · Drift Analysis</span>
        </div>
      </div>
    </footer>
  )
}
