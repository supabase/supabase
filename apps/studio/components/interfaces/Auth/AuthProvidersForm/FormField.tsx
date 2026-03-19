import { Markdown } from 'components/interfaces/Markdown'
import { DatePicker } from 'components/ui/DatePicker'
import dayjs from 'dayjs'
import { useParams } from 'common'
import { BASE_PATH } from 'lib/constants'
import { Eye, EyeOff, Globe } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import ReactMarkdown from 'react-markdown'
import { Badge, Button, Input, InputNumber, Listbox, Toggle } from 'ui'
import { InfoTooltip } from 'ui-patterns/info-tooltip'

import { AUTH_KEY_TO_ENV_NAME } from 'components/interfaces/EnvironmentVariables/EnvironmentVariables.constants'
import type { EnvironmentVariable } from 'components/interfaces/EnvironmentVariables/EnvironmentVariables.types'
import type { Enum } from './AuthProvidersForm.types'

interface FormFieldProps {
  name: string
  properties: any
  formValues: any
  setFieldValue: (field: string, v: any) => any
  disabled?: boolean
  isEnvVar?: boolean
  envVarScopes?: EnvironmentVariable[]
}

function formatDate(date: Date): string {
  return dayjs(date).format('dddd, MMMM D, YYYY HH:mm:ss Z')
}

