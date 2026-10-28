import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('consent islands', () => {
  it('mounts the consent toast on every page', () => {
    expect(read('./Layout.astro')).toContain('<ConsentIsland client:only="react" />')
  })

  it('mounts the Privacy Settings link in the footer', () => {
    expect(read('../components/Footer.astro')).toContain(
      '<PrivacySettingsIsland client:only="react" />'
    )
  })
})
