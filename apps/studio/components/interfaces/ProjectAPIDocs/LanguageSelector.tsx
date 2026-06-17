import { ChevronDown, Terminal } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from 'ui'

import { BASE_PATH } from '@/lib/constants'
import { useAppStateSnapshot } from '@/state/app-state'

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
      <Popover modal={false} open={showLanguage} onOpenChange={setShowLanguage}>
        <PopoverTrigger asChild>
          <Button
            variant="default"
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
                  <Terminal size={14} strokeWidth={2.5} />
                )
              ) : undefined
            }
            iconRight={!simplifiedVersion && <ChevronDown size={14} strokeWidth={2} />}
          >
            {!simplifiedVersion
              ? `Language: ${snap.docsLanguage === 'js' ? 'Javascript' : 'Bash'}`
              : undefined}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-24" side="bottom" align="end">
          <Command>
            <CommandList>
              <CommandGroup>
                <CommandItem
                  className="cursor-pointer"
                  onSelect={() => updateLanguage('js')}
                  onClick={() => updateLanguage('js')}
                >
                  <p>Javascript</p>
                </CommandItem>
                <CommandItem
                  className="cursor-pointer"
                  onSelect={() => updateLanguage('bash')}
                  onClick={() => updateLanguage('bash')}
                >
                  <p>Bash</p>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default LanguageSelector
