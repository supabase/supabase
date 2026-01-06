import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getDatabaseOperations, getDevelopmentOperations, getDebuggingOperations } from './mcp'
import { executeQuery } from './query'
import { listMigrationVersions, applyAndTrackMigrations } from './migrations'
import { getProjectSettings } from './settings'
import { generateTypescriptTypes } from './generate-types'
import { getLints } from './lints'
import { retrieveAnalyticsData, getLogQuery } from './logs'

vi.mock('./query', () => ({
  executeQuery: vi.fn(),
}))

vi.mock('./migrations', () => ({
  listMigrationVersions: vi.fn(),
  applyAndTrackMigrations: vi.fn(),
}))

vi.mock('./settings', () => ({
  getProjectSettings: vi.fn(),
}))

vi.mock('./generate-types', () => ({
  generateTypescriptTypes: vi.fn(),
}))

vi.mock('./lints', () => ({
  getLints: vi.fn(),
}))

vi.mock('./logs', () => ({
  retrieveAnalyticsData: vi.fn(),
  getLogQuery: vi.fn(),
}))

describe('getDatabaseOperations', () => {
  const headers = { Authorization: 'Bearer token' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return database operations object', () => {
    const operations = getDatabaseOperations({ headers })

    expect(operations).toHaveProperty('executeSql')
    expect(operations).toHaveProperty('listMigrations')
    expect(operations).toHaveProperty('applyMigration')
  })

  it('should execute SQL query', async () => {
    const mockData = [{ id: 1, name: 'test' }]
    ;(executeQuery as any).mockResolvedValue({ data: mockData, error: null })

    const operations = getDatabaseOperations({ headers })
    const result = await operations.executeSql('project-ref', {
      query: 'SELECT * FROM test',
      parameters: {},
      read_only: false,
    })

    expect(executeQuery).toHaveBeenCalledWith({
      query: 'SELECT * FROM test',
      parameters: {},
      headers,
      readOnly: false,
    })
    expect(result).toEqual(mockData)
  })

  it('should throw error when executeQuery fails', async () => {
    const mockError = new Error('Query failed')
    ;(executeQuery as any).mockResolvedValue({ data: null, error: mockError })

    const operations = getDatabaseOperations({ headers })

    await expect(
      operations.executeSql('project-ref', {
        query: 'SELECT * FROM test',
        parameters: {},
        read_only: false,
      })
    ).rejects.toThrow('Query failed')
  })

  it('should list migrations', async () => {
    const mockMigrations = [{ version: '20240101000000' }]
    ;(listMigrationVersions as any).mockResolvedValue({
      data: mockMigrations,
      error: null,
    })

    const operations = getDatabaseOperations({ headers })
    const result = await operations.listMigrations()

    expect(listMigrationVersions).toHaveBeenCalledWith({ headers })
    expect(result).toEqual(mockMigrations)
  })

  it('should apply migration', async () => {
    ;(applyAndTrackMigrations as any).mockResolvedValue({ error: null })

    const operations = getDatabaseOperations({ headers })
    await operations.applyMigration('project-ref', {
      query: 'CREATE TABLE test',
      name: 'test_migration',
    })

    expect(applyAndTrackMigrations).toHaveBeenCalledWith({
      query: 'CREATE TABLE test',
      name: 'test_migration',
      headers,
    })
  })
})

describe('getDevelopmentOperations', () => {
  const headers = { Authorization: 'Bearer token' }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getProjectSettings as any).mockReturnValue({
      app_config: {
        protocol: 'https',
        endpoint: 'test.supabase.co',
      },
      service_api_keys: [
        { name: 'anon key', api_key: 'anon-key-123' },
        { name: 'service_role key', api_key: 'service-key-123' },
      ],
    })
  })

  it('should return development operations object', () => {
    const operations = getDevelopmentOperations({ headers })

    expect(operations).toHaveProperty('getProjectUrl')
    expect(operations).toHaveProperty('getPublishableKeys')
    expect(operations).toHaveProperty('generateTypescriptTypes')
  })

  it('should get project URL', async () => {
    const operations = getDevelopmentOperations({ headers })
    const url = await operations.getProjectUrl('project-ref')

    expect(getProjectSettings).toHaveBeenCalled()
    expect(url).toBe('https://test.supabase.co')
  })

  it('should get publishable keys', async () => {
    const operations = getDevelopmentOperations({ headers })
    const keys = await operations.getPublishableKeys('project-ref')

    expect(keys).toHaveLength(1)
    expect(keys[0].api_key).toBe('anon-key-123')
    expect(keys[0].name).toBe('anon key')
    expect(keys[0].type).toBe('anon')
  })

  it('should throw error when anon key is not found', async () => {
    ;(getProjectSettings as any).mockReturnValue({
      service_api_keys: [],
    })

    const operations = getDevelopmentOperations({ headers })

    await expect(operations.getPublishableKeys('project-ref')).rejects.toThrow(
      'Anon key not found in project settings'
    )
  })
})

describe('getDebuggingOperations', () => {
  const headers = { Authorization: 'Bearer token' }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(getLogQuery as any).mockReturnValue('SELECT * FROM logs')
  })

  it('should return debugging operations object', () => {
    const operations = getDebuggingOperations({ headers })

    expect(operations).toHaveProperty('getLogs')
    expect(operations).toHaveProperty('getSecurityAdvisors')
    expect(operations).toHaveProperty('getPerformanceAdvisors')
  })

  it('should get logs', async () => {
    const mockLogs = [{ id: 1, message: 'test' }]
    ;(retrieveAnalyticsData as any).mockResolvedValue({
      data: mockLogs,
      error: null,
    })

    const operations = getDebuggingOperations({ headers })
    const result = await operations.getLogs('project-ref', {
      service: 'api',
      iso_timestamp_start: '2024-01-01T00:00:00Z',
      iso_timestamp_end: '2024-01-01T23:59:59Z',
    })

    expect(getLogQuery).toHaveBeenCalledWith('api')
    expect(retrieveAnalyticsData).toHaveBeenCalledWith({
      name: 'logs.all',
      projectRef: 'project-ref',
      params: {
        sql: 'SELECT * FROM logs',
        iso_timestamp_start: '2024-01-01T00:00:00Z',
        iso_timestamp_end: '2024-01-01T23:59:59Z',
      },
    })
    expect(result).toEqual(mockLogs)
  })

  it('should get security advisors', async () => {
    const mockLints = [
      { name: 'lint1', categories: ['SECURITY'] },
      { name: 'lint2', categories: ['PERFORMANCE'] },
      { name: 'lint3', categories: ['SECURITY', 'PERFORMANCE'] },
    ]
    ;(getLints as any).mockResolvedValue({ data: mockLints, error: null })

    const operations = getDebuggingOperations({ headers })
    const result = await operations.getSecurityAdvisors('project-ref')

    expect(getLints).toHaveBeenCalledWith({ headers })
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('lint1')
    expect(result[1].name).toBe('lint3')
  })

  it('should get performance advisors', async () => {
    const mockLints = [
      { name: 'lint1', categories: ['SECURITY'] },
      { name: 'lint2', categories: ['PERFORMANCE'] },
      { name: 'lint3', categories: ['SECURITY', 'PERFORMANCE'] },
    ]
    ;(getLints as any).mockResolvedValue({ data: mockLints, error: null })

    const operations = getDebuggingOperations({ headers })
    const result = await operations.getPerformanceAdvisors('project-ref')

    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('lint2')
    expect(result[1].name).toBe('lint3')
  })
})
