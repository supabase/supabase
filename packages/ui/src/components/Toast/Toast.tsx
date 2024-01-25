import * as Portal from '@radix-ui/react-portal'
import React, { ComponentProps } from 'react'
import {
  Toast as HotToastProps,
  Toaster as HotToaster,
  ToastType,
  toast as hotToast,
  resolveValue,
} from 'react-hot-toast'
import { IconAlertCircle } from '../Icon/icons/IconAlertCircle'
import { IconCheck } from '../Icon/icons/IconCheck'
import { IconLoader } from '../Icon/icons/IconLoader'
import { IconX } from '../Icon/icons/IconX'
// @ts-ignore
import Typography from '../Typography'
import ToastStyles from './Toast.module.css'

const icons: Partial<{ [key in ToastType]: any }> = {
  error: <IconAlertCircle size="medium" strokeWidth={2} />,
  success: <IconCheck size="medium" strokeWidth={2} />,
}

export interface ToastProps extends HotToastProps {
  description?: string
  closable?: boolean
  actions?: React.ReactNode
  actionsPosition?: 'inline' | 'bottom'
  width?: 'xs' | 'sm' | 'md'
}

function Message({ children, ...props }: ComponentProps<typeof Typography.Text>) {
  return (
    <Typography.Text className={ToastStyles['sbui-toast-message']} {...props}>
      {children}
    </Typography.Text>
  )
}

function Description({ children, ...props }: ComponentProps<typeof Typography.Text>) {
  return (
    <Typography.Text className={ToastStyles['sbui-toast-description']} {...props}>
      {children}
    </Typography.Text>
  )
}

/**
 * react-hot-toast is used under-the-hood and is a required dependency.
 *
 * Add `<Toast.Toaster />` to your app or wrap it around your components `<Toast.Toaster><Components /></Toast.Toaster>`
 *
 * You can also just use react-hot-toast's `toast` for basic toasts:
 *
 * `toast.success('Complete!')`
 *
 *  For the extra features you need to use the `Toast.toast` wrapper:
 *
 * `Toast.toast('Message', { description: 'Description', actions: [<SomeButton />] })`
 */
function Toast({
  id,
  visible,
  type,
  icon,
  description,
  closable = true,
  actions,
  actionsPosition = 'inline',
  message,
  width,
  ...rest
}: ToastProps) {
  let containerClasses = [ToastStyles['sbui-toast-container']]
  if (type) {
    containerClasses.push(ToastStyles[`sbui-toast-container--${type}`])
  }
  if (width === 'sm' || width === 'md') {
    containerClasses.push(ToastStyles[`sbui-toast-container--${width}`])
  }

  let closeButtonClasses = [ToastStyles['sbui-toast-close-button']]
  if (type) {
    closeButtonClasses.push(ToastStyles[`sbui-toast-close-button--${type}`])
  }

  let detailsClasses = [ToastStyles['sbui-toast-details']]
  if (actionsPosition === 'bottom') {
    detailsClasses.push(ToastStyles[`sbui-toast-details--actions-bottom`])
  }

  const _message =
    typeof message === 'string' ? (
      <Message>{message}</Message>
    ) : (
      resolveValue(message, { id, type, message, visible, ...rest })
    )

  return (
    <div className={`${containerClasses.join(' ')} ${visible ? 'animate-enter' : 'animate-leave'}`}>
      <div>
        <Typography.Text className={ToastStyles['sbui-toast-icon-container']}>
          {type === 'loading' ? (
            <IconLoader
              size="medium"
              strokeWidth={2}
              className={ToastStyles['sbui-alert--anim--spin']}
            />
          ) : (
            icon || icons[type]
          )}
        </Typography.Text>
        <div className={detailsClasses.join(' ')}>
          <div className={ToastStyles['sbui-toast-details__content']}>
            {_message}
            {description && <Description>{description}</Description>}
          </div>
          {actions && <div className={ToastStyles['sbui-toast-details__actions']}>{actions}</div>}
        </div>
        {closable && (
          <div className={ToastStyles['sbui-toast-close-container']}>
            <button
              aria-label="Close alert"
              className={closeButtonClasses.join(' ')}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                hotToast.dismiss(id)
              }}
            >
              <span className="sr-only">Close</span>
              <IconX className="h-5 w-5" aria-hidden="true" size="small" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface ToasterProps {
  children?: React.ReactNode
}

function Toaster({ children }: ToasterProps) {
  return (
    <Portal.Root className="portal--toast">
      <HotToaster position="bottom-right">
        {({ message, ...t }) =>
          typeof message === 'string' ? (
            <Toast message={message} {...t} />
          ) : (
            <>{resolveValue(message, { message, ...t })}</>
          )
        }
      </HotToaster>
      {children}
    </Portal.Root>
  )
}

type ToastOptions = Partial<
  Pick<
    ToastProps,
    | 'id'
    | 'icon'
    | 'duration'
    | 'position'
    | 'ariaProps'
    | 'style'
    | 'className'
    | 'iconTheme'
    | 'type'
    | 'description'
    | 'closable'
    | 'actions'
    | 'actionsPosition'
  >
>

export function toast(message: string, opts?: ToastOptions) {
  const { description, closable, actions, actionsPosition, type, ...rest } = opts || {}

  return hotToast(
    ({ message: _m, type: _t, ...t }) => (
      <Toast
        message={message}
        description={description}
        closable={closable}
        actions={actions}
        actionsPosition={actionsPosition}
        type={type || 'success'}
        {...t}
      />
    ),
    rest
  )
}

const createToastType = (type: ToastType) => (message: string, opts?: Omit<ToastOptions, 'type'>) =>
  toast(message, { ...opts, type })

toast.success = createToastType('success')
toast.error = createToastType('error')
toast.loading = createToastType('loading')
toast.promise = (...args: Parameters<typeof hotToast.promise>) => hotToast.promise(...args)

Toast.Toaster = Toaster
Toast.toast = toast

export default Toast
