import { isUndefined } from 'lodash'
import { useRouter } from 'next/router'
import { useEffect, useReducer, useState, FC, ChangeEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, IconMail, Input, Listbox } from '@supabase/ui'

import { useStore } from 'hooks'
import { Project } from 'types'
import { post, get } from 'lib/common/fetch'
import { API_URL, PRICING_TIER_PRODUCT_IDS } from 'lib/constants'

import Divider from 'components/ui/Divider'
import Connecting from 'components/ui/Loading/Loading'
import { formReducer } from './SupportForm.utils'
import {
  DEFAULT_VALUES,
  CATEGORY_OPTIONS,
  SEVERITY_OPTIONS,
} from 'components/interfaces/Support/Support.constants'

interface Props {
  setSent: (value: boolean) => void
}

const SupportForm: FC<Props> = ({ setSent }) => {
  const { ui, app } = useStore()
  const router = useRouter()
  const projectRef = router.query.ref
  const category = router.query.category

  const [errors, setErrors] = useState<any>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [formState, formDispatch] = useReducer(formReducer, DEFAULT_VALUES)

  const [uploadedFiles, setUploadedFiles] = useState<any>()
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

    console.log('UploadedFiles changed', uploadedFiles)
    const objectUrls = Array.prototype.map.call(uploadedFiles, (file) => URL.createObjectURL(file))
    console.log('objectUrls', objectUrls)
    setUploadedDataUrls(objectUrls)
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

    setErrors([...errors])

    if (errors.length === 0) {
      const projectRef = formState.project.value
      const payload = {
        projectRef,
        message: formState.body.value,
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

      setLoading(true)
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
    console.log('onFilesUpload', items)
    setUploadedFiles(items)
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
        <div className="px-6">
          <div className="space-y-1">
            <p className="block text-scale-1100 text-sm">Attachments</p>
            <p className="block text-scale-1000 text-sm">
              Upload any screenshots that might be relevant to the issue that you're facing
            </p>
          </div>
          <div className="">
            <input multiple type="file" onChange={onFilesUpload} />
          </div>
          <div className="flex items-center space-x-2">
            {uploadedDataUrls.map((x: any) => (
              <div
                style={{ backgroundImage: `url("${x}")` }}
                className="bg-center bg-cover bg-no-repeat h-14 w-14 rounded"
              />
            ))}
          </div>
        </div>
      </div>
      {errors.length >= 1 && (
        <div className="px-6">
          <p className="text-sm text-red-1000">There are errors here</p>
        </div>
      )}
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
