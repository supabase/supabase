import { DatePicker } from 'components/ui/DatePicker'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button, IconEye, IconEyeOff, Input, InputNumber, Listbox, Toggle } from 'ui'

import { BASE_PATH } from 'lib/constants'
import { Enum } from './AuthProvidersForm.types'

interface FormFieldProps {
  name: string
  properties: any
  formValues: any
  disabled?: boolean
}

function formatDate(date: Date): string {
  return dayjs(date).format('dddd, MMMM D, YYYY HH:mm:ss Z')
}

const FormField = ({ name, properties, formValues, disabled = false }: FormFieldProps) => {
  const [hidden, setHidden] = useState(!!properties.isSecret)
  const [dateAsText, setDateAsText] = useState(
    formValues[name] ? formatDate(new Date(formValues[name])) : ''
  )

  useEffect(() => {
    if (properties.show && properties.show.key && !formValues[properties.show.key]) {
      formValues[name] = ''
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
                  formValues[name] = date.to
                  setDateAsText(formatDate(new Date(date.to)))
                } else {
                  setDateAsText('')
                  formValues[name] = ''
                }
              }}
            >
              <span>Pick</span>
            </DatePicker>
          }
        />
      )

    case 'string':
      return (
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
            !!properties.isSecret ? (
              <Button
                icon={hidden ? <IconEye /> : <IconEyeOff />}
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
      )
    case 'multiline-string':
      return (
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
              <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                {properties.description}
              </ReactMarkdown>
            ) : null
          }
          actions={
            !!properties.isSecret ? (
              <Button
                icon={hidden ? <IconEye /> : <IconEyeOff />}
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
              <ReactMarkdown unwrapDisallowed disallowedElements={['p']}>
                {properties.description}
              </ReactMarkdown>
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
                addOnBefore={() => (
                  <img className="h-6 w-6" src={`${BASE_PATH}/img/icons/${option.icon}`} />
                )}
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

  return <></>
}

export default FormField
