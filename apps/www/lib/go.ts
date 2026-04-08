import rawPages from '@/_go'
import { goPageSchema, type GoPage } from '@/types/go'

function isExpired(page: { expiresAt?: string }): boolean {
  if (!page.expiresAt) return false
  const [year, month, day] = page.expiresAt.split('-').map(Number)
  if (![year, month, day].every(Number.isInteger)) {
    throw new Error(`Invalid expiresAt value: "${page.expiresAt}"`)
  }
  const expiresAtEndOfDayUtc = Date.UTC(year, month - 1, day, 23, 59, 59, 999)
  return Date.now() > expiresAtEndOfDayUtc
}

export function getAllGoPages(): GoPage[] {
  const pages: GoPage[] = []
  const seenSlugs = new Set<string>()

  for (const raw of rawPages) {
    if (isExpired(raw)) continue

    const result = goPageSchema.safeParse(raw)

    if (!result.success) {
      throw new Error(
        `Invalid go page definition (slug: "${(raw as any).slug ?? 'unknown'}"):\n${result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n')}`
      )
    }

    if (seenSlugs.has(result.data.slug)) {
      throw new Error(`Duplicate slug "${result.data.slug}" in _go registry`)
    }

    seenSlugs.add(result.data.slug)
    pages.push(result.data)
  }

  return pages
}

export function getAllGoSlugs(): string[] {
  return getAllGoPages().map((p) => p.slug)
}

export function getGoPageBySlug(slug: string): GoPage | undefined {
  return getAllGoPages().find((p) => p.slug === slug)
}
