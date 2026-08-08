'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import type { z, ZodTypeAny } from 'zod'

import { Button } from '@/registry/default/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/registry/default/components/ui/form'
import { Input } from '@/registry/default/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/default/components/ui/select'
import { Switch } from '@/registry/default/components/ui/switch'

interface DynamicFormProps<T extends z.ZodRawShape = z.ZodRawShape> {
  schema: z.ZodObject<T>
  onSubmit: (data: z.infer<z.ZodObject<T>>) => void
  isLoading?: boolean
  initialValues?: Partial<z.infer<z.ZodObject<T>>>
  labels?: Record<string, string | { label: string; options?: Record<string, string> }>
  columnInfo?: Record<string, { data_type: string; is_nullable: boolean }>
}

const getZodDef = (schema: ZodTypeAny): Record<string, any> =>
  (schema as any)._def || (schema as any).def

const unwrapZodType = (fieldSchema: ZodTypeAny): ZodTypeAny => {
  if (
    !fieldSchema ||
    typeof getZodDef(fieldSchema) !== 'object' ||
    getZodDef(fieldSchema) === null
  ) {
    throw new Error(
      `unwrapZodType received an invalid Zod schema object. Check the console for the problematic schema/key.`
    )
  }
  let currentSchema = fieldSchema

  // Support both old (typeName) and new (type) Zod formats
  const getTypeName = (def: Record<string, any>) => def.typeName || def.type

  while (
    getTypeName(getZodDef(currentSchema)) === 'ZodOptional' ||
    getTypeName(getZodDef(currentSchema)) === 'optional' ||
    getTypeName(getZodDef(currentSchema)) === 'ZodDefault' ||
    getTypeName(getZodDef(currentSchema)) === 'default' ||
    getTypeName(getZodDef(currentSchema)) === 'ZodNullable' ||
    getTypeName(getZodDef(currentSchema)) === 'nullable' ||
    getTypeName(getZodDef(currentSchema)) === 'ZodEffects' ||
    getTypeName(getZodDef(currentSchema)) === 'effects'
  ) {
    const typeName = getTypeName(getZodDef(currentSchema))
    if (typeName === 'ZodEffects' || typeName === 'effects') {
      // For ZodEffects, get the schema inside the effect
      currentSchema = getZodDef(currentSchema).schema
    } else {
      currentSchema = getZodDef(currentSchema).innerType
    }
  }
  return currentSchema
}

