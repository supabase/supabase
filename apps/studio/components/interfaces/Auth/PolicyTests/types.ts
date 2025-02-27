import { PostgrestRole } from 'lib/role-impersonation'

// A simplified version of the role for testing purposes
export type PolicyTestRole = {
  role: 'anon' | 'authenticated' | 'service_role'
  email?: string
  userId?: string
  externalSub?: string
  // Authentication Assurance Level for MFA
  aal?: 'aal1' | 'aal2'
  // JSON string containing additional claims for external auth
  additionalClaims?: string
}

export interface PolicyTest {
  id: string
  name: string
  role: PolicyTestRole | undefined
  sql: string
  /**
   * The expected result of executing the SQL. Can be either:
   * 1. A JSON string representing a successful query result
   * 2. An error message string starting with "Error:" to test policy rejections
   */
  expectedResult: string
  /**
   * The actual result from executing the SQL. Can be either:
   * 1. A JSON string for successful queries
   * 2. An error message string starting with "Error:" for failed queries
   */
  actualResult?: string
  status?: 'passed' | 'failed' | 'running' | 'error' | 'queued'
  errorMessage?: string
}

export const LOCAL_STORAGE_KEYS = {
  POLICY_TESTS: 'supabase-policy-tests',
}
