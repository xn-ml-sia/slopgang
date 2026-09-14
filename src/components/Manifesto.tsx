const NOTES = [
  {
    title: 'The slop',
    body: 'The algorithmic drive toward sterile, hyper-saturated, and perfectly balanced mediocrity. Predictable, high-probability output is not just noise; it is a mirror of collective bias.',
  },
  {
    title: 'The mask',
    body: 'The human reaction—analog filters, VHS, film grain, chromatic aberration—used to inject artificial grit and hide the uncanny perfection of the machine. Costume, then training data.',
  },
  {
    title: 'The mean',
    body: 'By studying the textures of the machine’s mean, we detect the gravity of digital culture. slopgang does not seek the outlier; we study the center to understand the drift.',
  },
] as const

export function Manifesto() {
  return (
    <section id="study" className="study" aria-labelledby="study-title">
      <div className="wrap study-inner">
        <p className="study-label">[ the study ]</p>
        <h2 id="study-title" className="study-title">
          A manifesto for the average
        </h2>
        <p className="study-lede">
          We believe that “slop”—the predictable, high-probability, hyper-smoothed output of large-scale models—is not
          just noise; it is a mirror of collective bias. The archive is the sitting: each specimen a course in the
          aesthetic of the mean.
        </p>
        <ol className="notes">
          {NOTES.map((note) => (
            <li key={note.title} className="note">
              <h3 className="note-title">{note.title}</h3>
              <p className="note-body">{note.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
