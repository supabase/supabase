export const FilterOperatorOptions = [
  { value: '=', label: 'equals', preLabel: '[ = ]', abbrev: 'eq' },
  { value: '<>', label: 'not equal', preLabel: '[ <> ]', abbrev: 'neq' },
  { value: '>', label: 'greater than', preLabel: '[ > ]', abbrev: 'gt' },
  { value: '<', label: 'less than', preLabel: '[ < ]', abbrev: 'lt' },
  { value: '>=', label: 'greater than or equal', preLabel: '[ >= ]', abbrev: 'gte' },
  { value: '<=', label: 'less than or equal', preLabel: '[ <= ]', abbrev: 'lte' },
  { value: '~~', label: 'like operator', preLabel: '[ ~~ ]', abbrev: 'like' },
  { value: '~~*', label: 'ilike operator', preLabel: '[ ~~* ]', abbrev: 'ilike' },
  { value: 'in', label: 'one of a list of values', preLabel: '[ in ]', abbrev: 'in' },
  {
    value: 'is',
    label: 'checking for (null,not null,true,false)',
    preLabel: '[ is ]',
    abbrev: 'is',
  },
]
