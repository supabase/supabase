import { merge } from 'lodash'
import { constructHeaders } from 'data/fetchers'
import { BASE_PATH } from 'lib/constants'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { LIMITS } from './constants'
import type { AIGeneratedSchema, PostgresType, TableSuggestion } from './types'
import { TableSource } from './types'

type PartialColumn = Partial<AIGeneratedSchema['tables'][number]['columns'][number]>
type PartialTable = Partial<AIGeneratedSchema['tables'][number]> & {
  columns?: PartialColumn[]
}
type PartialSchema = Partial<AIGeneratedSchema> & {
  tables?: PartialTable[]
}

const isNotNull = <T>(value: T | null | undefined): value is T => value != null

const isIdColumn = (name: string) => name === 'id'

const isPrimaryColumn = (column: { isPrimary?: boolean | null; name: string }) =>
  column.isPrimary || isIdColumn(column.name)

const getColumnDescription = (column: { isPrimary?: boolean | null; name: string }) => {
  if (isPrimaryColumn(column)) return 'Primary key'
  return undefined
}

const mapColumnType = (type: string): PostgresType => {
  const typeMap: Record<string, PostgresType> = {
    bigint: 'int8',
    integer: 'int4',
    smallint: 'int2',
    boolean: 'bool',
    text: 'text',
    varchar: 'varchar',
    uuid: 'uuid',
    timestamp: 'timestamp',
    timestamptz: 'timestamptz',
    'timestamp with time zone': 'timestamptz',
    date: 'date',
    time: 'time',
    timetz: 'timetz',
    'time with time zone': 'timetz',
    json: 'json',
    jsonb: 'jsonb',
    numeric: 'numeric',
    real: 'float4',
    'double precision': 'float8',
    bytea: 'bytea',
  }

  return typeMap[type.toLowerCase()] || 'text'
}

const convertAISchemaToTableSuggestions = (schema: AIGeneratedSchema): TableSuggestion[] => {
  return schema.tables.map((table) => ({
    tableName: table.name,
    fields: table.columns.map((column) => ({
      name: column.name,
      type: mapColumnType(column.type),
      nullable: column.isNullable ?? undefined,
      unique: column.isUnique ?? undefined,
      default: column.defaultValue ?? undefined,
      description: getColumnDescription(column),
      isPrimary: isPrimaryColumn(column) || undefined,
    })),
    rationale: table.description,
    source: TableSource.AI,
  }))
}

const convertPartialSchemaToTableSuggestions = (schema: PartialSchema): TableSuggestion[] => {
  if (!Array.isArray(schema.tables)) return []

  return schema.tables
    .map((table, tableIndex) => {
      if (!table) return null

      const tableName =
        typeof table.name === 'string' && table.name.trim().length > 0
          ? table.name
          : `table_${tableIndex + 1}`
      const columns = Array.isArray(table.columns) ? table.columns : []

      const fields = columns
        .map((column, columnIndex) => {
          if (!column) return null

          const columnName =
            typeof column.name === 'string' && column.name.trim().length > 0
              ? column.name
              : `column_${columnIndex + 1}`
          const columnType =
            typeof column.type === 'string' && column.type.trim().length > 0 ? column.type : 'text'

          return {
            name: columnName,
            type: mapColumnType(columnType),
            nullable: column.isNullable ?? undefined,
            unique: column.isUnique ?? undefined,
            default: column.defaultValue ?? undefined,
            description: getColumnDescription({ ...column, name: columnName }),
            isPrimary: isPrimaryColumn({ ...column, name: columnName }) || undefined,
          }
        })
        .filter(isNotNull)

      if (fields.length === 0 && !table.name) {
        return null
      }

      return {
        tableName,
        fields,
        rationale: typeof table.description === 'string' ? table.description : undefined,
        source: TableSource.AI,
      }
    })
    .filter(isNotNull)
}

const parseSseEvent = (raw: string) => {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const lines = trimmed.split(/\r?\n/)
  let event = 'message'
  const dataParts: string[] = []

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataParts.push(line.slice(5).trim())
    }
  }

  if (dataParts.length === 0) return null

  return {
    event,
    data: dataParts.join('\n'),
  }
}

