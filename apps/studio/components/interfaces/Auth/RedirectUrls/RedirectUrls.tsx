import { useParams } from 'common'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  cn,
  ScrollArea,
} from 'ui'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { parseRedirectUrls } from '../Auth.constants'
import { AddNewURLModal } from './AddNewURLModal'
import { RedirectUrlList } from './RedirectUrlList'
import { ValueContainer } from './ValueContainer'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { HorizontalShimmerWithIcon } from '@/components/ui/Shimmers'
import { useAuthConfigQuery } from '@/data/auth/auth-config-query'
import { useAuthConfigUpdateMutation } from '@/data/auth/auth-config-update-mutation'
import { DOCS_URL } from '@/lib/constants'

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

  const URI_ALLOW_LIST_ARRAY = useMemo(() => {
    return parseRedirectUrls(authConfig?.URI_ALLOW_LIST)
  }, [authConfig?.URI_ALLOW_LIST])

  const [open, setOpen] = useState(false)
  const [openRemoveSelected, setOpenRemoveSelected] = useState(false)
  const [selectedUrls, setSelectedUrls] = useState<string[]>([])

  const onConfirmDeleteUrl = async (urls?: string[]) => {
    if (!urls || urls.length === 0) return

    const payload = URI_ALLOW_LIST_ARRAY.filter((url: string) => !urls.includes(url))
    const payloadString = payload.join(',')
    await updateAuthConfig(
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
        </PageSectionAside>
      </PageSectionMeta>
      <PageSectionContent>
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
          <AlertError error={authConfigError} subject="Failed to retrieve auth configuration" />
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

        <AlertDialog
          open={openRemoveSelected}
          onOpenChange={() => {
            setSelectedUrls([])
            setOpenRemoveSelected(false)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove URLs</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="flex flex-col gap-y-2">
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
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="flex items-center gap-x-2">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="warning" onClick={() => onConfirmDeleteUrl(selectedUrls)}>
                {isUpdatingConfig ? 'Removing...' : 'Remove URL'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageSectionContent>
    </PageSection>
  )
}
