export const reactLiveHome = {
    plain: {
      color: '#e7d2ed'
    },
    styles: [
      {
        types: ['prolog', 'comment', 'doctype', 'cdata'],
        style: {
          color: 'hsl(30, 20%, 50%)'
        }
      },
      {
        types: ['property', 'tag', 'boolean', 'number', 'constant', 'symbol'],
        style: { color: '#f677e1' }
      },
      {
        types: ['attr-name', 'string', 'char', 'builtin', 'insterted'],
        style: {
          color: 'hsl(75, 70%, 70%)'
        }
      },
      {
        types: [
          'operator',
          'entity',
          'url',
          'string',
          'variable',
          'language-css'
        ],
        style: {
          color: 'hsl(40, 90%, 70%)'
        }
      },
      {
        types: ['deleted'],
        style: {
          color: 'rgb(255, 85, 85)'
        }
      },
      {
        types: ['italic'],
        style: {
          fontStyle: 'italic'
        }
      },
      {
        types: ['important', 'bold'],
        style: {
          fontWeight: 'bold'
        }
      },
      {
        types: ['regex', 'important'],
        style: {
          color: '#e90'
        }
      },
      {
        types: ['atrule', 'attr-value', 'keyword'],
        style: {
          color: '#f677e1'
        }
      },
      {
        types: ['punctuation', 'symbol'],
        style: {
          opacity: '0.7'
        }
      }
    ]
  };