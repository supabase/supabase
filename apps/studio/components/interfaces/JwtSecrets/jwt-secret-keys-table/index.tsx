import { AnimatePresence } from 'framer-motion'
import { RotateCw, Timer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useLegacyAPIKeysStatusQuery } from 'data/api-keys/legacy-api-keys-status-query'
import { useJWTSigningKeyDeleteMutation } from 'data/jwt-signing-keys/jwt-signing-key-delete-mutation'
import { useJWTSigningKeyUpdateMutation } from 'data/jwt-signing-keys/jwt-signing-key-update-mutation'
import { JWTSigningKey, useJWTSigningKeysQuery } from 'data/jwt-signing-keys/jwt-signing-keys-query'
import { useLegacyJWTSigningKeyCreateMutation } from 'data/jwt-signing-keys/legacy-jwt-signing-key-create-mutation'
import { useLegacyJWTSigningKeyQuery } from 'data/jwt-signing-keys/legacy-jwt-signing-key-query'
import { useFlag } from 'hooks/ui/useFlag'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import TextConfirmModal from 'ui-patterns/Dialogs/TextConfirmModal'
import { SigningKeysComingSoonBanner } from '../signing-keys-coming-soon'
import { StartUsingJwtSigningKeysBanner } from '../start-using-keys-banner'
import { ActionPanel } from './action-panel'
import { CreateKeyDialog } from './create-key-dialog'
import { KeyDetailsDialog } from './key-details-dialog'
import { RotateKeyDialog } from './rotate-key-dialog'
import { SigningKeyRow } from './signing-key-row'

type DialogType = 'legacy' | 'create' | 'rotate' | 'key-details' | 'revoke' | 'delete'

