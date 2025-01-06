import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { FormHeader } from 'components/ui/Forms/FormHeader'
import { HorizontalShimmerWithIcon } from 'components/ui/Shimmers/Shimmers'
import { useAuthConfigQuery } from 'data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from 'data/auth/auth-config-update-mutation'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Modal,
  ScrollArea,
  WarningIcon,
  cn,
} from 'ui'
import { AddNewURLModal } from './AddNewURLModal'
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
      <div className="flex items-center justify-between mb-6">
        <FormHeader
          className="mb-0"
          title="Redirect URLs"
          description="URLs that auth providers are permitted to redirect to post authentication. Wildcards are allowed, for example, https://*.domain.com"
        />
        <DocsButton href="https://supabase.com/docs/guides/auth/concepts/redirect-urls" />
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
          onSelectAddURL={() => setOpen(true)}
          onSelectClearSelection={() => setSelectedUrls([])}
          onSelectRemoveURLs={() => setOpenRemoveSelected(true)}
        />
      )}

      <AddNewURLModal
        visible={open}
        allowList={URI_ALLOW_LIST_ARRAY}
        onClose={() => setOpen(false)}
      />

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
        <Modal.Content className="flex flex-col gap-y-2">
          <p className="mb-2 text-sm text-foreground-light">
            Are you sure you want to remove the following {selectedUrls.length} URL
            {selectedUrls.length > 1 ? 's' : ''}?
          </p>
          <ScrollArea className={cn(selectedUrls.length > 4 ? 'h-[250px]' : '')}>
            <div className="flex flex-col -space-y-1">
              {selectedUrls.map((url) => {
                return (
                  <ValueContainer key={url} className="px-4 py-3 hover:bg-surface-100">
                    {url}
                  </ValueContainer>
                )
              })}
            </div>
          </ScrollArea>
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
