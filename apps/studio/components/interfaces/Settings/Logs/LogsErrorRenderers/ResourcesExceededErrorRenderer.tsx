import { Accordion, Input } from 'ui'
import { ErrorRendererProps } from './DefaultErrorRenderer'

const ResourcesExceededErrorRenderer: React.FC<ErrorRendererProps> = ({ error, isCustomQuery }) => (
  <div className="flex flex-col gap-2 text-foreground-light">
    <div className="flex flex-col gap-1 text-sm">
      <p>This query requires too much memory to be executed.</p>
      <p>
        {isCustomQuery
          ? 'Avoid selecting entire objects and instead select specific keys using dot notation.'
          : 'Avoid querying across a large datetime range.'}
      </p>
      {!isCustomQuery && <p>Please contact support if this error persists.</p>}
    </div>
    <Accordion
      className="text-sm"
      justified={false}
      openBehaviour="multiple"
      type="default"
      chevronAlign="left"
      size="small"
      iconPosition="left"
    >
      <Accordion.Item id="1" header="Full error message">
        <Input.TextArea
          size="tiny"
          value={JSON.stringify(error, null, 2)}
          borderless
          className="mt-4 w-full font-mono"
          copy
          rows={5}
        />
      </Accordion.Item>
    </Accordion>
  </div>
)

export default ResourcesExceededErrorRenderer
