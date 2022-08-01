import { Button } from '@supabase/ui'
import { ButtonHTMLAttributes } from 'react'

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
  form: React.HTMLProps<HTMLButtonElement>['form']
}

const FormActions = ({
  isSubmitting,
  handleReset,
  hasChanges = undefined,
  helper,
  form,
}: Props) => {
  return (
    <div
      className={[
        'flex items-center gap-2',
        // justify actions to right if no helper text
        helper ? 'justify-between' : 'justify-end',
      ].join(' ')}
    >
      {helper && <span className="text-scale-900 text-xs">{helper}</span>}
      <div className="flex gap-2">
        <Button
          disabled={!hasChanges && hasChanges !== undefined}
          type="default"
          htmlType="reset"
          onClick={() => handleReset()}
        >
          Cancel
        </Button>
        <Button
          disabled={!hasChanges && hasChanges !== undefined}
          loading={isSubmitting}
          type="primary"
          htmlType="submit"
          form={form}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

export { FormActions }
