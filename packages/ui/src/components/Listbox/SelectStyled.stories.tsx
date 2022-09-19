import React, { useState } from 'react'

import Listbox from './Listbox2'
import { IconBook, IconUser } from '../../index'
import { Button } from '../Button'
import Typography from '../Typography'

export default {
  title: 'Data Input/Listbox',
  component: Listbox,
}

const { Option } = Listbox

const options = [
  { value: 'one', label: 'one' },
  { value: 'two', label: 'two' },
  { value: 'three', label: 'three' },
  { value: 'four', label: 'four' },
]

export const Default = (args: any) => (
  <Listbox label="Default listbox">
    {options.map((option) => {
      return (
        <Listbox.Option
          label={option.label}
          value={option.value}
          children={({ active, selected }: any) => {
            // console.log('selected', selected)
            // console.log('active', active)
            return <span>{option.label}</span>
          }}
        />
      )
    })}
  </Listbox>
)

export const ListBoxDisabled = (args: any) => (
  <Listbox label="Default listbox" disabled>
    <Listbox.Option label="Option 1" value="option-1">
      Option 1
    </Listbox.Option>
    <Listbox.Option label="Option 2" value="option-2">
      Option 2
    </Listbox.Option>
    <Listbox.Option disabled label="Option 3" value="option-3">
      Option 3
    </Listbox.Option>
  </Listbox>
)

export const WithDisabled = (args: any) => (
  <Listbox label="Default listbox">
    <Listbox.Option label="Option 1" value="option-1">
      Option 1
    </Listbox.Option>
    <Listbox.Option label="Option 2" value="option-2">
      Option 2
    </Listbox.Option>
    <Listbox.Option disabled label="Option 3" value="option-3">
      Option 3
    </Listbox.Option>
  </Listbox>
)

