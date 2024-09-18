import * as Tooltip from '@radix-ui/react-tooltip'
import { noop } from 'lodash'
import Link from 'next/link'
import { ReactNode } from 'react'
import { Alert, Button, Input, Listbox } from 'ui'

import type { EnumeratedType } from 'data/enumerated-types/enumerated-types-query'
import { Calendar, Circle, ExternalLink, Hash, ListPlus, ToggleRight, Type } from 'lucide-react'
import {
  POSTGRES_DATA_TYPES,
  POSTGRES_DATA_TYPE_OPTIONS,
  RECOMMENDED_ALTERNATIVE_DATA_TYPE,
} from '../SidePanelEditor.constants'
import type { PostgresDataTypeOption } from '../SidePanelEditor.types'

interface ColumnTypeProps {
  value: string
  enumTypes: EnumeratedType[]
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
  layout?: 'vertical' | 'horizontal'
  className?: string
  error?: any
  disabled?: boolean
  showLabel?: boolean
  description?: ReactNode
  showRecommendation?: boolean
  onOptionSelect: (value: string) => void
}

const ColumnType = ({
  value,
  enumTypes = [],
  className,
  size = 'medium',
  layout,
  error,
  disabled = false,
  showLabel = true,
  description,
  showRecommendation = false,
  onOptionSelect = noop,
}: ColumnTypeProps) => {
  // @ts-ignore
  const availableTypes = POSTGRES_DATA_TYPES.concat(enumTypes.map((type) => type.name))
  const isAvailableType = value ? availableTypes.includes(value) : true
  const recommendation = RECOMMENDED_ALTERNATIVE_DATA_TYPE[value]

  const inferIcon = (type: string) => {
    switch (type) {
      case 'number':
        return <Hash size={16} className="text-foreground" strokeWidth={1.5} />
      case 'time':
        return <Calendar size={16} className="text-foreground" strokeWidth={1.5} />
      case 'text':
        return <Type size={16} className="text-foreground" strokeWidth={1.5} />
      case 'json':
        return (
          <div className="text-foreground" style={{ padding: '0px 1px' }}>
            {'{ }'}
          </div>
        )
      case 'bool':
        return <ToggleRight size={16} className="text-foreground" strokeWidth={1.5} />
      default:
        return <Circle size={16} className="text-foreground p-0.5" strokeWidth={1.5} />
    }
  }

  if (!isAvailableType) {
    return (
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger>
          <Input
            readOnly
            disabled
            label={showLabel ? 'Type' : ''}
            layout={showLabel ? 'horizontal' : undefined}
            className="md:gap-x-0"
            size="small"
            icon={inferIcon(POSTGRES_DATA_TYPE_OPTIONS.find((x) => x.name === value)?.type ?? '')}
            value={value}
            descriptionText={
              showLabel
                ? 'Custom non-native psql data types currently cannot be changed to a different data type via Supabase Studio'
                : ''
            }
          />
        </Tooltip.Trigger>
        {!showLabel && (
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow',
                  'border border-background w-[240px]',
                ].join(' ')}
              >
                <span className="text-xs text-foreground">
                  Custom non-native psql data types currently cannot be changed to a different data
                  type via Supabase Studio
                </span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    )
  }

  if (disabled && !showLabel) {
    return (
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger>
          <Input
            readOnly
            disabled
            label={showLabel ? 'Type' : ''}
            layout={showLabel ? 'horizontal' : undefined}
            className="md:gap-x-0"
            size="small"
            icon={inferIcon(POSTGRES_DATA_TYPE_OPTIONS.find((x) => x.name === value)?.type ?? '')}
            value={value}
          />
        </Tooltip.Trigger>
        {!showLabel && description && (
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow',
                  'border border-background w-[240px]',
                ].join(' ')}
              >
                <span className="text-xs text-foreground">{description}</span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
    )
  }

  return (
    <div className="space-y-2">
      <Listbox
        label={showLabel ? 'Type' : ''}
        layout={layout || (showLabel ? 'horizontal' : 'vertical')}
        value={value}
        size={size}
        error={error}
        disabled={disabled}
        // @ts-ignore
        descriptionText={description}
        className={`${className} ${disabled ? 'column-type-disabled' : ''} rounded-md`}
        onChange={(value: string) => onOptionSelect(value)}
        optionsWidth={480}
      >
        <Listbox.Option key="empty" value="" label="---">
          ---
        </Listbox.Option>

        {/*
          Weird issue with Listbox here
          1. Can't do render conditionally (&&) within Listbox hence why using Fragment
          2. Can't wrap these 2 components within a Fragment conditional (enumTypes.length)
            as selecting the enumType option will not render it in the Listbox component
        */}
        {enumTypes.length > 0 ? (
          <Listbox.Option disabled key="header-1" value="header-1" label="header-1">
            Other Data Types
          </Listbox.Option>
        ) : (
          <></>
        )}

        {enumTypes.length > 0 ? (
          // @ts-ignore
          enumTypes.map((enumType: PostgresType) => (
            <Listbox.Option
              key={enumType.name}
              value={enumType.name}
              label={enumType.name}
              addOnBefore={() => {
                return <ListPlus size={16} className="text-foreground" strokeWidth={1.5} />
              }}
            >
              <div className="flex items-center space-x-4">
                <p className="text-foreground">{enumType.name}</p>
                {enumType.comment !== undefined && (
                  <p className="text-foreground-lighter">{enumType.comment}</p>
                )}
              </div>
            </Listbox.Option>
          ))
        ) : (
          <></>
        )}

        <Listbox.Option disabled value="header-2" label="header-2">
          PostgreSQL Data Types
        </Listbox.Option>

        {POSTGRES_DATA_TYPE_OPTIONS.map((option: PostgresDataTypeOption) => (
          <Listbox.Option
            key={option.name}
            value={option.name}
            label={option.name}
            addOnBefore={() => inferIcon(option.type)}
          >
            <div className="flex items-center space-x-4">
              <span className="text-foreground">{option.name}</span>
              <span className="text-foreground-lighter">{option.description}</span>
            </div>
          </Listbox.Option>
        ))}
      </Listbox>
      {showRecommendation && recommendation !== undefined && (
        <Alert
          withIcon
          variant="warning"
          title={
            <>
              It is recommended to use <code className="text-xs">{recommendation.alternative}</code>{' '}
              instead
            </>
          }
        >
          <p>
            Postgres recommends against using the data type <code className="text-xs">{value}</code>{' '}
            unless you have a very specific use case.
          </p>
          <div className="flex items-center space-x-2 mt-3">
            <Button asChild type="default" icon={<ExternalLink />}>
              <Link href={recommendation.reference} target="_blank" rel="noreferrer">
                Read more
              </Link>
            </Button>
            <Button type="primary" onClick={() => onOptionSelect(recommendation.alternative)}>
              Use {recommendation.alternative}
            </Button>
          </div>
        </Alert>
      )}
    </div>
  )
}

export default ColumnType
