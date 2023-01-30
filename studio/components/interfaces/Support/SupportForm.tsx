import { useRouter } from 'next/router'
import { useEffect, useState, FC, ChangeEvent, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import {
  Button,
  IconMail,
  IconPlus,
  IconX,
  Input,
  Listbox,
  Form,
  IconLoader,
  IconAlertCircle,
  IconExternalLink,
  Checkbox,
} from 'ui'
import { CLIENT_LIBRARIES } from 'common/constants'

import { Organization, Project } from 'types'
import { useStore, useFlag } from 'hooks'
import { post, get } from 'lib/common/fetch'
import { API_URL, PRICING_TIER_PRODUCT_IDS } from 'lib/constants'

import Divider from 'components/ui/Divider'
import Connecting from 'components/ui/Loading'
import MultiSelect from 'components/ui/MultiSelect'
import { formatMessage, uploadAttachments } from './SupportForm.utils'
import { CATEGORY_OPTIONS, SEVERITY_OPTIONS, SERVICE_OPTIONS } from './Support.constants'
import DisabledStateForFreeTier from './DisabledStateForFreeTier'
import InformationBox from 'components/ui/InformationBox'
import Link from 'next/link'

const MAX_ATTACHMENTS = 5

interface Props {
  setSentCategory: (value: string) => void
}

const SupportForm: FC<Props> = ({ setSentCategory }) => {
  const { ui, app } = useStore()
  const router = useRouter()
  const { ref, subject, category } = router.query

  const uploadButtonRef = useRef()
  const enableFreeSupport = useFlag('enableFreeSupport')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadedDataUrls, setUploadedDataUrls] = useState<string[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  // Get all orgs and projects from global store
  const sortedOrganizations = app.organizations.list()
  const sortedProjects = app.projects.list()

  const isInitialized = app.projects.isInitialized
  const projectDefaults: Partial<Project>[] = [{ ref: 'no-project', name: 'No specific project' }]

  const projects = [...sortedProjects, ...projectDefaults]

  const planNames = {
    [PRICING_TIER_PRODUCT_IDS.FREE]: 'Free',
    [PRICING_TIER_PRODUCT_IDS.PRO]: 'Pro',
    [PRICING_TIER_PRODUCT_IDS.PAYG]: 'Pro',
    [PRICING_TIER_PRODUCT_IDS.TEAM]: 'Team',
    [PRICING_TIER_PRODUCT_IDS.ENTERPRISE]: 'Enterprise',
  }

  useEffect(() => {
    if (!uploadedFiles) return
    const objectUrls = uploadedFiles.map((file) => URL.createObjectURL(file))
    setUploadedDataUrls(objectUrls)

    return () => {
      objectUrls.forEach((url: any) => URL.revokeObjectURL(url))
    }
  }, [uploadedFiles])

  if (!isInitialized) {
    return (
      <div className="w-[622px] py-48">
        <Connecting />
      </div>
    )
  }

  const selectedProject = sortedProjects.find((project) => project.ref === ref)
  const selectedCategory = CATEGORY_OPTIONS.find((option) => {
    if (option.value.toLowerCase() === ((category as string) ?? '').toLowerCase()) return option
  })

  const initialProjectRef =
    selectedProject !== undefined
      ? selectedProject.ref
      : sortedProjects.length > 0
      ? sortedProjects[0].ref
      : 'no-project'
  const initialOrganizationSlug =
    initialProjectRef !== 'no-project'
      ? sortedOrganizations.find((org) => {
          const project = sortedProjects.find((project) => project.ref === initialProjectRef)
          return org.id === project?.organization_id
        })?.slug
      : sortedOrganizations[0]?.slug
  const initialValues = {
    category: selectedCategory !== undefined ? selectedCategory.value : CATEGORY_OPTIONS[0].value,
    severity: 'Low',
    projectRef: initialProjectRef,
    organizationSlug: initialOrganizationSlug,
    library: 'no-library',
    subject: subject ?? '',
    message: '',
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

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    setSubmitting(true)
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
    }

    if (values.projectRef !== 'no-project') {
      const URL = `${API_URL}/auth/${values.projectRef}/config`
      const authConfig = await get(URL)
      if (!authConfig.error) {
        payload.siteUrl = authConfig.SITE_URL
        payload.additionalRedirectUrls = authConfig.URI_ALLOW_LIST
      }
    }

    const response = await post(`${API_URL}/feedback/send`, payload)
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Failed to submit support ticket: ${response.error.message}`,
      })
      setSubmitting(false)
    } else {
      ui.setNotification({ category: 'success', message: 'Support request sent. Thank you!' })
      setSentCategory(values.category)
    }
  }

  return (
    <Form id="support-form" initialValues={initialValues} validate={onValidate} onSubmit={onSubmit}>
      {({ isSubmitting, resetForm, values }: any) => {
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
        const isFreeProject =
          (selectedProject?.subscription_tier ?? PRICING_TIER_PRODUCT_IDS.FREE) ===
          PRICING_TIER_PRODUCT_IDS.FREE
        const isDisabled =
          !enableFreeSupport &&
          isFreeProject &&
          ['Performance', 'Problem'].includes(values.category)

        useEffect(() => {
          if (values.projectRef === 'no-project') {
            const updatedValues = { ...values, organizationSlug: sortedOrganizations[0]?.slug }
            resetForm({ values: updatedValues, initialValues: updatedValues })
          } else if (selectedProject) {
            if (!selectedProject.subscription_tier) {
              app.projects.fetchSubscriptionTier(selectedProject as Project)
            }
            const organization = sortedOrganizations.find(
              (org) => org.id === selectedProject.organization_id
            )
            if (organization) {
              const updatedValues = { ...values, organizationSlug: organization.slug }
              resetForm({ values: updatedValues, initialValues: updatedValues })
            }
          }
        }, [values.projectRef])

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

            <div className="px-6">
              <div className="grid grid-cols-2 gap-4">
                <Listbox id="projectRef" layout="vertical" label="Which project is affected?">
                  {projects.map((option) => {
                    const organization = sortedOrganizations.find(
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
                <Listbox id="severity" layout="vertical" label="Severity">
                  {SEVERITY_OPTIONS.map((option: any) => {
                    return (
                      <Listbox.Option
                        key={`option-${option.value}`}
                        label={option.label}
                        value={option.value}
                        disabled={option.value === 'Critical' && isFreeProject}
                      >
                        <span>{option.label}</span>
                        <span className="block text-xs opacity-50">{option.description}</span>
                      </Listbox.Option>
                    )
                  })}
                </Listbox>
              </div>
              {selectedProject?.subscription_tier ? (
                <p className="text-sm text-scale-1000 mt-2">
                  This project is on the{' '}
                  <span className="text-scale-1100">
                    {planNames[selectedProject?.subscription_tier]} tier
                  </span>
                </p>
              ) : selectedProject?.ref !== 'no-project' ? (
                <div className="flex items-center space-x-2 mt-2">
                  <IconLoader size={14} className="animate-spin" />
                  <p className="text-sm text-scale-1000">Checking project's tier</p>
                </div>
              ) : (
                <></>
              )}
            </div>

            {values.projectRef === 'no-project' && sortedOrganizations.length > 0 && (
              <div className="px-6">
                <Listbox
                  id="organizationSlug"
                  layout="vertical"
                  label="Which organization is affected?"
                >
                  {sortedOrganizations.map((option) => {
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
              </div>
            )}

            {selectedProject?.subscription_tier === PRICING_TIER_PRODUCT_IDS.FREE && (
              <div className="px-6">
                <InformationBox
                  icon={<IconAlertCircle strokeWidth={2} />}
                  title="Expected response times are based on your project's tier"
                  description={
                    <div className="space-y-4 mb-1">
                      <p>
                        Free tier support is available within the community and officially by the
                        team on a best efforts basis, though we cannot guarantee a response time.
                        For a guaranteed response time we recommend upgrading to the Pro tier.
                        Enhanced SLAs for support are available on our Enterprise Tier.
                      </p>
                      <div className="flex items-center space-x-2">
                        <Link href={`/project/${values.projectRef}/settings/billing/update`}>
                          <a>
                            <Button>Upgrade project</Button>
                          </a>
                        </Link>
                        <Link href="https://supabase.com/contact/enterprise">
                          <a target="_blank">
                            <Button type="default" icon={<IconExternalLink size={14} />}>
                              Enquire about Enterprise
                            </Button>
                          </a>
                        </Link>
                      </div>
                    </div>
                  }
                />
              </div>
            )}

            <Divider light />

            {/* {values.category === 'Problem' && (
              <>
                <ClientLibrariesGuidance />
                <Divider light />
              </>
            )} */}

            {!isDisabled ? (
              <>
                {['Performance'].includes(values.category) ? (
                  <DisabledStateForFreeTier
                    category={selectedCategory?.label ?? ''}
                    projectRef={values.projectRef}
                  />
                ) : (
                  <>
                    <div className="px-6">
                      <Input
                        id="subject"
                        label="Subject"
                        placeholder="Summary of the problem you have"
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
                          <p className="text-sm text-scale-1100">
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
                                className="w-[230px] min-w-[230px] min-h-[128px] rounded border border-scale-600 bg-scale-300 space-y-3 px-4 py-3"
                              >
                                <div className="space-y-1">
                                  <p className="text-sm">{library.name}</p>
                                  <p className="text-sm text-scale-1100">
                                    For issues regarding the {libraryLanguage} client library
                                  </p>
                                </div>
                                <div>
                                  <Link href={library.url}>
                                    <a target="_blank">
                                      <Button
                                        type="default"
                                        icon={<IconExternalLink size={14} strokeWidth={1.5} />}
                                      >
                                        View Github issues
                                      </Button>
                                    </a>
                                  </Link>
                                </div>
                              </div>
                            )
                          })}
                          <div
                            className={[
                              'px-4 py-3 rounded border border-scale-600 bg-scale-300',
                              'w-[230px] min-w-[230px] min-h-[128px] flex flex-col justify-between space-y-3',
                            ].join(' ')}
                          >
                            <div className="space-y-1">
                              <p className="text-sm">supabase</p>
                              <p className="text-sm text-scale-1100">
                                For any issues about our API
                              </p>
                            </div>
                            <div>
                              <Link href="https://github.com/supabase/supabase">
                                <a target="_blank">
                                  <Button
                                    type="default"
                                    icon={<IconExternalLink size={14} strokeWidth={1.5} />}
                                  >
                                    View Github issues
                                  </Button>
                                </a>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="px-6 space-y-2">
                      <p className="text-sm text-scale-1100">Which services are affected?</p>
                      <MultiSelect
                        options={SERVICE_OPTIONS}
                        value={selectedServices}
                        placeholder="No particular service"
                        searchPlaceholder="Search for a service"
                        onChange={setSelectedServices}
                      />
                    </div>
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
                        <p className="block text-sm text-scale-1100">Attachments</p>
                        <p className="block text-sm text-scale-1000">
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
                              'border border-scale-800 opacity-50 transition hover:opacity-100',
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
