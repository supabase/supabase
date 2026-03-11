import { useEffect, useReducer, useState } from 'react'
import { useWatch, type FieldError } from 'react-hook-form'

import {
  THRESHOLD_FOR_AUTO_QUERYING_BUCKET_LIMITS,
  type BucketWithSizeLimit,
} from 'data/storage/buckets-max-size-limit-query'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { StorageFileSizeLimitErrorMessage } from './StorageFileSizeLimitErrorMessage'
import { StorageSizeUnits } from './StorageSettings.constants'
import { convertToBytes, encodeBucketLimitErrorMessage } from './StorageSettings.utils'

type ValidationState =
  | { status: 'initial' }
  | { status: 'validating' }
  | { status: 'valid' }
  | { status: 'invalid'; failingBuckets: BucketWithSizeLimit[] }
  | { status: 'error'; message: string }

type ValidationAction =
  | { type: 'start' }
  | { type: 'success'; failingBuckets: BucketWithSizeLimit[] }
  | { type: 'error'; message: string }
  | { type: 'reset' }

const validationStateReducer = (
  state: ValidationState,
  action: ValidationAction
): ValidationState => {
  switch (true) {
    case (state.status === 'initial' || state.status === 'error') && action.type === 'start':
      return { status: 'validating' }
    case state.status === 'validating' && action.type === 'success':
      return action.failingBuckets.length > 0
        ? { status: 'invalid', failingBuckets: action.failingBuckets }
        : { status: 'valid' }
    case state.status === 'validating' && action.type === 'error':
      return { status: 'error', message: action.message }
    case action.type === 'reset':
      return { status: 'initial' }
    default:
      console.warn(
        `[StorageSettings.ValidateSizeLimit] Invalid transition in validationStateReducer: ${state.status} -> ${action.type}`
      )
      return state
  }
}

type ValidateSizeLimitProps = {
  onValidate: () => Promise<BucketWithSizeLimit[]>
  projectRef?: string
  isLoadingBucketEstimate?: boolean
}

export const ValidateSizeLimit = ({
  onValidate,
  projectRef,
  isLoadingBucketEstimate = false,
}: ValidateSizeLimitProps) => {
  const fileSizeLimit: number = useWatch({ name: 'fileSizeLimit' })
  const unit: StorageSizeUnits = useWatch({ name: 'unit' })

  const [showModal, setShowModal] = useState(false)
  const [validationState, dispatch] = useReducer(validationStateReducer, { status: 'initial' })

  useEffect(() => {
    dispatch({ type: 'reset' })
  }, [fileSizeLimit, unit])

  const handleValidate = async () => {
    dispatch({ type: 'start' })
    try {
      const globalLimitInBytes = convertToBytes(fileSizeLimit, unit)
      const buckets = await onValidate()
      const failing = buckets.filter((bucket) => bucket.file_size_limit > globalLimitInBytes)

      dispatch({ type: 'success', failingBuckets: failing })
    } catch (error) {
      console.error('Error validating bucket size limits: %O', error)
      const message =
        error instanceof Error && error.message.length > 0
          ? error.message
          : 'Unexpected error while validating bucket limits'

      dispatch({ type: 'error', message })
    } finally {
      setShowModal(false)
    }
  }

  const canTriggerRevalidation =
    validationState.status === 'initial' || validationState.status === 'error'
  const isValidating = validationState.status === 'validating'
  const showValidationButton = canTriggerRevalidation || isValidating

  const hasUnsuccessfulValidation = validationState.status === 'invalid'
  const bucketLimitError: FieldError | undefined =
    validationState.status === 'invalid'
      ? {
          type: 'manual',
          message: encodeBucketLimitErrorMessage(
            validationState.failingBuckets.map((bucket) => ({
              name: bucket.name,
              limit: bucket.file_size_limit,
            }))
          ),
        }
      : undefined
  const hasSuccessfulValidation = validationState.status === 'valid'

  const validationError = validationState.status === 'error' ? validationState.message : undefined

  if (isLoadingBucketEstimate) {
    // Avoid flashing manual validation UI before the estimate query resolves
    return null
  }

  return (
    <>
      {showValidationButton && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className={cn(
                'mt-2 ml-auto text-foreground-lighter',
                '!w-fit text-xs',
                isValidating ? 'cursor-wait' : 'hover:text-foreground'
              )}
              onClick={() => setShowModal(true)}
              disabled={isValidating}
            >
              {isValidating ? 'Validating...' : 'Validate size limit'}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Check that all existing buckets fit within this limit</p>
          </TooltipContent>
        </Tooltip>
      )}

      {hasUnsuccessfulValidation && (
        <div className="mt-2 text-xs text-right text-destructive">
          <StorageFileSizeLimitErrorMessage error={bucketLimitError} projectRef={projectRef} />
        </div>
      )}

      {hasSuccessfulValidation && (
        <p className="mt-2 text-xs text-right text-foreground-light">
          All buckets fit within this limit.
        </p>
      )}

      {validationError && (
        <p className="mt-2 text-xs text-right text-destructive">
          Failed to validate bucket limits: {validationError}
        </p>
      )}

      <ConfirmationModal
        visible={showModal}
        loading={isValidating}
        size="medium"
        title="Validate bucket size limits"
        description="Make sure no bucket-specific limit exceeds the new global limit."
        confirmLabel="Run validation"
        onCancel={() => setShowModal(false)}
        onConfirm={handleValidate}
      >
        <p className="text-sm text-foreground-light">
          Running this queries the <code className="text-code-inline">storage.buckets</code> table,
          which may cause load on your database because you have more than{' '}
          {THRESHOLD_FOR_AUTO_QUERYING_BUCKET_LIMITS.toLocaleString()} buckets.
        </p>
      </ConfirmationModal>
    </>
  )
}
