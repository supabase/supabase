import { FC, useContext } from 'react'
import { observer } from 'mobx-react-lite'
import { Checkbox } from 'ui'
import { union, without } from 'lodash'
import { CreateHookContext } from './'

const CheckboxEvents: FC = observer(({}) => {
  const _localState: any = useContext(CreateHookContext)
  return (
    // @ts-ignore
    <Checkbox.Group
      name="events"
      label="Events"
      id="events"
      layout="horizontal"
      size="medium"
      onChange={(e) => {
        const temp = _localState.formState.events.value
        const value = e.target.checked
          ? union(temp, [e.target.value])
          : without(temp, e.target.value)
        _localState.onFormChange({
          key: 'events',
          value: value,
        })
      }}
      error={_localState.formState.events.error}
      labelOptional="The type of events that will trigger your function hook"
      descriptionText="These are the events that are watched by the function hook, only the events selected above will fire the function hook on the table you've selected."
    >
      <Checkbox
        value="INSERT"
        id="INSERT"
        label="Insert"
        description={'Any insert operation on the table'}
        checked={_localState.formState.events.value.includes('INSERT')}
      />
      <Checkbox
        value="UPDATE"
        id="UPDATE"
        label="Update"
        description="Any update operation, of any column in the table"
        checked={_localState.formState.events.value.includes('UPDATE')}
      />
      <Checkbox
        value="DELETE"
        id="DELETE"
        label="Delete"
        description="Any deletion of a record"
        checked={_localState.formState.events.value.includes('DELETE')}
      />
    </Checkbox.Group>
  )
})

export default CheckboxEvents
