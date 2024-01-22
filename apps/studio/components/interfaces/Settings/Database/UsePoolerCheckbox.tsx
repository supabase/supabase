import { useParams } from 'common'
import { Badge, Checkbox_Shadcn_ } from 'ui'

import { Markdown } from 'components/interfaces/Markdown'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'

interface UsePoolerCheckboxInterface {
  id: string
  checked: boolean
  onCheckedChange: (value: boolean) => void
}

export const UsePoolerCheckbox = ({ id, checked, onCheckedChange }: UsePoolerCheckboxInterface) => {
  const { ref: projectRef } = useParams()
  const { data, isSuccess } = usePoolingConfigurationQuery({ projectRef })

  // [Joshen] TODO this needs to be obtained from BE as 26th Jan is when we'll start - projects will be affected at different rates
  const resolvesToIpV6 = !data?.supavisor_enabled && false // Number(new Date()) > Number(dayjs.utc('01-26-2024', 'MM-DD-YYYY').toDate())

  return (
    <div className="flex gap-x-3">
      <Checkbox_Shadcn_
        id={`use-pooler-${id}`}
        checked={checked}
        onCheckedChange={() => onCheckedChange(!checked)}
      />
      <div className="-mt-[2px] flex flex-col gap-y-1 w-full">
        <label htmlFor={`use-pooler-${id}`} className="text-sm cursor-pointer">
          Use connection pooling
          {isSuccess && checked && data.supavisor_enabled && (
            <Badge color="scale" className="ml-2">
              Supavisor
            </Badge>
          )}
          <Badge color="scale" className="ml-2">
            {checked
              ? 'Resolves to IPv4'
              : resolvesToIpV6
              ? 'Resolves to IPv6'
              : 'Resolves to IPv4'}
          </Badge>
        </label>
        <Markdown
          extLinks
          className="[&>p]:m-0 space-y-1 text-foreground-lighter max-w-full"
          content={`
IPv4 and IPv6 connections will resolve while using connection pooling\n
A connection pooler is useful for managing a large number of temporary connections. [Learn more](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)`}
        />
      </div>
    </div>
  )
}
