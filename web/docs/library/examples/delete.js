import {importJs, errorJs} from './common'

/**
 * delete.mdx examples
 */

export const deleteRecordJs = `
${importJs}
const deleteCity = async () => {
  try {
    let values = await supabase
      .from('cities')
      .match({ id: 666 })
      .delete()

    return values
  ${errorJs}
`.trim()

export const deleteFilterJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .filter({'name', 'eq', 'Paris'})
      .delete()
    return cities
  ${errorJs}
`.trim()

export const deleteNotJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .not('name', 'eq', 'Paris')
      .delete()
    return cities
  ${errorJs}
`.trim()

export const deleteMatchJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .match({name: 'Beijing', country_id: 156})
      .delete()
    return cities
  ${errorJs}
`.trim()

export const deleteEqJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .eq('name', 'San Francisco')
      .delete()
    return cities
  ${errorJs}
`.trim()

export const deleteNeqJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .neq('name', 'Lagos')
      .delete()
    return cities
  ${errorJs}
`.trim()

export const deleteGtJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .gt('country_id', 250)
      .delete()
    return cities
  ${errorJs}
`.trim()

export const deleteLtJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .lt('country_id', 250)
      .delete()
    return cities
  ${errorJs}
`.trim()

export const deleteGteJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .gte('country_id', 250)
      .delete()
    return cities
  ${errorJs}
`.trim()

export const deleteLteJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .lte('country_id', 250)
      .delete()
    return cities
  ${errorJs}
`.trim()

export const deleteLikeJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .like('name', '%la%')
      .delete()
    return cities
  ${errorJs}
`.trim()

export const deleteIlikeJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .ilike('name', '%la%')
      .delete()
    return cities
  ${errorJs}
`.trim()

export const deleteIsJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .is('name', null)
      .delete()
    return cities
  ${errorJs}
`.trim()

export const deleteInJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .in('name', ['Rio de Janeiro', 'San Francisco'])
      .delete()
    return cities
  ${errorJs}
`.trim()

export const deleteCsJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .cs('main_exports', ['oil'])
      delete()
    return countries
  ${errorJs}
`.trim()

export const deleteCdJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .cd('main_exports', ['cars', 'food', 'machine'])
      .delete()
    return countries
  ${errorJs}
`.trim()

export const deleteOvaJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .ova('main_exports', ['computers', 'minerals'])
      .delete()
    return countries
  ${errorJs}
`.trim()

export const deleteOvrJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .ovr('population_range_millions', [150, 250])
      .delete()
    return countries
  ${errorJs}
`.trim()

export const deleteSlJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .sl('population_range_millions', [150, 250])
      .delete()
    return countries
  ${errorJs}
`.trim()

export const deleteSrJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .sr('population_range_millions', [150, 250])
      .delete()
    return countries
  ${errorJs}
`.trim()

export const deleteNxlJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .nxl('population_range_millions', [150, 250])
      .delete()
    return countries
  ${errorJs}
`.trim()

export const deleteNxrJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .nxr('population_range_millions', [150, 250])
      .delete()
    return countries
  ${errorJs}
`.trim()

export const deleteAdjJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .adj('population_range_millions', [70, 185])
      .delete()
    return countries
  ${errorJs}
`.trim()
