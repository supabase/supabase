import { useParams } from 'common'
import { CLIENT_LIBRARIES } from 'common/constants'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import {
  Button,
  Checkbox,
  Form,
  IconAlertCircle,
  IconExternalLink,
  IconLoader,
  IconMail,
  IconPlus,
  IconX,
  Input,
  Listbox,
} from 'ui'

import Divider from 'components/ui/Divider'
import InformationBox from 'components/ui/InformationBox'
import MultiSelect from 'components/ui/MultiSelect'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { getProjectAuthConfig } from 'data/auth/auth-config-query'
import { useSendSupportTicketMutation } from 'data/feedback/support-ticket-send'
import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useFlag, useStore } from 'hooks'
import useLatest from 'hooks/misc/useLatest'
import { detectBrowser } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { Project } from 'types'
import DisabledStateForFreeTier from './DisabledStateForFreeTier'
import { CATEGORY_OPTIONS, SERVICE_OPTIONS, SEVERITY_OPTIONS } from './Support.constants'
import { formatMessage, uploadAttachments } from './SupportForm.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'

const MAX_ATTACHMENTS = 5
const INCLUDE_DISCUSSIONS = ['Problem', 'Database_unresponsive']

export interface SupportFormProps {
  setSentCategory: (value: string) => void
}

