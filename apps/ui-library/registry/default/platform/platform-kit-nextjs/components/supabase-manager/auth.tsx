import { AlertTriangle, ChevronRight, Mail, Phone, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { useMemo } from 'react'
import { useLocation } from 'wouter'
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
import {
  useGetAuthConfig,
  useUpdateAuthConfig,
} from '@/registry/default/platform/platform-kit-nextjs/hooks/use-auth'

interface Provider {
  key: string
  name: string
  icon: ReactNode
  description: string
  schema: z.ZodObject<any> | z.ZodEffects<z.ZodObject<any>>
}

const PROVIDERS: Provider[] = [
  {
    key: 'email',
    name: 'Email',
    icon: <Mail className="h-4 w-4 text-muted-foreground" />,
    description: 'Sign in with email and password',
    schema: authEmailProviderSchema,
  },
  {
    key: 'phone',
    name: 'Phone',
    icon: <Phone className="h-4 w-4 text-muted-foreground" />,
    description: 'Sign in with phone number',
    schema: authPhoneProviderSchema,
  },
  {
    key: 'google',
    name: 'Google',
    icon: <User className="h-4 w-4 text-muted-foreground" />,
    description: 'Sign in with Google',
    schema: authGoogleProviderSchema,
  },
]

function pickSchemaValues(schema: z.ZodObject<any>, source: any) {
  if (!source) return undefined
  const keys = Object.keys(schema.shape)
  return keys.reduce(
    (acc, key) => {
      if (Object.prototype.hasOwnProperty.call(source, key)) acc[key] = source[key]
      return acc
    },
    {} as Record<string, any>
  )
}

export function AuthProviderView({ providerName }: { providerName: string }) {
  const [, navigate] = useLocation()
  const { data: authConfigData } = useGetAuthConfig()
  const { mutate: updateAuthConfig, isPending } = useUpdateAuthConfig()

  const provider = PROVIDERS.find((p) => p.key === providerName)
  const actualSchema = provider
    ? 'shape' in provider.schema
      ? provider.schema
      : (provider.schema._def.schema as z.ZodObject<any>)
    : undefined

  const initialValues = useMemo(
    () => (actualSchema ? pickSchemaValues(actualSchema, authConfigData) : undefined),
    [actualSchema, authConfigData]
  )

  if (!provider || !actualSchema) {
    return (
      <div className="mx-6 mt-8 lg:mx-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Unknown provider</AlertTitle>
          <AlertDescription>This authentication provider is not available.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const handleSubmit = (formData: Record<string, any>) => {
    const payload = Object.fromEntries(
      Object.entries(formData).filter(([, value]) => value !== undefined)
    )
    if (Object.keys(payload).length === 0) {
      alert('No changes to submit. Please modify a field to update.')
      return
    }
    updateAuthConfig(payload, { onSuccess: () => navigate('/auth') })
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6 pt-4 lg:p-12 lg:pt-12">
      <h2 className="mb-2 font-semibold lg:mb-4 lg:text-xl">{provider.name} Provider Settings</h2>
      <DynamicForm
        schema={actualSchema}
        onSubmit={handleSubmit}
        isLoading={isPending}
        initialValues={initialValues}
        labels={authFieldLabels}
      />
    </div>
  )
}

export function AuthManager() {
  const [, navigate] = useLocation()
  const {
    data: authConfigData,
    isLoading: isLoadingConfig,
    error: errorLoadingConfig,
  } = useGetAuthConfig()
  const { mutate: updateAuthConfig, isPending: isUpdatingConfig } = useUpdateAuthConfig()

  const handleUpdateGeneralSettings = (formData: AuthGeneralSettingsSchema) => {
    const payload = Object.fromEntries(
      Object.entries(formData).filter(([, value]) => value !== undefined)
    )
    if (Object.keys(payload).length === 0) {
      alert('No changes to submit. Please modify a field to update.')
      return
    }
    updateAuthConfig(payload)
  }

  const formInitialValues = useMemo(
    () => pickSchemaValues(authGeneralSettingsSchema, authConfigData),
    [authConfigData]
  )

  if (errorLoadingConfig) {
    return (
      <div className="mx-6 mt-8 lg:mx-8">
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

  if (isLoadingConfig) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-2 p-12">
        <Skeleton className="mb-8 h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6 pt-4 lg:p-12 lg:pt-12">
      <div className="mb-12">
        <h2 className="text-base font-semibold lg:text-xl">General Settings</h2>
        <p className="mb-2 mt-1 text-sm text-muted-foreground lg:text-base">
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
        <p className="mb-6 mt-1 text-sm text-muted-foreground lg:text-base">
          Configure how people sign in and up to your app.
        </p>
        <div className="overflow-hidden rounded-md border bg-background">
          {PROVIDERS.map((provider) => (
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate(`/auth/${provider.key}`)}
              key={provider.key}
              className="h-auto w-full flex-row justify-start gap-4 rounded-none border-b px-8 py-4 text-left last:border-b-0"
            >
              {provider.icon}
              <div className="flex-1">
                <h3 className="font-bold">{provider.name}</h3>
                <p className="text-sm text-muted-foreground">{provider.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
