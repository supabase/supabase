import React, { useState } from 'react'
import { Badge, IconCheck, Input, cn } from 'ui'
import useConfData from '../../hooks/use-conf-data'
import { useDebounce } from 'common'

const TicketCustomizationForm = () => {
  const { supabase, userData: user } = useConfData()
  const defaultFormValues = {
    role: user.metadata?.role,
    company: user.metadata?.company,
  }
  const [formData, setFormData] = useState(defaultFormValues)
  const [formState, setFormState] = useState<'idle' | 'saved' | 'saving' | 'error'>('idle')
  const IS_SAVING = formState === 'saving'
  const IS_SAVED = formState === 'saved'
  const HAS_ERROR = formState === 'error'

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = async () => {
    setFormState('saving')
    const payload = { metadata: formData }

    if (supabase) {
      await supabase
        .from('lwx_tickets')
        .update(payload)
        .eq('username', user.username)
        .then((res) => {
          if (res.error) return setFormState('error')
          setFormState('saved')
          setTimeout(() => {
            setFormState('idle')
          }, 1200)
        })
    }
  }

  const debouncedChangeHandler = useDebounce(handleFormSubmit, 1200)

  return (
    <form
      className="w-full grid grid-cols-1 md:grid-cols-3 gap-2 max-w-[300px] md:max-w-none mx-auto"
      onChange={() => debouncedChangeHandler()}
    >
      <Input
        className="[&_input]:border-background"
        size="small"
        type="text"
        placeholder="role (optional)"
        value={formData.role}
        onChange={(event) => {
          handleInputChange('role', event.target.value)
        }}
        disabled={IS_SAVING}
        maxLength={25}
        icon={
          <IconCheck
            strokeWidth={2}
            className={cn(
              'w-3',
              IS_SAVING && 'text-background-surface-300',
              !!formData.role ? 'text-brand' : 'text-background-surface-300'
            )}
          />
        }
      />
      <Input
        className="[&_input]:border-background"
        size="small"
        type="text"
        placeholder="company (optional)"
        value={formData.company}
        maxLength={25}
        onChange={(event) => {
          handleInputChange('company', event.target.value)
        }}
        disabled={IS_SAVING}
        icon={
          <IconCheck
            strokeWidth={2}
            className={cn(
              'w-3',
              IS_SAVING && 'text-background-surface-300',
              !!formData.company ? 'text-brand' : 'text-background-surface-300'
            )}
          />
        }
      />
      <div className="flex items-center justify-end gap-2">
        {IS_SAVED && <span className="opacity-0 animate-fade-in text-xs text-brand">Saved</span>}
        {HAS_ERROR && (
          <span className="opacity-0 animate-fade-in text-xs text-foreground">
            Something went wrong
          </span>
        )}
        <Badge color="brand" className="hidden md:block truncate lg:max-w-sm">
          @{user.username}
        </Badge>
      </div>
    </form>
  )
}

export default TicketCustomizationForm
