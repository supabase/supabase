import * as Tooltip from '@radix-ui/react-tooltip'
/**
 * Test renders can be wrapped in this container if it requires the Providers needed
 */

export default (props) => (
  <>
    <Tooltip.Provider>{props.children}</Tooltip.Provider>
  </>
)
