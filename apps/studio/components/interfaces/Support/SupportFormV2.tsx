import { zodResolver } from '@hookform/resolvers/zod'
import * as Sentry from '@sentry/nextjs'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { ExternalLink, Loader2, Mail, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useDocsSearch, useParams, type DocsSearchResult as Page } from 'common'
import { CLIENT_LIBRARIES } from 'common/constants'
import { useSendSupportTicketMutation } from 'data/feedback/support-ticket-send'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import type { Project } from 'data/projects/project-detail-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useFlag } from 'hooks/ui/useFlag'
import { useProfile } from 'lib/profile'
import {
  Badge,
  Button,
  Checkbox_Shadcn_,
  cn,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  ScrollArea,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Separator,
  TextArea_Shadcn_,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import DisabledStateForFreeTier from './DisabledStateForFreeTier'
import { DocsLinkGroup } from './DocsLink'
import { PlanExpectationInfoBox } from './PlanExpectationInfoBox'
import {
  CATEGORY_OPTIONS,
  IPV4_MIGRATION_STRINGS,
  SERVICE_OPTIONS,
  SEVERITY_OPTIONS,
} from './Support.constants'
import { LibrarySuggestions } from './LibrarySuggestions'
import { MultiSelectV2 } from 'ui-patterns/MultiSelectDeprecated/MultiSelectV2'
import { IPV4SuggestionAlert } from './IPV4SuggestionAlert'
import { formatMessage, uploadAttachments } from './SupportForm.utils'
import { detectBrowser } from 'lib/helpers'
import { getProjectAuthConfig } from 'data/auth/auth-config-query'

const MAX_ATTACHMENTS = 5
const INCLUDE_DISCUSSIONS = ['Problem', 'Database_unresponsive']
const CONTAINER_CLASSES = 'px-6'

interface SupportFormV2Props {
  setSentCategory: (value: string) => void
  setSelectedProject: (value: string) => void
}

// [Joshen] Just naming it as V2 for now for PR review purposes so its easier to view
// This is a rewrite of the old SupportForm to use the new form components
export const SupportFormV2 = ({ setSentCategory, setSelectedProject }: SupportFormV2Props) => {
  const { profile } = useProfile()
  const supabaseClient = useSupabaseClient()
  const { ref, slug, category: urlCategory, subject: urlSubject, message: urlMessage } = useParams()
  const enableFreeSupport = useFlag('enableFreeSupport')

  const uploadButtonRef = useRef(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [docsResults, setDocsResults] = useState<Page[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadedDataUrls, setUploadedDataUrls] = useState<string[]>([])

  const FormSchema = z
    .object({
      organizationSlug: z.string().min(1, 'Please select an organization'),
      projectRef: z.string().min(1, 'Please select a project'),
      category: z.string(),
      severity: z.string(),
      library: z.string(),
      subject: z.string().min(1, 'Please add a subject heading'),
      message: z.string().min(1, "Please add a message about the issue that you're facing"),
      affectedServices: z.string(),
      allowSupportAccess: z.boolean(),
    })
    .refine(
      (data) => {
        return !(data.category === 'Problem' && data.library === '')
      },
      {
        message: "Please select the library that you're facing issues with",
        path: ['library'],
      }
    )

  const defaultValues = {
    organizationSlug: '',
    projectRef: 'no-project',
    category: CATEGORY_OPTIONS[0].value,
    severity: 'Low',
    library: '',
    subject: '',
    message: '',
    affectedServices: '',
    allowSupportAccess: false,
  }

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const { organizationSlug, projectRef, category, severity, subject, library } = form.watch()

  const {
    handleDocsSearchDebounced,
    searchState,
    searchState: state,
  } = useDocsSearch(supabaseClient)

  const {
    data: organizations,
    isLoading: isLoadingOrganizations,
    isSuccess: isSuccessOrganizations,
  } = useOrganizationsQuery()

  const {
    data: subscription,
    isLoading: isLoadingSubscription,
    isSuccess: isSuccessSubscription,
  } = useOrgSubscriptionQuery({
    orgSlug: organizationSlug === 'no-org' ? undefined : organizationSlug,
  })

  const {
    data: allProjects,
    isLoading: isLoadingProjects,
    isSuccess: isSuccessProjects,
  } = useProjectsQuery()

  const { mutate: submitSupportTicket } = useSendSupportTicketMutation({
    onSuccess: (res, variables) => {
      toast.success('Support request sent. Thank you!')
      setSentCategory(variables.category)
      setSelectedProject(variables.projectRef ?? 'no-project')
    },
    onError: (error) => {
      toast.error(`Failed to submit support ticket: ${error.message}`)
      Sentry.captureMessage('Failed to submit Support Form: ' + error.message)
      setIsSubmitting(false)
    },
  })

  const respondToEmail = profile?.primary_email ?? 'your email'
  const subscriptionPlanId = subscription?.plan.id
  const projects = [
    ...(allProjects ?? []).filter((project) => project.organization_slug === organizationSlug),
    { ref: 'no-project', name: 'No specific project' } as Partial<Project>,
  ]
  const hasResults =
    state.status === 'fullResults' ||
    state.status === 'partialResults' ||
    (state.status === 'loading' && state.staleResults.length > 0)

  const onFilesUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    event.persist()
    const items = event.target.files || (event as any).dataTransfer.items
    const itemsCopied = Array.prototype.map.call(items, (item) => item) as File[]
    const itemsToBeUploaded = itemsCopied.slice(0, MAX_ATTACHMENTS - uploadedFiles.length)

    setUploadedFiles(uploadedFiles.concat(itemsToBeUploaded))
    if (items.length + uploadedFiles.length > MAX_ATTACHMENTS) {
      toast(`Only up to ${MAX_ATTACHMENTS} attachments are allowed`)
    }
    event.target.value = ''
  }

  const removeUploadedFile = (idx: number) => {
    const updatedFiles = uploadedFiles?.slice()
    updatedFiles.splice(idx, 1)
    setUploadedFiles(updatedFiles)

    const updatedDataUrls = uploadedDataUrls.slice()
    uploadedDataUrls.splice(idx, 1)
    setUploadedDataUrls(updatedDataUrls)
  }

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    setIsSubmitting(true)
    const attachments =
      uploadedFiles.length > 0 ? await uploadAttachments(values.projectRef, uploadedFiles) : []
    const selectedLibrary = CLIENT_LIBRARIES.find((library) => library.language === values.library)

    const payload = {
      ...values,
      organizationSlug: values.organizationSlug === 'no-org' ? undefined : values.organizationSlug,
      library:
        values.category === 'Problem' && selectedLibrary !== undefined ? selectedLibrary.key : '',
      message: formatMessage(values.message, attachments),
      verified: true,
      tags: ['dashboard-support-form'],
      siteUrl: '',
      additionalRedirectUrls: '',
      affectedServices: values.affectedServices
        .split(',')
        .map((x) => x.trim().replace(/ /g, '_').toLowerCase())
        .join(';'),
      browserInformation: detectBrowser(),
    }

    if (values.projectRef !== 'no-project') {
      try {
        const authConfig = await getProjectAuthConfig({ projectRef: values.projectRef })
        payload.siteUrl = authConfig.SITE_URL
        payload.additionalRedirectUrls = authConfig.URI_ALLOW_LIST
      } catch (error) {
        // [Joshen] No error handler required as fetching these info are nice to haves, not necessary
      }
    }

    submitSupportTicket(payload)
  }

  useEffect(() => {
    if (subject !== urlSubject && subject.trim().length > 0) {
      handleDocsSearchDebounced(subject.trim())
    } else {
      setDocsResults([])
    }
  }, [subject, urlSubject])

  useEffect(() => {
    if (subject.trim().length > 0 && searchState.status === 'fullResults') {
      setDocsResults(searchState.results)
    } else if (searchState.status === 'noResults' || searchState.status === 'error') {
      setDocsResults([])
    }
  }, [searchState])

  useEffect(() => {
    if (!uploadedFiles) return
    const objectUrls = uploadedFiles.map((file) => URL.createObjectURL(file))
    setUploadedDataUrls(objectUrls)

    return () => {
      objectUrls.forEach((url: any) => URL.revokeObjectURL(url))
    }
  }, [uploadedFiles])

  useEffect(() => {
    // For prefilling form fields via URL, project ref will taking higher precedence than org slug
    if (isSuccessOrganizations && isSuccessProjects) {
      if (organizations.length === 0) {
        form.setValue('organizationSlug', 'no-org')
      } else if (ref) {
        const selectedProject = allProjects.find((p) => p.ref === ref)
        if (selectedProject !== undefined) {
          form.setValue('organizationSlug', selectedProject.organization_slug)
          form.setValue('projectRef', selectedProject.ref)
        }
      } else if (slug) {
        const selectedOrganization = organizations?.find((org) => org.slug === slug)
        if (selectedOrganization !== undefined) {
          form.setValue('organizationSlug', selectedOrganization.slug)
        }
      } else if (ref === undefined && slug === undefined) {
        const firstOrganization = organizations?.[0]
        if (firstOrganization !== undefined) {
          form.setValue('organizationSlug', firstOrganization.slug)
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, slug, isSuccessOrganizations, isSuccessProjects])

  useEffect(() => {
    if (urlCategory) {
      const validCategory = CATEGORY_OPTIONS.find((option) => {
        if (option.value.toLowerCase() === ((urlCategory as string) ?? '').toLowerCase())
          return option
      })
      if (validCategory !== undefined) form.setValue('category', validCategory.value)
    }
  }, [urlCategory])

  useEffect(() => {
    if (urlSubject) form.setValue('subject', urlSubject)
  }, [urlSubject])

  useEffect(() => {
    if (urlMessage) form.setValue('message', urlMessage)
  }, [urlMessage])

  return (
    <Form_Shadcn_ {...form}>
      <form
        id="support-form"
        className={cn('flex flex-col gap-y-8')}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <h3 className={cn(CONTAINER_CLASSES, 'text-xl')}>How can we help?</h3>

        <FormField_Shadcn_
          name="organizationSlug"
          control={form.control}
          render={({ field }) => (
            <FormItemLayout
              className={cn(CONTAINER_CLASSES)}
              layout="vertical"
              label="Which organization is affected?"
            >
              <FormControl_Shadcn_>
                <Select_Shadcn_
                  {...field}
                  disabled={isLoadingOrganizations}
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger_Shadcn_ className="w-full">
                    <SelectValue_Shadcn_ asChild placeholder="Select an organization">
                      <div className="flex items-center gap-x-2">
                        {organizationSlug === 'no-org' ? (
                          <span>No specific organization</span>
                        ) : (
                          (organizations ?? []).find((o) => o.slug === field.value)?.name
                        )}
                        {organizationSlug !== 'no-org' && isLoadingSubscription && (
                          <Loader2 size={14} className="animate-spin" />
                        )}
                        {isSuccessSubscription && (
                          <Badge variant="outline" className="capitalize">
                            {subscriptionPlanId}
                          </Badge>
                        )}
                      </div>
                    </SelectValue_Shadcn_>
                  </SelectTrigger_Shadcn_>
                  <SelectContent_Shadcn_>
                    <SelectGroup_Shadcn_>
                      {organizations?.map((org) => (
                        <SelectItem_Shadcn_ value={org.slug}>{org.name}</SelectItem_Shadcn_>
                      ))}
                      {isSuccessOrganizations && (organizations ?? []).length === 0 && (
                        <SelectItem_Shadcn_ value="no-org">
                          No specific organization
                        </SelectItem_Shadcn_>
                      )}
                    </SelectGroup_Shadcn_>
                  </SelectContent_Shadcn_>
                </Select_Shadcn_>
              </FormControl_Shadcn_>
            </FormItemLayout>
          )}
        />

        <div className={cn(CONTAINER_CLASSES, 'flex flex-col gap-y-2')}>
          <FormField_Shadcn_
            name="projectRef"
            control={form.control}
            render={({ field }) => (
              <FormItemLayout layout="vertical" label="Which project is affected?">
                <FormControl_Shadcn_>
                  <Select_Shadcn_
                    {...field}
                    disabled={isLoadingProjects}
                    defaultValue={field.value}
                    onValueChange={(val) => {
                      if (val.length > 0) field.onChange(val)
                    }}
                  >
                    <SelectTrigger_Shadcn_ className="w-full">
                      <SelectValue_Shadcn_ placeholder="Select a project" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectGroup_Shadcn_>
                        {projects?.map((project) => (
                          <SelectItem_Shadcn_ value={project.ref as string}>
                            {project.name}
                          </SelectItem_Shadcn_>
                        ))}
                      </SelectGroup_Shadcn_>
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </FormControl_Shadcn_>
              </FormItemLayout>
            )}
          />
          {organizationSlug &&
            subscriptionPlanId !== 'enterprise' &&
            category !== 'Login_issues' && (
              <PlanExpectationInfoBox
                orgSlug={organizationSlug}
                projectRef={projectRef}
                planId={subscriptionPlanId}
              />
            )}
        </div>

        <div
          className={cn(
            CONTAINER_CLASSES,
            'grid sm:grid-cols-2 sm:grid-rows-1 gap-4 grid-cols-1 grid-rows-2'
          )}
        >
          <FormField_Shadcn_
            name="category"
            control={form.control}
            render={({ field }) => (
              <FormItemLayout layout="vertical" label="What areas are you having problems with?">
                <FormControl_Shadcn_>
                  <Select_Shadcn_
                    {...field}
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger_Shadcn_ className="w-full">
                      <SelectValue_Shadcn_>
                        {CATEGORY_OPTIONS.find((o) => o.value === field.value)?.label}
                      </SelectValue_Shadcn_>
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectGroup_Shadcn_>
                        {CATEGORY_OPTIONS.map((option) => (
                          <SelectItem_Shadcn_ value={option.value}>
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
            )}
          />
          <FormField_Shadcn_
            name="severity"
            control={form.control}
            render={({ field }) => (
              <FormItemLayout layout="vertical" label="Severity">
                <FormControl_Shadcn_>
                  <Select_Shadcn_
                    {...field}
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger_Shadcn_ className="w-full">
                      <SelectValue_Shadcn_ placeholder="Select a severity">
                        {field.value}
                      </SelectValue_Shadcn_>
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectGroup_Shadcn_>
                        {SEVERITY_OPTIONS.map((option) => (
                          <SelectItem_Shadcn_ value={option.value}>
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
            )}
          />
          {(severity === 'Urgent' || severity === 'High') && (
            <p className="text-sm text-foreground-light mt-2 sm:col-span-2">
              We do our best to respond to everyone as quickly as possible; however, prioritization
              will be based on production status. We ask that you reserve High and Urgent severity
              for production-impacting issues only.
            </p>
          )}
        </div>

        <Separator />

        {!enableFreeSupport || (category === 'Performance' && subscriptionPlanId === 'free') ? (
          <DisabledStateForFreeTier
            category={CATEGORY_OPTIONS.find((o) => o.value === category)?.label ?? ''}
            organizationSlug={organizationSlug}
          />
        ) : (
          <>
            <div className={cn(CONTAINER_CLASSES, 'flex flex-col gap-y-2')}>
              <FormField_Shadcn_
                name="subject"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    layout="vertical"
                    label="Subject"
                    description={
                      field.value.length > 0 &&
                      INCLUDE_DISCUSSIONS.includes(category) && (
                        <p className="flex items-center gap-x-1">
                          <span>Check our </span>
                          <Link
                            key="gh-discussions"
                            href={`https://github.com/orgs/supabase/discussions?discussions_q=${field.value}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-x-1 text-foreground-light underline hover:text-foreground transition"
                          >
                            Github discussions
                            <ExternalLink size={14} strokeWidth={2} />
                          </Link>
                          <span> for a quick answer</span>
                        </p>
                      )
                    }
                  >
                    <FormControl_Shadcn_>
                      <Input_Shadcn_ {...field} placeholder="Summary of the problem you have" />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />

              {docsResults.length > 0 && hasResults && (
                <div className="pt-4 px-4 border rounded-md">
                  <h2 className="text-sm text-foreground-light px-2 mb-4">
                    Suggested resources ({Math.min(docsResults.length, 5)})
                  </h2>
                  <ScrollArea className={docsResults.length > 3 ? 'h-[300px]' : ''}>
                    {docsResults.slice(0, 5).map((page, i) => (
                      <DocsLinkGroup key={`${page.id}-group`} page={page} />
                    ))}
                  </ScrollArea>
                </div>
              )}
            </div>

            {category === 'Problem' && (
              <FormField_Shadcn_
                name="library"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    className={cn(CONTAINER_CLASSES)}
                    layout="vertical"
                    label="Which library are you having issues with"
                  >
                    <FormControl_Shadcn_>
                      <Select_Shadcn_
                        {...field}
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger_Shadcn_ className="w-full">
                          <SelectValue_Shadcn_ placeholder="Please select a library" />
                        </SelectTrigger_Shadcn_>
                        <SelectContent_Shadcn_>
                          <SelectGroup_Shadcn_>
                            {CLIENT_LIBRARIES.map((option) => (
                              <SelectItem_Shadcn_ value={option.language}>
                                {option.language}
                              </SelectItem_Shadcn_>
                            ))}
                          </SelectGroup_Shadcn_>
                        </SelectContent_Shadcn_>
                      </Select_Shadcn_>
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            )}

            {library.length > 0 && <LibrarySuggestions library={library} />}

            {category !== 'Login_issues' && (
              <FormField_Shadcn_
                name="affectedServices"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    className={cn(CONTAINER_CLASSES)}
                    layout="vertical"
                    label="Which services are affected?"
                  >
                    <FormControl_Shadcn_>
                      <MultiSelectV2
                        options={SERVICE_OPTIONS}
                        value={field.value.length === 0 ? [] : field.value?.split(', ')}
                        placeholder="No particular service"
                        searchPlaceholder="Search for a service"
                        onChange={(services) =>
                          form.setValue('affectedServices', services.join(', '))
                        }
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            )}

            <FormField_Shadcn_
              name="message"
              control={form.control}
              render={({ field }) => (
                <FormItemLayout
                  className={cn(CONTAINER_CLASSES)}
                  layout="vertical"
                  label="Message"
                  labelOptional="5000 character limit"
                  description={
                    IPV4_MIGRATION_STRINGS.some((str) => field.value.includes(str)) && (
                      <IPV4SuggestionAlert />
                    )
                  }
                >
                  <FormControl_Shadcn_>
                    <TextArea_Shadcn_
                      {...field}
                      rows={4}
                      maxLength={5000}
                      placeholder="Describe the issue you're facing, along with any relevant information. Please be as detailed and specific as possible."
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />

            {['Problem', 'Database_unresponsive', 'Performance'].includes(category) && (
              <FormField_Shadcn_
                name="allowSupportAccess"
                control={form.control}
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex"
                    className={cn(CONTAINER_CLASSES)}
                    label="Allow Supabase Support to access your project temporarily"
                    description="In some cases, we may require temporary access to your project to complete troubleshooting, or to answer questions related specifically to your project"
                  >
                    <FormControl_Shadcn_>
                      <Checkbox_Shadcn_
                        {...field}
                        value={String(field.value)}
                        checked={field.value}
                        onCheckedChange={(value) => field.onChange(value)}
                      />
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            )}

            <div className={cn(CONTAINER_CLASSES)}>
              <div className="flex flex-col gap-y-1">
                <p className="text-sm text-foreground-light">Attachments</p>
                <p className="text-sm text-foreground-lighter">
                  Upload up to {MAX_ATTACHMENTS} screenshots that might be relevant to the issue
                  that you're facing
                </p>
              </div>
              <input
                multiple
                type="file"
                ref={uploadButtonRef}
                className="hidden"
                accept="image/png, image/jpeg"
                onChange={onFilesUpload}
              />
              <div className="flex items-center gap-x-2 mt-4">
                {uploadedDataUrls.map((x: any, idx: number) => (
                  <div
                    key={idx}
                    style={{ backgroundImage: `url("${x}")` }}
                    className="relative h-14 w-14 rounded bg-cover bg-center bg-no-repeat"
                  >
                    <div
                      className={[
                        'flex h-4 w-4 items-center justify-center rounded-full bg-red-900',
                        'absolute -top-1 -right-1 cursor-pointer',
                      ].join(' ')}
                      onClick={() => removeUploadedFile(idx)}
                    >
                      <X size={12} strokeWidth={2} />
                    </div>
                  </div>
                ))}
                {uploadedFiles.length < MAX_ATTACHMENTS && (
                  <div
                    className={[
                      'border border-stronger opacity-50 transition hover:opacity-100',
                      'group flex h-14 w-14 cursor-pointer items-center justify-center rounded',
                    ].join(' ')}
                    onClick={() => {
                      if (uploadButtonRef.current) (uploadButtonRef.current as any).click()
                    }}
                  >
                    <Plus strokeWidth={2} size={20} />
                  </div>
                )}
              </div>
            </div>

            <div className={cn(CONTAINER_CLASSES)}>
              <div className="flex items-center space-x-1 justify-end block text-sm mt-0 mb-2">
                <p className="text-foreground-light">We will contact you at</p>
                <p className="text-foreground font-medium">{respondToEmail}</p>
              </div>
              <div className="flex items-center space-x-1 justify-end block text-sm mt-0 mb-2">
                <p className="text-foreground-light">
                  Please ensure you haven't blocked Hubspot in your emails
                </p>
              </div>
              <div className="flex justify-end">
                <Button
                  htmlType="submit"
                  size="small"
                  icon={<Mail />}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                >
                  Send support request
                </Button>
              </div>
            </div>
          </>
        )}
      </form>
    </Form_Shadcn_>
  )
}
