import { useQuery, useQueryClient } from '@tanstack/react-query'
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
import { Admonition } from 'ui-patterns/Admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { ApiKeysAccessNote } from '@/components/ui/ApiKeysAccessNote'
import { InlineLink } from '@/components/ui/InlineLink'
import { getKeys, revealedApiKeysQueryOptions } from '@/data/api-keys/api-keys-query'
import { fdwKeys } from '@/data/fdw/keys'
import { vaultSecretsKeys } from '@/data/vault/keys'
import { useVaultSecretUpdateMutation } from '@/data/vault/vault-secret-update-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useGrant } from '@/lib/grants'

export const UpdateCatalogTokenDialog = ({ vaultTokenId }: { vaultTokenId?: string }) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const apiKeysGrant = useGrant(
    'GET /v1/projects/{ref}/api-keys',
    { projectRef: ref },
    { variant: 'reveal' }
  )

  const [open, setOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string>()

  const { data: apiKeysData, isPending } = useQuery(
    revealedApiKeysQueryOptions({ projectRef: ref, grant: apiKeysGrant.grant }, { select: getKeys })
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
        <Button className="mt-1">Update catalog token</Button>
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
            {apiKeysGrant.status === 'denied' || apiKeysGrant.status === 'error' ? (
              <ApiKeysAccessNote grant={apiKeysGrant} />
            ) : isPending ? (
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
          <Button disabled={isUpdating} onClick={() => setOpen(false)}>
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
