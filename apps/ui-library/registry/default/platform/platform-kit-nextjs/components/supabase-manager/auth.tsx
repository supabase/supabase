'use client'

import { AlertTriangle, ChevronRight, Mail, Phone, User } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { z } from 'zod'

import {
  authEmailProviderSchema,
  authFieldLabels,
  authGeneralSettingsSchema,
  authGoogleProviderSchema,
  authPhoneProviderSchema,
  type AuthGeneralSettingsSchema,
} from '../../lib/schemas/auth'
import { Alert, AlertDescription, AlertTitle } from '@/registry/default/components/ui/alert'
import { Button } from '@/registry/default/components/ui/button'
import { Skeleton } from '@/registry/default/components/ui/skeleton'
import { DynamicForm } from '@/registry/default/platform/platform-kit-nextjs/components/dynamic-form'
import { useSheetNavigation } from '@/registry/default/platform/platform-kit-nextjs/contexts/SheetNavigationContext'
import {
  useGetAuthConfig,
  useUpdateAuthConfig,
} from '@/registry/default/platform/platform-kit-nextjs/hooks/use-auth'

function ProviderSettingsView({
  projectRef,
  schema,
  title,
  initialValues: allInitialValues,
  onSuccess,
}: {
  projectRef: string
  schema: z.ZodObject<any> | z.ZodEffects<z.ZodObject<any>>
  title: string
  initialValues: any
  onSuccess: () => void
}) {
  const { mutate: updateAuthConfig, isPending: isUpdatingConfig } = useUpdateAuthConfig()

  const actualSchema = 'shape' in schema ? schema : (schema._def.schema as z.ZodObject<any>)

  const handleUpdateAuthConfig = (formData: z.infer<typeof actualSchema>) => {
    const payload = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== undefined)
    )

    if (Object.keys(payload).length === 0) {
      alert('No changes to submit. Please modify a field to update.')
      return
    }

    updateAuthConfig(
      {
        projectRef,
        payload,
      },
      {
        onSuccess,
      }
    )
  }

  const formInitialValues = useMemo(() => {
    if (!allInitialValues) {
      return undefined
    }
    const schemaKeys = Object.keys(actualSchema.shape)
    const result = schemaKeys.reduce(
      (acc, key) => {
        if (Object.prototype.hasOwnProperty.call(allInitialValues, key)) {
          acc[key] = allInitialValues[key]
        }
        return acc
      },
      {} as Record<string, any>
    )

    return result
  }, [allInitialValues, actualSchema])

  return (
    <div className="w-full max-w-3xl mx-auto p-6 pt-4 lg:p-12 lg:pt-12">
      <h2 className="lg:text-xl font-semibold mb-2 lg:mb-4">{title}</h2>
      <DynamicForm
        schema={actualSchema}
        onSubmit={handleUpdateAuthConfig}
        isLoading={isUpdatingConfig}
        initialValues={formInitialValues}
        labels={authFieldLabels}
      />
    </div>
  )
}

export function AuthManager({ projectRef }: { projectRef: string }) {
  const {
    data: authConfigData,
    isLoading: isLoadingConfig,
    error: errorLoadingConfig,
  } = useGetAuthConfig(projectRef)

  const { mutate: updateAuthConfig, isPending: isUpdatingConfig } = useUpdateAuthConfig()
  const { push, pop } = useSheetNavigation()

  const handleUpdateGeneralSettings = (formData: AuthGeneralSettingsSchema) => {
    const payload = Object.fromEntries(
      Object.entries(formData).filter(([_, value]) => value !== undefined)
    )

    if (Object.keys(payload).length === 0) {
      alert('No changes to submit. Please modify a field to update.')
      return
    }

    updateAuthConfig({
      projectRef,
      payload,
    })
  }

  const providers: {
    name: string
    icon: React.ReactNode
    description: string
    schema: z.ZodObject<any> | z.ZodEffects<z.ZodObject<any>>
  }[] = [
    {
      icon: <Mail className="h-4 w-4 text-muted-foreground" />,
      name: 'Email',
      description: 'Sign in with email and password',
      schema: authEmailProviderSchema,
    },
    {
      icon: <Phone className="h-4 w-4 text-muted-foreground" />,
      name: 'Phone',
      description: 'Sign in with phone number',
      schema: authPhoneProviderSchema,
    },
    {
      icon: <User className="h-4 w-4 text-muted-foreground" />,
      name: 'Google',
      description: 'Sign in with Google',
      schema: authGoogleProviderSchema,
    },
  ]

  const handleProviderClick = useCallback(
    (provider: { name: string; schema: z.ZodObject<any> | z.ZodEffects<z.ZodObject<any>> }) => {
      push({
        title: `${provider.name} Provider Settings`,
        component: (
          <ProviderSettingsView
            projectRef={projectRef}
            schema={provider.schema}
            title={`${provider.name} Provider Settings`}
            initialValues={authConfigData}
            onSuccess={() => pop()}
          />
        ),
      })
    },
    [projectRef, authConfigData, push, pop]
  )

  const formInitialValues = useMemo(() => {
    if (!authConfigData) {
      return undefined
    }
    const schemaKeys = Object.keys(authGeneralSettingsSchema.shape)
    return schemaKeys.reduce(
      (acc, key) => {
        if (Object.prototype.hasOwnProperty.call(authConfigData, key)) {
          acc[key] = authConfigData[key as keyof typeof authConfigData]
        }
        return acc
      },
      {} as Record<string, any>
    )
  }, [authConfigData])

  if (errorLoadingConfig) {
    return (
      <div className="mx-6 lg:mx-8 mt-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading auth settings</AlertTitle>
          <AlertDescription>
            There was a problem loading your authentication configuration.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoadingConfig)
    return (
      <div className="w-full max-w-3xl mx-auto p-12 space-y-2">
        <Skeleton className="h-12 w-full mb-8" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )

  return (
    <div className="w-full max-w-3xl mx-auto p-6 pt-4 lg:p-12 lg:pt-12">
      <div className="mb-12">
        <h2 className="text-base lg:text-xl font-semibold">General Settings</h2>
        <p className="text-sm lg:text-base text-muted-foreground mt-1 mb-2">
          Allow people to sign up to your app
        </p>
        <DynamicForm
          schema={authGeneralSettingsSchema}
          onSubmit={handleUpdateGeneralSettings}
          isLoading={isUpdatingConfig}
          initialValues={formInitialValues}
          labels={authFieldLabels}
        />
      </div>
      <div>
        <h2 className="font-semibold lg:text-lg">Sign in methods</h2>
        <p className="text-muted-foreground mb-6 mt-1 text-sm lg:text-base">
          Configure how people sign in and up to your app.
        </p>
        <div className="border rounded-md overflow-hidden bg-background">
          {providers.map((provider) => (
            <Button
              variant="ghost"
              size="lg"
              onClick={() => handleProviderClick(provider)}
              key={provider.name}
              className="rounded-none justify-start flex-row text-left h-auto px-8 py-4 w-full gap-4 border-b last:border-b-0"
            >
              {provider.icon}
              <div className="flex-1">
                <h3 className="font-bold">{provider.name}</h3>
                <p className="text-muted-foreground text-sm">{provider.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
