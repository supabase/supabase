import { useState, useCallback, useRef, useEffect } from 'react'
import { BASE_PATH } from 'lib/constants'
import { constructHeaders } from 'data/fetchers'
import { toast } from 'sonner'
import { TableSource } from './types'
import type { TableSuggestion, PostgresType, AIGeneratedSchema } from './types'

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
      description:
        column.isPrimary || column.name === 'id'
          ? 'Primary key'
          : column.isForeign && column.references
            ? `References ${column.references}`
            : undefined,
      isPrimary: column.name === 'id' ? true : column.isPrimary ?? undefined,
      isForeign: column.isForeign ?? undefined,
      references: column.references ?? undefined,
    })),
    rationale: table.description,
    source: TableSource.AI,
    relationships: table.relationships ?? undefined,
  }))
}

export const useAITableGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const generateTables = useCallback(async (prompt: string): Promise<TableSuggestion[]> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    if (prompt.length > 500) {
      const error = 'Description is too long. Please keep it under 500 characters.'
      toast.error(error)
      return []
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsGenerating(true)
    setError(null)

    try {
      const headers = await constructHeaders()
      headers.set('Content-Type', 'application/json')

      const response = await fetch(`${BASE_PATH}/api/ai/table-quickstart/generate-schemas`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ prompt }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to generate schemas'
        setError(errorMessage)
        toast.error('Unable to generate tables', {
          description: errorMessage,
          duration: 5000,
        })
        return []
      }

      const data: AIGeneratedSchema = await response.json()
      const tables = convertAISchemaToTableSuggestions(data)

      setError(null)
      return tables
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        return []
      }

      const errorMessage = e instanceof Error ? e.message : 'Failed to generate schemas'
      setError(errorMessage)

      toast.error('Unable to generate tables', {
        description: errorMessage,
        duration: 5000,
      })

      return []
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }, [])

  return {
    generateTables,
    isGenerating,
    error,
  }
}
