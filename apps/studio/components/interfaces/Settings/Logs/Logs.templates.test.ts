import { describe, expect, it } from 'vitest'

import { getLogsTemplates, TEMPLATES } from './Logs.constants'

const customTemplates = TEMPLATES.filter((t) => t.mode === 'custom')
const bigQueryConstructs =
  /unnest|cross join|left join|regexp_contains|cast\(\s*timestamp|count\(\*\)/i

describe('getLogsTemplates', () => {
  it('returns the original templates when the OTEL engine is off', () => {
    expect(getLogsTemplates(false)).toBe(TEMPLATES)
  })

  it('gives every custom template a ClickHouse rewrite when OTEL is on', () => {
    const otel = getLogsTemplates(true)
    for (const template of customTemplates) {
      const rewritten = otel.find((t) => t.label === template.label)
      expect(rewritten, `missing OTEL rewrite for "${template.label}"`).toBeDefined()
      expect(
        rewritten!.searchString,
        `"${template.label}" was not rewritten for ClickHouse`
      ).not.toBe(template.searchString)
    }
  })

  it('produces ClickHouse SQL with no BigQuery constructs', () => {
    const otel = getLogsTemplates(true)
    for (const template of otel.filter((t) => t.mode === 'custom')) {
      expect(template.searchString, `"${template.label}" still targets logs table`).toMatch(
        /from logs/i
      )
      expect(template.searchString, `"${template.label}" filters by source`).toMatch(/source\s*=/i)
      expect(
        template.searchString,
        `"${template.label}" still contains a BigQuery construct`
      ).not.toMatch(bigQueryConstructs)
    }
  })

  it('leaves simple-mode templates unchanged on the OTEL engine', () => {
    const otel = getLogsTemplates(true)
    for (const template of TEMPLATES.filter((t) => t.mode === 'simple')) {
      const same = otel.find((t) => t.label === template.label)
      expect(same!.searchString).toBe(template.searchString)
    }
  })

  it('maps nested BigQuery fields to the right log_attributes keys', () => {
    const otel = getLogsTemplates(true)
    const byLabel = (label: string) => otel.find((t) => t.label === label)!.searchString

    expect(byLabel('Requests by Geography')).toContain("log_attributes['request.cf.country']")
    expect(byLabel('Metadata IP')).toContain("log_attributes['request.headers.x_real_ip']")
    expect(byLabel('Errors')).toContain("log_attributes['parsed.error_severity']")
    expect(byLabel('Slow Response Time')).toContain(
      "toInt32OrZero(log_attributes['response.origin_time'])"
    )
  })
})
