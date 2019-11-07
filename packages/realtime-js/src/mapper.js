// # Lifted from epgsql (src/epgsql_binary.erl), this module licensed under
// # 3-clause BSD found here: https://raw.githubusercontent.com/epgsql/epgsql/devel/LICENSE
//
// {:bool, 16, 1000},
// {:bpchar, 1042, 1014},
// {:bytea, 17, 1001},
// {:char, 18, 1002},
// {:cidr, 650, 651},
// {:date, 1082, 1182},
// {:daterange, 3912, 3913},
// {:float4, 700, 1021},
// {:float8, 701, 1022},
// {:geometry, 17063, 17071},
// {:hstore, 16935, 16940},
// {:inet, 869, 1041},
// {:int2, 21, 1005},
// {:int4, 23, 1007},
// {:int4range, 3904, 3905},
// {:int8, 20, 1016},
// {:int8range, 3926, 3927},
// {:interval, 1186, 1187},
// {:json, 114, 199},
// {:jsonb, 3802, 3807},
// {:macaddr, 829, 1040},
// {:macaddr8, 774, 775},
// {:point, 600, 1017},
// {:text, 25, 1009},
// {:time, 1083, 1183},
// {:timestamp, 1114, 1115},
// {:timestamptz, 1184, 1185},
// {:timetz, 1266, 1270},
// {:tsrange, 3908, 3909},
// {:tstzrange, 3910, 3911},
// {:uuid, 2950, 2951},
// {:varchar, 1043, 1015}

/**
 * Takes an array of columns and an object of string values then converts each string value
 * to its mapped type
 * @param {{name: String, type: String}[]} columns
 * @param {Object} records
 */
export const dataConverter = (columns, records) => {
  let result = {}
  Object.entries(records).map(([key, value]) => {
    result[key] = convertColumn(key, columns, records)
  })
  return result
}

/**
 * Converts the value of an individual column
 * @param {String} columnName The column that you want to convert
 * @param {{name: String, type: String}[]} columns All of the columns
 * @param {Object} records The map of string values
 */
export const convertColumn = (columnName, columns, records) => {
  let column = columns.find(x => x.name == columnName)
  return convertCell(column.type, records[columnName])
}

/**
 * If the value of the cell is `null`, returns null.
 * Otherwise converts the string value to the correct type.
 */
export const convertCell = (type, stringValue) => {
  try {
    if (stringValue === null) return null

    // If not null, convert to correct type.
    switch (type) {
      case 'bool':
        return toBoolean(stringValue)
      case 'bpchar':
        return noop(stringValue)
      case 'bytea':
        return noop(stringValue)
      case 'char':
        return noop(stringValue)
      case 'cidr':
        return noop(stringValue)
      case 'date':
        return noop(stringValue) // PostgREST uses string
        return toDate(stringValue)
      case 'daterange':
        return toDateRange(stringValue)
      case 'float4':
        return toFloat(stringValue)
      case 'float8':
        return toFloat(stringValue)
      case 'geometry':
        return noop(stringValue)
      case 'hstore':
        return noop(stringValue)
      case 'inet':
        return noop(stringValue)
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
      case 'interval':
        return noop(stringValue)
      case 'json':
        return toJson(stringValue)
      case 'jsonb':
        return toJson(stringValue)
      case 'macaddr':
        return noop(stringValue)
      case 'macaddr8':
        return noop(stringValue)
      case 'point':
        return noop(stringValue)
      case 'text':
        return noop(stringValue)
      case 'time':
        return noop(stringValue)
      case 'timestamp':
        return noop(stringValue) // PostgREST uses string
        return toDate(stringValue)
      case 'timestamptz':
        return noop(stringValue) // PostgREST uses string
        return toDate(stringValue)
      case 'timetz':
        return noop(stringValue)
      case 'tsrange':
        return noop(stringValue)
      case 'tstzrange':
        return noop(stringValue)
      case 'uuid':
        return noop(stringValue)
      case 'varchar':
        return noop(stringValue)
      default:
        // Unhandled and custom types will always return as strings
        return noop(stringValue)
    }
  } catch (error) {
    console.log(`Could not convert cell of type ${type} and value ${stringValue}`)
    return stringValue
  }
}

/**
 * Passes back the raw string value
 */
const noop = stringValue => {
  return stringValue
}
const toBoolean = stringValue => {
  switch (stringValue) {
    case 't':
      return true
    case 'f':
      return false
    default:
      return null
  }
}
const toDate = stringValue => {
  return new Date(stringValue)
}
const toDateRange = stringValue => {
  let arr = JSON.parse(stringValue)
  return [new Date(arr[0]), new Date(arr[1])]
}
const toFloat = stringValue => {
  return parseFloat(stringValue)
}
const toInt = stringValue => {
  return parseInt(stringValue)
}
const toIntRange = stringValue => {
  let arr = JSON.parse(stringValue)
  return [parseInt(arr[0]), parseInt(arr[1])]
}
const toJson = stringValue => {
  return JSON.parse(stringValue)
}
