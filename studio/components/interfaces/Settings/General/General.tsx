import { FC } from 'react'
import { Form, Input } from '@supabase/ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useStore, checkPermissions, useFlag } from 'hooks'
import { API_URL } from 'lib/constants'
import { post } from 'lib/common/fetch'
import {
  FormHeader,
  FormPanel,
  FormActions,
  FormSection,
  FormSectionLabel,
  FormSectionContent,
} from 'components/ui/Forms'

interface Props {}

const General: FC<Props> = ({}) => {
  const { app, ui } = useStore()
  const project = ui.selectedProject

  const enablePermissions = useFlag('enablePermissions')
  const isOwner = ui.selectedOrganization?.is_owner

  const formId = 'project-general-settings'
  const initialValues = { name: project?.name ?? '', ref: project?.ref ?? '' }
  const canUpdateProject = enablePermissions
    ? checkPermissions(PermissionAction.UPDATE, 'projects')
    : isOwner

  const onSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
    const response = await post(`${API_URL}/projects/${project?.ref}/update`, { name: values.name })
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Update project failed: ${response.error.message}`,
      })
    } else {
      const { name } = response
      resetForm({ values: { name }, initialValues: { name } })

      app.onProjectUpdated(response)
      ui.setNotification({
        category: 'success',
        message: 'Successfully saved settings',
      })
    }
  }

  return (
    <Form id={formId} initialValues={initialValues} onSubmit={onSubmit}>
      {({ isSubmitting, handleReset, values, initialValues }: any) => {
        const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues)
        return (
          <>
            <FormHeader title="Project Settings" description="" />

            <FormPanel
              disabled={!canUpdateProject}
              footer={
                <div
                  className={`flex py-4 px-8 ${
                    canUpdateProject ? 'justify-end' : 'justify-between'
                  }`}
                >
                  {!canUpdateProject && (
                    <p className="text-sm text-scale-1000">
                      You need additional permissions to manage this project's settings
                    </p>
                  )}
                  <FormActions
                    form={formId}
                    isSubmitting={isSubmitting}
                    hasChanges={hasChanges}
                    handleReset={handleReset}
                  />
                </div>
              }
            >
              <FormSection header={<FormSectionLabel>General settings</FormSectionLabel>}>
                <FormSectionContent loading={false}>
                  <Input id="name" size="small" label="Project name" disabled={!canUpdateProject} />
                  <Input copy disabled id="ref" size="small" label="Reference ID" />
                </FormSectionContent>
              </FormSection>
            </FormPanel>
          </>
        )
      }}
    </Form>
  )
}

export default General
