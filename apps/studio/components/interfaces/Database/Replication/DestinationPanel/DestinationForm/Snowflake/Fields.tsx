import { Eye, EyeOff, Upload } from 'lucide-react'
import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { Button, cn, FormControl, FormField, Input, TextArea } from 'ui'
import { Input as PasswordInput } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { STORED_SECRET_PLACEHOLDER } from '../DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationForm.schema'

const MAX_PRIVATE_KEY_LENGTH = 10000

const isPrivateKey = (contents: string) => {
  const match = contents.match(
    /^\s*-----BEGIN ((?:ENCRYPTED |RSA )?PRIVATE KEY)-----\r?\n([\s\S]*?)\r?\n-----END \1-----\s*$/
  )

  return match !== null && match[2].trim().length > 0
}

const readPrivateKeyFile = async (
  file: File,
  form: UseFormReturn<DestinationPanelSchemaType>,
  isCurrentRequest: () => boolean
) => {
  if (file.size > MAX_PRIVATE_KEY_LENGTH) {
    if (isCurrentRequest()) {
      form.setError('snowflakePrivateKey', {
        message: 'Private key must be 10,000 characters or fewer.',
      })
    }
    return
  }

  try {
    const contents = await file.text()
    if (!isCurrentRequest()) return

    if (contents.length > MAX_PRIVATE_KEY_LENGTH) {
      form.setError('snowflakePrivateKey', {
        message: 'Private key must be 10,000 characters or fewer.',
      })
      return
    }

    if (!isPrivateKey(contents)) {
      form.setError('snowflakePrivateKey', { message: 'Select a P8 or PEM private key.' })
      return
    }

    form.setValue('snowflakePrivateKey', contents, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    form.clearErrors('snowflakePrivateKey')
  } catch {
    if (isCurrentRequest()) {
      form.setError('snowflakePrivateKey', { message: 'Could not read the selected private key.' })
    }
  }
}

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
              label="Account ID"
              description="Snowflake organization and account identifiers joined with a hyphen."
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
              label="Database"
              description="Snowflake database where replicated tables are created."
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
              label="Schema"
              description="An empty Snowflake schema where replicated tables are created."
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
                  : 'Paste or upload a complete RSA private key in PKCS #8 or PKCS #1 PEM format.'
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
