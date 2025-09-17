import { useState, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useParams } from 'common'
import type { TableSuggestion } from './types'
import { SOCIAL_MEDIA_TABLES } from './mockData'
import { useQuickstartStore } from './quickstartStore'

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

  const onTablesReady = (
    tables: TableSuggestion[] = SOCIAL_MEDIA_TABLES,
    input: string = 'social media app with posts and comments'
  ) => {
    setCandidates(tables)
    setUserInput(input)
    setCurrentStep('preview')
    setIsGenerating(false)
  }

  const handleAiGenerate = useCallback((prompt: string) => {
    setIsGenerating(true)

    // TODO [Sean]: Replace with actual AI API call
    onTablesReady(SOCIAL_MEDIA_TABLES, prompt)
  }, [])

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
