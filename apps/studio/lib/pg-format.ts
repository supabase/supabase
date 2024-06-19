// [Joshen] These are from https://github.com/datalanche/node-pg-format/blob/master/lib/index.js
function formatDate(date: any) {
  date = date.replace('T', ' ')
  date = date.replace('Z', '+00')
  return date
}

function arrayToList(useSpace: any, array: any, formatter: any) {
  let sql = ''

  sql += useSpace ? ' (' : '('
  for (var i = 0; i < array.length; i++) {
    sql += (i === 0 ? '' : ', ') + formatter(array[i])
  }
  sql += ')'

  return sql
}

export function quoteLiteral(value: any): any {
  let literal = null
  let explicitCast = null

  if (value === undefined || value === null) {
    return 'NULL'
  } else if (value === false) {
    return "'f'"
  } else if (value === true) {
    return "'t'"
  } else if (value instanceof Date) {
    return "'" + formatDate(value.toISOString()) + "'"
  } else if (value instanceof Buffer) {
    return "E'\\\\x" + value.toString('hex') + "'"
  } else if (Array.isArray(value) === true) {
    let temp = []
    for (let i = 0; i < value.length; i++) {
      if (Array.isArray(value[i]) === true) {
        temp.push(arrayToList(i !== 0, value[i], quoteLiteral))
      } else {
        temp.push(quoteLiteral(value[i]))
      }
    }
    return temp.toString()
  } else if (value === Object(value)) {
    explicitCast = 'jsonb'
    literal = JSON.stringify(value)
  } else {
    literal = value.toString().slice(0) // create copy
  }

  let hasBackslash = false
  let quoted = "'"

  for (let i = 0; i < literal.length; i++) {
    let c = literal[i]
    if (c === "'") {
      quoted += c + c
    } else if (c === '\\') {
      quoted += c + c
      hasBackslash = true
    } else {
      quoted += c
    }
  }

  quoted += "'"

  if (hasBackslash === true) {
    quoted = 'E' + quoted
  }

  if (explicitCast) {
    quoted += '::' + explicitCast
  }

  return quoted
}
