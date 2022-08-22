import { FC, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { partition, isNull } from 'lodash'
import { Input, IconSearch } from '@supabase/ui'

import { useStore, useFlag } from 'hooks'
import ExtensionCard from './ExtensionCard'
import { HIDDEN_EXTENSIONS } from './Extensions.constants'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'

interface Props {}

const Extensions: FC<Props> = ({}) => {
  const { meta } = useStore()
  const [filterString, setFilterString] = useState<string>('')

  const enableVaultExtension = useFlag('vaultExtension')
  const hiddenExtensions = enableVaultExtension
    ? HIDDEN_EXTENSIONS
    : HIDDEN_EXTENSIONS.concat(['vault'])

  const extensions =
    filterString.length === 0
      ? meta.extensions.list()
      : meta.extensions.list((ext: any) => ext.name.includes(filterString))
  const extensionsWithoutHidden = extensions.filter(
    (ext: any) => !hiddenExtensions.includes(ext.name)
  )
  const [enabledExtensions, disabledExtensions] = partition(
    extensionsWithoutHidden,
    (ext: any) => !isNull(ext.installed_version)
  )

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex">
          <Input
            size="small"
            placeholder={'Filter'}
            value={filterString}
            onChange={(e) => setFilterString(e.target.value)}
            icon={<IconSearch size="tiny" />}
          />
        </div>
      </div>

      {extensions.length === 0 && <NoSearchResults />}

      <div className="my-8 w-full space-y-12">
        {enabledExtensions.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg">Enabled extensions</h4>
            <div className="mb-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {enabledExtensions.map((extension) => (
                <ExtensionCard key={extension.name} extension={extension} />
              ))}
            </div>
          </div>
        )}

        {disabledExtensions.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg">Available extensions</h4>
            <div className="mb-4 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {disabledExtensions.map((extension) => (
                <ExtensionCard key={extension.name} extension={extension} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default observer(Extensions)
