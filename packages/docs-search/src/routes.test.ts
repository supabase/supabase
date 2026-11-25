import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { filePathToSlug } from './routes.js'

const root = path.resolve('/content')

describe('filePathToSlug', () => {
  it('strips the content root and the .md extension', () => {
    expect(filePathToSlug(path.join(root, 'guides', 'auth', 'users.md'), root)).toBe(
      'guides/auth/users'
    )
  })

  it('handles .mdx files', () => {
    expect(filePathToSlug(path.join(root, 'intro.mdx'), root)).toBe('intro')
  })

  it('maps index files to their folder', () => {
    expect(filePathToSlug(path.join(root, 'guides', 'index.md'), root)).toBe('guides')
    expect(filePathToSlug(path.join(root, 'index.md'), root)).toBe('')
  })
})