const FormField = ({
  name,
  properties,
  formValues,
  disabled = false,
  setFieldValue,
  isEnvVar = false,
  envVarScopes = [],
}: FormFieldProps) => {
  const { ref } = useParams()
  const router = useRouter()
  const [hidden, setHidden] = useState(!!properties.isSecret)
  const [dateAsText, setDateAsText] = useState(
    formValues[name] ? formatDate(new Date(formValues[name])) : ''
  )

  useEffect(() => {
    if (properties.show && properties.show.key && !formValues[properties.show.key]) {
      setFieldValue(name, '')
      setDateAsText('')
    }
  }, [properties.show && properties.show.key && !formValues[properties.show.key]])

  if (properties.show) {
    if (properties.show.matches) {
      if (!properties.show.matches.includes(formValues[properties.show.key])) {
        return null
      }
    } else if (!formValues[properties.show.key]) {
      return null
    }
  }

  switch (properties.type) {
    case 'datetime':
      return (
        <Input
          size="small"
          layout="vertical"
          id={name}
          name={name}
          type="text"
          value={dateAsText}
          readOnly
          label={properties.title}
          labelOptional={
            properties.descriptionOptional ? (
              <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                {properties.descriptionOptional}
              </ReactMarkdown>
            ) : null
          }
          descriptionText={
            properties.description ? (
              <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                {properties.description}
              </ReactMarkdown>
            ) : null
          }
          actions={
            <DatePicker
              selectsRange={false}
              minDate={new Date()}
              from={formValues[name]}
              to={formValues[name]}
              onChange={(date) => {
                if (date && date.to) {
                  setFieldValue(name, date.to)
                  setDateAsText(formatDate(new Date(date.to)))
                } else {
                  setDateAsText('')
                  setFieldValue(name, '')
                }
              }}
            >
              <span>Pick</span>
            </DatePicker>
          }
        />
      )

    case 'string': {
      const envVarName = AUTH_KEY_TO_ENV_NAME[name]

      return (
        <div>
          {isEnvVar && envVarName ? (
            <div className="space-y-1">
              <label className="text-sm text-foreground-light">{properties.title}</label>
              <button
                type="button"
                onClick={() => router.push(`/project/${ref}/environment-variables`)}
                className="flex h-[34px] w-full items-center rounded-md overflow-hidden hover:opacity-80 transition-opacity"
              >
                <div className="flex h-full items-center px-2.5 bg-[rgba(89,210,247,0.12)] border-t border-b border-l border-[rgba(34,128,157,0.4)] rounded-l-md">
                  <Globe size={13} className="shrink-0 text-[#25c8ff]" strokeWidth={1.5} />
                </div>
                <div className="flex h-full flex-1 items-center gap-2 px-2.5 bg-[rgba(89,210,247,0.12)] border border-[rgba(34,128,157,0.4)] rounded-r-md">
                  <span className="font-mono text-xs text-[#25c8ff] truncate flex-1 text-left">
                    {properties.isSecret ? '••••••••' : formValues[name]}
                  </span>
                  {envVarScopes.map((v) => (
                    <span
                      key={v.sourceKey}
                      className="text-[10px] leading-none shrink-0 rounded-full border border-border bg-surface-100 px-1.5 py-[3px] text-foreground-lighter"
                    >
                      {v.scope === null
                        ? 'All'
                        : v.scope === 'branch'
                          ? v.branch
                          : v.scope === 'preview'
                            ? 'All Previews'
                            : v.scope}
                    </span>
                  ))}
                </div>
              </button>

              {properties.description && (
                <Markdown content={properties.description} className="text-xs text-foreground-lighter" />
              )}
            </div>
          ) : (
            <Input
              size="small"
              layout="vertical"
              id={name}
              name={name}
              disabled={disabled}
              type={hidden ? 'password' : 'text'}
              label={properties.title}
              labelOptional={
                properties.descriptionOptional ? (
                  <Markdown
                    content={properties.descriptionOptional}
                    className="text-foreground-lighter"
                  />
                ) : null
              }
              descriptionText={
                properties.description ? (
                  <Markdown content={properties.description} className="text-foreground-lighter" />
                ) : null
              }
              actions={
                !!properties.isSecret ? (
                  <Button
                    icon={hidden ? <Eye /> : <EyeOff />}
                    type="default"
                    onClick={() => setHidden(!hidden)}
                  />
                ) : (
                  <span className="mr-3 text-foreground-lighter">
                    {properties.units ? (
                      <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                        {properties.units}
                      </ReactMarkdown>
                    ) : null}
                  </span>
                )
              }
            />
          )}
          {AUTH_KEY_TO_ENV_NAME[name] && (
            <div className="mt-1">
              <Badge variant="secondary" className="font-mono text-xs text-foreground-lighter">
                {AUTH_KEY_TO_ENV_NAME[name]}
              </Badge>
            </div>
          )}
        </div>
      )
    }

    case 'multiline-string':
      return (
        <div>
          <Input.TextArea
            size="small"
            layout="vertical"
            id={name}
            name={name}
            disabled={disabled}
            type={hidden ? 'password' : 'text'}
            label={properties.title}
            labelOptional={
              properties.descriptionOptional ? (
                <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                  {properties.descriptionOptional}
                </ReactMarkdown>
              ) : undefined
            }
            descriptionText={
              properties.description ? (
                <Markdown content={properties.description} className="text-foreground-lighter" />
              ) : null
            }
            actions={
              !!properties.isSecret ? (
                <Button
                  icon={hidden ? <Eye /> : <EyeOff />}
                  type="default"
                  onClick={() => setHidden(!hidden)}
                />
              ) : (
                <span className="mr-3 text-scale-900">
                  {properties.units ? (
                    <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                      {properties.units}
                    </ReactMarkdown>
                  ) : null}
                </span>
              )
            }
          />
          {AUTH_KEY_TO_ENV_NAME[name] && (
            <div className="mt-1">
              <Badge variant="secondary" className="font-mono text-xs text-foreground-lighter">
                {AUTH_KEY_TO_ENV_NAME[name]}
              </Badge>
            </div>
          )}
        </div>
      )

    case 'number':
      return (
        <InputNumber
          size="small"
          layout="vertical"
          id={name}
          name={name}
          disabled={disabled}
          label={properties.title}
          labelOptional={
            properties.descriptionOptional ? (
              <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                {properties.descriptionOptional}
              </ReactMarkdown>
            ) : null
          }
          descriptionText={
            properties.description ? (
              <Markdown content={properties.description} className="text-foreground-lighter" />
            ) : null
          }
          actions={
            <span className="mr-3 text-foreground-lighter">
              {properties.units ? (
                <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                  {properties.units}
                </ReactMarkdown>
              ) : null}
            </span>
          }
        />
      )

    case 'boolean':
      return (
        <Toggle
          size="small"
          id={name}
          name={name}
          disabled={disabled}
          label={
            <div className="flex items-center gap-x-2">
              <span>{properties.title}</span>
              {properties.link && (
                <a href={properties.link} target="_blank" rel="noreferrer noopener">
                  <InfoTooltip side="bottom">Documentation</InfoTooltip>
                </a>
              )}
            </div>
          }
          descriptionText={
            properties.description ? <Markdown content={properties.description} /> : null
          }
        />
      )

    case 'select':
      return (
        <Listbox
          size="small"
          name={name}
          disabled={disabled}
          label={properties.title}
          descriptionText={
            properties.description ? (
              <ReactMarkdown
                unwrapDisallowed
                disallowedElements={['p']}
                className="form-field-markdown"
              >
                {properties.description}
              </ReactMarkdown>
            ) : null
          }
          defaultValue={properties.enum[0]}
        >
          {properties.enum.map((option: Enum) => {
            return (
              <Listbox.Option
                id={option.value}
                key={option.value}
                label={option.label}
                value={option.value}
                addOnBefore={() => {
                  return option.icon ? (
                    <img
                      alt={`${option.label} icon`}
                      className="h-6 w-6"
                      src={`${BASE_PATH}/img/icons/${option.icon}`}
                    />
                  ) : null
                }}
              >
                {option.label}
              </Listbox.Option>
            )
          })}
        </Listbox>
      )

    default:
      break
  }

  return null
}

export default FormField
