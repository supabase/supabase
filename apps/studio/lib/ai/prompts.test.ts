import { describe, expect, test } from 'vitest'

import { RLS_PROMPT } from './prompts'

describe('RLS_PROMPT', () => {
  test('secures SECURITY DEFINER helper functions against default PUBLIC access', () => {
    expect(RLS_PROMPT).toContain("SET search_path = ''")
    expect(RLS_PROMPT).toContain(
      'REVOKE EXECUTE ON FUNCTION private.get_user_tenant() FROM PUBLIC;'
    )
    expect(RLS_PROMPT).toContain(
      'GRANT EXECUTE ON FUNCTION private.get_user_tenant() TO authenticated;'
    )
    expect(RLS_PROMPT).toContain('FROM public.user_profiles')
    expect(RLS_PROMPT).not.toContain(
      'REVOKE EXECUTE ON FUNCTION get_user_tenant() FROM anon, authenticated;'
    )
  })
})
