import { describe, expect, it } from 'vitest'

import {
  buildSecurityAuditCells,
  buildSecurityAuditGuide,
  buildSecurityAuditQuery,
} from './security-audit-template'

const queryCells = () => buildSecurityAuditCells().filter((cell) => cell._tag === 'database_cell')

// An audit run without the notebook has to cover the same ground as the notebook, or a user
// who skips adding it gets a weaker audit without knowing.
describe('security audit without the notebook', () => {
  it('runs every check from the notebook in one query', () => {
    const query = buildSecurityAuditQuery()

    expect(query.match(/ as check_name,/g)).toHaveLength(queryCells().length)
    for (const cell of queryCells()) {
      expect(query).toContain(cell.unchecked_sql.trim().replace(/;$/, ''))
    }
  })

  it('explains every check under the name the query reports it by', () => {
    const guide = buildSecurityAuditGuide()

    for (const cell of queryCells()) {
      expect(buildSecurityAuditQuery()).toContain(`'${cell.title}' as check_name`)
      expect(guide).toContain(`##### ${cell.title}\n`)
    }
  })
})
