import { zodResolver } from '@hookform/resolvers/zod'
import * as Sentry from '@sentry/nextjs'
import { Book, ChevronRight, ExternalLink, Github, Loader2, Mail, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'

import { useDocsSearch, useParams, type DocsSearchResult as Page } from 'common'
import { CLIENT_LIBRARIES } from 'common/constants'
import { getProjectAuthConfig } from 'data/auth/auth-config-query'
import { useSendSupportTicketMutation } from 'data/feedback/support-ticket-send'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import type { Project } from 'data/projects/project-detail-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { detectBrowser } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import {
  Badge,
  Button,
  cn,
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
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
import { IPV4SuggestionAlert } from './IPV4SuggestionAlert'
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

interface SupportFormV2Props {
  onProjectSelected: (value: string) => void
  onOrganizationSelected: (value: string) => void
  setSentCategory: (value: string) => void
}

// [Joshen] Just naming it as V2 for now for PR review purposes so its easier to view
// This is a rewrite of the old SupportForm to use the new form components
export const SupportFormV2 = ({
  onProjectSelected: setSelectedProject,
  onOrganizationSelected: setSelectedOrganization,
  setSentCategory,
}: SupportFormV2Props) => {
  const { profile } = useProfile()
  const {
    projectRef: ref,
    slug,
    category: urlCategory,
    subject: urlSubject,
    message: urlMessage,
    error,
  } = useParams()

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
    allowSupportAccess: true,
  }

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
  const {
    data: allProjects,
    isLoading: isLoadingProjects,
    isSuccess: isSuccessProjects,
  } = useProjectsQuery()
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
        if (organizations.some((it) => it.slug === slug)) {
          form.setValue('organizationSlug', slug)
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
                          <SelectItem_Shadcn_ key={project.ref} value={project.ref as string}>
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
                          page.type === 'github-discussions'
                            ? page.path
                            : `https://supabase.com/docs${page.path}`
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
                Github discussions
                <ExternalLink size={14} strokeWidth={2} />
              </Link>
              <span> for a quick answer</span>
            </p>
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
