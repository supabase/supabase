import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import {
  Button,
  cn,
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
  CLICKHOUSE_DATABASE_FIELD_COPY,
  CLICKHOUSE_ENGINE_FIELD_COPY,
  CLICKHOUSE_URL_FIELD_COPY,
} from '../DestinationFormFieldCopy'

export const ClickHouseFields = ({
  form,
  editMode,
  className,
}: {
  form: UseFormReturn<DestinationPanelSchemaType>
  editMode: boolean
  className?: string
}) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className={cn('flex flex-col gap-y-6 p-5', className)}>
      <p className="text-sm font-medium text-foreground">ClickHouse settings</p>

      <div className="flex flex-col gap-y-4">
        <FormField
          control={form.control}
          name="clickhouseUrl"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label={CLICKHOUSE_URL_FIELD_COPY.label}
              description={CLICKHOUSE_URL_FIELD_COPY.description}
            >
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="https://your-cluster.clickhouse.cloud:8443"
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="clickhouseUser"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="User"
              description="ClickHouse user with permission to write to the target database"
            >
              <FormControl>
                <Input {...field} value={field.value ?? ''} placeholder="default" />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="clickhousePassword"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label="Password"
              description={
                editMode
                  ? 'Stored password is hidden. Enter a new password to replace it.'
                  : 'Omit for passwordless access'
              }
            >
              <FormControl>
                <PasswordInput
                  value={field.value ?? ''}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={editMode ? STORED_SECRET_PLACEHOLDER : 'Optional'}
                  onChange={(event) => field.onChange(event.target.value)}
                  actions={
                    <div className="flex items-center justify-center">
                      <Button
                        variant="default"
                        className="w-7"
                        title={showPassword ? 'Hide password' : 'Show password'}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <Eye /> : <EyeOff />}
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </div>
                  }
                />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="clickhouseDatabase"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label={CLICKHOUSE_DATABASE_FIELD_COPY.label}
              description={CLICKHOUSE_DATABASE_FIELD_COPY.description}
            >
              <FormControl>
                <Input {...field} value={field.value ?? ''} placeholder="default" />
              </FormControl>
            </FormItemLayout>
          )}
        />

        <FormField
          control={form.control}
          name="clickhouseEngine"
          render={({ field }) => (
            <FormItemLayout
              layout="horizontal"
              label={CLICKHOUSE_ENGINE_FIELD_COPY.label}
              description={CLICKHOUSE_ENGINE_FIELD_COPY.description}
            >
              <FormControl>
                <Select
                  value={field.value ?? 'replacing_merge_tree'}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>{field.value ?? 'replacing_merge_tree'}</SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replacing_merge_tree">replacing_merge_tree</SelectItem>
                    <SelectItem value="merge_tree">merge_tree</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItemLayout>
          )}
        />
      </div>
    </div>
  )
}
