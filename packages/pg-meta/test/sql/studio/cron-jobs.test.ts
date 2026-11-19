import { describe, expect, test } from 'vitest'

import { getCronJobsMinimalSql, getCronJobsSql } from '../../../src/sql/studio/database/cron-jobs'

// Pure SQL-generation tests (no test database needed): the cron-jobs search
// builders are string builders, like pg-format. The sibling search paths
// (search-entities, tables-paginated) escape LIKE wildcards via
// escapeIlikeLiteral; these tests pin the same behaviour for cron jobs.
describe('cron-jobs search', () => {
  describe('getCronJobsMinimalSql', () => {
    test('treats % in the search term literally', () => {
      const sql = getCronJobsMinimalSql({ searchTerm: '%', page: 0, limit: 10 })
      expect(sql).toContain("ILIKE E'%\\\\%%'")
      expect(sql).not.toContain("ILIKE '%%%'")
    })

    test('treats _ in the search term literally', () => {
      const sql = getCronJobsMinimalSql({ searchTerm: '_', page: 0, limit: 10 })
      expect(sql).toContain("ILIKE E'%\\\\_%'")
      expect(sql).not.toContain("ILIKE '%_%'")
    })

    test('escapes backslashes in the search term', () => {
      const sql = getCronJobsMinimalSql({ searchTerm: '\\', page: 0, limit: 10 })
      // A literal backslash must itself be escaped: the pattern carries two
      // escaped backslashes, never the single unescaped one of the old output.
      expect(sql).toContain("ILIKE E'%\\\\\\\\%'")
      expect(sql).not.toContain("ILIKE E'%\\\\%'")
    })

    test('leaves ordinary search terms unchanged', () => {
      const sql = getCronJobsMinimalSql({ searchTerm: 'backup', page: 0, limit: 10 })
      expect(sql).toContain("ILIKE '%backup%'")
    })

    test('omits the WHERE clause without a search term', () => {
      const sql = getCronJobsMinimalSql({ page: 0, limit: 10 })
      expect(sql).not.toContain('WHERE')
    })
  })

  describe('getCronJobsSql', () => {
    test('treats % in the search term literally', () => {
      const sql = getCronJobsSql({ searchTerm: '%', page: 0, limit: 10 })
      expect(sql).toContain("ILIKE E'%\\\\%%'")
      expect(sql).not.toContain("ILIKE '%%%'")
    })

    test('treats _ in the search term literally', () => {
      const sql = getCronJobsSql({ searchTerm: '_', page: 0, limit: 10 })
      expect(sql).toContain("ILIKE E'%\\\\_%'")
      expect(sql).not.toContain("ILIKE '%_%'")
    })

    test('leaves ordinary search terms unchanged', () => {
      const sql = getCronJobsSql({ searchTerm: 'backup', page: 0, limit: 10 })
      expect(sql).toContain("ILIKE '%backup%'")
    })

    test('omits the search clause without a search term', () => {
      const sql = getCronJobsSql({ page: 0, limit: 10 })
      expect(sql).not.toContain('WHERE job.jobname')
    })
  })
})
