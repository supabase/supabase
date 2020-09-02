import {importJs, errorJs} from './common'

/**
 * get.mdx examples
 */

export const getSimpleJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
    return cities
  ${errorJs}
`.trim()

export const getColumnsJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name')
    return cities
  ${errorJs}
`.trim()

export const getForeignJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .select(\`
        name,
        cities (
          name
        )
      \`)
    return countries
  ${errorJs}
`.trim()

export const getForeignMultipleJs = `
${importJs}
const getProducts = async () => {
  try {
    let products = await supabase
      .from('products')
      .select(\`
        id,
        supplier:supplier_id ( name ),
        purchaser:purchaser_id ( name )
      \`)
    return products
  ${errorJs}
`.trim()

export const getOrderJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name', 'country_id')
      .order('id')
    return cities
  ${errorJs}
`.trim()

export const getEmbeddedOrderJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .select('name, cities(name)')
      .eq('name', 'United States')
      .order('cities.name')
    return countries
  ${errorJs}
`.trim()

export const getLimitJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .limit(1)
    return cities
  ${errorJs}
`.trim()

export const getEmbeddedLimitJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('cities')
      .select('name, cities(name)')
      .eq('name', 'United States')
      .limit(1, 'cities')
    return countries
  ${errorJs}
`.trim()

export const getOffsetJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .offset(1)
    return cities
  ${errorJs}
`.trim()

export const getEmbeddedOffsetJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('cities')
      .select('name, cities(name)')
      .eq('name', 'United States')
      .offset(1, 'cities')
    return countries
  ${errorJs}
`.trim()

export const getRangeJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .range(0,3)
    return cities
  ${errorJs}
`.trim()

export const getSingleJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .single()
    return cities
  ${errorJs}
`.trim()

export const getFilterJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .filter('name', 'eq', 'Paris')
    return cities
  ${errorJs}
`.trim()

export const getFilterJsEmbedded = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, countries ( name )')
      .filter('countries.name', 'eq', 'France')
    return cities
  ${errorJs}
`.trim()

export const getNotJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .not('name', 'eq', 'Paris')
    return cities
  ${errorJs}
`.trim()

export const getOrJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .or('id.gt.20,and(name.eq.New Zealand,name.eq.France)')
    return cities
  ${errorJs}
`.trim()

export const getMatchJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .match({name: 'Beijing', country_id: 156})
    return cities
  ${errorJs}
`.trim()

export const getEqJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .eq('name', 'San Francisco')
    return cities
  ${errorJs}
`.trim()

export const getNeqJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .neq('name', 'Lagos')
    return cities
  ${errorJs}
`.trim()

export const getGtJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .gt('country_id', 250)
    return cities
  ${errorJs}
`.trim()

export const getLtJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .lt('country_id', 250)
    return cities
  ${errorJs}
`.trim()

export const getGteJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .gte('country_id', 250)
    return cities
  ${errorJs}
`.trim()

export const getLteJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .lte('country_id', 250)
    return cities
  ${errorJs} 
`.trim()

export const getLikeJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .like('name', '%la%')
    return cities
  ${errorJs}
`.trim()

export const getIlikeJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .ilike('name', '%la%')
    return cities
  ${errorJs}
`.trim()

export const getIsJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .is('name', null)
    return cities
  ${errorJs}
`.trim()

export const getInJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .select('name, country_id')
      .in('name', ['Rio de Janeiro', 'San Francisco'])
    return cities
  ${errorJs}
`.trim()

export const getCsJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .select('name, id, main_exports')
      .cs('main_exports', ['oil'])
    return countries
  ${errorJs}
`.trim()

export const getCdJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .select('name, id, main_exports')
      .cd('main_exports', ['cars', 'food', 'machine'])
    return countries
  ${errorJs}
`.trim()

export const getOvaJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .select('name, id, main_exports')
      .ova('main_exports', ['computers', 'minerals'])
    return countries
  ${errorJs}
`.trim()

export const getOvrJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .select('name, id, population_range_millions')
      .ovr('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const getSlJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .select('name, id, population_range_millions')
      .sl('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const getSrJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .select('name, id, population_range_millions')
      .sr('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const getNxlJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .select('name, id, population_range_millions')
      .nxl('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const getNxrJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .select('name, id, population_range_millions')
      .nxr('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const getAdjJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .select('name, id, population_range_millions')
      .adj('population_range_millions', [70, 185])
    return countries
  ${errorJs}
`.trim()

export const getJsonData = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .select(\`
        json_column_name->>population,
        json_column_name->weather->>temperature
      \`)
    return countries
  ${errorJs}
`.trim()
