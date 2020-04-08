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
      .select('name', 'country_id')
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
      .order('id')
      .select('name', 'country_id')
    return cities
  ${errorJs}
`.trim()

export const getRangeJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .range(0,3)
      .select('name', 'country_id')
    return cities
  ${errorJs}
`.trim()

export const getSingleJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .range(0)
      .single()
      .select('name', 'country_id')
    return cities
  ${errorJs}
`.trim()

export const getFilterJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .filter('name', 'eq', 'Paris')
      .select('name', 'country_id')
    return cities
  ${errorJs}
`.trim()

export const getNotJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .not('name', 'eq', 'Paris')
      .select('name', 'country_id')
    return cities
  ${errorJs}
`.trim()

export const getMatchJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .match({name: 'Beijing', country_id: 156})
      .select('name', 'country_id')
    return cities
  ${errorJs}
`.trim()

export const getEqJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .eq('name', 'San Francisco')
      .select('name', 'country_id')
    return cities
  ${errorJs}
`.trim()

export const getNeqJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .neq('name', 'Lagos')
      .select('name', 'country_id')
    return cities
  ${errorJs}
`.trim()

export const getGtJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .gt('country_id', 250)
      .select('name', 'country_id')
    return cities
  ${errorJs}
`.trim()

export const getLtJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .lt('country_id', 250)
      .select('name', 'country_id')
    return cities
  ${errorJs}
`.trim()

export const getGteJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .gte('country_id', 250)
      .select('name', 'country_id')
    return cities
  ${errorJs}
`.trim()

export const getLteJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .lte('country_id', 250)
      .select('name', 'country_id')
    return cities
  ${errorJs} 
`.trim()

export const getLikeJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .like('name', '%la%')
      .select('name', 'country_id')
    return cities
  ${errorJs}
`.trim()

export const getIlikeJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .ilike('name', '%la%')
      .select('name', 'country_id')
    return cities
  ${errorJs}
`.trim()

export const getIsJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .is('name', null)
      .select('name', 'country_id')
    return cities
  ${errorJs}
`.trim()

export const getInJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .in('name', ['Rio de Janeiro', 'San Francisco'])
      .select('name', 'country_id')
    return cities
  ${errorJs}
`.trim()

export const getCsJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .cs('main_exports', ['oil'])
      .select('name', 'id', 'main_exports')
    return countries
  ${errorJs}
`.trim()

export const getCdJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .cd('main_exports', ['cars', 'food', 'machine'])
      .select('name', 'id', 'main_exports')
    return countries
  ${errorJs}
`.trim()

export const getOvaJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .ova('main_exports', ['computers', 'minerals'])
      .select('name', 'id', 'main_exports')
    return countries
  ${errorJs}
`.trim()

export const getOvrJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .ovr('population_range_millions', [150, 250])
      .select('name', 'id', 'population_range_millions')
    return countries
  ${errorJs}
`.trim()

export const getSlJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .sl('population_range_millions', [150, 250])
      .select('name', 'id', 'population_range_millions')
    return countries
  ${errorJs}
`.trim()

export const getSrJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .sr('population_range_millions', [150, 250])
      .select('name', 'id', 'population_range_millions')
    return countries
  ${errorJs}
`.trim()

export const getNxlJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .nxl('population_range_millions', [150, 250])
      .select('name', 'id', 'population_range_millions')
    return countries
  ${errorJs}
`.trim()

export const getNxrJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .nxr('population_range_millions', [150, 250])
      .select('name', 'id', 'population_range_millions')
    return countries
  ${errorJs}
`.trim()

export const getAdjJs = `
${importJs}
const getCountries = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .adj('population_range_millions', [70, 185])
      .select('name', 'id', 'population_range_millions')
    return countries
  ${errorJs}
`.trim()
