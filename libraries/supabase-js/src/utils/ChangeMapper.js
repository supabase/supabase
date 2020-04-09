// # Lifted from epgsql (src/epgsql_binary.erl), this module licensed under
// # 3-clause BSD found here: https://raw.githubusercontent.com/epgsql/epgsql/devel/LICENSE

/**
 * Takes an array of columns and an object of string values then converts each string value
 * to its mapped type
 * @param {{name: String, type: String}[]} columns
 * @param {Object} records
 * @param {Object} options The map of various options that can be applied to the mapper
 * @param {Array} options.skipTypes The array of types that should not be converted
 *
 * @example convertChangeData([{name: 'first_name', type: 'text'}, {name: 'age', type: 'int4'}], {first_name: 'Paul', age:'33'}, {})
 * //=>{ first_name: 'Paul', age: 33 }
 */
export const convertChangeData = (columns, records, options = {}) => {
  let result = {}
  let skipTypes = typeof options.skipTypes !== 'undefined' ? options.skipTypes : []
  Object.entries(records).map(([key, value]) => {
    result[key] = convertColumn(key, columns, records, skipTypes)
  })
  return result
}

/**
 * Converts the value of an individual column
 * @param {String} columnName The column that you want to convert
 * @param {{name: String, type: String}[]} columns All of the columns
 * @param {Object} records The map of string values
 * @param {Array} skipTypes An array of types that should not be converted
 * @return {object} Useless information
 *
 * @example convertColumn('age', [{name: 'first_name', type: 'text'}, {name: 'age', type: 'int4'}], ['Paul', '33'], [])
 * //=> 33
 * @example convertColumn('age', [{name: 'first_name', type: 'text'}, {name: 'age', type: 'int4'}], ['Paul', '33'], ['int4'])
 * //=> "33"
 */
export const convertColumn = (columnName, columns, records, skipTypes) => {
  let column = columns.find(x => x.name == columnName)
  if(skipTypes.includes(column.type)) return noop(records[columnName])
  else return convertCell(column.type, records[columnName])
}

/**
 * If the value of the cell is `null`, returns null.
 * Otherwise converts the string value to the correct type.
 * @param {String} type A postgres column type
 * @param {String} stringValue The cell value
 *
 * @example convertCell('bool', 'true')
 * //=> true
 * @example convertCell('int8', '10')
 * //=> 10
 * @example convertCell('_int4', '{1,2,3,4}')
 * //=> [1,2,3,4]
 */
export const convertCell = (type, stringValue) => {
  try {
    if (stringValue === null) return null

    // if data type is an array
    if (type.charAt(0) === '_') {
      let arrayValue = type.slice(1, type.length)
      return toArray(stringValue, arrayValue)
    }

    // If not null, convert to correct type.
    switch (type) {
      case 'abstime':
        return noop(stringValue) // To allow users to cast it based on Timezone
      case 'bool':
        return toBoolean(stringValue)
      case 'date':
        return noop(stringValue) // To allow users to cast it based on Timezone
      case 'daterange':
        return toDateRange(stringValue)
      case 'float4':
        return toFloat(stringValue)
      case 'float8':
        return toFloat(stringValue)
      case 'int2':
        return toInt(stringValue)
      case 'int4':
        return toInt(stringValue)
      case 'int4range':
        return toIntRange(stringValue)
      case 'int8':
        return toInt(stringValue)
      case 'int8range':
        return toIntRange(stringValue)
      case 'json':
        return toJson(stringValue)
      case 'jsonb':
        return toJson(stringValue)
      case 'money':
        return toFloat(stringValue)
      case 'numeric':
        return toFloat(stringValue)
      case 'oid':
        return toInt(stringValue)
      case 'reltime':
        return noop(stringValue) // To allow users to cast it based on Timezone
      case 'time':
        return noop(stringValue) // To allow users to cast it based on Timezone
      case 'timestamp':
        return toTimestampString(stringValue) // Format to be consistent with PostgREST
      case 'timestamptz':
        return noop(stringValue) // To allow users to cast it based on Timezone
      case 'timetz':
        return noop(stringValue) // To allow users to cast it based on Timezone
      case 'tsrange':
        return toDateRange(stringValue)
      case 'tstzrange':
        return toDateRange(stringValue)
      default:
        // All the rest will be returned as strings
        return noop(stringValue)
    }
  } catch (error) {
    console.log(`Could not convert cell of type ${type} and value ${stringValue}`)
    console.log(`This is the error: ${error}`)
    return stringValue
  }
}

export const noop = stringValue => {
  return stringValue
}
export const toBoolean = stringValue => {
  switch (stringValue) {
    case 't':
      return true
    case 'f':
      return false
    default:
      return null
  }
}
export const toDate = stringValue => {
  return new Date(stringValue)
}
export const toDateRange = stringValue => {
  let arr = JSON.parse(stringValue)
  return [new Date(arr[0]), new Date(arr[1])]
}
export const toFloat = stringValue => {
  return parseFloat(stringValue)
}
export const toInt = stringValue => {
  return parseInt(stringValue)
}
export const toIntRange = stringValue => {
  let arr = JSON.parse(stringValue)
  return [parseInt(arr[0]), parseInt(arr[1])]
}
export const toJson = stringValue => {
  return JSON.parse(stringValue)
}

/**
 * Converts a Postgres Array into a native JS array
 * @example toArray('{1,2,3,4}', 'int4')
 * //=> [1,2,3,4]
 * @example toArray('{}', 'int4')
 * //=> []
 */
export const toArray = (stringValue, type) => {
  // this takes off the '{' & '}'
  let stringEnriched = stringValue.slice(1, stringValue.length - 1)

  // converts the string into an array
  // if string is empty (meaning the array was empty), an empty array will be immediately returned
  let stringArray = stringEnriched.length > 0 ? stringEnriched.split(',') : []
  let array = stringArray.map(string => {
    return convertCell(type, string)
  })

  return array
}

/**
 * Fixes timestamp to be ISO-8601. Swaps the space between the date and time for a 'T'
 * See https://github.com/supabase/supabase/issues/18
 * @returns {string}
 * @example toTimestampString('2019-09-10 00:00:00')
 * //=> '2019-09-10T00:00:00'
 */
export const toTimestampString = stringValue => {
  return stringValue.replace(' ', 'T')
}