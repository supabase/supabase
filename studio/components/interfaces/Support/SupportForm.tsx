import { useRouter } from 'next/router'
import { useEffect, useState, FC, ChangeEvent, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, IconMail, IconPlus, IconX, Input, Listbox, Form, IconLoader } from 'ui'

import { Project } from 'types'
import { useStore, useFlag } from 'hooks'
import { post, get } from 'lib/common/fetch'
import { API_URL, PRICING_TIER_PRODUCT_IDS } from 'lib/constants'

import Divider from 'components/ui/Divider'
import Connecting from 'components/ui/Loading'
import MultiSelect from 'components/ui/MultiSelect'
import { formatMessage, uploadAttachments } from './SupportForm.utils'
import { CATEGORY_OPTIONS, SEVERITY_OPTIONS, SERVICE_OPTIONS } from './Support.constants'
import DisabledStateForFreeTier from './DisabledStateForFreeTier'
import BestPracticesGuidance from './BestPracticesGuidance'
import ClientLibrariesGuidance from './ClientLibrariesGuidance'

const MAX_ATTACHMENTS = 5

// [Joshen] Note to self - need to double check that this will work with the actual ticket submission to Hubspot too
// Remaining
// - [x] Github issues link for problems
// - [x] Github discussions/discord link for best practices
// - Improve success state of submission
// - Integrate with API and Hubspot
// Do a screen grab, get approval from Ant/Jonny

interface Props {
  setSentCategory: (value: string) => void
}

const SupportForm: FC<Props> = ({ setSentCategory }) => {
  const { ui, app } = useStore()
  const router = useRouter()
  const { ref, category } = router.query

  const uploadButtonRef = useRef()
  const enableFreeSupport = useFlag('enableFreeSupport')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadedDataUrls, setUploadedDataUrls] = useState<string[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  // Get all orgs and projects from global store
  const sortedOrganizations = app.organizations.list()
  const sortedProjects = app.projects.list()

  const projectDefaults: Partial<Project>[] = [{ ref: 'no-project', name: 'No specific project' }]
  const isInitialized = app.projects.isInitialized
  const projects = [...sortedProjects, ...projectDefaults]

  const planNames = {
    [PRICING_TIER_PRODUCT_IDS.FREE]: 'Free',
    [PRICING_TIER_PRODUCT_IDS.PRO]: 'Pro',
    [PRICING_TIER_PRODUCT_IDS.PAYG]: 'Pro',
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
    if (option.value.toLowerCase() === category) return option
  })
  const initialValues = {
    category: selectedCategory !== undefined ? selectedCategory.value : CATEGORY_OPTIONS[0].value,
    severity: 'Low',
    projectRef:
      selectedProject !== undefined
        ? selectedProject.ref
        : sortedProjects.length > 0
        ? sortedProjects[0].ref
        : 'no-project',
    subject: '',
    body: '',
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
    if (!values.body) errors.body = 'Please type in a message'
    return errors
  }

  const onSubmit = async (values: any, { setSubmitting }: any) => {
    setSentCategory(values.category)
    return

    // setSubmitting(true)
    // const attachments = uploadedFiles
    //   ? await uploadAttachments(values.projectRef, uploadedFiles)
    //   : []
    // const payload = {
    //   ...values,
    //   message: formatMessage(values.body, attachments),
    //   verified: true,
    //   tags: ['dashboard-support-form'],
    //   siteUrl: '',
    //   additionalRedirectUrls: '',
    // }

    // if (values.projectRef !== 'no-project') {
    //   const URL = `${API_URL}/auth/${values.projectRef}/config`
    //   const authConfig = await get(URL)
    //   if (!authConfig.error) {
    //     payload.siteUrl = authConfig.SITE_URL
    //     payload.additionalRedirectUrls = authConfig.URI_ALLOW_LIST
    //   }
    // }

    // const response = await post(`${API_URL}/feedback/send`, payload)
    // if (response.error) {
    //   ui.setNotification({
    //     category: 'error',
    //     message: `Failed to submit support ticket: ${response.error.message}`,
    //   })
    // } else {
    //   ui.setNotification({ category: 'success', message: 'Support request sent. Thank you!' })
    //   setSentCategory(values.category)
    // }
    // setSubmitting(false)
  }

  return (
    <Form id="support-form" initialValues={initialValues} validate={onValidate} onSubmit={onSubmit}>
      {({ isSubmitting, values }: any) => {
        const selectedCategory = CATEGORY_OPTIONS.find(
          (category) => category.value === values.category
        )
        const selectedProject = projects.find((project) => project.ref === values.projectRef)
        const isFreeProject =
          (selectedProject?.subscription_tier ?? PRICING_TIER_PRODUCT_IDS.FREE) ===
          PRICING_TIER_PRODUCT_IDS.FREE
        const isDisabled =
          !enableFreeSupport &&
          isFreeProject &&
          ['Performance', 'Problem', 'Best-practice'].includes(values.category)

        useEffect(() => {
          if (selectedProject && !selectedProject.subscription_tier) {
            app.projects.fetchSubscriptionTier(selectedProject as Project)
          }
        }, [values.projectRef])

        return (
          <div className="space-y-8 w-[620px]">
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
                    {planNames[selectedProject?.subscription_tier]} plan
                  </span>
                </p>
              ) : (
                <div className="flex items-center space-x-2 mt-2">
                  <IconLoader size={14} className="animate-spin" />
                  <p className="text-sm text-scale-1000">Checking project's plan</p>
                </div>
              )}
            </div>

            <Divider light />

            {values.category === 'Problem' && (
              <>
                <ClientLibrariesGuidance />
                <Divider light />
              </>
            )}

            {values.category === 'Best_practices' && (
              <>
                <BestPracticesGuidance />
                <Divider light />
              </>
            )}

            {!isDisabled ? (
              <>
                <div className="px-6">
                  <Input
                    id="subject"
                    label="Subject"
                    placeholder="Summary of the problem you have"
                  />
                </div>

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
                    id="body"
                    label="Message"
                    placeholder="Describe the issue you're facing, along with any relevant information. Please be as detailed and specific as possible."
                    limit={500}
                    labelOptional="500 character limit"
                  />
                </div>

                <div className="space-y-4 px-6">
                  <div className="space-y-1">
                    <p className="block text-sm text-scale-1100">Attachments</p>
                    <p className="block text-sm text-scale-1000">
                      Upload up to {MAX_ATTACHMENTS} screenshots that might be relevant to the issue
                      that you're facing
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
            ) : ['Problem', 'Best_practices', 'Performance'].includes(values.category) ? (
              <DisabledStateForFreeTier
                category={selectedCategory?.label ?? ''}
                projectRef={values.projectRef}
              />
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
