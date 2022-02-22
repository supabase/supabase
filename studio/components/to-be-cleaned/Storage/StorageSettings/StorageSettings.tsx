import useSWR from 'swr'
import { FC, useState } from 'react'
import { AutoField } from 'uniforms-bootstrap4'
import { Typography } from '@supabase/ui'

import { API_URL, STORAGE_FILE_SIZE_LIMIT_MAX } from 'lib/constants'
import { patch, get } from 'lib/common/fetch'
import { useStore } from 'hooks'
import SchemaFormPanel from 'components/to-be-cleaned/forms/SchemaFormPanel'

const StorageSettings: FC<any> = ({ projectRef }) => {
  const { data, error } = useSWR(`${API_URL}/projects/${projectRef}/config?app=storage`, get)

  if (error) {
    return (
      <div className="p-6 mx-auto sm:w-full md:w-3/4 text-center">
        <Typography.Title level={3}>Error loading storage settings</Typography.Title>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6 mx-auto sm:w-full md:w-3/4 text-center">
        <Typography.Title level={3}>Loading...</Typography.Title>
      </div>
    )
  }

  return <StorageConfig config={data} projectRef={projectRef} />
}

const StorageConfig = ({ config, projectRef }: any) => {
  const { ui } = useStore()

  const [updates, setUpdates] = useState(config)

  const updateConfig = async (updatedConfig: any) => {
    try {
      const response = await patch(
        `${API_URL}/projects/${projectRef}/config?app=storage`,
        updatedConfig
      )
      if (response.error) {
        throw response.error
      } else {
        ui.setNotification({ category: 'success', message: 'Settings saved' })
      }
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: `Update config failed: ${error.message}` })
    }
  }

  return (
    <div className="flex flex-col w-full min-h-full">
      <SchemaFormPanel
        title="Settings"
        schema={{
          properties: {
            fileSizeLimit: {
              help: 'The maximum size in bytes of a file that can be uploaded.',
              maximum: STORAGE_FILE_SIZE_LIMIT_MAX,
              minimum: 0,
              title: 'Upload file size limit',
              type: 'integer',
            },
          },
          required: ['fileSizeLimit'],
          type: 'object',
        }}
        model={updates}
        onSubmit={(model: any) => updateConfig(model)}
        onReset={() => setUpdates(config)}
      >
        <AutoField name="fileSizeLimit" showInlineError errorMessage="Must be a number." />
      </SchemaFormPanel>
    </div>
  )
}

export default StorageSettings