export default function JWTSecretKeysTable() {
  const { ref: projectRef } = useParams()
  const { project, isLoading: isProjectLoading } = useProjectContext()

  const newJwtSecrets = useFlag('newJwtSecrets')

  const [selectedKey, setSelectedKey] = useState<JWTSigningKey>()
  const [selectedKeyToUpdate, setSelectedKeyToUpdate] = useState<string>()
  const [shownDialog, setShownDialog] = useState<DialogType>()

  const { data: signingKeys, isLoading: isLoadingSigningKeys } = useJWTSigningKeysQuery({
    projectRef,
  })
  const { data: legacyKey, isLoading: isLoadingLegacyKey } = useLegacyJWTSigningKeyQuery({
    projectRef,
  })
  const { data: legacyAPIKeysStatus, isLoading: isLoadingLegacyAPIKeysStatus } =
    useLegacyAPIKeysStatusQuery({ projectRef })

  const { mutate: migrateJWTSecret, isLoading: isMigrating } = useLegacyJWTSigningKeyCreateMutation(
    {
      onSuccess: () => {
        setShownDialog(undefined)
        toast.success('Successfully migrated JWT secret!')
      },
    }
  )

  const { mutate: updateJWTSigningKey, isLoading: isUpdatingJWTSigningKey } =
    useJWTSigningKeyUpdateMutation({
      onSuccess: () => {
        resetDialog()
        setSelectedKeyToUpdate(undefined)
      },
    })
  const { mutate: deleteJWTSigningKey, isLoading: isDeletingJWTSigningKey } =
    useJWTSigningKeyDeleteMutation({ onSuccess: () => resetDialog(), onError: () => resetDialog() })

  const isLoadingMutation = isUpdatingJWTSigningKey || isDeletingJWTSigningKey || isMigrating
  const isLoading =
    isProjectLoading || isLoadingSigningKeys || isLoadingLegacyKey || isLoadingLegacyAPIKeysStatus

  const sortedKeys = useMemo(() => {
    if (!signingKeys || !Array.isArray(signingKeys.keys)) return []

    return signingKeys.keys.sort((a: JWTSigningKey, b: JWTSigningKey) => {
      const order: Record<JWTSigningKey['status'], number> = {
        standby: 0,
        in_use: 1,
        previously_used: 2,
        revoked: 3,
      }
      return (
        order[a.status] - order[b.status] ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    })
  }, [signingKeys])

  const standbyKey = useMemo(() => sortedKeys.find((key) => key.status === 'standby'), [sortedKeys])
  const inUseKey = useMemo(() => sortedKeys.find((key) => key.status === 'in_use'), [sortedKeys])
  const previouslyUsedKeys = useMemo(
    () => sortedKeys.filter((key) => key.status === 'previously_used'),
    [sortedKeys]
  )
  const revokedKeys = useMemo(
    () => sortedKeys.filter((key) => key.status === 'revoked'),
    [sortedKeys]
  )

  const resetDialog = () => {
    setSelectedKey(undefined)
    setShownDialog(undefined)
  }

  const handlePreviouslyUsedKey = async (keyId: string) => {
    setSelectedKeyToUpdate(keyId)
    updateJWTSigningKey(
      { projectRef, keyId, status: 'previously_used' },
      { onSuccess: () => toast.success('Successfully moved key to previously used') }
    )
  }

  const handleStandbyKey = (keyId: string) => {
    setSelectedKeyToUpdate(keyId)
    updateJWTSigningKey(
      { projectRef: projectRef!, keyId, status: 'standby' },
      { onSuccess: () => toast.success('Successfully moved key to standby') }
    )
  }

  const handleRevokeKey = (keyId: string) => {
    updateJWTSigningKey(
      { projectRef: projectRef!, keyId, status: 'revoked' },
      { onSuccess: () => toast.success('Successfully revoked key') }
    )
  }

  const handleDeleteKey = (keyId: string) => {
    deleteJWTSigningKey(
      { projectRef: projectRef!, keyId },
      { onSuccess: () => toast.success('Successfully deleted key') }
    )
  }

  if (isLoading) {
    return <GenericSkeletonLoader />
  }

  if (!newJwtSecrets) {
    return <SigningKeysComingSoonBanner />
  }

  return (
    <>
      <div className="-space-y-px">
        {legacyKey ? (
          <>
            {standbyKey && (
              <ActionPanel
                title="Rotate Signing Key"
                description="Switch the standby key to in use. All new JSON Web Tokens issued by Supabase Auth will be signed with this key."
                buttonLabel="Rotate keys"
                onClick={() => setShownDialog('rotate')}
                loading={isUpdatingJWTSigningKey}
                icon={<RotateCw className="size-4" />}
                type="primary"
              />
            )}

            {!standbyKey && (
              <ActionPanel
                title="Create standby key"
                description="Set up a new key which you can switch to once it has been picked up by all components of your application."
                buttonLabel="Create Standby Key"
                onClick={() => setShownDialog('create')}
                loading={isLoadingMutation}
                type="primary"
                icon={<Timer className="size-4" />}
              />
            )}
          </>
        ) : (
          <StartUsingJwtSigningKeysBanner
            onClick={() => setShownDialog('legacy')}
            isLoading={isMigrating}
          />
        )}
      </div>

      {sortedKeys.length > 0 && (
        <>
          <div>
            <Card className="w-full overflow-hidden bg-surface-100 border rounded-md">
              <CardContent className="p-0">
                <Table className="p-5">
                  <TableHeader className="bg-200">
                    <TableRow>
                      <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2 pr-0 w-20">
                        Status
                      </TableHead>
                      <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2 pl-0">
                        Key ID
                      </TableHead>
                      <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2">
                        Type
                      </TableHead>
                      <TableHead className="text-right font-mono uppercase text-xs text-foreground-muted h-auto py-2">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {standbyKey && (
                        <SigningKeyRow
                          key={standbyKey.id}
                          signingKey={standbyKey}
                          legacyKey={legacyKey}
                          standbyKey={standbyKey}
                          isLoading={
                            selectedKeyToUpdate === standbyKey.id && isUpdatingJWTSigningKey
                          }
                          setSelectedKey={setSelectedKey}
                          setShownDialog={setShownDialog}
                          handleStandbyKey={handleStandbyKey}
                          handlePreviouslyUsedKey={handlePreviouslyUsedKey}
                        />
                      )}
                      {inUseKey && (
                        <SigningKeyRow
                          key={inUseKey.id}
                          signingKey={inUseKey}
                          setSelectedKey={setSelectedKey}
                          setShownDialog={setShownDialog}
                          handleStandbyKey={handleStandbyKey}
                          handlePreviouslyUsedKey={handlePreviouslyUsedKey}
                          legacyKey={legacyKey}
                          standbyKey={standbyKey}
                        />
                      )}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <h2>Previously used keys</h2>
              <p className="text-sm text-foreground-lighter">
                These JWT signing keys are still used to{' '}
                <em className="text-brand not-italic">verify tokens</em> that are yet to expire.
                Revoke once all tokens have expired.
              </p>
            </div>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {previouslyUsedKeys.length > 0 ? (
                  <Table className="p-5">
                    <TableHeader className="bg-200">
                      <TableRow>
                        <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2 pr-0 w-20">
                          Status
                        </TableHead>
                        <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2 pl-0">
                          Key ID
                        </TableHead>
                        <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2">
                          Type
                        </TableHead>
                        <TableHead className="text-right font-mono uppercase text-xs text-foreground-muted h-auto py-2 hidden lg:table-cell">
                          Last rotated at
                        </TableHead>
                        <TableHead className="text-right font-mono uppercase text-xs text-foreground-muted h-auto py-2">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {previouslyUsedKeys.map((key) => (
                          <SigningKeyRow
                            key={key.id}
                            signingKey={key}
                            legacyKey={legacyKey}
                            standbyKey={standbyKey}
                            isLoading={selectedKeyToUpdate === key.id && isUpdatingJWTSigningKey}
                            setSelectedKey={setSelectedKey}
                            setShownDialog={setShownDialog}
                            handleStandbyKey={handleStandbyKey}
                            handlePreviouslyUsedKey={handlePreviouslyUsedKey}
                          />
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center text-foreground-light p-8 gap-2">
                    <Timer className="size-6 text-foreground-lighter" />
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">No previously used keys</p>
                      <p className="text-xs text-foreground-lighter">
                        Rotated keys will appear here for verification of existing tokens
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {revokedKeys.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2>Revoked keys</h2>
            <p className="text-sm text-foreground-lighter">
              These keys are no longer used to verify or sign JWTs.
            </p>
          </div>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <Table className="p-5">
                <TableHeader className="bg-200">
                  <TableRow>
                    <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2 pr-0 w-20">
                      Status
                    </TableHead>
                    <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2 pl-0">
                      Key ID
                    </TableHead>
                    <TableHead className="text-left font-mono uppercase text-xs text-foreground-muted h-auto py-2">
                      Type
                    </TableHead>
                    <TableHead className="text-right font-mono uppercase text-xs text-foreground-muted h-auto py-2 hidden lg:table-cell">
                      Last rotated at
                    </TableHead>
                    <TableHead className="text-right font-mono uppercase text-xs text-foreground-muted h-auto py-2">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {revokedKeys.map((key) => (
                      <SigningKeyRow
                        key={key.id}
                        signingKey={key}
                        setSelectedKey={setSelectedKey}
                        setShownDialog={setShownDialog}
                        handleStandbyKey={handleStandbyKey}
                        handlePreviouslyUsedKey={handlePreviouslyUsedKey}
                        legacyKey={legacyKey}
                        standbyKey={standbyKey}
                      />
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TODO(hf): For launch <div>
        <h2 className="text-xl mb-4">Resources</h2>

        <div className="flex flex-col lg:flex-row gap-6">
          <Card className="bg-surface-75 overflow-hidden">
            <div className="flex">
              <div className="bg-surface-200 px-0 flex items-center justify-center w-[180px]">
                <WhyRotateKeysIllustration />
              </div>
              <div className="flex-1 pl-8 border-l h-full py-6 px-5">
                <h4 className="text-sm">Why Rotate keys?</h4>
                <p className="text-xs text-foreground-light mb-4 max-w-xs">
                  Create Standby keys ahead of time which can then be promoted to 'In use' at any
                  time.
                </p>
                <Button type="outline" icon={<Book />}>
                  View guide
                </Button>
              </div>
            </div>
          </Card>

          <Card className="bg-surface-75 overflow-hidden">
            <div className="flex">
              <div className="bg-surface-200 px-0 flex items-center justify-center w-[180px]">
                <WhyUseStandbyKeysIllustration />
              </div>
              <div className="flex-1 pl-8 border-l h-full py-6 px-5">
                <h4 className="text-sm">Why use a Standby key?</h4>
                <p className="text-xs text-foreground-light mb-4 max-w-xs">
                  Create Standby keys ahead of time which can then be promoted to 'In use' at any
                  time.
                </p>
                <Button type="outline" icon={<Book />}>
                  View guide
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div> */}

      <Dialog open={shownDialog === 'legacy'} onOpenChange={resetDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Start using new JWT signing keys</DialogTitle>
          </DialogHeader>
          <DialogSectionSeparator />
          <DialogSection className="flex flex-col gap-2 text-sm text-foreground-light">
            <p>
              Your project today uses a legacy symmetric JWT secret to create JWTs. To be able to
              use an asymmetric JWT signing key you first have to migrate it to the new approach.
            </p>
            <p>This change does not cause any downtime on your project.</p>
          </DialogSection>
          <DialogFooter>
            <Button
              loading={isMigrating}
              onClick={() => migrateJWTSecret({ projectRef: projectRef! })}
            >
              Migrate JWT secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={shownDialog === 'create'} onOpenChange={resetDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <CreateKeyDialog projectRef={projectRef!} onClose={resetDialog} />
        </DialogContent>
      </Dialog>

      {standbyKey && inUseKey && projectRef && (
        <Dialog open={shownDialog === 'rotate'} onOpenChange={resetDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <RotateKeyDialog
              projectRef={projectRef}
              standbyKey={standbyKey}
              inUseKey={inUseKey}
              onClose={resetDialog}
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedKey && project && (
        <Dialog open={shownDialog === 'key-details'} onOpenChange={resetDialog}>
          <DialogContent className="sm:max-w-lg">
            <KeyDetailsDialog
              selectedKey={selectedKey}
              restURL={project.restUrl}
              onClose={resetDialog}
            />
          </DialogContent>
        </Dialog>
      )}

      {selectedKey &&
        selectedKey.status === 'previously_used' &&
        (legacyKey?.id !== selectedKey.id || !(legacyAPIKeysStatus?.enabled ?? false)) && (
          <TextConfirmModal
            visible={shownDialog === 'revoke'}
            loading={isLoadingMutation}
            onConfirm={() => handleRevokeKey(selectedKey.id)}
            onCancel={resetDialog}
            title={`Revoke ${selectedKey.id}`}
            confirmString={selectedKey.id}
            confirmLabel="Yes, revoke this signing key"
            confirmPlaceholder="Type the ID of the key to confirm"
            variant="destructive"
            alert={{
              title: 'This key will no longer be trusted!',
              description:
                'By revoking a signing key, all applications trusting it will no longer do so. If there are JWTs (access tokens) that are valid at the time of revocation, they will no longer be trusted, causing users with such JWTs to be signed out.',
            }}
          />
        )}

      {selectedKey &&
        selectedKey.status === 'previously_used' &&
        legacyKey?.id === selectedKey.id &&
        (legacyAPIKeysStatus?.enabled ?? true) && (
          <AlertDialog open={shownDialog === 'revoke'} onOpenChange={() => resetDialog()}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disable JWT-based legacy API keys first</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogDescription>
                It's not possible to revoke the legacy JWT secret unless you have already disabled
                JWT-based legacy API keys. This is because revoking the JWT secret invalidates the
                JWT-based legacy API keys.
              </AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>OK</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

      {selectedKey && selectedKey.status === 'revoked' && (
        <TextConfirmModal
          visible={shownDialog === 'delete'}
          loading={isLoadingMutation}
          onConfirm={() => handleDeleteKey(selectedKey.id)}
          onCancel={resetDialog}
          title={`Permanently delete ${selectedKey.id}`}
          confirmString={selectedKey.id}
          confirmLabel="Yes, permanently delete this key"
          confirmPlaceholder="Type the ID of the key to confirm"
          variant="destructive"
          alert={{
            title: 'This key will be permanently deleted.',
            description:
              'The private key and all information about this key will be permanently deleted from our records. This action cannot be undone.',
          }}
        />
      )}
    </>
  )
}
