/** Real project values (names, one-liners, links). Used by the template pages. */
export type Project = { slug: string; title: string; kind: string; summary: string; href: string; template?: 'ios' | 'web'; card?: string }

export const PROJECTS: Project[] = [
  { slug: 'strange-fruit', title: 'Strange Fruit', kind: 'Archive', summary: 'The plates archive. A color cloud of slop specimens.', href: '/strange-fruit' },
  { slug: 'ikebana', title: 'Ikebana', kind: 'iOS app', summary: 'Make one ikebana concept a day.', href: '/project/ikebana', template: 'ios' },
  { slug: 'pet-cemetery', title: 'Pet Cemetery', kind: 'iOS app', summary: 'Keep memories of your pet in photos or video.', href: '/project/pet-cemetery', template: 'ios' },
  { slug: 'glitch-the-system', title: 'Glitch the System', kind: 'Poster tool', summary: 'Make propaganda posters.', href: '/project/glitch-the-system', template: 'web' },
  { slug: 'ausgang', title: 'Ausgang', kind: 'iOS app', card: 'Talk to Buddha and get advice on your day.', summary: 'Talk to Buddha and get advice on your day. For example, when you have road rage, Buddha helps you become calm and control your emotions.', href: '/project/ausgang', template: 'ios' },
  // TODO(Mal): platform to be confirmed; 'App' for now.
  { slug: '100-objects', title: '100 Objects', kind: 'App', card: 'Track the things that you own.', summary: 'Track the things that you own. Own less, and keep only the objects that have meaning for you.', href: '/project/100-objects', template: 'web' },
]

export function findProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug && p.template)
}
