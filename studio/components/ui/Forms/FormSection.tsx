const FormSection = ({
  children,
  header,
}: {
  children: React.ReactNode
  header?: React.ReactNode
}) => (
  <div className="grid grid-cols-12 gap-6 px-8 py-2">
    {header}
    {children}
  </div>
)

const FormSectionLabel = ({ children }: { children: React.ReactNode | string }) => {
  return <label className="text-scale-1200 col-span-12 text-sm lg:col-span-4">{children}</label>
}
const FormSectionContent = ({ children }: { children: React.ReactNode | string }) => {
  return <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">{children}</div>
}

export { FormSection, FormSectionContent, FormSectionLabel }
