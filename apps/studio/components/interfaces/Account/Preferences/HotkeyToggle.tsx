import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { CardContent, FormControl_Shadcn_, FormField_Shadcn_, KeyboardShortcut, Switch } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface HotkeyToggleProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
  keys: string[]
  label: string
  onToggle: (value: boolean) => void
  isLast?: boolean
}

export function HotkeyToggle<T extends FieldValues>({
  form,
  name,
  keys,
  label,
  onToggle,
  isLast,
}: HotkeyToggleProps<T>) {
  return (
    <CardContent className={isLast ? undefined : 'border-b'}>
      <FormField_Shadcn_
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItemLayout layout="flex-row-reverse" label={label}>
            <div className="flex w-full items-center justify-end gap-x-3">
              <KeyboardShortcut keys={keys} />
              <FormControl_Shadcn_>
                <Switch
                  checked={field.value}
                  onCheckedChange={(value) => {
                    field.onChange(value)
                    onToggle(value)
                  }}
                />
              </FormControl_Shadcn_>
            </div>
          </FormItemLayout>
        )}
      />
    </CardContent>
  )
}
