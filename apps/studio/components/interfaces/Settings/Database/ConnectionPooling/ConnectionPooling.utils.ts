// [Joshen] This is to the best of interpreting the syntax from the API response
// // There's different format for PG13 (depending on authentication method being md5) and PG14
export const constructConnStringSyntax = (
  connString: string,
  {
    ref,
    cloudProvider,
    region,
    tld,
    portNumber,
  }: { ref: string; cloudProvider: string; region: string; tld: string; portNumber: string }
) => {
  if (connString.includes('postgres:[YOUR-PASSWORD]')) {
    // PG 13 + Authentication MD5
    return [
      { value: 'postgres://', tooltip: undefined },
      { value: '[user]', tooltip: 'Database user (e.g postgres)' },
      { value: ':', tooltip: undefined },
      { value: '[password]', tooltip: 'Database password' },
      { value: '@', tooltip: undefined },
      { value: cloudProvider.toLocaleLowerCase(), tooltip: 'Cloud provider' },
      { value: '-0-', tooltip: undefined },
      { value: region, tooltip: "Project's region" },
      { value: `.pooler.supabase.${tld}:`, tooltip: undefined },
      { value: portNumber, tooltip: 'Port number (Use 5432 if using prepared statements)' },
      { value: '/', tooltip: undefined },
      { value: '[db-name]', tooltip: 'Database name (e.g postgres)' },
      { value: `?options=reference%3D`, tooltip: undefined },
      { value: ref, tooltip: "Project's reference ID" },
    ]
  } else {
    return [
      { value: 'postgres://', tooltip: undefined },
      { value: '[user]', tooltip: 'Database user (e.g postgres)' },
      { value: '.', tooltip: undefined },
      { value: ref, tooltip: "Project's reference ID" },
      { value: ':', tooltip: undefined },
      { value: '[password]', tooltip: 'Database password' },
      { value: '@', tooltip: undefined },
      { value: cloudProvider.toLocaleLowerCase(), tooltip: 'Cloud provider' },
      { value: '-0-', tooltip: undefined },
      { value: region, tooltip: "Project's region" },
      { value: `.pooler.supabase.${tld}:`, tooltip: undefined },
      { value: portNumber, tooltip: 'Port number (Use 5432 if using prepared statements)' },
      { value: '/', tooltip: undefined },
      { value: '[db-name]', tooltip: 'Database name (e.g postgres)' },
    ]
  }
}

export const getPoolerTld = (connString: string) => {
  try {
    const segment = connString.split('pooler.supabase.')[1]
    const tld = segment.split(':6543')[0]
    return tld
  } catch {
    return 'com'
  }
}
