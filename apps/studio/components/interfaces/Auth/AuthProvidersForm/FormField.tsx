import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { Control } from 'react-hook-form'
import dayjs from 'dayjs'

import { Markdown } from 'components/interfaces/Markdown'
import { DatePicker } from 'components/ui/DatePicker'
import { BASE_PATH } from 'lib/constants'
import {
  Button,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  TextArea_Shadcn_,
  Switch,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import type { Provider } from './AuthProvidersFormValidation'

interface FormFieldProps {
  name: string
  properties: Provider['properties'][string]
  control: Control
  disabled?: boolean
}

function formatDate(date: Date): string {
  return dayjs(date).format('dddd, MMMM D, YYYY HH:mm:ss Z')
}

export const FormField = ({ name, properties, control, disabled = false }: FormFieldProps) => {
  const [hidden, setHidden] = useState(properties.type === `string` && !!properties?.isSecret)

  return (
    <FormField_Shadcn_
      key={name}
      name={name}
      control={control}
      render={({ field }) => {
        switch (properties.type) {
          case 'datetime':
            return (
              <FormItemLayout
                name={name}
                layout="vertical"
                label={properties.title}
                labelOptional={
                  properties.descriptionOptional ? (
                    <Markdown
                      content={properties.descriptionOptional}
                      className="text-foreground-lighter"
                    />
                  ) : null
                }
                description={
                  properties.description ? (
                    <Markdown
                      content={properties.description}
                      className="text-foreground-lighter"
                    />
                  ) : null
                }
              >
                <FormControl_Shadcn_>
                  <DatePicker
                    selectsRange={false}
                    minDate={new Date()}
                    from={field.value}
                    to={field.value}
                    onChange={field.onChange}
                  >
                    <span>{field.value ? `Pick` : formatDate(new Date(field.value))}</span>
                  </DatePicker>
                </FormControl_Shadcn_>
              </FormItemLayout>
            )

          case 'string':
            return (
              <FormItemLayout
                name={name}
                layout="vertical"
                label={properties.title}
                labelOptional={
                  properties.descriptionOptional ? (
                    <Markdown
                      content={properties.descriptionOptional}
                      className="text-foreground-lighter"
                    />
                  ) : null
                }
                description={
                  properties.description ? (
                    <Markdown
                      content={properties.description}
                      className="text-foreground-lighter"
                    />
                  ) : null
                }
              >
                <FormControl_Shadcn_>
                  <Input
                    id={name}
                    type={hidden ? 'password' : 'text'}
                    disabled={disabled}
                    size="small"
                    actions={
                      !!properties.isSecret ? (
                        <Button
                          icon={hidden ? <Eye /> : <EyeOff />}
                          type="default"
                          onClick={() => setHidden(!hidden)}
                        />
                      ) : null
                    }
                    {...field}
                  />
                </FormControl_Shadcn_>
              </FormItemLayout>
            )

          case 'multiline-string':
            return (
              <FormItemLayout
                name={name}
                layout="vertical"
                label={properties.title}
                labelOptional={
                  properties.descriptionOptional ? (
                    <Markdown
                      content={properties.descriptionOptional}
                      className="text-foreground-lighter"
                    />
                  ) : null
                }
                description={
                  properties.description ? (
                    <Markdown
                      content={properties.description}
                      className="text-foreground-lighter"
                    />
                  ) : null
                }
              >
                <FormControl_Shadcn_>
                  <TextArea_Shadcn_ id={name} disabled={disabled} {...field} />
                </FormControl_Shadcn_>
              </FormItemLayout>
            )

          case 'number':
            return (
              <FormItemLayout
                name={name}
                layout="vertical"
                label={properties.title}
                labelOptional={
                  properties.descriptionOptional ? (
                    <Markdown
                      content={properties.descriptionOptional}
                      className="text-foreground-lighter"
                    />
                  ) : null
                }
                description={
                  properties.description ? (
                    <Markdown
                      content={properties.description}
                      className="text-foreground-lighter"
                    />
                  ) : null
                }
              >
                <FormControl_Shadcn_>
                  <Input
                    id={name}
                    type="number"
                    size="small"
                    disabled={disabled}
                    actions={
                      properties.units ? (
                        <Markdown
                          content={properties.units}
                          className="mr-3 text-foreground-lighter"
                        />
                      ) : null
                    }
                  />
                </FormControl_Shadcn_>
              </FormItemLayout>
            )

          case 'boolean':
            return (
              <FormItemLayout
                name={name}
                layout="vertical"
                label={properties.title}
                description={
                  properties.description ? (
                    <Markdown content={properties.description} className="form-field-markdown" />
                  ) : null
                }
              >
                <FormControl_Shadcn_>
                  <Switch
                    id={name}
                    size="small"
                    disabled={disabled}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl_Shadcn_>
              </FormItemLayout>
            )

          case 'select':
            return (
              <FormItemLayout
                name={name}
                layout="vertical"
                label={properties.title}
                description={
                  properties.description ? (
                    <Markdown
                      content={properties.description}
                      className="text-foreground-lighter"
                    />
                  ) : null
                }
              >
                <FormControl_Shadcn_>
                  <Select_Shadcn_ onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger_Shadcn_
                      id="units"
                      className="col-span-4"
                      size="small"
                      disabled={disabled}
                    >
                      <SelectValue_Shadcn_ asChild>
                        <>{properties.enum[0]}</>
                      </SelectValue_Shadcn_>
                    </SelectTrigger_Shadcn_>
                    <SelectContent_Shadcn_>
                      {properties.enum.map((option) => (
                        <SelectItem_Shadcn_
                          id={option.value}
                          key={option.value}
                          value={option.value}
                          className="text-xs"
                        >
                          {option.icon ? (
                            <img
                              alt=""
                              className="h-6 w-6"
                              src={`${BASE_PATH}/img/icons/${option.icon}`}
                            />
                          ) : null}
                          {option.label}
                        </SelectItem_Shadcn_>
                      ))}
                    </SelectContent_Shadcn_>
                  </Select_Shadcn_>
                </FormControl_Shadcn_>
              </FormItemLayout>
            )
        }
      }}
    />
  )
}
