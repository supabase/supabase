import { jsonSyntaxHighlight } from '../LogsFormatters'

const FunctionInvocationSelectionRender = ({ log }: any) => {
  return (
    <>
      <pre className="text-sm px-5">
        <h3 className="text-xl text-scale-1200">Request</h3>
        <div
          dangerouslySetInnerHTML={{
            __html: log.request ? jsonSyntaxHighlight(log.request) : '',
          }}
        />
      </pre>
      <pre className="text-sm px-5">
        <h3 className="text-xl text-scale-1200">Response</h3>
        <div
          dangerouslySetInnerHTML={{
            __html: log.response ? jsonSyntaxHighlight(log.response) : '',
          }}
        />
      </pre>
    </>
  )
}

export default FunctionInvocationSelectionRender
