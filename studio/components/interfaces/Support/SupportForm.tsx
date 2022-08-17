import { isUndefined } from 'lodash'
import { useRouter } from 'next/router'
import { useEffect, useReducer, useState, FC, ChangeEvent, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, IconMail, IconPlus, IconX, Input, Listbox } from '@supabase/ui'

import { useStore } from 'hooks'
import { Project } from 'types'
import { post, get } from 'lib/common/fetch'
import { API_URL, PRICING_TIER_PRODUCT_IDS } from 'lib/constants'

import Divider from 'components/ui/Divider'
import Connecting from 'components/ui/Loading/Loading'
import { formatMessage, formReducer, uploadAttachments } from './SupportForm.utils'
import {
  DEFAULT_VALUES,
  CATEGORY_OPTIONS,
  SEVERITY_OPTIONS,
} from 'components/interfaces/Support/Support.constants'

const MAX_ATTACHMENTS = 5

interface Props {
  setSent: (value: boolean) => void
}

const SupportForm: FC<Props> = ({ setSent }) => {
  const { ui, app } = useStore()
  const router = useRouter()
  const projectRef = router.query.ref
  const category = router.query.category

  const uploadButtonRef = useRef()
  const [loading, setLoading] = useState<boolean>(false)
  const [formState, formDispatch] = useReducer(formReducer, DEFAULT_VALUES)

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadedDataUrls, setUploadedDataUrls] = useState<any>([])

  // Get all orgs and projects from global store
  const sortedOrganizations = app.organizations.list()
  const sortedProjects = app.projects.list()

  const projectDefaults: Partial<Project>[] = [{ ref: 'no-project', name: 'No specific project' }]

  const isInitialized = app.projects.isInitialized
  const projects = [...sortedProjects, ...projectDefaults]

  useEffect(() => {
    if (isInitialized) {
      // set project default
      if (sortedProjects.length > 1) {
        const selectedProject = sortedProjects.find(
          (project: Project) => project.ref === projectRef
        )
        if (!isUndefined(selectedProject)) {
          handleOnChange({ name: 'project', value: selectedProject.ref })
        } else {
          handleOnChange({ name: 'project', value: sortedProjects[0].ref })
        }
      } else {
        // set as 'No specific project'
        handleOnChange({ name: 'project', value: projectDefaults[0].ref })
      }

      // Set category based on query param
      if (category) {
        const selectedCategory = CATEGORY_OPTIONS.find((option) => {
          if (option.value.toLowerCase() === category) return option
        })
        if (selectedCategory) handleOnChange({ name: 'category', value: selectedCategory.value })
      }
    }
  }, [isInitialized])

  useEffect(() => {
    if (!uploadedFiles) return
    const objectUrls = uploadedFiles.map((file) => URL.createObjectURL(file))
    setUploadedDataUrls(objectUrls)

    return () => {
      objectUrls.forEach((url: any) => URL.revokeObjectURL(url))
    }
  }, [uploadedFiles])

  function handleOnChange(x: any) {
    formDispatch({
      name: x.name,
      value: x.value,
      error: x.error,
    })
    // Reset severity value when changing project to prevent selection of Critical
    if (x.name === 'project') {
      const selectedProject = projects.find((project: any) => project.ref === x.value)
      if (
        (selectedProject?.subscription_tier ?? PRICING_TIER_PRODUCT_IDS.FREE) ===
          PRICING_TIER_PRODUCT_IDS.FREE &&
        formState.severity.value === 'Critical'
      ) {
        formDispatch({
          name: 'severity',
          value: 'Low',
          error: '',
        })
      }
    }
  }

  async function handleSubmit(e: any) {
    e.preventDefault()

    let errors: any = []

    if (!formState.subject.value) {
      const message = 'Please add a subject heading'
      handleOnChange({ name: 'subject', error: message })
      errors.push([...errors, message])
    }

    if (!formState.body.value) {
      const message = 'Please type in a message'
      handleOnChange({ name: 'body', error: message })
      errors.push([...errors, message])
    }

    if (errors.length === 0) {
      setLoading(true)
      const projectRef = formState.project.value
      const attachments = uploadedFiles ? await uploadAttachments(projectRef, uploadedFiles) : []

      const payload = {
        projectRef,
        message: formatMessage(formState.body.value, attachments),
        category: formState.category.value,
        verified: true,
        tags: ['dashboard-support-form'],
        subject: formState.subject.value,
        severity: formState.severity.value,
        siteUrl: '',
        additionalRedirectUrls: '',
      }

      if (projectRef !== 'no-project') {
        const URL = `${API_URL}/auth/${projectRef}/config`
        const authConfig = await get(URL)
        if (!authConfig.error) {
          payload.siteUrl = authConfig.SITE_URL
          payload.additionalRedirectUrls = authConfig.URI_ALLOW_LIST
        }
      }

      const response = await post(`${API_URL}/feedback/send`, payload)
      setLoading(false)

      if (response.error) {
        ui.setNotification({
          category: 'error',
          message: `Failed to submit support ticket: ${response.error.message}`,
        })
      } else {
        ui.setNotification({ category: 'success', message: 'Support request sent. Thank you!' })
        setSent(true)
      }
    }
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

  if (!isInitialized) {
    return (
      <div className="w-[622px] py-48">
        <Connecting />
      </div>
    )
  }

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="space-y-8">
      <div className="px-6">
        <h4>What problem are you facing?</h4>
      </div>

      <div className="space-y-6">
        <div className="px-6">
          <Listbox
            value={formState.category.value}
            label="Category"
            layout="horizontal"
            onChange={(value) => handleOnChange({ name: 'category', value })}
          >
            {CATEGORY_OPTIONS.map((option, i) => {
              return (
                <Listbox.Option
                  key={`option-${option.value}`}
                  label={option.label}
                  value={option.value}
                  children={({ active, selected }: any) => {
                    return (
                      <>
                        <span>{option.label}</span>
                        <span className="block text-xs opacity-50">{option.description}</span>
                      </>
                    )
                  }}
                />
              )
            })}
          </Listbox>
        </div>
        <div className="px-6">
          <Listbox
            value={formState.project.value}
            label="Project"
            layout="horizontal"
            descriptionText="The project that is experiencing the problem"
            onChange={(value) => handleOnChange({ name: 'project', value })}
          >
            {projects.map((option) => {
              return (
                <Listbox.Option
                  key={`option-${option.ref}`}
                  label={option.name || ''}
                  value={option.ref}
                  children={({ active, selected }: any) => {
                    const organization = sortedOrganizations.find(
                      (x) => x.id === option.organization_id
                    )
                    return (
                      <div>
                        <span>{option.name}</span>
                        <span className="block text-xs opacity-50">{organization?.name}</span>
                      </div>
                    )
                  }}
                />
              )
            })}
          </Listbox>
        </div>

        <div className="px-6">
          <Listbox
            value={formState.severity.value}
            label="Severity"
            layout="horizontal"
            onChange={(value) => handleOnChange({ name: 'severity', value })}
          >
            {SEVERITY_OPTIONS.map((option: any) => {
              const selectedProject = projects.find(
                (project: any) => project.ref === formState.project.value
              )
              const isAllowedCritical =
                (selectedProject?.subscription_tier ?? PRICING_TIER_PRODUCT_IDS.FREE) !==
                PRICING_TIER_PRODUCT_IDS.FREE
              return (
                <Listbox.Option
                  key={`option-${option.value}`}
                  label={option.label}
                  value={option.value}
                  disabled={option.value === 'Critical' && !isAllowedCritical}
                  children={({ active, selected }: any) => {
                    return (
                      <>
                        <span>{option.label}</span>
                        <span className="block text-xs opacity-50">{option.description}</span>
                      </>
                    )
                  }}
                />
              )
            })}
          </Listbox>
        </div>

        <Divider light />

        <div className="px-6">
          <Input
            label="Subject"
            placeholder="Summary of the problem you have"
            onChange={(e) => handleOnChange({ name: 'subject', value: e.target.value })}
            value={formState.subject.value}
            error={formState.subject.error}
          />
        </div>

        <div className="px-6 text-area-text-sm">
          <Input.TextArea
            label="Message"
            placeholder="Describe the issue you're facing, along with any relevant information. Please be as detailed and specific as possible."
            limit={500}
            labelOptional="500 character limit"
            onChange={(e) => handleOnChange({ name: 'body', value: e.target.value })}
            value={formState.body.value}
            error={formState.body.error}
          />
        </div>
        <div className="px-6 space-y-4">
          <div className="space-y-1">
            <p className="block text-scale-1100 text-sm">Attachments</p>
            <p className="block text-scale-1000 text-sm">
              Upload up to {MAX_ATTACHMENTS} screenshots that might be relevant to the issue that
              you're facing
            </p>
          </div>
          <div className="">
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
                style={{ backgroundImage: `url("${x}")` }}
                className="bg-center bg-cover bg-no-repeat h-14 w-14 rounded relative"
              >
                <div
                  className={[
                    'rounded-full w-4 h-4 bg-red-900 flex items-center justify-center',
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
                  'border border-scale-800 transition opacity-50 hover:opacity-100',
                  'w-14 h-14 rounded flex items-center justify-center group cursor-pointer',
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
      </div>
      <div className="px-6">
        <div className="flex justify-end">
          <Button
            htmlType="submit"
            size="small"
            icon={<IconMail />}
            disabled={loading}
            loading={loading}
          >
            Send support request
          </Button>
        </div>
      </div>
    </form>
  )
}

export default observer(SupportForm)
