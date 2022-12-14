import dayjs from 'dayjs'
import { FC, useState } from 'react'
import {
  Button,
  IconEye,
  IconEyeOff,
  IconTrash,
  Input,
  Dropdown,
  IconEdit3,
  IconKey,
  IconMoreVertical,
  IconLoader,
} from 'ui'
import { VaultSecret } from 'types'
import { useParams, useStore } from 'hooks'
import Link from 'next/link'

interface Props {
  secret: VaultSecret
  onSelectEdit: (secret: any) => void
  onSelectRemove: (secret: any) => void
}

const SecretRow: FC<Props> = ({ secret, onSelectEdit, onSelectRemove }) => {
  const { vault } = useStore()
  const { ref } = useParams()

  const [isLoading, setIsLoading] = useState(false)
  const [revealedValue, setRevealedValue] = useState<string>()
  const name = secret?.name ?? 'No name provided'

  const revealSecret = async () => {
    setIsLoading(true)
    if (revealedValue === undefined) {
      setRevealedValue(
        secret.decryptedSecret !== undefined
          ? secret.decryptedSecret
          : await vault.fetchSecretValue(secret.id)
      )
    } else {
      setRevealedValue(undefined)
    }
    setIsLoading(false)
  }

  return (
    <div className="px-6 py-4 flex items-center space-x-4">
      <div className="space-y-1 min-w-[35%] max-w-[35%]">
        <div>
          <p className="text-sm text-scale-1200" title={name}>
            {name}
          </p>
          {secret.description !== undefined && (
            <p className="text-sm text-scale-1100" title={secret.description}>
              {secret.description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2 group">
          <IconKey
            size={14}
            strokeWidth={2}
            className="text-scale-1000 transition group-hover:text-brand-900"
          />
          <Link href={`/project/${ref}/settings/vault/keys?id=${secret.key_id}`}>
            <a
              className="text-scale-1100 font-mono text-xs cursor-pointer transition group-hover:text-brand-900"
              title={secret.key_id}
            >
              {secret.key_id}
            </a>
          </Link>
        </div>
      </div>
      <div className="flex items-center space-x-2 w-[40%]">
        <Button
          type="text"
          className="px-1.5"
          icon={
            isLoading ? (
              <IconLoader className="animate-spin" size={16} strokeWidth={1.5} />
            ) : revealedValue === undefined ? (
              <IconEye size={16} strokeWidth={1.5} />
            ) : (
              <IconEyeOff size={16} strokeWidth={1.5} />
            )
          }
          onClick={() => revealSecret()}
        />
        <div className="flex-grow">
          {revealedValue === undefined ? (
            <p className="text-sm font-mono">••••••••••••••••••</p>
          ) : (
            <Input copy size="small" className="font-mono" value={revealedValue} />
          )}
        </div>
      </div>
      <div className="flex items-center justify-end w-[25%] space-x-4">
        <p className="text-sm text-scale-1100">
          {secret.updated_at === secret.created_at ? 'Added' : 'Updated'} on{' '}
          {dayjs(secret.updated_at).format('MMM D, YYYY')}
        </p>
        <Dropdown
          side="bottom"
          className="w-[120px]"
          overlay={
            <>
              <Dropdown.Item icon={<IconEdit3 size="tiny" />} onClick={() => onSelectEdit(secret)}>
                Edit
              </Dropdown.Item>
              <Dropdown.Item
                icon={<IconTrash stroke="red" size="tiny" />}
                onClick={() => onSelectRemove(secret)}
              >
                Delete
              </Dropdown.Item>
            </>
          }
        >
          <Button as="span" type="text" className="px-1" icon={<IconMoreVertical />} />
        </Dropdown>
      </div>
    </div>
  )
}

export default SecretRow
