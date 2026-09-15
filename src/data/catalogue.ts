export type Format = 'visual' | 'textual' | 'counter' | 'drift'

export type SpecimenId = 'sg-011' | 'sg-012' | 'sg-013' | 'sg-014' | 'sg-015' | 'sg-016'

export type Specimen = {
  id: SpecimenId
  cat: string
  year: string
  format: Format
  formatLabel: string
  title: string
  author: string
  role: string
  status: string
  phase: string
  featured?: boolean
}

export const specimens: Specimen[] = [
  {
    id: 'sg-011',
    cat: 'SG-011',
    year: '2024',
    format: 'visual',
    formatLabel: '2024 · still',
    title: 'Poreless',
    author: 'visual slop',
    role: 'the portrait mean',
    status: 'in archive',
    phase: 'phase I',
  },
  {
    id: 'sg-012',
    cat: 'SG-012',
    year: '2024',
    format: 'textual',
    formatLabel: '2024 · prose',
    title: 'The nuance loop',
    author: 'textual slop',
    role: 'the helpful assistant',
    status: 'in archive',
    phase: 'phase I',
  },
  {
    id: 'sg-013',
    cat: 'SG-013',
    year: '2024',
    format: 'textual',
    formatLabel: '2024 · prose',
    title: 'Sixteen hedges',
    author: 'textual slop',
    role: 'the refusal to take a stance',
    status: 'low entropy',
    phase: 'phase I',
  },
  {
    id: 'sg-014',
    cat: 'SG-014',
    year: '2025',
    format: 'counter',
    formatLabel: '2025 · grit',
    title: 'The mask',
    author: 'counter-slop',
    role: 'analog grit as alibi',
    status: 'in study',
    phase: 'phase I',
    featured: true,
  },
  {
    id: 'sg-015',
    cat: 'SG-015',
    year: '2024',
    format: 'textual',
    formatLabel: '2024 · lexicon',
    title: 'Delve / tapestry',
    author: 'lexical attractors',
    role: 'RLHF English',
    status: 'in archive',
    phase: 'phase I',
  },
  {
    id: 'sg-016',
    cat: 'SG-016',
    year: '2026',
    format: 'drift',
    formatLabel: '2026 · drift',
    title: 'The mean moves',
    author: 'trend drift',
    role: 'movement of the centroid',
    status: 'phase III',
    phase: 'phase III',
  },
]

export const filters: { id: 'all' | Format; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'visual', label: 'Visual' },
  { id: 'textual', label: 'Textual' },
  { id: 'counter', label: 'Counter-slop' },
  { id: 'drift', label: 'Drift' },
]

export const methodSteps = [
  {
    n: '01',
    title: 'Capture',
    body: 'We take public stills and paragraphs at the centre of current model output. Outliers are left on the table. The archive is a list of the average, not a gallery of tricks.',
    specTitle: 'Open web, fair-use stills',
    spec: 'No private hosts. No scraping of locked gardens. A still is a plate, not a video file.',
  },
  {
    n: '02',
    title: 'Relabel',
    body: 'Each plate is marked visual-slop, textual-slop, or counter-slop. The tag is an argument about the mean, not a score. Mixed specimens stay mixed.',
    specTitle: 'Three marks, one centroid',
    spec: 'Visual: hyper-plastic, bloom, refused shadow. Textual: hedges, AI-isms, metronomic syntax. Counter: grit applied after the fact.',
  },
  {
    n: '03',
    title: 'Index',
    body: 'Recurring textures become archetypes — hyper-plastic, the nuance loop, lexical attractors, artificial grit — so the next still can be filed against a face the lab already knows.',
    specTitle: 'Phase II · the Slop Index',
    spec: 'A searchable set of aesthetic archetypes. Series one is the first six faces of the average.',
  },
  {
    n: '04',
    title: 'Measure',
    body: 'We watch entropy, saturation, and the movement of the mean. When the centre of gravity shifts from hyper-smooth to lo-fi, the cultural tide has already turned.',
    specTitle: 'Phase III · Drift Analysis',
    spec: 'The bell curve as a sensor. Collapse narrows it; preference drags it. Both are logged.',
  },
  {
    n: '05',
    title: 'Sleeve',
    body: 'The specimen is reset as a typographic object in the page’s own type and palette, so the same plate can sit in the fold, the grid, and on the reverse.',
    specTitle: 'Inline SVG, two blacks',
    spec: 'Radius 0. Nothing laminated. Nothing uppercase. Catalogue numbers travel with the plate.',
  },
] as const

