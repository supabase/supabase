import { describe, expect, it } from 'vitest'

import { buildFilterSummary, buildOptionsSummary } from './SaveViewDialog.utils'

describe('saved view summaries', () => {
  it('omits malformed operators instead of displaying an invalid filter description', () => {
    expect(
      buildFilterSummary(
        {
          logicalOperator: 'AND',
          conditions: [
            { propertyName: 'level', operator: 'invalid', value: 'error' },
            { propertyName: 'method', operator: '=', value: 'GET' },
          ],
        },
        {}
      )
    ).toEqual([{ label: 'method', text: 'equals GET' }])
  })

  it('omits malformed known options while formatting valid sorting', () => {
    expect(
      buildOptionsSummary({
        user: { id: 'not-a-user-string' },
        sort: { id: 'date', desc: 'false' },
      })
    ).toEqual([])
    expect(
      buildOptionsSummary({ sort: { id: 'date', desc: false }, future_option: 'value' })
    ).toEqual([
      { label: 'Sort', text: 'date (asc)' },
      { label: 'future_option', text: 'value' },
    ])
  })
})
