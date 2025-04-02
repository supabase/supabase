import { noop } from 'lodash'
import { Plus } from 'lucide-react'
import {
  Input,
  SelectContent_Shadcn_,
  SelectGroup_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  Select_Shadcn_,
} from 'ui'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { usePgSodiumKeysQuery } from 'data/pg-sodium-keys/pg-sodium-keys-query'

interface EncryptionKeySelectorProps {
  nameId?: string
  label?: string
  labelOptional?: string
  selectedKeyId?: any
  error?: string
  onSelectKey: (keyId: string) => void
  onUpdateDescription?: (desc: string) => void
}

const EncryptionKeySelector = ({
  nameId = 'keyName',
  label = 'Encryption key',
  labelOptional,
  selectedKeyId,
  error,
  onSelectKey = noop,
  onUpdateDescription = noop,
}: EncryptionKeySelectorProps) => {
  const { project } = useProjectContext()

  const { data } = usePgSodiumKeysQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const keys = data || []

  return (
    <>
      <div className="space-y-2">
        {label && (
          <div className="flex flex-row gap-x-2 justify-between">
            <label className="block text-foreground-light text-sm break-all">{label}</label>
            {labelOptional && (
              <span className="text-foreground-lighter text-sm">{labelOptional}</span>
            )}
          </div>
        )}
        <Select_Shadcn_ value={selectedKeyId} onValueChange={onSelectKey}>
          <SelectTrigger_Shadcn_ className="w-full">
            {keys.find((key) => key.id === selectedKeyId)?.name || 'Select an encryption key'}
          </SelectTrigger_Shadcn_>
          <SelectContent_Shadcn_>
            <SelectGroup_Shadcn_>
              <SelectItem_Shadcn_ value="create-new">
                <span className="flex items-center gap-2">
                  <Plus size={16} strokeWidth={1.5} />
                  Create a new Encryption Key
                </span>
              </SelectItem_Shadcn_>
              {keys.length > 0 && (
                <>
                  <div className="h-px bg-border my-2" />
                  {keys.map((key) => (
                    <SelectItem_Shadcn_ key={key.id} value={key.id}>
                      <div className="space-y-1">
                        <p>{key.name || 'No name provided'}</p>
                        <p className="text-xs">
                          ID: <span className="font-mono">{key.id}</span>
                        </p>
                      </div>
                    </SelectItem_Shadcn_>
                  ))}
                </>
              )}
            </SelectGroup_Shadcn_>
          </SelectContent_Shadcn_>
        </Select_Shadcn_>
      </div>
      {selectedKeyId === 'create-new' && (
        <Input
          id={nameId}
          label="Name of encryption key"
          error={error}
          onChange={(event) => onUpdateDescription(event.target.value)}
          descriptionText="Provide a name for your key for easier identification"
        />
      )}
    </>
  )
}

export default EncryptionKeySelector
