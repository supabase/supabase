import { describe, expect, it } from 'vitest'

import { parseProjectRef } from './compute-project-ref'

const REF = 'abcdefghijklmnopqrst'

describe('parseProjectRef', () => {
  it.each([
    REF,
    `  ${REF.toUpperCase()}  `,
    `https://${REF}.supabase.co`,
    `https://${REF}.supabase.co/`,
    `${REF}.supabase.co/rest/v1/`,
    `db.${REF}.supabase.co`,
    `https://${REF}.functions.supabase.co/hello`,
    `https://app.supabase.com/project/${REF}`,
    `https://supabase.com/dashboard/project/${REF}`,
    `https://supabase.com/dashboard/project/${REF}/settings/general`,
    `supabase.com/dashboard/project/${REF}?tab=api`,
  ])('extracts the ref from %s', (input) => {
    expect(parseProjectRef(input)).toBe(REF)
  })

  it.each([
    '',
    'abc',
    `${REF}x`,
    `https://${REF}.supabase.com`,
    `https://${REF}.example.co`,
    `https://evil.com/${REF}.supabase.co`,
    `https://${REF}.supabase.co.evil.com`,
    'https://supabase.com/dashboard/projects',
  ])('rejects %s', (input) => {
    expect(parseProjectRef(input)).toBeNull()
  })
})
