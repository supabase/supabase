import clsx from 'clsx'
import { Children, PropsWithChildren } from 'react'

const FormSection = ({
  children,
  id,
  header,
  disabled,
  visible = true,
  className,
}: PropsWithChildren<{
  id?: string
  header?: React.ReactNode
  disabled?: boolean
  visible?: boolean
  className?: string
}>) => {
  const classes = clsx(
    'grid grid-cols-12 gap-6 px-8 py-8',
    disabled ? ' opacity-30' : ' opacity-100',
    visible ? ' block' : ' hidden',
    className
  )

  return (
    <div id={id} className={classes}>
      {header}
      {children}
    </div>
  )
}

const FormSectionLabel = ({
  children,
  className = '',
  description,
  htmlFor,
}: PropsWithChildren<{
  className?: string
  description?: React.ReactNode
  htmlFor?: string
}>) => {
  if (description !== undefined) {
    const classes = clsx('flex flex-col space-y-2 col-span-12 lg:col-span-5', className)
    return (
      <div className={classes}>
        <label className="text-foreground text-sm" htmlFor={htmlFor}>
          {children}
        </label>
        {description}
      </div>
    )
  } else {
    const classes = clsx('text-scale-1200 col-span-12 text-sm lg:col-span-5', className)
    return (
      <label className={classes} htmlFor={htmlFor}>
        {children}
      </label>
    )
  }
}

const Shimmer = () => (
  <div className="flex w-full flex-col gap-2">
    <div className="shimmering-loader h-2 w-1/3 rounded"></div>
    <div className="flex flex-col justify-between space-y-2">
      <div className="shimmering-loader h-[34px] w-2/3 rounded" />
    </div>
  </div>
)

const FormSectionContent = ({
  children,
  loading = true,
  fullWidth,
  className,
}: PropsWithChildren<{
  loading?: boolean
  fullWidth?: boolean
  className?: string
}>) => {
  const classes = clsx(
    'relative col-span-12 flex flex-col gap-6 lg:col-span-7',
    fullWidth && '!col-span-12',
    className
  )

  return (
    <div className={classes}>
      {loading ? Children.map(children, (child) => <Shimmer />) : children}
    </div>
  )
}

export { FormSection, FormSectionContent, FormSectionLabel }
