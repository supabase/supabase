import { Copy } from 'lucide-react'
import React, {
  ComponentProps,
  ComponentPropsWithoutRef,
  ElementRef,
  forwardRef,
  useState,
} from 'react'
import { Button, cn, copyToClipboard, Input_Shadcn_ } from 'ui'
import styleHandler from 'ui/src/lib/theme/styleHandler'

import InputIconContainer from '../form/Layout/InputIconContainer'

export const HIDDEN_PLACEHOLDER = '**** **** **** ****'

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
    if (icon) inputClasses.push(__styles.with_icon[size ?? 'small'])

    return (
      <div className={cn('relative group', containerClassName)}>
        <Input_Shadcn_
          ref={ref}
          {...props}
          size={size}
          onCopy={onCopy}
          value={reveal && hidden ? HIDDEN_PLACEHOLDER : props.value}
          disabled={reveal && hidden ? true : props.disabled}
          className={cn(...inputClasses, props.className)}
        />
        {icon && <InputIconContainer size={size} icon={icon} className={iconContainerClassName} />}
        {copy || actions ? (
          <div className={__styles.actions_container}>
            {copy && !(reveal && hidden) ? (
              <Button
                size="tiny"
                type="default"
                className={cn(showCopyOnHover && 'opacity-0 group-hover:opacity-100 transition')}
                icon={<Copy size={16} className="text-foreground-muted" />}
                onClick={() => _onCopy(props.value)}
              >
                {copyLabel}
              </Button>
            ) : null}
            {reveal && hidden ? (
              <Button size="tiny" type="default" onClick={onReveal}>
                Reveal
              </Button>
            ) : null}
            {actions && actions}
          </div>
        ) : null}
      </div>
    )
  }
)

export { Input }
