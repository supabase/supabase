import Link from 'next/link'
import { useState } from 'react'
import { Button, IconEye, IconEyeOff, IconHelpCircle, IconLoader, Input } from 'ui'

import { ServerOption } from './Wrappers.types'

interface InputFieldProps {
  option: ServerOption
  loading: boolean
  error: any
}

const InputField = ({ option, loading, error }: InputFieldProps) => {
  const [showHidden, setShowHidden] = useState(!option.hidden)
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
                <Link href={option.urlHelper}>
                  <a target="_blank" rel="noreferrer">
                    <IconHelpCircle
                      strokeWidth={2}
                      size={14}
                      className="text-scale-1000 hover:text-scale-1200 cursor-pointer transition"
                    />
                  </a>
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
        name={option.name}
        label={
          <div className="flex items-center space-x-2">
            <p>{option.label}</p>
            {option.urlHelper !== undefined && (
              <Link href={option.urlHelper}>
                <a target="_blank" rel="noreferrer">
                  <IconHelpCircle
                    strokeWidth={2}
                    size={14}
                    className="text-scale-1000 hover:text-scale-1200 cursor-pointer transition"
                  />
                </a>
              </Link>
            )}
          </div>
        }
        defaultValue={option.defaultValue ?? ''}
        error={error}
        value={loading ? 'Fetching value from Vault...' : undefined}
        type={!option.hidden || loading ? 'text' : showHidden ? 'text' : 'password'}
        disabled={loading}
        actions={
          loading ? (
            <div className="flex items-center justify-center mr-1">
              <Button disabled type="default" icon={<IconLoader className="animate-spin" />} />
            </div>
          ) : option.hidden ? (
            <div className="flex items-center justify-center mr-1">
              <Button
                type="default"
                icon={showHidden ? <IconEye /> : <IconEyeOff />}
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