export function DynamicForm<T extends z.ZodRawShape = z.ZodRawShape>({
  schema,
  onSubmit,
  isLoading = false,
  initialValues,
  labels,
  columnInfo,
}: DynamicFormProps<T>) {
  const isInitializingRef = useRef(true)

  const defaultValues = Object.keys(schema.shape).reduce(
    (acc, key) => {
      const originalFieldSchema = schema.shape[key]
      if (typeof originalFieldSchema === 'undefined') {
        throw new Error(
          `Schema error: schema.shape['${key}'] is undefined. Check schema definition.`
        )
      }

      // Support both old (typeName) and new (type) Zod formats
      const getTypeName = (def: Record<string, any>) => def.typeName || def.type

      if (
        getTypeName(getZodDef(originalFieldSchema)) === 'ZodDefault' ||
        getTypeName(getZodDef(originalFieldSchema)) === 'default'
      ) {
        acc[key] = getZodDef(originalFieldSchema).defaultValue()
        return acc
      }

      const baseType = unwrapZodType(originalFieldSchema)

      switch (getTypeName(getZodDef(baseType))) {
        case 'ZodString':
        case 'string':
          acc[key] = ''
          break
        case 'ZodBoolean':
        case 'boolean':
          acc[key] = false // Default optional booleans to false
          break
        case 'ZodEnum':
        case 'enum':
          // For enums, use the first enum value as default
          const enumValues = getZodDef(baseType).values || []
          acc[key] = enumValues.length > 0 ? enumValues[0] : ''
          break
        case 'ZodNumber':
        case 'number':
          acc[key] = 0 // Default optional numbers to 0
          break
        case 'ZodArray':
        case 'array':
          acc[key] = [] // Default arrays to empty array
          break
        default:
          acc[key] = undefined // For other types, or if truly no default makes sense
          break
      }
      return acc
    },
    {} as Record<string, any>
  )

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as any,
  })

  useEffect(() => {
    if (initialValues) {
      isInitializingRef.current = true
      const schemaKeys = Object.keys(schema.shape)
      const processedInitialValues = schemaKeys.reduce(
        (acc, key) => {
          const fieldDefFromSchema = schema.shape[key]
          if (typeof fieldDefFromSchema === 'undefined') {
            throw new Error(`Schema error in useEffect: schema.shape['${key}'] is undefined.`)
          }
          const value = initialValues.hasOwnProperty(key) ? initialValues[key] : undefined
          const baseFieldType = unwrapZodType(fieldDefFromSchema)

          // Support both old (typeName) and new (type) Zod formats
          const getTypeName = (def: Record<string, any>) => def.typeName || def.type

          const fieldTypeName = getTypeName(getZodDef(baseFieldType))
          if (fieldTypeName === 'ZodBoolean' || fieldTypeName === 'boolean') {
            acc[key] = !!value
          } else if (fieldTypeName === 'ZodString' || fieldTypeName === 'string') {
            acc[key] = value === null || value === undefined ? '' : String(value)
          } else if (fieldTypeName === 'ZodEnum' || fieldTypeName === 'enum') {
            const enumValues = getZodDef(baseFieldType).values || []
            acc[key] =
              value === null || value === undefined || !enumValues.includes(value)
                ? enumValues[0] || ''
                : String(value)
          } else if (fieldTypeName === 'ZodNumber' || fieldTypeName === 'number') {
            const num = Number(value)
            acc[key] = isNaN(num) ? 0 : num
          } else if (fieldTypeName === 'ZodArray' || fieldTypeName === 'array') {
            // For arrays, the value should already be an array from the database
            // Handle null values properly
            if (Array.isArray(value)) {
              acc[key] = value
            } else if (value === null || value === undefined) {
              acc[key] = []
            } else if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
              // Parse PostgreSQL array format like {ONE,TWO} into JavaScript array
              try {
                const innerContent = value.slice(1, -1) // Remove { and }
                if (innerContent.trim() === '') {
                  acc[key] = []
                } else {
                  // Split by comma and trim whitespace
                  acc[key] = innerContent.split(',').map((item: string) => item.trim())
                }
              } catch {
                // If parsing fails, default to empty array
                acc[key] = []
              }
            } else {
              acc[key] = []
            }
          } else {
            acc[key] = value
          }
          return acc
        },
        {} as Record<string, any>
      )
      form.reset(processedInitialValues as any)
      setTimeout(() => {
        isInitializingRef.current = false
      }, 0)
    } else {
      isInitializingRef.current = false
    }
  }, [initialValues, form, schema])

  const renderField = (fieldName: string, fieldSchema: ZodTypeAny) => {
    const baseType = unwrapZodType(fieldSchema)
    // Support both old (typeName) and new (type) Zod formats
    const getTypeName = (def: Record<string, any>) => def.typeName || def.type
    const typeName = getTypeName(getZodDef(baseType))
    const description = fieldSchema.description

    return (
      <FormField
        key={fieldName}
        control={form.control}
        name={fieldName as any}
        render={({ field }) => {
          const labelConfig = labels?.[fieldName]
          const label =
            typeof labelConfig === 'string' ? labelConfig : labelConfig?.label || fieldName
          const typeDisplay = columnInfo?.[fieldName]?.data_type || ''
          switch (typeName) {
            case 'ZodString':
            case 'string':
              return (
                <FormItem className="py-6 border-b">
                  <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between w-full gap-4 lg:gap-8">
                    <div className="flex-1 pr-4">
                      <FormLabel>{label}</FormLabel>
                      <div className="text-sm text-muted-foreground mt-1">{typeDisplay}</div>
                      {description && <FormDescription>{description}</FormDescription>}
                      <FormMessage />
                    </div>
                    <div className="flex-1 lg:max-w-1/2">
                      <FormControl>
                        <Input
                          placeholder={`Enter your ${fieldName}`}
                          {...field}
                          value={String(field.value || '')}
                        />
                      </FormControl>
                    </div>
                  </div>
                </FormItem>
              )
            case 'ZodNumber':
            case 'number':
              return (
                <FormItem className="py-6 border-b">
                  <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between w-full gap-4 lg:gap-8">
                    <div className="flex-1 pr-4">
                      <FormLabel>{label}</FormLabel>
                      <div className="text-sm text-muted-foreground">{typeDisplay}</div>
                      {description && <FormDescription>{description}</FormDescription>}
                      <FormMessage />
                    </div>
                    <div className="flex-1 lg:max-w-1/2">
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={`Enter value for ${fieldName}`}
                          {...field}
                          value={String(field.value ?? '')}
                          onChange={(e) => {
                            const value = e.target.value
                            const num = parseInt(value, 10)
                            field.onChange(isNaN(num) ? undefined : num)
                          }}
                        />
                      </FormControl>
                    </div>
                  </div>
                </FormItem>
              )
            case 'ZodBoolean':
            case 'boolean':
              return (
                <FormItem className="py-6 border-b flex flex-row items-center justify-between gap-8">
                  <div>
                    <FormLabel>{label}</FormLabel>
                    <div className="text-sm text-muted-foreground">{typeDisplay}</div>
                    {description && <FormDescription>{description}</FormDescription>}
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )
            case 'ZodEnum':
            case 'enum':
              const options = getZodDef(baseType).values
              const optionLabels = typeof labelConfig === 'object' ? labelConfig.options : undefined
              return (
                <FormItem className="py-6 border-b">
                  <div className="w-full flex flex-col lg:flex-row lg:items-center justify-between w-full gap-4 lg:gap-8">
                    <div className="flex-1 pr-4">
                      <FormLabel>{label}</FormLabel>
                      <div className="text-sm text-muted-foreground">{typeDisplay}</div>
                      {description && <FormDescription>{description}</FormDescription>}
                      <FormMessage />
                    </div>
                    <div className="flex-1 lg:max-w-1/2">
                      <Select
                        onValueChange={(value) => {
                          if (!isInitializingRef.current) {
                            field.onChange(value)
                          }
                        }}
                        value={String(field.value || '')}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={`Select a ${fieldName}`} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {options.map((option: string) => (
                            <SelectItem key={option} value={option}>
                              {optionLabels?.[option] || option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </FormItem>
              )
            case 'ZodArray':
            case 'array':
              return (
                <FormItem className="py-6 border-b">
                  <div className="flex flex-row items-center justify-between w-full gap-8">
                    <div className="flex-1 pr-4">
                      <FormLabel>{label}</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enter as JSON array: [&quot;item1&quot;, &quot;item2&quot;]
                        {columnInfo?.[fieldName]?.is_nullable && ' (leave empty for null)'}
                      </div>

                      {description && <FormDescription>{description}</FormDescription>}
                      <FormMessage />
                    </div>
                    <div className="flex-1">
                      <FormControl>
                        <Input
                          placeholder={
                            columnInfo?.[fieldName]?.is_nullable
                              ? `[&quot;item1&quot;, &quot;item2&quot;] or leave empty for null`
                              : `[&quot;item1&quot;, &quot;item2&quot;]`
                          }
                          {...field}
                          value={
                            field.value === null || field.value === undefined
                              ? ''
                              : Array.isArray(field.value)
                                ? JSON.stringify(field.value)
                                : String(field.value || '')
                          }
                          onChange={(e) => {
                            const value = e.target.value
                            if (value.trim() === '') {
                              // Empty string means null (for nullable) or empty array (for non-nullable)
                              field.onChange(null)
                            } else {
                              try {
                                const parsed = JSON.parse(value)
                                if (Array.isArray(parsed)) {
                                  field.onChange(parsed)
                                } else {
                                  // If it's not an array, treat as invalid input
                                  field.onChange(value)
                                }
                              } catch {
                                // Invalid JSON, keep the string value to show error
                                field.onChange(value)
                              }
                            }
                          }}
                        />
                      </FormControl>
                    </div>
                  </div>
                </FormItem>
              )
            default:
              return <></>
          }
        }}
      />
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {Object.keys(schema.shape).map((fieldName) =>
          renderField(fieldName, schema.shape[fieldName])
        )}
        <div className="pt-6">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
