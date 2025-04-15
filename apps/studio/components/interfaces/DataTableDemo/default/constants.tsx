'use client'

import type { DataTableFilterField, Option } from '../components/data-table/types'
import { REGIONS } from '../constants/region'
import { tagColor, TAGS } from '../constants/tag'
import { cn } from '../lib/utils'
import { data } from './data'
import type { ColumnSchema } from './types'

export const filterFields = [
  {
    label: 'Time Range',
    value: 'date',
    type: 'timerange',
    defaultOpen: true,
    commandDisabled: true,
  },
  {
    label: 'URL',
    value: 'url',
    type: 'input',
    options: data.map(({ url }) => ({ label: url, value: url })),
  },
  {
    label: 'Public',
    value: 'public',
    type: 'checkbox',
    options: [true, false].map((bool) => ({ label: `${bool}`, value: bool })),
  },
  {
    label: 'Active',
    value: 'active',
    type: 'checkbox',
    options: [true, false].map((bool) => ({ label: `${bool}`, value: bool })),
  },
  {
    label: 'P95',
    value: 'p95',
    type: 'slider',
    min: 0,
    max: 3000,
    options: data.map(({ p95 }) => ({ label: `${p95}`, value: p95 })),
    defaultOpen: true,
  },
  {
    label: 'Regions',
    value: 'regions',
    type: 'checkbox',
    options: REGIONS.map((region) => ({ label: region, value: region })),
  },
  {
    label: 'Tags',
    value: 'tags',
    type: 'checkbox',
    defaultOpen: true,
    // REMINDER: "use client" needs to be declared in the file - otherwise getting serialization error from Server Component
    component: (props: Option) => {
      if (typeof props.value === 'boolean') return null
      if (typeof props.value === 'undefined') return null
      return (
        <div className="flex w-full items-center justify-between gap-2">
          <span className="truncate font-normal">{props.value}</span>
          <span className={cn('h-2 w-2 rounded-full', tagColor[props.value].dot)} />
        </div>
      )
    },
    options: TAGS.map((tag) => ({ label: tag, value: tag })),
  },
] satisfies DataTableFilterField<ColumnSchema>[]
