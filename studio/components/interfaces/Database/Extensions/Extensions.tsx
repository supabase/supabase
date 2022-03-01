import { FC, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { partition, isNull } from 'lodash'
import { Input, IconSearch, Typography } from '@supabase/ui'

import { useStore } from 'hooks'
import ExtensionCard from './ExtensionCard'

interface Props {}

const Extensions: FC<Props> = ({}) => {
  const { meta } = useStore()
  const [filterString, setFilterString] = useState<string>('')

  const extensions =
    filterString.length === 0
      ? meta.extensions.list()
      : meta.extensions.list((ext: any) => ext.name.includes(filterString))
  const [enabledExtensions, disabledExtensions] = partition(
    extensions,
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

      <div className="w-full my-8 space-y-12">
        {enabledExtensions.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg">Enabled</h4>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-4">
              {enabledExtensions.map((extension) => (
                <ExtensionCard key={extension.name} extension={extension} />
              ))}
            </div>
          </div>
        )}

        {disabledExtensions.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg">Extensions</h4>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 mb-4">
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
