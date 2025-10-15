import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { Button, FormControl_Shadcn_, FormField_Shadcn_, Form_Shadcn_, Input_Shadcn_ } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { createSecrets } from 'data/secrets/secrets-create-mutation'
import { createVaultSecret } from 'data/vault/vault-secret-create-mutation'
import { parseTemplateVariables } from 'lib/cookbook/template-parser'
import type { EnvStep as EnvStepType, RecipeContext } from 'types/cookbook'

interface EnvStepProps {
  step: EnvStepType
  context: RecipeContext
  projectRef: string
  connectionString?: string | null
  onComplete: () => void
  isActive: boolean
  isCompleted: boolean
  isDisabled: boolean
}

export function EnvStep({
  step,
  context,
  projectRef,
  connectionString,
  onComplete,
  isActive,
  isCompleted,
  isDisabled,
}: EnvStepProps) {
  const [showValues, setShowValues] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  // Build a dynamic zod schema based on the step's input field definitions
  const schema = useMemo(() => {
    const schemaFields: Record<string, z.ZodTypeAny> = {}

    Object.entries(step.input.fields).forEach(([fieldName, field]) => {
      if (field.inputType === 'string' || field.inputType === 'password') {
        if (field.required) {
          schemaFields[fieldName] = z.string().min(1, `${field.label} is required`)
        } else {
          schemaFields[fieldName] = z.string().optional()
        }
      } else if (field.inputType === 'number') {
        if (field.required) {
          schemaFields[fieldName] = z.number({ required_error: `${field.label} is required` })
        } else {
          schemaFields[fieldName] = z.number().optional()
        }
      } else if (field.inputType === 'select') {
        if (field.required) {
          schemaFields[fieldName] = z.string().min(1, `${field.label} is required`)
        } else {
          schemaFields[fieldName] = z.string().optional()
        }
      }
    })

    return z.object(schemaFields)
  }, [step.input.fields])

  // Build default values
  const defaultValues = useMemo(() => {
    const values: Record<string, string | number> = {}
    Object.entries(step.input.fields).forEach(([fieldName, field]) => {
      if (field.inputType === 'number') {
        values[fieldName] = field.default ? Number(field.default) : 0
      } else {
        values[fieldName] = field.default || ''
      }
    })
    return values
  }, [step.input.fields])

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  const onSubmit = async (values: Record<string, string | number>) => {
    setError(null)

    try {
      // Parse the run.env templates with input values to get the actual env vars to set
      const envVars: Record<string, string> = {}
      Object.entries(step.run.env).forEach(([key, template]) => {
        envVars[key] = parseTemplateVariables(template, context, values)
      })

      // Create edge function secrets
      const edgeFunctionSecrets = Object.entries(envVars).map(([name, value]) => ({
        name,
        value,
      }))

      await createSecrets({ projectRef, secrets: edgeFunctionSecrets })

      // Parse and create vault secrets if defined
      if (step.run.vault && Object.keys(step.run.vault).length > 0) {
        const vaultSecrets: Record<string, string> = {}
        Object.entries(step.run.vault).forEach(([key, template]) => {
          vaultSecrets[key] = parseTemplateVariables(template, context, values)
        })

        // Create vault secrets in parallel
        await Promise.all(
          Object.entries(vaultSecrets).map(([name, secret]) =>
            createVaultSecret({
              projectRef,
              connectionString,
              name,
              secret,
            })
          )
        )
      }

      // Auto-advance after successful secret creation
      setTimeout(() => {
        onComplete()
      }, 1000)
    } catch (err: any) {
      setError(err?.message || 'Failed to set secrets')
    }
  }

  const toggleShowValue = (key: string) => {
    setShowValues((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-medium mb-1">{step.title}</h3>
        <p className="text-sm text-foreground-light">{step.description}</p>
      </div>

      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {Object.entries(step.input.fields).map(([fieldName, field]) => (
              <FormField_Shadcn_
                key={fieldName}
                control={form.control}
                name={fieldName}
                render={({ field: formField }) => (
                  <FormItemLayout
                    label={field.label}
                    description={field.required ? 'Required field' : undefined}
                  >
                    <FormControl_Shadcn_>
                      {field.inputType === 'password' ? (
                        <div className="relative">
                          <Input_Shadcn_
                            type={showValues[fieldName] ? 'text' : 'password'}
                            placeholder={field.default || `Enter ${field.label.toLowerCase()}`}
                            disabled={isDisabled || isCompleted}
                            {...formField}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShowValue(fieldName)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
                            disabled={isDisabled || isCompleted}
                          >
                            {showValues[fieldName] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ) : field.inputType === 'string' ? (
                        <Input_Shadcn_
                          type="text"
                          placeholder={field.default}
                          disabled={isDisabled || isCompleted}
                          {...formField}
                        />
                      ) : field.inputType === 'number' ? (
                        <Input_Shadcn_
                          type="number"
                          placeholder={field.default}
                          disabled={isDisabled || isCompleted}
                          {...formField}
                        />
                      ) : null}
                    </FormControl_Shadcn_>
                  </FormItemLayout>
                )}
              />
            ))}
          </div>

          {error && (
            <div className="bg-destructive-200 border border-destructive-400 rounded-md p-3">
              <p className="text-sm text-destructive-600">{error}</p>
            </div>
          )}

          <div>
            <Button
              type="primary"
              htmlType="submit"
              loading={form.formState.isSubmitting}
              disabled={isDisabled || isCompleted}
            >
              Set Environment Variables
            </Button>
          </div>
        </form>
      </Form_Shadcn_>
    </div>
  )
}
