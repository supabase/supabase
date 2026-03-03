import { useParams } from 'common'
import { BASE_PATH } from 'lib/constants'
import Image from 'next/image'

import { InlineLink } from '@/components/ui/InlineLink'

export const TableFilterBarPreview = () => {
  const { ref = '_' } = useParams()

  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground-light text-sm mb-4">
        An intuitive new way to filter your table data in the{' '}
        <InlineLink href={`/project/${ref}/editor`}>Table Editor</InlineLink>. Build complex filters
        visually with support for multiple data types (strings, numbers, dates, booleans) and
        operators. The new interface makes it easier to understand and modify your filters at a
        glance.
      </p>
      <Image
        src={`${BASE_PATH}/img/previews/table-filter-bar-preview.png`}
        width={1296}
        height={900}
        alt="table-filter-bar-preview"
        className="rounded border"
      />
      <div className="space-y-2 !mt-4">
        <p className="text-sm">Enabling this preview will:</p>
        <ul className="list-disc pl-6 text-sm text-foreground-light space-y-1">
          <li>Replace the existing filter input with a new visual filter bar</li>
          <li>
            Add support for date filtering with preset ranges (Today, Yesterday, Last 7 days, etc.)
          </li>
        </ul>
      </div>
    </div>
  )
}
