import { Button } from '@supabase/ui'

interface Props {
  /**
   * Handling a submitting/loading state
   */
  isSubmitting?: boolean
  /**
   * Handling a reset/cancel of the form
   */
  handleReset: () => void
  /**
   * Disables submit button if false
   */
  hasChanges: boolean | undefined
  /**
   * Helper text to show alongside actions
   */
  helper?: React.ReactNode
}

const FormActions = ({ isSubmitting, handleReset, hasChanges = undefined, helper }: Props) => {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      {helper && <span className="text-scale-900 text-xs">{helper}</span>}
      <div className="flex justify-between gap-2">
        <Button type="default" htmlType="reset" onClick={() => handleReset()}>
          Cancel
        </Button>
        <Button
          disabled={!hasChanges && hasChanges !== undefined}
          loading={isSubmitting}
          type="primary"
          htmlType="submit"
          form="auth-config-general-form"
        >
          Save
        </Button>
      </div>
    </div>
  )
}

export { FormActions }
