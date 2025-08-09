import Link from 'next/link'
import { useState } from 'react'
import { Button, Input } from 'ui'

import { Eye, EyeOff, HelpCircle, Loader } from 'lucide-react'
import type { ServerOption } from './Wrappers.types'

interface InputFieldProps {
  option: ServerOption
  loading: boolean
  error: any
}

const InputField = ({ option, loading, error }: InputFieldProps) => {
  const [showHidden, setShowHidden] = useState(!option.secureEntry)
  if (option.isTextArea) {
    return (
      <div className="text-area-text-sm text-area-resize-none">
        <Input.TextArea
          key={option.name}
          rows={6}
          error={error}
          className="input-mono"
          disabled={loading}
          id={option.name}
          name={option.name}
          label={
            <div className="flex items-center space-x-2">
              <p>{option.label}</p>
              {option.urlHelper !== undefined && (
                <Link href={option.urlHelper} target="_blank" rel="noreferrer">
                  <HelpCircle
                    strokeWidth={2}
                    size={14}
                    className="text-foreground-light hover:text-foreground cursor-pointer transition"
                  />
                </Link>
              )}
            </div>
          }
          value={loading ? 'Fetching value from Vault...' : undefined}
          defaultValue={option.defaultValue ?? ''}
          required={option.required ?? false}
        />
      </div>
    )
  } else {
    return (
      <Input
        key={option.name}
        id={option.name}
        // The iceberg wrapper uses a dot in the option name, Formik has magic handling for arryas so we need to
        // escape it in the name attribute. https://formik.org/docs/guides/arrays#avoid-nesting
        name={`['${option.name}']`}
        label={
          <div className="flex items-center space-x-2">
            <p>{option.label}</p>
            {option.urlHelper !== undefined && (
              <Link href={option.urlHelper} target="_blank" rel="noreferrer">
                <HelpCircle
                  strokeWidth={2}
                  size={14}
                  className="text-foreground-light hover:text-foreground cursor-pointer transition"
                />
              </Link>
            )}
          </div>
        }
        labelOptional={option.required ? undefined : 'Optional'}
        defaultValue={option.defaultValue ?? ''}
        error={error}
        value={loading ? 'Fetching value from Vault...' : undefined}
        type={!option.secureEntry || loading ? 'text' : showHidden ? 'text' : 'password'}
        disabled={loading || option.readOnly}
        actions={
          loading ? (
            <div className="flex items-center justify-center mr-1">
              <Button disabled type="default" icon={<Loader className="animate-spin" />} />
            </div>
          ) : option.secureEntry ? (
            <div className="flex items-center justify-center mr-1">
              <Button
                type="default"
                icon={showHidden ? <Eye /> : <EyeOff />}
                onClick={() => setShowHidden(!showHidden)}
              />
            </div>
          ) : null
        }
      />
    )
  }
}

export default InputField
