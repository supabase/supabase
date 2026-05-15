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
import { ReactNode, useId, useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  cn,
  Command_Shadcn_,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  CommandSeparator_Shadcn_,
  CriticalIcon,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Label_Shadcn_,
  Popover,
  PopoverContent,
  PopoverTrigger,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  POSTGRES_DATA_TYPE_OPTIONS,
  POSTGRES_DATA_TYPES,
  RECOMMENDED_ALTERNATIVE_DATA_TYPE,
} from '../SidePanelEditor.constants'
import type { PostgresDataTypeOption } from '../SidePanelEditor.types'
import type { EnumeratedType } from '@/data/enumerated-types/enumerated-types-query'

export type ColumnTypeSelection = { format: string; formatSchema?: string }

interface ColumnTypeProps {
  value: ColumnTypeSelection
  enumTypes: EnumeratedType[]
  className?: string
  error?: any
  disabled?: boolean
  showLabel?: boolean
  layout?: 'horizontal' | 'vertical'
  description?: ReactNode
  showRecommendation?: boolean
  onOptionSelect: (selection: ColumnTypeSelection) => void
}

const renderValue = ({ format, formatSchema }: ColumnTypeSelection) =>
  formatSchema ? `${formatSchema}.${format}` : format

const matchesBuiltin = (optionName: string, value: ColumnTypeSelection) =>
  !value.formatSchema && optionName === value.format

const matchesEnum = (option: { name: string; schema: string }, value: ColumnTypeSelection) =>
  option.name === value.format && option.schema === (value.formatSchema || 'public')

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
  const listboxId = useId()
  const hasValue = value.format.length > 0
  const isAvailableType =
    !hasValue ||
    POSTGRES_DATA_TYPES.some((name) => matchesBuiltin(name, value)) ||
    enumTypes.some((option) => matchesEnum(option, value))
  const recommendation = !value.formatSchema
    ? RECOMMENDED_ALTERNATIVE_DATA_TYPE[value.format]
    : undefined
  const displayValue = renderValue(value)

  const unsupportedDataTypeText = `This column's data type cannot be changed via the Table Editor as it is not supported yet. You can do so through the SQL Editor instead.`

  const getOptionType = (selection: ColumnTypeSelection) => {
    const pgOption = POSTGRES_DATA_TYPE_OPTIONS.find((option) =>
      matchesBuiltin(option.name, selection)
    )
    if (pgOption) return pgOption.type
    const enumType = enumTypes.find((type) => matchesEnum(type, selection))
    return enumType ? 'enum' : ''
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
          <FormItemLayout
            layout={showLabel ? layout : undefined}
            label={showLabel ? 'Type' : ''}
            description={showLabel ? unsupportedDataTypeText : undefined}
            isReactForm={false}
          >
            <InputGroup>
              <InputGroupInput readOnly disabled size="small" value={displayValue} />
              <InputGroupAddon align="inline-start">
                {inferIcon(getOptionType(value))}
              </InputGroupAddon>
            </InputGroup>
          </FormItemLayout>
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
          <FormItemLayout
            layout={showLabel ? layout : undefined}
            label={showLabel ? 'Type' : ''}
            description={showLabel ? unsupportedDataTypeText : undefined}
            isReactForm={false}
          >
            <Input readOnly disabled size="small" value={displayValue} />
          </FormItemLayout>
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
      <Popover modal open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type={error ? 'danger' : 'default'}
            role="combobox"
            size={'small'}
            aria-expanded={open}
            aria-controls={listboxId}
            className={cn('w-full justify-between', !hasValue && 'text-foreground-lighter')}
            iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
            title={displayValue}
          >
            {hasValue ? (
              <div className="flex gap-2 items-center">
                <span>{inferIcon(getOptionType(value))}</span>
                <span className="block truncate">{displayValue}</span>
              </div>
            ) : (
              'Choose a column type...'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent id={listboxId} className="w-[460px] p-0" side="bottom" align="center">
          <Command_Shadcn_>
            <CommandInput_Shadcn_
              placeholder="Search types..."
              // [Joshen] Addresses style issues when this component is being used in the old Form component
              // Specifically in WrapperDynamicColumns - can be cleaned up once we're no longer using that
              className="bg-transparent! focus:shadow-none! focus:ring-0! text-xs"
            />
            <CommandEmpty_Shadcn_>Type not found.</CommandEmpty_Shadcn_>

            <CommandList_Shadcn_>
              <ScrollArea className="h-[240px]">
                <CommandGroup_Shadcn_ heading="Postgres data types">
                  {POSTGRES_DATA_TYPE_OPTIONS.map((option: PostgresDataTypeOption) => {
                    const isSelected = matchesBuiltin(option.name, value)
                    return (
                      <CommandItem_Shadcn_
                        key={option.name}
                        value={option.name}
                        className={cn('relative', isSelected ? 'bg-surface-200' : '')}
                        onSelect={() => {
                          onOptionSelect({ format: option.name })
                          setOpen(false)
                        }}
                      >
                        <div className="flex items-center gap-2 pr-6">
                          <span>{inferIcon(option.type)}</span>
                          <span className="text-foreground">{option.name}</span>
                          <span className="text-foreground-lighter">{option.description}</span>
                        </div>
                        <span className="absolute right-3 top-2">
                          {isSelected ? <Check className="text-brand" size={14} /> : ''}
                        </span>
                      </CommandItem_Shadcn_>
                    )
                  })}
                </CommandGroup_Shadcn_>

                {enumTypes.length > 0 && (
                  <>
                    <CommandSeparator_Shadcn_ />
                    <CommandGroup_Shadcn_ heading="Other types">
                      {enumTypes.map((option) => {
                        const isSelected = matchesEnum(option, value)
                        return (
                          <CommandItem_Shadcn_
                            key={option.id}
                            value={option.format}
                            className={cn('relative', isSelected ? 'bg-surface-200' : '')}
                            onSelect={() => {
                              onOptionSelect({
                                format: option.name,
                                formatSchema:
                                  option.schema === 'public' ? undefined : option.schema,
                              })
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
                              {isSelected && (
                                <span className="absolute right-3 top-2">
                                  <Check className="text-brand" size={14} />
                                </span>
                              )}
                            </div>
                          </CommandItem_Shadcn_>
                        )
                      })}
                    </CommandGroup_Shadcn_>
                  </>
                )}
              </ScrollArea>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent>
      </Popover>

      {showRecommendation && recommendation !== undefined && (
        <Alert variant="warning" className="mt-2">
          <CriticalIcon />
          <AlertTitle>
            {' '}
            It is recommended to use{' '}
            <code className="text-code-inline">{recommendation.alternative}</code> instead
          </AlertTitle>
          <AlertDescription>
            <p>
              Postgres recommends against using the data type{' '}
              <code className="text-code-inline">{displayValue}</code> unless you have a very
              specific use case.
            </p>
            <div className="flex items-center space-x-2 mt-3">
              <Button asChild type="default" icon={<ExternalLink />}>
                <Link href={recommendation.reference} target="_blank" rel="noreferrer">
                  Read more
                </Link>
              </Button>
              <Button
                type="primary"
                onClick={() => onOptionSelect({ format: recommendation.alternative })}
              >
                Use {recommendation.alternative}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default ColumnType
