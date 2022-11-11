// https://github.com/euank/node-parse-numeric-range/blob/master/index.js
export function parseNumericRange(string) {
  let res = []
  let m

  for (let str of string.split(',').map((str) => str.trim())) {
    // just a number
    if (/^-?\d+$/.test(str)) {
      res.push(parseInt(str, 10))
    } else if ((m = str.match(/^(-?\d+)(-|\.\.\.?|\u2025|\u2026|\u22EF)(-?\d+)$/))) {
      // 1-5 or 1..5 (equivalent) or 1...5 (doesn't include 5)
      let [_, lhs, sep, rhs] = m

      if (lhs && rhs) {
        lhs = parseInt(lhs)
        rhs = parseInt(rhs)
        const incr = lhs < rhs ? 1 : -1

        // Make it inclusive by moving the right 'stop-point' away by one.
        if (sep === '-' || sep === '..' || sep === '\u2025') rhs += incr

        for (let i = lhs; i !== rhs; i += incr) res.push(i)
      }
    }
  }

  return res
}

const monokaiCustomTheme = (isDarkMode) => {
  return {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      background: '#272822',
      color: '#ddd',
    },
    'hljs-tag': {
      color: '#569cd6',
    },
    'hljs-keyword': {
      color: '#569cd6',
      fontWeight: 'normal',
    },
    'hljs-selector-tag': {
      color: '#569cd6',
      fontWeight: 'normal',
    },
    'hljs-literal': {
      color: '#569cd6',
      fontWeight: 'normal',
    },
    'hljs-strong': {
      color: '#569cd6',
    },
    'hljs-name': {
      color: '#569cd6',
    },
    'hljs-code': {
      color: '#66d9ef',
    },
    'hljs-class .hljs-title': {
      color: 'gray',
    },
    'hljs-attribute': {
      color: '#bf79db',
    },
    'hljs-symbol': {
      color: '#bf79db',
    },
    'hljs-regexp': {
      color: '#bf79db',
    },
    'hljs-link': {
      color: '#bf79db',
    },
    'hljs-string': {
      color: '#3ECF8E',
    },
    'hljs-bullet': {
      color: '#3ECF8E',
    },
    'hljs-subst': {
      color: '#3ECF8E',
    },
    'hljs-title': {
      color: '#3ECF8E',
      fontWeight: 'normal',
    },
    'hljs-section': {
      color: '#3ECF8E',
      fontWeight: 'normal',
    },
    'hljs-emphasis': {
      color: '#3ECF8E',
    },
    'hljs-type': {
      color: '#3ECF8E',
      fontWeight: 'normal',
    },
    'hljs-built_in': {
      color: '#3ECF8E',
    },
    'hljs-builtin-name': {
      color: '#3ECF8E',
    },
    'hljs-selector-attr': {
      color: '#3ECF8E',
    },
    'hljs-selector-pseudo': {
      color: '#3ECF8E',
    },
    'hljs-addition': {
      color: '#3ECF8E',
    },
    'hljs-variable': {
      color: '#3ECF8E',
    },
    'hljs-template-tag': {
      color: '#3ECF8E',
    },
    'hljs-template-variable': {
      color: '#3ECF8E',
    },
    'hljs-comment': {
      color: isDarkMode ? '#999' : '#888',
    },
    'hljs-quote': {
      color: '#75715e',
    },
    'hljs-deletion': {
      color: '#75715e',
    },
    'hljs-meta': {
      color: '#75715e',
    },
    'hljs-doctag': {
      fontWeight: 'normal',
    },
    'hljs-selector-id': {
      fontWeight: 'normal',
    },
  }
}

export default monokaiCustomTheme
