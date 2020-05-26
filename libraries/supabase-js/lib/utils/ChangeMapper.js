'use strict';Object.defineProperty(exports,'__esModule',{value:!0});var _slicedToArray=function(){function a(a,b){var c=[],d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done)&&(c.push(g.value),!(b&&c.length===b));d=!0);}catch(a){e=!0,f=a}finally{try{!d&&h['return']&&h['return']()}finally{if(e)throw f}}return c}return function(b,c){if(Array.isArray(b))return b;if(Symbol.iterator in Object(b))return a(b,c);throw new TypeError('Invalid attempt to destructure non-iterable instance')}}(),convertChangeData=exports.convertChangeData=function(a,b){var c=2<arguments.length&&void 0!==arguments[2]?arguments[2]:{},d={},e='undefined'==typeof c.skipTypes?[]:c.skipTypes;return Object.entries(b).map(function(c){var f=_slicedToArray(c,2),g=f[0],h=f[1];d[g]=convertColumn(g,a,b,e)}),d},convertColumn=exports.convertColumn=function(a,b,c,d){var e=b.find(function(b){return b.name==a});return d.includes(e.type)?noop(c[a]):convertCell(e.type,c[a])},convertCell=exports.convertCell=function(a,b){try{if(null===b)return null;// if data type is an array
if('_'===a.charAt(0)){var c=a.slice(1,a.length);return toArray(b,c)}// If not null, convert to correct type.
return'abstime'===a?noop(b):'bool'===a?toBoolean(b):'date'===a?noop(b):'daterange'===a?toDateRange(b):'float4'===a?toFloat(b):'float8'===a?toFloat(b):'int2'===a?toInt(b):'int4'===a?toInt(b):'int4range'===a?toIntRange(b):'int8'===a?toInt(b):'int8range'===a?toIntRange(b):'json'===a?toJson(b):'jsonb'===a?toJson(b):'money'===a?toFloat(b):'numeric'===a?toFloat(b):'oid'===a?toInt(b):'reltime'===a?noop(b):'time'===a?noop(b):'timestamp'===a?toTimestampString(b):'timestamptz'===a?noop(b):'timetz'===a?noop(b):'tsrange'===a?toDateRange(b):'tstzrange'===a?toDateRange(b):noop(b)}catch(c){return console.log('Could not convert cell of type '+a+' and value '+b),console.log('This is the error: '+c),b}},noop=exports.noop=function(a){return a},toBoolean=exports.toBoolean=function(a){return!('t'!==a)||void 0},toDate=exports.toDate=function(a){return new Date(a)},toDateRange=exports.toDateRange=function(a){var b=JSON.parse(a);return[new Date(b[0]),new Date(b[1])]},toFloat=exports.toFloat=function(a){return parseFloat(a)},toInt=exports.toInt=function(a){return parseInt(a)},toIntRange=exports.toIntRange=function(a){var b=JSON.parse(a);return[parseInt(b[0]),parseInt(b[1])]},toJson=exports.toJson=function(a){return JSON.parse(a)},toArray=exports.toArray=function(a,b){// this takes off the '{' & '}'
var c=a.slice(1,a.length-1),d=c.split(','),e=d.map(function(a){return convertCell(b,a)});// converts the string into an array
return e},toTimestampString=exports.toTimestampString=function(a){return a.replace(' ','T')};// # Lifted from epgsql (src/epgsql_binary.erl), this module licensed under
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
 *//**
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
 *//**
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
 *//**
 * Converts a Postgres Array into a native JS array
 * @example toArray('{1,2,3,4}', 'int4')
 * //=> [1,2,3,4]
 *//**
 * Fixes timestamp to be ISO-8601. Swaps the space between the date and time for a 'T'
 * See https://github.com/supabase/supabase/issues/18
 * @returns {string}
 * @example toTimestampString('2019-09-10 00:00:00')
 * //=> '2019-09-10T00:00:00'
 */