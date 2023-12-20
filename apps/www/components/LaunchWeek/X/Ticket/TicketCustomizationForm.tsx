import React, { useState } from 'react'
import { Button, IconCheck, Input, cn } from 'ui'
import useConfData from '~/components/LaunchWeek/hooks/use-conf-data'
import { useBreakpoint, useDebounce } from 'common'
import { useKey } from 'react-use'

const TicketCustomizationForm = ({ className }: { className?: string }) => {
  const isMobile = useBreakpoint()
  const {
    supabase,
    userData: user,
    showCustomizationForm,
    setShowCustomizationForm,
  } = useConfData()
  const defaultFormValues = {
    role: user.metadata?.role,
    company: user.metadata?.company,
  }
  const [formData, setFormData] = useState(defaultFormValues)
  const [formState, setFormState] = useState<'idle' | 'saved' | 'saving' | 'error'>('idle')
  const IS_SAVING = formState === 'saving'
  const IS_SAVED = formState === 'saved'
  const HAS_ERROR = formState === 'error'

  useKey('Escape', () => setShowCustomizationForm && setShowCustomizationForm(false))

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = async () => {
    setFormState('saving')
    const payload = {
      metadata: {
        ...user.metadata,
        ...formData,
      },
    }

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
      className={cn(
        'w-full grid grid-cols-1 md:grid-cols-3 gap-2 max-w-[300px] md:max-w-none mx-auto -mt-10 transition-all opacity-0 translate-y-3',
        (isMobile || showCustomizationForm) && 'opacity-100 translate-y-0',
        isMobile && 'mt-2',
        className
      )}
      onChange={() => debouncedChangeHandler()}
      onSubmit={(e) => e.preventDefault()}
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
      <div className="flex items-center justify-center md:justify-end gap-2">
        {IS_SAVED && (
          <span className="hidden md:inline opacity-0 animate-fade-in text-xs text-foreground-light">
            Saved
          </span>
        )}
        {HAS_ERROR && (
          <span className="hidden md:inline opacity-0 animate-fade-in text-xs text-foreground">
            Something went wrong
          </span>
        )}
        <Button
          type="outline"
          size="tiny"
          htmlType="submit"
          block={isMobile}
          onClick={() => setShowCustomizationForm && setShowCustomizationForm(false)}
        >
          Done
        </Button>
      </div>
    </form>
  )
}

export default TicketCustomizationForm
