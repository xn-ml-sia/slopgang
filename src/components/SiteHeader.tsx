export function SiteHeader() {
  return (
    <header className="masthead">
      <div className="masthead-top">
        <p className="overline">Phase 1 — The Archive</p>
        <p className="overline masthead-mark">
          <span className="centroid" aria-hidden="true" />
          centroid study
        </p>
      </div>

      <div className="wordmark-row">
        <h1 className="wordmark">Slop Gang</h1>
        <p className="wordmark-aside">
          Mapping the
          <br />
          aesthetic of the average
        </p>
      </div>

      <p className="lede">
        A forensic feed of the statistical centroid: hyper-smoothed images, high-probability prose, and the analog
        masks used to hide them. We do not hunt outliers. We log the mean.
      </p>

      <details className="manifesto">
        <summary>The manifesto</summary>
        <div className="manifesto-body">
          <p>
            We believe that “slop”—the predictable, high-probability, hyper-smoothed output of large-scale models—is
            not just noise; it is a mirror of collective bias.
          </p>
          <p>
            By studying the textures of the machine’s mean, we can detect the gravity of our current digital culture.
            We track the tension between:
          </p>
          <ol>
            <li>
              <strong>The Slop.</strong> The algorithmic drive toward sterile, hyper-saturated, and perfectly balanced
              mediocrity.
            </li>
            <li>
              <strong>The Mask.</strong> The human reaction—analog filters (VHS, film grain, chromatic aberration)
              used to inject artificial grit and mask the uncanny perfection of the machine.
            </li>
          </ol>
          <p>Slop Gang does not seek the outlier; we study the center to understand the drift.</p>
        </div>
      </details>
    </header>
  )
}
