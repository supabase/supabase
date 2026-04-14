import type { ReactNode } from 'react'
import type { FieldValues, Path, UseFormReturn } from 'react-hook-form'
import { CardContent, FormControl_Shadcn_, FormField_Shadcn_, Switch } from 'ui'
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
      <FormField_Shadcn_
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItemLayout layout="flex-row-reverse" label={label} description={description}>
            <FormControl_Shadcn_>
              <Switch
                checked={field.value}
                onCheckedChange={(value) => {
                  field.onChange(value)
                  onToggle(value)
                }}
              />
            </FormControl_Shadcn_>
          </FormItemLayout>
        )}
      />
    </CardContent>
  )
}
