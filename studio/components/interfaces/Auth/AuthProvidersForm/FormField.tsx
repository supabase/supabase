import { FC, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button, Input, InputNumber, Toggle, Listbox, IconEye, IconEyeOff } from 'ui'
import { Enum } from './AuthProvidersForm.types'

interface Props {
  name: string
  properties: any
  formValues: any
  disabled?: boolean
}

const FormField: FC<Props> = ({ name, properties, formValues, disabled = false }) => {
  if (properties.show && formValues[properties.show.key] !== properties.show.matches) return <></>

  const [hidden, setHidden] = useState(!!properties.isSecret)

  switch (properties.type) {
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
            <span className="mr-3 text-scale-900">
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
          descriptionText={properties.description}
        />
      )

    case 'select':
      return (
        <Listbox
          size="small"
          name={name}
          disabled={disabled}
          label={properties.title}
          descriptionText={properties.description}
          defaultValue={properties.enum[0]}
        >
          {properties.enum.map((option: Enum) => {
            return (
              <Listbox.Option
                id={option.value}
                key={option.value}
                label={option.label}
                value={option.value}
                addOnBefore={() => <img className="h-6 w-6" src={`/img/icons/${option.icon}`} />}
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
