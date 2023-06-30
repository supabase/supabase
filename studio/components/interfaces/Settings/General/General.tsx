import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { Form, Input } from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  FormActions,
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionContent,
  FormSectionLabel,
} from 'components/ui/Forms'
import { invalidateProjectsQuery } from 'data/projects/projects-query'
import { useCheckPermissions, useStore } from 'hooks'
import { patch } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

const General = () => {
  const queryClient = useQueryClient()
  const { ui } = useStore()
  const { project } = useProjectContext()

  const formId = 'project-general-settings'
  const initialValues = { name: project?.name ?? '', ref: project?.ref ?? '' }
  const canUpdateProject = useCheckPermissions(PermissionAction.UPDATE, 'projects')

  const onSubmit = async (values: any, { resetForm }: any) => {
    const response = await patch(`${API_URL}/projects/${project?.ref}`, {
      name: values.name.trim(),
    })
    if (response.error) {
      ui.setNotification({
        category: 'error',
        message: `Update project failed: ${response.error.message}`,
      })
    } else {
      const { name } = response
      resetForm({ values: { name }, initialValues: { name } })

      await invalidateProjectsQuery(queryClient)
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
                <div className="flex py-4 px-8">
                  <FormActions
                    form={formId}
                    isSubmitting={isSubmitting}
                    hasChanges={hasChanges}
                    handleReset={handleReset}
                    helper={
                      !canUpdateProject
                        ? "You need additional permissions to manage this project's settings"
                        : undefined
                    }
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