const people = [
  {
    value: 1,
    label: 'Wade Cooper',
    avatar:
      'https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 2,
    label: 'Arlene Mccoy',
    avatar:
      'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 3,
    label: 'Devon Webb',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2.25&w=256&h=256&q=80',
  },
  {
    value: 4,
    label: 'Tom Cook',
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 5,
    label: 'Tanya Fox',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 6,
    label: 'Hellen Schmidt',
    avatar:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 7,
    label: 'Caroline Schultz',
    avatar:
      'https://images.unsplash.com/photo-1568409938619-12e139227838?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 8,
    label: 'Mason Heaney',
    avatar:
      'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 9,
    label: 'Claudie Smitham',
    avatar:
      'https://images.unsplash.com/photo-1584486520270-19eca1efcce5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
  {
    value: 10,
    label: 'Emil Schaefer',
    avatar:
      'https://images.unsplash.com/photo-1561505457-3bcad021f8ee?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
  },
]

export const People = (args: any) => (
  <div className="overflow-hidden">
    <Listbox
      // defaultValue={people[1].value}
      label="Choose a person"
      layout="horizontal"
      descriptionText="Choose a person for this role"
    >
      {people.map((person) => {
        return (
          <Listbox.Option
            value={person.value}
            label={person.label}
            addOnBefore={({ active, selected }: any) => [
              <img
                src={person.avatar}
                alt=""
                className="h-6 w-6 rounded-full"
              />,
            ]}
            children={({ active, selected }: any) => {
              // console.log('selected', selected)
              // console.log('active', active)
              return (
                <span className={'font-normal block truncate'}>
                  {person.label}
                </span>
              )
            }}
          />
        )
      })}
    </Listbox>
  </div>
)

People.args = {
  disabled: false,
  label: 'Label',
  layout: 'vertical',
  size: 'medium',
}

export const WithState = (args: any) => {
  const [value, setValue] = useState('foo')
  return (
    <Listbox
      value={value}
      onChange={(value) => setValue(value)}
      label="Choose a person"
      layout="horizontal"
      descriptionText="Choose a person for this role"
    >
      <Listbox.Option value="foo" id="foo" label="foo" key="foo">
        foo
      </Listbox.Option>
      {people.map((person) => {
        return (
          <Listbox.Option
            key={person.value}
            value={person.value}
            label={person.label}
            addOnBefore={({ active, selected }: any) => [
              <img
                src={person.avatar}
                alt=""
                className="h-6 w-6 rounded-full"
              />,
            ]}
            children={({ active, selected }: any) => {
              return (
                <span className={'font-normal block truncate'}>
                  {person.label}
                </span>
              )
            }}
          />
        )
      })}
    </Listbox>
  )
}

WithState.args = {
  disabled: false,
  label: 'Label',
  layout: 'vertical',
  size: 'medium',
}

export const WithIcon = (args: any) => (
  <div className="overflow-hidden">
    <Listbox
      // defaultValue={people[1].value}
      icon={<IconUser />}
      label="Choose a person"
      layout="horizontal"
      descriptionText="Choose a person for this role"
    >
      {people.map((person) => {
        return (
          <Listbox.Option
            value={person.value}
            label={person.label}
            addOnBefore={({ active, selected }: any) => [
              <img
                src={person.avatar}
                alt=""
                className="h-6 w-6 rounded-full"
              />,
            ]}
            children={({ active, selected }: any) => {
              // console.log('selected', selected)
              // console.log('active', active)
              return (
                <span className={'font-normal block truncate'}>
                  {person.label}
                </span>
              )
            }}
          />
        )
      })}
    </Listbox>
  </div>
)

WithIcon.args = {
  disabled: false,
  label: 'Label',
  layout: 'vertical',
  size: 'medium',
}

// export const Default = (args: any) => (
//   <Listbox {...args}>
//     <Option value="javascript">JavaScript</Option>
//     <Option value="typeScript">TypeScript</Option>
//     <Option value="react">React</Option>
//   </Listbox>
// )

// export const withCheckboxes = (args: any) => <Listbox {...args} />

export const ErrorState = (args: any) => (
  <Listbox
    label="Choose a person"
    descriptionText="Choose a person for this role"
    error="I am an error"
  >
    {people.map((person) => {
      return (
        <Listbox.Option
          label={person.label}
          value={person.value}
          addOnBefore={({ active, selected }: any) => [
            <img src={person.avatar} alt="" className="h-6 w-6 rounded-full" />,
          ]}
        >
          {person.label}
        </Listbox.Option>
      )
    })}
  </Listbox>
)

ErrorState.args = {
  label: 'Choose a person',
  descriptionText: 'Choose a person for this role',
}

export const ListBoxChildrenPropChange = (args: any) => {
  const [countries, setCountries] = useState<any[]>([
    'England',
    'Wales',
    'Scotland',
    'Ireland',
  ])

  function handlePop() {
    console.log('handlepop')
    let _data = []
    _data = countries
    _data.pop()
    setCountries([..._data])

    console.log(countries)
  }

  return (
    <>
      {countries.map((country) => {
        return <span>{country}</span>
      })}
      <Listbox
        defaultValue={'England'}
        label="Choose a country"
        descriptionText="Choose a person for this role"
      >
        {countries.map((country) => {
          return (
            <Listbox.Option label={country} value={country}>
              {country}
            </Listbox.Option>
          )
        })}
        <Listbox.Option label="disabled country" value="disabled" disabled>
          Disabled
        </Listbox.Option>
      </Listbox>
      <Button onClick={handlePop}>Remove country</Button>
    </>
  )
}

ListBoxChildrenPropChange.args = {
  label: 'Choose a country',
}

export const ValueChange = (args: any) => {
  const [countries, setCountries] = useState<any[]>([
    'England',
    'Wales',
    'Scotland',
    'Ireland',
  ])

  const [value, setValue] = useState<string>('England')

  function handleRandom() {
    const random = countries[Math.floor(Math.random() * countries.length)]
    setValue(random)
  }

  return (
    <>
      <Typography.Text>current value: {value}</Typography.Text>
      <div>
        <Listbox
          value={value}
          label="Choose a country"
          descriptionText="Choose a person for this role"
          onChange={setValue}
        >
          {countries.map((country) => {
            return (
              <Listbox.Option label={country} value={country} key={country}>
                {country}
              </Listbox.Option>
            )
          })}
          <Listbox.Option
            label="disabled country"
            value="disabled"
            disabled
            key="disabled"
          >
            Disabled
          </Listbox.Option>
        </Listbox>
      </div>
      <Button onClick={handleRandom}>Change country</Button>
    </>
  )
}

ValueChange.args = {
  label: 'Choose a country',
}
