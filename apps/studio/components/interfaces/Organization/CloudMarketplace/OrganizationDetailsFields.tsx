import type { Control, FieldPath, FieldValues } from 'react-hook-form'
import {
  FormControl,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import {
  ORG_KIND_TYPES,
  ORG_SIZE_TYPES,
  orgKindSchema,
  orgSizeSchema,
} from '../../OnboardingSurvey/OnboardingSurvey.constants'

export const organizationDetailsSchema = z.object({
  name: z.string().trim().min(1, 'Organization name is required'),
  kind: orgKindSchema,
  size: orgSizeSchema,
})

export type OrganizationDetailsFormValues = z.infer<typeof organizationDetailsSchema>

interface OrganizationDetailsFieldsProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  kind: string
  nameField?: FieldPath<TFieldValues>
  kindField?: FieldPath<TFieldValues>
  sizeField?: FieldPath<TFieldValues>
}

export const OrganizationDetailsFields = <TFieldValues extends FieldValues>({
  control,
  kind,
  nameField = 'name' as FieldPath<TFieldValues>,
  kindField = 'kind' as FieldPath<TFieldValues>,
  sizeField = 'size' as FieldPath<TFieldValues>,
}: OrganizationDetailsFieldsProps<TFieldValues>) => (
  <>
    <FormField
      control={control}
      name={nameField}
      render={({ field }) => (
        <FormItemLayout
          label="Name"
          layout="horizontal"
          description="What's the name of your company or team? You can change this later."
        >
          <FormControl>
            <Input
              autoFocus
              type="text"
              placeholder="Organization name"
              data-1p-ignore
              data-lpignore="true"
              data-form-type="other"
              data-bwignore
              {...field}
            />
          </FormControl>
        </FormItemLayout>
      )}
    />
    <FormField
      control={control}
      name={kindField}
      render={({ field }) => (
        <FormItemLayout
          label="Type"
          layout="horizontal"
          description="What best describes your organization?"
        >
          <FormControl>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {Object.entries(ORG_KIND_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormControl>
        </FormItemLayout>
      )}
    />

    {kind === 'COMPANY' && (
      <FormField
        control={control}
        name={sizeField}
        render={({ field }) => (
          <FormItemLayout
            label="Company size"
            layout="horizontal"
            description="How many people are in your company?"
          >
            <FormControl>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent>
                  {Object.entries(ORG_SIZE_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormControl>
          </FormItemLayout>
        )}
      />
    )}
  </>
)
