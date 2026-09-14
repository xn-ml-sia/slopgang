export function SiteFooter() {
  return (
    <footer className="colophon">
      <div className="wrap">
        <div className="colophon-grid">
          <div>
            <h2>Archive</h2>
            <p>
              <a href="#archive">the feed</a>
              <br />
              <a href="#study">the study</a>
            </p>
          </div>
          <div>
            <h2>Write</h2>
            <p>
              <a href="https://github.com/xn-ml-sia/slopgang" target="_blank" rel="noreferrer">
                github.com/xn-ml-sia/slopgang
              </a>
              <br />
              forensic notes, not a product
            </p>
          </div>
          <div>
            <h2>Sources</h2>
            <p>
              archive · reddit · rss
              <br />
              x · instagram
            </p>
          </div>
          <div>
            <h2>Phase</h2>
            <p>
              I · the archive
              <br />
              II · the index
              <br />
              III · drift
            </p>
          </div>
        </div>
        <p className="quote">
          “The most profound truths are not found in the outliers, but in the center of the sludge.”
        </p>
        <p className="colophon-meta">slopgang · sources are adapters · the mean is the subject</p>
      </div>
    </footer>
  )
}
