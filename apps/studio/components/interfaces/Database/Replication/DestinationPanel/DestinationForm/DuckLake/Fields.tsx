import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import {
  Button,
  FormControl,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from 'ui'
import { Input as PasswordInput } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { STORED_SECRET_PLACEHOLDER } from '../DestinationForm.constants'
import type { DestinationPanelSchemaType } from '../DestinationForm.schema'
import {
  DUCKLAKE_CATALOG_URL_FIELD_COPY,
  DUCKLAKE_DATA_PATH_FIELD_COPY,
} from '../DestinationFormFieldCopy'

export const DuckLakeFields = ({
  form,
  editMode,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
  editMode: boolean
}) => {
  const [showCatalogUrl, setShowCatalogUrl] = useState(false)
  const [showSecretAccessKey, setShowSecretAccessKey] = useState(false)

  return (
    <div className="flex flex-col gap-y-6 p-5">
      <p className="text-sm font-medium text-foreground">DuckLake settings</p>

      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Catalog</p>
        <p className="text-sm text-foreground-light">
          Configure the Postgres DuckLake catalog and S3-compatible storage for replicated data.
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="ducklakeCatalogUrl"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label={DUCKLAKE_CATALOG_URL_FIELD_COPY.label}
              description={
                editMode
                  ? DUCKLAKE_CATALOG_URL_FIELD_COPY.editDescription
                  : DUCKLAKE_CATALOG_URL_FIELD_COPY.createDescription
              }
            >
              <FormControl>
                <PasswordInput
                  value={field.value ?? ''}
                  type={showCatalogUrl && !editMode ? 'text' : 'password'}
                  placeholder={
                    editMode
                      ? STORED_SECRET_PLACEHOLDER
                      : 'postgresql://user:password@host:5432/database'
                  }
                  onChange={(event) => field.onChange(event.target.value)}
                  actions={
                    !editMode && (
                      <div className="flex items-center justify-center">
                        <Button
                          className="w-7"
                          aria-label={showCatalogUrl ? 'Hide catalog URL' : 'Show catalog URL'}
                          icon={showCatalogUrl ? <Eye /> : <EyeOff />}
                          onClick={() => setShowCatalogUrl(!showCatalogUrl)}
                        />
                      </div>
                    )
                  }
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeDataPath"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label={DUCKLAKE_DATA_PATH_FIELD_COPY.label}
              description={DUCKLAKE_DATA_PATH_FIELD_COPY.description}
            >
              <FormControl>
                <Input {...field} placeholder="s3://bucket/path" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Object storage</p>
        <p className="text-sm text-foreground-light">
          Connection settings and credentials for your S3-compatible object storage.
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="ducklakeS3AccessKeyId"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 access key ID"
              description={
                editMode
                  ? 'Stored access key ID is hidden. Enter a new key ID to replace it.'
                  : 'Required access key ID for the object storage provider.'
              }
            >
              <FormControl>
                <Input
                  {...field}
                  placeholder={editMode ? STORED_SECRET_PLACEHOLDER : undefined}
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
          name="ducklakeS3SecretAccessKey"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 secret access key"
              description={
                editMode
                  ? 'Stored secret access key is hidden. Enter a new secret to replace it.'
                  : 'Required secret access key for the object storage provider.'
              }
            >
              <FormControl>
                <PasswordInput
                  {...field}
                  type={showSecretAccessKey && !editMode ? 'text' : 'password'}
                  placeholder={editMode ? STORED_SECRET_PLACEHOLDER : undefined}
                  value={field.value ?? ''}
                  autoComplete="off"
                  actions={
                    !editMode && (
                      <Button
                        className="w-7"
                        aria-label={
                          showSecretAccessKey
                            ? 'Hide S3 secret access key'
                            : 'Show S3 secret access key'
                        }
                        icon={showSecretAccessKey ? <Eye /> : <EyeOff />}
                        onClick={() => setShowSecretAccessKey(!showSecretAccessKey)}
                      />
                    )
                  }
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeS3Endpoint"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 endpoint"
              description="Public address of your storage provider, without the HTTP or HTTPS prefix."
            >
              <FormControl>
                <Input
                  {...field}
                  placeholder="s3.us-east-1.amazonaws.com"
                  value={field.value ?? ''}
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeS3Region"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 region"
              description="Required region for the object storage provider."
            >
              <FormControl>
                <Input {...field} placeholder="us-east-1" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeS3UrlStyle"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="S3 URL style"
              description="Controls where the bucket name appears in requests to your storage provider."
            >
              <FormControl>
                <Select value={field.value ?? 'path'} onValueChange={field.onChange}>
                  <SelectTrigger>
                    {field.value === 'vhost' ? 'Virtual-host style' : 'Path style'}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="path" className="[&>span]:top-2.5">
                      <p>Path style</p>
                      <p className="text-foreground-lighter">
                        Bucket name appears in the URL path.
                      </p>
                    </SelectItem>
                    <SelectItem value="vhost" className="[&>span]:top-2.5">
                      <p>Virtual-host style</p>
                      <p className="text-foreground-lighter">
                        Bucket name appears in the hostname.
                      </p>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="ducklakeS3UseSsl"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Use SSL"
              description="Controls whether connections to your storage provider use HTTPS."
            >
              <FormControl>
                <Select
                  value={field.value === false ? 'false' : 'true'}
                  onValueChange={(value) => field.onChange(value === 'true')}
                >
                  <SelectTrigger>{field.value === false ? 'Off' : 'On'}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true" className="[&>span]:top-2.5">
                      <p>On</p>
                      <p className="text-foreground-lighter">Encrypts the connection with HTTPS.</p>
                    </SelectItem>
                    <SelectItem value="false" className="[&>span]:top-2.5">
                      <p>Off</p>
                      <p className="text-foreground-lighter">
                        Uses HTTP if your provider requires it.
                      </p>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>

      <div className="flex flex-col gap-y-1">
        <p className="text-sm font-medium text-foreground">Metadata</p>
        <p className="text-sm text-foreground-light">
          Optional schema setting for DuckLake metadata tables.
        </p>
      </div>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="ducklakeMetadataSchema"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Metadata schema"
              description={
                editMode
                  ? 'Schema containing this destination’s DuckLake metadata tables.'
                  : 'New schema where DuckLake metadata will be stored.'
              }
            >
              <FormControl>
                <Input {...field} placeholder="ducklake" value={field.value ?? ''} />
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>
    </div>
  )
}
