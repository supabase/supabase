// [Joshen] Should tally with https://github.com/supabase/cli/blob/63790a1bd43bee06f82c4f510e709925526a4daa/internal/utils/api.go#L98
export const verifyCNAME = async (domain: string): Promise<boolean> => {
  const res = await fetch(`https://1.1.1.1/dns-query?name=${domain}&type=CNAME`, {
    method: 'GET',
    headers: { accept: 'application/dns-json' },
  })
  const verification = await res.json()
  return verification.Status === 0
}
