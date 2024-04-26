import { Check, ChevronsUpDown } from 'lucide-react'
import { noop } from 'lodash'
import { useState } from 'react'
import { useCheckPermissions } from 'hooks'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import {
  Button_Shadcn_ as Button,
  Popover_Shadcn_ as Popover,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
  PopoverContent_Shadcn_ as PopoverContent,
  Command_Shadcn_ as Command,
  CommandInput_Shadcn_ as CommandInput,
  CommandEmpty_Shadcn_ as CommandEmpty,
  CommandItem_Shadcn_ as CommandItem,
  CommandGroup_Shadcn_ as CommandGroup,
  cn,
  ScrollArea,
  Input,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
  Tabs_Shadcn_ as Tabs,
  Toggle,
} from 'ui'
import SchemaFunctionSelector from './SchemaFunctionSelector'
import randomBytes from 'randomBytes'

export interface ComboBoxOption {
  id: string
  value: string
  displayName: string
}

export function generateAuthHookSecret() {
  const secretByteLength = 60
  const buffer = randomBytes(secretByteLength)
  const base64String = buffer.toString('base64')
  return `v1,whsec_${base64String}`
}

export function HookSelector<Opt extends ComboBoxOption>({
  uriId,
  enabledId,
  secretId,
  values,
  setFieldValue,
  descriptionTextPostgres,
  descriptionTextWeb,
  disabled,
}: {
  uriId: string
  enabledId: string
  secretId: string
  values: any
  setFieldValue: (field: string, value: any) => void
  descriptionTextWeb: string
  descriptionTextPostgres: string
  disabled?: boolean
}) {
  let initialTabValue: 'https' | 'postgres' = 'postgres'

  if (typeof values[uriId] === 'string' && values[uriId].startsWith('http')) {
    initialTabValue = 'https'
  }

  const [tabValue, setTabValue] = useState(initialTabValue)
  const [httpsValues, setHttpsValues] = useState(
    tabValue === 'https'
      ? { [uriId]: values[uriId], [enabledId]: values[enabledId], [secretId]: values[secretId] }
      : {}
  )
  const [postgresValues, setPostgresValues] = useState(
    tabValue !== 'https' ? { [uriId]: values[uriId], [enabledId]: values[enabledId] } : {}
  )

  return (
    <Tabs
      value={tabValue}
      onValueChange={(value) => {
        if (value === 'https') {
          // Preserve state when switching fields
          setPostgresValues({ [uriId]: values[uriId], [enabledId]: values[enabledId] })
          setFieldValue(uriId, httpsValues[uriId], false)
          setFieldValue(enabledId, httpsValues[enabledId], false)
          setFieldValue(secretId, httpsValues[secretId], false)
        } else {
          setHttpsValues({
            [uriId]: values[uriId],
            [enabledId]: values[enabledId],
            [secretId]: values[secretId],
          })
          setFieldValue(uriId, postgresValues[uriId], false)
          setFieldValue(enabledId, postgresValues[enabledId], false)
        }

        setTabValue(value)
      }}
    >
      <TabsList>
        <TabsTrigger value="postgres" disabled={disabled}>
          Postgres Function
        </TabsTrigger>
        <TabsTrigger value="https" disabled={disabled}>
          Web (HTTPS)
        </TabsTrigger>
      </TabsList>
      <TabsContent value="https">
        <div className="flex flex-col gap-4">
          <Input
            id={uriId}
            label="Web (HTTPS) endpoint URL"
            descriptionText={descriptionTextWeb}
            placeholder="https://hooks.example.com/hooks"
            disabled={disabled}
          />
          {values[uriId] && (
            <>
              <div className="flex items-center space-x-2 w-full">
                <Input
                  key={secretId + '/web'}
                  id={secretId}
                  label="HTTPS Hook Secret"
                  descriptionText={'Enter or generate a hook secret. '}
                  disabled={disabled}
                  className="w-4/5"
                />

                <Button
                  size="small"
                  type="secondary"
                  onClick={(e) => {
                    e.preventDefault()
                    const authHookSecret = generateAuthHookSecret()
                    setFieldValue(secretId, authHookSecret, false)
                  }}
                  className="w-1/5 text-xs text-black bg-red-900"
                  disabled={disabled}
                >
                  Generate Secret
                </Button>
              </div>
              <Toggle
                key={enabledId + '/web'}
                id={enabledId}
                name={enabledId}
                size="medium"
                label="Enable this web (HTTPS) endpoint"
                layout="flex"
                disabled={disabled}
              />
            </>
          )}
        </div>
      </TabsContent>
      <TabsContent value="postgres">
        <div className="flex flex-col gap-4">
          <SchemaFunctionSelector
            id={uriId}
            descriptionText={descriptionTextPostgres}
            values={values}
            setFieldValue={setFieldValue}
            disabled={disabled}
          />
          {values[uriId] && (
            <Toggle
              key={enabledId + '/postgres'}
              id={enabledId}
              name={enabledId}
              size="medium"
              label="Enable this Postgres function"
              layout="flex"
              disabled={disabled}
            />
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}

export default HookSelector
