import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ExternalLink, Trash } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { object, string } from 'yup'

import { Label } from '@ui/components/shadcn/ui/label'
import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers/Shimmers'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  DialogSectionSeparator,
  Form,
  Modal,
  WarningIcon,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { urlRegex } from '../Auth.constants'
import { RedirectUrlList } from './RedirectUrlList'
import { ValueContainer } from './ValueContainer'

const MAX_URLS_LENGTH = 2 * 1024

export const RedirectUrls = () => {
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
  const [openRemoveSelected, setOpenRemoveSelected] = useState(false)
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])

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

    if (payloadString.length > MAX_URLS_LENGTH) {
      return toast.error('Too many redirect URLs, please remove some or try to use wildcards')
    }

    updateAuthConfig(
      { projectRef: projectRef!, config: { URI_ALLOW_LIST: payloadString } },
      {
        onError: (error) => {
          toast.error(`Failed to update URL: ${error?.message}`)
        },
        onSuccess: () => {
          setOpen(false)
          toast.success('Successfully added URL')
        },
      }
    )
  }

  const onConfirmDeleteUrl = async (urls?: string[]) => {
    if (!urls || urls.length === 0) return

    // Remove selectedUrl from array and update
    const payload = URI_ALLOW_LIST_ARRAY.filter((url: string) => !selectedUrls.includes(url))
    const payloadString = payload.join(',')
    if (payloadString.length > MAX_URLS_LENGTH) {
      return toast.error('Too many redirect URLs, please remove some or try to use wildcards')
    }
    updateAuthConfig(
      { projectRef: projectRef!, config: { URI_ALLOW_LIST: payloadString } },
      {
        onError: (error) => {
          toast.error(`Failed to remove URL(s): ${error?.message}`)
        },
        onSuccess: () => {
          setSelectedUrls([])
          setOpenRemoveSelected(false)
          toast.success('Successfully removed URL(s)')
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
        <div className="flex items-center gap-2 mb-6 ml-12">
          {selectedUrls.length > 0 ? (
            <>
              <Button type="default" onClick={() => setSelectedUrls([])}>
                Clear selection
              </Button>
              <ButtonTooltip
                type="default"
                disabled={!canUpdateConfig}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: 'You need additional permissions to remove redirect URLs',
                  },
                }}
                icon={<Trash />}
                onClick={() => (selectedUrls.length > 0 ? setOpenRemoveSelected(true) : null)}
              >
                Remove ({selectedUrls.length})
              </ButtonTooltip>
            </>
          ) : (
            <>
              <Button asChild type="default" icon={<ExternalLink />}>
                <Link
                  href="https://supabase.com/docs/guides/auth/concepts/redirect-urls"
                  target="_blank"
                  rel="noreferrer"
                >
                  Documentation
                </Link>
              </Button>
              <ButtonTooltip
                disabled={!canUpdateConfig}
                onClick={() => setOpen(true)}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: 'You need additional permissions to update redirect URLs',
                  },
                }}
              >
                Add URL
              </ButtonTooltip>
            </>
          )}
        </div>
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
          <WarningIcon />
          <AlertTitle_Shadcn_>Failed to retrieve auth configuration</AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>{authConfigError.message}</AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
      {isSuccess && (
        <RedirectUrlList
          allowList={URI_ALLOW_LIST_ARRAY}
          selectedUrls={selectedUrls}
          onSelectUrl={setSelectedUrls}
          canUpdate={canUpdateConfig}
        />
      )}
      <Modal
        hideFooter
        size="small"
        visible={open}
        onCancel={() => setOpen(!open)}
        header="Add a new URL"
        description="This will add a URL to a list of allowed URLs that can interact with your Authentication services for this project."
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
              <>
                <Modal.Content className="flex flex-col gap-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input id="url" name="url" placeholder="https://mydomain.com" />
                </Modal.Content>
                <DialogSectionSeparator />
                <Modal.Content>
                  <Button
                    block
                    form="new-redirect-url-form"
                    htmlType="submit"
                    size="small"
                    disabled={isUpdatingConfig}
                    loading={isUpdatingConfig}
                  >
                    Add URL
                  </Button>
                </Modal.Content>
              </>
            )
          }}
        </Form>
      </Modal>
      <Modal
        hideFooter
        size="large"
        visible={openRemoveSelected}
        header="Remove URLs"
        onCancel={() => {
          setSelectedUrls([])
          setOpenRemoveSelected(false)
        }}
      >
        <Modal.Content>
          <p className="mb-2 text-sm text-foreground-light">
            Are you sure you want to remove the following URLs?
          </p>
          <ul className="list-disc pl-4 mb-2">
            {selectedUrls.map((url, index) => (
              <li key={index} className="text-foreground-light text-sm">
                {url}
              </li>
            ))}
          </ul>
          <p className="text-foreground-light text-sm">
            These URLs will no longer work with your authentication configuration.
          </p>
        </Modal.Content>
        <Modal.Separator />
        <Modal.Content className="flex items-center gap-x-2">
          <Button
            block
            type="default"
            size="medium"
            onClick={() => {
              setSelectedUrls([])
              setOpenRemoveSelected(false)
            }}
          >
            Cancel
          </Button>
          <Button
            block
            size="medium"
            type="warning"
            loading={isUpdatingConfig}
            onClick={() => onConfirmDeleteUrl(selectedUrls)}
          >
            {isUpdatingConfig ? 'Removing...' : 'Remove URL'}
          </Button>
        </Modal.Content>
      </Modal>
    </div>
  )
}
