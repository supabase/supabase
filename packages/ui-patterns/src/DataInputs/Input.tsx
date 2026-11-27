import { Copy } from 'lucide-react'
import React, {
  ComponentProps,
  ComponentPropsWithoutRef,
  ElementRef,
  forwardRef,
  useState,
} from 'react'
import {
  Input as BaseInput,
  cn,
  copyToClipboard,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from 'ui'

export interface Props extends Omit<ComponentProps<typeof BaseInput>, 'onCopy'> {
  copy?: boolean
  showCopyOnHover?: boolean
  onCopy?: () => void
  /** Called only after the Copy button writes to the clipboard, not on native copy events */
  onCopied?: () => void
  /** Called when the user clicks the Reveal button (only when `reveal` is set) */
  onReveal?: () => void
  icon?: any
  reveal?: boolean
  actions?: React.ReactNode
  iconContainerClassName?: string
  containerClassName?: string
}

const Input = forwardRef<
  ElementRef<typeof BaseInput>,
  ComponentPropsWithoutRef<typeof BaseInput> & Props
>(
  (
    {
      copy,
      showCopyOnHover = false,
      icon,
      reveal = false,
      actions,
      onCopy,
      onCopied,
      onReveal,
      iconContainerClassName,
      containerClassName,
      size = 'small',
      ...props
    }: Props,
    ref
  ) => {
    const [copyLabel, setCopyLabel] = useState('Copy')
    const [hidden, setHidden] = useState(true)

    function _onCopy(value: any) {
      copyToClipboard(value, () => {
        /* clipboard successfully set */
        setCopyLabel('Copied')
        setTimeout(function () {
          setCopyLabel('Copy')
        }, 3000)
        onCopy?.()
        onCopied?.()
      })
    }

    function handleReveal() {
      setHidden(false)
      onReveal?.()
    }

    return (
      <InputGroup className={containerClassName}>
        <InputGroupInput
          ref={ref}
          onFocus={(event) => event.target.select()}
          {...props}
          size={size}
          onCopy={onCopy}
          type={reveal && hidden ? 'password' : props.type}
          disabled={props.disabled}
          className={props.className}
          data-1p-ignore // 1Password
          data-lpignore="true" // LastPass
          data-form-type="other" // Dashlane
          data-bwignore // Bitwarden
        />
        {icon && <InputGroupAddon align="inline-start">{icon}</InputGroupAddon>}
        {copy || actions ? (
          <InputGroupAddon
            align="inline-end"
            // Override defaults
            className="pr-1 has-[>button]:mr-0 has-[>kbd]:mr-0"
          >
            {copy && !(reveal && hidden) ? (
              <InputGroupButton
                size="tiny"
                variant="default"
                className={cn(
                  showCopyOnHover &&
                    'opacity-0 group-hover/input-group:opacity-100 group-focus-within/input-group:opacity-100 transition'
                )}
                icon={<Copy size={16} className="text-foreground-muted" />}
                onClick={() => _onCopy(props.value)}
              >
                {copyLabel}
              </InputGroupButton>
            ) : null}
            {reveal && hidden ? (
              <InputGroupButton size="tiny" variant="default" onClick={handleReveal}>
                Reveal
              </InputGroupButton>
            ) : null}
            {actions && actions}
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    )
  }
)

export { Input }
