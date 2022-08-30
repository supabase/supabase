import { Button } from '@supabase/ui'

interface Props {
  form: React.HTMLProps<HTMLButtonElement>['form']
  hasChanges: boolean | undefined // Disables submit button if false
  handleReset: () => void // Handling a reset/cancel of the form
  helper?: React.ReactNode // Helper text to show alongside actions
  disabled?: boolean
  isSubmitting?: boolean
}

const FormActions = ({
  form,
  hasChanges = undefined,
  handleReset,
  helper,
  disabled = false,
  isSubmitting,
}: Props) => {
  const isDisabled = isSubmitting || disabled || (!hasChanges && hasChanges !== undefined)

  return (
    <div
      className={[
        'flex items-center gap-2 w-full',
        // justify actions to right if no helper text
        helper ? 'justify-between' : 'justify-end',
      ].join(' ')}
    >
      {helper && <span className="text-scale-900 text-sm">{helper}</span>}
      <div className="flex items-center gap-2">
        <Button disabled={isDisabled} type="default" htmlType="reset" onClick={() => handleReset()}>
          Cancel
        </Button>
        <Button
          form={form}
          type="primary"
          htmlType="submit"
          disabled={isDisabled}
          loading={isSubmitting}
        >
          Save
        </Button>
      </div>
    </div>
  )
}

export { FormActions }
