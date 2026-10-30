import { beforeEach, describe, expect, it, vi } from 'vitest'

const reference = vi.hoisted(() => ({
  sections: [] as Array<{ id: string; slug: string; title: string; type: string }>,
}))

vi.mock('~/features/docs/Reference.generated.singleton', () => ({
  getFlattenedSections: async () => reference.sections,
  getFunctionsList: async () => [],
  getTypeSpec: async () => undefined,
}))

vi.mock('~/features/docs/Reference.mdx', () => ({
  getRefMarkdown: async () => 'Reference content',
}))

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('notFound')
  },
}))

import { GET } from './route'

function section(slug: string, title: string, type = 'markdown') {
  return { id: slug, slug, title, type }
}

async function html(path: string) {
  const response = await GET(new Request(`https://supabase.com${path}`))
  expect(response.status).toBe(200)
  return response.text()
}

beforeEach(() => {
  reference.sections = []
})

describe('crawler reference aliases', () => {
  it('resolves unique bare JavaScript modifier and filter slugs', async () => {
    reference.sections = [
      section('using-modifiers-order', 'Order'),
      section('using-filters-or', 'Or'),
      section('using-modifiers-maybesingle', 'Maybe single'),
    ]

    for (const [requested, canonical] of [
      ['order', 'using-modifiers-order'],
      ['or', 'using-filters-or'],
      ['maybeSingle', 'using-modifiers-maybesingle'],
    ]) {
      expect(await html(`/reference/javascript/${requested}`)).toContain(
        `href="https://supabase.com/docs/reference/javascript/${canonical}"`
      )
    }
  })

  it('resolves storage slugs and keeps an exact versioned slug', async () => {
    reference.sections = [
      section('file-buckets-createbucket', 'Create bucket'),
      section('file-buckets-upload', 'Upload'),
      section('file-buckets-createsignedurl', 'Create signed URL'),
      section('file-buckets-updatebucket', 'Update bucket'),
      section('file-buckets-listv2', 'List files v2'),
    ]

    for (const [requested, canonical] of [
      ['storage-createbucket', 'file-buckets-createbucket'],
      ['storage-from-upload', 'file-buckets-upload'],
      ['storage-from-createsignedurl', 'file-buckets-createsignedurl'],
      ['storage-updatebucket', 'file-buckets-updatebucket'],
      ['file-buckets-listv2', 'file-buckets-listv2'],
    ]) {
      expect(await html(`/reference/javascript/${requested}`)).toContain(
        `href="https://supabase.com/docs/reference/javascript/${canonical}"`
      )
    }
  })

  it('resolves SDK-specific user and root aliases', async () => {
    reference.sections = [
      section('introduction', 'Introduction'),
      section('auth-admin', 'Admin'),
      section('auth-getuser', 'Get user'),
      section('auth-currentuser', 'Current user'),
    ]

    expect(await html('/reference/javascript')).toContain(
      'href="https://supabase.com/docs/reference/javascript/introduction"'
    )
    expect(await html('/reference/javascript/start')).toContain('JavaScript: Introduction')
    expect(await html('/reference/javascript/admin-api')).toContain('JavaScript: Admin')
    expect(await html('/reference/swift/get-user')).toContain(
      'href="https://supabase.com/docs/reference/swift/auth-getuser"'
    )
    expect(await html('/reference/dart/get-user')).toContain(
      'href="https://supabase.com/docs/reference/dart/auth-currentuser"'
    )
    expect(await html('/reference/kotlin')).toContain('Kotlin: Introduction')
  })

  it('keeps exact matches ahead of aliases and rejects ambiguous bare slugs', async () => {
    reference.sections = [
      section('delete', 'Delete'),
      section('auth-passkey-list', 'Passkeys'),
      section('file-buckets-list', 'Files'),
    ]

    expect(await html('/reference/javascript/delete')).toContain('JavaScript: Delete')
    expect(await html('/reference/javascript/storage-list')).toContain('JavaScript: Files')
    await expect(html('/reference/javascript/list')).rejects.toThrow('notFound')
  })

  it('uses canonical paths for explicit versions', async () => {
    reference.sections = [section('auth-update', 'Update')]

    expect(await html('/reference/javascript/v1/auth-update')).toContain(
      'href="https://supabase.com/docs/reference/javascript/v1/auth-update"'
    )
    reference.sections = [section('auth-updateuser', 'Update')]
    expect(await html('/reference/javascript/v2/auth-updateuser')).toContain(
      'href="https://supabase.com/docs/reference/javascript/auth-updateuser"'
    )
  })
})
