import { Admonition } from 'ui-patterns/Admonition'

export const UnknownDestinationNotice = () => (
  <Admonition
    type="warning"
    title="Unknown destination"
    description="Pipeline cannot be edited as the destination configuration cannot be read. You may stop or delete it."
  />
)
