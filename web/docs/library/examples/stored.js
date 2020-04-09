import {importJs, errorJs} from './common'

/**
 * stored-procedures.mdx examples
 */

export const storedSingleJs = `
${importJs}
const echoCity = async () => {
  try{
    let city = await supabase
      .rpc('echo_city', { name: 'The Shire' })
    return cities
  ${errorJs}
}
`.trim()

export const storedBulkJs = `
${importJs}
const echoCities = async () => {
  try{
    let cities = await supabase
      .rpc('echo_city', [
        { name: 'The Shire' },
        { name: 'Mordor' }
      ])
    return cities
  ${errorJs}
}
`.trim()

export const storedReadingJs = `
${importJs}
const echoCities = async () => {
  try{
    let cities = await supabase
      .rpc('echo_all_cities')
    return cities
  ${errorJs}
`.trim()

export const storedFilterJs = `
${importJs}
const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .filter({'name', 'eq', 'Paris'})
    return cities
  ${errorJs}
`.trim()

export const storedNotJs = `
${importJs}
const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities)
      .not('name', 'eq', 'Paris')
    return cities
  ${errorJs}
`.trim()

export const storedMatchJs = `
${importJs}
const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .match({name: 'Beijing', country_id: 156})
    return cities
  ${errorJs}
`.trim()

export const storedEqJs = `
${importJs}
const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .eq('name', 'San Francisco')
    return cities
  ${errorJs}
`.trim()

export const storedNeqJs = `
${importJs}
const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .neq('name', 'Lagos')
    return cities
  ${errorJs}
`.trim()

export const storedGtJs = `
${importJs}
const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .gt('country_id', 250)
    return cities
  ${errorJs}
`.trim()

export const storedLtJs = `
${importJs}
const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .lt('country_id', 250)
    return cities
  ${errorJs}
`.trim()

export const storedGteJs = `
${importJs}
const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .gte('country_id', 250)
    return cities
  ${errorJs}
`.trim()

export const storedLteJs = `
${importJs}
const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .lte('country_id', 250)
    return cities
  ${errorJs}
`.trim()

export const storedLikeJs = `
${importJs}
const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .like('name', '%la%')
    return cities
  ${errorJs}
`.trim()

export const storedIlikeJs = `
${importJs}
const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .ilike('name', '%la%')
    return cities
  ${errorJs}
`.trim()

export const storedIsJs = `
${importJs}
const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .is('name', null)
    return cities
  ${errorJs}
`.trim()

export const storedInJs = `
${importJs}
const echoCities = async () => {
  try {
    let cities = await supabase
      .rpc('echo_all_cities')
      .in('name', ['Rio de Janeiro', 'San Francisco'])
    return cities
  ${errorJs}
`.trim()

export const storedCsJs = `
${importJs}
const echoCountries = async () => {
  try {
    let countries = await supabase
      .rpc('echo_all_countries')
      .cs('main_exports', ['oil'])
    return countries
  ${errorJs}
`.trim()

export const storedCdJs = `
${importJs}
const echoCountries = async () => {
  try {
    let countries = await supabase
      .rpc('echo_all_countries')
      .cd('main_exports', ['cars', 'food', 'machine'])
    return countries
  ${errorJs}
`.trim()

export const storedOvaJs = `
${importJs}
const echoCountries = async () => {
  try {
    let countries = await supabase
      .rpc('echo_all_countries')
      .ova('main_exports', ['computers', 'minerals'])
    return countries
  ${errorJs}
`.trim()

export const storedOvrJs = `
${importJs}
const echoCountries = async () => {
  try {
    let countries = await supabase
      .rpc('echo_all_countries')
      .ovr('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const storedSlJs = `
${importJs}
const echoCountries = async () => {
  try {
    let countries = await supabase
      .rpc('echo_all_countries')
      .sl('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const storedSrJs = `
${importJs}
const echoCountries = async () => {
  try {
    let countries = await supabase
      .rpc('echo_all_countries')
      .sr('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const storedNxlJs = `
${importJs}
const echoCountries = async () => {
  try {
    let countries = await supabase
      .rpc('echo_all_countries')
      .nxl('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const storedNxrJs = `
${importJs}
const echoCountries = async () => {
  try {
    let countries = await supabase
      .rpc('echo_all_countries')
      .nxr('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const storedAdjJs = `
${importJs}
const echoCountries = async () => {
  try {
    let countries = await supabase
      .rpc('echo_all_countries')
      .adj('population_range_millions', [70, 185])
    return countries
  ${errorJs}
`.trim()
