import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { cn, ScrollArea } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { parseRedirectUrls } from '../Auth.constants'
import { AddNewURLModal } from './AddNewURLModal'
import { RedirectUrlList } from './RedirectUrlList'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DocsButton } from '@/components/ui/DocsButton'
import { Shortcut } from '@/components/ui/Shortcut'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { DOCS_URL } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

export const RedirectUrls = () => {
  const { ref: projectRef } = useParams()
  const {
    data: authConfig,
    error: authConfigError,
    isPending: isLoading,
    isError,
    isSuccess,
  } = useAuthConfigQuery({ projectRef })
  const { mutateAsync: updateAuthConfig, isPending: isUpdatingConfig } =
    useAuthConfigUpdateMutation()
  const { can: canUpdateConfig } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'custom_config_gotrue'
  )

  const URI_ALLOW_LIST_ARRAY = useMemo(() => {
    return parseRedirectUrls(authConfig?.URI_ALLOW_LIST)
  }, [authConfig?.URI_ALLOW_LIST])

  const [open, setOpen] = useState(false)
  const [openRemoveSelected, setOpenRemoveSelected] = useState(false)
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])

  const urlLabel = selectedUrls.length === 1 ? 'URL' : 'URLs'

  const onCloseRemoveSelected = () => {
    setSelectedUrls([])
    setOpenRemoveSelected(false)
  }

  const onConfirmDeleteUrl = async (urls: string[]) => {
    if (urls.length === 0) return

    const payload = URI_ALLOW_LIST_ARRAY.filter((url: string) => !urls.includes(url))
    await updateAuthConfig(
      { projectRef: projectRef!, config: { URI_ALLOW_LIST: payload.join(',') } },
      {
        onError: (error) => {
          toast.error(`Failed to remove redirect ${urlLabel}: ${error?.message}`)
        },
        onSuccess: () => {
          toast.success(`${urls.length} redirect ${urlLabel} removed`)
          onCloseRemoveSelected()
        },
      }
    )
  }

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Redirect URLs</PageSectionTitle>
          <PageSectionDescription>
            URLs that auth providers are permitted to redirect to post authentication. Wildcards are
            allowed, for example, https://*.domain.com
          </PageSectionDescription>
        </PageSectionSummary>
        <PageSectionAside>
          <DocsButton href={`${DOCS_URL}/guides/auth/concepts/redirect-urls`} />
          <Shortcut
            id={SHORTCUT_IDS.LIST_PAGE_NEW_ITEM}
            label="Add redirect URL"
            onTrigger={() => setOpen(true)}
            options={{ enabled: canUpdateConfig }}
            side="bottom"
          >
            <ButtonTooltip
              variant="primary"
              icon={<Plus />}
              disabled={!canUpdateConfig}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: !canUpdateConfig
                    ? 'You need additional permissions to update redirect URLs'
                    : undefined,
                },
              }}
              onClick={() => setOpen(true)}
            >
              Add URL
            </ButtonTooltip>
          </Shortcut>
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent>
        {isLoading && <GenericSkeletonLoader />}

        {isError && (
          <AlertError error={authConfigError} subject="Failed to retrieve auth configuration" />
        )}

        {isSuccess && (
          <RedirectUrlList
            allowList={URI_ALLOW_LIST_ARRAY}
            selectedUrls={selectedUrls}
            onSelectUrl={setSelectedUrls}
            onSelectClearSelection={() => setSelectedUrls([])}
            onSelectRemoveURLs={() => setOpenRemoveSelected(true)}
          />
        )}

        <AddNewURLModal
          visible={open}
          allowList={URI_ALLOW_LIST_ARRAY}
          onClose={() => setOpen(false)}
        />

        <ConfirmationModal
          variant="destructive"
          size="medium"
          visible={openRemoveSelected}
          loading={isUpdatingConfig}
          title={`Remove ${selectedUrls.length} redirect ${urlLabel}?`}
          confirmLabel={`Remove ${urlLabel}`}
          confirmLabelLoading="Removing..."
          alert={{
            title: `Auth providers can no longer redirect to ${
              selectedUrls.length === 1 ? 'this URL' : 'these URLs'
            }`,
          }}
          onCancel={onCloseRemoveSelected}
          onConfirm={() => onConfirmDeleteUrl(selectedUrls)}
        >
          <ScrollArea className={cn(selectedUrls.length > 4 ? 'h-[160px]' : '')}>
            <ul className="flex flex-col gap-y-1">
              {selectedUrls.map((url) => (
                <li key={url} className="font-mono text-sm text-foreground-light break-all">
                  {url}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </ConfirmationModal>
      </PageSectionContent>
    </PageSection>
  )
}
