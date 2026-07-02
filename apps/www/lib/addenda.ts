import fs from 'fs'
import path from 'path'

import { parseVersionFile } from './addenda-utils'

const ADDENDA_DIR = path.join(process.cwd(), 'data/legal/partner-resources')

export interface VersionSummary {
  id: string
  label: string
  effectiveDate: string
  href: string
  isLatest: boolean
}

export interface AddendumSummary {
  slug: string
  title: string
  href: string
  versions: VersionSummary[]
}

function slugToTitle(slug: string) {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function getAddendaList(): AddendumSummary[] {
  const dirs = fs
    .readdirSync(ADDENDA_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.endsWith('-addendum'))
    .map((d) => d.name)
    .sort()

  return dirs.map((slug) => {
    const baseHref = `/legal/partner-resources/program-addenda/${slug}`

    // Newest first (reverse chronological by filename date prefix)
    const files = fs
      .readdirSync(path.join(ADDENDA_DIR, slug))
      .filter((f) => /^\d{8}-/.test(f) && f.endsWith('.mdx'))
      .sort()
      .reverse()

    const versions: VersionSummary[] = files.map((file, i) => {
      const { id, label, effectiveDate } = parseVersionFile(file)
      const isLatest = i === 0
      return {
        id,
        label,
        effectiveDate,
        href: isLatest ? baseHref : `${baseHref}?version=${id}`,
        isLatest,
      }
    })

    return {
      slug,
      title: slugToTitle(slug),
      href: baseHref,
      versions,
    }
  })
}
