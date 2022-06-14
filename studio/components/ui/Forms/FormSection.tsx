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
const FormSectionContent = ({
  children,
  loading = true,
}: {
  children: React.ReactNode | string
  loading?: boolean
}) => {
  return (
    <div className="relative col-span-12 flex flex-col gap-6 lg:col-span-8">
      {loading ? (
        <div className="flex w-full flex-col gap-2">
          <div className="shimmering-loader h-2 w-1/3 rounded"></div>
          <div className="flex flex-col justify-between space-y-2">
            <div className="shimmering-loader h-[34px] w-2/3 rounded" />
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

export { FormSection, FormSectionContent, FormSectionLabel }
