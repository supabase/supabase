import { describe, expect, it } from 'vitest'

import {
  chartConfigFromSnippetContent,
  createEmbeddedSqlBlock,
  getBlockLogsDatePickerValue,
  getBlockSql,
  getNotebookBlockUtilityTab,
  isEmbeddedSqlBlock,
  isLegacySnippetBlock,
  isNotebookSqlBlock,
  mergeBlockChartConfig,
  migrateSnippetBlockToEmbedded,
  SQL_BLOCK_ATTRIBUTE,
} from './notebookBlock.utils'
import type { Dashboards } from '@/types'

describe('notebookBlock.utils', () => {
  it('detects legacy snippet blocks', () => {
    const block = { attribute: 'snippet_abc' } as Dashboards.Chart
    expect(isLegacySnippetBlock(block)).toBe(true)
    expect(isEmbeddedSqlBlock(block)).toBe(false)
    expect(isNotebookSqlBlock(block)).toBe(true)
  })

  it('detects embedded sql blocks', () => {
    const block = createEmbeddedSqlBlock({ id: '1', label: 'Q', sql: 'select 1' })
    expect(isEmbeddedSqlBlock(block)).toBe(true)
    expect(block.attribute).toBe(SQL_BLOCK_ATTRIBUTE)
    expect(getBlockSql(block)).toBe('select 1')
  })

  it('merges chart config defaults', () => {
    expect(mergeBlockChartConfig({ xKey: 'day', yKey: 'count' })).toMatchObject({
      xKey: 'day',
      yKey: 'count',
      type: 'bar',
    })
  })

  it('reads a persisted logs date picker value from an embedded block', () => {
    const logsDatePickerValue = {
      from: '2026-06-01T00:00:00.000Z',
      to: '',
      isHelper: true,
      text: 'Last 24 hours',
    }
    const block = createEmbeddedSqlBlock({
      id: '1',
      label: 'Errors',
      querySource: 'logs',
      logsDatePickerValue,
    })

    expect(getBlockLogsDatePickerValue(block)).toEqual(logsDatePickerValue)
  })

  it('uses block chart_type when chartConfig.type is missing', () => {
    expect(mergeBlockChartConfig({ xKey: 'day', yKey: 'count' }, 'line')).toMatchObject({
      type: 'line',
    })
  })

  it('opens chart utility tab when axes are configured', () => {
    expect(getNotebookBlockUtilityTab({ xKey: 'a', yKey: 'b' })).toBe('chart')
    expect(getNotebookBlockUtilityTab({ view: 'chart' })).toBe('chart')
    expect(getNotebookBlockUtilityTab({})).toBe('results')
  })

  it('reads chart config from snippet content', () => {
    expect(
      chartConfigFromSnippetContent({
        content_id: '1',
        unchecked_sql: 'select 1' as never,
        schema_version: '1.0',
        chart: { xKey: 'x', yKey: 'y', type: 'bar', cumulative: false },
      })
    ).toEqual({ xKey: 'x', yKey: 'y', type: 'bar', cumulative: false })
  })

  it('migrates legacy block with snippet content', () => {
    const legacy = {
      id: 'block-1',
      attribute: 'snippet_old',
      label: 'My query',
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      chart_type: 'bar',
    } as Dashboards.Chart

    const migrated = migrateSnippetBlockToEmbedded(legacy, {
      content_id: 'old',
      unchecked_sql: 'select 2' as never,
      schema_version: '1.0',
      query_source: 'logs',
    })

    expect(migrated.attribute).toBe(SQL_BLOCK_ATTRIBUTE)
    expect(getBlockSql(migrated)).toBe('select 2')
    expect(migrated.sql?.query_source).toBe('logs')
  })

  it('migrates snippet chart config onto the block', () => {
    const legacy = {
      id: 'block-1',
      attribute: 'snippet_old',
      label: 'Chart query',
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      chart_type: 'bar',
    } as Dashboards.Chart

    const migrated = migrateSnippetBlockToEmbedded(legacy, {
      content_id: 'old',
      unchecked_sql: 'select 1' as never,
      schema_version: '1.0',
      chart: { xKey: 'created_at', yKey: 'total', type: 'bar', cumulative: true },
    })

    expect(migrated.chartConfig).toEqual({
      xKey: 'created_at',
      yKey: 'total',
      type: 'bar',
      cumulative: true,
    })
  })
})
