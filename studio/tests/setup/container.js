import * as Tooltip from '@radix-ui/react-tooltip'
/**
 * Test renders can be wrapped in this container if it requires a context Provider
 */

export default (props) => (
  <>
    <Tooltip.Provider>{props.children}</Tooltip.Provider>
  </>
)
