import type { ReactNode } from 'react'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { CardContent, FormControl, FormField, Switch } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

interface DashboardToggleProps<T extends FieldValues> {
  form: UseFormReturn<T>
  name: Path<T>
  label: string
  description: ReactNode
  onToggle: (value: boolean) => void
  isLast?: boolean
}

export function DashboardToggle<T extends FieldValues>({
  form,
  name,
  label,
  description,
  onToggle,
  isLast,
}: DashboardToggleProps<T>) {
  return (
    <CardContent className={isLast ? undefined : 'border-b'}>
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItemLayout layout="flex-row-reverse" label={label} description={description}>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={(value) => {
                  field.onChange(value)
                  onToggle(value)
                }}
              />
            </FormControl>
          </FormItemLayout>
        )}
      />
    </CardContent>
  )
}
