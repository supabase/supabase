import { FC, useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { partition, isNull } from 'lodash'
import { Input, IconSearch, IconAlertCircle, Button, IconBookOpen } from 'ui'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useStore, checkPermissions, useParams } from 'hooks'
import ExtensionCard from './ExtensionCard'
import { HIDDEN_EXTENSIONS } from './Extensions.constants'
import NoSearchResults from 'components/to-be-cleaned/NoSearchResults'
import InformationBox from 'components/ui/InformationBox'
import Link from 'next/link'

interface Props {}

const Extensions: FC<Props> = ({}) => {
  const { meta } = useStore()
  const { filter } = useParams()
  const [filterString, setFilterString] = useState<string>('')

  const extensions =
    filterString.length === 0
      ? meta.extensions.list()
      : meta.extensions.list((ext: any) => ext.name.includes(filterString))
  const extensionsWithoutHidden = extensions.filter(
    (ext: any) => !HIDDEN_EXTENSIONS.includes(ext.name)
  )
  const [enabledExtensions, disabledExtensions] = partition(
    extensionsWithoutHidden,
    (ext: any) => !isNull(ext.installed_version)
  )

  const canUpdateExtensions = checkPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'extensions'
  )

  useEffect(() => {
    if (filter !== undefined) setFilterString(filter as string)
  }, [filter])

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <Input
            size="small"
            placeholder={'Filter'}
            value={filterString}
            onChange={(e) => setFilterString(e.target.value)}
            icon={<IconSearch size="tiny" />}
          />
          {!canUpdateExtensions ? (
            <div className="w-[500px]">
              <InformationBox
                icon={<IconAlertCircle className="text-scale-1100" strokeWidth={2} />}
                title="You need additional permissions to update database extensions"
              />
            </div>
          ) : (
            <Link passHref href="https://supabase.com/docs/guides/database/extensions">
              <a target="_blank" rel="noreferrer">
                <Button type="default" iconRight={<IconBookOpen />}>
                  Learn more about extensions
                </Button>
              </a>
            </Link>
          )}
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
