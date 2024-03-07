import { IconX } from 'ui'

export const BadgeDisabled = ({ name }: { name: string }) => (
  <div
    className={[
      'text-typography-body-light [[data-theme*=dark]_&]:text-typography-body-dark',
      'flex cursor-not-allowed items-center space-x-2 rounded bg-gray-600',
      'py-0.5 px-2 text-sm',
    ].join(' ')}
  >
    <span className="opacity-50">{name}</span>
  </div>
)

export const BadgeSelected = ({
  name,
  handleRemove,
}: {
  name: string
  handleRemove: () => void
}) => (
  <div
    className={[
      'text-typography-body-light [[data-theme*=dark]_&]:text-typography-body-dark',
      'flex items-center space-x-2 rounded bg-surface-300',
      'py-0.5 px-2 text-sm',
    ].join(' ')}
    onClick={(e: any) => e.preventDefault()}
  >
    <span>{name}</span>
    <IconX
      size={12}
      className="cursor-pointer opacity-50 transition hover:opacity-100"
      onClick={(e: any) => {
        e.preventDefault()
        e.stopPropagation()
        handleRemove()
      }}
    />
  </div>
)
