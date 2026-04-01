import { describe, expect, it } from 'vitest'

import {
  getKeyValueFieldArrayValidationIssues,
  stripEmptyKeyValueFieldArrayRows,
} from './validation'

describe('getKeyValueFieldArrayValidationIssues', () => {
  it('allows fully empty draft rows by default', () => {
    expect(
      getKeyValueFieldArrayValidationIssues({
        rows: [{ key: '', value: '' }],
        keyFieldName: 'key',
        valueFieldName: 'value',
        keyRequiredMessage: 'Header name is required',
        valueRequiredMessage: 'Header value is required',
      })
    ).toEqual([])
  })

  it('adds an issue on value for key-only rows', () => {
    expect(
      getKeyValueFieldArrayValidationIssues({
        rows: [{ key: 'Authorization', value: '' }],
        keyFieldName: 'key',
        valueFieldName: 'value',
        keyRequiredMessage: 'Header name is required',
        valueRequiredMessage: 'Header value is required',
      })
    ).toEqual([{ path: [0, 'value'], message: 'Header value is required' }])
  })

  it('adds an issue on key for value-only rows', () => {
    expect(
      getKeyValueFieldArrayValidationIssues({
        rows: [{ key: '', value: 'Bearer token' }],
        keyFieldName: 'key',
        valueFieldName: 'value',
        keyRequiredMessage: 'Header name is required',
        valueRequiredMessage: 'Header value is required',
      })
    ).toEqual([{ path: [0, 'key'], message: 'Header name is required' }])
  })

  it('adds duplicate key issues when duplicate validation is enabled', () => {
    expect(
      getKeyValueFieldArrayValidationIssues({
        rows: [
          { key: 'Authorization', value: 'Bearer 1' },
          { key: 'Authorization', value: 'Bearer 2' },
        ],
        keyFieldName: 'key',
        valueFieldName: 'value',
        keyRequiredMessage: 'Header name is required',
        valueRequiredMessage: 'Header value is required',
        duplicateKeyMessage: 'Header name already exists',
      })
    ).toEqual([
      { path: [0, 'key'], message: 'Header name already exists' },
      { path: [1, 'key'], message: 'Header name already exists' },
    ])
  })

  it('supports custom key/value field names', () => {
    expect(
      getKeyValueFieldArrayValidationIssues({
        rows: [{ name: 'tenant', value: '' }],
        keyFieldName: 'name',
        valueFieldName: 'value',
        keyRequiredMessage: 'Parameter name is required',
        valueRequiredMessage: 'Parameter value is required',
      })
    ).toEqual([{ path: [0, 'value'], message: 'Parameter value is required' }])
  })

  it('skips duplicate checks when no duplicate message is provided', () => {
    expect(
      getKeyValueFieldArrayValidationIssues({
        rows: [
          { key: 'Authorization', value: 'Bearer 1' },
          { key: 'Authorization', value: 'Bearer 2' },
        ],
        keyFieldName: 'key',
        valueFieldName: 'value',
        keyRequiredMessage: 'Header name is required',
        valueRequiredMessage: 'Header value is required',
      })
    ).toEqual([])
  })
})

describe('stripEmptyKeyValueFieldArrayRows', () => {
  it('removes fully empty draft rows', () => {
    expect(
      stripEmptyKeyValueFieldArrayRows({
        rows: [
          { key: 'Authorization', value: 'Bearer token' },
          { key: '', value: '' },
        ],
        keyFieldName: 'key',
        valueFieldName: 'value',
      })
    ).toEqual([{ key: 'Authorization', value: 'Bearer token' }])
  })

  it('keeps partially filled rows so schema validation can handle them', () => {
    expect(
      stripEmptyKeyValueFieldArrayRows({
        rows: [
          { name: 'Authorization', value: '' },
          { name: '', value: 'Bearer token' },
        ],
        keyFieldName: 'name',
        valueFieldName: 'value',
      })
    ).toEqual([
      { name: 'Authorization', value: '' },
      { name: '', value: 'Bearer token' },
    ])
  })
})
