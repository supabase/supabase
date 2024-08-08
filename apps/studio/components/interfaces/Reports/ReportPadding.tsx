import { PropsWithChildren } from 'react'

/**
 * Standardized padding and width layout for non-custom reports
 */
const ReportPadding = ({ children }: PropsWithChildren<{}>) => (
  <div className="flex flex-col gap-4 px-5 py-6 mx-auto 1xl:px-28 lg:px-16 xl:px-24 2xl:px-32">
    {children}
  </div>
)
export default ReportPadding
