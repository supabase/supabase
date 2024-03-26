import React, { useState } from 'react'
import { Badge, IconCheck, Input } from 'ui'
import { UserData } from '../../hooks/use-conf-data'
import { SupabaseClient } from '@supabase/supabase-js'
import { useDebounce } from 'common'

interface Props {
  supabase: SupabaseClient
  user: UserData
}

const TicketCustomizationForm = ({ supabase, user }: Props) => {
  const defaultFormValues = {
    role: user.metadata?.role,
    company: user.metadata?.company,
    location: user.metadata?.location,
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
        .from('lw8_tickets')
        .update(payload)
        .eq('username', user.username)
        .then((res) => {
          if (res.error) return setFormState('error')
          setFormState('saved')
          setTimeout(() => {
            setFormState('idle')
          }, 1800)
        })
    }
  }

  const debouncedChangeHandler = useDebounce(handleFormSubmit, 1200)

  return (
    <form className="w-full flex flex-col gap-2 mt-4" onChange={() => debouncedChangeHandler()}>
      <div className="flex items-center justify-between">
        {!IS_SAVED && !HAS_ERROR && (
          <span className="opacity-0 animate-fade-in text-foreground-lighter text-xs">
            Connected account
          </span>
        )}
        {IS_SAVED && <span className="opacity-0 animate-fade-in text-xs text-brand">Saved</span>}
        {HAS_ERROR && (
          <span className="opacity-0 animate-fade-in text-xs text-tomato-900">
            Something went wrong
          </span>
        )}
        <Badge variant="brand">@{user.username}</Badge>
      </div>
      <Input
        className="[&_input]:border-background"
        size="small"
        type="text"
        required
        disabled
        placeholder="name"
        value={user.name}
        icon={<IconCheck strokeWidth={2} className="w-3 text-brand" />}
      />
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
        maxLength={30}
        icon={
          <IconCheck
            strokeWidth={2}
            className={[
              'w-3',
              IS_SAVING && 'text-background-surface-300',
              !!formData.role ? 'text-brand' : 'text-background-surface-300',
            ].join(' ')}
          />
        }
      />
      <Input
        className="[&_input]:border-background"
        size="small"
        type="text"
        placeholder="company (optional)"
        value={formData.company}
        maxLength={30}
        onChange={(event) => {
          handleInputChange('company', event.target.value)
        }}
        disabled={IS_SAVING}
        icon={
          <IconCheck
            strokeWidth={2}
            className={[
              'w-3',
              IS_SAVING && 'text-background-surface-300',
              !!formData.company ? 'text-brand' : 'text-background-surface-300',
            ].join(' ')}
          />
        }
      />
      <Input
        className="[&_input]:border-background"
        size="small"
        type="text"
        placeholder="location (optional)"
        value={formData.location}
        onChange={(event) => {
          handleInputChange('location', event.target.value)
        }}
        disabled={IS_SAVING}
        maxLength={20}
        icon={
          <IconCheck
            strokeWidth={2}
            className={[
              'w-3 flex spin',
              IS_SAVING && 'text-background-surface-300',
              !!formData.location ? 'text-brand' : 'text-background-surface-300',
            ].join(' ')}
          />
        }
      />
    </form>
  )
}

export default TicketCustomizationForm