export const manifestoNotes = [
  {
    n: '01',
    title: 'The slop',
    body: 'The algorithmic drive toward sterile, hyper-saturated, and perfectly balanced mediocrity. Predictable, high-probability output is not noise; it is a mirror of collective bias.',
    specTitle: 'High-density mass of the bell curve',
    spec: 'Bias, homogenization, and model collapse converge here. We study the centre.',
  },
  {
    n: '02',
    title: 'The mask',
    body: 'The human reaction — analog filters, VHS, film grain, chromatic aberration — used to inject artificial grit and hide the uncanny perfection of the machine. Costume, then training data.',
    specTitle: 'SG-014 · counter-slop',
    spec: 'The machine does not remember dust; it samples the look of remembering.',
  },
  {
    n: '03',
    title: 'The mean',
    body: 'By studying the textures of the machine’s mean, we detect the gravity of digital culture. slopgang does not seek the outlier; we study the centre to understand the drift.',
    specTitle: 'The centroid as instrument',
    spec: 'When the mean moves, the tide has turned. Phase III watches that motion.',
  },
  {
    n: '04',
    title: 'Physics of slop',
    body: 'Visual slop is poreless skin, volumetric bloom, mathematical symmetry, and the rejection of organic shadow. Textual slop is the nuance loop, the lexical attractors (delve, tapestry, landscape), and rhythmic syntactic monotony.',
    specTitle: 'Textures of the current output',
    spec: 'SG-011, SG-012, SG-013, SG-015. Four plates, two families.',
  },
  {
    n: '05',
    title: 'Collapse and drift',
    body: 'As models train on machine-generated data, the bell curve narrows. Artificial grit is collapse wearing a costume: the look of human imperfection, without the reason for it. Drift is the mean walking.',
    specTitle: 'Phase II and III still on the bench',
    spec: 'Index the archetypes, then quantify the walk. Series one is the pressing that makes both possible.',
  },
] as const

export const journalNotes = [
  {
    date: '15 September 2026',
    title: 'Why the mask stays analog',
    body: 'A clean render exists, and we looked at it. The skin is wider but the face loses its centre. Grain settled it anyway: the alibi is the subject.',
    href: '#featured',
  },
  {
    date: '2 September 2026',
    title: 'Collapse engineering, a lab note',
    body: 'Train a model on its own stills long enough and the hedges shorten. Sixteen bars become eight, then four. The average gets louder as it thins.',
    href: '#method',
  },
  {
    date: '21 August 2026',
    title: 'Setting a sleeve from the centroid',
    body: 'There is no original mechanical. How we rebuilt Poreless from a public still, a ruler, and the habit of putting the catalogue number on every surface.',
    href: '/',
  },
] as const

export const featuredSpecs = [
  { dt: 'Catalogue number', dd: 'SG-014' },
  { dt: 'Series', dd: 'One · six specimens of the mean' },
  { dt: 'Class', dd: 'Counter-slop · analog grit as alibi' },
  { dt: 'First logged', dd: '2025, from public stills of costume-as-data' },
  { dt: 'Source', dd: 'Grit applied after the fact: VHS, grain, gate weave, chromatic aberration' },
  { dt: 'Method', dd: 'Sleeve reset in two blacks on uncoated paper; reverse lists the costume in full' },
  { dt: 'Also in series', dd: 'Poreless · The nuance loop · Sixteen hedges · Delve / tapestry · The mean moves' },
] as const

export const aboutSpecs = [
  { dt: 'Wordmark', dd: 'slopgang · one word, lowercase' },
  { dt: 'Subject', dd: 'The aesthetic of the average in generative AI' },
  { dt: 'Phase I', dd: 'The Archive — specimens pressed as a catalogue' },
  { dt: 'Phase II', dd: 'The Slop Index — searchable archetypes of the mean' },
  { dt: 'Phase III', dd: 'Drift Analysis — tools for the movement of the centroid' },
  { dt: 'Method', dd: 'Capture, relabel, index, measure, sleeve' },
  { dt: 'We do not', dd: 'Hunt outliers, scrape locked gardens, or run a live social feed on the homepage' },
] as const
