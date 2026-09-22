import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Button, cn, FormControl, FormField, Input, TextArea } from 'ui'
import { Input as PasswordInput } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { STORED_SECRET_PLACEHOLDER } from '../DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import {
  SNOWFLAKE_ACCOUNT_ID_FIELD_COPY,
  SNOWFLAKE_DATABASE_FIELD_COPY,
  SNOWFLAKE_SCHEMA_FIELD_COPY,
} from '../DestinationFormFieldCopy'

export const SnowflakeFields = ({
  form,
  editMode,
  className,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
  editMode: boolean
  className?: string
}) => {
  const [showPrivateKeyPassphrase, setShowPrivateKeyPassphrase] = useState(false)

  return (
    <div className={cn('flex flex-col gap-y-6 p-5', className)}>
      <p className="text-sm font-medium text-foreground">Snowflake settings</p>

      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Connection</p>
        <p className="text-sm text-foreground-light">
          Enter the Snowflake account and destination details.
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="snowflakeAccountId"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label={SNOWFLAKE_ACCOUNT_ID_FIELD_COPY.label}
              description={SNOWFLAKE_ACCOUNT_ID_FIELD_COPY.description}
            >
              <FormControl>
                <Input {...field} placeholder="MYORG-MYACCOUNT" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="snowflakeUser"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="User"
              description="Snowflake service user with key-pair authentication."
            >
              <FormControl>
                <Input {...field} placeholder="PIPELINES_USER" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="snowflakeDatabase"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label={SNOWFLAKE_DATABASE_FIELD_COPY.label}
              description={SNOWFLAKE_DATABASE_FIELD_COPY.description}
            >
              <FormControl>
                <Input {...field} placeholder="PIPELINES_DB" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="snowflakeSchema"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label={SNOWFLAKE_SCHEMA_FIELD_COPY.label}
              description={SNOWFLAKE_SCHEMA_FIELD_COPY.description}
            >
              <FormControl>
                <Input {...field} placeholder="REPLICATED" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="snowflakeRole"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Role"
              labelOptional="Optional"
              description="Snowflake role for SQL requests. Must match the user’s default role."
            >
              <FormControl>
                <Input {...field} placeholder="PIPELINES_ROLE" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Authentication</p>
        <p className="text-sm text-foreground-light">
          Use the RSA private key whose public key is registered on the Snowflake user.
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="snowflakePrivateKey"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Private key"
              description={
                editMode
                  ? 'Stored private key is hidden. Enter a new private key to replace it.'
                  : 'Snowflake private key as a complete PEM. PKCS #8 is recommended.'
              }
            >
              <FormControl>
                <TextArea
                  {...field}
                  rows={8}
                  maxLength={10000}
                  placeholder={
                    editMode
                      ? STORED_SECRET_PLACEHOLDER
                      : '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
                  }
                  value={field.value ?? ''}
                  className="font-mono text-xs"
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="snowflakePrivateKeyPassphrase"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Private key passphrase"
              labelOptional="Optional"
              description={
                editMode
                  ? 'Stored passphrase setting is hidden. Enter a new passphrase to replace it.'
                  : 'Passphrase for an encrypted PKCS #8 private key.'
              }
            >
              <FormControl>
                <PasswordInput
                  value={field.value ?? ''}
                  type={showPrivateKeyPassphrase ? 'text' : 'password'}
                  placeholder={editMode ? STORED_SECRET_PLACEHOLDER : undefined}
                  onChange={(event) => field.onChange(event.target.value)}
                  actions={
                    <div className="flex items-center justify-center">
                      <Button
                        className="w-7"
                        title={showPrivateKeyPassphrase ? 'Hide passphrase' : 'Show passphrase'}
                        aria-label={
                          showPrivateKeyPassphrase ? 'Hide passphrase' : 'Show passphrase'
                        }
                        icon={showPrivateKeyPassphrase ? <Eye /> : <EyeOff />}
                        onClick={() => setShowPrivateKeyPassphrase(!showPrivateKeyPassphrase)}
                      />
                    </div>
                  }
                />
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>
    </div>
  )
}
