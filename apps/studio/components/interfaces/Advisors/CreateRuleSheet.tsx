import { zodResolver } from '@hookform/resolvers/zod'
// import { useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { useLintRuleCreateMutation } from 'data/lint/create-lint-rule-mutation'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useRouter } from 'next/router'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Separator,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
  Switch,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { LintInfo } from '../Linter/Linter.constants'
import { lintInfoMap } from '../Linter/Linter.utils'
import { generateRuleDescription } from './AdvisorRules.utils'

interface CreateRuleSheetProps {
  lint?: LintInfo
  open: boolean
  onOpenChange: (value: boolean) => void
}

const FormSchema = z.object({
  lint_name: z.string().optional(),
  note: z.string().optional(),
  assigned_to: z.string().optional(),
  is_disabled: z.boolean(),
})

const defaultValues = {
  lint_name: undefined,
  note: undefined,
  assigned_to: 'all',
  is_disabled: true,
}

/**
 * [Joshen] JFYI while the API supports adding rules on a category, I'm intentionally leaving that functionality out for now
 * as the only use case for that would be to ignore _all_ lints in that category (which I'm not sure if that's what we want to advise users doing atm)
 *
 * (Spoken with Hieu) We'll eventually support granularity of Entity/Items as well, just not atm
 */
export const CreateRuleSheet = ({ lint, open, onOpenChange }: CreateRuleSheetProps) => {
  const router = useRouter()
  const { ref: projectRef } = useParams()

  const routeCategory = router.pathname.split('/').pop()
  const { data: organization } = useSelectedOrganizationQuery()
  const { data: members = [] } = useOrganizationMembersQuery({ slug: organization?.slug })

  const { mutate: createRule, isLoading: isCreating } = useLintRuleCreateMutation({
    onSuccess: (_, vars) => {
      const ruleLint = vars.exception.lint_name
      const ruleLintMeta = lintInfoMap.find((x) => x.name === ruleLint)
      toast.success(`Successfully created new rule for ${ruleLintMeta?.title}`)

      if (ruleLintMeta) {
        if (!!routeCategory && routeCategory !== ruleLintMeta.category) {
          router.push(
            `/project/${projectRef}/advisors/rules/${ruleLintMeta.category}?lint=${ruleLintMeta.name}`
          )
        } else {
          // setExpandedLint(ruleLintMeta?.name)
        }
      }
      onOpenChange(false)
    },
  })

  const formId = 'create-lint-rule-form'
  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const { lint_name, assigned_to, is_disabled } = form.watch()

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    if (!projectRef) return console.error('Project ref is required')

    createRule({
      projectRef,
      exception: {
        ...values,
        lint_category: undefined,
        lint_name: values.lint_name,
        assigned_to: values.assigned_to === 'all' ? undefined : values.assigned_to,
      },
    })
  }

  useEffect(() => {
    if (open) form.reset({ ...defaultValues, lint_name: lint?.name })
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader className="shrink-0 flex items-center gap-4">
          <SheetTitle>Create a rule for "{lint?.title}"</SheetTitle>
        </SheetHeader>
        <SheetSection className="overflow-auto flex-grow px-0">
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              className="flex flex-col gap-y-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField_Shadcn_
                name="is_disabled"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    className="px-5"
                    label={`Disable this lint for ${assigned_to === 'all' ? 'project' : 'the assigned member'}`}
                    description="Toggles the visiblity of this lint in the Advisor reports"
                  >
                    <Tooltip>
                      <TooltipTrigger type="button">
                        <FormControl_Shadcn_>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={field.disabled || assigned_to === 'all'}
                          />
                        </FormControl_Shadcn_>
                      </TooltipTrigger>
                      {assigned_to === 'all' && (
                        <TooltipContent side="bottom" className="w-72">
                          Assign this rule to a specific project member before toggling this option
                          off. This will then configure the rule to{' '}
                          <span className="text-brand">only be visible</span> to that member in the
                          advisor reports.
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </FormItemLayout>
                )}
              />

              <Separator />

              <FormField_Shadcn_
                name="assigned_to"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Assign rule to" layout="vertical" className="px-5">
                    <Select_Shadcn_
                      onValueChange={(val) => {
                        field.onChange(val)
                        if (val === 'all') form.setValue('is_disabled', true)
                      }}
                      defaultValue={field.value}
                    >
                      <SelectTrigger_Shadcn_ className="col-span-8">
                        <SelectValue_Shadcn_ />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectItem_Shadcn_ value="all">All project members</SelectItem_Shadcn_>
                        {members.map((m) => (
                          <SelectItem_Shadcn_ key={m.gotrue_id} value={m.gotrue_id}>
                            {m.username || m.primary_email}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </FormItemLayout>
                )}
              />

              {!!lint_name && (
                <div className="px-5">
                  <Admonition showIcon={false} type="default">
                    {generateRuleDescription({
                      name: lint_name,
                      disabled: is_disabled,
                      member: members.find((x) => x.gotrue_id === assigned_to),
                    })}
                  </Admonition>
                </div>
              )}

              <Separator />

              <FormField_Shadcn_
                name="note"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    layout="vertical"
                    className="px-5"
                    label="Description"
                    labelOptional="Optional"
                  >
                    <FormControl_Shadcn_>
                      <Input.TextArea
                        {...field}
                        className="[&>div>div>div>textarea]:text-sm"
                        placeholder="e.g Describe why this rule is being set"
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form_Shadcn_>
        </SheetSection>
        <SheetFooter>
          <Button disabled={isCreating} type="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button form={formId} htmlType="submit" loading={isCreating}>
            Create rule
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
