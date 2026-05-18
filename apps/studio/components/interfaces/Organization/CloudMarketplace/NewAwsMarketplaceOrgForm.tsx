import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  Form,
  FormControl,
  FormField,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

const ORG_KIND_TYPES = {
  PERSONAL: 'Personal',
  EDUCATIONAL: 'Educational',
  STARTUP: 'Startup',
  AGENCY: 'Agency',
  COMPANY: 'Company',
  UNDISCLOSED: 'N/A',
}

const ORG_KIND_DEFAULT = 'PERSONAL'

const ORG_SIZE_TYPES = {
  '1': '1 - 10',
  '10': '10 - 49',
  '50': '50 - 99',
  '100': '100 - 299',
  '300': 'More than 300',
}

interface Props {
  onSubmit: (values: NewMarketplaceOrgForm) => void
}

export const CREATE_AWS_MANAGED_ORG_FORM_ID = 'create-aws-managed-org-form'

const FormSchema = z.object({
  name: z.string().trim().min(1, 'Please provide an organization name'),
  kind: z.string(),
  size: z.string().optional(),
})

export type NewMarketplaceOrgForm = z.infer<typeof FormSchema>

const NewAwsMarketplaceOrgForm = ({ onSubmit }: Props) => {
  const form = useForm<NewMarketplaceOrgForm>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      kind: ORG_KIND_DEFAULT,
    },
  })

  const kind = form.watch('kind')

  return (
    <Form {...form}>
      <form id={CREATE_AWS_MANAGED_ORG_FORM_ID} onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItemLayout label="Name" layout="horizontal">
                <FormControl>
                  <>
                    <Input {...field} placeholder="Organization name" />
                    <div className="mt-1">
                      <Label
                        htmlFor="name"
                        className="text-foreground-lighter leading-normal text-sm"
                      >
                        What's the name of your company or team?
                      </Label>
                    </div>
                  </>
                </FormControl>
              </FormItemLayout>
            )}
          />
          <FormField
            control={form.control}
            name="kind"
            render={({ field }) => (
              <FormItemLayout label="Type" layout="horizontal">
                <FormControl>
                  <>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ORG_KIND_TYPES).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="mt-1">
                      <Label
                        htmlFor="kind"
                        className="text-foreground-lighter leading-normal text-sm"
                      >
                        What would best describe your organization?
                      </Label>
                    </div>
                  </>
                </FormControl>
              </FormItemLayout>
            )}
          />
          {kind == 'COMPANY' && (
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItemLayout label="Company size" layout="horizontal">
                  <FormControl>
                    <>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="How many people are in your company?" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(ORG_SIZE_TYPES).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="mt-1">
                        <Label
                          htmlFor="size"
                          className="text-foreground-lighter leading-normal text-sm"
                        >
                          How many people are in your company?
                        </Label>
                      </div>
                    </>
                  </FormControl>
                </FormItemLayout>
              )}
            />
          )}
        </div>
      </form>
    </Form>
  )
}

export default NewAwsMarketplaceOrgForm
