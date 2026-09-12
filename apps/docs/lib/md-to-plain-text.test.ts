import { describe, expect, it } from 'vitest'

import { mdToPlainText } from './md-to-plain-text'

describe('mdToPlainText', () => {
  it('strips code spans from a real title', () => {
    expect(mdToPlainText('Handling errors in `supabase-js`')).toBe('Handling errors in supabase-js')
  })

  it('keeps underscores in extension names', () => {
    expect(mdToPlainText('pg_cron: Schedule Recurring Jobs')).toBe(
      'pg_cron: Schedule Recurring Jobs'
    )
  })
})
