import { zodResolver } from '@hookform/resolvers/zod'
import * as Sentry from '@sentry/nextjs'
import { SupportCategories } from '@supabase/shared-types/out/constants'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Book,
  Check,
  ChevronRight,
  ChevronsUpDown,
  ExternalLink,
  Github,
  Loader2,
  Mail,
  Plus,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useQueryState } from 'nuqs'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useDocsSearch, useParams, type DocsSearchResult as Page } from 'common'
import { CLIENT_LIBRARIES } from 'common/constants'
import CopyButton from 'components/ui/CopyButton'
import { OrganizationProjectSelector } from 'components/ui/OrganizationProjectSelector'
import { PLAN_REQUEST_EMPTY_PLACEHOLDER } from 'components/ui/UpgradePlanButton'
import { getProjectAuthConfig } from 'data/auth/auth-config-query'
import { useSendSupportTicketMutation } from 'data/feedback/support-ticket-send'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { getProjectDetail } from 'data/projects/project-detail-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from 'lib/constants'
import { detectBrowser } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import {
  Badge,
  Button,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  Separator,
  Switch,
  TextArea_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { MultiSelectV2 } from 'ui-patterns/MultiSelectDeprecated/MultiSelectV2'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { IPV4SuggestionAlert } from './IPV4SuggestionAlert'
import { IssueSuggestion } from './IssueSuggestions'
import { LibrarySuggestions } from './LibrarySuggestions'
import { PlanExpectationInfoBox } from './PlanExpectationInfoBox'
import {
  CATEGORY_OPTIONS,
  IPV4_MIGRATION_STRINGS,
  SERVICE_OPTIONS,
  SEVERITY_OPTIONS,
} from './Support.constants'
import { formatMessage, uploadAttachments } from './SupportForm.utils'

const MAX_ATTACHMENTS = 5
const INCLUDE_DISCUSSIONS = ['Problem', 'Database_unresponsive']
const CONTAINER_CLASSES = 'px-6'

const createFormSchema = (showClientLibraries: boolean) => {
  const baseSchema = z.object({
    organizationSlug: z.string().min(1, 'Please select an organization'),
    projectRef: z.string().min(1, 'Please select a project'),
    category: z.string().min(1, 'Please select an issue type'),
    severity: z.string(),
    library: z.string(),
    subject: z.string().min(1, 'Please add a subject heading'),
    message: z.string().min(1, "Please add a message about the issue that you're facing"),
    affectedServices: z.string(),
    allowSupportAccess: z.boolean(),
  })

  if (showClientLibraries) {
    return baseSchema
      .refine(
        (data) => {
          return !(data.category === 'Problem' && data.library === '')
        },
        {
          message: "Please select the library that you're facing issues with",
          path: ['library'],
        }
      )
      .refine(
        (data) => {
          return !data.message.includes(PLAN_REQUEST_EMPTY_PLACEHOLDER)
        },
        {
          message: `Please let us know which plan you'd like to upgrade to for your organization`,
          path: ['message'],
        }
      )
  }

  // When showClientLibraries is false, make library optional and remove the refine validation
  return baseSchema
    .extend({
      library: z.string().optional(),
    })
    .refine(
      (data) => {
        return !data.message.includes(PLAN_REQUEST_EMPTY_PLACEHOLDER)
      },
      {
        message: `Please let us know which plan you'd like to upgrade to for your organization`,
        path: ['message'],
      }
    )
}

const defaultValues = {
  organizationSlug: '',
  // [Joshen TODO] We should refactor this to accept a null value instead of a magic string
  projectRef: 'no-project',
  category: '',
  severity: 'Low',
  library: '',
  subject: '',
  message: '',
  affectedServices: '',
  allowSupportAccess: true,
}

interface SupportFormV2Props {
  onProjectSelected: (value: string) => void
  onOrganizationSelected: (value: string) => void
  setSentCategory: (value: string) => void
}

export const SupportFormV2 = ({
  onProjectSelected: setSelectedProject,
  onOrganizationSelected: setSelectedOrganization,
  setSentCategory,
}: SupportFormV2Props) => {
  const { profile } = useProfile()
  const [highlightRef, setHighlightRef] = useQueryState('highlight', { defaultValue: '' })

  // [Joshen] Ideally refactor all these to use nuqs
  const {
    projectRef: urlRef,
    slug: urlSlug,
    category: urlCategory,
    subject: urlSubject,
    message: urlMessage,
    error,
  } = useParams()
  const router = useRouter()
  const dashboardSentryIssueId = router.query.sid as string

  const isBillingEnabled = useIsFeatureEnabled('billing:all')
  const showClientLibraries = useIsFeatureEnabled('support:show_client_libraries')

  const categoryOptions = useMemo(() => {
    return CATEGORY_OPTIONS.filter((option) => {
      if (
        option.value === SupportCategories.BILLING ||
        option.value === SupportCategories.REFUND ||
        option.value === SupportCategories.SALES_ENQUIRY
      ) {
        return isBillingEnabled
      } else if (option.value === 'Plan_upgrade') {
        return !isBillingEnabled
      }

      return true
    })
  }, [isBillingEnabled])

  const uploadButtonRef = useRef(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [docsResults, setDocsResults] = useState<Page[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadedDataUrls, setUploadedDataUrls] = useState<string[]>([])

  const FormSchema = useMemo(() => createFormSchema(showClientLibraries), [showClientLibraries])

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    resolver: zodResolver(FormSchema),
    defaultValues,
  })

  const { organizationSlug, projectRef, category, severity, subject, library } = form.watch()

  const { handleDocsSearchDebounced, searchState, searchState: state } = useDocsSearch()

  const {
    data: organizations,
    isLoading: isLoadingOrganizations,
    isSuccess: isSuccessOrganizations,
  } = useOrganizationsQuery()

  const selectedOrganization = useMemo(
    () => organizations?.find((org) => org.slug === organizationSlug),
    [organizationSlug, organizations]
  )

  const { mutate: sendEvent } = useSendEventMutation()

  const { mutate: submitSupportTicket } = useSendSupportTicketMutation({
    onSuccess: (res, variables) => {
      toast.success('Support request sent. Thank you!')
      setSentCategory(variables.category)
      sendEvent({
        action: 'support_ticket_submitted',
        properties: {
          ticketCategory: variables.category,
        },
        groups: {
          project: projectRef === 'no-project' ? undefined : projectRef,
          organization: variables.organizationSlug,
        },
      })
      setSelectedProject(variables.projectRef ?? 'no-project')
    },
    onError: (error) => {
      toast.error(`Failed to submit support ticket: ${error.message}`)
      Sentry.captureMessage('Failed to submit Support Form: ' + error.message)
      setIsSubmitting(false)
    },
  })

  const respondToEmail = profile?.primary_email ?? 'your email'
  const subscriptionPlanId = selectedOrganization?.plan.id

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
    const selectedLibrary = values.library
      ? CLIENT_LIBRARIES.find((library) => library.language === values.library)
      : undefined

    const payload = {
      ...values,
      organizationSlug: values.organizationSlug === 'no-org' ? undefined : values.organizationSlug,
      library:
        values.category === 'Problem' && selectedLibrary !== undefined ? selectedLibrary.key : '',
      message: formatMessage(values.message, attachments, error),
      verified: true,
      tags: ['dashboard-support-form'],
      siteUrl: '',
      additionalRedirectUrls: '',
      affectedServices: values.affectedServices
        .split(',')
        .map((x) => x.trim().replace(/ /g, '_').toLowerCase())
        .join(';'),
      browserInformation: detectBrowser(),
      ...(dashboardSentryIssueId && { dashboardSentryIssueId }),
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
    const prefillForm = async () => {
      if (isSuccessOrganizations) {
        if (organizations.length === 0) {
          form.setValue('organizationSlug', 'no-org')
        } else if (urlRef && urlRef !== 'no-project') {
          // Check validity of project via project details
          const selectedProject = await getProjectDetail({ ref: urlRef })
          if (!!selectedProject) {
            const org = organizations.find((x) => x.id === selectedProject.organization_id)
            if (!!org) form.setValue('organizationSlug', org.slug)
            form.setValue('projectRef', selectedProject.ref)
          }
        } else if (urlSlug) {
          if (organizations.some((it) => it.slug === urlSlug)) {
            form.setValue('organizationSlug', urlSlug)
          }
        } else if (!urlRef && !urlSlug) {
          const firstOrganization = organizations?.[0]
          if (!!firstOrganization) {
            form.setValue('organizationSlug', firstOrganization.slug)
          }
        }
      }
    }
    prefillForm()
  }, [urlRef, urlSlug, isSuccessOrganizations])

  useEffect(() => {
    if (urlCategory) {
      const validCategory = categoryOptions.find((option) => {
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

  // Sync organization selection with parent state
  // Initialized as 'no-org' in parent if no org is selected
  useEffect(() => {
    setSelectedOrganization(organizationSlug)
  }, [organizationSlug, setSelectedOrganization])

  // Sync project selection with parent state
  // Initialized as 'no-project' in parent if no project is selected
  useEffect(() => {
    setSelectedProject(projectRef)
  }, [projectRef, setSelectedProject])

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
                        {subscriptionPlanId && (
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
                        <SelectItem_Shadcn_ key={org.slug} value={org.slug}>
                          {org.name}
                        </SelectItem_Shadcn_>
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

        <div id="projectRef-field" className={cn(CONTAINER_CLASSES, 'flex flex-col gap-y-2')}>
          <FormField_Shadcn_
            name="projectRef"
            control={form.control}
            render={({ field }) => (
              <FormItemLayout hideMessage layout="vertical" label="Which project is affected?">
                <FormControl_Shadcn_>
                  <OrganizationProjectSelector
                    key={organizationSlug}
                    sameWidthAsTrigger
                    checkPosition="left"
                    slug={organizationSlug}
                    selectedRef={field.value}
                    onInitialLoad={(projects) => {
                      if (!urlRef) field.onChange(projects[0]?.ref ?? 'no-project')
                    }}
                    onSelect={(project) => field.onChange(project.ref)}
                    renderTrigger={({ isLoading, project }) => (
                      <Button
                        block
                        type="default"
                        role="combobox"
                        size="small"
                        className="justify-between"
                        iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                      >
                        {isLoading ? (
                          <ShimmeringLoader className="w-44 py-2" />
                        ) : field.value === 'no-project' ? (
                          'No specific project'
                        ) : (
                          project?.name ?? 'Unknown project'
                        )}
                      </Button>
                    )}
                    renderActions={(setOpen) => (
                      <CommandGroup_Shadcn_>
                        <CommandItem_Shadcn_
                          className="w-full gap-x-2"
                          onSelect={() => {
                            field.onChange('no-project')
                            setOpen(false)
                          }}
                        >
                          {field.value === 'no-project' && <Check size={16} />}
                          <p className={field.value !== 'no-project' ? 'ml-6' : ''}>
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

          <AnimatePresence>
            {projectRef !== 'no-project' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-x-1"
              >
                <p
                  className={cn(
                    'text-sm prose transition',
                    highlightRef ? 'text-foreground' : 'text-foreground-lighter'
                  )}
                >
                  Project ID:{' '}
                  <code
                    className={cn(
                      'transition',
                      highlightRef
                        ? 'text-brand font-medium border-brand-500 animate-pulse'
                        : 'text-foreground-light'
                    )}
                  >
                    {projectRef}
                  </code>
                </p>
                <CopyButton
                  iconOnly
                  type="text"
                  text={projectRef}
                  onClick={() => {
                    toast.success('Copied to clipboard')
                    setHighlightRef(null)
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

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
              <FormItemLayout layout="vertical" label="What are you having issues with?">
                <FormControl_Shadcn_>
                  <Select_Shadcn_
                    {...field}
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger_Shadcn_ className="w-full">
                      <SelectValue_Shadcn_ placeholder="Select an issue">
                        {field.value
                          ? categoryOptions.find((o) => o.value === field.value)?.label
                          : null}
                      </SelectValue_Shadcn_>
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectGroup_Shadcn_>
                        {categoryOptions.map((option) => (
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
            )}
          />

          <IssueSuggestion category={category} projectRef={projectRef} />

          {(severity === 'Urgent' || severity === 'High') && (
            <p className="text-sm text-foreground-light mt-2 sm:col-span-2">
              We do our best to respond to everyone as quickly as possible; however, prioritization
              will be based on production status. We ask that you reserve High and Urgent severity
              for production-impacting issues only.
            </p>
          )}
        </div>

        <Separator />

        <div className={cn(CONTAINER_CLASSES, 'flex flex-col gap-y-2')}>
          <FormField_Shadcn_
            name="subject"
            control={form.control}
            render={({ field }) => (
              <FormItemLayout layout="vertical" label="Subject">
                <FormControl_Shadcn_>
                  <Input_Shadcn_ {...field} placeholder="Summary of the problem you have" />
                </FormControl_Shadcn_>
              </FormItemLayout>
            )}
          />

          {searchState.status === 'loading' && docsResults.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-foreground-light">
              <Loader2 className="animate-spin" size={14} />
              <span>Searching for relevant resources...</span>
            </div>
          )}

          {docsResults.length > 0 && hasResults && (
            <>
              <div className="flex items-center gap-2">
                <h5 className="text-foreground-lighter">AI Suggested resources</h5>
                {searchState.status === 'loading' && (
                  <div className="flex items-center gap-2 text-xs text-foreground-light">
                    <Loader2 className="animate-spin" size={12} />
                    <span>Updating results...</span>
                  </div>
                )}
              </div>

              <ul
                className={cn(
                  'flex flex-col gap-y-0.5 transition-opacity duration-200',
                  searchState.status === 'loading' ? 'opacity-50' : 'opacity-100'
                )}
              >
                {docsResults.slice(0, 5).map((page, i) => {
                  return (
                    <li key={page.id} className="flex items-center gap-x-1">
                      {page.type === 'github-discussions' ? (
                        <Github size={16} className="text-foreground-muted" />
                      ) : (
                        <Book size={16} className="text-foreground-muted" />
                      )}
                      <a
                        href={
                          page.type === 'github-discussions' ? page.path : `${DOCS_URL}${page.path}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-foreground-light hover:text-foreground transition"
                      >
                        {page.title}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </>
          )}

          {form.getValues('subject').length > 0 && INCLUDE_DISCUSSIONS.includes(category) && (
            <p className="flex items-center gap-x-1 text-foreground-lighter text-sm">
              <span>Check our </span>
              <Link
                key="gh-discussions"
                href={`https://github.com/orgs/supabase/discussions?discussions_q=${form.getValues('subject')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-x-1 underline hover:text-foreground transition"
              >
                GitHub discussions
                <ExternalLink size={14} strokeWidth={2} />
              </Link>
              <span> for a quick answer</span>
            </p>
          )}
        </div>

        {category === 'Problem' && showClientLibraries && (
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
                      <SelectValue_Shadcn_ placeholder="Select a library" />
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      <SelectGroup_Shadcn_>
                        {CLIENT_LIBRARIES.map((option) => (
                          <SelectItem_Shadcn_ key={option.language} value={option.language}>
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

        {library && library.length > 0 && <LibrarySuggestions library={library} />}

        {category !== 'Login_issues' && category !== 'Plan_upgrade' && (
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
                    onChange={(services) => form.setValue('affectedServices', services.join(', '))}
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
              {error !== undefined && (
                <Admonition
                  showIcon={false}
                  type="default"
                  className="mt-2"
                  title="The error that you ran into will be included in your message for reference"
                  description={`Error: ${error}`}
                />
              )}
            </FormItemLayout>
          )}
        />

        <div className={cn(CONTAINER_CLASSES)}>
          <div className="flex flex-col gap-y-1">
            <p className="text-sm text-foreground-light">Attachments</p>
            <p className="text-sm text-foreground-lighter">
              Upload up to {MAX_ATTACHMENTS} screenshots that might be relevant to the issue that
              you're facing
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

        <Separator />

        {['Problem', 'Database_unresponsive', 'Performance'].includes(category) && (
          <>
            <FormField_Shadcn_
              name="allowSupportAccess"
              control={form.control}
              render={({ field }) => {
                return (
                  <FormItemLayout
                    name="allowSupportAccess"
                    className="px-6"
                    layout="flex"
                    label={
                      <div className="flex items-center gap-x-2">
                        <span className="text-foreground">
                          Allow support access to your project
                        </span>
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
                              strokeWidth={2}
                              size={14}
                              className="transition-all group-data-[state=open]:rotate-90 text-foreground-muted -ml-1"
                            />
                            <span className="text-sm">More information</span>
                          </CollapsibleTrigger_Shadcn_>
                          <CollapsibleContent_Shadcn_ className="text-sm text-foreground-light mt-2 space-y-2">
                            <p>
                              By enabling this, you grant permission for our support team to access
                              your project temporarily and, if applicable, to use AI tools to assist
                              in diagnosing and resolving issues. This access may involve analyzing
                              database configurations, query performance, and other relevant data to
                              expedite troubleshooting and enhance support accuracy.
                            </p>
                            <p>
                              We are committed to maintaining strict data privacy and security
                              standards in all support activities.{' '}
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
            <Separator />
          </>
        )}

        <div className={cn(CONTAINER_CLASSES, 'flex flex-col items-end gap-3')}>
          <Button
            htmlType="submit"
            size="large"
            block
            icon={<Mail />}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Send support request
          </Button>
          <div className="flex flex-col items-end gap-1">
            <div className="space-x-1 text-xs">
              <span className="text-foreground-light">We will contact you at</span>
              <span className="text-foreground font-medium">{respondToEmail}</span>
            </div>
            <span className="text-foreground-light text-xs">
              Please ensure emails from supabase.io are allowed
            </span>
          </div>
        </div>
      </form>
    </Form_Shadcn_>
  )
}
