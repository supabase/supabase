import { Copy } from 'lucide-react'
import React, {
  ComponentProps,
  ComponentPropsWithoutRef,
  ElementRef,
  forwardRef,
  useState,
} from 'react'
import { Button, Input_Shadcn_, cn } from 'ui'
import styleHandler from 'ui/src/lib/theme/styleHandler'
import InputIconContainer from '../form/Layout/InputIconContainer'

export const HIDDEN_PLACEHOLDER = '**** **** **** ****'

export interface Props extends Omit<ComponentProps<typeof Input_Shadcn_>, 'size' | 'onCopy'> {
  copy?: boolean
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
      icon,
      reveal = false,
      actions,
      onCopy,
      iconContainerClassName,
      containerClassName,
      ...props
    }: Props,
    ref
  ) => {
    const [copyLabel, setCopyLabel] = useState('Copy')
    const [hidden, setHidden] = useState(true)

    const __styles = styleHandler('input')

    function _onCopy(value: any) {
      navigator.clipboard.writeText(value)?.then(
        function () {
          /* clipboard successfully set */
          setCopyLabel('Copied')
          setTimeout(function () {
            setCopyLabel('Copy')
          }, 3000)
          onCopy?.()
        },
        function () {
          /* clipboard write failed */
          setCopyLabel('Failed to copy')
        }
      )
    }

    function onReveal() {
      setHidden(false)
    }

    let inputClasses = []
    if (icon) inputClasses.push(__styles.with_icon)

    return (
      <div className={cn('relative', containerClassName)}>
        <Input_Shadcn_
          ref={ref}
          {...props}
          onCopy={onCopy}
          value={reveal && hidden ? HIDDEN_PLACEHOLDER : props.value}
          className={cn(...inputClasses, props.className)}
        />
        {icon && <InputIconContainer icon={icon} className={iconContainerClassName} />}
        {copy || actions ? (
          <div className={__styles.actions_container}>
            {/* {error && <InputErrorIcon size={size} />} */}
            {copy && !(reveal && hidden) ? (
              <Button
                size="tiny"
                type="default"
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

// export interface TextAreaProps
//   extends Omit<React.InputHTMLAttributes<HTMLTextAreaElement>, 'size' | 'onCopy'> {
//   textAreaClassName?: string
//   descriptionText?: string | React.ReactNode | undefined
//   error?: string
//   icon?: any
//   label?: string | React.ReactNode
//   afterLabel?: string
//   beforeLabel?: string
//   labelOptional?: string | React.ReactNode
//   layout?: 'horizontal' | 'vertical'
//   rows?: number
//   limit?: number
//   size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge'
//   borderless?: boolean
//   validation?: (x: any) => void
//   copy?: boolean
//   onCopy?: () => void
//   actions?: React.ReactNode
// }

// function TextArea({
//   className,
//   textAreaClassName,
//   descriptionText,
//   disabled,
//   error,
//   icon,
//   id = '',
//   name = '',
//   label,
//   afterLabel,
//   beforeLabel,
//   labelOptional,
//   layout,
//   onChange,
//   onBlur,
//   placeholder,
//   value,
//   style,
//   rows = 4,
//   limit,
//   size,
//   borderless = false,
//   validation,
//   copy = false,
//   onCopy,
//   actions,
//   ...props
// }: TextAreaProps) {
//   const [charLength, setCharLength] = useState(0)
//   const [copyLabel, setCopyLabel] = useState('Copy')

//   function _onCopy(value: any) {
//     navigator.clipboard.writeText(value).then(
//       function () {
//         /* clipboard successfully set */
//         setCopyLabel('Copied')
//         setTimeout(function () {
//           setCopyLabel('Copy')
//         }, 3000)
//         onCopy?.()
//       },
//       function () {
//         /* clipboard write failed */
//         setCopyLabel('Failed to copy')
//       }
//     )
//   }

//   const { formContextOnChange, values, errors, handleBlur, touched, fieldLevelValidation } =
//     useFormContext()

//   if (values && !value) value = values[id || name]

//   function handleBlurEvent(e: React.FocusEvent<HTMLTextAreaElement>) {
//     if (handleBlur) {
//       setTimeout(() => {
//         handleBlur(e)
//       }, 100)
//     }
//     if (onBlur) onBlur(e)
//   }

//   if (!error) {
//     if (errors && !error) error = errors[id || name]
//     error = touched && touched[id || name] ? error : undefined
//   }

//   function onInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
//     setCharLength(e.target.value.length)
//     if (onChange) onChange(e)
//     // update form
//     if (formContextOnChange) formContextOnChange(e)
//     // run field level validation
//     if (validation) fieldLevelValidation(id, validation(e.target.value))
//   }

//   useEffect(() => {
//     if (validation) fieldLevelValidation(id, validation(value))
//   }, [])

//   const __styles = styleHandler('input')

//   let classes = [__styles.base]

//   if (error) classes.push(__styles.variants.error)
//   if (!error) classes.push(__styles.variants.standard)
//   if (icon) classes.push(__styles.with_icon)
//   if (size) classes.push(__styles.size[size])
//   if (disabled) classes.push(__styles.disabled)
//   if (textAreaClassName) classes.push(textAreaClassName)

//   return (
//     <FormLayout
//       className={className}
//       label={label}
//       afterLabel={afterLabel}
//       beforeLabel={beforeLabel}
//       labelOptional={labelOptional}
//       layout={layout}
//       id={id}
//       error={error}
//       descriptionText={descriptionText}
//       style={style}
//       size={size}
//     >
//       <div className={__styles.container}>
//         <textarea
//           disabled={disabled}
//           id={id}
//           name={name}
//           rows={rows}
//           cols={100}
//           placeholder={placeholder}
//           onChange={onInputChange}
//           onBlur={handleBlurEvent}
//           onCopy={onCopy}
//           value={value}
//           className={classes.join(' ')}
//           maxLength={limit}
//           {...props}
//         />
//         {copy || error || actions ? (
//           <div className={__styles['textarea_actions_container']}>
//             <div className={__styles['textarea_actions_container_items']}>
//               {error && <InputErrorIcon size={size} />}
//               {copy && (
//                 <Button
//                   size="tiny"
//                   type="default"
//                   onClick={() => _onCopy(value)}
//                   icon={<IconCopy />}
//                 >
//                   {copyLabel}
//                 </Button>
//               )}
//               {actions && actions}
//             </div>
//           </div>
//         ) : null}
//       </div>
//     </FormLayout>
//   )
// }

// Input.TextArea = TextArea

// export default Input
