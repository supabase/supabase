import { BASE_PATH } from 'lib/constants'
import { useState } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import {
  Button,
  CommandGroup_Shadcn_,
  CommandItem_Shadcn_,
  CommandList_Shadcn_,
  Command_Shadcn_,
  IconChevronDown,
  IconTerminal,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
} from 'ui'

interface LanguageSelectorProps {
  /**
   * Only show icons to represent the language
   */
  simplifiedVersion?: boolean
}

const LanguageSelector = ({ simplifiedVersion = false }: LanguageSelectorProps) => {
  const snap = useAppStateSnapshot()
  const [showLanguage, setShowLanguage] = useState(false)

  const updateLanguage = (value: 'js' | 'bash') => {
    snap.setDocsLanguage(value)
    setShowLanguage(false)
  }

  return (
    <div className="flex items-center gap-x-2">
      <Popover_Shadcn_ modal={false} open={showLanguage} onOpenChange={setShowLanguage}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type="default"
            className={simplifiedVersion ? 'px-1' : ''}
            icon={
              simplifiedVersion ? (
                snap.docsLanguage === 'js' ? (
                  <img
                    src={`${BASE_PATH}/img/libraries/javascript-icon.svg`}
                    alt={`javascript logo`}
                    width="14"
                  />
                ) : (
                  <IconTerminal size={14} strokeWidth={2.5} />
                )
              ) : undefined
            }
            iconRight={!simplifiedVersion && <IconChevronDown size={14} strokeWidth={2} />}
          >
            {!simplifiedVersion
              ? `Language: ${snap.docsLanguage === 'js' ? 'Javascript' : 'Bash'}`
              : undefined}
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="p-0 w-24" side="bottom" align="end">
          <Command_Shadcn_>
            <CommandList_Shadcn_>
              <CommandGroup_Shadcn_>
                <CommandItem_Shadcn_
                  className="cursor-pointer"
                  onSelect={() => updateLanguage('js')}
                  onClick={() => updateLanguage('js')}
                >
                  <p>Javascript</p>
                </CommandItem_Shadcn_>
                <CommandItem_Shadcn_
                  className="cursor-pointer"
                  onSelect={() => updateLanguage('bash')}
                  onClick={() => updateLanguage('bash')}
                >
                  <p>Bash</p>
                </CommandItem_Shadcn_>
              </CommandGroup_Shadcn_>
            </CommandList_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>
    </div>
  )
}

export default LanguageSelector
