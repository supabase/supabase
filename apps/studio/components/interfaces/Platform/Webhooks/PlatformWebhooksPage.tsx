import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { EllipsisVertical, Pencil, RotateCw, Trash2 } from 'lucide-react'
import { useRouter } from 'next/router'
import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'
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
  Button,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Label_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { PLATFORM_WEBHOOKS_MOCK_DATA } from './PlatformWebhooks.mock'
import {
  filterWebhookDeliveries,
  filterWebhookEndpoints,
  usePlatformWebhooksMockStore,
} from './PlatformWebhooks.store'
import type { WebhookScope } from './PlatformWebhooks.types'
import { getWebhookEndpointDisplayName } from './PlatformWebhooks.utils'
import { PlatformWebhooksDeliveryDetailsSheet } from './PlatformWebhooksDeliveryDetailsSheet'
import { PlatformWebhooksEndpointDetails } from './PlatformWebhooksEndpointDetails'
import { PlatformWebhooksEndpointList } from './PlatformWebhooksEndpointList'
import {
  EndpointFormValues,
  PlatformWebhooksEndpointSheet,
  toEndpointPayload,
} from './PlatformWebhooksEndpointSheet'
import { PlatformWebhooksHeader } from './PlatformWebhooksHeader'
import {
  clearPendingSigningSecretReveal,
  getPendingSigningSecretReveal,
  setPendingSigningSecretReveal,
  shouldHandleEndpointNotFound,
} from './PlatformWebhooksPage.utils'
import { useIsPlatformWebhooksEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { InlineLink } from '@/components/ui/InlineLink'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

const PANEL_VALUES = ['create', 'edit'] as const

interface PlatformWebhooksPageProps {
  scope: WebhookScope
  endpointId?: string
}

export const PlatformWebhooksPage = ({ scope, endpointId }: PlatformWebhooksPageProps) => {
  const router = useRouter()
  const { slug, ref } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery({
    enabled: scope === 'project',
  })
  const platformWebhooksEnabled = useIsPlatformWebhooksEnabled()
  const {
    endpoints,
    deliveries,
    createEndpoint,
    updateEndpoint,
    deleteEndpoint,
    regenerateSecret,
    retryDelivery,
  } = usePlatformWebhooksMockStore(scope)
  const [deliveryId, setDeliveryId] = useQueryState('deliveryId', parseAsString)
  const [panel, setPanel] = useQueryState('panel', parseAsStringLiteral(PANEL_VALUES))
  const [search, setSearch] = useQueryState(
    'search',
    parseAsString.withDefault('').withOptions({ history: 'replace', clearOnDefault: true })
  )
  const [deliverySearch, setDeliverySearch] = useQueryState(
    'deliverySearch',
    parseAsString.withDefault('').withOptions({ history: 'replace', clearOnDefault: true })
  )

  const [endpointIdPendingDelete, setEndpointIdPendingDelete] = useState<string | null>(null)
  const [signingSecretReveal, setSigningSecretReveal] = useState<{ signingSecret: string } | null>(
    null
  )
  const [showRegenerateSecretConfirm, setShowRegenerateSecretConfirm] = useState(false)
  const [editEnabledOverride, setEditEnabledOverride] = useState<boolean | null>(null)
  const [deliveryDetailsTab, setDeliveryDetailsTab] = useState<'event' | 'response'>('event')
  const [pendingCreatedEndpointId, setPendingCreatedEndpointId] = useState<string | null>(null)

  const scopeLabel = scope === 'organization' ? 'Organization Webhooks' : 'Project Webhooks'
  const scopeDescription =
    scope === 'organization'
      ? 'Organization-level webhook endpoints and deliveries'
      : 'Webhook endpoints specific to this project'
  const fallbackHref =
    scope === 'organization' ? `/org/${slug}/general` : `/project/${ref}/settings/general`

  const eventTypeOptions = PLATFORM_WEBHOOKS_MOCK_DATA[scope].eventTypes
  const webhooksHref =
    scope === 'organization' ? `/org/${slug}/webhooks` : `/project/${ref}/settings/webhooks`

  const selectedEndpoint = useMemo(
    () => endpoints.find((endpoint) => endpoint.id === endpointId) ?? null,
    [endpoints, endpointId]
  )
  const isEndpointView = !!selectedEndpoint
  const selectedEndpointHasName = selectedEndpoint ? selectedEndpoint.name.trim().length > 0 : false
  const selectedEndpointDisplayName = selectedEndpoint
    ? getWebhookEndpointDisplayName(selectedEndpoint)
    : ''
  const headerTitle = isEndpointView ? selectedEndpointDisplayName : scopeLabel
  const headerDescription = isEndpointView
    ? selectedEndpointHasName
      ? (selectedEndpoint?.url ?? '')
      : ''
    : scopeDescription

  const endpointPendingDelete = useMemo(
    () => endpoints.find((endpoint) => endpoint.id === endpointIdPendingDelete) ?? null,
    [endpoints, endpointIdPendingDelete]
  )
  const endpointPendingDeleteHasName = endpointPendingDelete
    ? endpointPendingDelete.name.trim().length > 0
    : false
  const endpointPendingDeleteDisplayName = endpointPendingDelete
    ? getWebhookEndpointDisplayName(endpointPendingDelete)
    : ''
  let deleteEndpointDescription = 'This action cannot be undone.'
  if (endpointPendingDelete) {
    deleteEndpointDescription = endpointPendingDeleteHasName
      ? `Deleting “${endpointPendingDeleteDisplayName}” stops all deliveries to the URL below. This can’t be undone.`
      : 'Deleting this endpoint stops all deliveries to the URL below. This can’t be undone.'
  }

  useEffect(() => {
    if (!platformWebhooksEnabled) {
      router.replace(fallbackHref)
    }
  }, [fallbackHref, platformWebhooksEnabled, router])

  useEffect(() => {
    if (
      shouldHandleEndpointNotFound({
        endpointId,
        hasSelectedEndpoint: !!selectedEndpoint,
        pendingCreatedEndpointId,
      })
    ) {
      toast('Endpoint not found')
      router.replace(webhooksHref)
    }
  }, [endpointId, pendingCreatedEndpointId, selectedEndpoint, router, webhooksHref])

  useEffect(() => {
    if (!pendingCreatedEndpointId) return
    if (
      endpointId !== pendingCreatedEndpointId ||
      selectedEndpoint?.id === pendingCreatedEndpointId
    ) {
      setPendingCreatedEndpointId(null)
    }
  }, [endpointId, pendingCreatedEndpointId, selectedEndpoint])

  useEffect(() => {
    if (signingSecretReveal || !endpointId) return
    const pendingReveal = getPendingSigningSecretReveal(scope, endpointId)
    if (!pendingReveal) return
    setSigningSecretReveal({ signingSecret: pendingReveal.signingSecret })
  }, [endpointId, scope, signingSecretReveal])

  const filteredEndpoints = useMemo(() => {
    return filterWebhookEndpoints(endpoints, search)
  }, [endpoints, search])

  const filteredDeliveries = useMemo(() => {
    if (!selectedEndpoint) return []
    return filterWebhookDeliveries(deliveries, selectedEndpoint.id, deliverySearch)
  }, [deliveries, deliverySearch, selectedEndpoint])

  const selectedDelivery = useMemo(() => {
    if (!selectedEndpoint || !deliveryId) return null
    return (
      deliveries.find(
        (delivery) => delivery.id === deliveryId && delivery.endpointId === selectedEndpoint.id
      ) ?? null
    )
  }, [deliveries, deliveryId, selectedEndpoint])

  const deliveryAttempt = useMemo(() => {
    if (!selectedEndpoint || !selectedDelivery) return null
    const endpointDeliveries = deliveries
      .filter((delivery) => delivery.endpointId === selectedEndpoint.id)
      .sort((a, b) => new Date(b.attemptAt).getTime() - new Date(a.attemptAt).getTime())
    const index = endpointDeliveries.findIndex((delivery) => delivery.id === selectedDelivery.id)
    return index >= 0 ? index + 1 : null
  }, [deliveries, selectedDelivery, selectedEndpoint])

  const deliveryEventPayload = useMemo(() => {
    if (!selectedEndpoint || !selectedDelivery) return ''
    return JSON.stringify(
      {
        endpoint_id: selectedEndpoint.id,
        endpoint_url: selectedEndpoint.url,
        event_type: selectedDelivery.eventType,
        event_id: selectedDelivery.id,
        attempted_at: selectedDelivery.attemptAt,
        scope,
      },
      null,
      2
    )
  }, [scope, selectedDelivery, selectedEndpoint])

  const deliveryResponsePayload = useMemo(() => {
    if (!selectedEndpoint || !selectedDelivery) return ''
    return JSON.stringify(
      {
        endpoint_id: selectedEndpoint.id,
        delivery_id: selectedDelivery.id,
        status: selectedDelivery.status,
        response_code: selectedDelivery.responseCode ?? null,
      },
      null,
      2
    )
  }, [selectedDelivery, selectedEndpoint])

  const handleDeleteEndpoint = () => {
    if (!endpointPendingDelete) return
    deleteEndpoint(endpointPendingDelete.id)
    if (endpointPendingDelete.id === endpointId) {
      router.push(webhooksHref)
      setDeliverySearch('')
    }
    setEndpointIdPendingDelete(null)
    toast.success('Endpoint deleted')
  }

  const handleUpsertEndpoint = (values: EndpointFormValues) => {
    if (panel === 'create') {
      const { endpointId: createdEndpointId, signingSecret } = createEndpoint(
        toEndpointPayload(values)
      )
      setPendingCreatedEndpointId(createdEndpointId)
      setPendingSigningSecretReveal(scope, {
        endpointId: createdEndpointId,
        signingSecret,
      })
      router.push(`${webhooksHref}/${encodeURIComponent(createdEndpointId)}`)
      setSigningSecretReveal({ signingSecret })
      setPanel(null)
      setEditEnabledOverride(null)
      toast.success('Endpoint created')
      return
    }

    if (panel === 'edit' && selectedEndpoint) {
      updateEndpoint(selectedEndpoint.id, toEndpointPayload(values))
      setPanel(null)
      setEditEnabledOverride(null)
      toast.success('Endpoint updated')
    }
  }

  const handleRegenerateSecret = () => {
    if (!selectedEndpoint) return
    const nextSecret = regenerateSecret(selectedEndpoint.id)
    if (!nextSecret) return
    setSigningSecretReveal({ signingSecret: nextSecret })
    setShowRegenerateSecretConfirm(false)
    toast.success('Signing secret regenerated')
  }

  const handleRetryDelivery = (deliveryId: string) => {
    const delivery = deliveries.find((item) => item.id === deliveryId)
    if (!delivery || delivery.status === 'success') return

    retryDelivery(deliveryId)
    toast.success('Delivery queued for retry')
  }

  const handleCopy = (value: string, label: string) => {
    copyToClipboard(value)
    toast.success(`Copied ${label}`)
  }

  const isEndpointSheetOpen = panel === 'create' || (panel === 'edit' && !!selectedEndpoint)

  useEffect(() => {
    if (!selectedEndpoint && !!deliveryId) {
      setDeliveryId(null)
    }
  }, [deliveryId, selectedEndpoint, setDeliveryId])

  useEffect(() => {
    if (!!deliveryId && !selectedDelivery) {
      setDeliveryId(null)
    }
  }, [deliveryId, selectedDelivery, setDeliveryId])

  if (!platformWebhooksEnabled) {
    return null
  }

  return (
    <>
      <PlatformWebhooksHeader
        hasSelectedEndpoint={!!selectedEndpoint}
        headerTitle={headerTitle}
        featureKey={LOCAL_STORAGE_KEYS.UI_PREVIEW_PLATFORM_WEBHOOKS}
        headerDescription={headerDescription}
        endpointStatus={
          selectedEndpoint ? (selectedEndpoint.enabled ? 'enabled' : 'disabled') : undefined
        }
        endpointActions={
          selectedEndpoint ? (
            <>
              <Button
                type="default"
                icon={<Pencil size={14} />}
                onClick={() => {
                  setEditEnabledOverride(null)
                  setPanel('edit')
                }}
              >
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="default" icon={<EllipsisVertical />} className="w-7" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" side="bottom" className="w-48">
                  <DropdownMenuItem
                    className="gap-x-2"
                    onClick={() => setShowRegenerateSecretConfirm(true)}
                  >
                    <RotateCw size={14} className="text-foreground-lighter" />
                    <span>Regenerate secret</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="gap-x-2"
                    onClick={() => setEndpointIdPendingDelete(selectedEndpoint.id)}
                  >
                    <Trash2 size={14} className="text-foreground-lighter" />
                    <span>Delete endpoint</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : undefined
        }
        webhooksHref={webhooksHref}
        scopeLabel={scopeLabel}
      />

      <PageContainer size="default">
        <PageSection>
          <PageSectionContent>
            {!selectedEndpoint ? (
              <PlatformWebhooksEndpointList
                filteredEndpoints={filteredEndpoints}
                search={search}
                webhooksHref={webhooksHref}
                onCreateEndpoint={() => setPanel('create')}
                onDeleteEndpoint={(id) => setEndpointIdPendingDelete(id)}
                onSearchChange={setSearch}
                onViewEndpoint={(id) => {
                  router.push(`${webhooksHref}/${encodeURIComponent(id)}`)
                  setPanel(null)
                }}
              />
            ) : (
              <PlatformWebhooksEndpointDetails
                deliverySearch={deliverySearch}
                filteredDeliveries={filteredDeliveries}
                selectedEndpoint={selectedEndpoint}
                onDeliverySearchChange={setDeliverySearch}
                onOpenDelivery={(id) => {
                  setDeliveryDetailsTab('event')
                  setDeliveryId(id)
                }}
                onRetryDelivery={handleRetryDelivery}
              />
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>

      <PlatformWebhooksDeliveryDetailsSheet
        deliveryAttempt={deliveryAttempt}
        deliveryDetailsTab={deliveryDetailsTab}
        deliveryEventPayload={deliveryEventPayload}
        deliveryResponsePayload={deliveryResponsePayload}
        open={!!selectedDelivery}
        selectedDelivery={selectedDelivery}
        onCopy={handleCopy}
        onOpenChange={(open) => !open && setDeliveryId(null)}
        onRetryDelivery={handleRetryDelivery}
        onTabChange={setDeliveryDetailsTab}
      />

      <PlatformWebhooksEndpointSheet
        visible={isEndpointSheetOpen}
        mode={panel === 'create' ? 'create' : 'edit'}
        scope={scope}
        orgSlug={scope === 'project' ? selectedOrganization?.slug : undefined}
        endpoint={panel === 'edit' ? (selectedEndpoint ?? undefined) : undefined}
        enabledOverride={panel === 'edit' ? editEnabledOverride : null}
        eventTypes={eventTypeOptions}
        onClose={() => {
          setPanel(null)
          setEditEnabledOverride(null)
        }}
        onSubmit={handleUpsertEndpoint}
      />

      <AlertDialog
        open={!!endpointPendingDelete}
        onOpenChange={(open) => !open && setEndpointIdPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete endpoint</AlertDialogTitle>
            <AlertDialogDescription>{deleteEndpointDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          {endpointPendingDelete && (
            <pre className="mx-5 -mt-1 mb-5 overflow-auto whitespace-nowrap rounded-md border border-muted bg-surface-200 px-4 py-3 font-mono text-xs tracking-tight text-foreground">
              {endpointPendingDelete.url}
            </pre>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={handleDeleteEndpoint}>
              Delete endpoint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showRegenerateSecretConfirm} onOpenChange={setShowRegenerateSecretConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate secret</AlertDialogTitle>
            <AlertDialogDescription>
              This will rotate the current signing secret used for webhook signature verification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="warning" onClick={handleRegenerateSecret}>
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!signingSecretReveal}
        onOpenChange={(open) => {
          if (open) return
          setSigningSecretReveal(null)
          clearPendingSigningSecretReveal(scope)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Signing secret</AlertDialogTitle>
            <AlertDialogDescription>
              Use this secret to verify webhook signatures using the{' '}
              <InlineLink href="https://www.standardwebhooks.com/">Standard Webhooks</InlineLink>{' '}
              specification.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* Content */}
          <div className="space-y-4 mx-5 pb-5">
            <div className="space-y-1">
              <Label_Shadcn_>Signing secret</Label_Shadcn_>
              <Input
                copy
                readOnly
                value={signingSecretReveal?.signingSecret ?? ''}
                onChange={() => {}}
                onCopy={() => toast.success('Copied signing secret')}
              />
            </div>
            <div>
              <Admonition
                type="warning"
                title="This secret won’t be shown again"
                description="Copy and store it securely now. You will not be able to view or copy it again after closing this dialog."
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setSigningSecretReveal(null)
                clearPendingSigningSecretReveal(scope)
              }}
            >
              I’ve stored the secret
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
