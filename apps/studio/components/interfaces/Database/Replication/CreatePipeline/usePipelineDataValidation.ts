import { useRef, useState } from 'react'
import { useWatch, type UseFormReturn } from 'react-hook-form'

import type { DestinationPanelSchemaType } from '../DestinationPanel/DestinationForm/DestinationForm.schema'
import { dataFieldNames, getDataValidationIssues } from './PipelineDataValidation.utils'
import { useReplicationPublicationNamesQuery } from '@/data/replication/publication-names-query'
import { useReplicationPublicationQuery } from '@/data/replication/publication-query'

export const usePipelineDataValidation = ({
  projectRef,
  sourceId,
  type,
  form,
}: {
  projectRef?: string
  sourceId?: number
  type: string
  form: UseFormReturn<DestinationPanelSchemaType>
}) => {
  const values = useWatch({ control: form.control, name: dataFieldNames })
  const publicationName = useWatch({ control: form.control, name: 'publicationName' })
  const snapshot = JSON.stringify([type, ...values])
  const currentSnapshot = useRef(snapshot)
  currentSnapshot.current = snapshot
  const [verifiedSnapshot, setVerifiedSnapshot] = useState<string>()
  const [isValidatingData, setIsValidatingData] = useState(false)
  const isValidatingRef = useRef(false)
  const [dataErrorState, setDataErrorState] = useState<{ snapshot: string; message: string }>()
  const setDataError = (message?: string) =>
    setDataErrorState(message ? { snapshot, message } : undefined)
  const dataError = dataErrorState?.snapshot === snapshot ? dataErrorState.message : undefined
  const names = useReplicationPublicationNamesQuery({ projectRef, sourceId })
  const publication = useReplicationPublicationQuery({ projectRef, sourceId, publicationName })
  const isDataVerified =
    verifiedSnapshot === JSON.stringify([snapshot, publication.data]) &&
    names.isSuccess &&
    publication.isSuccess &&
    names.data.some(({ name }) => name === publicationName) &&
    publication.data.name === publicationName

  const validateData = async () => {
    if (isValidatingRef.current) return false
    form.clearErrors(dataFieldNames)
    setDataError(undefined)
    setVerifiedSnapshot(undefined)
    isValidatingRef.current = true
    setIsValidatingData(true)
    try {
      if (!projectRef || sourceId === undefined || !publicationName) {
        form.setError('publicationName', { message: 'Select an available publication.' })
        return false
      }
      const [freshNames, freshPublication] = await Promise.all([
        names.refetch(),
        publication.refetch(),
      ])
      if (currentSnapshot.current !== snapshot) return false
      if (freshNames.isError || freshPublication.isError) {
        setDataError('Publication tables could not be loaded. Click Continue to try again.')
        return false
      }
      const selected = freshNames.data?.some(({ name }) => name === publicationName)
        ? freshPublication.data
        : undefined
      const issues = getDataValidationIssues(form.getValues(), type, selected)
      issues.forEach(({ path, message }) => form.setError(path, { type: 'validate', message }))
      if (issues.length > 0) {
        setDataError(issues[0].message)
        form.setFocus(issues[0].path)
        return false
      }
      setVerifiedSnapshot(JSON.stringify([snapshot, freshPublication.data]))
      return true
    } finally {
      isValidatingRef.current = false
      setIsValidatingData(false)
    }
  }
  return {
    validateData,
    isValidatingData,
    isDataVerified,
    dataError,
    publication: publication.data,
  }
}
