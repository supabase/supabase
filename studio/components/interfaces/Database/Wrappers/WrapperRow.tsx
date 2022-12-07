import Image from 'next/image'
import { FC } from 'react'
import { Collapsible, Form, IconCheck, IconChevronUp } from 'ui'
import { Wrapper } from './types'

interface Props {
  wrapper: Wrapper
  isOpen: boolean
  onOpen: (wrapper: string) => void
}

const WrapperRow: FC<Props> = ({ wrapper, isOpen, onOpen }) => {
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={() => onOpen(wrapper.name)}
      className={[
        'bg-scale-100 dark:bg-scale-300 ',
        'hover:bg-scale-200 dark:hover:bg-scale-500',
        'data-open:bg-scale-200 dark:data-open:bg-scale-500',
        'border-scale-300',
        'dark:border-scale-500 hover:border-scale-500',
        'dark:hover:border-scale-700 data-open:border-scale-700',
        'data-open:pb-px col-span-12 mx-auto',
        '-space-y-px overflow-hidden',
        'transition border shadow hover:z-50',
        'first:rounded-tl first:rounded-tr',
        'last:rounded-bl last:rounded-br',
      ].join(' ')}
    >
      <Collapsible.Trigger asChild>
        <button
          type="button"
          className="group flex w-full items-center justify-between rounded py-3 px-6 text-scale-1200"
        >
          <div className="flex items-center gap-3">
            <IconChevronUp
              className="text-scale-800 transition data-open-parent:rotate-0 data-closed-parent:rotate-180"
              strokeWidth={2}
              width={14}
            />
            <Image src={wrapper.icon} width={20} height={20} alt={`${wrapper.name} wrapper icon`} />
            <span className="text-sm capitalize">{wrapper.label}</span>
          </div>
          <div className="flex items-center gap-3">
            {false ? (
              <div className="flex items-center gap-1 rounded-full border border-brand-700 bg-brand-200 py-1 px-1 text-xs text-brand-900">
                <span className="rounded-full bg-brand-900 p-0.5 text-xs text-brand-200">
                  <IconCheck strokeWidth={2} size={12} />
                </span>
                <span className="px-1">Enabled</span>
              </div>
            ) : (
              <div className="rounded-md border border-scale-500 bg-scale-100 py-1 px-3 text-xs text-scale-900 dark:border-scale-700 dark:bg-scale-300">
                Disabled
              </div>
            )}
          </div>
        </button>
      </Collapsible.Trigger>
      <Form
        name={`provider-${wrapper.name}-form`}
        initialValues={{}}
        // validationSchema={provider.validationSchema}
        onSubmit={() => {}}
      >
        {({ isSubmitting, handleReset, initialValues, values }: any) => {
          return (
            <Collapsible.Content>
              <div
                className="
                  group border-t
                  border-scale-500 bg-scale-100 py-6 px-6 text-scale-1200 dark:bg-scale-300
                "
              >
                Hello
              </div>
            </Collapsible.Content>
          )
        }}
      </Form>
    </Collapsible>
  )
}

export default WrapperRow
