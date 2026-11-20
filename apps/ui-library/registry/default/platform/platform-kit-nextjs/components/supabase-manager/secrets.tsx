'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, Key, Minus, PlusIcon } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

import { secretsSchema } from '../../lib/schemas/secrets'
import { Alert, AlertDescription, AlertTitle } from '@/registry/default/components/ui/alert'
import { Button } from '@/registry/default/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/registry/default/components/ui/form'
import { Input } from '@/registry/default/components/ui/input'
import { Skeleton } from '@/registry/default/components/ui/skeleton'
import {
  useCreateSecrets,
  useDeleteSecrets,
  useGetSecrets,
} from '@/registry/default/platform/platform-kit-nextjs/hooks/use-secrets'

export function SecretsManager({ projectRef }: { projectRef: string }) {
  const { data: secrets, isLoading, error } = useGetSecrets(projectRef)
  const { mutate: createSecrets, isPending: isCreating } = useCreateSecrets()
  const { mutate: deleteSecrets, isPending: isDeleting } = useDeleteSecrets()
  const form = useForm<z.infer<typeof secretsSchema>>({
    resolver: zodResolver(secretsSchema),
    defaultValues: {
      secrets: [{ name: '', value: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'secrets',
  })

  const handleCreateSecrets = (formData: z.infer<typeof secretsSchema>) => {
    createSecrets(
      {
        projectRef,
        secrets: formData.secrets,
      },
      {
        onSuccess: () => {
          form.reset({ secrets: [{ name: '', value: '' }] })
        },
      }
    )
  }

  const handleDeleteSecret = (secretName: string) => {
    if (window.confirm(`Are you sure you want to delete the secret "${secretName}"?`)) {
      deleteSecrets({
        projectRef,
        secretNames: [secretName],
      })
    }
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-12 space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-6 lg:mx-8 mt-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading secrets</AlertTitle>
          <AlertDescription>
            There was a problem loading your secrets configuration.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto p-6 pt-4 lg:p-12 lg:pt-12">
      <div className="mb-16">
        <h2 className="text-base lg:text-xl font-semibold mb-1">Add New Secret</h2>
        <p className="text-muted-foreground mb-6 text-sm lg:text-base">
          Add sensitive information like API keys that your app needs to work securely.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateSecrets)} className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start space-x-2">
                <FormField
                  control={form.control}
                  name={`secrets.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      {index === 0 && <FormLabel className="mb-4">Name</FormLabel>}
                      <FormControl>
                        <Input placeholder="SECRET_NAME" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`secrets.${index}.value`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      {index === 0 && <FormLabel className="mb-4">Value</FormLabel>}
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="w-8">
                  {index === 0 && <FormLabel className="opacity-0 mb-4">Remove</FormLabel>}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={fields.length <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', value: '' })}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Secret
              </Button>
            </div>

            <Button type="submit" disabled={isCreating} className="mt-6">
              {isCreating ? 'Creating...' : 'Create Secrets'}
            </Button>
          </form>
        </Form>
      </div>

      <div>
        <h2 className="font-semibold mb-4 lg:text-lg">Existing secrets</h2>
        {secrets && secrets.length > 0 ? (
          secrets.map((secret) => (
            <div
              key={secret.name}
              className="flex items-center justify-between py-4 border-b last:border-b-0"
            >
              <div>
                <p className="font-mono text-sm tracking-wider">{secret.name}</p>
                {secret.updated_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {new Date(secret.updated_at).toLocaleString()}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteSecret(secret.name)}
                disabled={isDeleting}
              >
                Delete
              </Button>
            </div>
          ))
        ) : (
          <Alert>
            <Key className="h-4 w-4" />
            <AlertTitle>No secrets found</AlertTitle>
            <AlertDescription>No secrets found for this project.</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  )
}
