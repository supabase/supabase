import { IconX } from '@supabase/ui'

export const BadgeDisabled = (props: any) => (
  <div
    className={[
      'text-typography-body-light dark:text-typography-body-dark',
      'flex cursor-not-allowed items-center space-x-2 rounded bg-gray-600',
      'py-0.5 px-2 text-sm',
    ].join(' ')}
  >
    <span className="opacity-50">{props.name}</span>
  </div>
)

export const BadgeSelected = (props: any) => (
  <div
    className={[
      'text-typography-body-light dark:text-typography-body-dark',
      'flex items-center space-x-2 rounded bg-gray-500',
      'py-0.5 px-2 text-sm',
    ].join(' ')}
  >
    <span>{props.name}</span>
    <IconX
      size={12}
      className="cursor-pointer opacity-50 transition hover:opacity-100"
      onClick={(e: any) => {
        e.preventDefault()
        props.handleRemove()
      }}
    />
  </div>
)
