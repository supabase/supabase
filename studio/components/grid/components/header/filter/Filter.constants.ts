export const FilterOperatorOptions = [
  { value: '=', label: 'equals', preLabel: '[ = ]' },
  { value: '<>', label: 'not equal', preLabel: '[ <> ]' },
  { value: '>', label: 'greater than', preLabel: '[ > ]' },
  { value: '<', label: 'less than', preLabel: '[ < ]' },
  { value: '>=', label: 'greater than or equal', preLabel: '[ >= ]' },
  { value: '<=', label: 'less than or equal', preLabel: '[ <= ]' },
  { value: '~~', label: 'like operator', preLabel: '[ ~~ ]' },
  { value: '~~*', label: 'ilike operator', preLabel: '[ ~~* ]' },
  { value: 'in', label: 'one of a list of values', preLabel: '[ in ]' },
  {
    value: 'is',
    label: 'checking for (null,not null,true,false)',
    preLabel: '[ is ]',
  },
];
