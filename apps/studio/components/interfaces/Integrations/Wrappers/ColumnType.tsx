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
import { Control } from 'react-hook-form'
import {
  Alert_Shadcn_,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  Input_Shadcn_,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  ScrollArea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import {
  POSTGRES_DATA_TYPE_OPTIONS,
  POSTGRES_DATA_TYPES,
  RECOMMENDED_ALTERNATIVE_DATA_TYPE,
} from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor.constants'
import type { PostgresDataTypeOption } from '@/components/interfaces/TableGridEditor/SidePanelEditor/SidePanelEditor.types'
import type { EnumeratedType } from '@/data/enumerated-types/enumerated-types-query'

interface ColumnTypeProps {
  name: string
  className?: string
  enumTypes: EnumeratedType[]
  description?: ReactNode
  showRecommendation?: boolean
  control: Control
}

export const ColumnType = ({
  className,
  name,
  enumTypes = [],
  showRecommendation = false,
  control,
}: ColumnTypeProps) => {
  const [open, setOpen] = useState(false)
  const listboxId = useId()
  const availableTypes = POSTGRES_DATA_TYPES.concat(
    enumTypes.map((type) => type.format.replaceAll('"', ''))
  )

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

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const isAvailableType = field.value ? availableTypes.includes(field.value) : true
        const recommendation = RECOMMENDED_ALTERNATIVE_DATA_TYPE[field.value]

        if (!isAvailableType) {
          return (
            <FormItemLayout
              layout="vertical"
              name={name}
              label="Column type"
              description={unsupportedDataTypeText}
              className={className}
            >
              <FormControl>
                <Input_Shadcn_ {...field} id={name} disabled readOnly />
              </FormControl>
            </FormItemLayout>
          )
        }
        return (
          <FormItem className={cn('flex flex-col space-y-2', className)}>
            <FormLabel className="text-foreground flex gap-2 items-center wrap-break-word">
              Type
            </FormLabel>
            <Popover_Shadcn_ modal open={open} onOpenChange={setOpen}>
              <PopoverTrigger_Shadcn_ asChild>
                <Button
                  role="combobox"
                  size={'small'}
                  aria-expanded={open}
                  aria-controls={listboxId}
                  className={cn(
                    'w-full justify-between bg-background-control',
                    !field.value && 'text-foreground-lighter'
                  )}
                  iconRight={<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />}
                  title={field.value && field.value.replaceAll('"', '')}
                >
                  {field.value ? (
                    <div className="flex gap-2 items-center">
                      <span>{inferIcon(getOptionByName(field.value)?.type ?? '')}</span>
                      <span className="block truncate">{field.value.replaceAll('"', '')}</span>
                    </div>
                  ) : (
                    'Choose a column type...'
                  )}
                </Button>
              </PopoverTrigger_Shadcn_>
              <PopoverContent_Shadcn_
                id={listboxId}
                className="w-[460px] p-0"
                side="bottom"
                align="center"
              >
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
                        {POSTGRES_DATA_TYPE_OPTIONS.map((option: PostgresDataTypeOption) => (
                          <CommandItem_Shadcn_
                            key={option.name}
                            value={option.name}
                            className={cn(
                              'relative',
                              option.name === field.value ? 'bg-surface-200' : ''
                            )}
                            onSelect={(value: string) => {
                              field.onChange(value)
                              setOpen(false)
                            }}
                          >
                            <div className="flex items-center gap-2 pr-6">
                              <span>{inferIcon(option.type)}</span>
                              <span className="text-foreground">{option.name}</span>
                              <span className="text-foreground-lighter">{option.description}</span>
                            </div>
                            <span className="absolute right-3 top-2">
                              {option.name === field.value ? (
                                <Check className="text-brand" size={14} />
                              ) : (
                                ''
                              )}
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
                                  option.format === field.value ? 'bg-surface-200' : ''
                                )}
                                onSelect={(value: string) => {
                                  // [Joshen] For camel case types specifically, format property includes escaped double quotes
                                  // which will cause the POST columns call to error out. So we strip it specifically in this context
                                  field.onChange(
                                    option.schema === 'public' ? value.replaceAll('"', '') : value
                                  )
                                  setOpen(false)
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <div>
                                    <ListPlus
                                      size={16}
                                      className="text-foreground"
                                      strokeWidth={1.5}
                                    />
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
                                  {option.format === field.value && (
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
                    <code className="text-code-inline">{field.value}</code> unless you have a very
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
                      onClick={() => field.onChange(recommendation.alternative)}
                    >
                      Use {recommendation.alternative}
                    </Button>
                  </div>
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            )}
          </FormItem>
        )
      }}
    />
  )
}
