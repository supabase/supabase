interface Props {
  children: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
  /**
   * Fades the panel and clicks are disabled
   */
  disabled?: boolean
}

const FormPanel = ({ children, header, footer }: Props) => (
  <div
    className="
      bg-scale-100 
      dark:bg-scale-300 
      border-scale-400 overflow-hidden rounded-md border shadow"
  >
    {header && (
      <div className="bg-scale-100 dark:bg-scale-200 border-scale-400 border-b px-8 py-4">
        {header}
      </div>
    )}
    <div className="space-y-6 py-6">{children}</div>
    {footer && (
      <>
        <div className="border-scale-400 border-t"></div>
        {footer}
      </>
    )}
  </div>
)

export { FormPanel }
