import type { EnumeratedType } from 'data/enumerated-types/enumerated-types-query'
import { noop } from 'lodash'
import {
  Calendar,
  Check,
  ChevronsUpDown,
  ExternalLink,
  Hash,
  ListPlus,
  ToggleRight,
  Type,
} from 'lucide-react'
import Link from 'next/link'
import { ReactNode, useState } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  Command_Shadcn_,
  CriticalIcon,
  Input,
  Label_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
} from 'ui'

import {
  POSTGRES_DATA_TYPES,
  POSTGRES_DATA_TYPE_OPTIONS,
  RECOMMENDED_ALTERNATIVE_DATA_TYPE,
} from '../SidePanelEditor.constants'
import type { PostgresDataTypeOption } from '../SidePanelEditor.types'

interface ColumnTypeProps {
  value: string
  enumTypes: EnumeratedType[]
  className?: string
  error?: any
  disabled?: boolean
  showLabel?: boolean
  layout?: 'horizontal' | 'vertical'
  description?: ReactNode
  showRecommendation?: boolean
  onOptionSelect: (value: string) => void
}

const ColumnType = ({
  value,
  className,
  enumTypes = [],
  disabled = false,
  showLabel = true,
  layout = 'horizontal',
  description,
  showRecommendation = false,
  onOptionSelect = noop,
  error,
}: ColumnTypeProps) => {
  const [open, setOpen] = useState(false)
  const availableTypes = POSTGRES_DATA_TYPES.concat(
    enumTypes.map((type) => type.format.replaceAll('"', ''))
  )
  const isAvailableType = value ? availableTypes.includes(value) : true
  const recommendation = RECOMMENDED_ALTERNATIVE_DATA_TYPE[value]

  const unsupportedDataTypeText = `This column's data type cannot be changed via the Table Editor as it is not supported yet. You can do so through the SQL Editor instead.`

  const getOptionByName = (name: string) => {
    // handle built in types
    const pgOption = POSTGRES_DATA_TYPE_OPTIONS.find((option) => option.name === name)
    if (pgOption) return pgOption

    // handle custom enums
    const enumType = enumTypes.find((type) => type.format === name)
    return enumType ? { ...enumType, type: 'enum' } : undefined
  }

  const inferIcon = (type: string) => {
    switch (type) {
      case 'number':
        return <Hash size={14} className="text-foreground" strokeWidth={1.5} />
      case 'time':
        return <Calendar size={14} className="text-foreground" strokeWidth={1.5} />
      case 'text':
        return <Type size={14} className="text-foreground" strokeWidth={1.5} />
      case 'json':
        return (
          <div className="text-foreground" style={{ padding: '0px 1px' }}>
            {'{ }'}
          </div>
        )
      case 'jsonb':
        return (
          <div className="text-foreground" style={{ padding: '0px 1px' }}>
            {'{ }'}
          </div>
        )
      case 'bool':
        return <ToggleRight size={14} className="text-foreground" strokeWidth={1.5} />
      default:
        return <ListPlus size={16} className="text-foreground" strokeWidth={1.5} />
    }
  }

  if (!isAvailableType) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Input
            readOnly
            disabled
            label={showLabel ? 'Type' : ''}
            layout={showLabel ? layout : undefined}
            className="md:gap-x-0 [&>div>div]:text-left"
            size="small"
            icon={inferIcon(POSTGRES_DATA_TYPE_OPTIONS.find((x) => x.name === value)?.type ?? '')}
            value={value}
            descriptionText={showLabel ? unsupportedDataTypeText : undefined}
          />
        </TooltipTrigger>
        {!showLabel && (
          <TooltipContent side="bottom" className="w-80">
            {unsupportedDataTypeText}
          </TooltipContent>
        )}
      </Tooltip>
    )
  }

  if (disabled && !showLabel) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Input
            readOnly
            disabled
            label={showLabel ? 'Type' : ''}
            layout={showLabel ? 'horizontal' : undefined}
            className="md:gap-x-0"
            size="small"
            value={value}
          />
        </TooltipTrigger>
        {!showLabel && description && (
          <TooltipContent side="bottom">
            <div className="w-80">{description}</div>
          </TooltipContent>
        )}
      </Tooltip>
    )
  }

  return (
    <div className={cn('flex flex-col gap-y-2', className)}>
      {showLabel && <Label_Shadcn_ className="text-foreground-light">Type</Label_Shadcn_>}
      <Popover_Shadcn_ modal open={open} onOpenChange={setOpen}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type={error ? 'danger' : 'default'}
            role="combobox"
            size={'small'}
            aria-expanded={open}
            className={cn('w-full justify-between', !value && 'text-foreground-lighter')}
            iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
          >
            {value ? (
              <div className="flex gap-2 items-center">
                <span>{inferIcon(getOptionByName(value)?.type ?? '')}</span>
                {value.replaceAll('"', '')}
              </div>
            ) : (
              'Choose a column type...'
            )}
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="w-[460px] p-0" side="bottom" align="center">
          <Command_Shadcn_>
            <CommandInput_Shadcn_
              placeholder="Search types..."
              // [Joshen] Addresses style issues when this component is being used in the old Form component
              // Specifically in WrapperDynamicColumns - can be cleaned up once we're no longer using that
              className="!bg-transparent focus:!shadow-none focus:!ring-0 text-xs"
            />
            <CommandEmpty_Shadcn_>Type not found.</CommandEmpty_Shadcn_>

            <CommandList_Shadcn_>
              <ScrollArea className="h-[240px]">
                <CommandGroup_Shadcn_ heading="Postgres data types">
                  {POSTGRES_DATA_TYPE_OPTIONS.map((option: PostgresDataTypeOption) => (
                    <CommandItem_Shadcn_
                      key={option.name}
                      value={option.name}
                      className={cn('relative', option.name === value ? 'bg-surface-200' : '')}
                      onSelect={(value: string) => {
                        onOptionSelect(value)
                        setOpen(false)
                      }}
                    >
                      <div className="flex items-center gap-2 pr-6">
                        <span>{inferIcon(option.type)}</span>
                        <span className="text-foreground">{option.name}</span>
                        <span className="text-foreground-lighter">{option.description}</span>
                      </div>
                      <span className="absolute right-3 top-2">
                        {option.name === value ? <Check className="text-brand" size={14} /> : ''}
                      </span>
                    </CommandItem_Shadcn_>
                  ))}
                </CommandGroup_Shadcn_>

                {enumTypes.length > 0 && (
                  <>
                    <CommandSeparator_Shadcn_ />
                    <CommandGroup_Shadcn_ heading="Other types">
                      {enumTypes.map((option) => (
                        <CommandItem_Shadcn_
                          key={option.id}
                          value={option.format}
                          className={cn(
                            'relative',
                            option.format === value ? 'bg-surface-200' : ''
                          )}
                          onSelect={(value: string) => {
                            // [Joshen] For camel case types specifically, format property includes escaped double quotes
                            // which will cause the POST columns call to error out. So we strip it specifically in this context
                            onOptionSelect(
                              option.schema === 'public' ? value.replaceAll('"', '') : value
                            )
                            setOpen(false)
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <div>
                              <ListPlus size={16} className="text-foreground" strokeWidth={1.5} />
                            </div>
                            <span className="text-foreground">
                              {option.format.replaceAll('"', '')}
                            </span>
                            {option.comment !== undefined && (
                              <span
                                title={option.comment ?? ''}
                                className="text-foreground-lighter"
                              >
                                {option.comment}
                              </span>
                            )}
                            {option.format === value && (
                              <span className="absolute right-3 top-2">
                                <Check className="text-brand" size={14} />
                              </span>
                            )}
                          </div>
                        </CommandItem_Shadcn_>
                      ))}
                    </CommandGroup_Shadcn_>
                  </>
                )}
              </ScrollArea>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>

      {showRecommendation && recommendation !== undefined && (
        <Alert_Shadcn_ variant="warning" className="mt-2">
          <CriticalIcon />
          <AlertTitle_Shadcn_>
            {' '}
            It is recommended to use{' '}
            <code className="text-code-inline">{recommendation.alternative}</code> instead
          </AlertTitle_Shadcn_>
          <AlertDescription_Shadcn_>
            <p>
              Postgres recommends against using the data type{' '}
              <code className="text-code-inline">{value}</code> unless you have a very specific use
              case.
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
          </AlertDescription_Shadcn_>
        </Alert_Shadcn_>
      )}
    </div>
  )
}

export default ColumnType
