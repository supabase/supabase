import * as Accordion from '@radix-ui/react-accordion'
import React from 'react'
import { IconChevronRight } from '~/../../packages/ui'

const RefDetailCollapse: React.FC<{ id: string; label: string; defaultOpen?: boolean }> = ({
  defaultOpen = true,
  ...props
}) => {
  return (
    <Accordion.Root
      className="AccordionRoot"
      type="single"
      defaultValue={defaultOpen ? `${props.id}` : ''}
      collapsible
    >
      <Accordion.Item className="AccordionItem" value={`${props.id}`}>
        <Accordion.Trigger asChild>
          <button
            className={[
              'transition-all ease-out',
              'h-8',
              'bg-scale-200 data-open:bg-scale-300',
              'dark:bg-scale-300 dark:data-open:bg-scale-500',
              'border border-scale-500 w-full flex items-center gap-3 px-5',
              'rounded-tl rounded-tr',
              'data-closed:rounded-bl data-closed:rounded-br',
              'text-scale-1100 text-xs',
            ].join(' ')}
          >
            <div className="data-open-parent:rotate-90 text-scale-900">
              <IconChevronRight size={12} strokeWidth={2} />
            </div>
            {props.label}
          </button>
        </Accordion.Trigger>
        <Accordion.Content className="transition data-open:animate-slide-down data-closed:animate-slide-up">
          {props.children}
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  )
}

export default RefDetailCollapse
