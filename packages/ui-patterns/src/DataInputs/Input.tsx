import { Copy } from 'lucide-react'
import React, {
  ComponentProps,
  ComponentPropsWithoutRef,
  ElementRef,
  forwardRef,
  useState,
} from 'react'
import {
  cn,
  copyToClipboard,
  Input_Shadcn_,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from 'ui'
import styleHandler from 'ui/src/lib/theme/styleHandler'

export interface Props extends Omit<ComponentProps<typeof Input_Shadcn_>, 'onCopy'> {
  copy?: boolean
  showCopyOnHover?: boolean
  onCopy?: () => void
  icon?: any
  reveal?: boolean
  actions?: React.ReactNode
  iconContainerClassName?: string
  containerClassName?: string
}

const Input = forwardRef<
  ElementRef<typeof Input_Shadcn_>,
  ComponentPropsWithoutRef<typeof Input_Shadcn_> & Props
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
      size = 'small',
      ...props
    }: Props,
    ref
  ) => {
    const [copyLabel, setCopyLabel] = useState('Copy')
    const [hidden, setHidden] = useState(true)

    const __styles = styleHandler('input')

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

    let inputClasses: string[] = []
    if (size) inputClasses.push(__styles.size[size])

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
          className={cn(...inputClasses, props.className)}
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
