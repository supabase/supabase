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
      .update({ name: 'Mordor' })
      .filter('name', 'eq', 'Paris')
    return cities
  ${errorJs}
`.trim()

export const patchNotJs = `
${importJs}
const updateCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .update({ name: 'Mordor' })
      .not('name', 'eq', 'Paris')
    return cities
  ${errorJs}
`.trim()

export const patchMatchJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .update({ name: 'Mordor' })
      .match({name: 'Beijing', country_id: 156})
    return cities
  ${errorJs}
`.trim()

export const patchEqJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .update({ name: 'Mordor' })
      .eq('name', 'San Francisco')
    return cities
  ${errorJs}
`.trim()

export const patchNeqJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .update({ name: 'Mordor' })
      .neq('name', 'Lagos')
    return cities
  ${errorJs}
`.trim()

export const patchGtJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .update({ name: 'Mordor' })
      .gt('country_id', 250)
    return cities
  ${errorJs}
`.trim()

export const patchLtJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .update({ name: 'Mordor' })
      .lt('country_id', 250)
    return cities
  ${errorJs}
`.trim()

export const patchGteJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .update({ name: 'Mordor' })
      .gte('country_id', 250)
    return cities
  ${errorJs}
`.trim()

export const patchLteJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .update({ name: 'Mordor' })
      .lte('country_id', 250)
    return cities
  ${errorJs}
`.trim()

export const patchLikeJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .update({ name: 'Mordor' })
      .like('name', '%la%')
    return cities
  ${errorJs}
}
`.trim()

export const patchIlikeJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .update({ name: 'Mordor' })
      .ilike('name', '%la%')
    return cities
  ${errorJs}
`.trim()

export const patchIsJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .update({ name: 'Mordor' })
      .is('name', null)
    return cities
  ${errorJs}
`.trim()

export const patchInJs = `
${importJs}
const updateCityName = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .update({ name: 'Mordor' })
      .in('name', ['Rio de Janeiro', 'San Francisco'])
    return cities
  ${errorJs}
`.trim()

export const patchCsJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .update({ name: 'Mordor' })
      .cs('main_exports', ['oil'])
    return countries
  ${errorJs}
`.trim()

export const patchCdJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .update({ name: 'Mordor' })
      .cd('main_exports', ['cars', 'food', 'machine'])
    return countries
  ${errorJs}
`.trim()

export const patchOvaJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .update({ name: 'Mordor' })
      .ova('main_exports', ['computers', 'minerals'])
    return countries
  ${errorJs}
`.trim()

export const patchOvrJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .update({ name: 'Mordor' })
      .ovr('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const patchSlJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .update({ name: 'Mordor' })
      .sl('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const patchSrJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .update({ name: 'Mordor' })
      .sr('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const patchNxlJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .update({ name: 'Mordor' })
      .nxl('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const patchNxrJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .update({ name: 'Mordor' })
      .nxr('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const patchAdjJs = `
${importJs}
const updateCountryName = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .update({ name: 'Mordor' })
      .adj('population_range_millions', [70, 185])
    return countries
  ${errorJs}
`.trim()
