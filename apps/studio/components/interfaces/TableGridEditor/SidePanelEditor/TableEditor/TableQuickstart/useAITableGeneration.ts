import { useState, useCallback } from 'react'
import { BASE_PATH } from 'lib/constants'
import { constructHeaders } from 'data/fetchers'
import { toast } from 'sonner'
import type { TableSuggestion, TableField, AIGeneratedSchema } from './types'

const mapColumnType = (type: string): TableField['type'] => {
  const typeMap: Record<string, TableField['type']> = {
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
      // Ensure 'id' fields are always marked as primary
      isPrimary: column.name === 'id' ? true : column.isPrimary ?? undefined,
      isForeign: column.isForeign ?? undefined,
      references: column.references ?? undefined,
    })),
    rationale: table.description,
    source: 'ai' as const,
    relationships: table.relationships ?? undefined,
  }))
}

export const useAITableGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateTables = useCallback(async (prompt: string): Promise<TableSuggestion[]> => {
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
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate schemas')
      }

      const data: AIGeneratedSchema = await response.json()
      const tables = convertAISchemaToTableSuggestions(data)

      setIsGenerating(false)
      return tables
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to generate schemas'
      console.error('AI generation failed:', e)

      toast.error('Unable to generate tables. Please try again with a different description.', {
        description: errorMessage,
        duration: 5000,
      })

      setError(errorMessage)
      setIsGenerating(false)
      throw e
    }
  }, [])

  return {
    generateTables,
    isGenerating,
    error,
  }
}