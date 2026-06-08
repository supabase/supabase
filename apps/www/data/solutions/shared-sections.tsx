/**
 * Shared sections reused from postgres-developers across app-type solution pages
 * (B2B SaaS, FinServ, Healthcare, Agents)
 */
import getPostgresDevelopersContent from './postgres-developers'

export const getSharedSections = () => {
  const pg = getPostgresDevelopersContent()
  return {
    platform: pg.platform,
    developerExperience: pg.developerExperience,
    resultsSection: pg.resultsSection,
    featureGrid: pg.featureGrid,
  }
}
