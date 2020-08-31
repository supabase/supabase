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
      .delete()
      .match({ id: 666 })
    return values
  ${errorJs}
`.trim()

export const deleteFilterJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .delete()
      .filter({'name', 'eq', 'Paris'})
    return cities
  ${errorJs}
`.trim()

export const deleteNotJs = `
${importJs}
const getCities = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .delete()
      .not('name', 'eq', 'Paris')
    return cities
  ${errorJs}
`.trim()

export const deleteMatchJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .delete()
      .match({name: 'Beijing', country_id: 156})
    return cities
  ${errorJs}
`.trim()

export const deleteEqJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .delete()
      .eq('name', 'San Francisco')
    return cities
  ${errorJs}
`.trim()

export const deleteNeqJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .delete()
      .neq('name', 'Lagos')
    return cities
  ${errorJs}
`.trim()

export const deleteGtJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .delete()
      .gt('country_id', 250)
    return cities
  ${errorJs}
`.trim()

export const deleteLtJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .delete()
      .lt('country_id', 250)
    return cities
  ${errorJs}
`.trim()

export const deleteGteJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .delete()
      .gte('country_id', 250)
    return cities
  ${errorJs}
`.trim()

export const deleteLteJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .delete()
      .lte('country_id', 250)
    return cities
  ${errorJs}
`.trim()

export const deleteLikeJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .delete()
      .like('name', '%la%')
    return cities
  ${errorJs}
`.trim()

export const deleteIlikeJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .delete()
      .ilike('name', '%la%')
    return cities
  ${errorJs}
`.trim()

export const deleteIsJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .delete()
      .is('name', null)
    return cities
  ${errorJs}
`.trim()

export const deleteInJs = `
${importJs}
const deleteCity = async () => {
  try {
    let cities = await supabase
      .from('cities')
      .delete()
      .in('name', ['Rio de Janeiro', 'San Francisco'])
    return cities
  ${errorJs}
`.trim()

export const deleteCsJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .delete()
      .cs('main_exports', ['oil'])
    return countries
  ${errorJs}
`.trim()

export const deleteCdJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .delete()
      .cd('main_exports', ['cars', 'food', 'machine'])
    return countries
  ${errorJs}
`.trim()

export const deleteOvaJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .delete()
      .ova('main_exports', ['computers', 'minerals'])
    return countries
  ${errorJs}
`.trim()

export const deleteOvrJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .delete()
      .ovr('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const deleteSlJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .delete()
      .sl('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const deleteSrJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .delete()
      .sr('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const deleteNxlJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .delete()
      .nxl('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const deleteNxrJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .delete()
      .nxr('population_range_millions', [150, 250])
    return countries
  ${errorJs}
`.trim()

export const deleteAdjJs = `
${importJs}
const deleteCountry = async () => {
  try {
    let countries = await supabase
      .from('countries')
      .delete()
      .adj('population_range_millions', [70, 185])
    return countries
  ${errorJs}
`.trim()
