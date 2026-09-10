import { EventHost } from './eventsTypes'

/**
 * Formats hosts array for display
 * If there are more than 2 hosts, shows "FirstHost and X more"
 *
 * @param hosts - Array of event hosts
 * @returns Object with displayText and fullList (for title attribute)
 *
 * @example
 * formatHosts([host1]) => { displayText: "Supabase", fullList: "Supabase" }
 * formatHosts([host1, host2]) => { displayText: "Supabase and GitHub", fullList: "Supabase, GitHub" }
 * formatHosts([host1, host2, host3]) => { displayText: "Supabase and 2 more", fullList: "Supabase, GitHub, Vercel" }
 */
export function formatHosts(hosts: EventHost[]): {
  displayText: string
  fullList: string
} {
  if (!hosts || hosts.length === 0) {
    return {
      displayText: '',
      fullList: '',
    }
  }

  // Get host names, preferring 'name' over constructed name from first/last
  const hostNames = hosts.map((host) => {
    if (host.name) return host.name
    if (host.first_name && host.last_name) {
      return `${host.first_name} ${host.last_name}`
    }
    if (host.first_name) return host.first_name
    return 'Unknown Host'
  })

  // Full list for title attribute (comma-separated)
  const fullList = hostNames.join(', ')

  // Display text logic
  let displayText: string

  if (hostNames.length === 1) {
    displayText = hostNames[0]
  } else if (hostNames.length === 2) {
    displayText = `${hostNames[0]} and ${hostNames[1]}`
  } else {
    const remaining = hostNames.length - 1
    displayText = `${hostNames[0]} and ${remaining} more`
  }

  return {
    displayText,
    fullList,
  }
}
