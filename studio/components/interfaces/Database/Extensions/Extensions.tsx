import { PermissionAction } from '@supabase/shared-types/out/constants'
import { isNull, partition } from 'lodash'
import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button, IconAlertCircle, IconBookOpen, IconSearch, Input } from 'ui'

import { useParams } from 'common/hooks'
import InformationBox from 'components/ui/InformationBox'
import NoSearchResults from 'components/ui/NoSearchResults'
import { useCheckPermissions, useStore } from 'hooks'
import ExtensionCard from './ExtensionCard'
import { HIDDEN_EXTENSIONS } from './Extensions.constants'

const Extensions = () => {
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

  const canUpdateExtensions = useCheckPermissions(
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

      {extensions.length === 0 && (
        <NoSearchResults searchString={filterString} onResetFilter={() => setFilterString('')} />
      )}

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
