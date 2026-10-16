export type Project = {
  slug: string
  title: string
  kind: string
  summary: string
  /** Short write-up, one paragraph per entry. */
  body: string[]
  /** Spots where Mal should add details before this goes live. */
  todo: string[]
  href: string
  /** 'ios' uses the app case-study layout, 'web' the tool case-study layout. */
  layout?: 'ios' | 'web'
  thumb?: string
}

export const PROJECTS: Project[] = [
  {
    slug: 'strange-fruit',
    title: 'Strange Fruit',
    kind: 'Archive',
    summary: 'The plates archive. A color cloud of slop specimens.',
    body: [],
    todo: [],
    href: '/strange-fruit',
    thumb: '/archive/sg-01.webp',
  },
  {
    slug: 'ikebana',
    title: 'Ikebana',
    kind: 'iOS app',
    summary: 'Make one ikebana concept a day.',
    body: ['Ikebana is an iOS app.', 'You make one ikebana concept each day.'],
    todo: [
      'How a concept is made in the app.',
      'Status: in development, TestFlight, or App Store.',
      'Link and screenshots.',
    ],
    href: '/project/ikebana',
    layout: 'ios',
  },
  {
    slug: 'pet-cemetery',
    title: 'Pet Cemetery',
    kind: 'iOS app',
    summary: 'Keep memories of your pet in photos or video.',
    body: ['Pet Cemetery is an iOS app.', 'You add memories of your pet. A memory is a photo or a video.'],
    todo: ['Who the app is for and why you made it.', 'Status: in development, TestFlight, or App Store.', 'Link and screenshots.'],
    href: '/project/pet-cemetery',
    layout: 'ios',
  },
  {
    slug: 'glitch-the-system',
    title: 'Glitch the System',
    kind: 'Poster tool',
    summary: 'Make propaganda posters.',
    body: ['Glitch the System is a propaganda poster creator.', 'You use it to make posters.'],
    todo: ['Platform: web, iOS, or other.', 'How a poster is made.', 'Status, link, and sample posters.'],
    href: '/project/glitch-the-system',
    layout: 'web',
  },
]

export function findProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug && p.slug !== 'strange-fruit')
}
