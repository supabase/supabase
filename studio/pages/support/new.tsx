import { useEffect, useReducer, useState } from 'react'
import { observer } from 'mobx-react-lite'
import {
  Button,
  IconArrowLeft,
  IconCheck,
  IconMail,
  Input,
  Listbox,
  Typography,
} from '@supabase/ui'
import Divider from 'components/ui/Divider'

import SVG from 'react-inlinesvg'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { API_URL } from 'lib/constants'
import { useStore, withAuth } from 'hooks'
import { post, get } from 'lib/common/fetch'
import { Project } from 'types'
import { isUndefined } from 'lodash'

const DEFAULT = {
  category: {
    value: 'Problem',
    error: '',
  },
  severity: {
    value: 'Low',
    error: '',
  },
  project: {
    value: '',
    error: '',
  },
  subject: {
    value: '',
    error: '',
  },
  body: {
    value: '',
    error: '',
  },
}

/*
 * Move this to schema files
 */
const categoryOptions = [
  {
    value: 'Problem',
    label: 'Issue with project / API / Client library / REST API',
    description: 'Issues with project API, client libraries',
  },
  {
    value: 'Sales',
    label: 'Sales enquiry',
    description: 'Questions about pricing, paid plans and Enterprise plans',
  },
  {
    value: 'Billing',
    label: 'Billing',
    description: 'Issues with credit card charges | invoices | overcharing',
  },
  {
    value: 'Abuse',
    label: 'Abuse report',
    description: 'Report abuse of a Supabase project or Supabase brand',
  },
  {
    value: 'Refund',
    label: 'Refund enquiry',
    description: 'Formal enquiry form for requesting refunds',
  },
]

const severityOptions = [
  {
    value: 'Low',
    label: 'Low',
    description: 'General guidance',
  },
  {
    value: 'Normal',
    label: 'Normal',
    description: 'System impaired',
  },
  {
    value: 'High',
    label: 'High',
    description: 'Production system impaired',
  },
  {
    value: 'Urgent',
    label: 'Urgent',
    description: 'Production system down',
  },
  {
    value: 'Critical',
    label: 'Critical',
    description: 'Business-critical system down (Unavailable for free projects)',
  },
]

function formReducer(state: any, action: any) {
  return {
    ...state,
    [action.name]: {
      value: action.value,
      error: action.error,
    },
  }
}

const SupportNew = () => {
  const { ui, app } = useStore()
  const router = useRouter()
  const projectRef = router.query.ref

  const [formState, formDispatch] = useReducer(formReducer, DEFAULT)
  const [errors, setErrors] = useState<any>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [sent, setSent] = useState<boolean>(false)

  /*
   * Get all orgs and projects from global store
   */
  const sortedOrganizations = app.organizations.list()
  const sortedProjects = app.projects.list()

  const projectDefaults: Partial<Project>[] = [
    {
      ref: 'no-project',
      name: 'No specific project',
    },
  ]

  const projects = [...sortedProjects, ...projectDefaults]

  useEffect(() => {
    // set project default
    if (sortedProjects.length > 1) {
      const selectedProject = sortedProjects.find((project: Project) => project.ref === projectRef)
      if (!isUndefined(selectedProject)) {
        handleOnChange({ name: 'project', value: selectedProject.ref })
      } else {
        handleOnChange({ name: 'project', value: sortedProjects[0].ref })
      }
    } else {
      // set as 'No specific project'
      handleOnChange({ name: 'project', value: projectDefaults[0].ref })
    }
  }, [])

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
        (selectedProject?.subscription_tier ?? 'Free') === 'Free' &&
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

  const Success = () => {
    return (
      <div className="w-100 px-6 space-y-4">
        <div className="relative flex">
          <IconCheck size={24} background={'brand'} />
        </div>
        <div>
          <Typography.Title className="block" level={5}>
            Support request successfully sent
          </Typography.Title>
          <Typography.Text type="secondary" className="opacity-50">
            We will email you back using your GitHub email address
          </Typography.Text>
        </div>
        <Link href="/">
          <Button>Go back to dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-screen relative overflow-y-auto overflow-x-hidden">
      <div className="max-w-2xl mx-auto my-8 px-4 lg:px-6">
        <Button
          type="text"
          className="opacity-50 hover:opacity-100"
          style={{ background: 'none', padding: 0 }}
          onClick={function goBack() {
            window.history.back()
          }}
          icon={<IconArrowLeft />}
        >
          Go back
        </Button>
        <div className="py-8 space-y-12">
          <div className="flex items-center space-x-3">
            <SVG src={`/img/supabase-logo.svg`} className="w-4 h-4" />
            <Typography.Title level={4} className="m-0">
              Supabase support
            </Typography.Title>
          </div>
          <div className="bg-panel-body-light dark:bg-panel-body-dark py-8 rounded border dark:border-dark shadow-md space-y-12 min-w-full">
            {sent ? (
              <Success />
            ) : (
              <form onSubmit={(e) => handleSubmit(e)} className="space-y-8">
                <div className="px-6">
                  <Typography.Title level={4}>What problem are you facing?</Typography.Title>
                </div>

                <div className="space-y-6">
                  <div className="px-6">
                    <Listbox
                      value={formState.category.value}
                      label="Category"
                      layout="horizontal"
                      onChange={(value) => handleOnChange({ name: 'category', value })}
                    >
                      {categoryOptions.map((option, i) => {
                        return (
                          <Listbox.Option
                            key={`option-${option.value}`}
                            label={option.label}
                            value={option.value}
                            children={({ active, selected }: any) => {
                              return (
                                <>
                                  <span>{option.label}</span>
                                  <span className="opacity-50 block text-xs">
                                    {option.description}
                                  </span>
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
                                  <span className="opacity-50 block text-xs">
                                    {organization?.name}
                                  </span>
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
                      {severityOptions.map((option: any) => {
                        const selectedProject = projects.find(
                          (project: any) => project.ref === formState.project.value
                        )
                        const isAllowedCritical =
                          (selectedProject?.subscription_tier ?? 'Free') !== 'Free'
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
                                  <span className="opacity-50 block text-xs">
                                    {option.description}
                                  </span>
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

                  <div className="px-6">
                    <Input.TextArea
                      label="Message"
                      descriptionText="Describe the issue your facing, with any relevant information we may need"
                      limit={500}
                      labelOptional="500 character limit"
                      onChange={(e) => handleOnChange({ name: 'body', value: e.target.value })}
                      value={formState.body.value}
                      error={formState.body.error}
                    />
                  </div>
                </div>
                {errors.length >= 1 && (
                  <Typography.Text type="danger">There are errors here</Typography.Text>
                )}
                <div className="px-6">
                  <div className="flex justify-end">
                    <Button icon={<IconMail />} size="medium" loading={loading}>
                      Send support request
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default withAuth(observer(SupportNew))