const SupportForm = ({ setSentCategory }: SupportFormProps) => {
  const { ui } = useStore()
  const { isReady } = useRouter()
  const { ref, subject, category, message } = useParams()

  const uploadButtonRef = useRef()
  const enableFreeSupport = useFlag('enableFreeSupport')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadedDataUrls, setUploadedDataUrls] = useState<string[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])

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
      ui.setNotification({ category: 'success', message: 'Support request sent. Thank you!' })
      setSentCategory(variables.category)
    },
    onError: (error) => {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to submit support ticket: ${error.message}`,
      })
      setIsSubmitting(false)
    },
  })

  const projectDefaults: Partial<Project>[] = [{ ref: 'no-project', name: 'No specific project' }]

  const projects = [...(allProjects ?? []), ...projectDefaults]
  const selectedProjectFromUrl = projects.find((project) => project.ref === ref)
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
    selectedProjectRef !== 'no-project'
      ? organizations?.find((org) => {
          const project = projects.find((project) => project.ref === selectedProjectRef)
          return org.id === project?.organization_id
        })?.slug
      : organizations?.[0]?.slug

  const { data: subscription, isLoading: isLoadingSubscription } = useOrgSubscriptionQuery({
    orgSlug: selectedOrganizationSlug,
  })

  useEffect(() => {
    if (!uploadedFiles) return
    const objectUrls = uploadedFiles.map((file) => URL.createObjectURL(file))
    setUploadedDataUrls(objectUrls)

    return () => {
      objectUrls.forEach((url: any) => URL.revokeObjectURL(url))
    }
  }, [uploadedFiles])

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

  const onFilesUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    event.persist()
    const items = event.target.files || (event as any).dataTransfer.items
    const itemsCopied = Array.prototype.map.call(items, (item) => item) as File[]
    const itemsToBeUploaded = itemsCopied.slice(0, MAX_ATTACHMENTS - uploadedFiles.length)

    setUploadedFiles(uploadedFiles.concat(itemsToBeUploaded))
    if (items.length + uploadedFiles.length > MAX_ATTACHMENTS) {
      ui.setNotification({
        category: 'info',
        message: `Only up to ${MAX_ATTACHMENTS} attachments are allowed`,
      })
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
      } finally {
      }
    }

    submitSupportTicket(payload)
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
        }, [isSuccessProjects, isSuccessOrganizations])

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
          <div className="space-y-8 w-[620px]">
            <div className="px-6">
              <h3 className="text-xl">How can we help?</h3>
            </div>
            <div className="px-6">
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
                      className="min-w-[500px]"
                    >
                      <span>{option.label}</span>
                      <span className="block text-xs opacity-50">{option.description}</span>
                    </Listbox.Option>
                  )
                })}
              </Listbox>
            </div>

            {values.category !== 'Login_issues' && (
              <div className="px-6">
                <div className="grid grid-cols-2 gap-4">
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
                        <IconAlertCircle strokeWidth={2} className="text-foreground-light" />
                        <p className="text-sm prose">Failed to retrieve projects</p>
                      </div>
                    </div>
                  )}
                  {isSuccessProjects && (
                    <Listbox
                      id="projectRef"
                      layout="vertical"
                      label="Which project is affected?"
                      onChange={(val) => {
                        setSelectedProjectRef(val)
                      }}
                    >
                      {projects.map((option) => {
                        const organization = organizations?.find(
                          (x) => x.id === option.organization_id
                        )
                        return (
                          <Listbox.Option
                            key={`option-${option.ref}`}
                            label={option.name || ''}
                            value={option.ref}
                          >
                            <span>{option.name}</span>
                            <span className="block text-xs opacity-50">{organization?.name}</span>
                          </Listbox.Option>
                        )
                      })}
                    </Listbox>
                  )}
                  <Listbox id="severity" layout="vertical" label="Severity">
                    {SEVERITY_OPTIONS.map((option: any) => {
                      return (
                        <Listbox.Option
                          key={`option-${option.value}`}
                          label={option.label}
                          value={option.value}
                        >
                          <span>{option.label}</span>
                          <span className="block text-xs opacity-50">{option.description}</span>
                        </Listbox.Option>
                      )
                    })}
                  </Listbox>
                </div>

                {values.projectRef !== 'no-project' && subscription && isSuccessProjects ? (
                  <p className="text-sm text-foreground-light mt-2">
                    This project is on the{' '}
                    <span className="text-foreground-light">{subscription.plan.name} plan</span>
                  </p>
                ) : isLoadingSubscription && selectedProjectRef !== 'no-project' ? (
                  <div className="flex items-center space-x-2 mt-2">
                    <IconLoader size={14} className="animate-spin" />
                    <p className="text-sm text-foreground-light">Checking project's plan</p>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            )}

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
                        <IconAlertCircle strokeWidth={2} className="text-foreground-light" />
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

            {subscription?.plan.id === 'free' && values.category !== 'Login_issues' && (
              <div className="px-6">
                <InformationBox
                  icon={<IconAlertCircle strokeWidth={2} />}
                  title="Expected response times are based on your project's plan"
                  description={
                    <div className="space-y-4 mb-1">
                      <p>
                        Free plan support is available within the community and officially by the
                        team on a best efforts basis, though we cannot guarantee a response time.
                        For a guaranteed response time we recommend upgrading to the Pro plan.
                        Enhanced SLAs for support are available on our Enterprise Plan.
                      </p>
                      <div className="flex items-center space-x-2">
                        <Button asChild>
                          <Link
                            href={`/org/${values.organizationSlug}/billing?panel=subscriptionPlan`}
                          >
                            Upgrade project
                          </Link>
                        </Button>
                        <Button asChild type="default" icon={<IconExternalLink size={14} />}>
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
                  }
                />
              </div>
            )}

            <Divider light />

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
                                <IconExternalLink size={14} strokeWidth={2} className="ml-1" />
                              </Link>
                              <span> for a quick answer</span>
                            </p>
                          ) : null
                        }
                      />
                    </div>
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
                                    icon={<IconExternalLink size={14} strokeWidth={1.5} />}
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
                                icon={<IconExternalLink size={14} strokeWidth={1.5} />}
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
                    <div className="text-area-text-sm px-6">
                      <Input.TextArea
                        id="message"
                        label="Message"
                        placeholder="Describe the issue you're facing, along with any relevant information. Please be as detailed and specific as possible."
                        limit={5000}
                        labelOptional="5000 character limit"
                      />
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
                              <IconX size={12} strokeWidth={2} />
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
                            <IconPlus strokeWidth={2} size={20} />
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
                          icon={<IconMail />}
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

export default observer(SupportForm)
