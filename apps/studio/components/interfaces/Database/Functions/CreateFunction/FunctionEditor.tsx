import { Maximize2, Minimize2 } from 'lucide-react'
import { Button, cn, FormControl, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import CodeEditor from '@/components/ui/CodeEditor/CodeEditor'

export const FunctionEditor = ({
  field,
  language,
  focused,
  setFocused,
}: {
  field: any
  language: string
  focused: boolean
  setFocused: (b: boolean) => void
}) => {
  return (
    <div className={cn('rounded-md relative group grow')}>
      <FormControl>
        {language !== undefined && (
          <CodeEditor
            id="database-functions-editor"
            language="pgsql"
            placeholder={language === 'plpgsql' ? `BEGIN\n\nEND;` : undefined}
            value={field.value}
            onInputChange={field.onChange}
          />
        )}
      </FormControl>
      <div
        className={cn(
          'absolute top-0 right-2 bg-surface-300 border border-strong rounded-sm h-[28px]',
          'opacity-0 group-hover:opacity-100 group-hover:top-2 transition-all'
        )}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="text"
              size="tiny"
              className={cn(
                'px-1.5 text-foreground-lighter hover:text-foreground',
                'transition z-50'
              )}
              onClick={() => setFocused(!focused)}
              icon={focused ? <Minimize2 /> : <Maximize2 />}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {focused ? 'Minimize editor' : 'Maximize editor'}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
