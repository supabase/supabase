import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { InlineLink } from '@/components/ui/InlineLink'
import { useAPIKeys } from '@/data/api-keys/api-keys-query'
import { fdwKeys } from '@/data/fdw/keys'
import { vaultSecretsKeys } from '@/data/vault/keys'
import { useVaultSecretUpdateMutation } from '@/data/vault/vault-secret-update-mutation'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const UpdateCatalogTokenDialog = ({ vaultTokenId }: { vaultTokenId?: string }) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const { can: canReadAPIKeys } = useAsyncCheckPermissions(PermissionAction.SECRETS_READ, '*')

  const [open, setOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string>()

  const { data: apiKeysData, isPending } = useAPIKeys(
    { projectRef: ref, reveal: true },
    { enabled: canReadAPIKeys }
  )
  const { allSecretKeys } = apiKeysData ?? {}

  const { mutate: updateVaultSecret, isPending: isUpdating } = useVaultSecretUpdateMutation({
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: fdwKeys.list(ref) }),
        queryClient.invalidateQueries({
          queryKey: vaultSecretsKeys.getDecryptedValue(ref, vaultTokenId),
        }),
      ])

      toast.success('Successfully updated catalog token!')
      setOpen(false)
    },
  })

  const onSubmit = () => {
    if (!project) return console.error('Project is required')
    if (!vaultTokenId) return toast.error('ID of catalog token is missing')

    updateVaultSecret({
      projectRef: project?.ref,
      connectionString: project?.connectionString,
      id: vaultTokenId,
      secret: selectedKey,
      skipClearCache: true,
    })
  }

  useEffect(() => {
    if (allSecretKeys?.length) setSelectedKey(allSecretKeys[0].api_key)
  }, [allSecretKeys])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="mt-1">
          Update catalog token
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Update Iceberg wrapper catalog token</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />

        {allSecretKeys?.length === 0 && (
          <Admonition
            type="default"
            title="Project has no API secret keys"
            className="rounded-none border-x-0 border-t-0"
          >
            <p>
              Create an API secret key from your{' '}
              <InlineLink href={`/project/${ref}/settings/api-keys`}>project's settings</InlineLink>{' '}
              first
            </p>
          </Admonition>
        )}
        <DialogSection>
          <FormItemLayout
            isReactForm={false}
            label="Select a secret key to use as your catalog token"
          >
            {isPending ? (
              <ShimmeringLoader className="py-4" />
            ) : (
              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {apiKeysData?.allSecretKeys.map((x) => (
                      <SelectItem key={x.id} value={x.api_key}>
                        {x.prefix} •••
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </FormItemLayout>
        </DialogSection>
        <DialogFooter>
          <Button variant="default" disabled={isUpdating} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!selectedKey}
            loading={isUpdating}
            onClick={() => onSubmit()}
          >
            Update token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
