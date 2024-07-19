import * as Sentry from '@sentry/nextjs'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import {
  AlertCircle,
  Book,
  ChevronRight,
  ExternalLink,
  Github,
  Hash,
  HelpCircle,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'

import {
  DocsSearchResultType as PageType,
  useDocsSearch,
  useParams,
  type DocsSearchResult as Page,
  type DocsSearchResultSection as PageSection,
} from 'common'
import { CLIENT_LIBRARIES } from 'common/constants'
import InformationBox from 'components/ui/InformationBox'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { getProjectAuthConfig } from 'data/auth/auth-config-query'
import { useSendSupportTicketMutation } from 'data/feedback/support-ticket-send'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import type { Project } from 'data/projects/project-detail-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import useLatest from 'hooks/misc/useLatest'
import { useFlag } from 'hooks/ui/useFlag'
import { detectBrowser } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Checkbox,
  Form,
  Input,
  Listbox,
  Separator,
  cn,
} from 'ui'
import { useCommandMenu } from 'ui-patterns/Cmdk'
import { TextHighlighter } from 'ui-patterns/Cmdk/Command.utils'
import MultiSelect from 'ui-patterns/MultiSelectDeprecated'
import DisabledStateForFreeTier from './DisabledStateForFreeTier'
import { CATEGORY_OPTIONS, SERVICE_OPTIONS, SEVERITY_OPTIONS } from './Support.constants'
import { formatMessage, uploadAttachments } from './SupportForm.utils'

const MAX_ATTACHMENTS = 5
const INCLUDE_DISCUSSIONS = ['Problem', 'Database_unresponsive']

export interface SupportFormProps {
  setSentCategory: (value: string) => void
  setSelectedProject: (value: string) => void
}