const safeJsonParse = <T>(input: string): T | null => {
  try {
    return JSON.parse(input) as T
  } catch {
    return null
  }
}

export const useAITableGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tables, setTables] = useState<TableSuggestion[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const generateTables = useCallback(async (prompt: string): Promise<TableSuggestion[]> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (prompt.length > LIMITS.MAX_PROMPT_LENGTH) {
      const message = `Your description is too long. Try shortening it to under ${LIMITS.MAX_PROMPT_LENGTH} characters.`
      toast.error(message)
      return []
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    if (isMountedRef.current) {
      setIsGenerating(true)
      setError(null)
      setTables([])
    }

    try {
      const headers = await constructHeaders()
      headers.set('Content-Type', 'application/json')
      headers.set('Accept', 'text/event-stream')

      const response = await fetch(`${BASE_PATH}/api/ai/table-quickstart/generate-schemas`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Something went wrong while generating your table schema. Please try again.',
        }))
        const errorMessage =
          errorData?.error ||
          'Something went wrong while generating your table schema. Please try again.'
        if (isMountedRef.current) {
          setError(errorMessage)
        }
        toast.error('Unable to generate tables', {
          description: errorMessage,
        })
        return []
      }

      const contentType = response.headers.get('content-type') ?? ''

      if (contentType.includes('text/event-stream') && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let latestPartial: Record<string, any> = {}
        let finalTables: TableSuggestion[] = []

        const handleEvent = (rawEvent: string) => {
          const event = parseSseEvent(rawEvent)
          if (!event) return

          if (event.event === 'partial') {
            const partial = safeJsonParse<Record<string, any>>(event.data)
            if (!partial) return

            latestPartial = merge({}, latestPartial, partial)
            const partialSuggestions = convertPartialSchemaToTableSuggestions(
              latestPartial as PartialSchema
            )

            if (isMountedRef.current) {
              setTables(partialSuggestions)
            }
            return
          }

          if (event.event === 'complete') {
            const schemaPayload = safeJsonParse<AIGeneratedSchema>(event.data)
            if (!schemaPayload) return

            finalTables = convertAISchemaToTableSuggestions(schemaPayload)
            latestPartial = schemaPayload as unknown as Record<string, any>

            if (isMountedRef.current) {
              setTables(finalTables)
              setError(null)
            }
            return
          }

          if (event.event === 'error') {
            const errorPayload = safeJsonParse<{ message?: string }>(event.data)
            throw new Error(
              errorPayload?.message ??
                'Something went wrong while streaming the response. Please try again.'
            )
          }
        }

        const flushBuffer = () => {
          let boundary = buffer.indexOf('\n\n')
          while (boundary !== -1) {
            const rawEvent = buffer.slice(0, boundary)
            buffer = buffer.slice(boundary + 2)
            handleEvent(rawEvent)
            boundary = buffer.indexOf('\n\n')
          }
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            flushBuffer()
          }

          buffer += decoder.decode()
          flushBuffer()

          const trailingEvent = parseSseEvent(buffer)
          if (trailingEvent) {
            handleEvent(buffer)
            buffer = ''
          }
        } finally {
          reader.releaseLock()
        }

        if (finalTables.length === 0) {
          finalTables = convertPartialSchemaToTableSuggestions(latestPartial as PartialSchema)
        }

        if (isMountedRef.current) {
          setError(null)
          setTables(finalTables)
        }

        return finalTables
      }

      const data: AIGeneratedSchema = await response.json()
      const tablesFromJson = convertAISchemaToTableSuggestions(data)

      if (isMountedRef.current) {
        setError(null)
        setTables(tablesFromJson)
      }

      return tablesFromJson
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return []
      }

      const message =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'

      if (isMountedRef.current) {
        setError(message)
      }

      toast.error('Unable to generate tables', {
        description: message,
      })

      return []
    } finally {
      if (isMountedRef.current) {
        setIsGenerating(false)
      }
      abortControllerRef.current = null
    }
  }, [])

  const clearTables = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    if (isMountedRef.current) {
      setIsGenerating(false)
      setError(null)
      setTables([])
    }
  }, [])

  return {
    generateTables,
    isGenerating,
    error,
    tables,
    clearTables,
  }
}
