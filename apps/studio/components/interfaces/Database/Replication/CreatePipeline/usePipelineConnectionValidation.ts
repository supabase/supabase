import { useRef, useState } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'

import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { useDestinationValidation } from '../DestinationPanel/DestinationForm/useDestinationValidation'
import {
  getConnectionFieldNames,
  getConnectionValidationIssues,
} from './PipelineConnectionValidation.utils'
import type { ValidationFailure } from '@/data/replication/validate-destination-mutation'

export const usePipelineConnectionValidation = ({
  projectRef,
  type,
  form,
}: {
  projectRef?: string
  type: Parameters<typeof getConnectionFieldNames>[0]
  form: UseFormReturn<DestinationPanelSchemaType>
}) => {
  const names = getConnectionFieldNames(type)
  const values = useWatch({ control: form.control, name: names })
  const snapshot = JSON.stringify([type, ...values])
  const currentSnapshotRef = useRef(snapshot)
  currentSnapshotRef.current = snapshot
  const [result, setResult] = useState<{
    snapshot: string
    failures: ValidationFailure[]
    verified: boolean
  }>()
  const [isValidating, setIsValidating] = useState(false)
  const isValidatingRef = useRef(false)
  const { validateDestination } = useDestinationValidation({ projectRef, selectedType: type })
  const currentResult = result?.snapshot === snapshot ? result : undefined
  const isConnectionVerified = currentResult?.verified === true

  const validateConnection = async () => {
    if (isValidatingRef.current) return false
    form.clearErrors(names)
    const data = form.getValues()
    const issues = getConnectionValidationIssues(type, data)
    if (issues.length > 0) {
      issues.forEach(({ path, message }) => form.setError(path, { type: 'validate', message }))
      form.setFocus(issues[0].path)
      setResult({
        snapshot,
        verified: false,
        failures: [
          {
            name: 'Check connection settings',
            failure_type: 'critical',
            reason: issues.map(({ message }) => message).join('\n\n'),
          },
        ],
      })
      return false
    }
    if (isConnectionVerified) return true
    isValidatingRef.current = true
    setIsValidating(true)
    setResult(undefined)
    try {
      const { validation_failures: failures } = await validateDestination({ data })
      if (currentSnapshotRef.current !== snapshot) return false
      const verified = !failures.some((failure) => failure.failure_type === 'critical')
      setResult({ snapshot, failures, verified })
      // Keep warnings visible for review; the next click acknowledges them.
      return false
    } catch (error) {
      if (currentSnapshotRef.current === snapshot) {
        setResult({
          snapshot,
          verified: false,
          failures: [
            {
              name: 'Failed to validate destination',
              failure_type: 'critical',
              reason: error instanceof Error ? error.message : 'Please try again.',
            },
          ],
        })
      }
      return false
    } finally {
      isValidatingRef.current = false
      setIsValidating(false)
    }
  }

  return {
    validateConnection,
    isValidating,
    isConnectionVerified,
    failures: currentResult?.failures ?? [],
  }
}
