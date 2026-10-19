import { useLayoutEffect, useRef, useState } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'

import {
  DestinationPanelFormSchema,
  type DestinationPanelSchemaType,
} from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { useDestinationForm } from '../DestinationPanel/DestinationForm/useDestinationForm'
import type { DestinationType } from '../DestinationPanel/DestinationPanel.types'

export const usePipelineCreationSubmission = ({
  type,
  form,
  validateData,
  onCreated,
}: {
  type: DestinationType
  form: UseFormReturn<DestinationPanelSchemaType>
  validateData: () => Promise<boolean>
  onCreated: () => void
}) => {
  const {
    validateConfiguration,
    submitPipeline,
    destinationValidationFailures,
    pipelineValidationFailures,
    resetValidation,
  } = useDestinationForm({ selectedType: type })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isSubmittingRef = useRef(false)
  const hasCreated = useRef(false)
  const warningSnapshot = useRef<string | undefined>(undefined)
  const values = useWatch({
    control: form.control,
    name: DestinationPanelFormSchema.keyof().options,
  })
  const configurationSnapshot = JSON.stringify([type, values])
  const failures = [...destinationValidationFailures, ...pipelineValidationFailures]

  const createPipeline = async (data: DestinationPanelSchemaType) => {
    await submitPipeline({
      data,
      onSuccess: () => {},
      // Wait for the start attempt before navigating: leaving the document earlier
      // can interrupt its request. A committed create must never be retried here.
      onClose: () => {
        hasCreated.current = true
      },
    })
    if (hasCreated.current) onCreated()
  }

  const runSubmission = async (action: () => Promise<void>) => {
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)
    try {
      await action()
    } finally {
      if (!hasCreated.current) {
        isSubmittingRef.current = false
        setIsSubmitting(false)
      }
    }
  }
  const handleSubmit = () =>
    runSubmission(async () => {
      const data = form.getValues()
      if (warningSnapshot.current === configurationSnapshot) {
        await createPipeline(data)
        return
      }
      resetValidation()
      if (!(await validateData())) return
      const result = await validateConfiguration({ data, onValidationFail: () => {} })
      if (!result.canContinue) return
      if (result.warnings.length > 0) {
        warningSnapshot.current = configurationSnapshot
        return
      }
      await createPipeline(data)
    })

  useLayoutEffect(() => {
    resetValidation()
    warningSnapshot.current = undefined
  }, [configurationSnapshot, resetValidation])

  return {
    handleSubmit,
    isSubmitting,
    failures,
    submitLabel:
      failures.length > 0 && failures.every(({ failure_type }) => failure_type === 'warning')
        ? 'Start pipeline anyway'
        : 'Start pipeline',
  }
}
