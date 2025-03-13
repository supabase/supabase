import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useParams } from 'common'
import { useLintRuleCreateMutation } from 'data/lint/create-lint-rule-mutation'
import { LintCategory, LintName } from 'data/lint/lint-rules-query'
import { useOrganizationMembersQuery } from 'data/organizations/organization-members-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
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
import { lintInfoMap } from '../Linter/Linter.utils'
import { generateRuleDescription } from './AdvisorRules.utils'

interface CreateRuleSheetProps {
  open: boolean
  onOpenChange: (value: boolean) => void
}

const FormSchema = z
  .object({
    type: z.enum(['category', 'name']),
    lint_category: z.enum(['ALL', 'PERFORMANCE', 'SECURITY']),
    lint_name: z.string().optional(),
    note: z.string().optional(),
    assigned_to: z.string().optional(),
    is_disabled: z.boolean(),
  })
  .superRefine((data, ctx) => {
    const { type, lint_category, lint_name, is_disabled, assigned_to } = data
    if (type === 'category' && !lint_category) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Please select a category`,
        path: ['lint_category'],
      })
    }
    if (type === 'name' && !lint_name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Please select a lint name`,
        path: ['lint_name'],
      })
    }
    if (is_disabled === false && assigned_to === 'all') {
    }
  })

const defaultValues = {
  type: 'name' as 'category' | 'name',
  lint_category: 'PERFORMANCE' as LintCategory,
  lint_name: undefined,
  note: undefined,
  assigned_to: 'all',
  is_disabled: true,
}

// [Joshen] Spoken with Hieu - we'll eventually support granularity of Entity/Items as well, just not atm
// Exceptions are meant to be client side filtering, as this is fully separate from the lint-runner
// TODO:
// - Fill up lintInfoMap with categories
// - Update description of the disable switch with the right report
// - Filter lints from UI in each advisors page
// - Support deleting rules
export const CreateRuleSheet = ({ open, onOpenChange }: CreateRuleSheetProps) => {
  const { ref: projectRef } = useParams()
  const organization = useSelectedOrganization()
  const { data: members = [] } = useOrganizationMembersQuery({ slug: organization?.slug })

  const { mutate: createRule, isLoading: isCreating } = useLintRuleCreateMutation({
    onSuccess: () => {
      toast.success('Successfully created new rule!')
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

  const { type, lint_category, lint_name, assigned_to, is_disabled } = form.watch()

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    if (!projectRef) return console.error('Project ref is required')

    const { type, ...payload } = values
    createRule({
      projectRef,
      exception: {
        ...payload,
        lint_category: type === 'category' ? values.lint_category : undefined,
        lint_name: type === 'name' ? (values.lint_name as LintName) : undefined,
        assigned_to: values.assigned_to === 'all' ? undefined : values.assigned_to,
      },
    })
  }

  useEffect(() => {
    if (open) form.reset(defaultValues)
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0">
        <SheetHeader className="shrink-0 flex items-center gap-4">
          <SheetTitle>Add an Advisor rule</SheetTitle>
        </SheetHeader>
        <SheetSection className="overflow-auto flex-grow px-0">
          <Form_Shadcn_ {...form}>
            <form
              id={formId}
              className="flex flex-col gap-y-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField_Shadcn_
                name="type"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout label="Rule is based on" layout="vertical" className="px-5">
                    <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger_Shadcn_ className="col-span-8">
                        <SelectValue_Shadcn_ />
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectItem_Shadcn_ value="name">Lint name</SelectItem_Shadcn_>
                        <SelectItem_Shadcn_ value="category">Advisor category</SelectItem_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </FormItemLayout>
                )}
              />

              <Separator />

              {type === 'category' ? (
                <FormField_Shadcn_
                  key="lint-category"
                  name="lint_category"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout label="Advisor Category" layout="vertical" className="px-5">
                      <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger_Shadcn_ className="col-span-8">
                          <SelectValue_Shadcn_ placeholder="Select a category" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectItem_Shadcn_ value="ALL">All</SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="PERFORMANCE">
                            Performance Advisor
                          </SelectItem_Shadcn_>
                          <SelectItem_Shadcn_ value="SECURITY">Security Advisor</SelectItem_Shadcn_>
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              ) : type === 'name' ? (
                <FormField_Shadcn_
                  key="lint_name"
                  name="lint_name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItemLayout layout="vertical" className="px-5" label="Lint name">
                      <FormControl_Shadcn_>
                        <Select_Shadcn_ onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger_Shadcn_ className="col-span-8">
                            <SelectValue_Shadcn_ placeholder="Select a lint name" />
                          </SelectTrigger_Shadcn_>
                          <SelectContent_Shadcn_>
                            {lintInfoMap.map((x) => (
                              <SelectItem_Shadcn_ key={x.name} value={x.name}>
                                {x.title}
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectContent_Shadcn_>
                        </Select_Shadcn_>
                      </FormControl_Shadcn_>
                    </FormItemLayout>
                  )}
                />
              ) : null}

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

              <FormField_Shadcn_
                name="is_disabled"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex"
                    className="px-5"
                    label={`Disable ${type === 'category' ? 'category' : 'this lint'} for ${assigned_to === 'all' ? 'project' : 'the assigned member'}`}
                  >
                    <Tooltip>
                      <TooltipTrigger>
                        <FormControl_Shadcn_>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={field.disabled || assigned_to === 'all'}
                          />
                        </FormControl_Shadcn_>
                      </TooltipTrigger>
                      {assigned_to === 'all' && (
                        <TooltipContent side="bottom">
                          You may assign the rule to a specific user
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </FormItemLayout>
                )}
              />

              {((type === 'category' && !!lint_category) || (type === 'name' && !!lint_name)) && (
                <div className="px-5">
                  <Admonition showIcon={false} type="default">
                    {generateRuleDescription({
                      type,
                      category: lint_category,
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
