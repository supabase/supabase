import { constructHeaders, fetchHandler } from 'data/fetchers'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { BASE_PATH } from 'lib/constants'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { LIMITS } from './constants'
import type { AIGeneratedSchema, PostgresType, TableSuggestion } from './types'
import { TableSource } from './types'

const AI_TABLES_STORAGE_KEY = 'table-quickstart-ai-results'
const MAX_BUFFER_SIZE = 50 * 1024 // 50KB limit for streaming responses

type PartialColumn = Partial<AIGeneratedSchema['tables'][number]['columns'][number]>
type PartialTable = Partial<AIGeneratedSchema['tables'][number]> & {
  columns?: PartialColumn[]
}
type PartialSchema = Partial<AIGeneratedSchema> & {
  tables?: PartialTable[]
}

interface AITableGenerationState {
  prompt: string
  tables: TableSuggestion[]
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
      isPrimary: column.isPrimary || isIdColumn(column.name) || undefined,
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
            isPrimary: column.isPrimary || isIdColumn(columnName) || undefined,
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
  const [state, setState] = useLocalStorage<AITableGenerationState>(AI_TABLES_STORAGE_KEY, {
    prompt: '',
    tables: [],
  })
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
      setError(message)
      toast.error('Description too long', {
        description: message,
      })
      return []
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsGenerating(true)
    setError(null)
    setState({ prompt, tables: [] })

    try {
      const headers = await constructHeaders()
      headers.set('Content-Type', 'application/json')

      const response = await fetchHandler(`${BASE_PATH}/api/ai/table-quickstart/generate-schemas`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Unable to generate table schema. Try again with a different description.',
        }))
        const errorMessage =
          errorData?.error ||
          'Unable to generate table schema. Try again with a different description.'
        if (isMountedRef.current) {
          setError(errorMessage)
        }
        toast.error('Unable to generate tables', {
          description: errorMessage,
        })
        return []
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let jsonBuffer = ''
      let latestPartialSchema: PartialSchema = {}

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          jsonBuffer += decoder.decode(value, { stream: true })

          if (jsonBuffer.length > MAX_BUFFER_SIZE) {
            throw new Error('Response too large')
          }

          const partialJson = safeJsonParse<PartialSchema>(jsonBuffer)
          if (partialJson) {
            Object.assign(latestPartialSchema, partialJson)
            const partialSuggestions = convertPartialSchemaToTableSuggestions(latestPartialSchema)

            if (isMountedRef.current && partialSuggestions.length > 0) {
              setState({ prompt, tables: partialSuggestions })
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

      jsonBuffer += decoder.decode()

      const finalSchema = safeJsonParse<AIGeneratedSchema>(jsonBuffer)
      const finalTables = finalSchema
        ? convertAISchemaToTableSuggestions(finalSchema)
        : convertPartialSchemaToTableSuggestions(latestPartialSchema)

      if (isMountedRef.current) {
        setError(null)
        setState({ prompt, tables: finalTables })
      }

      return finalTables
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return []
      }

      const message =
        error instanceof Error ? error.message : 'Unable to generate tables. Please try again.'

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

    setIsGenerating(false)
    setError(null)
    setState({ prompt: '', tables: [] })
  }, [])

  const setPrompt = useCallback(
    (prompt: string) => {
      setState((prev) => ({ ...prev, prompt }))
    },
    [setState]
  )

  return {
    generateTables,
    isGenerating,
    error,
    prompt: state.prompt,
    tables: state.tables,
    setPrompt,
    clearTables,
  }
}
