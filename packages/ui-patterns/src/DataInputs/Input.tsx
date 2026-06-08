import { Copy } from 'lucide-react'
import React, {
  ComponentProps,
  ComponentPropsWithoutRef,
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
  InputGroupTextarea,
} from 'ui'

export interface Props
  extends Omit<ComponentProps<typeof BaseInput>, 'onCopy'> {
  copy?: boolean
  showCopyOnHover?: boolean
  onCopy?: () => void
  icon?: any
  reveal?: boolean
  actions?: React.ReactNode
  iconContainerClassName?: string
  containerClassName?: string
  textarea?: boolean
}

const Input = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
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
      iconContainerClassName,
      containerClassName,
      textarea,
      size = 'small',
      type,
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
      })
    }

    function onReveal() {
      setHidden(false)
    }

    const isPasswordHidden = reveal && hidden
    const isTextareaMasked = textarea && (reveal ? hidden : type === 'password')

    const inputControl = textarea ? (
      <InputGroupTextarea
        ref={ref as any}
        {...(props as any)}
        disabled={props.disabled}
        className={props.className}
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
        data-bwignore
        style={{
          ...((props.style ?? {}) as React.CSSProperties),
          ...(isTextareaMasked
            ? ({ WebkitTextSecurity: 'disc' } as React.CSSProperties)
            : {}),
        }}
      />
    ) : (
      <InputGroupInput
        ref={ref as any}
        onFocus={(event) => event.target.select()}
        {...props}
        size={size}
        onCopy={onCopy}
        type={isPasswordHidden ? 'password' : type}
        disabled={props.disabled}
        className={props.className}
        data-1p-ignore // 1Password
        data-lpignore="true" // LastPass
        data-form-type="other" // Dashlane
        data-bwignore // Bitwarden
      />
    )

    return (
      <InputGroup className={containerClassName}>
        {inputControl}
        {icon && <InputGroupAddon align="inline-start">{icon}</InputGroupAddon>}
        {copy || actions ? (
          <InputGroupAddon
            align="inline-end"
            // Override defaults
            className="pr-1 has-[>button]:mr-0 has-[>kbd]:mr-0"
          >
            {copy && !isPasswordHidden ? (
              <InputGroupButton
                size="tiny"
                type="default"
                className={cn(showCopyOnHover && 'opacity-0 group-hover:opacity-100 transition')}
                icon={<Copy size={16} className="text-foreground-muted" />}
                onClick={() => _onCopy(props.value)}
              >
                {copyLabel}
              </InputGroupButton>
            ) : null}
            {reveal && hidden ? (
              <InputGroupButton size="tiny" type="default" onClick={onReveal}>
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
