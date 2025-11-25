import { zodResolver } from '@hookform/resolvers/zod'
import { Check, ChevronsUpDown, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { SubmitHandler } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { useLinkSupportTicketMutation } from 'data/feedback/link-support-ticket-mutation'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import {
  Badge,
  Button,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  DialogSectionSeparator,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Form_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Switch,
  cn,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { OrganizationProjectSelector } from 'components/ui/OrganizationProjectSelector'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { CATEGORY_OPTIONS, type ExtendedSupportCategories } from './Support.constants'
import {
  LinkSupportTicketFormSchema,
  type LinkSupportTicketFormValues,
} from './LinkSupportTicketForm.schema'
import { NO_ORG_MARKER, NO_PROJECT_MARKER } from './SupportForm.utils'

interface LinkSupportTicketFormProps {
  conversationId: string
}

export function LinkSupportTicketForm({ conversationId }: LinkSupportTicketFormProps) {
  const router = useRouter()
  const { data: organizations } = useOrganizationsQuery()

  const form = useForm<LinkSupportTicketFormValues>({
    resolver: zodResolver(LinkSupportTicketFormSchema),
    defaultValues: {
      conversation_id: conversationId,
      organizationSlug: NO_ORG_MARKER,
      projectRef: NO_PROJECT_MARKER,
      category: '' as any,
      allowSupportAccess: true,
    },
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
  })

  const { mutate: linkSupportTicket, isLoading } = useLinkSupportTicketMutation({
    onSuccess: () => {
      toast.success('Support ticket linked successfully!')
      router.push('/')
    },
    onError: (error) => {
      toast.error(`Failed to link support ticket: ${error.message}`)
    },
  })

  const organizationSlug = form.watch('organizationSlug')
  const selectedOrgSlug = organizationSlug === NO_ORG_MARKER ? null : organizationSlug

  const onSubmit: SubmitHandler<LinkSupportTicketFormValues> = (values) => {
    if (!organizations) {
      toast.error('Organizations not loaded. Please try again.')
      return
    }

    const selectedOrg = organizations.find((org) => org.slug === values.organizationSlug)
    if (!selectedOrg) {
      toast.error('Selected organization not found. Please try again.')
      return
    }

    linkSupportTicket({
      conversation_id: values.conversation_id,
      org_id: selectedOrg.id,
      project_ref:
        values.projectRef && values.projectRef !== NO_PROJECT_MARKER
          ? values.projectRef
          : undefined,
      category: values.category,
      allow_support_access: values.allowSupportAccess,
    })
  }

  return (
    <Form_Shadcn_ {...form}>
      <form
        id="link-support-ticket-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-y-6"
      >
        <h3 className="px-6 text-xl">Link support ticket to account</h3>

        <div className="px-6 flex flex-col gap-y-8">
          <FormField_Shadcn_
            control={form.control}
            name="conversation_id"
            render={({ field }) => (
              <FormItemLayout hideMessage layout="vertical" label="Conversation ID">
                <FormControl_Shadcn_>
                  <Input_Shadcn_ {...field} disabled readOnly />
                </FormControl_Shadcn_>
              </FormItemLayout>
            )}
          />

          <FormField_Shadcn_
            control={form.control}
            name="organizationSlug"
            render={({ field }) => {
              const { ref: _ref, ...fieldWithoutRef } = field
              return (
                <FormItemLayout layout="vertical" label="Which organization is affected?">
                  <FormControl_Shadcn_>
                    <Select_Shadcn_
                      {...fieldWithoutRef}
                      disabled={!organizations}
                      defaultValue={field.value}
                      onValueChange={(value) => {
                        const previousOrgSlug = form.getValues('organizationSlug')
                        field.onChange(value)
                        if (previousOrgSlug !== value) {
                          form.resetField('projectRef', { defaultValue: NO_PROJECT_MARKER })
                        }
                      }}
                    >
                      <SelectTrigger_Shadcn_ className="w-full" aria-label="Select an organization">
                        <SelectValue_Shadcn_ placeholder="Select an organization">
                          {organizationSlug === NO_ORG_MARKER
                            ? 'Select an organization'
                            : organizations?.find((o) => o.slug === field.value)?.name}
                        </SelectValue_Shadcn_>
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectGroup_Shadcn_>
                          {organizations?.map((org) => (
                            <SelectItem_Shadcn_ key={org.slug} value={org.slug}>
                              {org.name}
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectGroup_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )
            }}
          />

          <FormField_Shadcn_
            control={form.control}
            name="projectRef"
            render={({ field }) => (
              <FormItemLayout hideMessage layout="vertical" label="Which project is affected?">
                <FormControl_Shadcn_>
                  <OrganizationProjectSelector
                    key={selectedOrgSlug}
                    sameWidthAsTrigger
                    fetchOnMount
                    checkPosition="left"
                    slug={
                      !selectedOrgSlug || selectedOrgSlug === NO_ORG_MARKER
                        ? undefined
                        : selectedOrgSlug
                    }
                    selectedRef={field.value}
                    onSelect={(project) => field.onChange(project.ref)}
                    renderTrigger={({ isLoading, project }) => {
                      return (
                        <Button
                          block
                          type="default"
                          role="combobox"
                          aria-label="Select a project"
                          size="small"
                          className="justify-between"
                          iconRight={
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          }
                          disabled={!selectedOrgSlug}
                        >
                          {!selectedOrgSlug ? (
                            'Select an organization first'
                          ) : isLoading ? (
                            <ShimmeringLoader className="w-44 py-2" />
                          ) : !field.value || field.value === NO_PROJECT_MARKER ? (
                            'No specific project'
                          ) : (
                            project?.name ?? 'Unknown project'
                          )}
                        </Button>
                      )
                    }}
                    renderActions={(setOpen) => (
                      <CommandGroup_Shadcn_>
                        <CommandItem_Shadcn_
                          className="w-full gap-x-2"
                          onSelect={() => {
                            field.onChange(NO_PROJECT_MARKER)
                            setOpen(false)
                          }}
                        >
                          {field.value === NO_PROJECT_MARKER && <Check size={16} />}
                          <p className={field.value !== NO_PROJECT_MARKER ? 'ml-6' : ''}>
                            No specific project
                          </p>
                        </CommandItem_Shadcn_>
                      </CommandGroup_Shadcn_>
                    )}
                  />
                </FormControl_Shadcn_>
              </FormItemLayout>
            )}
          />

          <FormField_Shadcn_
            control={form.control}
            name="category"
            render={({ field }) => {
              const { ref: _ref, ...fieldWithoutRef } = field
              return (
                <FormItemLayout
                  hideMessage
                  layout="vertical"
                  label="What are you having issues with?"
                >
                  <FormControl_Shadcn_>
                    <Select_Shadcn_
                      {...fieldWithoutRef}
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger_Shadcn_ aria-label="Select an issue" className="w-full">
                        <SelectValue_Shadcn_ placeholder="Select an issue">
                          {field.value
                            ? CATEGORY_OPTIONS.find((o) => o.value === field.value)?.label
                            : null}
                        </SelectValue_Shadcn_>
                      </SelectTrigger_Shadcn_>
                      <SelectContent_Shadcn_>
                        <SelectGroup_Shadcn_>
                          {CATEGORY_OPTIONS.filter((option) => !option.hidden).map((option) => (
                            <SelectItem_Shadcn_ key={option.value} value={option.value}>
                              {option.label}
                              <span className="block text-xs text-foreground-lighter">
                                {option.description}
                              </span>
                            </SelectItem_Shadcn_>
                          ))}
                        </SelectGroup_Shadcn_>
                      </SelectContent_Shadcn_>
                    </Select_Shadcn_>
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )
            }}
          />
        </div>

        <DialogSectionSeparator />

        <FormField_Shadcn_
          control={form.control}
          name="allowSupportAccess"
          render={({ field }) => {
            return (
              <FormItemLayout
                hideMessage
                name="allowSupportAccess"
                className="px-6"
                layout="flex"
                label={
                  <div className="flex items-center gap-x-2">
                    <span className="text-foreground">Allow support access to your project</span>
                    <Badge className="bg-opacity-100">Recommended</Badge>
                  </div>
                }
                description={
                  <div className="flex flex-col">
                    <span className="text-foreground-light">
                      Human support and AI diagnostic access.
                    </span>
                    <Collapsible_Shadcn_ className="mt-2">
                      <CollapsibleTrigger_Shadcn_
                        className={
                          'group flex items-center gap-x-1 group-data-[state=open]:text-foreground hover:text-foreground transition'
                        }
                      >
                        <ChevronRight
                          size={14}
                          className="transition-all group-data-[state=open]:rotate-90 text-foreground-muted -ml-1"
                        />
                        <span className="text-sm">More information</span>
                      </CollapsibleTrigger_Shadcn_>
                      <CollapsibleContent_Shadcn_ className="text-sm text-foreground-light mt-2 space-y-2">
                        <p>
                          By enabling this, you grant permission for our support team to access your
                          project temporarily and, if applicable, to use AI tools to assist in
                          diagnosing and resolving issues. This access may involve analyzing
                          database configurations, query performance, and other relevant data to
                          expedite troubleshooting and enhance support accuracy.
                        </p>
                        <p>
                          We are committed to maintaining strict data privacy and security standards
                          in all support activities.{' '}
                          <Link
                            href="https://supabase.com/privacy"
                            target="_blank"
                            rel="noreferrer"
                            className="text-foreground-light underline hover:text-foreground transition"
                          >
                            Privacy Policy
                          </Link>
                        </p>
                      </CollapsibleContent_Shadcn_>
                    </Collapsible_Shadcn_>
                  </div>
                }
              >
                <Switch
                  size="large"
                  id="allowSupportAccess"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormItemLayout>
            )
          }}
        />

        <div className="px-6 pt-2">
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            disabled={isLoading}
            loading={isLoading}
          >
            Link support ticket to account
          </Button>
        </div>
      </form>
    </Form_Shadcn_>
  )
}
