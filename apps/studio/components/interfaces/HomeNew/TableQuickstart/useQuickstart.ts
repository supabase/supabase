import { useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useParams } from 'common'
import { BASE_PATH } from 'lib/constants'
import { constructHeaders } from 'data/fetchers'
import { toast } from 'sonner'
import type { TableSuggestion, TableField, AIGeneratedSchema } from './types'
import { useQuickstartStore } from './quickstartStore'

const mapColumnType = (type: string): TableField['type'] => {
  const typeMap: Record<string, TableField['type']> = {
    'bigint': 'int8',
    'integer': 'int4',
    'smallint': 'int2',
    'boolean': 'bool',
    'text': 'text',
    'varchar': 'varchar',
    'uuid': 'uuid',
    'timestamp': 'timestamp',
    'timestamptz': 'timestamptz',
    'timestamp with time zone': 'timestamptz',
    'date': 'date',
    'time': 'time',
    'json': 'json',
    'jsonb': 'jsonb',
    'numeric': 'numeric',
    'real': 'float4',
    'double precision': 'float8',
    'bytea': 'bytea',
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
      description: column.isPrimary ? 'Primary key' : column.isForeign && column.references ? `References ${column.references}` : undefined,
      isPrimary: column.isPrimary ?? undefined,
      isForeign: column.isForeign ?? undefined,
      references: column.references ?? undefined,
    })),
    rationale: table.description,
    source: 'ai' as const,
    relationships: table.relationships ?? undefined,
  }))
}

export const useQuickstart = () => {
  const router = useRouter()
  const { ref } = useParams()
  const projectId = ref as string
  const quickstartStore = useQuickstartStore()

  const [currentStep, setCurrentStep] = useState<'input' | 'preview'>('input')
  const [candidates, setCandidates] = useState<TableSuggestion[]>([])
  const [selectedTable, setSelectedTable] = useState<TableSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userInput, setUserInput] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  const onTablesReady = useCallback(
    (tables: TableSuggestion[], input: string) => {
      setCandidates(tables)
      setUserInput(input)
      setCurrentStep('preview')
      setIsGenerating(false)
    },
    []
  )

  const handleAiGenerate = useCallback(async (prompt: string) => {
    setIsGenerating(true)
    setError(null)
    setCurrentStep('preview') // Show preview immediately to display skeleton
    setCandidates([]) // Clear any previous candidates

    try {
      const headers = await constructHeaders()
      headers.set('Content-Type', 'application/json')

      const response = await fetch(`${BASE_PATH}/api/ai/table-quickstart/generate-schemas`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          prompt,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate schemas')
      }

      const data: AIGeneratedSchema = await response.json()
      const tables = convertAISchemaToTableSuggestions(data)

      onTablesReady(tables, prompt)
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to generate schemas'
      console.error('AI generation failed:', e)

      // Show error toast and return to input form
      toast.error('Unable to generate tables. Please try again with a different description.', {
        description: errorMessage,
        duration: 5000,
      })

      setError(errorMessage)
      setIsGenerating(false)
      setCurrentStep('input') // Return to input form
    }
  }, [onTablesReady])

  const handleSelectTable = useCallback(
    async (table: TableSuggestion) => {
      setSelectedTable(table)
      setLoading(true)
      setError(null)

      try {
        if (!table.tableName || !Array.isArray(table.fields) || table.fields.length === 0) {
          throw new Error('Invalid table structure')
        }

        quickstartStore.setQuickstartData(table)
        await router.push(`/project/${projectId}/editor`)
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to navigate to table editor'
        setError(errorMessage)
        setLoading(false)
        setCurrentStep('preview')

        quickstartStore.clearQuickstartData()
      }
    },
    [projectId, router, quickstartStore]
  )

  const handleBack = useCallback(() => {
    if (currentStep === 'preview') {
      setCurrentStep('input')
      setCandidates([])
      setError(null)
      setSelectedTable(null)
      setIsGenerating(false)
    }
  }, [currentStep])

  return {
    currentStep,
    candidates,
    selectedTable,
    loading,
    error,
    userInput,
    isGenerating,
    onTablesReady,
    handleAiGenerate,
    handleSelectTable,
    handleBack,
  }
}
