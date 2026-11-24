import { useWatch, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import {
  FormControl,
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  BUILDING_OPTIONS,
  CAN_CODE_OPTIONS,
  ORG_SIZE_TYPES,
  SURVEY_ORG_KIND_OPTIONS,
} from './OnboardingSurvey.constants'
import { OnboardingSurveySelect } from './OnboardingSurveySelect'

interface OnboardingSurveyFieldsProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>
}

// Expects the form to have the onboardingSurveySchema fields: kind, size, building and can_code
export const OnboardingSurveyFields = <TFieldValues extends FieldValues>({
  control,
}: OnboardingSurveyFieldsProps<TFieldValues>) => {
  const kindField = 'kind' as FieldPath<TFieldValues>
  const sizeField = 'size' as FieldPath<TFieldValues>
  const buildingField = 'building' as FieldPath<TFieldValues>
  const canCodeField = 'can_code' as FieldPath<TFieldValues>
  const kind = useWatch({ control, name: kindField })

  return (
    <div className="flex flex-col gap-y-5">
      <FormField
        control={control}
        name={kindField}
        render={({ field }) => (
          <FormItemLayout label="Who is this org for?" layout="horizontal">
            <FormControl>
              <OnboardingSurveySelect
                value={field.value}
                onValueChange={field.onChange}
                options={SURVEY_ORG_KIND_OPTIONS}
              />
            </FormControl>
          </FormItemLayout>
        )}
      />
      {kind === 'COMPANY' && (
        <FormField
          control={control}
          name={sizeField}
          render={({ field }) => (
            <FormItemLayout label="How many people?" layout="horizontal">
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    {Object.entries(ORG_SIZE_TYPES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItemLayout>
          )}
        />
      )}
      <FormField
        control={control}
        name={buildingField}
        render={({ field }) => (
          <FormItemLayout label="What are you building?" layout="horizontal">
            <FormControl>
              <OnboardingSurveySelect
                value={field.value}
                onValueChange={field.onChange}
                options={BUILDING_OPTIONS}
              />
            </FormControl>
          </FormItemLayout>
        )}
      />
      <FormField
        control={control}
        name={canCodeField}
        render={({ field }) => (
          <FormItemLayout label="Do you know how to code?" layout="horizontal">
            <FormControl>
              <OnboardingSurveySelect
                value={field.value}
                onValueChange={field.onChange}
                options={CAN_CODE_OPTIONS}
              />
            </FormControl>
          </FormItemLayout>
        )}
      />
    </div>
  )
}
