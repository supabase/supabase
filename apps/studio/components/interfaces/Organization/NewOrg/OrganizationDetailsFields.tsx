import type { ReactNode } from 'react'
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

export const ORG_KIND_TYPES = {
  PERSONAL: 'Personal',
  EDUCATIONAL: 'Educational',
  STARTUP: 'Startup',
  AGENCY: 'Agency',
  COMPANY: 'Company',
  UNDISCLOSED: 'N/A',
}

export const ORG_KIND_DEFAULT = 'PERSONAL'

export const ORG_SIZE_TYPES = {
  '1': '1 - 10',
  '10': '10 - 49',
  '50': '50 - 99',
  '100': '100 - 299',
  '300': 'More than 300',
}

export const ORG_SIZE_DEFAULT = '1'

export type OrgKind = keyof typeof ORG_KIND_TYPES
export type OrgSize = keyof typeof ORG_SIZE_TYPES

const orgKindValues = [
  'PERSONAL',
  'EDUCATIONAL',
  'STARTUP',
  'AGENCY',
  'COMPANY',
  'UNDISCLOSED',
] as const

const orgSizeValues = ['1', '10', '50', '100', '300'] as const

export const organizationDetailsSchema = z.object({
  name: z.string().trim().min(1, 'Organization name is required'),
  kind: z
    .string()
    .transform((val) => val.toUpperCase())
    .pipe(z.enum(orgKindValues)),
  size: z.enum(orgSizeValues),
})

export type OrganizationDetailsFormValues = z.infer<typeof organizationDetailsSchema>

interface OrganizationDetailsFieldsProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
  kind: string
  nameField?: FieldPath<TFieldValues>
  kindField?: FieldPath<TFieldValues>
  sizeField?: FieldPath<TFieldValues>
  renderFieldWrapper?: (children: ReactNode, field: 'name' | 'kind' | 'size') => ReactNode
}

export const OrganizationDetailsFields = <TFieldValues extends FieldValues>({
  control,
  kind,
  nameField = 'name' as FieldPath<TFieldValues>,
  kindField = 'kind' as FieldPath<TFieldValues>,
  sizeField = 'size' as FieldPath<TFieldValues>,
  renderFieldWrapper = (children) => children,
}: OrganizationDetailsFieldsProps<TFieldValues>) => (
  <>
    {renderFieldWrapper(
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
      />,
      'name'
    )}
    {renderFieldWrapper(
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
      />,
      'kind'
    )}

    {kind === 'COMPANY' &&
      renderFieldWrapper(
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
        />,
        'size'
      )}
  </>
)
