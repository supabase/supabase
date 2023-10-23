export const INDEX_TYPES = [
  {
    name: 'B-Tree',
    value: 'btree',
    description:
      'For querying data with equality or range conditions on columns.\nThis is the default index type that Postgres uses.',
  },
  {
    name: 'Hash',
    value: 'hash',
    description: 'For querying exact matches on columns',
  },
  {
    name: 'GiST',
    value: 'gist',
    description: 'For querying complex data types or custom-defined operators',
  },
  {
    name: 'SP-GiST',
    value: 'spgist',
    description: 'Similar to GiST, but is more specialized and customizable',
  },
  {
    name: 'GIN',
    value: 'gin',
    description: 'For querying multi-valued data such as arrays or full-text search scenarios',
  },
  {
    name: 'BRIN',
    value: 'brin',
    description: 'For querying large tables with sorted data',
  },
]
