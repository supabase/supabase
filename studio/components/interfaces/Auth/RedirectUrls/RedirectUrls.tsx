import * as Tooltip from '@radix-ui/react-tooltip'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { observer } from 'mobx-react-lite'
import { useMemo, useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Form,
  IconAlertCircle,
  Input,
  Modal,
} from 'ui'
import { object, string } from 'yup'

import { useParams } from 'common'
import { FormHeader } from 'components/ui/Forms'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions, useStore } from 'hooks'
import { urlRegex } from '../Auth.constants'
import RedirectUrlList from './RedirectUrlList'
import ValueContainer from './ValueContainer'

const RedirectUrls = () => {
  const { ui } = useStore()
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })
  const { mutate: updateAuthConfig, isLoading: isUpdatingConfig } = useAuthConfigUpdateMutation()

  const URI_ALLOW_LIST_ARRAY = useMemo(() => {
    return authConfig?.URI_ALLOW_LIST
      ? authConfig.URI_ALLOW_LIST.split(/\s*[,]+\s*/).filter((url: string) => url)
      : []
  }, [authConfig?.URI_ALLOW_LIST])

  const [open, setOpen] = useState(false)
  const [selectedUrlToDelete, setSelectedUrlToDelete] = useState<string>()

  const canUpdateConfig = useCheckPermissions(PermissionAction.UPDATE, 'custom_config_gotrue')

  const newUrlSchema = object({
    url: string().matches(urlRegex, 'URL is not valid').required(),
  })

  const onAddNewUrl = async (values: any) => {
    if (!values.url) {
      return
    }

    const payload = URI_ALLOW_LIST_ARRAY
    // remove any trailing commas
    payload.push(values.url.replace(/,\s*$/, ''))

    const payloadString = payload.toString()

    if (payloadString.length > 2 * 1024) {
      ui.setNotification({
        message: 'Too many redirect URLs, please remove some or try to use wildcards',
        category: 'error',
      })
      return
    }

    updateAuthConfig(
      { projectRef: projectRef!, config: { URI_ALLOW_LIST: payloadString } },
      {
        onError: (error) => {
          ui.setNotification({
            error,
            category: 'error',
            message: `Failed to update URL: ${error?.message}`,
          })
        },
        onSuccess: () => {
          setOpen(false)
          ui.setNotification({ category: 'success', message: 'Successfully added URL' })
        },
      }
    )
  }

  const onConfirmDeleteUrl = async (url?: string) => {
    if (!url) return

    // Remove selectedUrl from array and update
    const payload = URI_ALLOW_LIST_ARRAY.filter((e: string) => e !== url)

    updateAuthConfig(
      { projectRef: projectRef!, config: { URI_ALLOW_LIST: payload.toString() } },
      {
        onError: (error) => {
          ui.setNotification({
            error,
            category: 'error',
            message: `Failed to remove URL: ${error?.message}`,
          })
        },
        onSuccess: () => {
          setSelectedUrlToDelete(undefined)
          ui.setNotification({ category: 'success', message: 'Successfully removed URL' })
        },
      }
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <FormHeader
          title="Redirect URLs"
          description={`URLs that auth providers are permitted to redirect to post authentication. Wildcards are allowed, for example, https://*.domain.com`}
        />
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger>
            <Button disabled={!canUpdateConfig} onClick={() => setOpen(true)}>
              Add URL
            </Button>
          </Tooltip.Trigger>
          {!canUpdateConfig && (
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                    'border border-scale-200',
                  ].join(' ')}
                >
                  <span className="text-xs text-scale-1200">
                    You need additional permissions to update redirect URLs
                  </span>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          )}
        </Tooltip.Root>
      </div>
      {isLoading && (
        <>
          <ValueContainer>
            <HorizontalShimmerWithIcon />
          </ValueContainer>
          <ValueContainer>
            <HorizontalShimmerWithIcon />
          </ValueContainer>
        </>
      )}
      {isError && (
        <Alert_Shadcn_ variant="destructive">
          <IconAlertCircle strokeWidth={2} />
          <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
      {isSuccess && (
        <RedirectUrlList
          URI_ALLOW_LIST_ARRAY={URI_ALLOW_LIST_ARRAY}
          canUpdate={canUpdateConfig}
          onSelectUrlToDelete={setSelectedUrlToDelete}
        />
      )}
      <Modal
        hideFooter
        size="small"
        visible={open}
        onCancel={() => setOpen(!open)}
        header={<h3 className="text-sm">Add a new URL</h3>}
      >
        <Form
          validateOnBlur
          id="new-redirect-url-form"
          initialValues={{ url: '' }}
          validationSchema={newUrlSchema}
          onSubmit={onAddNewUrl}
        >
          {() => {
            return (
              <div className="mb-4 space-y-4 pt-4">
                <div className="px-5">
                  <p className="text-sm text-scale-1100">
                    This will add a URL to a list of allowed URLs that can interact with your
                    Authentication services for this project.
                  </p>
                </div>
                <div className="border-overlay-border border-t" />
                <div className="px-5">
                  <Input id="url" name="url" label="URL" placeholder="https://mydomain.com" />
                </div>
                <div className="border-overlay-border border-t" />
                <div className="px-5">
                  <Button
                    block
                    form="new-redirect-url-form"
                    htmlType="submit"
                    size="medium"
                    disabled={isUpdatingConfig}
                    loading={isUpdatingConfig}
                  >
                    Add URL
                  </Button>
                </div>
              </div>
            )
          }}
        </Form>
      </Modal>
      <Modal
        hideFooter
        size="small"
        visible={selectedUrlToDelete !== undefined}
        header={<h3 className="text-sm">Remove URL</h3>}
        onCancel={() => setSelectedUrlToDelete(undefined)}
      >
        <div className="mb-4 space-y-4 pt-4">
          <div className="px-5">
            <p className="mb-2 text-sm text-scale-1100">
              Are you sure you want to remove{' '}
              <span className="text-scale-1200">{selectedUrlToDelete}</span>?
            </p>
            <p className="text-scale-1100 text-sm">
              This URL will no longer work with your authentication configuration.
            </p>
          </div>
          <div className="border-overlay-border border-t"></div>
          <div className="flex gap-3 px-5">
            <Button
              block
              type="default"
              size="medium"
              onClick={() => setSelectedUrlToDelete(undefined)}
            >
              Cancel
            </Button>
            <Button
              block
              size="medium"
              type="warning"
              loading={isUpdatingConfig}
              onClick={() => onConfirmDeleteUrl(selectedUrlToDelete)}
            >
              {isUpdatingConfig ? 'Removing...' : 'Remove URL'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default observer(RedirectUrls)
