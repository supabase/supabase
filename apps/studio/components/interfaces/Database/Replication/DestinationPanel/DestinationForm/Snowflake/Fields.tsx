import { Eye, EyeOff, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
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
import { MAX_PRIVATE_KEY_LENGTH, readPrivateKeyFile } from './Snowflake.utils'

export const SnowflakeFields = ({
  form,
  editMode,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
  editMode: boolean
}) => {
  const [showPrivateKeyPassphrase, setShowPrivateKeyPassphrase] = useState(false)
  const privateKeyFileInputRef = useRef<HTMLInputElement>(null)
  const fileReadRequestIdRef = useRef(0)
  const [isDraggingPrivateKey, setIsDraggingPrivateKey] = useState(false)

  const handlePrivateKeyFile = async (file: File | undefined) => {
    if (!file) return
    const requestId = ++fileReadRequestIdRef.current
    await readPrivateKeyFile(file, form, () => requestId === fileReadRequestIdRef.current)
  }

  const handlePrivateKeyFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    await handlePrivateKeyFile(file)
  }

  const handlePrivateKeyDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDraggingPrivateKey(true)
  }

  const handlePrivateKeyDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDraggingPrivateKey(false)
  }

  const handlePrivateKeyDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDraggingPrivateKey(false)
    await handlePrivateKeyFile(event.dataTransfer.files?.[0])
  }

  return (
    <div className="flex flex-col gap-y-6 p-5">
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
                <Input
                  {...field}
                  placeholder="PIPELINES_USER"
                  value={field.value ?? ''}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  data-bwignore
                />
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
                  : 'Paste or upload a complete RSA private key (PKCS #8 or PKCS #1 PEM).'
              }
            >
              <div
                className="relative"
                onDragOver={handlePrivateKeyDragOver}
                onDragLeave={handlePrivateKeyDragLeave}
                onDrop={handlePrivateKeyDrop}
              >
                <div
                  className={cn(
                    'space-y-2 transition-opacity',
                    isDraggingPrivateKey && 'opacity-40'
                  )}
                >
                  <FormControl>
                    <TextArea
                      {...field}
                      onChange={(event) => {
                        fileReadRequestIdRef.current += 1
                        field.onChange(event)
                      }}
                      rows={8}
                      maxLength={MAX_PRIVATE_KEY_LENGTH}
                      placeholder={
                        editMode
                          ? STORED_SECRET_PLACEHOLDER
                          : '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----'
                      }
                      value={field.value ?? ''}
                      className="font-mono text-xs"
                    />
                  </FormControl>
                  <input
                    ref={privateKeyFileInputRef}
                    type="file"
                    accept=".p8,.pem,application/x-pem-file"
                    aria-label="Upload private key"
                    className="hidden"
                    onChange={handlePrivateKeyFileInputChange}
                  />
                  <Button
                    type="button"
                    size="tiny"
                    icon={<Upload size={14} />}
                    onClick={() => privateKeyFileInputRef.current?.click()}
                  >
                    Upload private key
                  </Button>
                </div>
                {isDraggingPrivateKey ? (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-md ring-2 ring-brand ring-offset-2 ring-offset-background"
                  />
                ) : null}
              </div>
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
