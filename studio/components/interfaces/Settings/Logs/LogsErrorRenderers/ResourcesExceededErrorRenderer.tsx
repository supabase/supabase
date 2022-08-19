import { Accordion, Input } from '@supabase/ui'
import { ErrorRendererProps } from './DefaultErrorRenderer'

const ResourcesExceededErrorRenderer: React.FC<ErrorRendererProps> = ({ error, isCustomQuery }) => (
  <div className="text-scale-1100 flex flex-col gap-2">
    <div className="text-sm flex flex-col gap-1">
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
      bordered={false}
      iconPosition="left"
    >
      <Accordion.Item id="1" header="Full error message">
        <Input.TextArea
          size="tiny"
          value={JSON.stringify(error, null, 2)}
          borderless
          className="font-mono w-full mt-4"
          copy
          rows={5}
        />
      </Accordion.Item>
    </Accordion>
  </div>
)

export default ResourcesExceededErrorRenderer
