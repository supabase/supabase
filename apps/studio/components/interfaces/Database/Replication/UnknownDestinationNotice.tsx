import { Admonition } from 'ui-patterns/Admonition'

export const UnknownDestinationNotice = () => (
  <Admonition
    type="warning"
    title="Unknown destination"
    description="This destination's saved settings could not be read. You can stop or delete this pipeline."
  />
)
