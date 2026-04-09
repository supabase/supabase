import { InputVariants } from '@ui/components/shadcn/ui/input'
import { HelpCircle } from 'lucide-react'
import Link from 'next/link'
import type { Control } from 'react-hook-form'
import { cn, FormControl_Shadcn_, FormField_Shadcn_, Input_Shadcn_, Textarea } from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import type { ServerOption } from './Wrappers.types'

interface InputFieldProps {
  option: ServerOption
  control: Control<any>
  loading?: boolean
}

const InputField = ({ control, option, loading = false }: InputFieldProps) => {
  return (
    <FormField_Shadcn_
      control={control}
      name={option.name}
      defaultValue={option.defaultValue ?? ''}
      render={({ field }) => (
        <FormItemLayout
          name={option.name}
          layout="vertical"
          label={
            <div className="flex items-center space-x-2">
              <p>{option.label}</p>
              {option.urlHelper !== undefined && (
                <Link href={option.urlHelper} target="_blank" rel="noreferrer">
                  <span className="sr-only">Documentation</span>
                  <HelpCircle
                    strokeWidth={2}
                    size={14}
                    className="text-foreground-light hover:text-foreground cursor-pointer transition"
                  />
                </Link>
              )}
            </div>
          }
          labelOptional={!option.required ? 'Optional' : undefined}
          description={option.description}
        >
          <FormControl_Shadcn_>
            {loading ? (
              <span className={cn(InputVariants({ size: 'small' }))}>
                Fetching value from Vault...
              </span>
            ) : option.isTextArea ? (
              <Textarea {...field} id={option.name} rows={6} className="input-mono resize-none" />
            ) : option.secureEntry ? (
              <Input copy reveal {...field} id={option.name} />
            ) : (
              <Input_Shadcn_ {...field} id={option.name} />
            )}
          </FormControl_Shadcn_>
        </FormItemLayout>
      )}
    />
  )
}

export default InputField
