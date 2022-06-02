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

  hasChanges: boolean | undefined
}

const FormActions = ({ isSubmitting, handleReset, hasChanges = undefined }: Props) => {
  return (
    <div className="flex justify-end gap-2 py-3 px-6">
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
  )
}

export { FormActions }
