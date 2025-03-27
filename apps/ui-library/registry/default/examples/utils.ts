export function generateFullName(): string {
  const names = [
    'Mark S.',
    'Mark Scout',
    'Helly R.',
    'Helena Eagan',
    'Dylan G.',
    'Dylan George',
    'Irving B.',
    'Irving Bailiff',
    'Burt G.',
    'Burt Goodman',
    'Ms. Casey',
    'Gemma Scout',
    'Harmony Cobel',
    'Mrs. Selvig',
    'Seth Milchik',
  ]

  return names[Math.floor(Math.random() * names.length)]
}
