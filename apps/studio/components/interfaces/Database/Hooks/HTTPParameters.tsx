import { Plus, Trash } from 'lucide-react'
import { useFieldArray, UseFormReturn } from 'react-hook-form'
import { Button, FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_, SidePanel } from 'ui'

import { WebhookFormValues } from './EditHookPanel.constants'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import {
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from '@/components/ui/Forms/FormSection'
import { uuidv4 } from '@/lib/helpers'

interface HTTPParametersProps {
  form: UseFormReturn<WebhookFormValues>
}

export const HTTPParameters = ({ form }: HTTPParametersProps) => {
  const {
    fields: paramFields,
    append: appendParam,
    remove: removeParam,
  } = useFieldArray({
    control: form.control,
    name: 'httpParameters',
  })

  return (
    <FormSection
      header={<FormSectionLabel className="lg:!col-span-4">HTTP Parameters</FormSectionLabel>}
    >
      <FormSectionContent loading={false} className="lg:!col-span-8">
        <div className="space-y-2">
          {paramFields.map((field, index) => (
            <div key={field.id} className="flex items-center space-x-2">
              <FormField_Shadcn_
                control={form.control}
                name={`httpParameters.${index}.name`}
                render={({ field }) => (
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} className="w-full" placeholder="Parameter name" />
                  </FormControl_Shadcn_>
                )}
              />
              <FormField_Shadcn_
                control={form.control}
                name={`httpParameters.${index}.value`}
                render={({ field }) => (
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} className="w-full" placeholder="Parameter value" />
                  </FormControl_Shadcn_>
                )}
              />
              <ButtonTooltip
                type="text"
                className="py-4"
                icon={<Trash />}
                onClick={() => removeParam(index)}
                tooltip={{ content: { side: 'bottom', text: 'Remove parameter' } }}
              />
            </div>
          ))}
          <div>
            <Button
              type="default"
              size="tiny"
              icon={<Plus />}
              onClick={() => appendParam({ id: uuidv4(), name: '', value: '' })}
            >
              Add a new parameter
            </Button>
          </div>
        </div>
      </FormSectionContent>
    </FormSection>
  )
}
