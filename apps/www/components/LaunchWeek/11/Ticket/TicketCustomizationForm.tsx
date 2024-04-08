import React, { useEffect, useState } from 'react'
import { Button, Checkbox, Input, cn } from 'ui'
import { Check } from 'lucide-react'
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
    hideAvatar: !!user.metadata?.hideAvatar,
  }
  const [formData, setFormData] = useState(defaultFormValues)
  const [formState, setFormState] = useState<'idle' | 'saved' | 'saving' | 'error'>('idle')
  const IS_SAVING = formState === 'saving'
  const IS_SAVED = formState === 'saved'
  const HAS_ERROR = formState === 'error'

  useKey('Escape', () => setShowCustomizationForm && setShowCustomizationForm(false))

  const handleInputChange = (name: string, value: string | boolean) => {
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
        .from('lw11_tickets')
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

  useEffect(() => {
    return () => setShowCustomizationForm && setShowCustomizationForm(false)
  }, [])

  return (
    <form
      className={cn(
        'w-full rounded-xl bg-alternative border p-4 flex flex-col gap-2 mx-auto transition-all opacity-0 translate-y-full text-foreground-light',
        showCustomizationForm && 'opacity-100 translate-y-0 duration-300',
        isMobile && 'mt-2',
        className
      )}
      onChange={(e) => {
        e.preventDefault()
        debouncedChangeHandler()
      }}
      onSubmit={(e) => {
        e.preventDefault()
        handleFormSubmit()
      }}
    >
      <Input
        size="small"
        type="text"
        placeholder="role (optional)"
        value={formData.role}
        onChange={(event) => {
          handleInputChange('role', event.target.value)
        }}
        onFocus={() =>
          !showCustomizationForm && setShowCustomizationForm && setShowCustomizationForm(true)
        }
        inputClassName={cn(IS_SAVING && 'text-foreground-lighter')}
        maxLength={25}
        icon={
          <Check
            strokeWidth={2}
            className={cn(
              'w-3',
              !!formData.role ? 'text-brand' : 'text-foreground-lighter',
              IS_SAVING && 'text-background-surface-300'
            )}
          />
        }
      />
      <Input
        size="small"
        type="text"
        placeholder="company (optional)"
        value={formData.company}
        maxLength={25}
        onChange={(event) => {
          handleInputChange('company', event.target.value)
        }}
        onFocus={() =>
          !showCustomizationForm && setShowCustomizationForm && setShowCustomizationForm(true)
        }
        inputClassName={cn(IS_SAVING && 'text-foreground-lighter')}
        icon={
          <Check
            strokeWidth={2}
            className={cn(
              'w-3',
              !!formData.company ? 'text-brand' : 'text-foreground-lighter',
              IS_SAVING && 'text-background-surface-300'
            )}
          />
        }
      />
      <Checkbox
        name="hideAVatar"
        label="Hide avatar"
        checked={formData.hideAvatar}
        onChange={(event) => {
          handleInputChange('hideAvatar', event.target.checked)
        }}
      />
      <div className="flex items-center justify-center md:justify-between gap-2 mt-2">
        <div className="hidden md:inline opacity-0 animate-fade-in text-xs text-foreground-light">
          {IS_SAVED && (
            <span className="hidden md:inline opacity-0 animate-fade-in text-xs text-foreground-light">
              Saved
            </span>
          )}
          {HAS_ERROR && (
            <span className="hidden md:inline opacity-0 animate-fade-in text-xs text-foreground-light">
              Something went wrong
            </span>
          )}
        </div>
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