const SupportForm = ({ setSentCategory, setSelectedProject }: SupportFormProps) => {
  const supabaseClient = useSupabaseClient()
  const {
    handleDocsSearchDebounced,
    searchState,
    searchState: state,
  } = useDocsSearch(supabaseClient)
  const [subject, setSubject] = useState('')
  const [docsResults, setDocsResults] = useState<Page[]>([])

  useEffect(() => {
    if (subject.trim().length > 0) {
      handleDocsSearchDebounced(subject.trim())
    } else {
      setDocsResults([])
    }
  }, [subject])

  useEffect(() => {
    if (subject.trim().length > 0 && searchState.status === 'fullResults') {
      setDocsResults(searchState.results)
    } else if (searchState.status === 'noResults' || searchState.status === 'error') {
      setDocsResults([])
    }
  }, [searchState])

  const { isReady } = useRouter()
  const { ref, slug, category, message } = useParams()

  const uploadButtonRef = useRef()
  const enableFreeSupport = useFlag('enableFreeSupport')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadedDataUrls, setUploadedDataUrls] = useState<string[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [textAreaValue, setTextAreaValue] = useState('')

  const {
    data: organizations,
    isLoading: isLoadingOrganizations,
    isError: isErrorOrganizations,
    isSuccess: isSuccessOrganizations,
  } = useOrganizationsQuery()
  // for use in useEffect
  const organizationsRef = useLatest(organizations)

  const {
    data: allProjects,
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
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

  const projectDefaults: Partial<Project>[] = [{ ref: 'no-project', name: 'No specific project' }]

  const projects = [...(allProjects ?? []), ...projectDefaults]
  const selectedProjectFromUrl = projects.find((project) => project.ref === ref)
  const selectedOrganizationFromUrl = organizations?.find((org) => org.slug === slug)
  const selectedCategoryFromUrl = CATEGORY_OPTIONS.find((option) => {
    if (option.value.toLowerCase() === ((category as string) ?? '').toLowerCase()) return option
  })

  const [selectedProjectRef, setSelectedProjectRef] = useState(
    selectedProjectFromUrl !== undefined
      ? selectedProjectFromUrl.ref
      : projects.length > 0
        ? projects[0].ref
        : 'no-project'
  )

  const selectedOrganizationSlug =
    selectedOrganizationFromUrl !== undefined
      ? selectedOrganizationFromUrl.slug
      : selectedProjectRef !== 'no-project'
        ? organizations?.find((org) => {
            const project = projects.find((project) => project.ref === selectedProjectRef)
            return org.id === project?.organization_id
          })?.slug
        : organizations?.[0]?.slug

  const { data: subscription, isLoading: isLoadingSubscription } = useOrgSubscriptionQuery({
    orgSlug: selectedOrganizationSlug,
  })

  const { profile } = useProfile()
  const respondToEmail = profile?.primary_email ?? 'your email'

  const initialValues = {
    category:
      selectedCategoryFromUrl !== undefined
        ? selectedCategoryFromUrl.value
        : CATEGORY_OPTIONS[0].value,
    severity: 'Low',
    projectRef: selectedProjectRef,
    organizationSlug: selectedOrganizationSlug,
    library: 'no-library',
    subject: subject ?? '',
    message: message || '',
    allowSupportAccess: false,
  }

  const { site } = useCommandMenu()
  const router = useRouter()

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

  const onValidate = (values: any) => {
    const errors: any = {}
    if (!values.subject) errors.subject = 'Please add a subject heading'
    if (!values.message) errors.message = "Please add a message about the issue that you're facing"
    if (values.category === 'Problem' && values.library === 'no-library')
      errors.library = "Please select the library that you're facing issues with"
    return errors
  }

  const onSubmit = async (values: any) => {
    setIsSubmitting(true)
    const attachments =
      uploadedFiles.length > 0 ? await uploadAttachments(values.projectRef, uploadedFiles) : []
    const selectedLibrary = CLIENT_LIBRARIES.find((library) => library.language === values.library)

    const payload = {
      ...values,
      library:
        values.category === 'Problem' && selectedLibrary !== undefined ? selectedLibrary.key : '',
      message: formatMessage(values.message, attachments),
      verified: true,
      tags: ['dashboard-support-form'],
      siteUrl: '',
      additionalRedirectUrls: '',
      affectedServices: selectedServices
        .map((service) => service.replace(/ /g, '_').toLowerCase())
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

  const handleTextMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextAreaValue(event.target.value)
  }

  const ipv4MigrationStrings = [
    'ipv4',
    'ipv6',
    'supavisor',
    'pgbouncer',
    '5432',
    'ENETUNREACH',
    'ECONNREFUSED',
    'P1001',
    'connect: no route to',
    'network is unreac',
    'could not translate host name',
    'address family not supported by protocol',
  ]

  const ipv4MigrationStringMatched = ipv4MigrationStrings.some((str) => textAreaValue.includes(str))
  const hasResults =
    state.status === 'fullResults' ||
    state.status === 'partialResults' ||
    (state.status === 'loading' && state.staleResults.length > 0)

  useEffect(() => {
    if (!uploadedFiles) return
    const objectUrls = uploadedFiles.map((file) => URL.createObjectURL(file))
    setUploadedDataUrls(objectUrls)

    return () => {
      objectUrls.forEach((url: any) => URL.revokeObjectURL(url))
    }
  }, [uploadedFiles])

  useEffect(() => {
    if (isSuccessProjects && ref !== undefined) {
      const selectedProjectFromUrl = projects.find((project) => project.ref === ref)
      if (selectedProjectFromUrl !== undefined) setSelectedProjectRef(selectedProjectFromUrl.ref)
    }
  }, [isSuccessProjects])

  const IconContainer = (
    props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
  ) => (
    <div
      className="
        transition
        w-6 h-6
        bg-alternative
        group-aria-selected:scale-[105%]
        group-aria-selected:bg-foreground
        text-foreground
        group-aria-selected:text-background
        rounded flex
        items-center
        justify-center

        group-aria-selected:[&_svg]:scale-[103%]
        "
      {...props}
    />
  )

  function generateLink(pageType: PageType, link: string): string {
    switch (pageType) {
      case PageType.Markdown:
      case PageType.Reference:
        if (site === 'docs') {
          return link
        } else if (site === 'website') {
          return `/docs${link}`
        } else {
          return `https://supabase.com/docs${link}`
        }
      case PageType.Integration:
        if (site === 'website') {
          return link
        } else {
          return `https://supabase.com${link}`
        }
      case PageType.GithubDiscussion:
        return link
      default:
        throw new Error(`Unknown page type '${pageType}'`)
    }
  }

  async function handleLinkClick(pageType: PageType, link: string) {
    switch (pageType) {
      case PageType.Markdown:
      case PageType.Reference:
        if (site === 'docs') {
          await router.push(link)
        } else if (site === 'website') {
          await router.push(`/docs${link}`)
        } else {
          window.open(`https://supabase.com/docs${link}`, '_blank')
        }
        break
      case PageType.Integration:
        if (site === 'website') {
          router.push(link)
        } else {
          window.open(`https://supabase.com${link}`, '_blank')
        }
        break
      case PageType.GithubDiscussion:
        window.open(link, '_blank')
        break
      default:
        throw new Error(`Unknown page type '${pageType}'`)
    }
  }

  function formatSectionUrl(page: Page, section: PageSection): string {
    switch (page.type) {
      case PageType.Markdown:
      case PageType.GithubDiscussion:
        return `${generateLink(page.type, page.path)}#${section.slug ?? ''}`
      case PageType.Reference:
        return `${generateLink(page.type, page.path)}/${section.slug ?? ''}`
      case PageType.Integration:
        return generateLink(page.type, page.path) // Assuming no section slug for Integration pages
      default:
        throw new Error(`Unknown page type '${page.type}'`)
    }
  }

  const cardBaseClasses =
    'bg-200 rounded-lg hover:bg-surface-200 p-3 transition-colors hover:border-overlay hover:shadow-sm flex items-center justify-between'

  interface DocsLinkGroup {
    page: Page
  }

  const DocsLinkGroup = ({ page }: DocsLinkGroup) => {
    console.log('page', page)
    const link = generateLink(page.type, page.path)

    return (
      <ul key={page.id} className="grid gap-2">
        <li key={`${page.path}-group`} className="p-2 mb-2">
          <Link
            target="_blank"
            rel="noreferrer"
            href={link}
            className={cn(cardBaseClasses, 'flex items-center justify-between pr-5')}
          >
            <div className="grow flex gap-3 items-center">
              <div>{getPageIcon(page)}</div>
              <div className="flex flex-col gap-0 pr-6">
                <span className="text-sm">
                  <TextHighlighter text={page.title} query="test" />
                </span>
                {(page.description || page.subtitle) && (
                  <div className="text-xs text">
                    <TextHighlighter text={page.description || page.subtitle || ''} query="test" />
                  </div>
                )}
              </div>
            </div>
            <ChevronRight size={18} />
          </Link>
          {page.sections.length > 0 && (
            <ul className="border-l border-default ml-3 pt-3 grid gap-2">
              {page.sections.map((section: PageSection, i) => (
                <DocsLinkSection
                  key={`${page.path}__${section.heading}-item-${i}`}
                  page={page}
                  section={section}
                />
              ))}
            </ul>
          )}
        </li>
      </ul>
    )
  }

  interface DocsLinkSection {
    page: Page
    section: PageSection
  }

  const DocsLinkSection = ({ page, section }: DocsLinkSection) => {
    const sectionLink = formatSectionUrl(page, section)

    return (
      <ul key={`${section.heading}-group`} className="grid gap-2">
        <li key={`${section.heading}-item`} className="p-2 mb-2">
          <Link target="_blank" href={sectionLink} className={cn(cardBaseClasses)}>
            <div className="grow flex gap-3 items-center">
              <div>{getPageIcon(page)}</div>
              <div className="grid gap-1.5">
                {page.type !== 'github-discussions' && (
                  <span>
                    <TextHighlighter
                      className="not-italic text-xs rounded-full px-3 py-1 bg-surface-300 "
                      text={section.heading}
                      query="test"
                    />
                  </span>
                )}

                {section.heading && (
                  <div className="text text-xs ">
                    <TextHighlighter text={section.heading} query="test" />
                  </div>
                )}
              </div>
            </div>
            <ChevronRight size={18} />
          </Link>
        </li>
      </ul>
    )
  }

  return (
    <Form id="support-form" initialValues={initialValues} validate={onValidate} onSubmit={onSubmit}>
      {({ resetForm, values }: any) => {
        const selectedCategory = CATEGORY_OPTIONS.find(
          (category) => category.value === values.category
        )
        const selectedLibrary = CLIENT_LIBRARIES.find(
          (library) => library.language === values.library
        )
        const selectedClientLibraries = selectedLibrary?.libraries.filter((library) =>
          library.name.includes('supabase-')
        )

        const selectedProject = projects.find((project) => project.ref === values.projectRef)
        const isFreeProject = (subscription?.plan.id ?? 'free') === 'free'

        const isDisabled =
          !enableFreeSupport &&
          isFreeProject &&
          ['Performance', 'Problem'].includes(values.category)

        // [Alaister] although this "technically" is breaking the rules of React hooks
        // it won't error because the hooks are always rendered in the same order
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (values.projectRef === 'no-project') {
            const updatedValues = {
              ...values,
              organizationSlug: organizationsRef.current?.[0]?.slug,
            }
            resetForm({ values: updatedValues, initialValues: updatedValues })
          } else if (selectedProject) {
            const organization = organizationsRef.current?.find(
              (org) => org.id === selectedProject.organization_id
            )
            if (organization) {
              const updatedValues = { ...values, organizationSlug: organization.slug }
              resetForm({ values: updatedValues, initialValues: updatedValues })
            }
          }
        }, [values.projectRef])

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (
            isSuccessProjects &&
            isSuccessOrganizations &&
            allProjects.length > 0 &&
            organizations.length > 0
          ) {
            const updatedValues = {
              ...values,
              projectRef: selectedProjectRef,
              organizationSlug: selectedOrganizationSlug,
            }
            resetForm({ values: updatedValues, initialValues: updatedValues })
          }
        }, [
          isSuccessProjects,
          isSuccessOrganizations,
          selectedProjectRef,
          selectedOrganizationSlug,
        ])

        // Populate fields when router is ready, required when navigating to
        // support form on a refresh browser session
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useEffect(() => {
          if (isReady) {
            const updatedValues = {
              ...initialValues,
              projectRef: ref ?? initialValues.projectRef,
              subject: subject ?? initialValues.subject,
              category: selectedCategoryFromUrl?.value ?? initialValues.category,
              message: message ?? initialValues.message,
            }
            resetForm({ values: updatedValues, initialValues: updatedValues })
          }
        }, [isReady])

        return (
          <div className="space-y-8 max-w-[620px] overflow-hidden">
            <div className="px-6">
              <h3 className="text-xl">How can we help?</h3>
            </div>

            {isSuccessProjects &&
              values.projectRef === 'no-project' &&
              values.category !== 'Login_issues' && (
                <div className="px-6">
                  {isLoadingOrganizations && (
                    <div className="space-y-2">
                      <p className="text-sm prose">Which organization is affected?</p>
                      <ShimmeringLoader className="!py-[19px]" />
                    </div>
                  )}
                  {isErrorOrganizations && (
                    <div className="space-y-2">
                      <p className="text-sm prose">Which organization is affected?</p>
                      <div className="border rounded-md px-4 py-2 flex items-center space-x-2">
                        <AlertCircle size={16} strokeWidth={2} className="text-foreground-light" />
                        <p className="text-sm prose">Failed to retrieve organizations</p>
                      </div>
                    </div>
                  )}
                  {isSuccessOrganizations && (
                    <Listbox
                      id="organizationSlug"
                      layout="vertical"
                      label="Which organization is affected?"
                    >
                      {organizations?.map((option) => {
                        return (
                          <Listbox.Option
                            key={`option-${option.slug}`}
                            label={option.name || ''}
                            value={option.slug}
                          >
                            <span>{option.name}</span>
                          </Listbox.Option>
                        )
                      })}
                    </Listbox>
                  )}
                </div>
              )}

            {isLoadingProjects && (
              <div className="space-y-2">
                <p className="text-sm prose">Which project is affected?</p>
                <ShimmeringLoader className="!py-[19px]" />
              </div>
            )}
            {isErrorProjects && (
              <div className="space-y-2">
                <p className="text-sm prose">Which project is affected?</p>
                <div className="border rounded-md px-4 py-2 flex items-center space-x-2">
                  <HelpCircle strokeWidth={2} className="text-foreground-light" />
                  <p className="text-sm prose">Failed to retrieve projects</p>
                </div>
              </div>
            )}
            {isSuccessProjects && (
              <div className="px-6">
                <Listbox
                  id="projectRef"
                  layout="vertical"
                  label="Which project is affected?"
                  onChange={(val) => {
                    setSelectedProjectRef(val)
                  }}
                  className="w-full"
                >
                  {projects.map((option) => {
                    const organization = organizations?.find((x) => x.id === option.organization_id)
                    return (
                      <Listbox.Option
                        key={`option-${option.ref}`}
                        label={option.name || ''}
                        value={option.ref}
                        className="w-full"
                      >
                        <span>{option.name}</span>
                        <span className="block text-xs opacity-50">{organization?.name}</span>
                      </Listbox.Option>
                    )
                  })}
                </Listbox>
                {values.projectRef !== 'no-project' && subscription && isSuccessProjects ? (
                  <p className="text-sm text-foreground-light mt-2">
                    This project is on the{' '}
                    <span className="text-foreground-light">{subscription.plan.name} plan</span>
                  </p>
                ) : isLoadingSubscription && selectedProjectRef !== 'no-project' ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <Loader2 size={14} className="animate-spin" />
                    <p className="text-sm text-foreground-light">Checking project's plan</p>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            )}

            {subscription?.plan.id !== 'enterprise' && values.category !== 'Login_issues' && (
              <div className="px-6">
                <InformationBox
                  icon={<AlertCircle size={18} strokeWidth={2} />}
                  defaultVisibility={true}
                  hideCollapse={true}
                  title={
                    selectedProjectRef === 'no-project'
                      ? 'Please note that no project has been selected'
                      : "Expected response times are based on your project's plan"
                  }
                  {...(selectedProjectRef !== 'no-project' && {
                    description: (
                      <div className="space-y-4 mb-1">
                        {subscription?.plan.id === 'free' && (
                          <p>
                            Free Plan support is available within the community and officially by
                            the team on a best efforts basis. For a guaranteed response we recommend
                            upgrading to the Pro Plan. Enhanced SLAs for support are available on
                            our Enterprise Plan.
                          </p>
                        )}

                        {subscription?.plan.id === 'pro' && (
                          <p>
                            Pro Plan includes email-based support. You can expect an answer within 1
                            business day in most situations for all severities. We recommend
                            upgrading to the Team Plan for prioritized ticketing on all issues and
                            prioritized escalation to product engineering teams. Enhanced SLAs for
                            support are available on our Enterprise Plan.
                          </p>
                        )}

                        {subscription?.plan.id === 'team' && (
                          <p>
                            Team Plan includes email-based support. You get prioritized ticketing on
                            all issues and prioritized escalation to product engineering teams. Low,
                            Normal, and High severity tickets will generally be handled within 1
                            business day, while Urgent issues, we respond within 1 day, 365 days a
                            year. Enhanced SLAs for support are available on our Enterprise Plan.
                          </p>
                        )}

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-y-2 sm:gap-x-2">
                          <Button asChild>
                            <Link
                              href={`/org/${values.organizationSlug}/billing?panel=subscriptionPlan`}
                            >
                              Upgrade project
                            </Link>
                          </Button>
                          <Button asChild type="default" icon={<ExternalLink size={14} />}>
                            <Link
                              href="https://supabase.com/contact/enterprise"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Enquire about Enterprise
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ),
                  })}
                />
              </div>
            )}

            {values.category !== 'Login_issues' && (
              <div className="px-6">
                <div className="grid sm:grid-cols-2 sm:grid-rows-1 gap-4 grid-cols-1 grid-rows-2">
                  <Listbox
                    id="category"
                    layout="vertical"
                    label="What area are you having problems with?"
                  >
                    {CATEGORY_OPTIONS.map((option, i) => {
                      return (
                        <Listbox.Option
                          key={`option-${option.value}`}
                          label={option.label}
                          value={option.value}
                          className="min-w-[50px] !w-72"
                        >
                          <span>{option.label}</span>
                          <span className="block text-xs opacity-50">{option.description}</span>
                        </Listbox.Option>
                      )
                    })}
                  </Listbox>
                  <Listbox id="severity" layout="vertical" label="Severity">
                    {SEVERITY_OPTIONS.map((option: any) => {
                      return (
                        <Listbox.Option
                          key={`option-${option.value}`}
                          label={option.label}
                          value={option.value}
                          className="!w-72"
                        >
                          <span>{option.label}</span>
                          <span className="block text-xs opacity-50">{option.description}</span>
                        </Listbox.Option>
                      )
                    })}
                  </Listbox>
                </div>
                {(values.severity === 'Urgent' || values.severity === 'High') && (
                  <p className="text-sm text-foreground-light mt-2">
                    We do our best to respond to everyone as quickly as possible; however,
                    prioritization will be based on production status. We ask that you reserve High
                    and Urgent severity for production-impacting issues only.
                  </p>
                )}
              </div>
            )}

            <Separator />

            {!isDisabled ? (
              <>
                {['Performance'].includes(values.category) && isFreeProject ? (
                  <DisabledStateForFreeTier
                    category={selectedCategory?.label ?? ''}
                    organizationSlug={selectedOrganizationSlug ?? ''}
                  />
                ) : (
                  <>
                    <div className="px-6">
                      <Input
                        id="subject"
                        label="Subject"
                        placeholder="Summary of the problem you have"
                        onChange={(e) => setSubject(e.target.value)}
                        descriptionText={
                          values.subject.length > 0 &&
                          INCLUDE_DISCUSSIONS.includes(values.category) ? (
                            <p className="flex items-center space-x-1">
                              <span>Check our </span>
                              <Link
                                key="gh-discussions"
                                href={`https://github.com/orgs/supabase/discussions?discussions_q=${values.subject}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center space-x-2 text-foreground-light underline hover:text-foreground transition"
                              >
                                Github discussions
                                <ExternalLink size={14} strokeWidth={2} className="ml-1" />
                              </Link>
                              <span> for a quick answer</span>
                            </p>
                          ) : null
                        }
                      />
                    </div>

                    {docsResults.length > 0 && hasResults && (
                      <div className="py-4 px-6 border rounded-md mx-6">
                        <h2 className="text-sm text-foreground-light px-2 mb-2">
                          Suggested resources
                        </h2>
                        {docsResults.slice(0, 5).map((page, i) => (
                          <DocsLinkGroup key={`${page.id}-group`} page={page} />
                        ))}
                      </div>
                    )}

                    {values.category === 'Problem' && (
                      <div className="px-6">
                        <Listbox
                          id="library"
                          layout="vertical"
                          label="Which library are you having issues with?"
                        >
                          <Listbox.Option
                            disabled
                            label="Please select a library"
                            value="no-library"
                            className="min-w-[500px]"
                          >
                            <span>Please select a library</span>
                          </Listbox.Option>
                          {CLIENT_LIBRARIES.map((option, i) => {
                            return (
                              <Listbox.Option
                                key={`option-${option.key}`}
                                label={option.language}
                                value={option.language}
                                className="min-w-[500px]"
                              >
                                <span>{option.language}</span>
                              </Listbox.Option>
                            )
                          })}
                        </Listbox>
                      </div>
                    )}

                    {selectedLibrary !== undefined && (
                      <div className="px-6 space-y-4 !mt-4">
                        <div className="space-y-2">
                          <p className="text-sm text-foreground-light">
                            Found an issue or a bug? Try searching our Github issues or submit a new
                            one.
                          </p>
                        </div>
                        <div className="flex items-center space-x-4 overflow-x-auto">
                          {selectedClientLibraries?.map((library) => {
                            const libraryLanguage =
                              values.library === 'Dart (Flutter)'
                                ? library.name.split('-')[1]
                                : values.library
                            return (
                              <div
                                key={library.name}
                                className="w-[230px] min-w-[230px] min-h-[128px] rounded border border-control bg-surface-100 space-y-3 px-4 py-3"
                              >
                                <div className="space-y-1">
                                  <p className="text-sm">{library.name}</p>
                                  <p className="text-sm text-foreground-light">
                                    For issues regarding the {libraryLanguage} client library
                                  </p>
                                </div>
                                <div>
                                  <Button
                                    asChild
                                    type="default"
                                    icon={<ExternalLink size={14} strokeWidth={1.5} />}
                                  >
                                    <Link href={library.url} target="_blank" rel="noreferrer">
                                      View Github issues
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                          <div
                            className={[
                              'px-4 py-3 rounded border border-control bg-surface-100',
                              'w-[230px] min-w-[230px] min-h-[128px] flex flex-col justify-between space-y-3',
                            ].join(' ')}
                          >
                            <div className="space-y-1">
                              <p className="text-sm">supabase</p>
                              <p className="text-sm text-foreground-light">
                                For any issues about our API
                              </p>
                            </div>
                            <div>
                              <Button
                                asChild
                                type="default"
                                icon={<ExternalLink size={14} strokeWidth={1.5} />}
                              >
                                <Link
                                  href="https://github.com/supabase/supabase"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  View Github issues
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {values.category !== 'Login_issues' && (
                      <div className="px-6 space-y-2">
                        <p className="text-sm text-foreground-light">
                          Which services are affected?
                        </p>
                        <MultiSelect
                          options={SERVICE_OPTIONS}
                          value={selectedServices}
                          placeholder="No particular service"
                          searchPlaceholder="Search for a service"
                          onChange={setSelectedServices}
                        />
                      </div>
                    )}
                    <div className="text-area-text-sm px-6 grid gap-4">
                      <Input.TextArea
                        id="message"
                        label="Message"
                        placeholder="Describe the issue you're facing, along with any relevant information. Please be as detailed and specific as possible."
                        limit={5000}
                        labelOptional="5000 character limit"
                        value={textAreaValue}
                        onChange={(e) => handleTextMessageChange(e)}
                      />
                      {ipv4MigrationStringMatched && (
                        <Alert_Shadcn_ variant="default">
                          <HelpCircle strokeWidth={2} />
                          <AlertTitle_Shadcn_>Connection issues?</AlertTitle_Shadcn_>
                          <AlertDescription_Shadcn_ className="grid gap-3">
                            <p>
                              Having trouble connecting to your project? It could be related to our
                              migration from PGBouncer and IPv4.
                            </p>
                            <p>
                              Please review this GitHub discussion. It's up to date and covers many
                              frequently asked questions.
                            </p>
                            <p>
                              <Button
                                asChild
                                type="default"
                                icon={<ExternalLink strokeWidth={1.5} />}
                              >
                                <Link
                                  href="https://github.com/orgs/supabase/discussions/17817"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  PGBouncer and IPv4 Deprecation #17817
                                </Link>
                              </Button>
                            </p>
                          </AlertDescription_Shadcn_>
                        </Alert_Shadcn_>
                      )}
                    </div>
                    {['Problem', 'Database_unresponsive', 'Performance'].includes(
                      values.category
                    ) && (
                      <div className="px-6">
                        <Checkbox
                          name="allowSupportAccess"
                          label="Allow Supabase Support to access your project temporarily"
                          description="In some cases, we may require temporary access to your project to complete troubleshooting, or to answer questions related specifically to your project"
                        />
                      </div>
                    )}
                    <div className="space-y-4 px-6">
                      <div className="space-y-1">
                        <p className="block text-sm text-foreground-light">Attachments</p>
                        <p className="block text-sm text-foreground-light">
                          Upload up to {MAX_ATTACHMENTS} screenshots that might be relevant to the
                          issue that you're facing
                        </p>
                      </div>
                      <div>
                        <input
                          multiple
                          type="file"
                          // @ts-ignore
                          ref={uploadButtonRef}
                          className="hidden"
                          accept="image/png, image/jpeg"
                          onChange={onFilesUpload}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
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
                    <div className="px-6">
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
              </>
            ) : (
              <></>
            )}
          </div>
        )
      }}
    </Form>
  )
}

export default SupportForm

export function getPageIcon(page: Page) {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.Reference:
    case PageType.Integration:
      return <Book strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    case PageType.GithubDiscussion:
      return <Github strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}

export function getPageSectionIcon(page: Page) {
  switch (page.type) {
    case PageType.Markdown:
    case PageType.Reference:
    case PageType.Integration:
      return <Hash strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    case PageType.GithubDiscussion:
      return <MessageSquare strokeWidth={1.5} className="!mr-0 !w-4 !h-4" />
    default:
      throw new Error(`Unknown page type '${page.type}'`)
  }
}
