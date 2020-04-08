import {importJs, errorJs} from './common'

/**
 * patch.mdx examples
 */

export const patchRecordJs = `
${importJs}
const updateCityName = async () => {
  try {
    let updates = await supabase
      .from('cities')
      .update({ name: 'Middle Earth' })
      .match({ name: 'Auckland' })

    return updates
  ${errorJs}
`.trim()

export const patchFilterJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .filter('name', 'eq', 'Paris')
      .update({ name: 'Mordor' })
    return cities
  ${errorJs}
`.trim()

export const patchNotJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .not('name', 'eq', 'Paris')
      .update({ name: 'Mordor' })
    return cities
  ${errorJs}
`.trim()

export const patchMatchJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .match({name: 'Beijing', country_id: 156})
      .update({ name: 'Mordor' })
    return cities
  ${errorJs}
`.trim()

export const patchEqJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .eq('name', 'San Francisco')
      .update({ name: 'Mordor' })
    return cities
  ${errorJs}
`.trim()

export const patchNeqJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .neq('name', 'Lagos')
      .update({ name: 'Mordor' })
    return cities
  ${errorJs}
`.trim()

export const patchGtJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .gt('country_id', 250)
      .update({ name: 'Mordor' })
    return cities
  ${errorJs}
`.trim()

export const patchLtJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .lt('country_id', 250)
      .update({ name: 'Mordor' })
    return cities
  ${errorJs}
`.trim()

export const patchGteJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .gte('country_id', 250)
      .update({ name: 'Mordor' })
    return cities
  ${errorJs}
`.trim()

export const patchLteJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .lte('country_id', 250)
      .update({ name: 'Mordor' })
    return cities
  ${errorJs}
`.trim()

export const patchLikeJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .like('name', '%la%')
      .update({ name: 'Mordor' })
    return cities
  } catch (error) {
    console.log('Error: ', error)
  }
}
`.trim()

export const patchIlikeJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .ilike('name', '%la%')
      .update({ name: 'Mordor' })
    return cities
  ${errorJs}
`.trim()

export const patchIsJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .is('name', null)
      .update({ name: 'Mordor' })
    return cities
  ${errorJs}
`.trim()

export const patchInJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .in('name', ['Rio de Janeiro', 'San Francisco'])
      .update({ name: 'Mordor' })
    return cities
  ${errorJs}
`.trim()

export const patchCsJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .cs('main_exports', ['oil'])
      update({ name: 'Mordor' })
    return countries
  ${errorJs}
`.trim()

export const patchCdJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .cd('main_exports', ['cars', 'food', 'machine'])
      .update({ name: 'Mordor' })
    return countries
  ${errorJs}
`.trim()

export const patchOvaJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .ova('main_exports', ['computers', 'minerals'])
      .update({ name: 'Mordor' })
    return countries
  ${errorJs}
`.trim()

export const patchOvrJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .ovr('population_range_millions', [150, 250])
      .update({ name: 'Mordor' })
    return countries
  ${errorJs}
`.trim()

export const patchSlJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .sl('population_range_millions', [150, 250])
      .update({ name: 'Mordor' })
    return countries
  ${errorJs}
`.trim()

export const patchSrJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .sr('population_range_millions', [150, 250])
      .update({ name: 'Mordor' })
    return countries
  ${errorJs}
`.trim()

export const patchNxlJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .nxl('population_range_millions', [150, 250])
      .update({ name: 'Mordor' })
    return countries
  ${errorJs}
`.trim()

export const patchNxrJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .nxr('population_range_millions', [150, 250])
      .update({ name: 'Mordor' })
    return countries
  ${errorJs}
`.trim()

export const patchAdjJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .adj('population_range_millions', [70, 185])
      .update({ name: 'Mordor' })
    return countries
  ${errorJs}
`.trim()
