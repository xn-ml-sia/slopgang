/** Real project values (names, one-liners, links). Used by the template pages. */
export type Project = { slug: string; title: string; kind: string; summary: string; href: string; template?: 'ios' | 'web' }

export const PROJECTS: Project[] = [
  { slug: 'strange-fruit', title: 'Strange Fruit', kind: 'Archive', summary: 'The plates archive. A color cloud of slop specimens.', href: '/strange-fruit' },
  { slug: 'ikebana', title: 'Ikebana', kind: 'iOS app', summary: 'Make one ikebana concept a day.', href: '/project/ikebana', template: 'ios' },
  { slug: 'pet-cemetery', title: 'Pet Cemetery', kind: 'iOS app', summary: 'Keep memories of your pet in photos or video.', href: '/project/pet-cemetery', template: 'ios' },
  { slug: 'glitch-the-system', title: 'Glitch the System', kind: 'Poster tool', summary: 'Make propaganda posters.', href: '/project/glitch-the-system', template: 'web' },
]

export function findProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug && p.template)
}
