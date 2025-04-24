import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Label_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

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
const ORG_SIZE_DEFAULT = '1'

interface Props {
  tier: string
  onSuccess: () => void
}

export const CREATE_AWS_MANAGED_ORG_FORM_ID = 'create-aws-managed-org-form'

const NewOrgAwsMarketplaceForm = ({ tier, onSuccess }: Props) => {
  const formSchema = z.object({
    name: z.string({
      required_error: 'Please provide an organization name.',
    }),
    kind: z.string(),
    size: z.string().optional(),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
      name: undefined,
      kind: ORG_KIND_DEFAULT,
      size: ORG_SIZE_DEFAULT,
    },
  })

  const { kind } = form.watch()

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    onSuccess()
  }

  return (
    <Form_Shadcn_ {...form}>
      <form
        id={CREATE_AWS_MANAGED_ORG_FORM_ID}
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit(onSubmit)()
        }}
      >
        <div className="flex flex-col gap-4">
          <FormField_Shadcn_
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItemLayout label="Name" layout="horizontal">
                <FormControl_Shadcn_>
                  <>
                    <Input_Shadcn_ {...field} placeholder="Organization name" />
                    <div className="mt-1">
                      <Label_Shadcn_
                        htmlFor="name"
                        className="text-foreground-lighter leading-normal text-sm"
                      >
                        What's the name of your company or team?
                      </Label_Shadcn_>
                    </div>
                  </>
                </FormControl_Shadcn_>
              </FormItemLayout>
            )}
          />
          <FormField_Shadcn_
            control={form.control}
            name="kind"
            render={({ field }) => (
              <FormItemLayout label="Type" layout="horizontal">
                <FormControl_Shadcn_>
                  <>
                    <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger_Shadcn_>
                        <SelectValue_Shadcn_ />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        {Object.entries(ORG_KIND_TYPES).map(([k, v]) => (
                          <SelectItem_Shadcn_ key={k} value={k}>
                            {v}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                    <div className="mt-1">
                      <Label_Shadcn_
                        htmlFor="kind"
                        className="text-foreground-lighter leading-normal text-sm"
                      >
                        What would best describe your organization?
                      </Label_Shadcn_>
                    </div>
                  </>
                </FormControl_Shadcn_>
              </FormItemLayout>
            )}
          />
          {kind == 'COMPANY' && (
            <FormField_Shadcn_
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItemLayout label="Company size" layout="horizontal">
                  <FormControl_Shadcn_>
                    <>
                      <Select_Shadcn_ value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger_Shadcn_>
                          <SelectValue_Shadcn_ placeholder="How many people are in your company?" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          {Object.entries(ORG_SIZE_TYPES).map(([k, v]) => (
                            <SelectItem_Shadcn_ key={k} value={k}>
                              {v}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                      <div className="mt-1">
                        <Label_Shadcn_
                          htmlFor="size"
                          className="text-foreground-lighter leading-normal text-sm"
                        >
                          How many people are in your company?
                        </Label_Shadcn_>
                      </div>
                    </>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          )}
          <FormItemLayout label="Plan" layout="horizontal">
            <div>{tier}</div>
          </FormItemLayout>
        </div>
      </form>
    </Form_Shadcn_>
  )
}

export default NewOrgAwsMarketplaceForm
