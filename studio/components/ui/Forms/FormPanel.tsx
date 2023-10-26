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
      bg-surface-100
      border-border
      overflow-hidden 
      rounded-md border shadow"
  >
    {header && <div className="border-border border-b px-8 py-4">{header}</div>}
    <div className="divide-border flex flex-col gap-0 divide-y">{children}</div>
    {footer && (
      <>
        <div className="border-border border-t"></div>
        {footer}
      </>
    )}
  </div>
)

export { FormPanel }
